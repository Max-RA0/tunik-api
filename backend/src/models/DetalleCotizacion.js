const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const DetalleCotizacion = sequelize.define('DetalleCotizacion', {
  idcotizaciones: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'cotizaciones',
      key: 'idcotizaciones'
    }
  },
  idservicios: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'servicios',
      key: 'idservicios'
    }
  },
  preciochange: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  tableName: 'detallecotizaciones',
  timestamps: false
});

module.exports = DetalleCotizacion;
