const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const EvaluacionServicio = sequelize.define('EvaluacionServicio', {
  idevaluacionservicios: {
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
  calificacion: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  comentario: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'evaluacionservicios',
  timestamps: false
});

module.exports = EvaluacionServicio;
