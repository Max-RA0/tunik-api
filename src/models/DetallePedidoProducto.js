const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const DetallePedidoProducto = sequelize.define('DetallePedidoProducto', {
  idpedido: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    field: 'idpedido',
    references: {
      model: 'pedidos',
      key: 'idpedidos'
    }
  },
  idproveedor: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'idproveedor'
  },
  idproducto: {
    type: DataTypes.INTEGER,
    allowNull: false,
    primaryKey: true,
    field: 'idproducto',
    references: {
      model: 'productos',
      key: 'idproductos'
    }
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'cantidad'
  },
  cantidadcontenido: {
    type: DataTypes.DECIMAL(12, 3),
    allowNull: true,
    field: 'cantidadcontenido'
  },
  unidadcontenido: {
    type: DataTypes.STRING(10),
    allowNull: true,
    field: 'unidadcontenido'
  },
  cantidadcontenidobase: {
    type: DataTypes.DECIMAL(12, 3),
    allowNull: true,
    field: 'cantidadcontenidobase'
  },
  preciounitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'preciounitario'
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'total'
  },
}, {
  tableName: 'detallepedidoproducto',
  timestamps: false
});

module.exports = DetallePedidoProducto;