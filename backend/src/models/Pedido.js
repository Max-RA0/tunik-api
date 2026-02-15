const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Pedido = sequelize.define('Pedido', {
  idpedidos: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  idproveedor: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'proveedores',
      key: 'idproveedor'
    }
  },
  idproductos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'productos',
      key: 'idproductos'
    }
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  estado: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Pendiente'
  }
}, {
  tableName: 'pedidos',
  timestamps: false
});

module.exports = Pedido;
