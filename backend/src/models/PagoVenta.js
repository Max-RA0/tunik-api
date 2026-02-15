const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const PagoVenta = sequelize.define('PagoVenta', {
  idpagoventas: {
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
  idmpago: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'metodospago',
      key: 'idmpago'
    }
  },
  valor: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  comprobante: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'pagosventas',
  timestamps: false
});

module.exports = PagoVenta;
