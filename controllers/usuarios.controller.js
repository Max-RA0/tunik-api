// server/controllers/usuarios.controller.js
import Usuarios from "../models/usuarios.js";
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

const isFkError = (err) => {
  const msg = String(err?.message || "").toLowerCase();
  return (
    err?.name === "SequelizeForeignKeyConstraintError" ||
    msg.includes("foreign key") ||
    msg.includes("constraint")
  );
};

// Crear usuario
export const create = async (req, res) => {
  try {
    const {
      numero_documento,
      tipo_documento,
      nombre,
      telefono,
      email,
      contrasena,
      idroles,
    } = req.body;

    const nuevoUsuario = await Usuarios.create({
      numero_documento,
      tipo_documento,
      nombre,
      telefono,
      email,
      contrasena,
      idroles,
    });

    return res.status(201).json({ ok: true, data: nuevoUsuario });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};

// Listar todos los usuarios con su rol (✅ paginación opcional máx 7)
export const findAll = async (req, res) => {
  try {
    const includeRol = [{ model: Rol, as: "roles", attributes: ["idroles", "descripcion"] }];

    // ✅ NO rompe: sin paginación -> igual que antes
    if (!wantsPagination(req)) {
      const usuarios = await Usuarios.findAll({
        include: includeRol,
        order: [["numero_documento", "DESC"]],
      });
      return res.json({ ok: true, data: usuarios });
    }

    // ✅ paginado
    const { page, limit, offset } = getPageLimit(req);

    const { rows, count } = await Usuarios.findAndCountAll({
      include: includeRol,
      order: [["numero_documento", "DESC"]],
      limit,
      offset,
      distinct: true, // ✅ importante con include
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

// Buscar usuario por número_documento
export const findOne = async (req, res) => {
  try {
    const usuario = await Usuarios.findByPk(req.params.numero_documento, {
      include: [{ model: Rol, as: "roles", attributes: ["idroles", "descripcion"] }],
    });

    return usuario
      ? res.json({ ok: true, data: usuario })
      : res.status(404).json({ ok: false, msg: "Usuario no encontrado" });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};

// Actualizar usuario
export const update = async (req, res) => {
  try {
    const usuario = await Usuarios.findByPk(req.params.numero_documento);

    if (!usuario) {
      return res.status(404).json({ ok: false, msg: "Usuario no encontrado" });
    }

    await usuario.update(req.body);
    return res.json({ ok: true, data: usuario });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
};

// Eliminar usuario
export const remove = async (req, res) => {
  try {
    const usuario = await Usuarios.findByPk(req.params.numero_documento);

    if (!usuario) {
      return res.status(404).json({ ok: false, msg: "Usuario no encontrado" });
    }

    await usuario.destroy();
    return res.json({ ok: true, msg: "Usuario eliminado correctamente" });
  } catch (err) {
    // ✅ fallback FK (por si no tienes helpers)
    if (isFkError(err)) {
      return res.status(409).json({
        ok: false,
        msg: "No se puede eliminar el usuario porque está relacionado con otros registros.",
      });
    }
    return res.status(500).json({ ok: false, msg: "Error en el servidor", error: err.message });
  }
};
