const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const CategoriaServicio = sequelize.define('CategoriaServicio', {
  idcategoriaservicios: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombrecategoriaservicio: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'nombrecategorias'
  },
  descripcion: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'categoriaservicios',
  timestamps: false
});

module.exports = CategoriaServicio;
