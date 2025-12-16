// server/controllers/servicios.controller.js
import Servicios from "../models/servicios.js";
import CategoriaServicios from "../models/categoriaservicios.js"; // ✅ usa el mismo nombre que en el modelo

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

// ==============================
// Crear servicio
// ==============================
export const createServicio = async (req, res) => {
  try {
    const { nombreservicios, descripcion, idcategoriaservicios, preciounitario } = req.body;

    // Validar que la categoría exista
    const categoria = await CategoriaServicios.findByPk(idcategoriaservicios);
    if (!categoria) {
      return res.status(400).json({ ok: false, msg: "Categoría no válida" });
    }

    const nuevoServicio = await Servicios.create({
      nombreservicios,
      descripcion,
      idcategoriaservicios,
      preciounitario,
    });

    return res.status(201).json({ ok: true, data: nuevoServicio });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};

// ==============================
// Listar todos los servicios (✅ paginación opcional máx 7)
// ==============================
export const getServicios = async (req, res) => {
  try {
    const includeCategoria = {
      model: CategoriaServicios,
      as: "categoriaservicios", // ✅ usa el alias correcto
      attributes: ["idcategoriaservicios", "nombrecategorias", "descripcion"],
    };

    // ✅ NO rompe: sin paginación -> igual que antes
    if (!wantsPagination(req)) {
      const servicios = await Servicios.findAll({
        include: [includeCategoria],
        order: [["idservicios", "DESC"]],
      });

      return res.json({ ok: true, data: servicios });
    }

    // ✅ paginado
    const { page, limit, offset } = getPageLimit(req);

    const { rows, count } = await Servicios.findAndCountAll({
      include: [includeCategoria],
      order: [["idservicios", "DESC"]],
      limit,
      offset,
      distinct: true, // ✅ importante cuando hay include
    });

    return res.json({
      ok: true,
      data: rows,
      pagination: buildPagination(count, page, limit),
    });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};

// ==============================
// Buscar servicio por ID
// ==============================
export const getServicioById = async (req, res) => {
  try {
    const servicio = await Servicios.findByPk(req.params.idservicios, {
      include: [
        {
          model: CategoriaServicios,
          as: "categoriaservicios",
          attributes: ["idcategoriaservicios", "nombrecategorias", "descripcion"],
        },
      ],
    });

    if (!servicio) {
      return res.status(404).json({ ok: false, msg: "Servicio no encontrado" });
    }

    return res.json({ ok: true, data: servicio });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};

// ==============================
// Actualizar servicio
// ==============================
export const updateServicio = async (req, res) => {
  try {
    const servicio = await Servicios.findByPk(req.params.idservicios);
    if (!servicio) {
      return res.status(404).json({ ok: false, msg: "Servicio no encontrado" });
    }

    // Si se envía nueva categoría, validarla
    if (req.body.idcategoriaservicios) {
      const categoria = await CategoriaServicios.findByPk(req.body.idcategoriaservicios);
      if (!categoria) {
        return res.status(400).json({ ok: false, msg: "Categoría no válida" });
      }
    }

    await servicio.update(req.body);
    return res.json({ ok: true, data: servicio });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};

// ==============================
// Eliminar servicio
// ==============================
export const deleteServicio = async (req, res) => {
  try {
    // acepta tanto /:id como /:idservicios
    const id = req.params.idservicios || req.params.id;

    if (!id) {
      return res.status(400).json({ ok: false, msg: "Id de servicio no especificado" });
    }

    const servicio = await Servicios.findByPk(id);
    if (!servicio) {
      return res.status(404).json({ ok: false, msg: "Servicio no encontrado" });
    }

    await servicio.destroy();
    return res.json({ ok: true, msg: "Servicio eliminado correctamente" });
  } catch (err) {
    const msg = String(err?.message || "");
    if (
      err?.name === "SequelizeForeignKeyConstraintError" ||
      msg.toLowerCase().includes("foreign key")
    ) {
      return res.status(409).json({
        ok: false,
        msg: "No se puede eliminar el servicio porque está relacionado con otros registros.",
      });
    }

    console.error("Error al eliminar servicio:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};
