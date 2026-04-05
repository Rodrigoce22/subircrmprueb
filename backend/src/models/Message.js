const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  wa_message_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true
  },
  contact_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'contacts', key: 'id' }
  },
  from_jid: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'JID del remitente'
  },
  to_jid: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'JID del destinatario'
  },
  body: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  type: {
    type: DataTypes.STRING(20),
    defaultValue: 'text'
  },
  direction: {
    type: DataTypes.STRING(10),
    allowNull: false
  },
  status: {
    type: DataTypes.STRING(10),
    defaultValue: 'sent'
  },
  media_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  timestamp_wa: {
    type: DataTypes.BIGINT,
    allowNull: true
  }
}, {
  tableName: 'messages'
});

module.exports = Message;
