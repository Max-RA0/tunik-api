const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const AgendaCita = sequelize.define('AgendaCita', {
  idagendacitas: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  placa: {
    type: DataTypes.STRING(10),
    allowNull: false,
    references: {
      model: 'vehiculos',
      key: 'placa'
    }
  },
  fecha: {
    type: DataTypes.DATE,
    allowNull: false
  },
  estado: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Pendiente'
  }
}, {
  tableName: 'agendacitas',
  timestamps: false
});

module.exports = AgendaCita;
