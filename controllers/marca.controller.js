// server/controllers/marca.controller.js
import Marca from "../models/marca.js";

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);
const MAX_LIMIT = 7;

// Crear una nueva marca
export const create = async (req, res) => {
  try {
    const { descripcion } = req.body;

    if (!descripcion || !String(descripcion).trim()) {
      return res.status(400).json({ ok: false, msg: "La descripcion es obligatorio" });
    }

    const nuevaMarca = await Marca.create({ descripcion: String(descripcion).trim() });
    return res.status(201).json({ ok: true, data: nuevaMarca });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, msg: "Error creando la marca" });
  }
};

// Listar todas las marcas (✅ con paginación opcional máx 7)
export const findAll = async (req, res) => {
  try {
    const wantsPagination = hasOwn(req.query, "page") || hasOwn(req.query, "limit");

    // ✅ NO rompe: sin paginación -> igual que antes
    if (!wantsPagination) {
      const marcas = await Marca.findAll();
      return res.json({ ok: true, data: marcas });
    }

    // ✅ paginado (máx 7)
    let page = parseInt(req.query.page ?? "1", 10);
    if (!Number.isFinite(page) || page < 1) page = 1;

    let limit = parseInt(req.query.limit ?? String(MAX_LIMIT), 10);
    if (!Number.isFinite(limit) || limit < 1) limit = MAX_LIMIT;

    limit = Math.min(limit, MAX_LIMIT);
    const offset = (page - 1) * limit;

    const { rows, count } = await Marca.findAndCountAll({
      order: [["idmarca", "DESC"]], // ajusta si tu PK se llama distinto
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
    console.error(err);
    return res.status(500).json({ ok: false, msg: "Error listando marcas" });
  }
};

// Buscar marca por ID
export const findOne = async (req, res) => {
  try {
    const marca = await Marca.findByPk(req.params.id);

    if (!marca) {
      return res.status(404).json({ ok: false, msg: "Marca no encontrada" });
    }

    return res.json({ ok: true, data: marca });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, msg: "Error obteniendo la marca" });
  }
};

// Actualizar marca
export const update = async (req, res) => {
  try {
    const marca = await Marca.findByPk(req.params.id);

    if (!marca) {
      return res.status(404).json({ ok: false, msg: "Marca no encontrada" });
    }

    const { descripcion } = req.body;

    if (descripcion !== undefined && !String(descripcion).trim()) {
      return res.status(400).json({ ok: false, msg: "La descripcion no puede estar vacía" });
    }

    await marca.update({
      descripcion: descripcion !== undefined ? String(descripcion).trim() : marca.descripcion,
    });

    return res.json({ ok: true, data: marca });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, msg: "Error actualizando la marca" });
  }
};

// Eliminar marca (✅ corregido)
export const remove = async (req, res) => {
  try {
    const marca = await Marca.findByPk(req.params.id);

    if (!marca) {
      return res.status(404).json({ ok: false, msg: "Marca no encontrada" });
    }

    await marca.destroy();
    return res.json({ ok: true, msg: "Marca eliminada correctamente" });
  } catch (err) {
    // ✅ Si tu proyecto tiene helpers FK, puedes usarlos aquí.
    // Si NO existen, igual devolvemos un 409 genérico si suena a FK.
    const msg = String(err?.message || "");
    if (
      err?.name === "SequelizeForeignKeyConstraintError" ||
      msg.toLowerCase().includes("foreign key")
    ) {
      return res.status(409).json({
        ok: false,
        msg: "No se puede eliminar la marca porque está relacionada con otros registros.",
      });
    }

    console.error(err);
    return res.status(500).json({ ok: false, msg: "Error eliminando la marca", error: err.message });
  }
};
