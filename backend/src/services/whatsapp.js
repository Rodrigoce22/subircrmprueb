const {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const SESSION_DIR = path.join(__dirname, '../../.wa_sessions');
if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

let sock = null;
let io = null;
let qrBase64 = null;
let waStatus = 'disconnected';
let myJid = null;

const log = (...args) => console.log('[WA]', ...args);
const err = (...args) => console.error('[WA ERROR]', ...args);

// ─── Estado ───────────────────────────────────────────────────────────────────

const getStatus = () => ({ status: waStatus, qr: qrBase64, phone: myJid });

const setState = (s, qr = null) => {
  waStatus = s;
  qrBase64 = qr;
  if (io) io.emit('wa:status', getStatus());
  log('Estado:', s, myJid || '');
};

const setSocketIO = (s) => { io = s; };

// ─── Extraer texto ────────────────────────────────────────────────────────────

const extractBody = (msg) => {
  const m = msg?.message;
  if (!m) return null;
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    m.documentMessage?.caption ||
    m.buttonsResponseMessage?.selectedDisplayText ||
    m.listResponseMessage?.title ||
    m.templateButtonReplyMessage?.selectedDisplayText ||
    null
  );
};

const extractType = (msg) => {
  const m = msg?.message;
  if (!m) return 'text';
  const key = Object.keys(m).find(k =>
    k !== 'messageContextInfo' && k !== 'senderKeyDistributionMessage'
  );
  const map = {
    conversation: 'text', extendedTextMessage: 'text',
    imageMessage: 'image', audioMessage: 'audio',
    videoMessage: 'video', documentMessage: 'document',
    stickerMessage: 'sticker', locationMessage: 'location',
    contactMessage: 'contact'
  };
  return map[key] || 'text';
};

// ─── AI Auto-Reply ────────────────────────────────────────────────────────────

const getAIReply = async (message, systemPrompt) => {
  try {
    const { Setting } = require('../models');
    const apiKeySetting = await Setting.findOne({ where: { key: 'openai_api_key', connected: true } });
    const baseSetting   = await Setting.findOne({ where: { key: 'openai_base_url' } });

    if (!apiKeySetting?.value) return null;

    const baseURL = baseSetting?.value || 'https://api.openai.com/v1';
    const modelSetting = await Setting.findOne({ where: { key: 'openai_model' } });
    const model = modelSetting?.value || 'gpt-3.5-turbo';

    const fetch = require('node-fetch');
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKeySetting.value}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt || 'Eres un asistente de ventas amigable y profesional. Responde de forma concisa en el mismo idioma del usuario.' },
          { role: 'user', content: message }
        ],
        max_tokens: 300,
        temperature: 0.7
      }),
      signal: AbortSignal.timeout(10000)
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) {
    log('AI reply error:', e.message);
    return null;
  }
};

// ─── Auto-reply matching ──────────────────────────────────────────────────────

const processAutoReplies = async (contact, body, isFirstMessage) => {
  try {
    const { AutoReply } = require('../models');
    const rules = await AutoReply.findAll({ where: { active: true }, order: [['createdAt', 'ASC']] });

    for (const rule of rules) {
      let matches = false;

      if (rule.trigger_type === 'always') matches = true;
      else if (rule.trigger_type === 'first_message' && isFirstMessage) matches = true;
      else if (rule.trigger_type === 'keyword' && rule.keyword) {
        matches = body.toLowerCase().includes(rule.keyword.toLowerCase());
      }

      if (!matches) continue;

      let response = rule.response;

      if (rule.use_ai && rule.ai_prompt) {
        const aiReply = await getAIReply(body, rule.ai_prompt);
        if (aiReply) response = aiReply;
      }

      if (response && sock && waStatus === 'connected') {
        const jid = contact.wa_jid || `${contact.phone}@s.whatsapp.net`;
        await sock.sendMessage(jid, { text: response });

        const { Message } = require('../models');
        await Message.create({
          contact_id: contact.id,
          from_jid: myJid || 'me',
          to_jid: jid,
          body: response,
          type: 'text',
          direction: 'outbound',
          status: 'sent',
          timestamp_wa: Math.floor(Date.now() / 1000)
        });

        await rule.increment('match_count');
        log(`Auto-reply enviada a ${contact.name}: "${response.substring(0, 50)}"`);
        break; // Only first matching rule
      }
    }
  } catch (e) {
    log('Auto-reply error:', e.message);
  }
};

// ─── N8N trigger ─────────────────────────────────────────────────────────────

const triggerN8N = async (event, data) => {
  try {
    const { Setting } = require('../models');
    const setting = await Setting.findOne({ where: { key: 'n8n_webhook_url', connected: true } });
    if (!setting?.value) return;

    const fetch = require('node-fetch');
    await fetch(setting.value, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, timestamp: new Date().toISOString(), data }),
      signal: AbortSignal.timeout(5000)
    });
    log('N8N trigger enviado:', event);
  } catch (e) {
    log('N8N trigger fallido:', e.message);
  }
};

// ─── Procesar mensaje entrante ────────────────────────────────────────────────

const processIncoming = async (msg) => {
  const { Contact, Message } = require('../models');

  try {
    const jid = msg.key?.remoteJid;
    if (!jid || jid.endsWith('@g.us') || jid.endsWith('@broadcast')) return;

    const body  = extractBody(msg) || '[Media]';
    const type  = extractType(msg);
    const phone = jid.replace('@s.whatsapp.net', '');
    const name  = msg.pushName || phone;

    log(`Mensaje de ${name} (${phone}): "${body.substring(0, 60)}"`);

    // ── Buscar o crear contacto ──
    let isNew = false;
    let contact = await Contact.findOne({ where: { wa_jid: jid } });

    if (!contact) {
      contact = await Contact.findOne({ where: { phone } });
      if (contact) {
        await contact.update({ wa_jid: jid });
        log('Contacto existente vinculado a JID:', contact.name);
      } else {
        contact = await Contact.create({
          name,
          phone,
          wa_jid: jid,
          status: 'lead',
          pipeline_stage: 'new_lead',
          created_by: null
        });
        isNew = true;
        log('Nuevo lead creado:', contact.name, contact.id);
      }
    }

    // ── Evitar duplicados ──
    if (msg.key.id) {
      const exists = await Message.findOne({ where: { wa_message_id: msg.key.id } });
      if (exists) { log('Mensaje duplicado ignorado:', msg.key.id); return; }
    }

    // ── Guardar mensaje ──
    const ts = msg.messageTimestamp;
    const saved = await Message.create({
      wa_message_id: msg.key.id || null,
      contact_id: contact.id,
      from_jid: jid,
      to_jid: myJid || 'me',
      body,
      type,
      direction: 'inbound',
      status: 'delivered',
      timestamp_wa: typeof ts === 'number' ? ts : ts?.low || Math.floor(Date.now() / 1000)
    });

    log('Mensaje guardado en BD, id:', saved.id);

    // ── Emitir a frontend ──
    if (io) {
      const payload = {
        ...saved.toJSON(),
        contact: {
          id: contact.id,
          name: contact.name,
          phone: contact.phone,
          wa_jid: contact.wa_jid
        }
      };
      io.emit('wa:new_message', payload);
      log('Evento wa:new_message emitido');

      if (isNew) {
        const leadPayload = {
          id: contact.id,
          name: contact.name,
          phone: contact.phone,
          wa_jid: contact.wa_jid,
          pipeline_stage: 'new_lead',
          firstMessage: body,
          createdAt: contact.createdAt
        };
        io.emit('wa:new_lead', leadPayload);
        log('Evento wa:new_lead emitido');

        // Trigger N8N for new lead
        triggerN8N('new_lead', leadPayload);
      } else {
        // Trigger N8N for new message
        triggerN8N('new_message', {
          contact: { id: contact.id, name: contact.name, phone: contact.phone },
          message: body,
          type
        });
      }
    }

    // ── Auto-reply ──
    const messageCount = await Message.count({
      where: { contact_id: contact.id, direction: 'inbound' }
    });
    const isFirstMessage = messageCount === 1;

    await processAutoReplies(contact, body, isFirstMessage);

  } catch (e) {
    err('processIncoming:', e.message);
    err(e.stack);
  }
};

// ─── Conexion ─────────────────────────────────────────────────────────────────

const connect = async () => {
  if (sock && waStatus === 'connected') {
    log('Ya conectado, ignorando connect()');
    return;
  }

  setState('connecting');
  log('Iniciando conexion Baileys...');

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

  let version = [2, 3000, 1015901307];
  try {
    const r = await fetchLatestBaileysVersion();
    version = r.version;
    log('Version WA:', version.join('.'));
  } catch (e) {
    log('No se pudo obtener version WA, usando fallback:', version.join('.'));
  }

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
    browser: ['Influence CRM', 'Chrome', '124.0'],
    syncFullHistory: false,
    generateHighQualityLinkPreview: false,
    getMessage: async (key) => {
      log('getMessage llamado para key:', key.id);
      return { conversation: '' };
    }
  });

  // ── connection.update ──
  sock.ev.on('connection.update', async (update) => {
    log('connection.update:', JSON.stringify(update).substring(0, 200));
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      log('QR recibido, generando imagen...');
      try {
        const img = await QRCode.toDataURL(qr);
        setState('qr', img);
        log('QR listo, longitud imagen:', img.length);
      } catch (e) {
        err('Error generando QR:', e.message);
      }
    }

    if (connection === 'open') {
      myJid = sock.user?.id || sock.user?.jid || null;
      log('CONECTADO! JID:', myJid);
      setState('connected');
    }

    if (connection === 'close') {
      const code = lastDisconnect?.error?.output?.statusCode;
      log('Conexion cerrada, codigo:', code);
      sock = null;
      myJid = null;
      setState('disconnected');

      if (code === DisconnectReason.loggedOut) {
        log('Logout detectado, limpiando sesion...');
        clearSession();
      } else {
        log('Reconectando en 5 segundos...');
        setTimeout(connect, 5000);
      }
    }
  });

  // ── Credenciales ──
  sock.ev.on('creds.update', saveCreds);

  // ── Mensajes entrantes ──
  sock.ev.on('messages.upsert', async (upsert) => {
    log(`messages.upsert tipo="${upsert.type}", cantidad=${upsert.messages?.length}`);

    for (const msg of upsert.messages) {
      log('Mensaje recibido - fromMe:', msg.key?.fromMe, 'jid:', msg.key?.remoteJid);
      if (!msg.key.fromMe) {
        await processIncoming(msg);
      }
    }
  });

  // ── Actualizacion de estado ──
  sock.ev.on('messages.update', async (updates) => {
    const { Message } = require('../models');
    for (const { key, update } of updates) {
      if (!update.status || !key.id) continue;
      const statusMap = { 1: 'sent', 2: 'delivered', 3: 'read', 4: 'read' };
      const newStatus = statusMap[update.status];
      if (newStatus) {
        await Message.update({ status: newStatus }, { where: { wa_message_id: key.id } });
        if (io) io.emit('wa:message_status', { wa_message_id: key.id, status: newStatus });
      }
    }
  });

  log('Socket Baileys inicializado, esperando eventos...');
};

// ─── Enviar mensaje ───────────────────────────────────────────────────────────

const sendMessage = async (jid, text, contactId = null) => {
  if (!sock || waStatus !== 'connected') {
    throw new Error('WhatsApp no esta conectado');
  }

  const { Contact, Message } = require('../models');
  const formattedJid = jid.includes('@') ? jid : `${jid}@s.whatsapp.net`;

  log('Enviando mensaje a:', formattedJid);
  const result = await sock.sendMessage(formattedJid, { text });
  log('Mensaje enviado, id:', result.key.id);

  let contact = contactId
    ? await Contact.findByPk(contactId)
    : await Contact.findOne({ where: { wa_jid: formattedJid } });

  const saved = await Message.create({
    wa_message_id: result.key.id,
    contact_id: contact?.id || null,
    from_jid: myJid || 'me',
    to_jid: formattedJid,
    body: text,
    type: 'text',
    direction: 'outbound',
    status: 'sent',
    timestamp_wa: Math.floor(Date.now() / 1000)
  });

  if (io) {
    io.emit('wa:new_message', {
      ...saved.toJSON(),
      contact: contact ? {
        id: contact.id, name: contact.name,
        phone: contact.phone, wa_jid: contact.wa_jid
      } : null
    });
  }

  return result;
};

// ─── Enviar broadcast ─────────────────────────────────────────────────────────

const sendBroadcast = async (jids, text) => {
  if (!sock || waStatus !== 'connected') throw new Error('WhatsApp no esta conectado');

  const results = [];
  for (const jid of jids) {
    try {
      const formattedJid = jid.includes('@') ? jid : `${jid}@s.whatsapp.net`;
      const result = await sock.sendMessage(formattedJid, { text });
      results.push({ jid: formattedJid, ok: true, id: result.key.id });
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      results.push({ jid, ok: false, error: e.message });
    }
  }
  return results;
};

// ─── Desconectar / Limpiar ────────────────────────────────────────────────────

const clearSession = () => {
  try {
    fs.rmSync(SESSION_DIR, { recursive: true, force: true });
    fs.mkdirSync(SESSION_DIR, { recursive: true });
    log('Sesion limpiada');
  } catch (e) {
    err('Error limpiando sesion:', e.message);
  }
};

const disconnect = async () => {
  if (sock) {
    try { await sock.logout(); } catch { try { sock.end(); } catch {} }
    sock = null;
  }
  myJid = null;
  clearSession();
  setState('disconnected');
  log('Desconectado manualmente');
};

// ─── Enviar audio ─────────────────────────────────────────────────────────────

const sendAudio = async (jid, filePath, mimetype = 'audio/ogg; codecs=opus', contactId = null) => {
  if (!sock || waStatus !== 'connected') throw new Error('WhatsApp no esta conectado');

  const { Contact, Message } = require('../models');
  const formattedJid = jid.includes('@') ? jid : `${jid}@s.whatsapp.net`;

  log('Enviando audio a:', formattedJid);
  const result = await sock.sendMessage(formattedJid, {
    audio: { url: filePath },
    mimetype: mimetype.includes('ogg') ? 'audio/ogg; codecs=opus' : mimetype,
    ptt: true
  });
  log('Audio enviado, id:', result.key.id);

  let contact = contactId
    ? await Contact.findByPk(contactId)
    : await Contact.findOne({ where: { wa_jid: formattedJid } });

  const saved = await Message.create({
    wa_message_id: result.key.id,
    contact_id: contact?.id || null,
    from_jid: myJid || 'me',
    to_jid: formattedJid,
    body: '[Audio]',
    type: 'audio',
    direction: 'outbound',
    status: 'sent',
    timestamp_wa: Math.floor(Date.now() / 1000)
  });

  if (io) {
    io.emit('wa:new_message', {
      ...saved.toJSON(),
      contact: contact ? { id: contact.id, name: contact.name, phone: contact.phone, wa_jid: contact.wa_jid } : null
    });
  }

  return result;
};

module.exports = { connect, disconnect, sendMessage, sendAudio, sendBroadcast, getStatus, setSocketIO };
