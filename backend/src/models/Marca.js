const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Marca = sequelize.define('Marca', {
  idmarca: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  descripcion: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'descripcion'
  }
}, {
  tableName: 'marcas',
  timestamps: false
});

module.exports = Marca;
