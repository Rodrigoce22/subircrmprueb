const wa = require('../services/whatsapp');
const { Message, Contact } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs   = require('fs');
const multer = require('multer');

// ── Multer setup for audio/file uploads ───────────────────────────────────────
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename:    (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.ogg';
    cb(null, `wa_audio_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 16 * 1024 * 1024 }, // 16 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/webm', 'audio/wav', 'audio/aac'];
    cb(null, allowed.includes(file.mimetype) || file.mimetype.startsWith('audio/'));
  }
});

exports.audioUpload = upload.single('audio');

// ── Controllers ───────────────────────────────────────────────────────────────

exports.status = (req, res) => res.json(wa.getStatus());

exports.connect = async (req, res) => {
  try {
    wa.connect();
    res.json({ message: 'Iniciando conexion WhatsApp...' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.disconnect = async (req, res) => {
  try {
    await wa.disconnect();
    res.json({ message: 'Desconectado y sesion eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { jid, text, contact_id } = req.body;
    if (!jid || !text) return res.status(400).json({ error: 'jid y text son requeridos' });
    await wa.sendMessage(jid, text, contact_id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.sendAudio = async (req, res) => {
  try {
    const { jid, contact_id } = req.body;
    if (!jid)       return res.status(400).json({ error: 'jid es requerido' });
    if (!req.file)  return res.status(400).json({ error: 'audio es requerido' });

    await wa.sendAudio(jid, req.file.path, req.file.mimetype, contact_id);

    // Clean up temp file
    fs.unlink(req.file.path, () => {});
    res.json({ ok: true });
  } catch (err) {
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(500).json({ error: err.message });
  }
};

exports.getChats = async (req, res) => {
  try {
    const messages = await Message.findAll({
      include: [{ model: Contact, as: 'contact', attributes: ['id', 'name', 'phone', 'wa_jid'] }],
      order: [['createdAt', 'DESC']],
      limit: 500
    });

    const map = {};
    for (const msg of messages) {
      const jid = msg.direction === 'inbound' ? msg.from_jid : msg.to_jid;
      if (!jid || jid === 'me') continue;
      if (!map[jid]) {
        map[jid] = { jid, contact: msg.contact || null, lastMessage: msg.body || '[Audio]', lastAt: msg.createdAt, unread: 0 };
      }
      if (msg.direction === 'inbound' && msg.status !== 'read') map[jid].unread++;
    }

    res.json(Object.values(map).sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.sendBroadcast = async (req, res) => {
  try {
    const { jids, text, scheduled_at } = req.body;
    if (!jids?.length || !text) return res.status(400).json({ error: 'jids[] y text son requeridos' });

    // If scheduled, save for later
    if (scheduled_at) {
      const { ScheduledMessage } = require('../models');
      const scheduled = await ScheduledMessage.create({
        jids,
        text,
        scheduled_at: new Date(scheduled_at),
        status: 'pending',
        created_by: req.user.id
      });
      return res.json({ ok: true, scheduled: true, id: scheduled.id, scheduled_at });
    }

    // Send immediately
    const status = wa.getStatus();
    if (status.status !== 'connected') {
      return res.status(400).json({ error: 'WhatsApp no está conectado' });
    }

    const results = await wa.sendBroadcast(jids, text);
    res.json({ ok: true, results });
  } catch (err) {
    console.error('[Broadcast error]', err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.getScheduled = async (req, res) => {
  try {
    const { ScheduledMessage } = require('../models');
    const msgs = await ScheduledMessage.findAll({
      order: [['scheduled_at', 'ASC']],
      limit: 50
    });
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.cancelScheduled = async (req, res) => {
  try {
    const { ScheduledMessage } = require('../models');
    const msg = await ScheduledMessage.findByPk(req.params.id);
    if (!msg) return res.status(404).json({ error: 'No encontrado' });
    await msg.update({ status: 'cancelled' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getChatMessages = async (req, res) => {
  try {
    const jid = decodeURIComponent(req.params.jid);
    const messages = await Message.findAll({
      where: { [Op.or]: [{ from_jid: jid }, { to_jid: jid }] },
      order: [['createdAt', 'ASC']],
      limit: 200
    });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
