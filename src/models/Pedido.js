const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Pedido = sequelize.define('Pedido', {
  idpedidos: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  codcompras: {
    type: DataTypes.STRING(20),
    allowNull: true,
    unique: true
  },
  idproveedor: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'proveedores',
      key: 'idproveedor'
    }
  },
  fechaPedido: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'fechaPedido'
  },
  estado: {
    type: DataTypes.STRING(50),
    allowNull: true,
    defaultValue: 'Pendiente'
  },
  numero_documento: {
    type: DataTypes.STRING(20),
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'numero_documento'
    }
  }
}, {
  tableName: 'pedidos',
  timestamps: false
});

module.exports = Pedido;
