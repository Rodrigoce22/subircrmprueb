const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Contact = sequelize.define('Contact', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(30),
    allowNull: true
  },
  email: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  company: {
    type: DataTypes.STRING(150),
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'lead',
    validate: { isIn: [['lead', 'prospect', 'client', 'inactive']] }
  },
  pipeline_stage: {
    type: DataTypes.STRING(30),
    defaultValue: 'new_lead',
    // new_lead | contacted | negotiating | proposal | converted | lost
  },
  pipeline_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  wa_jid: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'WhatsApp JID del contacto'
  },
  assigned_to: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  }
}, {
  tableName: 'contacts'
});

module.exports = Contact;
