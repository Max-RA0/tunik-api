// server/controllers/roles.controller.js
import { Op } from "sequelize";
import Rol from "../models/roles.model.js";

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);
const MAX_LIMIT = 7;

const wantsPagination = (req) => hasOwn(req?.query, "page") || hasOwn(req?.query, "limit");

const getPageLimit = (req) => {
  let page = parseInt(req.query?.page ?? "1", 10);
  if (!Number.isFinite(page) || page < 1) page = 1;

  let limit = parseInt(req.query?.limit ?? String(MAX_LIMIT), 10);
  if (!Number.isFinite(limit) || limit < 1) limit = MAX_LIMIT;

  limit = Math.min(limit, MAX_LIMIT); // ✅ máximo 7
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

export const listRoles = async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const where = search
      ? { descripcion: { [Op.like]: `%${search}%` } }
      : undefined;

    // ✅ NO rompe: sin paginación -> igual que antes
    if (!wantsPagination(req)) {
      const rows = await Rol.findAll({
        where,
        order: [["idroles", "ASC"]],
      });
      return res.json({ ok: true, data: rows });
    }

    // ✅ paginado (máx 7)
    const { page, limit, offset } = getPageLimit(req);

    const { rows, count } = await Rol.findAndCountAll({
      where,
      order: [["idroles", "ASC"]],
      limit,
      offset,
      distinct: true,
    });

    return res.json({
      ok: true,
      data: rows,
      pagination: buildPagination(count, page, limit),
    });
  } catch (e) {
    console.error("listRoles:", e);
    return res.status(500).json({ ok: false, msg: "Error en el servidor" });
  }
};

export const getRole = async (req, res) => {
  try {
    const idroles = Number(req.params.idroles);
    if (!Number.isFinite(idroles))
      return res.status(400).json({ ok: false, msg: "idroles inválido" });

    const row = await Rol.findByPk(idroles);
    if (!row) return res.status(404).json({ ok: false, msg: "Rol no encontrado" });

    return res.json({ ok: true, data: row });
  } catch (e) {
    console.error("getRole:", e);
    return res.status(500).json({ ok: false, msg: "Error en el servidor" });
  }
};

export const createRole = async (req, res) => {
  try {
    const descripcion = String(req.body.descripcion || "").trim();
    if (!descripcion)
      return res.status(400).json({ ok: false, msg: "La descripción es obligatoria" });

    const created = await Rol.create({ descripcion });
    return res.status(201).json({ ok: true, msg: "Rol creado", data: created });
  } catch (e) {
    console.error("createRole:", e);
    return res.status(500).json({ ok: false, msg: "Error en el servidor" });
  }
};

export const updateRole = async (req, res) => {
  try {
    const idroles = Number(req.params.idroles);
    if (!Number.isFinite(idroles))
      return res.status(400).json({ ok: false, msg: "idroles inválido" });

    const descripcion = String(req.body.descripcion || "").trim();
    if (!descripcion)
      return res.status(400).json({ ok: false, msg: "La descripción es obligatoria" });

    const row = await Rol.findByPk(idroles);
    if (!row) return res.status(404).json({ ok: false, msg: "Rol no encontrado" });

    await row.update({ descripcion });
    return res.json({ ok: true, msg: "Rol actualizado", data: row });
  } catch (e) {
    console.error("updateRole:", e);
    return res.status(500).json({ ok: false, msg: "Error en el servidor" });
  }
};

export const deleteRole = async (req, res) => {
  try {
    const idroles = Number(req.params.idroles);
    if (!Number.isFinite(idroles))
      return res.status(400).json({ ok: false, msg: "idroles inválido" });

    const row = await Rol.findByPk(idroles);
    if (!row) return res.status(404).json({ ok: false, msg: "Rol no encontrado" });

    await row.destroy();
    return res.json({ ok: true, msg: "Rol eliminado" });
  } catch (e) {
    // FK (si rol está relacionado)
    const msg = String(e?.message || "");
    if (
      e?.name === "SequelizeForeignKeyConstraintError" ||
      msg.toLowerCase().includes("foreign key")
    ) {
      return res.status(409).json({
        ok: false,
        msg: "No se puede eliminar el rol porque está relacionado con otros registros.",
      });
    }

    console.error("deleteRole:", e);
    return res.status(500).json({ ok: false, msg: "Error en el servidor" });
  }
};

// ✅ extra: default export (por si algún route te lo importaba como default)
export default {
  listRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
};
