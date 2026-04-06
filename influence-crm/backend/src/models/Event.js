const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Event = sequelize.define('Event', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  start_date: { type: DataTypes.DATE, allowNull: false },
  end_date: { type: DataTypes.DATE, allowNull: false },
  all_day: { type: DataTypes.BOOLEAN, defaultValue: false },
  color: { type: DataTypes.STRING(20), defaultValue: '#ab8aff' },
  type: {
    type: DataTypes.STRING(20),
    defaultValue: 'meeting',
    validate: { isIn: [['meeting', 'call', 'task', 'reminder', 'other']] }
  },
  location: { type: DataTypes.STRING(300), allowNull: true },
  contact_id: { type: DataTypes.UUID, allowNull: true },
  assigned_to: { type: DataTypes.UUID, allowNull: true },
  created_by: { type: DataTypes.UUID, allowNull: false }
}, { tableName: 'events', timestamps: true });

module.exports = Event;
