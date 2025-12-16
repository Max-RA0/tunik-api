// server/controllers/evaluacionservicios.controller.js
import { Op } from "sequelize";
import EvaluacionServicio from "../models/evaluacionservicios.model.js";
import Usuario from "../models/usuarios.js";
import Servicio from "../models/servicios.js";

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);
const MAX_LIMIT = 7;

function wantsPagination(req) {
  return hasOwn(req?.query, "page") || hasOwn(req?.query, "limit");
}

function getPageLimit(req) {
  let page = parseInt(req.query?.page ?? "1", 10);
  if (!Number.isFinite(page) || page < 1) page = 1;

  let limit = parseInt(req.query?.limit ?? String(MAX_LIMIT), 10);
  if (!Number.isFinite(limit) || limit < 1) limit = MAX_LIMIT;

  limit = Math.min(limit, MAX_LIMIT); // ✅ máximo 7
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

function buildPagination(total, page, limit) {
  const totalPages = Math.max(1, Math.ceil((Number(total) || 0) / limit));
  return {
    page,
    limit,
    total: Number(total) || 0,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  };
}

function normalizeRating(input) {
  const n =
    input?.calificacion ??
    input?.respuestacalificacion ??
    input?.rating ??
    input?.score;

  const num = Number(n);
  if (!Number.isFinite(num)) return null;
  const i = Math.trunc(num);
  return i >= 1 && i <= 5 ? i : null;
}

function normalizeComentario(v, max = 500) {
  const s = String(v ?? "").trim();
  if (s.length > max) return { ok: false, msg: `comentarios máximo ${max} caracteres` };
  return { ok: true, value: s };
}

function exposeRow(row) {
  const plain = row.get ? row.get({ plain: true }) : row;
  const cal = Number(plain.respuestacalificacion);
  return {
    ...plain,
    calificacion: Number.isFinite(cal) ? cal : null,
  };
}

// GET /api/evaluaciones?search=XYZ
// ✅ Paginación opcional: ?page=1&limit=7
export async function list(req, res) {
  try {
    const q = String(req.query.search ?? "").trim();

    let where;
    if (q) {
      const or = [
        { numero_documento: { [Op.like]: `%${q}%` } },
        { respuestacalificacion: { [Op.like]: `%${q}%` } },
        { comentarios: { [Op.like]: `%${q}%` } },
      ];

      // Si es numérico, también busca por idevaluacion o idservicios
      if (/^\d+$/.test(q)) {
        const n = Number(q);
        or.push({ idevaluacion: n });
        or.push({ idservicios: n });
      }

      where = { [Op.or]: or };
    }

    // ✅ NO rompe: si no piden paginación -> igual que antes
    if (!wantsPagination(req)) {
      const rows = await EvaluacionServicio.findAll({
        where,
        order: [["idevaluacion", "DESC"]],
      });

      return res.json({ ok: true, data: rows.map(exposeRow) });
    }

    // ✅ paginado (máx 7)
    const { page, limit, offset } = getPageLimit(req);

    const { rows, count } = await EvaluacionServicio.findAndCountAll({
      where,
      order: [["idevaluacion", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    return res.json({
      ok: true,
      data: rows.map(exposeRow),
      pagination: buildPagination(count, page, limit),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, msg: "Error listando evaluaciones" });
  }
}

// GET /api/evaluaciones/:id
export async function getOne(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ ok: false, msg: "id inválido" });
    }

    const row = await EvaluacionServicio.findByPk(id);
    if (!row) return res.status(404).json({ ok: false, msg: "No encontrado" });

    return res.json({ ok: true, data: exposeRow(row) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, msg: "Error obteniendo evaluación" });
  }
}

// POST /api/evaluaciones
export async function create(req, res) {
  try {
    const { numero_documento, idservicios } = req.body;
    const rating = normalizeRating(req.body);

    if (!numero_documento || !idservicios) {
      return res
        .status(400)
        .json({ ok: false, msg: "numero_documento e idservicios son requeridos" });
    }

    if (rating == null) {
      return res
        .status(400)
        .json({ ok: false, msg: "calificacion debe ser un entero 1–5" });
    }

    const c = normalizeComentario(req.body.comentarios);
    if (!c.ok) return res.status(400).json({ ok: false, msg: c.msg });

    // validar existencia de usuario/servicio
    const user = await Usuario.findByPk(String(numero_documento));
    if (!user) return res.status(404).json({ ok: false, msg: "Usuario no existe" });

    const serv = await Servicio.findByPk(Number(idservicios));
    if (!serv) return res.status(404).json({ ok: false, msg: "Servicio no existe" });

    const created = await EvaluacionServicio.create({
      numero_documento: String(numero_documento),
      idservicios: Number(idservicios),
      respuestacalificacion: String(rating),
      comentarios: c.value,
    });

    return res.status(201).json({ ok: true, data: exposeRow(created) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, msg: "Error creando evaluación" });
  }
}

// PUT /api/evaluaciones/:id
export async function update(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ ok: false, msg: "id inválido" });
    }

    const row = await EvaluacionServicio.findByPk(id);
    if (!row) return res.status(404).json({ ok: false, msg: "No encontrado" });

    const updates = {};

    if (req.body.numero_documento != null && String(req.body.numero_documento).trim() !== "") {
      updates.numero_documento = String(req.body.numero_documento).trim();
    }

    if (req.body.idservicios != null && String(req.body.idservicios).trim() !== "") {
      updates.idservicios = Number(req.body.idservicios);
      if (!Number.isFinite(updates.idservicios)) {
        return res.status(400).json({ ok: false, msg: "idservicios inválido" });
      }
    }

    if (
      req.body.calificacion != null ||
      req.body.respuestacalificacion != null ||
      req.body.rating != null ||
      req.body.score != null
    ) {
      const r = normalizeRating(req.body);
      if (r == null) {
        return res.status(400).json({ ok: false, msg: "calificacion debe ser 1–5" });
      }
      updates.respuestacalificacion = String(r);
    }

    if (req.body.comentarios != null) {
      const c = normalizeComentario(req.body.comentarios);
      if (!c.ok) return res.status(400).json({ ok: false, msg: c.msg });
      updates.comentarios = c.value;
    }

    await row.update(updates);
    return res.json({ ok: true, data: exposeRow(row) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, msg: "Error actualizando evaluación" });
  }
}

// DELETE /api/evaluaciones/:id
export async function remove(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ ok: false, msg: "id inválido" });
    }

    const row = await EvaluacionServicio.findByPk(id);
    if (!row) return res.status(404).json({ ok: false, msg: "No encontrado" });

    await row.destroy();
    return res.json({ ok: true, msg: "Eliminado" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, msg: "Error eliminando evaluación" });
  }
}
