const { Contact, User, Message } = require('../models');
const { Op } = require('sequelize');

const STAGES = ['new_lead', 'contacted', 'negotiating', 'proposal', 'converted', 'lost'];

// Devuelve contactos agrupados por etapa del pipeline
exports.getBoard = async (req, res) => {
  try {
    const where = {};
    if (req.user.role !== 'admin') {
      where[Op.or] = [
        { assigned_to: req.user.id },
        { created_by: req.user.id },
        { created_by: null } // leads de WA sin dueno
      ];
    }

    const contacts = await Contact.findAll({
      where,
      include: [
        { model: User, as: 'assignedUser', attributes: ['id', 'name', 'avatar'] },
        {
          model: Message,
          as: 'messages',
          attributes: ['body', 'direction', 'createdAt'],
          order: [['createdAt', 'DESC']],
          limit: 1,
          separate: true
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Agrupar por etapa
    const board = {};
    STAGES.forEach(s => { board[s] = []; });

    for (const c of contacts) {
      const stage = c.pipeline_stage || 'new_lead';
      if (board[stage]) board[stage].push(c);
      else board['new_lead'].push(c);
    }

    res.json({ board, stages: STAGES });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mover contacto a otra etapa
exports.moveStage = async (req, res) => {
  try {
    const { id } = req.params;
    const { stage, pipeline_notes } = req.body;

    if (!STAGES.includes(stage)) {
      return res.status(400).json({ error: 'Etapa invalida' });
    }

    const contact = await Contact.findByPk(id);
    if (!contact) return res.status(404).json({ error: 'Contacto no encontrado' });

    await contact.update({
      pipeline_stage: stage,
      ...(pipeline_notes !== undefined && { pipeline_notes }),
      // Sincronizar status general con la etapa
      status: stage === 'converted' ? 'client'
            : stage === 'lost'      ? 'inactive'
            : stage === 'new_lead'  ? 'lead'
            : 'prospect'
    });

    res.json(contact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Asignar contacto a un usuario
exports.assign = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_to } = req.body;
    const contact = await Contact.findByPk(id);
    if (!contact) return res.status(404).json({ error: 'Contacto no encontrado' });
    await contact.update({ assigned_to: assigned_to || null });
    res.json(contact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
