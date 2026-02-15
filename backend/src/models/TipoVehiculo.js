const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const TipoVehiculo = sequelize.define('TipoVehiculo', {
  idtipovehiculos: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'nombre'
  }
}, {
  tableName: 'tipovehiculos',
  timestamps: false
});

module.exports = TipoVehiculo;
