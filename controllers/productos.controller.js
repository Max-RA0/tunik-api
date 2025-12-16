// server/controllers/productos.controller.js
import Producto from "../models/productos.js";

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj || {}, key);
const MAX_LIMIT = 7;

const wantsPagination = (req) => hasOwn(req?.query, "page") || hasOwn(req?.query, "limit");

const asInt = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
};

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

// 🚀 CREAR PRODUCTO
export const crearProducto = async (req, res) => {
  try {
    const { nombreproductos, precio, cantidadexistente, idproveedor } = req.body;

    if (
      !nombreproductos ||
      precio === undefined ||
      cantidadexistente === undefined ||
      idproveedor === undefined
    ) {
      return res
        .status(400)
        .json({ message: "Nombre, precio, cantidad e ID del proveedor son obligatorios" });
    }

    const nuevoProducto = await Producto.create({
      nombreproductos,
      precio,
      cantidadexistente,
      idproveedor,
    });

    return res.status(201).json(nuevoProducto);
  } catch (error) {
    console.error("Error al crear producto:", error);
    return res.status(500).json({
      message: "Error al crear el producto",
      error: error.message,
    });
  }
};

// ✏️ EDITAR PRODUCTO
export const editarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombreproductos, precio, cantidadexistente, idproveedor } = req.body;

    const product = await Producto.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    if (nombreproductos !== undefined) product.nombreproductos = nombreproductos;
    if (precio !== undefined) product.precio = precio;
    if (cantidadexistente !== undefined) product.cantidadexistente = cantidadexistente;
    if (idproveedor !== undefined) product.idproveedor = idproveedor;

    await product.save();
    return res.json(product);
  } catch (error) {
    console.error("Error al editar producto:", error);
    return res.status(500).json({
      message: "Error al editar el producto",
      error: error.message,
    });
  }
};

// 🗑️ ELIMINAR PRODUCTO
export const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Producto.findByPk(id);

    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    await product.destroy();
    return res.json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar producto:", error);

    const msg = String(error?.message || "");
    if (
      error?.name === "SequelizeForeignKeyConstraintError" ||
      msg.toLowerCase().includes("foreign key")
    ) {
      return res.status(409).json({
        message: "No se puede eliminar el producto porque está relacionado con otros registros.",
      });
    }

    return res.status(500).json({
      message: "Error al eliminar el producto",
      error: error.message,
    });
  }
};

// 📋 LISTAR PRODUCTOS (✅ paginación opcional máx 7 + filtro opcional por proveedor)
export const listarProducto = async (req, res) => {
  try {
    // filtro opcional por proveedor (no rompe si no lo usas)
    const idprov = asInt(req.query?.idproveedor);
    const where = {};
    if (idprov) where.idproveedor = idprov;

    // ✅ NO rompe: sin paginación -> como antes (array)
    if (!wantsPagination(req)) {
      const products = await Producto.findAll({
        where,
        order: [["idproductos", "DESC"]], // ajusta si tu PK se llama diferente
      });
      return res.json(products);
    }

    // ✅ paginado (máx 7)
    const { page, limit, offset } = getPageLimit(req);

    const { rows, count } = await Producto.findAndCountAll({
      where,
      order: [["idproductos", "DESC"]],
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
    console.error("Error al listar productos:", error);
    return res.status(500).json({
      message: "Error al obtener productos",
      error: error.message,
    });
  }
};

// 🔍 BUSCAR PRODUCTO POR ID
export const buscarProdcuto = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Producto.findByPk(id);

    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    return res.json(product);
  } catch (error) {
    console.error("Error al buscar producto:", error);
    return res.status(500).json({
      message: "Error al buscar el producto",
      error: error.message,
    });
  }
};
