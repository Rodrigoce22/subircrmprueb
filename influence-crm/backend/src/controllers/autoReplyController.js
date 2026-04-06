const { AutoReply } = require('../models');

exports.list = async (req, res) => {
  try {
    const rules = await AutoReply.findAll({ order: [['createdAt', 'DESC']] });
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const rule = await AutoReply.create({ ...req.body, created_by: req.user.id });
    res.status(201).json(rule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const rule = await AutoReply.findByPk(req.params.id);
    if (!rule) return res.status(404).json({ error: 'Regla no encontrada' });
    await rule.update(req.body);
    res.json(rule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const rule = await AutoReply.findByPk(req.params.id);
    if (!rule) return res.status(404).json({ error: 'Regla no encontrada' });
    await rule.destroy();
    res.json({ message: 'Regla eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
