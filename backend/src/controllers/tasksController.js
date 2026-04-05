const { Task, User, Contact, Project } = require('../models');
const { Op } = require('sequelize');

const FULL_INCLUDE = [
  { model: User,    as: 'assignee', attributes: ['id', 'name', 'avatar'] },
  { model: User,    as: 'creator',  attributes: ['id', 'name'] },
  { model: Contact, as: 'contact',  attributes: ['id', 'name', 'phone'] },
  { model: Project, as: 'project',  attributes: ['id', 'name', 'color'] }
];

exports.list = async (req, res) => {
  try {
    const { status, assigned_to, priority, project_id, page = 1, limit = 100 } = req.query;
    const where = {};

    if (req.user.role !== 'admin') {
      where[Op.or] = [{ assigned_to: req.user.id }, { created_by: req.user.id }];
    }
    if (status) where.status = status;
    if (assigned_to) where.assigned_to = assigned_to;
    if (priority) where.priority = priority;
    if (project_id === 'none') {
      where.project_id = null;
    } else if (project_id) {
      where.project_id = project_id;
    }

    const tasks = await Task.findAll({
      where,
      include: FULL_INCLUDE,
      order: [
        ['priority', 'DESC'],
        ['due_date', 'ASC'],
        ['createdAt', 'DESC']
      ],
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const task = await Task.create({ ...req.body, created_by: req.user.id });
    const full = await Task.findByPk(task.id, { include: FULL_INCLUDE });
    res.status(201).json(full);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });

    if (req.user.role !== 'admin' &&
        task.assigned_to !== req.user.id &&
        task.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Sin permisos' });
    }

    await task.update(req.body);
    const full = await Task.findByPk(task.id, { include: FULL_INCLUDE });
    res.json(full);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: 'Tarea no encontrada' });
    await task.destroy();
    res.json({ message: 'Tarea eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
