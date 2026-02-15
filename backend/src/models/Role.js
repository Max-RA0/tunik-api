const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Role = sequelize.define('Role', {
  idroles: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  descripcion: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'descripcion'
  }
}, {
  tableName: 'roles',
  timestamps: false,
  underscored: false
});

module.exports = Role;
