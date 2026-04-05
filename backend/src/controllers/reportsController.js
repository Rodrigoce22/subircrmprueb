const { generatePDF } = require('../services/reportService');
const { Task, Contact, Message, User } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

exports.generateTasksReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const where = {};
    if (from && to) {
      where.createdAt = { [Op.between]: [new Date(from), new Date(to)] };
    }

    const tasks = await Task.findAll({
      where,
      include: [
        { model: User, as: 'assignee', attributes: ['name'] },
        { model: User, as: 'creator', attributes: ['name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;

    const { filename } = await generatePDF({
      title: 'Reporte de Tareas del Equipo',
      subtitle: `Periodo: ${from || 'inicio'} — ${to || 'hoy'}`,
      generatedBy: req.user.name,
      date: new Date().toLocaleDateString('es-ES', { dateStyle: 'long' }),
      stats: [
        { label: 'Total Tareas', value: tasks.length },
        { label: 'Completadas', value: completed },
        { label: 'En Progreso', value: inProgress },
        { label: 'Pendientes', value: pending }
      ],
      sections: [{
        title: 'Detalle de Tareas',
        table: {
          headers: ['Titulo', 'Asignado a', 'Prioridad', 'Estado', 'Vence'],
          rows: tasks.map(t => [
            t.title,
            t.assignee?.name || '-',
            t.priority,
            t.status,
            t.due_date || '-'
          ])
        }
      }]
    });

    res.json({ url: `/api/reports/download/${filename}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.generateContactsReport = async (req, res) => {
  try {
    const contacts = await Contact.findAll({
      include: [{ model: User, as: 'assignedUser', attributes: ['name'] }],
      order: [['createdAt', 'DESC']]
    });

    const byStatus = contacts.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {});

    const { filename } = await generatePDF({
      title: 'Reporte de Contactos / Leads',
      subtitle: 'Base de datos de contactos CRM',
      generatedBy: req.user.name,
      date: new Date().toLocaleDateString('es-ES', { dateStyle: 'long' }),
      stats: [
        { label: 'Total Contactos', value: contacts.length },
        { label: 'Leads', value: byStatus.lead || 0 },
        { label: 'Prospectos', value: byStatus.prospect || 0 },
        { label: 'Clientes', value: byStatus.client || 0 }
      ],
      sections: [{
        title: 'Lista de Contactos',
        table: {
          headers: ['Nombre', 'Telefono', 'Empresa', 'Estado', 'Asignado a'],
          rows: contacts.map(c => [
            c.name,
            c.phone || '-',
            c.company || '-',
            c.status,
            c.assignedUser?.name || '-'
          ])
        }
      }]
    });

    res.json({ url: `/api/reports/download/${filename}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.generateMessagesReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const where = {};
    if (from && to) {
      where.createdAt = { [Op.between]: [new Date(from), new Date(to)] };
    }

    const messages = await Message.findAll({
      where,
      include: [{ model: Contact, as: 'contact', attributes: ['name', 'phone'] }],
      order: [['createdAt', 'DESC']],
      limit: 500
    });

    const inbound = messages.filter(m => m.direction === 'inbound').length;
    const outbound = messages.filter(m => m.direction === 'outbound').length;

    const { filename } = await generatePDF({
      title: 'Reporte de Mensajes WhatsApp',
      subtitle: `Actividad de WhatsApp Business`,
      generatedBy: req.user.name,
      date: new Date().toLocaleDateString('es-ES', { dateStyle: 'long' }),
      stats: [
        { label: 'Total Mensajes', value: messages.length },
        { label: 'Recibidos', value: inbound },
        { label: 'Enviados', value: outbound },
        { label: 'Contactos Unicos', value: new Set(messages.map(m => m.from_jid)).size }
      ],
      sections: [{
        title: 'Actividad de Mensajes',
        table: {
          headers: ['Contacto', 'Telefono', 'Mensaje', 'Tipo', 'Fecha'],
          rows: messages.slice(0, 100).map(m => [
            m.contact?.name || m.from_jid,
            m.contact?.phone || '-',
            (m.body || '').substring(0, 60) + (m.body?.length > 60 ? '...' : ''),
            m.direction === 'inbound' ? 'Recibido' : 'Enviado',
            new Date(m.createdAt).toLocaleDateString('es-ES')
          ])
        }
      }]
    });

    res.json({ url: `/api/reports/download/${filename}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.download = (req, res) => {
  const { filename } = req.params;
  const filepath = path.join(__dirname, '../../reports', filename);
  if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'Archivo no encontrado' });
  res.download(filepath);
};
