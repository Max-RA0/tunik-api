import MetodoPago from "../models/metodospago.js";

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

// Crear método de pago
export const crearMetodoPago = async (req, res) => {
  try {
    const { nombremetodo } = req.body;
    if (!nombremetodo || !String(nombremetodo).trim()) {
      return res.status(400).json({ message: "El nombre del método de pago es obligatorio" });
    }
    const nuevoMetodo = await MetodoPago.create({ nombremetodo: String(nombremetodo).trim() });
    return res.status(201).json(nuevoMetodo);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error al crear el método de pago", error: error.message });
  }
};

// Editar método de pago
export const editarMetodoPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombremetodo } = req.body;

    const metodo = await MetodoPago.findByPk(id);
    if (!metodo) return res.status(404).json({ message: "Método de pago no encontrado" });

    if (nombremetodo !== undefined && !String(nombremetodo).trim()) {
      return res.status(400).json({ message: "El nombre no puede estar vacío" });
    }

    metodo.nombremetodo = nombremetodo !== undefined ? String(nombremetodo).trim() : metodo.nombremetodo;
    await metodo.save();

    return res.json(metodo);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error al editar el método de pago", error: error.message });
  }
};

// Eliminar método de pago
export const eliminarMetodoPago = async (req, res) => {
  try {
    const { id } = req.params;
    const metodo = await MetodoPago.findByPk(id);
    if (!metodo) return res.status(404).json({ message: "Método de pago no encontrado" });

    await metodo.destroy();
    return res.json({ message: "Método de pago eliminado correctamente" });
  } catch (error) {
    // FK: por si está relacionado con cotizaciones/pedidos, etc.
    const msg = String(error?.message || "");
    if (
      error?.name === "SequelizeForeignKeyConstraintError" ||
      msg.toLowerCase().includes("foreign key")
    ) {
      return res.status(409).json({
        message: "No se puede eliminar el método de pago porque está relacionado con otros registros.",
      });
    }

    return res
      .status(500)
      .json({ message: "Error al eliminar el método de pago", error: error.message });
  }
};

// Listar todos los métodos de pago (✅ paginación opcional máx 7)
export const listarMetodosPago = async (req, res) => {
  try {
    // ✅ NO rompe: sin paginación -> como antes (array)
    if (!wantsPagination(req)) {
      const metodos = await MetodoPago.findAll({
        order: [["idmpago", "DESC"]], // ajusta si tu PK se llama distinto
      });
      return res.json(metodos);
    }

    const { page, limit, offset } = getPageLimit(req);

    const { rows, count } = await MetodoPago.findAndCountAll({
      order: [["idmpago", "DESC"]],
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
      .json({ message: "Error al obtener métodos de pago", error: error.message });
  }
};

// Buscar por ID
export const buscarMetodoPago = async (req, res) => {
  try {
    const { id } = req.params;
    const metodo = await MetodoPago.findByPk(id);
    if (!metodo) return res.status(404).json({ message: "Método de pago no encontrado" });
    return res.json(metodo);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error al buscar el método de pago", error: error.message });
  }
};
