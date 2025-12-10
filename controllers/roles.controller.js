// server/controllers/roles.controller.js
import { Op } from "sequelize";
import Rol from "../models/roles.model.js";

export const listRoles = async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const where = search
      ? { descripcion: { [Op.like]: `%${search}%` } }
      : undefined;

    const rows = await Rol.findAll({
      where,
      order: [["idroles", "ASC"]],
    });

    return res.json({ ok: true, data: rows });
  } catch (e) {
    console.error("listRoles:", e);
    return res.status(500).json({ ok: false, msg: "Error en el servidor" });
  }
};

export const getRole = async (req, res) => {
  try {
    const idroles = Number(req.params.idroles);
    if (!Number.isFinite(idroles)) return res.status(400).json({ ok: false, msg: "idroles inválido" });

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
    if (!descripcion) return res.status(400).json({ ok: false, msg: "La descripción es obligatoria" });

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
    if (!Number.isFinite(idroles)) return res.status(400).json({ ok: false, msg: "idroles inválido" });

    const descripcion = String(req.body.descripcion || "").trim();
    if (!descripcion) return res.status(400).json({ ok: false, msg: "La descripción es obligatoria" });

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
    if (!Number.isFinite(idroles)) return res.status(400).json({ ok: false, msg: "idroles inválido" });

    const row = await Rol.findByPk(idroles);
    if (!row) return res.status(404).json({ ok: false, msg: "Rol no encontrado" });

    await row.destroy();
    return res.json({ ok: true, msg: "Rol eliminado" });
  } catch (e) {
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
