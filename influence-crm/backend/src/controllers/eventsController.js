const { Event, User, Contact } = require('../models');
const { Op } = require('sequelize');

const include = [
  { model: User,    as: 'assignee', attributes: ['id', 'name'] },
  { model: User,    as: 'creator',  attributes: ['id', 'name'] },
  { model: Contact, as: 'contact',  attributes: ['id', 'name', 'phone'], required: false }
];

exports.list = async (req, res) => {
  try {
    const { from, to, type, assigned_to } = req.query;
    const where = {};
    if (from && to) {
      where.start_date = { [Op.between]: [new Date(from), new Date(to)] };
    } else if (from) {
      where.start_date = { [Op.gte]: new Date(from) };
    }
    if (type)        where.type        = type;
    if (assigned_to) where.assigned_to = assigned_to;

    const events = await Event.findAll({ where, include, order: [['start_date', 'ASC']] });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, description, start_date, end_date, all_day, color, type, location, contact_id, assigned_to } = req.body;
    if (!title || !start_date || !end_date) return res.status(400).json({ error: 'title, start_date y end_date son requeridos' });

    const event = await Event.create({
      title, description, start_date, end_date,
      all_day: all_day || false,
      color: color || '#ab8aff',
      type: type || 'meeting',
      location,
      contact_id: contact_id || null,
      assigned_to: assigned_to || req.user.id,
      created_by: req.user.id
    });

    const full = await Event.findByPk(event.id, { include });
    res.status(201).json(full);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Evento no encontrado' });

    await event.update(req.body);
    const full = await Event.findByPk(event.id, { include });
    res.json(full);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) return res.status(404).json({ error: 'Evento no encontrado' });
    await event.destroy();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
