const { Setting } = require('../models');

exports.list = async (req, res) => {
  try {
    const settings = await Setting.findAll({ order: [['service', 'ASC']] });
    // Mask secret values
    const safe = settings.map(s => ({
      ...s.toJSON(),
      value: s.connected && s.value ? '••••••••' : s.value
    }));
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.upsert = async (req, res) => {
  try {
    const { service, key, value, type, label, meta } = req.body;
    if (!service || !key) return res.status(400).json({ error: 'service y key son requeridos' });

    let setting = await Setting.findOne({ where: { key } });
    if (setting) {
      await setting.update({
        value: value !== undefined ? value : setting.value,
        type: type || setting.type,
        label: label || setting.label,
        meta: meta || setting.meta,
        connected: !!(value),
        connected_by: req.user.id
      });
    } else {
      setting = await Setting.create({
        service, key, value, type: type || 'api_key',
        label: label || key,
        meta: meta || {},
        connected: !!(value),
        connected_by: req.user.id
      });
    }

    res.json({ ...setting.toJSON(), value: setting.connected ? '••••••••' : null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.disconnect = async (req, res) => {
  try {
    const setting = await Setting.findOne({ where: { key: req.params.key } });
    if (!setting) return res.status(404).json({ error: 'No encontrado' });

    await setting.update({ connected: false, value: null });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getByService = async (req, res) => {
  try {
    const settings = await Setting.findAll({ where: { service: req.params.service } });
    res.json(settings.map(s => ({ ...s.toJSON(), value: s.connected && s.value ? '••••••••' : s.value })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
