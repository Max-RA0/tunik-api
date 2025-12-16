import proveedor from "../models/proveedor.js";

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

// CREATE
export const create = async (req, res) => {
  try {
    const proveedores = await proveedor.create(req.body);
    return res.json(proveedores);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// LISTAR (✅ paginación opcional máx 7)
export const findAll = async (req, res) => {
  try {
    // ✅ NO rompe: sin paginación -> como antes (array)
    if (!wantsPagination(req)) {
      const proveedors = await proveedor.findAll({
        order: [["idproveedor", "DESC"]], // ajusta si tu PK se llama distinto
      });
      return res.json(proveedors);
    }

    // ✅ paginado
    const { page, limit, offset } = getPageLimit(req);

    const { rows, count } = await proveedor.findAndCountAll({
      order: [["idproveedor", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    return res.json({
      ok: true,
      data: rows,
      pagination: buildPagination(count, page, limit),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// BUSCAR POR ID
export const findOne = async (req, res) => {
  try {
    const proveedores = await proveedor.findByPk(req.params.id);
    return proveedores
      ? res.json(proveedores)
      : res.status(404).json({ message: "No encontrado" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// EDITAR
export const update = async (req, res) => {
  try {
    const proveedores = await proveedor.findByPk(req.params.id);
    if (!proveedores) return res.status(404).json({ message: "No encontrado" });

    await proveedores.update(req.body);
    return res.json(proveedores);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// ELIMINAR
export const remove = async (req, res) => {
  try {
    const proveedores = await proveedor.findByPk(req.params.id);
    if (!proveedores) return res.status(404).json({ message: "No encontrado" });

    await proveedores.destroy();
    return res.json({ message: "Eliminado con éxito" });
  } catch (err) {
    const msg = String(err?.message || "");
    if (
      err?.name === "SequelizeForeignKeyConstraintError" ||
      msg.toLowerCase().includes("foreign key")
    ) {
      return res.status(409).json({
        message: "No se puede eliminar el proveedor porque está relacionado con otros registros.",
      });
    }

    return res.status(500).json({ error: err.message });
  }
};
