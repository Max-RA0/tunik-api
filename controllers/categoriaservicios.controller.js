// server/controllers/categoriaservicios.controller.js
import { Op } from "sequelize";
import CategoriaServicios from "../models/categoriaservicios.js";

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);
const MAX_LIMIT = 7;

// Crear categoría
export const create = async (req, res) => {
  try {
    const { nombrecategorias, descripcion } = req.body;

    if (!nombrecategorias || !String(nombrecategorias).trim()) {
      return res.status(400).json({ ok: false, msg: "El nombre es obligatorio" });
    }

    const created = await CategoriaServicios.create({
      nombrecategorias: String(nombrecategorias).trim(),
      descripcion: descripcion ?? null,
    });

    res.status(201).json({ ok: true, data: created });
  } catch (err) {
    console.error("create categoriaservicios:", err);
    res.status(500).json({ ok: false, msg: "Error creando categoría", detail: err.message });
  }
};

// Listar con búsqueda opcional (?q=) + paginación opcional (?page=&limit=) máx 7
export const findAll = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();

    const where = q
      ? {
          [Op.or]: [
            { nombrecategorias: { [Op.like]: `%${q}%` } },
            { descripcion: { [Op.like]: `%${q}%` } },
          ],
        }
      : {};

    const wantsPagination = hasOwn(req.query, "page") || hasOwn(req.query, "limit");

    // ✅ NO rompe: si no envían page/limit, se comporta como antes
    if (!wantsPagination) {
      const rows = await CategoriaServicios.findAll({
        where,
        order: [["idcategoriaservicios", "ASC"]],
      });

      return res.json({ ok: true, data: rows });
    }

    // ✅ paginación (máx 7)
    let page = parseInt(req.query.page ?? "1", 10);
    if (!Number.isFinite(page) || page < 1) page = 1;

    let limit = parseInt(req.query.limit ?? String(MAX_LIMIT), 10);
    if (!Number.isFinite(limit) || limit < 1) limit = MAX_LIMIT;

    limit = Math.min(limit, MAX_LIMIT);
    const offset = (page - 1) * limit;

    const { rows, count } = await CategoriaServicios.findAndCountAll({
      where,
      order: [["idcategoriaservicios", "ASC"]],
      limit,
      offset,
      distinct: true,
    });

    const totalPages = Math.max(1, Math.ceil((Number(count) || 0) / limit));

    return res.json({
      ok: true,
      data: rows,
      pagination: {
        page,
        limit,
        total: Number(count) || 0,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
    });
  } catch (err) {
    console.error("findAll categoriaservicios:", err);
    res.status(500).json({ ok: false, msg: "Error en findAll", detail: err.message });
  }
};

// Obtener por ID
export const findOne = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await CategoriaServicios.findByPk(id);

    if (!item) return res.status(404).json({ ok: false, msg: "No encontrada" });

    res.json({ ok: true, data: item });
  } catch (err) {
    console.error("findOne categoriaservicios:", err);
    res.status(500).json({ ok: false, msg: "Error buscando categoría", detail: err.message });
  }
};

// Actualizar
export const update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await CategoriaServicios.findByPk(id);

    if (!item) return res.status(404).json({ ok: false, msg: "No encontrada" });

    const { nombrecategorias, descripcion } = req.body;

    if (nombrecategorias !== undefined && !String(nombrecategorias).trim()) {
      return res.status(400).json({ ok: false, msg: "El nombre no puede estar vacío" });
    }

    await item.update({
      nombrecategorias:
        nombrecategorias !== undefined ? String(nombrecategorias).trim() : item.nombrecategorias,
      descripcion: descripcion !== undefined ? descripcion : item.descripcion,
    });

    res.json({ ok: true, data: item });
  } catch (err) {
    console.error("update categoriaservicios:", err);
    res.status(500).json({ ok: false, msg: "Error actualizando categoría", detail: err.message });
  }
};

// Eliminar
export const remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await CategoriaServicios.findByPk(id);

    if (!item) return res.status(404).json({ ok: false, msg: "No encontrada" });

    await item.destroy();
    res.json({ ok: true, msg: "Eliminada con éxito" });
  } catch (err) {
    console.error("remove categoriaservicios:", err);
    res.status(500).json({ ok: false, msg: "Error eliminando categoría", detail: err.message });
  }
};
