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
    validate: { isIn: [['keyword', 'first_message', 'always']] }
  },
  keyword: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  response: {
    type: DataTypes.TEXT,
    allowNull: false
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
