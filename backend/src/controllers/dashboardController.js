const { Task, Contact, Message, User } = require('../models');
const { Op } = require('sequelize');
const { subDays, subMonths, startOfDay, startOfMonth, format } = require('date-fns');

exports.stats = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const last7days  = subDays(now, 7);
    const last6months = subMonths(now, 6);

    const [
      totalContacts, totalTasks, completedTasks, pendingTasks, inProgressTasks,
      totalMessages, todayMessages,
      recentTasks, allUsers, allTasks,
      allContacts, recentMessages
    ] = await Promise.all([
      Contact.count(),
      Task.count({ where: { status: { [Op.ne]: 'cancelled' } } }),
      Task.count({ where: { status: 'completed' } }),
      Task.count({ where: { status: 'pending' } }),
      Task.count({ where: { status: 'in_progress' } }),
      Message.count(),
      Message.count({ where: { createdAt: { [Op.gte]: todayStart } } }),
      Task.findAll({
        order: [['createdAt', 'DESC']],
        limit: 10,
        include: [{ model: User, as: 'assignee', attributes: ['id', 'name', 'avatar'] }]
      }),
      User.findAll({ where: { active: true }, attributes: ['id', 'name', 'avatar'] }),
      Task.findAll({
        where: { status: { [Op.ne]: 'cancelled' } },
        attributes: ['id', 'assigned_to', 'status', 'priority', 'createdAt']
      }),
      Contact.findAll({
        attributes: ['id', 'status', 'pipeline_stage', 'createdAt'],
        where: { createdAt: { [Op.gte]: last6months } }
      }),
      Message.findAll({
        where: { createdAt: { [Op.gte]: last7days } },
        attributes: ['id', 'direction', 'createdAt']
      })
    ]);

    // ── Team stats ────────────────────────────────────────────────────────────
    const teamStats = allUsers.map(u => {
      const ut = allTasks.filter(t => t.assigned_to === u.id);
      return {
        id: u.id, name: u.name, avatar: u.avatar,
        total_tasks:     ut.length,
        completed_tasks: ut.filter(t => t.status === 'completed').length,
        pending_tasks:   ut.filter(t => t.status === 'pending').length,
        urgent_tasks:    ut.filter(t => t.priority === 'urgent').length
      };
    }).sort((a, b) => b.total_tasks - a.total_tasks);

    // ── Contact status distribution (pie) ─────────────────────────────────────
    const allContactsFull = await Contact.findAll({ attributes: ['id', 'status', 'pipeline_stage', 'createdAt'] });
    const contactsByStatus = ['lead', 'prospect', 'client', 'inactive'].map(s => ({
      name: { lead: 'Leads', prospect: 'Prospectos', client: 'Clientes', inactive: 'Inactivos' }[s],
      value: allContactsFull.filter(c => c.status === s).length,
      color: { lead: '#ab8aff', prospect: '#ffb77f', client: '#4cd6ff', inactive: '#48474e' }[s]
    }));

    // ── Pipeline stage distribution (funnel) ──────────────────────────────────
    const stageLabels = {
      new_lead: 'Nuevo Lead', contacted: 'Contactado', negotiating: 'Negociando',
      proposal: 'Propuesta', converted: 'Convertido', lost: 'Perdido'
    };
    const stageColors = {
      new_lead: '#ab8aff', contacted: '#4cd6ff', negotiating: '#ffb77f',
      proposal: '#8045fe', converted: '#00b2da', lost: '#ff97a3'
    };
    const pipelineDistribution = Object.entries(stageLabels).map(([id, name]) => ({
      name,
      value: allContactsFull.filter(c => c.pipeline_stage === id).length,
      color: stageColors[id]
    }));

    // ── Task status distribution (donut) ──────────────────────────────────────
    const tasksByStatus = [
      { name: 'Pendiente',   value: pendingTasks,    color: '#48474e' },
      { name: 'En Progreso', value: inProgressTasks, color: '#ab8aff' },
      { name: 'Revision',    value: allTasks.filter(t => t.status === 'review').length, color: '#ffb77f' },
      { name: 'Completada',  value: completedTasks,  color: '#4cd6ff' }
    ];

    // ── Messages per day last 7 days (bar) ────────────────────────────────────
    const msgsByDay = [];
    for (let i = 6; i >= 0; i--) {
      const day = subDays(now, i);
      const dayStr = format(day, 'dd/MM');
      const dayStart = startOfDay(day);
      const dayEnd   = new Date(dayStart.getTime() + 86400000);
      msgsByDay.push({
        day: dayStr,
        inbound:  recentMessages.filter(m => m.direction === 'inbound'  && new Date(m.createdAt) >= dayStart && new Date(m.createdAt) < dayEnd).length,
        outbound: recentMessages.filter(m => m.direction === 'outbound' && new Date(m.createdAt) >= dayStart && new Date(m.createdAt) < dayEnd).length
      });
    }

    // ── Monthly contacts growth (last 6 months) ───────────────────────────────
    const monthlyContacts = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd   = startOfMonth(subMonths(now, i - 1));
      monthlyContacts.push({
        month: format(monthStart, 'MMM'),
        leads:    allContacts.filter(c => new Date(c.createdAt) >= monthStart && new Date(c.createdAt) < monthEnd && c.status === 'lead').length,
        clients:  allContacts.filter(c => new Date(c.createdAt) >= monthStart && new Date(c.createdAt) < monthEnd && c.status === 'client').length,
        total:    allContacts.filter(c => new Date(c.createdAt) >= monthStart && new Date(c.createdAt) < monthEnd).length
      });
    }

    // ── Priority distribution ─────────────────────────────────────────────────
    const priorityDist = ['urgent', 'high', 'medium', 'low'].map(p => ({
      name: { urgent: 'Urgente', high: 'Alta', medium: 'Media', low: 'Baja' }[p],
      value: allTasks.filter(t => t.priority === p).length,
      color: { urgent: '#ff97a3', high: '#ffb77f', medium: '#ab8aff', low: '#6b6970' }[p]
    }));

    // ── Conversion rate ───────────────────────────────────────────────────────
    const totalAllContacts = await Contact.count();
    const convertedCount   = await Contact.count({ where: { pipeline_stage: 'converted' } });
    const conversionRate   = totalAllContacts > 0 ? Math.round((convertedCount / totalAllContacts) * 100) : 0;

    res.json({
      contacts: totalAllContacts,
      tasks: {
        total: totalTasks, completed: completedTasks,
        pending: pendingTasks, in_progress: inProgressTasks
      },
      messages:            { total: totalMessages, today: todayMessages },
      conversion_rate:     conversionRate,
      converted_contacts:  convertedCount,
      recentTasks,
      teamStats,
      charts: {
        contactsByStatus,
        pipelineDistribution,
        tasksByStatus,
        msgsByDay,
        monthlyContacts,
        priorityDist
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
