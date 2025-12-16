// server/controllers/agendacitas.controller.js
import sequelize from "../config/db.js";
import { fn, col, literal } from "sequelize";

import Agendacita, { DetalleAgendaCita } from "../models/agendacitas.js";
import Vehiculo from "../models/vehiculo.js";
import Servicio from "../models/servicios.js";

const safeArray = (x) => (Array.isArray(x) ? x : []);
const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);

const MAX_LIMIT = 7;
const wantsPagination = (req) => hasOwn(req?.query, "page") || hasOwn(req?.query, "limit");

const getPageLimit = (req) => {
  let page = parseInt(req.query?.page ?? "1", 10);
  if (!Number.isFinite(page) || page < 1) page = 1;

  let limit = parseInt(req.query?.limit ?? String(MAX_LIMIT), 10);
  if (!Number.isFinite(limit) || limit < 1) limit = MAX_LIMIT;

  limit = Math.min(limit, MAX_LIMIT);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const buildPagination = (total, page, limit) => {
  const totalPages = Math.max(1, Math.ceil((Number(total) || 0) / limit));
  return {
    page,
    limit,
    total: Number(total) || 0,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  };
};

function normalizePlaca(v) {
  return String(v || "").toUpperCase().replace(/\s+/g, "").trim();
}

function normalizeEstado(v) {
  const s = String(v ?? "").trim();
  return s ? s : null;
}

function asInt(v) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function asMoney(v) {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseFecha(v) {
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

// items = [{ idservicios, cantidad?, precio_unitario?, notas? }]
const normalizeItems = (items) => {
  const map = new Map();

  safeArray(items).forEach((it) => {
    const idservicios = asInt(
      it?.idservicios ?? it?.idservicio ?? it?.servicio_id ?? it?.idServicio
    );
    if (!idservicios) return;

    const cantidadRaw = asInt(it?.cantidad);
    const cantidad = cantidadRaw && cantidadRaw > 0 ? cantidadRaw : 1;

    const precio_unitario = asMoney(it?.precio_unitario ?? it?.precioUnitario ?? it?.precio);

    map.set(String(idservicios), {
      idservicios,
      cantidad,
      precio_unitario,
    });
  });

  return [...map.values()];
};

async function assertServicioExiste(idservicios, t) {
  const serv = await Servicio.findByPk(idservicios, { transaction: t });
  if (!serv) return { ok: false, msg: `El servicio ${idservicios} no existe` };
  return { ok: true, serv };
}

/* =========================================================
   AGENDACITAS (MASTER) con MASTER + DETAIL (estilo cotizaciones)
   ========================================================= */

// POST /api/agendacitas
// Soporta master-detail si envías body.items = [{idservicios, cantidad?, precio_unitario?, notas?}]
export const createAgendacita = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const placa = normalizePlaca(req.body?.placa);
    const fecha = parseFecha(req.body?.fecha);
    const estado = normalizeEstado(req.body?.estado) || "Pendiente";

    const itemsSent =
      hasOwn(req.body, "items") || hasOwn(req.body, "detalles") || hasOwn(req.body, "servicios");
    const items = normalizeItems(req.body.items ?? req.body.detalles ?? req.body.servicios);

    if (!placa || !fecha) {
      await t.rollback();
      return res.status(400).json({ ok: false, msg: "Placa y fecha son obligatorios (fecha válida)." });
    }

    if (itemsSent && items.length === 0) {
      await t.rollback();
      return res.status(400).json({ ok: false, msg: "Agrega al menos 1 servicio (items) a la agenda" });
    }

    const veh = await Vehiculo.findByPk(placa, { transaction: t });
    if (!veh) {
      await t.rollback();
      return res.status(400).json({ ok: false, msg: "La placa no existe" });
    }

    const nueva = await Agendacita.create({ placa, fecha, estado }, { transaction: t });

    // inserta detalle
    if (items.length > 0) {
      const detalleRows = [];

      for (const it of items) {
        const v = await assertServicioExiste(it.idservicios, t);
        if (!v.ok) {
          await t.rollback();
          return res.status(400).json({ ok: false, msg: v.msg });
        }

        const precioFinal =
          it.precio_unitario !== null && it.precio_unitario !== undefined
            ? it.precio_unitario
            : Number(v.serv.preciounitario || 0);

        detalleRows.push({
          idagendacitas: nueva.idagendacitas,
          idservicios: it.idservicios,
          cantidad: it.cantidad,
          precio_unitario: precioFinal,
        });
      }

      await DetalleAgendaCita.bulkCreate(detalleRows, { transaction: t });
    }

    await t.commit();

    // devuelve completo (master + vehiculo + detalles)
    const full = await Agendacita.findByPk(nueva.idagendacitas, {
      include: [
        { model: Vehiculo, as: "vehiculo", attributes: ["placa", "modelo", "color", "numero_documento"] },
        {
          model: DetalleAgendaCita,
          as: "detalles",
          include: [{ model: Servicio, as: "servicio", attributes: ["idservicios", "nombreservicios", "preciounitario"] }],
        },
      ],
    });

    return res.status(201).json({ ok: true, data: full || nueva });
  } catch (err) {
    await t.rollback();
    console.error("createAgendacita:", err);
    return res.status(500).json({ ok: false, msg: "Error en el servidor", error: err.message });
  }
};

// GET /api/agendacitas?placa=XXX&estado=YYY&numero_documento=ZZZ
// ✅ Paginación opcional: ?page=1&limit=7
export const getAgendacitas = async (req, res) => {
  try {
    const placa = req.query?.placa ? normalizePlaca(req.query.placa) : "";
    const estado = req.query?.estado ? String(req.query.estado).trim() : "";
    const numero_documento = req.query?.numero_documento ? String(req.query.numero_documento).trim() : "";

    const where = {};
    if (placa) where.placa = placa;
    if (estado) where.estado = estado;

    const includeVehiculo = {
      model: Vehiculo,
      as: "vehiculo",
      attributes: ["placa", "modelo", "color", "numero_documento"],
      ...(numero_documento ? { where: { numero_documento }, required: true } : { required: false }),
    };

    // -------- sin paginación (como antes, pero ahora agrega total) -------
    if (!wantsPagination(req)) {
      const rows = await Agendacita.findAll({
        where,
        include: [includeVehiculo],
        order: [["idagendacitas", "DESC"]],
      });

      if (!rows.length) return res.json({ ok: true, data: [] });

      const ids = rows.map((a) => a.idagendacitas);

      const totales = await DetalleAgendaCita.findAll({
        attributes: [
          "idagendacitas",
          [fn("SUM", literal("cantidad * precio_unitario")), "total"],
        ],
        where: { idagendacitas: ids },
        group: ["idagendacitas"],
        raw: true,
      });

      const mapa = {};
      for (const r of totales) mapa[r.idagendacitas] = Number(r.total || 0);

      const data = rows.map((a) => {
        const json = a.toJSON();
        json.total = mapa[a.idagendacitas] || 0;
        return json;
      });

      return res.json({ ok: true, data });
    }

    // -------- paginado -------
    const { page, limit, offset } = getPageLimit(req);

    const { rows, count } = await Agendacita.findAndCountAll({
      where,
      include: [includeVehiculo],
      order: [["idagendacitas", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    if (!rows.length) {
      return res.json({ ok: true, data: [], pagination: buildPagination(count, page, limit) });
    }

    const ids = rows.map((a) => a.idagendacitas);

    const totales = await DetalleAgendaCita.findAll({
      attributes: [
        "idagendacitas",
        [fn("SUM", literal("cantidad * precio_unitario")), "total"],
      ],
      where: { idagendacitas: ids },
      group: ["idagendacitas"],
      raw: true,
    });

    const mapa = {};
    for (const r of totales) mapa[r.idagendacitas] = Number(r.total || 0);

    const data = rows.map((a) => {
      const json = a.toJSON();
      json.total = mapa[a.idagendacitas] || 0;
      return json;
    });

    return res.json({ ok: true, data, pagination: buildPagination(count, page, limit) });
  } catch (err) {
    console.error("getAgendacitas:", err);
    return res.status(500).json({ ok: false, msg: "Error listando agendamientos", error: err.message });
  }
};

// GET /api/agendacitas/:idagendacitas  (incluye detalles)
export const getAgendacitaById = async (req, res) => {
  try {
    const id = asInt(req.params.idagendacitas ?? req.params.id);
    if (!id) return res.status(400).json({ ok: false, msg: "ID inválido" });

    const row = await Agendacita.findByPk(id, {
      include: [
        { model: Vehiculo, as: "vehiculo", attributes: ["placa", "modelo", "color", "numero_documento"] },
        {
          model: DetalleAgendaCita,
          as: "detalles",
          include: [{ model: Servicio, as: "servicio", attributes: ["idservicios", "nombreservicios", "preciounitario"] }],
        },
      ],
    });

    if (!row) return res.status(404).json({ ok: false, msg: "Agendamiento no encontrado" });

    const plain = row.toJSON();
    plain.total = safeArray(plain.detalles).reduce(
      (acc, d) => acc + Number(d?.cantidad || 0) * Number(d?.precio_unitario || 0),
      0
    );

    return res.json({ ok: true, data: plain });
  } catch (err) {
    console.error("getAgendacitaById:", err);
    return res.status(500).json({ ok: false, msg: "Error obteniendo agendamiento", error: err.message });
  }
};

// PUT /api/agendacitas/:idagendacitas
// Si envías items -> reemplaza detalle (igual que cotizaciones)
export const updateAgendacita = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id = asInt(req.params.idagendacitas ?? req.params.id);
    if (!id) {
      await t.rollback();
      return res.status(400).json({ ok: false, msg: "ID inválido" });
    }

    const row = await Agendacita.findByPk(id, { transaction: t });
    if (!row) {
      await t.rollback();
      return res.status(404).json({ ok: false, msg: "Agendamiento no encontrado" });
    }

    if (hasOwn(req.body, "placa")) {
      const placa = normalizePlaca(req.body.placa);
      if (!placa) {
        await t.rollback();
        return res.status(400).json({ ok: false, msg: "Placa inválida" });
      }

      const veh = await Vehiculo.findByPk(placa, { transaction: t });
      if (!veh) {
        await t.rollback();
        return res.status(400).json({ ok: false, msg: "La placa no existe" });
      }

      row.placa = placa;
    }

    if (hasOwn(req.body, "fecha")) {
      const fecha = parseFecha(req.body.fecha);
      if (!fecha) {
        await t.rollback();
        return res.status(400).json({ ok: false, msg: "Fecha inválida" });
      }
      row.fecha = fecha;
    }

    if (hasOwn(req.body, "estado")) {
      const estado = normalizeEstado(req.body.estado);
      if (!estado) {
        await t.rollback();
        return res.status(400).json({ ok: false, msg: "Estado inválido" });
      }
      row.estado = estado;
    }

    // items -> reemplazo detalle
    const itemsSent =
      hasOwn(req.body, "items") || hasOwn(req.body, "detalles") || hasOwn(req.body, "servicios");
    const items = normalizeItems(req.body.items ?? req.body.detalles ?? req.body.servicios);

    if (itemsSent) {
      if (items.length === 0) {
        await t.rollback();
        return res.status(400).json({ ok: false, msg: "Agrega al menos 1 servicio (items) para actualizar el detalle" });
      }

      await DetalleAgendaCita.destroy({ where: { idagendacitas: id }, transaction: t });

      const detalleRows = [];
      for (const it of items) {
        const v = await assertServicioExiste(it.idservicios, t);
        if (!v.ok) {
          await t.rollback();
          return res.status(400).json({ ok: false, msg: v.msg });
        }

        const precioFinal =
          it.precio_unitario !== null && it.precio_unitario !== undefined
            ? it.precio_unitario
            : Number(v.serv.preciounitario || 0);

        detalleRows.push({
          idagendacitas: id,
          idservicios: it.idservicios,
          cantidad: it.cantidad,
          precio_unitario: precioFinal,
        });
      }

      await DetalleAgendaCita.bulkCreate(detalleRows, { transaction: t });
    }

    await row.save({ transaction: t });
    await t.commit();

    const full = await Agendacita.findByPk(id, {
      include: [
        { model: Vehiculo, as: "vehiculo", attributes: ["placa", "modelo", "color", "numero_documento"] },
        {
          model: DetalleAgendaCita,
          as: "detalles",
          include: [{ model: Servicio, as: "servicio", attributes: ["idservicios", "nombreservicios", "preciounitario"] }],
        },
      ],
    });

    return res.json({ ok: true, data: full || row });
  } catch (err) {
    await t.rollback();
    console.error("updateAgendacita:", err);
    return res.status(500).json({ ok: false, msg: "Error actualizando agendamiento", error: err.message });
  }
};

// DELETE /api/agendacitas/:idagendacitas  (borra detalle primero)
export const deleteAgendacita = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const id = asInt(req.params.idagendacitas ?? req.params.id);
    if (!id) {
      await t.rollback();
      return res.status(400).json({ ok: false, msg: "ID inválido" });
    }

    const row = await Agendacita.findByPk(id, { transaction: t });
    if (!row) {
      await t.rollback();
      return res.status(404).json({ ok: false, msg: "Agendamiento no encontrado" });
    }

    await DetalleAgendaCita.destroy({ where: { idagendacitas: id }, transaction: t });
    await row.destroy({ transaction: t });

    await t.commit();
    return res.json({ ok: true, msg: "Agendamiento eliminado correctamente" });
  } catch (err) {
    await t.rollback();
    console.error("deleteAgendacita:", err);
    return res.status(500).json({ ok: false, msg: "Error eliminando agendamiento", error: err.message });
  }
};

/* =========================================================
   DETALLE AGENDA (rutas separadas, estilo detallecotizaciones)
   ========================================================= */

export const testDetalleAgenda = async (req, res) => {
  return res.json({ ok: true, msg: "detalleagendacitas OK" });
};

// POST /api/detalleagendacitas
export const createDetalleAgenda = async (req, res) => {
  try {
    const idagendacitas = asInt(req.body.idagendacitas);
    const idservicios = asInt(req.body.idservicios);
    const cantidad = asInt(req.body.cantidad) || 1;
    const precio_unitario = asMoney(req.body.precio_unitario);

    if (!idagendacitas || !idservicios) {
      return res.status(400).json({ ok: false, msg: "idagendacitas e idservicios son obligatorios" });
    }

    const agenda = await Agendacita.findByPk(idagendacitas);
    if (!agenda) return res.status(400).json({ ok: false, msg: "La agenda indicada no existe" });

    const serv = await Servicio.findByPk(idservicios);
    if (!serv) return res.status(400).json({ ok: false, msg: "El servicio indicado no existe" });

    // evita duplicado (si creaste UNIQUE idagendacitas+idservicios)
    const existe = await DetalleAgendaCita.findOne({ where: { idagendacitas, idservicios } });
    if (existe) {
      return res.status(400).json({ ok: false, msg: "Ya existe ese servicio en esta agenda" });
    }

    const precioFinal = precio_unitario ?? Number(serv.preciounitario || 0);

    const nuevo = await DetalleAgendaCita.create({
      idagendacitas,
      idservicios,
      cantidad: cantidad > 0 ? cantidad : 1,
      precio_unitario: precioFinal,
    });

    return res.status(201).json({ ok: true, data: nuevo });
  } catch (err) {
    console.error("createDetalleAgenda:", err);
    return res.status(500).json({ ok: false, msg: err.message || "Error en el servidor" });
  }
};

// GET /api/detalleagendacitas  o  /api/detalleagendacitas?agenda=1
export const getDetallesAgenda = async (req, res) => {
  try {
    const idagendacitas = asInt(req.query.agenda);
    const where = {};
    if (idagendacitas) where.idagendacitas = idagendacitas;

    const data = await DetalleAgendaCita.findAll({
      where,
      include: [
        { model: Servicio, as: "servicio", attributes: ["idservicios", "nombreservicios", "preciounitario"] },
        { model: Agendacita, as: "agenda", attributes: ["idagendacitas", "placa", "estado", "fecha"] },
      ],
      order: [["idagendacitas", "DESC"], ["idservicios", "ASC"]],
    });

    return res.json({ ok: true, data });
  } catch (err) {
    console.error("getDetallesAgenda:", err);
    return res.status(500).json({ ok: false, msg: err.message || "Error en el servidor" });
  }
};

// GET /api/detalleagendacitas/agenda/:idagendacitas
// ✅ Paginación opcional: ?page=1&limit=7
export const getDetallesByAgenda = async (req, res) => {
  try {
    const idagendacitas = asInt(req.params.idagendacitas);
    if (!idagendacitas) return res.status(400).json({ ok: false, msg: "idagendacitas inválido" });

    if (!wantsPagination(req)) {
      const rows = await DetalleAgendaCita.findAll({
        where: { idagendacitas },
        include: [{ model: Servicio, as: "servicio", attributes: ["idservicios", "nombreservicios", "preciounitario"] }],
        order: [["idservicios", "ASC"]],
      });
      return res.json({ ok: true, data: rows });
    }

    const { page, limit, offset } = getPageLimit(req);

    const { rows, count } = await DetalleAgendaCita.findAndCountAll({
      where: { idagendacitas },
      include: [{ model: Servicio, as: "servicio", attributes: ["idservicios", "nombreservicios", "preciounitario"] }],
      order: [["idservicios", "ASC"]],
      limit,
      offset,
      distinct: true,
    });

    return res.json({ ok: true, data: rows, pagination: buildPagination(count, page, limit) });
  } catch (err) {
    console.error("getDetallesByAgenda:", err);
    return res.status(500).json({ ok: false, msg: err.message || "Error en el servidor" });
  }
};

// GET /api/detalleagendacitas/agenda/:idagendacitas/total
export const getTotalByAgenda = async (req, res) => {
  try {
    const idagendacitas = asInt(req.params.idagendacitas);
    if (!idagendacitas) return res.status(400).json({ ok: false, msg: "idagendacitas inválido" });

    const total = await DetalleAgendaCita.sum(literal("cantidad * precio_unitario"), {
      where: { idagendacitas },
    });

    return res.json({ ok: true, data: { idagendacitas, total: Number(total || 0) } });
  } catch (err) {
    console.error("getTotalByAgenda:", err);
    return res.status(500).json({ ok: false, msg: err.message || "Error en el servidor" });
  }
};

// PUT /api/detalleagendacitas/agenda/:idagendacitas/servicio/:idservicios
export const updateDetalleAgenda = async (req, res) => {
  try {
    const idagendacitas = asInt(req.params.idagendacitas);
    const idservicios = asInt(req.params.idservicios);

    const cantidad = hasOwn(req.body, "cantidad") ? asInt(req.body.cantidad) : null;
    const precio_unitario = hasOwn(req.body, "precio_unitario") ? asMoney(req.body.precio_unitario) : null;
  

    if (!idagendacitas || !idservicios) return res.status(400).json({ ok: false, msg: "Parámetros inválidos" });

    const detalle = await DetalleAgendaCita.findOne({ where: { idagendacitas, idservicios } });
    if (!detalle) return res.status(404).json({ ok: false, msg: "No se encontró el detalle para actualizar" });

    if (cantidad !== null) {
      if (!cantidad || cantidad < 1) return res.status(400).json({ ok: false, msg: "cantidad inválida" });
      detalle.cantidad = cantidad;
    }

    if (precio_unitario !== null) {
      if (precio_unitario === null) return res.status(400).json({ ok: false, msg: "precio_unitario inválido" });
      detalle.precio_unitario = precio_unitario;
    }

    await detalle.save();
    return res.json({ ok: true, data: detalle });
  } catch (err) {
    console.error("updateDetalleAgenda:", err);
    return res.status(500).json({ ok: false, msg: err.message || "Error en el servidor" });
  }
};

// DELETE /api/detalleagendacitas/agenda/:idagendacitas/servicio/:idservicios
export const deleteDetalleAgenda = async (req, res) => {
  try {
    const idagendacitas = asInt(req.params.idagendacitas);
    const idservicios = asInt(req.params.idservicios);

    if (!idagendacitas || !idservicios) return res.status(400).json({ ok: false, msg: "Parámetros inválidos" });

    const rowsDeleted = await DetalleAgendaCita.destroy({ where: { idagendacitas, idservicios } });
    if (!rowsDeleted) return res.status(404).json({ ok: false, msg: "No se encontró el detalle para eliminar" });

    return res.json({ ok: true, msg: "Detalle eliminado correctamente" });
  } catch (err) {
    console.error("deleteDetalleAgenda:", err);
    return res.status(500).json({ ok: false, msg: err.message || "Error en el servidor" });
  }
};
 