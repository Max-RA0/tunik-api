// models/Usuarios.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Rol from "./roles.model.js";

const Usuarios = sequelize.define(
  "Usuarios",
  {
    numero_documento: {
      type: DataTypes.STRING(20),
      allowNull: false,
      primaryKey: true,
    },
    tipo_documento: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    contrasena: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    idroles: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "roles",
        key: "idroles",
      },
    },

   
    reset_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    token_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "usuarios",
    timestamps: false,
  }
);


Rol.hasMany(Usuarios, {
  foreignKey: "idroles",
  as: "usuarios",
});

Usuarios.belongsTo(Rol, {
  foreignKey: "idroles",
  as: "roles",
});

export default Usuarios;
