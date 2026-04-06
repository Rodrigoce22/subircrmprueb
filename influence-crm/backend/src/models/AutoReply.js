const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AutoReply = sequelize.define('AutoReply', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  trigger_type: {
    type: DataTypes.STRING(20),
    defaultValue: 'keyword',
    validate: { isIn: [['keyword', 'first_message', 'always', 'out_of_hours']] }
  },
  // Single keyword (legacy, kept for compatibility)
  keyword: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  // Multiple keywords pipe-separated, e.g. "hola|precio|info"
  keywords: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  response: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: ''
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  use_ai: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  ai_prompt: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Delay in seconds before sending (0 = immediate)
  reply_delay: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  // Only fire during business hours
  business_hours_only: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  hours_start: {
    type: DataTypes.STRING(5),
    defaultValue: '09:00'
  },
  hours_end: {
    type: DataTypes.STRING(5),
    defaultValue: '18:00'
  },
  // 0 = unlimited, N = max N fires per contact per day
  max_per_contact_day: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true
  },
  match_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'auto_replies'
});

module.exports = AutoReply;
