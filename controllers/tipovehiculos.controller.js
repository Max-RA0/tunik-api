import TipoVehiculos from "../models/tipovehiculos.js";

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

// Obtener todos (✅ paginación opcional)
export const getTipoVehiculos = async (req, res) => {
  try {
    // ✅ NO rompe: sin paginación -> como antes (array)
    if (!wantsPagination(req)) {
      const tipos = await TipoVehiculos.findAll({
        order: [["idtipovehiculos", "DESC"]], // ajusta si tu PK se llama distinto
      });
      return res.json(tipos);
    }

    // ✅ paginado (máx 7)
    const { page, limit, offset } = getPageLimit(req);

    const { rows, count } = await TipoVehiculos.findAndCountAll({
      order: [["idtipovehiculos", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    return res.json({
      ok: true,
      data: rows,
      pagination: buildPagination(count, page, limit),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error al obtener tipos de vehículos", error: error.message });
  }
};

// Obtener por ID
export const getTipoVehiculoById = async (req, res) => {
  try {
    const tipo = await TipoVehiculos.findByPk(req.params.id);
    if (!tipo) return res.status(404).json({ message: "Tipo de vehículo no encontrado" });
    return res.json(tipo);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error al obtener tipo de vehículo", error: error.message });
  }
};

// Crear
export const createTipoVehiculo = async (req, res) => {
  try {
    const nuevo = await TipoVehiculos.create(req.body);
    return res.status(201).json(nuevo);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error al crear tipo de vehículo", error: error.message });
  }
};

// Actualizar
export const updateTipoVehiculo = async (req, res) => {
  try {
    const tipo = await TipoVehiculos.findByPk(req.params.id);
    if (!tipo) return res.status(404).json({ message: "Tipo de vehículo no encontrado" });

    await tipo.update(req.body);
    return res.json(tipo);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error al actualizar tipo de vehículo", error: error.message });
  }
};

// Eliminar
export const deleteTipoVehiculo = async (req, res) => {
  try {
    const tipo = await TipoVehiculos.findByPk(req.params.id);
    if (!tipo) return res.status(404).json({ message: "Tipo de vehículo no encontrado" });

    await tipo.destroy();
    return res.json({ message: "Tipo de vehículo eliminado" });
  } catch (error) {
    const msg = String(error?.message || "");
    if (
      error?.name === "SequelizeForeignKeyConstraintError" ||
      msg.toLowerCase().includes("foreign key")
    ) {
      return res.status(409).json({
        message: "No se puede eliminar el tipo de vehículo porque está relacionado con otros registros.",
      });
    }

    return res
      .status(500)
      .json({ message: "Error al eliminar tipo de vehículo", error: error.message });
  }
};
