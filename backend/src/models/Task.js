const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending',
    validate: { isIn: [['pending', 'in_progress', 'review', 'completed', 'cancelled']] }
  },
  priority: {
    type: DataTypes.STRING(10),
    defaultValue: 'medium',
    validate: { isIn: [['low', 'medium', 'high', 'urgent']] }
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  assigned_to: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' }
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  contact_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'contacts', key: 'id' }
  },
  project_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'projects', key: 'id' }
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  }
}, {
  tableName: 'tasks'
});

module.exports = Task;
