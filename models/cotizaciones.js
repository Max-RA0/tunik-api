// server/models/cotizaciones.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

import Vehiculo from "./vehiculo.js";
import MetodoPago from "./metodospago.js";
import Servicio from "./servicios.js"; // ✅ necesario para el detalle

// ✅ CAMBIA ESTA RUTA SI TU ARCHIVO SE LLAMA DIFERENTE
import AgendaCita from "./agendacitas.js";

/* ============================
   Modelo: Cotizacion (MASTER)
============================ */
const Cotizacion = sequelize.define(
  "Cotizacion",
  {
    idcotizaciones: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "idcotizaciones",
    },
    placa: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: "placa",
    },
    idmpago: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "idmpago",
    },
    estado: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "Pendiente",
      field: "estado",
    },
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "fecha",
    },

    // ✅ NUEVO: link con agenda
    idagendacitas: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "idagendacitas",
    },
  },
  {
    tableName: "cotizaciones",
    timestamps: false,
  }
);

/* ============================
   Modelo: DetalleCotizacion
============================ */
const DetalleCotizacion = sequelize.define(
  "DetalleCotizacion",
  {
    idcotizaciones: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "idcotizaciones",
    },
    idservicios: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "idservicios",
    },
    preciochange: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      field: "preciochange",
    },
  },
  {
    tableName: "detallecotizaciones",
    timestamps: false,
  }
);

/* ============================
   RELACIONES
============================ */
Cotizacion.belongsTo(Vehiculo, {
  foreignKey: "placa",
  targetKey: "placa",
  as: "vehiculo",
});

Cotizacion.belongsTo(MetodoPago, {
  foreignKey: "idmpago",
  targetKey: "idmpago",
  as: "metodoPago",
});

// ✅ Cotización -> Agenda
Cotizacion.belongsTo(AgendaCita, {
  foreignKey: "idagendacitas",
  targetKey: "idagendacitas",
  as: "agenda",
});

// Cotización -> Detalles
Cotizacion.hasMany(DetalleCotizacion, {
  foreignKey: "idcotizaciones",
  sourceKey: "idcotizaciones",
  as: "detalles",
  onDelete: "CASCADE",
});

// Detalle -> Cotización
DetalleCotizacion.belongsTo(Cotizacion, {
  foreignKey: "idcotizaciones",
  targetKey: "idcotizaciones",
  as: "cotizacion",
});

// Detalle -> Servicio
DetalleCotizacion.belongsTo(Servicio, {
  foreignKey: "idservicios",
  targetKey: "idservicios",
  as: "servicio",
});

// Servicio -> Detalles
Servicio.hasMany(DetalleCotizacion, {
  foreignKey: "idservicios",
  sourceKey: "idservicios",
  as: "detallesCotizacion",
});

export { DetalleCotizacion };
export default Cotizacion;
