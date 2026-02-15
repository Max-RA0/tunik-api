const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const MetodoPago = sequelize.define('MetodoPago', {
  idmpago: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombrempago: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'nombremetodo'
  }
}, {
  tableName: 'metodospago',
  timestamps: false
});

module.exports = MetodoPago;
