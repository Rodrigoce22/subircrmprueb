const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Setting = sequelize.define('Setting', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  service: { type: DataTypes.STRING(50), allowNull: false },  // 'google_calendar', 'stripe', etc.
  key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  value: { type: DataTypes.TEXT, allowNull: true },
  type: { type: DataTypes.STRING(20), defaultValue: 'api_key' }, // 'api_key', 'oauth', 'webhook', 'config'
  connected: { type: DataTypes.BOOLEAN, defaultValue: false },
  label: { type: DataTypes.STRING(100), allowNull: true },
  meta: { type: DataTypes.JSON, defaultValue: {} },
  connected_by: { type: DataTypes.UUID, allowNull: true }
}, { tableName: 'settings', timestamps: true });

module.exports = Setting;
