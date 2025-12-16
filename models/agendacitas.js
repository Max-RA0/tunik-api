// server/models/agendacitas.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Vehiculo from "./vehiculo.js";
import Servicio from "./servicios.js"; // ✅ para el detalle

/* ============================
   Modelo: Agendacita (MASTER)
   ============================ */
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

/* ============================
   Modelo: DetalleAgendaCita (DETAIL)
   ============================ */
const DetalleAgendaCita = sequelize.define(
  "DetalleAgendaCita",
  {
    iddetalleagenda: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "iddetalleagenda",
    },
    idagendacitas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "idagendacitas",
    },
    idservicios: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "idservicios",
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      field: "cantidad",
    },
    precio_unitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "precio_unitario",
    },
  },
  {
    tableName: "detalleagendacitas", // ✅ debe coincidir con tu tabla
    timestamps: false,
  }
);

/* ============================
   Relaciones
   ============================ */

// Agendacita -> Vehiculo (como ya estaba)
Agendacita.belongsTo(Vehiculo, {
  foreignKey: "placa",
  targetKey: "placa",
  as: "vehiculo",
});

// Agendacita -> Detalles
Agendacita.hasMany(DetalleAgendaCita, {
  foreignKey: "idagendacitas",
  sourceKey: "idagendacitas",
  as: "detalles",
  onDelete: "CASCADE",
});

// Detalle -> Agendacita
DetalleAgendaCita.belongsTo(Agendacita, {
  foreignKey: "idagendacitas",
  targetKey: "idagendacitas",
  as: "agenda",
});

// Detalle -> Servicio (para d.servicio.nombreservicios)
DetalleAgendaCita.belongsTo(Servicio, {
  foreignKey: "idservicios",
  targetKey: "idservicios",
  as: "servicio",
});

// (Opcional útil) Servicio -> Detalles agenda
Servicio.hasMany(DetalleAgendaCita, {
  foreignKey: "idservicios",
  sourceKey: "idservicios",
  as: "detallesAgenda",
});

export { DetalleAgendaCita };
export default Agendacita;
