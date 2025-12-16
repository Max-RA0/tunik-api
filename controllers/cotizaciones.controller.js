// server/controllers/cotizaciones.controller.js
import sequelize from "../config/db.js";
import { QueryTypes, fn, col } from "sequelize";

import Cotizacion, { DetalleCotizacion } from "../models/cotizaciones.js";
import Vehiculo from "../models/vehiculo.js";
import MetodoPago from "../models/metodospago.js";
import Servicio from "../models/servicios.js";

/* =========================
   Helpers
========================= */
const safeArray = (x) => (Array.isArray(x) ? x : []);
const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);

// ✅ Paginación
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
      it?.preciochange ??
        it?.precio ??
        it?.precioFinal ??
        it?.precioChange ??
        it?.precio_unitario ??
        it?.precioUnitario
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
   ✅ Agenda -> traer placa y sus servicios (detalle)
   - Usamos RAW SQL para que no dependas de modelos extra.
   - IMPORTANTE: si tu tabla detalle tiene otro nombre,
     edita la lista de queries abajo.
========================================================= */
async function getAgendaHeader(idagendacitas, t) {
  const id = asInt(idagendacitas);
  if (!id) return null;

  const rows = await sequelize.query(
    `SELECT idagendacitas, placa
     FROM agendacitas
     WHERE idagendacitas = :id
     LIMIT 1`,
    { replacements: { id }, type: QueryTypes.SELECT, transaction: t }
  );

  return rows?.[0] ?? null;
}

async function getAgendaDetalleRows(idagendacitas, t) {
  const id = asInt(idagendacitas);
  if (!id) return [];

  // 👇 Intenta varios nombres por si tu tabla detalle se llama diferente
  const candidates = [
    // el más común que usamos en este proyecto:
    {
      sql: `SELECT idservicios, precio_unitario
            FROM detalleagendacitas
            WHERE idagendacitas = :id`,
    },
    // alternativas posibles:
    {
      sql: `SELECT idservicios, precio_unitario
            FROM detalle_agendacitas
            WHERE idagendacitas = :id`,
    },
    {
      sql: `SELECT idservicios, precio_unitario
            FROM detalleagenda
            WHERE idagendacitas = :id`,
    },
    {
      sql: `SELECT idservicios, precio_unitario
            FROM detalleagendas
            WHERE idagendacitas = :id`,
    },
  ];

  for (const c of candidates) {
    try {
      const rows = await sequelize.query(c.sql, {
        replacements: { id },
        type: QueryTypes.SELECT,
        transaction: t,
      });

      if (Array.isArray(rows)) return rows;
    } catch {
      // intenta el siguiente candidato
    }
  }

  // si ninguna pegó, devolvemos vacío (y el controller lo validará)
  return [];
}

async function getItemsFromAgenda(idagendacitas, t) {
  const rows = await getAgendaDetalleRows(idagendacitas, t);
  // convertimos al formato de cotización: {idservicios, preciochange}
  return normalizeItems(
    safeArray(rows).map((r) => ({
      idservicios: r?.idservicios,
      // si la agenda guarda precio_unitario, lo usamos como preciochange
      preciochange: r?.precio_unitario ?? r?.preciochange ?? null,
    }))
  );
}

/* =========================================================
   COTIZACIONES (MASTER) - ahora con AGENDA
========================================================= */

// POST /api/cotizaciones
// ✅ Soporta:
// - body.idagendacitas -> trae servicios de esa agenda y los mete al detalle
// - body.items -> extras (se mezclan)
export const createCotizacion = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const idagendacitas = asInt(req.body.idagendacitas ?? req.body.idAgendaCitas ?? req.body.idagenda);

    // ✅ si viene agenda, buscamos su placa (y luego validamos/llenamos)
    const agenda = idagendacitas ? await getAgendaHeader(idagendacitas, t) : null;
    if (idagendacitas && !agenda) {
      await t.rollback();
      return res.status(400).json({ ok: false, msg: "La agenda seleccionada no existe" });
    }

    let placa = String(req.body.placa ?? "").trim();
    const idmpago = asInt(req.body.idmpago ?? req.body.idMetodoPago);
    const estadoIn = req.body.estado ?? "Pendiente";
    const estado = normalizeEstado(estadoIn);
    const fecha = req.body.fecha; // opcional

    // items (extras)
    const itemsSent =
      hasOwn(req.body, "items") || hasOwn(req.body, "detalles") || hasOwn(req.body, "servicios");
    const bodyItems = normalizeItems(req.body.items ?? req.body.detalles ?? req.body.servicios);

    // ✅ items desde agenda (si aplica)
    const agendaItems = idagendacitas ? await getItemsFromAgenda(idagendacitas, t) : [];

    // ✅ regla: si viene agenda y NO mandan placa, la tomamos de la agenda
    if (!placa && agenda?.placa) placa = String(agenda.placa).trim();

    // ✅ si mandan placa + agenda, deben coincidir
    if (placa && agenda?.placa && String(agenda.placa).trim() !== placa) {
      await t.rollback();
      return res.status(400).json({
        ok: false,
        msg: "La placa de la cotización no coincide con la placa de la agenda",
      });
    }

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

    // ✅ detalle final = agendaItems + bodyItems (extras)
    // orden: agenda primero, extras al final (extras ganan si repiten servicio)
    const mergedItems = normalizeItems([...agendaItems, ...bodyItems]);

    // ✅ si hay agenda o mandaron items, el detalle NO puede quedar vacío
    const detailMustExist = Boolean(idagendacitas) || itemsSent;
    if (detailMustExist && mergedItems.length === 0) {
      await t.rollback();
      return res.status(400).json({
        ok: false,
        msg: "La agenda no tiene servicios y tampoco agregaste servicios manuales",
      });
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
        fecha: fecha ?? new Date(),
        idagendacitas: idagendacitas ?? null,
      },
      { transaction: t }
    );

    // MASTER + DETAIL
    if (mergedItems.length > 0) {
      const detalleRows = [];
      for (const it of mergedItems) {
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
    if (placa) where.placa = String(placa).trim();

    if (!wantsPagination(req)) {
      const cotizaciones = await Cotizacion.findAll({
        where,
        include: [
          includeVehiculo,
          { model: MetodoPago, as: "metodoPago", attributes: ["idmpago", "nombremetodo"] },
          // { model: AgendaCita, as: "agenda" } // (opcional si te sirve)
        ],
        order: [["idcotizaciones", "DESC"]],
      });

      if (!cotizaciones.length) return res.json({ ok: true, data: [] });

      const ids = cotizaciones.map((c) => c.idcotizaciones);

      const filasTotales = await DetalleCotizacion.findAll({
        attributes: ["idcotizaciones", [fn("SUM", col("preciochange")), "total"]],
        where: { idcotizaciones: ids },
        group: ["idcotizaciones"],
        raw: true,
      });

      const mapaTotales = {};
      for (const fila of filasTotales) mapaTotales[fila.idcotizaciones] = Number(fila.total || 0);

      const respuesta = cotizaciones.map((c) => {
        const json = c.toJSON();
        json.total = mapaTotales[c.idcotizaciones] || 0;
        return json;
      });

      return res.json({ ok: true, data: respuesta });
    }

    const { page, limit, offset } = getPageLimit(req);

    const { rows, count } = await Cotizacion.findAndCountAll({
      where,
      include: [
        includeVehiculo,
        { model: MetodoPago, as: "metodoPago", attributes: ["idmpago", "nombremetodo"] },
      ],
      order: [["idcotizaciones", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    if (!rows.length) {
      return res.json({
        ok: true,
        data: [],
        pagination: buildPagination(count, page, limit),
      });
    }

    const ids = rows.map((c) => c.idcotizaciones);

    const filasTotales = await DetalleCotizacion.findAll({
      attributes: ["idcotizaciones", [fn("SUM", col("preciochange")), "total"]],
      where: { idcotizaciones: ids },
      group: ["idcotizaciones"],
      raw: true,
    });

    const mapaTotales = {};
    for (const fila of filasTotales) mapaTotales[fila.idcotizaciones] = Number(fila.total || 0);

    const respuesta = rows.map((c) => {
      const json = c.toJSON();
      json.total = mapaTotales[c.idcotizaciones] || 0;
      return json;
    });

    return res.json({
      ok: true,
      data: respuesta,
      pagination: buildPagination(count, page, limit),
    });
  } catch (err) {
    console.error("getCotizaciones:", err);
    return res.status(500).json({ ok: false, msg: err.message || "Error en el servidor" });
  }
};

// GET /api/cotizaciones/:idcotizaciones
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
// ✅ Si mandas idagendacitas -> asegura que entren servicios de esa agenda
// ✅ Si mandas items -> reemplaza detalle por (agenda + items)
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

    // ✅ estado controlado
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

    // ✅ agenda (puede venir para “colgar” la cotización a la agenda)
    const agendaSent = hasOwn(req.body, "idagendacitas") || hasOwn(req.body, "idAgendaCitas") || hasOwn(req.body, "idagenda");
    let newAgendaId = null;

    if (agendaSent) {
      newAgendaId = asInt(req.body.idagendacitas ?? req.body.idAgendaCitas ?? req.body.idagenda);
      if (newAgendaId) {
        const agenda = await getAgendaHeader(newAgendaId, t);
        if (!agenda) {
          await t.rollback();
          return res.status(400).json({ ok: false, msg: "La agenda seleccionada no existe" });
        }

        // si mandan placa, debe coincidir
        if (req.body.placa && String(req.body.placa).trim() !== String(agenda.placa).trim()) {
          await t.rollback();
          return res.status(400).json({
            ok: false,
            msg: "La placa enviada no coincide con la placa de la agenda",
          });
        }

        // por seguridad, alineamos placa con la agenda
        cot.placa = String(agenda.placa).trim();
        cot.idagendacitas = newAgendaId;
      } else {
        // permiten quitar agenda
        cot.idagendacitas = null;
      }
    }

    // placa (solo si NO vino agendaSent, porque agenda manda la suya)
    if (!agendaSent && req.body.placa) {
      const placa = String(req.body.placa).trim();
      const vehiculo = await Vehiculo.findByPk(placa, { transaction: t });
      if (!vehiculo) {
        await t.rollback();
        return res.status(400).json({ ok: false, msg: "La placa no existe" });
      }
      cot.placa = placa;
    }

    // idmpago
    if (req.body.idmpago) {
      const idPago = asInt(req.body.idmpago);
      const metodo = await MetodoPago.findByPk(idPago, { transaction: t });
      if (!metodo) {
        await t.rollback();
        return res.status(400).json({ ok: false, msg: "Método de pago no válido" });
      }
      cot.idmpago = idPago;
    }

    // fecha
    if (req.body.fecha) cot.fecha = req.body.fecha;

    // items: replace detalle (pero ahora puede mezclar con agenda)
    const itemsSent =
      hasOwn(req.body, "items") || hasOwn(req.body, "detalles") || hasOwn(req.body, "servicios");
    const bodyItems = normalizeItems(req.body.items ?? req.body.detalles ?? req.body.servicios);

    // si cambió/mandó agenda -> traemos sus items
    const effectiveAgendaId = cot.idagendacitas ? Number(cot.idagendacitas) : null;
    const agendaItems = effectiveAgendaId ? await getItemsFromAgenda(effectiveAgendaId, t) : [];

    // ¿Debemos tocar detalle?
    // - si mandan items -> sí (replace por agenda+items)
    // - si mandan agenda -> sí (asegura que estén los servicios agenda sin perder extras)
    const mustTouchDetail = Boolean(itemsSent) || Boolean(agendaSent);

    if (mustTouchDetail) {
      // si solo mandaron agenda y NO mandaron items:
      // queremos conservar los servicios que ya tenía la cotización + asegurar agenda.
      let mergedItems = [];

      if (!itemsSent && agendaSent) {
        const oldRows = await DetalleCotizacion.findAll({
          where: { idcotizaciones: id },
          transaction: t,
        });

        const oldItems = normalizeItems(
          oldRows.map((r) => ({
            idservicios: r.idservicios,
            preciochange: Number(r.preciochange),
          }))
        );

        // orden: agenda primero, luego lo viejo (lo viejo mantiene cambios), sin duplicar
        mergedItems = normalizeItems([...agendaItems, ...oldItems]);
      } else if (itemsSent) {
        // orden: agenda primero, luego items del body (body gana)
        mergedItems = normalizeItems([...agendaItems, ...bodyItems]);
      }

      // si tocamos detalle, NO puede quedar vacío
      if (mergedItems.length === 0) {
        await t.rollback();
        return res.status(400).json({
          ok: false,
          msg: "Agrega al menos 1 servicio para actualizar el detalle",
        });
      }

      // replace
      await DetalleCotizacion.destroy({ where: { idcotizaciones: id }, transaction: t });

      const detalleRows = [];
      for (const it of mergedItems) {
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

// DELETE /api/cotizaciones/:idcotizaciones
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
   DETALLE COTIZACIONES (lo dejas tal cual)
========================================================= */

export const testDetalleCotizacion = async (req, res) => {
  return res.json({ ok: true, msg: "detallecotizaciones OK" });
};

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

export const getDetallesCotizacion = async (req, res) => {
  try {
    const idcotizaciones = asInt(req.query.cotizacion);
    const where = {};
    if (idcotizaciones) where.idcotizaciones = idcotizaciones;

    const data = await DetalleCotizacion.findAll({
      where,
      include: [
        { model: Servicio, as: "servicio", attributes: ["idservicios", "nombreservicios", "preciounitario"] },
        { model: Cotizacion, as: "cotizacion", attributes: ["idcotizaciones", "placa", "estado", "fecha", "idmpago", "idagendacitas"] },
      ],
      order: [["idcotizaciones", "DESC"], ["idservicios", "ASC"]],
    });

    return res.json({ ok: true, data });
  } catch (err) {
    console.error("getDetallesCotizacion:", err);
    return res.status(500).json({ ok: false, msg: err.message || "Error en el servidor" });
  }
};

export const getDetallesByCotizacion = async (req, res) => {
  try {
    const idcotizaciones = asInt(req.params.idcotizaciones);
    if (!idcotizaciones) return res.status(400).json({ ok: false, msg: "idcotizaciones inválido" });

    if (!wantsPagination(req)) {
      const rows = await DetalleCotizacion.findAll({
        where: { idcotizaciones },
        include: [{ model: Servicio, as: "servicio", attributes: ["idservicios", "nombreservicios", "preciounitario"] }],
        order: [["idservicios", "ASC"]],
      });

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
    }

    const { page, limit, offset } = getPageLimit(req);

    const { rows, count } = await DetalleCotizacion.findAndCountAll({
      where: { idcotizaciones },
      include: [{ model: Servicio, as: "servicio", attributes: ["idservicios", "nombreservicios", "preciounitario"] }],
      order: [["idservicios", "ASC"]],
      limit,
      offset,
      distinct: true,
    });

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

    return res.json({
      ok: true,
      data: detalles,
      pagination: buildPagination(count, page, limit),
    });
  } catch (err) {
    console.error("getDetallesByCotizacion:", err);
    return res.status(500).json({ ok: false, msg: err.message || "Error en el servidor" });
  }
};

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
