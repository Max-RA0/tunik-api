const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Producto = sequelize.define('Producto', {
  idproductos: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  idproveedor: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'proveedores',
      key: 'idproveedor'
    }
  },
  nombreproductos: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  cantidadexistente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  tipomedida: {
    type: DataTypes.ENUM('volumen', 'longitud', 'unidad'),
    allowNull: true
  },
  unidadbase: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  stockbase: {
    type: DataTypes.DECIMAL(12, 3),
    allowNull: true,
    defaultValue: 0
  }
}, {
  tableName: 'productos',
  timestamps: false
});

module.exports = Producto;
