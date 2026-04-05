const { Contact, Task, Setting } = require('../models');
const crypto = require('crypto');

// ── Incoming webhook from external tools (N8N, Zapier, forms) ─────────────────

exports.incomingLead = async (req, res) => {
  try {
    const secret = await Setting.findOne({ where: { key: 'webhook_secret' } });

    if (secret?.value) {
      const sig = req.headers['x-webhook-signature'] || req.headers['x-hub-signature-256'];
      if (sig) {
        const expected = 'sha256=' + crypto
          .createHmac('sha256', secret.value)
          .update(JSON.stringify(req.body))
          .digest('hex');
        if (sig !== expected) {
          return res.status(401).json({ error: 'Firma invalida' });
        }
      }
    }

    const { name, phone, email, source, notes, pipeline_stage } = req.body;
    if (!name && !phone) return res.status(400).json({ error: 'Se requiere nombre o telefono' });

    let contact = phone
      ? await Contact.findOne({ where: { phone: phone.replace(/\D/g, '') } })
      : null;

    if (!contact) {
      contact = await Contact.create({
        name: name || phone,
        phone: phone ? phone.replace(/\D/g, '') : null,
        email: email || null,
        status: 'lead',
        pipeline_stage: pipeline_stage || 'new_lead',
        notes: notes || `Lead desde webhook - ${source || 'externo'}`,
        source: source || 'webhook'
      });
    }

    // Trigger N8N outgoing if configured
    triggerN8N('lead_created', { contact: contact.toJSON() });

    res.status(201).json({ ok: true, contact_id: contact.id, name: contact.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── N8N trigger: call N8N webhook when CRM events happen ─────────────────────

const triggerN8N = async (event, data) => {
  try {
    const setting = await Setting.findOne({ where: { key: 'n8n_webhook_url', connected: true } });
    if (!setting?.value) return;

    const fetch = require('node-fetch');
    await fetch(setting.value, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, timestamp: new Date().toISOString(), data }),
      signal: AbortSignal.timeout(5000)
    });
  } catch (e) {
    console.log('[Webhook] N8N trigger failed:', e.message);
  }
};

exports.triggerN8N = triggerN8N;

// ── Test webhook ──────────────────────────────────────────────────────────────
exports.test = async (req, res) => {
  await triggerN8N('test', { message: 'Webhook de prueba desde Influence CRM', ts: new Date() });
  res.json({ ok: true, message: 'Evento de prueba enviado a N8N' });
};
