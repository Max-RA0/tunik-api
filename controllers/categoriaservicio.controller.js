// server/controllers/categoriaservicio.controller.js
import CategoriaServicio from "../models/categoriaservicio.js";

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);
const MAX_LIMIT = 7;

// Crear
export const create = async (req, res) => {
  try {
    const categoria = await CategoriaServicio.create(req.body);
    res.json(categoria);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Listar todas (✅ con paginación máx 7)
export const findAll = async (req, res) => {
  try {
    const wantsPagination = hasOwn(req.query, "page") || hasOwn(req.query, "limit");

    // ✅ NO rompe: si no mandan page/limit, se comporta igual que antes
    if (!wantsPagination) {
      const categorias = await CategoriaServicio.findAll();
      return res.json(categorias);
    }

    // ✅ paginado
    let page = parseInt(req.query.page ?? "1", 10);
    if (!Number.isFinite(page) || page < 1) page = 1;

    let limit = parseInt(req.query.limit ?? String(MAX_LIMIT), 10);
    if (!Number.isFinite(limit) || limit < 1) limit = MAX_LIMIT;
    limit = Math.min(limit, MAX_LIMIT); // ✅ cap a 7

    const offset = (page - 1) * limit;

    const { rows, count } = await CategoriaServicio.findAndCountAll({
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
    res.status(500).json({ error: err.message });
  }
};

// Buscar por ID
export const findOne = async (req, res) => {
  try {
    const categoria = await CategoriaServicio.findByPk(req.params.id);
    categoria
      ? res.json(categoria)
      : res.status(404).json({ message: "No encontrada" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Editar
export const update = async (req, res) => {
  try {
    const categoria = await CategoriaServicio.findByPk(req.params.id);
    if (!categoria) return res.status(404).json({ message: "No encontrada" });

    await categoria.update(req.body);
    res.json(categoria);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Eliminar
export const remove = async (req, res) => {
  try {
    const categoria = await CategoriaServicio.findByPk(req.params.id);
    if (!categoria) return res.status(404).json({ message: "No encontrada" });

    await categoria.destroy();
    res.json({ message: "Eliminada con éxito" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
