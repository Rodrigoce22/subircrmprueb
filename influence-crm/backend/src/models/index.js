const sequelize = require('../config/database');
const User             = require('./User');
const Contact          = require('./Contact');
const Message          = require('./Message');
const Task             = require('./Task');
const Event            = require('./Event');
const Setting          = require('./Setting');
const Project          = require('./Project');
const AutoReply        = require('./AutoReply');
const ScheduledMessage = require('./ScheduledMessage');

// ── User ↔ Contact ────────────────────────────────────────────────────────────
User.hasMany(Contact, { foreignKey: 'assigned_to', as: 'assignedContacts' });
User.hasMany(Contact, { foreignKey: 'created_by',  as: 'createdContacts' });
Contact.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignedUser' });
Contact.belongsTo(User, { foreignKey: 'created_by',  as: 'creator' });

// ── Contact ↔ Message ─────────────────────────────────────────────────────────
Contact.hasMany(Message, { foreignKey: 'contact_id', as: 'messages' });
Message.belongsTo(Contact, { foreignKey: 'contact_id', as: 'contact' });

// ── User ↔ Task ───────────────────────────────────────────────────────────────
User.hasMany(Task, { foreignKey: 'assigned_to', as: 'assignedTasks' });
User.hasMany(Task, { foreignKey: 'created_by',  as: 'createdTasks' });
Task.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });
Task.belongsTo(User, { foreignKey: 'created_by',  as: 'creator' });
Task.belongsTo(Contact, { foreignKey: 'contact_id', as: 'contact' });

// ── Project ↔ Task ────────────────────────────────────────────────────────────
Project.hasMany(Task, { foreignKey: 'project_id', as: 'tasks' });
Task.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
User.hasMany(Project, { foreignKey: 'created_by', as: 'projects' });
Project.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// ── Event associations ────────────────────────────────────────────────────────
User.hasMany(Event, { foreignKey: 'assigned_to', as: 'assignedEvents' });
User.hasMany(Event, { foreignKey: 'created_by',  as: 'createdEvents' });
Event.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });
Event.belongsTo(User, { foreignKey: 'created_by',  as: 'creator' });
Event.belongsTo(Contact, { foreignKey: 'contact_id', as: 'contact' });
Contact.hasMany(Event, { foreignKey: 'contact_id', as: 'events' });

module.exports = { sequelize, User, Contact, Message, Task, Event, Setting, Project, AutoReply, ScheduledMessage };
