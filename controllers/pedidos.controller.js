// server/controllers/pedidos.controller.js
import sequelize from "../config/db.js";
import { QueryTypes } from "sequelize";
import Pedido, { DetallePedido } from "../models/pedidos.js";
import Proveedor from "../models/proveedor.js";

const asInt = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

const safeArray = (x) => (Array.isArray(x) ? x : []);
const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);

// une productos repetidos (por PK compuesta)
const normalizeItems = (items) => {
  const map = new Map();
  safeArray(items).forEach((it) => {
    const idproductos = asInt(it?.idproductos ?? it?.idproducto ?? it?.idProducto ?? it?.producto_id);
    const cantidad = asInt(it?.cantidad ?? it?.qty ?? it?.cant ?? 1) || 1;
    if (!idproductos || cantidad <= 0) return;
    map.set(String(idproductos), (map.get(String(idproductos)) || 0) + cantidad);
  });
  return [...map.entries()].map(([k, v]) => ({ idproductos: Number(k), cantidad: Number(v) }));
};

const getProdProveedorId = (p) =>
  p?.idproveedor ?? p?.idProveedor ?? p?.proveedor_id ?? p?.proveedorId ?? null;

// valida que el producto exista y (si aplica) que sea del proveedor
async function assertProductoValidoParaProveedor(idproductos, idproveedor, t) {
  const prodRows = await sequelize.query(
    "SELECT * FROM productos WHERE idproductos = ? LIMIT 1",
    { type: QueryTypes.SELECT, replacements: [idproductos], transaction: t }
  );
  const prod = prodRows?.[0];
  if (!prod) return { ok: false, msg: `Producto ${idproductos} no existe` };

  const prodProv = getProdProveedorId(prod);
  if (prodProv != null && String(prodProv) !== String(idproveedor)) {
    return { ok: false, msg: `El producto ${idproductos} no pertenece al proveedor seleccionado` };
  }
  return { ok: true, prod };
}

/* =========================
   GETs
   ========================= */

export const getPedidos = async (req, res) => {
  try {
    const pedidos = await Pedido.findAll({
      include: [{ model: Proveedor, as: "proveedor" }],
      order: [["idpedidos", "DESC"]],
    });
    return res.json({ ok: true, data: pedidos });
  } catch (err) {
    console.error("getPedidos:", err);
    return res.status(500).json({ ok: false, msg: err.message || "Error en el servidor" });
  }
};

export const getPedidoById = async (req, res) => {
  try {
    const idpedidos = asInt(req.params.idpedidos ?? req.params.id);
    if (!idpedidos) return res.status(400).json({ ok: false, msg: "idpedidos inválido" });

    const pedido = await Pedido.findByPk(idpedidos, {
      include: [
        { model: Proveedor, as: "proveedor" },
        { model: DetallePedido, as: "detalles" }, // sale desde detallepedidoproducto
      ],
    });

    if (!pedido) return res.status(404).json({ ok: false, msg: "Pedido no encontrado" });

    // normaliza para el front (items opcional, por si lo usas)
    const plain = pedido.toJSON();
    const items = safeArray(plain.detalles).map((d) => ({
      idproductos: d.idproductos,
      cantidad: d.cantidad,
    }));

    return res.json({ ok: true, data: { ...plain, items } });
  } catch (err) {
    console.error("getPedidoById:", err);
    return res.status(500).json({ ok: false, msg: err.message || "Error en el servidor" });
  }
};

/* =========================
   CREATE (MASTER + DETAIL)
   ========================= */

export const createPedido = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const idproveedor = asInt(req.body.idproveedor ?? req.body.idProveedor);
    const fechaPedido = req.body.fechaPedido;
    const estado = String(req.body.estado || "Pendiente");
    const items = normalizeItems(req.body.items);

    if (!idproveedor) return res.status(400).json({ ok: false, msg: "El proveedor es obligatorio" });
    if (!fechaPedido) return res.status(400).json({ ok: false, msg: "La fecha de pedido es obligatoria" });
    if (items.length === 0) return res.status(400).json({ ok: false, msg: "Agrega al menos 1 producto al pedido" });

    // validar items contra proveedor
    for (const it of items) {
      const v = await assertProductoValidoParaProveedor(it.idproductos, idproveedor, t);
      if (!v.ok) {
        await t.rollback();
        return res.status(400).json({ ok: false, msg: v.msg });
      }
    }

    // 1) master
    const pedido = await Pedido.create({ idproveedor, fechaPedido, estado }, { transaction: t });

    // 2) detail (detallepedidoproducto)
    const detalleRows = items.map((it) => ({
      idpedidos: pedido.idpedidos,   // -> columna idpedido
      idproveedor,                  // -> columna idproveedor
      idproductos: it.idproductos,  // -> columna idproducto
      cantidad: it.cantidad,
    }));

    await DetallePedido.bulkCreate(detalleRows, { transaction: t });

    // 3) stock (compra => suma)
    for (const it of items) {
      await sequelize.query(
        "UPDATE productos SET cantidadexistente = cantidadexistente + ? WHERE idproductos = ?",
        { type: QueryTypes.UPDATE, replacements: [it.cantidad, it.idproductos], transaction: t }
      );
    }

    await t.commit();
    return res.status(201).json({ ok: true, data: { pedido, items } });
  } catch (err) {
    await t.rollback();
    console.error("createPedido:", err);
    return res.status(500).json({ ok: false, msg: err.message || "Error en el servidor" });
  }
};

/* =========================
   UPDATE (si viene items: reemplaza detalle)
   ========================= */

export const updatePedido = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const idpedidos = asInt(req.params.idpedidos ?? req.params.id);
    if (!idpedidos) return res.status(400).json({ ok: false, msg: "idpedidos inválido" });

    const pedido = await Pedido.findByPk(idpedidos, { transaction: t });
    if (!pedido) return res.status(404).json({ ok: false, msg: "Pedido no encontrado" });

    const nextProveedor = hasOwn(req.body, "idproveedor") ? asInt(req.body.idproveedor) : null;
    const nextFecha = hasOwn(req.body, "fechaPedido") ? req.body.fechaPedido : null;
    const nextEstado = hasOwn(req.body, "estado") ? String(req.body.estado || "Pendiente") : null;

    // 🔒 por tu FK compuesta: si cambias proveedor debes enviar items para recrear detalle
    if (nextProveedor != null && String(nextProveedor) !== String(pedido.idproveedor) && !hasOwn(req.body, "items")) {
      await t.rollback();
      return res.status(400).json({
        ok: false,
        msg: "Para cambiar el proveedor debes enviar 'items' (se recrea el detalle).",
      });
    }

    // si hay items: reemplazo completo detalle
    if (hasOwn(req.body, "items")) {
      const items = normalizeItems(req.body.items);
      if (items.length === 0) {
        await t.rollback();
        return res.status(400).json({ ok: false, msg: "items no puede estar vacío" });
      }

      const targetProveedor = nextProveedor != null ? nextProveedor : pedido.idproveedor;

      // validar productos contra proveedor destino
      for (const it of items) {
        const v = await assertProductoValidoParaProveedor(it.idproductos, targetProveedor, t);
        if (!v.ok) {
          await t.rollback();
          return res.status(400).json({ ok: false, msg: v.msg });
        }
      }

      // 1) leer detalle viejo
      const oldDet = await DetallePedido.findAll({
        where: { idpedidos },
        transaction: t,
      });

      // 2) revertir stock viejo (resta) + validar no negativo
      for (const d of oldDet) {
        const idprod = d.idproductos;
        const cant = Number(d.cantidad) || 0;

        const st = await sequelize.query(
          "SELECT cantidadexistente FROM productos WHERE idproductos = ? LIMIT 1",
          { type: QueryTypes.SELECT, replacements: [idprod], transaction: t }
        );

        const actual = Number(st?.[0]?.cantidadexistente ?? 0);
        if (actual - cant < 0) {
          await t.rollback();
          return res.status(400).json({
            ok: false,
            msg: `No se puede actualizar porque dejaría stock negativo en producto ${idprod}`,
          });
        }

        await sequelize.query(
          "UPDATE productos SET cantidadexistente = cantidadexistente - ? WHERE idproductos = ?",
          { type: QueryTypes.UPDATE, replacements: [cant, idprod], transaction: t }
        );
      }

      // 3) borrar detalle viejo
      await DetallePedido.destroy({ where: { idpedidos }, transaction: t });

      // 4) actualizar master (después de borrar detalle para no romper la FK compuesta)
      if (nextProveedor != null) pedido.idproveedor = nextProveedor;
      if (nextFecha != null) pedido.fechaPedido = nextFecha;
      if (nextEstado != null) pedido.estado = nextEstado;
      await pedido.save({ transaction: t });

      // 5) insertar detalle nuevo
      const detalleRows = items.map((it) => ({
        idpedidos,
        idproveedor: pedido.idproveedor,
        idproductos: it.idproductos,
        cantidad: it.cantidad,
      }));
      await DetallePedido.bulkCreate(detalleRows, { transaction: t });

      // 6) aplicar stock nuevo (suma)
      for (const it of items) {
        await sequelize.query(
          "UPDATE productos SET cantidadexistente = cantidadexistente + ? WHERE idproductos = ?",
          { type: QueryTypes.UPDATE, replacements: [it.cantidad, it.idproductos], transaction: t }
        );
      }

      await t.commit();
      return res.json({ ok: true, data: pedido });
    }

    // si NO hay items: solo master
    if (nextProveedor != null) pedido.idproveedor = nextProveedor;
    if (nextFecha != null) pedido.fechaPedido = nextFecha;
    if (nextEstado != null) pedido.estado = nextEstado;

    await pedido.save({ transaction: t });
    await t.commit();
    return res.json({ ok: true, data: pedido });
  } catch (err) {
    await t.rollback();
    console.error("updatePedido:", err);
    return res.status(500).json({ ok: false, msg: err.message || "Error en el servidor" });
  }
};

/* =========================
   DELETE (revierte stock + borra detalle + borra master)
   ========================= */

export const deletePedido = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const idpedidos = asInt(req.params.idpedidos ?? req.params.id);
    if (!idpedidos) return res.status(400).json({ ok: false, msg: "idpedidos inválido" });

    const pedido = await Pedido.findByPk(idpedidos, { transaction: t });
    if (!pedido) return res.status(404).json({ ok: false, msg: "Pedido no encontrado" });

    const det = await DetallePedido.findAll({ where: { idpedidos }, transaction: t });

    // revertir stock (resta) + validar no negativo
    for (const d of det) {
      const idprod = d.idproductos;
      const cant = Number(d.cantidad) || 0;

      const st = await sequelize.query(
        "SELECT cantidadexistente FROM productos WHERE idproductos = ? LIMIT 1",
        { type: QueryTypes.SELECT, replacements: [idprod], transaction: t }
      );

      const actual = Number(st?.[0]?.cantidadexistente ?? 0);
      if (actual - cant < 0) {
        await t.rollback();
        return res.status(400).json({
          ok: false,
          msg: `No se puede eliminar porque dejaría stock negativo en producto ${idprod}`,
        });
      }

      await sequelize.query(
        "UPDATE productos SET cantidadexistente = cantidadexistente - ? WHERE idproductos = ?",
        { type: QueryTypes.UPDATE, replacements: [cant, idprod], transaction: t }
      );
    }

    // borrar detalle primero (por tu FK compuesta)
    await DetallePedido.destroy({ where: { idpedidos }, transaction: t });

    // borrar master
    await pedido.destroy({ transaction: t });

    await t.commit();
    return res.json({ ok: true, msg: "Pedido eliminado correctamente" });
  } catch (err) {
    await t.rollback();
    console.error("deletePedido:", err);
    return res.status(500).json({ ok: false, msg: err.message || "Error en el servidor" });
  }
};
