// server/models/categoriaservicio.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const CategoriaServicio = sequelize.define("CategoriaServicio", {
  idcategoriaservicios: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  nombrecategorias: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  descripcion: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: "categoriaservicios",
  timestamps: false
});

export default CategoriaServicio;
