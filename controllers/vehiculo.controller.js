// server/controllers/vehiculo.controller.js
import Vehiculo from "../models/vehiculo.js";
import TipoVehiculo from "../models/tipovehiculos.js";
import Marca from "../models/marca.js";
import Usuarios from "../models/usuarios.js";

const isFkError = (err) =>
  err?.name === "SequelizeForeignKeyConstraintError" ||
  err?.parent?.code === "ER_ROW_IS_REFERENCED_2";

const fkMsg = () =>
  "No se puede eliminar el vehículo porque tiene registros relacionados (citas, cotizaciones, pedidos, etc.).";

const normalizePlaca = (v) =>
  String(v || "").toUpperCase().replace(/\s+/g, "").trim();

/* =========================
   ✅ Helpers paginación (máx 7)
   ========================= */
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

function getLoggedNumeroDocumento(req) {
  // Soporta diferentes nombres según tu middleware de auth
  const u = req.user || req.usuario || req.auth || req?.jwt || null;

  const doc =
    u?.numero_documento ??
    u?.numeroDocumento ??
    u?.documento ??
    u?.cedula ??
    u?.id ??
    u?.sub ??
    null;

  return doc ? String(doc) : "";
}

async function validateFKs({ idtipovehiculos, idmarca, numero_documento }) {
  const [tipo, marca, usuario] = await Promise.all([
    TipoVehiculo.findByPk(Number(idtipovehiculos)),
    Marca.findByPk(Number(idmarca)),
    Usuarios.findByPk(String(numero_documento)),
  ]);

  return {
    tipoOk: !!tipo,
    marcaOk: !!marca,
    usuarioOk: !!usuario,
  };
}

/* ===========================
   ✅ Crear vehículo (ADMIN o genérico)
=========================== */
export const create = async (req, res) => {
  try {
    const {
      placa,
      modelo,
      color,
      idtipovehiculos,
      idmarca,
      numero_documento: numeroBody,
    } = req.body;

    const placaNorm = normalizePlaca(placa);
    const numero_documento = String(numeroBody || getLoggedNumeroDocumento(req) || "").trim();

    if (!placaNorm || !modelo || !color || !idtipovehiculos || !idmarca || !numero_documento) {
      return res.status(400).json({
        ok: false,
        msg: "placa, modelo, color, idtipovehiculos, idmarca y usuario son obligatorios",
      });
    }

    const existente = await Vehiculo.findByPk(placaNorm);
    if (existente) {
      return res.status(400).json({ ok: false, msg: "Ya existe un vehículo con esa placa" });
    }

    // Validar FKs
    const fks = await validateFKs({ idtipovehiculos, idmarca, numero_documento });
    if (!fks.tipoOk) return res.status(400).json({ ok: false, msg: "Tipo de vehículo no válido" });
    if (!fks.marcaOk) return res.status(400).json({ ok: false, msg: "Marca no válida" });
    if (!fks.usuarioOk) return res.status(400).json({ ok: false, msg: "Usuario no existe" });

    const nuevoVehiculo = await Vehiculo.create({
      placa: placaNorm,
      modelo: String(modelo).trim(),
      color: String(color).trim(),
      idtipovehiculos: Number(idtipovehiculos),
      idmarca: Number(idmarca),
      numero_documento: String(numero_documento),
    });

    return res.status(201).json({ ok: true, data: nuevoVehiculo });
  } catch (err) {
    console.error("Error al crear vehículo:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};

// ✅ Listar SOLO mis vehículos (usuario logueado) (✅ paginación opcional máx 7)
export const findMine = async (req, res) => {
  try {
    const numero_documento = String(getLoggedNumeroDocumento(req) || "").trim();
    if (!numero_documento) {
      return res.status(401).json({
        ok: false,
        msg: "No autenticado (no se pudo leer el usuario logueadoimed).",
      });
    }

    const include = [
      { model: TipoVehiculo, as: "tipo", attributes: ["idtipovehiculos", "nombre"] },
      { model: Marca, as: "marca", attributes: ["idmarca", "descripcion"] },
      { model: Usuarios, as: "usuario", attributes: ["numero_documento", "nombre", "telefono", "email"] },
    ];

    // ✅ NO rompe: sin paginación -> igual que antes
    if (!wantsPagination(req)) {
      const vehiculos = await Vehiculo.findAll({
        where: { numero_documento },
        include,
        order: [["placa", "ASC"]],
      });
      return res.json({ ok: true, data: vehiculos });
    }

    // ✅ paginado (máx 7)
    const { page, limit, offset } = getPageLimit(req);

    const { rows, count } = await Vehiculo.findAndCountAll({
      where: { numero_documento },
      include,
      order: [["placa", "ASC"]],
      limit,
      offset,
      distinct: true,
      col: "placa", // ✅ tu PK suele ser placa (string)
    });

    return res.json({
      ok: true,
      data: rows,
      pagination: buildPagination(count, page, limit),
    });
  } catch (err) {
    console.error("findMine vehiculos:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};

// ✅ Crear vehículo SOLO para el usuario logueado
export const createMine = async (req, res) => {
  try {
    const numero_documento = String(getLoggedNumeroDocumento(req) || "").trim();
    if (!numero_documento) {
      return res.status(401).json({ ok: false, msg: "No autenticado (no se pudo leer el usuario logueado)." });
    }

    const { placa, modelo, color, idtipovehiculos, idmarca } = req.body;
    const placaNorm = normalizePlaca(placa);

    if (!placaNorm || !modelo || !color || !idtipovehiculos || !idmarca) {
      return res.status(400).json({
        ok: false,
        msg: "placa, modelo, color, idtipovehiculos e idmarca son obligatorios",
      });
    }

    const existente = await Vehiculo.findByPk(placaNorm);
    if (existente) {
      return res.status(400).json({ ok: false, msg: "Ya existe un vehículo con esa placa" });
    }

    const fks = await validateFKs({ idtipovehiculos, idmarca, numero_documento });
    if (!fks.tipoOk) return res.status(400).json({ ok: false, msg: "Tipo de vehículo no válido" });
    if (!fks.marcaOk) return res.status(400).json({ ok: false, msg: "Marca no válida" });
    if (!fks.usuarioOk) return res.status(400).json({ ok: false, msg: "Usuario no existe" });

    const nuevoVehiculo = await Vehiculo.create({
      placa: placaNorm,
      modelo: String(modelo).trim(),
      color: String(color).trim(),
      idtipovehiculos: Number(idtipovehiculos),
      idmarca: Number(idmarca),
      numero_documento,
    });

    return res.status(201).json({ ok: true, data: nuevoVehiculo });
  } catch (err) {
    console.error("createMine vehiculos:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};

// Listar vehículos (✅ con filtro por numero_documento) (✅ paginación opcional máx 7)
export const findAll = async (req, res) => {
  try {
    const { numero_documento } = req.query;

    const where = {};
    if (numero_documento) where.numero_documento = String(numero_documento);

    const include = [
      { model: TipoVehiculo, as: "tipo", attributes: ["idtipovehiculos", "nombre"] },
      { model: Marca, as: "marca", attributes: ["idmarca", "descripcion"] },
      { model: Usuarios, as: "usuario", attributes: ["numero_documento", "nombre", "telefono", "email"] },
    ];

    // ✅ NO rompe: sin paginación -> igual que antes
    if (!wantsPagination(req)) {
      const vehiculos = await Vehiculo.findAll({
        where,
        include,
        order: [["placa", "ASC"]],
      });
      return res.json({ ok: true, data: vehiculos });
    }

    // ✅ paginado (máx 7)
    const { page, limit, offset } = getPageLimit(req);

    const { rows, count } = await Vehiculo.findAndCountAll({
      where,
      include,
      order: [["placa", "ASC"]],
      limit,
      offset,
      distinct: true,
      col: "placa",
    });

    return res.json({
      ok: true,
      data: rows,
      pagination: buildPagination(count, page, limit),
    });
  } catch (err) {
    console.error("findAll vehiculos:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};

// Buscar por ID (placa)
export const findOne = async (req, res) => {
  try {
    const vehiculo = await Vehiculo.findByPk(req.params.id, {
      include: [
        { model: TipoVehiculo, as: "tipo", attributes: ["idtipovehiculos", "nombre"] },
        { model: Marca, as: "marca", attributes: ["idmarca", "descripcion"] },
        { model: Usuarios, as: "usuario", attributes: ["numero_documento", "nombre", "telefono", "email"] },
      ],
    });

    return vehiculo
      ? res.json({ ok: true, data: vehiculo })
      : res.status(404).json({ ok: false, msg: "Vehículo no encontrado" });
  } catch (err) {
    console.error("findOne vehiculos:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};

// Actualizar
export const update = async (req, res) => {
  try {
    const vehiculo = await Vehiculo.findByPk(req.params.id);

    if (!vehiculo) {
      return res.status(404).json({ ok: false, msg: "Vehículo no encontrado" });
    }

    await vehiculo.update(req.body);
    return res.json({ ok: true, data: vehiculo });
  } catch (err) {
    console.error("update vehiculos:", err);
    return res.status(500).json({ ok: false, error: err.message });
  }
};

// ✅ Eliminar vehículo
export const remove = async (req, res) => {
  try {
    const vehiculo = await Vehiculo.findByPk(req.params.id);

    if (!vehiculo) {
      return res.status(404).json({ ok: false, msg: "Vehículo no encontrado" });
    }

    await vehiculo.destroy();
    return res.json({ ok: true, msg: "Vehículo eliminado correctamente" });
  } catch (err) {
    console.error("remove vehiculos:", err);
    if (isFkError(err)) {
      return res.status(409).json({ ok: false, msg: fkMsg() });
    }
    return res.status(500).json({ ok: false, msg: "Error en el servidor", error: err.message });
  }
};
