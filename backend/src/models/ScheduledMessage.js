const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ScheduledMessage = sequelize.define('ScheduledMessage', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  jids: {
    type: DataTypes.JSON,
    allowNull: false
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  scheduled_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending',
    validate: { isIn: [['pending', 'sent', 'failed', 'cancelled']] }
  },
  result: {
    type: DataTypes.JSON,
    allowNull: true
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true
  }
}, {
  tableName: 'scheduled_messages'
});

module.exports = ScheduledMessage;
