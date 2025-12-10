import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Producto = sequelize.define("Producto", {
  // --- Columna Clave Primaria ---
  idproductos: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: "IdProductos",
  },

  // --- Columna Clave Foránea (FK) ---
  idproveedor: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: "IdProveedor",
    references: {
      model: 'Proveedores', // Nombre de la tabla de Proveedores en la BD
      key: 'idproveedor',   // Nombre de la PK en la tabla de Proveedores
    }
  },
  
  // --- Otras Columnas ---
  nombreproductos: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: "NombreProductos",
  },

  precio: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: "Precio",
  },

  cantidadexistente: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: "CantidadExistente",
  },
}, {
  // --- Opciones del Modelo ---
  tableName: "productos",
  timestamps: false, // Desactiva las columnas `createdAt` y `updatedAt`
});

export default Producto;