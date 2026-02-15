const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Cotizacion = sequelize.define('Cotizacion', {
  idcotizaciones: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  placa: {
    type: DataTypes.STRING(10),
    allowNull: false,
    references: {
      model: 'vehiculos',
      key: 'placa'
    }
  },
  idmpago: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'metodospago',
      key: 'idmpago'
    }
  },
  estado: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Pendiente'
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  idagendacitas: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'agendacitas',
      key: 'idagendacitas'
    }
  }
}, {
  tableName: 'cotizaciones',
  timestamps: false
});

module.exports = Cotizacion;
