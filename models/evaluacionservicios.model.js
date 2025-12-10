// server/models/evaluacionservicios.model.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const EvaluacionServicio = sequelize.define(
  "EvaluacionServicio",
  {
    idevaluacion: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    numero_documento: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    idservicios: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    respuestacalificacion: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
     comentarios: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
  },
  {
    tableName: "evaluacionservicios",
    timestamps: false,
  }
);

export default EvaluacionServicio;
