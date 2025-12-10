// server/models/pedidos.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import Proveedor from "./proveedor.js";

const Pedido = sequelize.define(
  "Pedido",
  {
    idpedidos: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "idpedidos",
    },
    idproveedor: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "idproveedor",
    },
    fechaPedido: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "fechaPedido",
    },
    estado: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "Pendiente",
      field: "estado",
    },
  },
  {
    tableName: "pedidos",
    timestamps: false,
  }
);

/**
 * TABLA REAL: detallepedidoproducto
 * PK compuesta: (idpedido, idproducto)
 * FK compuesta: (idpedido, idproveedor) -> pedidos(idpedidos, idproveedor)
 *
 * OJO: uso atributos "idpedidos" y "idproductos" para que tu front siga igual,
 * pero mapeados a las columnas reales idpedido / idproducto.
 */
export const DetallePedido = sequelize.define(
  "DetallePedido",
  {
    idpedidos: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "idpedido",
    },
    idproveedor: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "idproveedor",
    },
    idproductos: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      field: "idproducto",
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "cantidad",
    },
  },
  {
    tableName: "detallepedidoproducto",
    timestamps: false,
  }
);

// relaciones
Pedido.belongsTo(Proveedor, { foreignKey: "idproveedor", as: "proveedor" });

Pedido.hasMany(DetallePedido, {
  foreignKey: "idpedidos", // atributo
  sourceKey: "idpedidos",
  as: "detalles",
  onDelete: "CASCADE",
});

DetallePedido.belongsTo(Pedido, {
  foreignKey: "idpedidos",
  targetKey: "idpedidos",
  as: "pedido",
});

export default Pedido;
