const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const DetalleVenta = sequelize.define('DetalleVenta', {
  iddetalleventas: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  idventas: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'ventas',
      key: 'idventas'
    }
  },
  idservicios: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'servicios',
      key: 'idservicios'
    }
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  precio_unitario: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'detalleventas',
  timestamps: false
});

module.exports = DetalleVenta;
