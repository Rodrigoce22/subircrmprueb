const { Project, Task, User } = require('../models');
const { Op } = require('sequelize');

exports.list = async (req, res) => {
  try {
    const projects = await Project.findAll({
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        {
          model: Task, as: 'tasks',
          attributes: ['id', 'status'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const enriched = projects.map(p => {
      const pj = p.toJSON();
      const tasks = pj.tasks || [];
      return {
        ...pj,
        task_count: tasks.length,
        completed_count: tasks.filter(t => t.status === 'completed').length,
        tasks: undefined
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const project = await Project.create({ ...req.body, created_by: req.user.id });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
    await project.update(req.body);
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: 'Proyecto no encontrado' });
    // Unlink tasks before deleting
    await Task.update({ project_id: null }, { where: { project_id: project.id } });
    await project.destroy();
    res.json({ message: 'Proyecto eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
