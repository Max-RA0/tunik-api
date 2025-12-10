// server/models/agendacitas.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Vehiculo from "./vehiculo.js";

const Agendacita = sequelize.define(
  "Agendacita",
  {
    idagendacitas: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "idagendacitas",
    },
    placa: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: "placa",
    },
    fecha: {
      type: DataTypes.DATE, // DATETIME en MySQL
      allowNull: false,
      field: "fecha",
    },
    estado: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "Pendiente",
      field: "estado",
    },
  },
  {
    tableName: "agendacitas",
    timestamps: false,
  }
);

// Relaciones
Agendacita.belongsTo(Vehiculo, {
  foreignKey: "placa",
  targetKey: "placa",
  as: "vehiculo",
});

export default Agendacita;
