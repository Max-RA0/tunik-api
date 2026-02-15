const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Servicio = sequelize.define('Servicio', {
  idservicios: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombreservicios: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  idcategoriaservicios: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'categoriaservicios',
      key: 'idcategoriaservicios'
    }
  },
  preciounitario: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
}, {
  tableName: 'servicios',
  timestamps: false
});

module.exports = Servicio;
