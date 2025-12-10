// server/controllers/cotizaciones.controller.js
import sequelize from "../config/db.js";
import { QueryTypes, fn, col } from "sequelize";

import Cotizacion, { DetalleCotizacion } from "../models/cotizaciones.js";
import Vehiculo from "../models/vehiculo.js";
import MetodoPago from "../models/metodospago.js";
import Servicio from "../models/servicios.js";

/* =========================
   Helpers (igual idea a pedidos)
   ========================= */
const safeArray = (x) => (Array.isArray(x) ? x : []);
const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);

const asInt = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

const asMoney = (v) => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// Solo estos 3 estados
const normalizeEstado = (v) => {
  const s = String(v ?? "").trim().toLowerCase();
  if (!s) return null;
  if (s === "aprobado") return "Aprobado";
  if (s === "cancelado") return "Cancelado";
  if (s === "pendiente") return "Pendiente";
  return null;
};

// Une servicios repetidos (por PK compuesta idservicios + idcotizaciones)
// Si repiten el mismo servicio, se queda con el ÚLTIMO precio enviado.
const normalizeItems = (items) => {
  const map = new Map();
  safeArray(items).forEach((it) => {
    const idservicios = asInt(
      it?.idservicios ?? it?.idservicio ?? it?.servicio_id ?? it?.idServicio
    );
    if (!idservicios) return;

    const preciochange = asMoney(
      it?.preciochange ?? it?.precio ?? it?.precioFinal ?? it?.precioChange
    );

    map.set(String(idservicios), { idservicios, preciochange });
  });

  return [...map.values()];
};

async function assertServicioExiste(idservicios, t) {
  const serv = await Servicio.findByPk(idservicios, { transaction: t });
  if (!serv) return { ok: false, msg: `El servicio ${idservicios} no existe` };
  return { ok: true, serv };
}

/* =========================================================
   COTIZACIONES (MASTER) - ahora soporta MASTER+DETAIL como pedidos
   ========================================================= */

// POST /api/cotizaciones
// Soporta master-detail si envías body.items = [{idservicios, preciochange?}, ...]
export const createCotizacion = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const placa = String(req.body.placa ?? "").trim();
    const idmpago = asInt(req.body.idmpago ?? req.body.idMetodoPago);
    const estadoIn = req.body.estado ?? "Pendiente";
    const estado = normalizeEstado(estadoIn);
    const fecha = req.body.fecha; // opcional

    // items: para master-detail estilo pedidos
    const itemsSent =
      hasOwn(req.body, "items") || hasOwn(req.body, "detalles") || hasOwn(req.body, "servicios");
    const items = normalizeItems(req.body.items ?? req.body.detalles ?? req.body.servicios);

    if (!placa || !idmpago) {
      await t.rollback();
      return res.status(400).json({ ok: false, msg: "Placa e idmpago son obligatorios" });
    }

    if (!estado) {
      await t.rollback();
      return res.status(400).json({
        ok: false,
        msg: "Estado inválido. Usa: Aprobado, Cancelado o Pendiente",
      });
    }

    if (itemsSent && items.length === 0) {
      await t.rollback();
      return res.status(400).json({ ok: false, msg: "Agrega al menos 1 servicio a la cotización" });
    }

    const vehiculo = await Vehiculo.findByPk(placa, { transaction: t });
    if (!vehiculo) {
      await t.rollback();
      return res.status(400).json({ ok: false, msg: "La placa no existe" });
    }

    const metodo = await MetodoPago.findByPk(idmpago, { transaction: t });
    if (!metodo) {
      await t.rollback();
      return res.status(400).json({ ok: false, msg: "Método de pago no válido" });
    }

    const nueva = await Cotizacion.create(
      {
        placa,
        idmpago,
        estado,
        // si no envían fecha, guardo hoy (tu tabla tiene DEFAULT CURRENT_DATE, pero aquí lo aseguro)
        fecha: fecha ?? new Date(),
      },
      { transaction: t }
    );

    // MASTER + DETAIL (igual que pedidos)
    if (items.length > 0) {
      const detalleRows = [];
      for (const it of items) {
        const v = await assertServicioExiste(it.idservicios, t);
        if (!v.ok) {
          await t.rollback();
          return res.status(400).json({ ok: false, msg: v.msg });
        }

        const precioFinal =
          it.preciochange !== null && it.preciochange !== undefined
            ? it.preciochange
            : Number(v.serv.preciounitario || 0);

        detalleRows.push({
          idcotizaciones: nueva.idcotizaciones,
          idservicios: it.idservicios,
          preciochange: precioFinal,
        });
      }

      await DetalleCotizacion.bulkCreate(detalleRows, { transaction: t });
    }

    await t.commit();
    return res.status(201).json({ ok: true, data: nueva });
  } catch (err) {
    await t.rollback();
    console.error("createCotizacion:", err);
    return res.status(500).json({ ok: false, msg: err.message || "Error en el servidor" });
  }
};

// GET /api/cotizaciones?placa=XXX&numero_documento=YYY
export const getCotizaciones = async (req, res) => {
  try {
    const { placa, numero_documento } = req.query;

    const includeVehiculo = {
      model: Vehiculo,
      as: "vehiculo",
      attributes: ["placa", "modelo", "color", "numero_documento"],
      ...(numero_documento
        ? { where: { numero_documento: String(numero_documento) }, required: true }
        : {}),
    };

    const where = {};
    if (placa) where.placa = String(placa);

    const cotizaciones = await Cotizacion.findAll({
      where,
      include: [
        includeVehiculo,
        { model: MetodoPago, as: "metodoPago", attributes: ["idmpago", "nombremetodo"] },
      ],
      order: [["idcotizaciones", "DESC"]],
    });

    if (!cotizaciones.length) return res.json({ ok: true, data: [] });

    // total por cotización (SUM detalle)
    const ids = cotizaciones.map((c) => c.idcotizaciones);

    const filasTotales = await DetalleCotizacion.findAll({
      attributes: ["idcotizaciones", [fn("SUM", col("preciochange")), "total"]],
      where: { idcotizaciones: ids },
      group: ["idcotizaciones"],
      raw: true,
    });

    const mapaTotales = {};
    for (const fila of filasTotales) {
      mapaTotales[fila.idcotizaciones] = Number(fila.total || 0);
    }

    const respuesta = cotizaciones.map((c) => {
      const json = c.toJSON();
      json.total = mapaTotales[c.idcotizaciones] || 0;
      return json;
    });

    return res.json({ ok: true, data: respuesta });
  } catch (err) {
    console.error("getCotizaciones:", err);
    return res.status(500).json({ ok: false, msg: err.message || "Error en el servidor" });
  }
};

// GET /api/cotizaciones/:idcotizaciones  (incluye detalles para master-detail)
export const getCotizacionById = async (req, res) => {
  try {
    const id = asInt(req.params.idcotizaciones ?? req.params.id);
    if (!id) return res.status(400).json({ ok: false, msg: "idcotizaciones inválido" });

    const cot = await Cotizacion.findByPk(id, {
      include: [
        { model: Vehiculo, as: "vehiculo", attributes: ["placa", "modelo", "color", "numero_documento"] },
        { model: MetodoPago, as: "metodoPago", attributes: ["idmpago", "nombremetodo"] },
        {
          model: DetalleCotizacion,
          as: "detalles",
          include: [{ model: Servicio, as: "servicio", attributes: ["idservicios", "nombreservicios", "preciounitario"] }],
        },
      ],
    });

    if (!cot) return res.status(404).json({ ok: false, msg: "Cotización no encontrada" });

    const plain = cot.toJSON();
    plain.total = safeArray(plain.detalles).reduce((acc, d) => acc + Number(d?.preciochange || 0), 0);

    return res.json({ ok: true, data: plain });
  } catch (err) {
    console.error("getCotizacionById:", err);
    return res.status(500).json({ ok: false, msg: err.message || "Error en el servidor" });
  }
};

// PUT /api/cotizaciones/:idcotizaciones
// Si envías items -> reemplaza detalle (igual que pedidos)
export const updateCotizacion = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id = asInt(req.params.idcotizaciones ?? req.params.id);
    if (!id) {
      await t.rollback();
      return res.status(400).json({ ok: false, msg: "idcotizaciones inválido" });
    }

    const cot = await Cotizacion.findByPk(id, { transaction: t });
    if (!cot) {
      await t.rollback();
      return res.status(404).json({ ok: false, msg: "Cotización no encontrada" });
    }

    const { placa, idmpago, fecha } = req.body;

    // estado controlado
    if (hasOwn(req.body, "estado")) {
      const est = normalizeEstado(req.body.estado);
      if (!est) {
        await t.rollback();
        return res.status(400).json({
          ok: false,
          msg: "Estado inválido. Usa: Aprobado, Cancelado o Pendiente",
        });
      }
      cot.estado = est;
    }

    if (placa) {
      const vehiculo = await Vehiculo.findByPk(String(placa).trim(), { transaction: t });
      if (!vehiculo) {
        await t.rollback();
        return res.status(400).json({ ok: false, msg: "La placa no existe" });
      }
      cot.placa = String(placa).trim();
    }

    if (idmpago) {
      const idPago = asInt(idmpago);
      const metodo = await MetodoPago.findByPk(idPago, { transaction: t });
      if (!metodo) {
        await t.rollback();
        return res.status(400).json({ ok: false, msg: "Método de pago no válido" });
      }
      cot.idmpago = idPago;
    }

    if (fecha) cot.fecha = fecha;

    // items para master-detail (replace)
    const itemsSent =
      hasOwn(req.body, "items") || hasOwn(req.body, "detalles") || hasOwn(req.body, "servicios");
    const items = normalizeItems(req.body.items ?? req.body.detalles ?? req.body.servicios);

    if (itemsSent) {
      if (items.length === 0) {
        await t.rollback();
        return res
          .status(400)
          .json({ ok: false, msg: "Agrega al menos 1 servicio (items) para actualizar el detalle" });
      }

      // borra detalle viejo
      await DetalleCotizacion.destroy({ where: { idcotizaciones: id }, transaction: t });

      // inserta detalle nuevo
      const detalleRows = [];
      for (const it of items) {
        const v = await assertServicioExiste(it.idservicios, t);
        if (!v.ok) {
          await t.rollback();
          return res.status(400).json({ ok: false, msg: v.msg });
        }

        const precioFinal =
          it.preciochange !== null && it.preciochange !== undefined
            ? it.preciochange
            : Number(v.serv.preciounitario || 0);

        detalleRows.push({
          idcotizaciones: id,
          idservicios: it.idservicios,
          preciochange: precioFinal,
        });
      }

      await DetalleCotizacion.bulkCreate(detalleRows, { transaction: t });
    }

    await cot.save({ transaction: t });
    await t.commit();

    return res.json({ ok: true, data: cot });
  } catch (err) {
    await t.rollback();
    console.error("updateCotizacion:", err);
    return res.status(500).json({ ok: false, msg: err.message || "Error en el servidor" });
  }
};

// DELETE /api/cotizaciones/:idcotizaciones  (borra detalle primero, como pedidos)
export const deleteCotizacion = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id = asInt(req.params.idcotizaciones ?? req.params.id);
    if (!id) {
      await t.rollback();
      return res.status(400).json({ ok: false, msg: "idcotizaciones inválido" });
    }

    const cot = await Cotizacion.findByPk(id, { transaction: t });
    if (!cot) {
      await t.rollback();
      return res.status(404).json({ ok: false, msg: "Cotización no encontrada" });
    }

    // detalle primero (por FK)
    await DetalleCotizacion.destroy({ where: { idcotizaciones: id }, transaction: t });
    await cot.destroy({ transaction: t });

    await t.commit();
    return res.json({ ok: true, msg: "Cotización eliminada correctamente" });
  } catch (err) {
    await t.rollback();
    console.error("deleteCotizacion:", err);
    return res.status(500).json({ ok: false, msg: err.message || "Error en el servidor" });
  }
};

/* =========================================================
   DETALLE COTIZACIONES (puedes mantenerlo, pero ya NO es obligatorio)
   ========================================================= */

export const testDetalleCotizacion = async (req, res) => {
  return res.json({ ok: true, msg: "detallecotizaciones OK" });
};

// POST /api/detallecotizaciones
export const createDetalleCotizacion = async (req, res) => {
  try {
    const idservicios = asInt(req.body.idservicios);
    const idcotizaciones = asInt(req.body.idcotizaciones);
    const preciochange = asMoney(req.body.preciochange);

    if (!idservicios || !idcotizaciones) {
      return res.status(400).json({
        ok: false,
        msg: "idservicios e idcotizaciones son obligatorios",
      });
    }

    const cot = await Cotizacion.findByPk(idcotizaciones);
    if (!cot) return res.status(400).json({ ok: false, msg: "La cotización indicada no existe" });

    const serv = await Servicio.findByPk(idservicios);
    if (!serv) return res.status(400).json({ ok: false, msg: "El servicio indicado no existe" });

    const existe = await DetalleCotizacion.findOne({ where: { idservicios, idcotizaciones } });
    if (existe) {
      return res.status(400).json({
        ok: false,
        msg: "Ya existe un detalle con ese servicio para esta cotización",
      });
    }

    const precioFinal = preciochange ?? Number(serv.preciounitario || 0);

    const nuevo = await DetalleCotizacion.create({
      idservicios,
      idcotizaciones,
      preciochange: precioFinal,
    });

    return res.status(201).json({ ok: true, data: nuevo });
  } catch (err) {
    console.error("createDetalleCotizacion:", err);
    return res.status(500).json({ ok: false, msg: err.message || "Error en el servidor" });
  }
};

// GET /api/detallecotizaciones   o  /api/detallecotizaciones?cotizacion=1
export const getDetallesCotizacion = async (req, res) => {
  try {
    const idcotizaciones = asInt(req.query.cotizacion);
    const where = {};
    if (idcotizaciones) where.idcotizaciones = idcotizaciones;

    const data = await DetalleCotizacion.findAll({
      where,
      include: [
        { model: Servicio, as: "servicio", attributes: ["idservicios", "nombreservicios", "preciounitario"] },
        { model: Cotizacion, as: "cotizacion", attributes: ["idcotizaciones", "placa", "estado", "fecha", "idmpago"] },
      ],
      order: [["idcotizaciones", "DESC"], ["idservicios", "ASC"]],
    });

    return res.json({ ok: true, data });
  } catch (err) {
    console.error("getDetallesCotizacion:", err);
    return res.status(500).json({ ok: false, msg: err.message || "Error en el servidor" });
  }
};

// GET /api/detallecotizaciones/cotizacion/:idcotizaciones  (lo usa tu frontend)
export const getDetallesByCotizacion = async (req, res) => {
  try {
    const idcotizaciones = asInt(req.params.idcotizaciones);
    if (!idcotizaciones) return res.status(400).json({ ok: false, msg: "idcotizaciones inválido" });

    const rows = await DetalleCotizacion.findAll({
      where: { idcotizaciones },
      include: [{ model: Servicio, as: "servicio", attributes: ["idservicios", "nombreservicios", "preciounitario"] }],
      order: [["idservicios", "ASC"]],
    });

    // mismo shape que venías armando
    const detalles = rows.map((d) => ({
      idservicios: d.idservicios,
      idcotizaciones: d.idcotizaciones,
      preciochange: d.preciochange,
      servicio: d.servicio
        ? {
            idservicios: d.servicio.idservicios,
            nombreservicios: d.servicio.nombreservicios,
            preciounitario: d.servicio.preciounitario,
          }
        : null,
    }));

    return res.json({ ok: true, data: detalles });
  } catch (err) {
    console.error("getDetallesByCotizacion:", err);
    return res.status(500).json({ ok: false, msg: err.message || "Error en el servidor" });
  }
};

// GET /api/detallecotizaciones/cotizacion/:idcotizaciones/total
export const getTotalByCotizacion = async (req, res) => {
  try {
    const idcotizaciones = asInt(req.params.idcotizaciones);
    if (!idcotizaciones) return res.status(400).json({ ok: false, msg: "idcotizaciones inválido" });

    const total = await DetalleCotizacion.sum("preciochange", { where: { idcotizaciones } });
    return res.json({ ok: true, data: { idcotizaciones, total: Number(total || 0) } });
  } catch (err) {
    console.error("getTotalByCotizacion:", err);
    return res.status(500).json({ ok: false, msg: err.message || "Error en el servidor" });
  }
};

// PUT /api/detallecotizaciones/cotizacion/:idcotizaciones/servicio/:idservicios
export const updateDetalleCotizacion = async (req, res) => {
  try {
    const idcotizaciones = asInt(req.params.idcotizaciones);
    const idservicios = asInt(req.params.idservicios);
    const preciochange = asMoney(req.body.preciochange);

    if (!idcotizaciones || !idservicios) {
      return res.status(400).json({ ok: false, msg: "Parámetros inválidos" });
    }

    const detalle = await DetalleCotizacion.findOne({ where: { idcotizaciones, idservicios } });
    if (!detalle) {
      return res.status(404).json({ ok: false, msg: "No se encontró el detalle para actualizar" });
    }

    if (preciochange === null) {
      return res.status(400).json({ ok: false, msg: "preciochange es obligatorio y debe ser numérico" });
    }

    detalle.preciochange = preciochange;
    await detalle.save();

    return res.json({ ok: true, data: detalle });
  } catch (err) {
    console.error("updateDetalleCotizacion:", err);
    return res.status(500).json({ ok: false, msg: err.message || "Error en el servidor" });
  }
};

// DELETE /api/detallecotizaciones/cotizacion/:idcotizaciones/servicio/:idservicios
export const deleteDetalleCotizacion = async (req, res) => {
  try {
    const idcotizaciones = asInt(req.params.idcotizaciones);
    const idservicios = asInt(req.params.idservicios);

    if (!idcotizaciones || !idservicios) {
      return res.status(400).json({ ok: false, msg: "Parámetros inválidos" });
    }

    const rowsDeleted = await DetalleCotizacion.destroy({ where: { idcotizaciones, idservicios } });
    if (!rowsDeleted) {
      return res.status(404).json({ ok: false, msg: "No se encontró el detalle para eliminar" });
    }

    return res.json({ ok: true, msg: "Detalle eliminado correctamente" });
  } catch (err) {
    console.error("deleteDetalleCotizacion:", err);
    return res.status(500).json({ ok: false, msg: err.message || "Error en el servidor" });
  }
};
