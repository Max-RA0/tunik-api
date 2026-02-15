const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');

const Vehiculo = sequelize.define('Vehiculo', {
  placa: {
    type: DataTypes.STRING(10),
    primaryKey: true
  },
  modelo: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  color: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  idtipovehiculos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tipovehiculos',
      key: 'idtipovehiculos'
    }
  },
  idmarca: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'marcas',
      key: 'idmarca'
    }
  },
  numero_documento: {
    type: DataTypes.STRING(20),
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'numero_documento'
    }
  }
}, {
  tableName: 'vehiculos',
  timestamps: false
});

module.exports = Vehiculo;
