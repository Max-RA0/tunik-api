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
  idproducto: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'productos',
      key: 'idproductos'
    }
  },
  cantidadconsumo: {
    type: DataTypes.DECIMAL(12, 3),
    allowNull: true
  },
  unidadconsumo: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  cantidadconsumobase: {
    type: DataTypes.DECIMAL(12, 3),
    allowNull: true
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
  },
  descripcionvehiculo: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  placa: {
    type: DataTypes.STRING(20),
    allowNull: true
  }
}, {
  tableName: 'detalleventas',
  timestamps: false
});

module.exports = DetalleVenta;
