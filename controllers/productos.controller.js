// server/controllers/productos.controller.js
import Producto from "../models/productos.js";
// Si tuvieras un modelo de Proveedor, deberías importarlo aquí para usar 'include'
// import Proveedor from "../models/proveedores.js"; 

// 🚀 CREAR PRODUCTO
export const crearProducto = async (req, res) => {
  try {
    // Se añade idproveedor a la desestructuración
    const { nombreproductos, precio, cantidadexistente, idproveedor } = req.body;

    // Se actualiza la validación para incluir idproveedor
    if (!nombreproductos || precio === undefined || cantidadexistente === undefined || idproveedor === undefined) {
      return res
        .status(400)
        .json({ message: "Nombre, precio, cantidad e ID del proveedor son obligatorios" });
    }

    const nuevoProducto = await Producto.create({
      nombreproductos,
      precio,
      cantidadexistente,
      idproveedor, // Se incluye idproveedor en la creación
    });

    res.status(201).json(nuevoProducto);
  } catch (error) {
    console.error("Error al crear producto:", error);
    res.status(500).json({
      message: "Error al crear el producto",
      error: error.message,
    });
  }
};

// ✏️ EDITAR PRODUCTO
export const editarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    // Se añade idproveedor a la desestructuración
    const { nombreproductos, precio, cantidadexistente, idproveedor } = req.body;

    const product = await Producto.findByPk(id);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    // Permitimos edición parcial
    if (nombreproductos !== undefined) product.nombreproductos = nombreproductos;
    if (precio !== undefined) product.precio = precio;
    if (cantidadexistente !== undefined) product.cantidadexistente = cantidadexistente;
    
    // Se permite la actualización de idproveedor
    if (idproveedor !== undefined) product.idproveedor = idproveedor; 

    await product.save();

    res.json(product);
  } catch (error) {
    console.error("Error al editar producto:", error);
    res.status(500).json({
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
    res.json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    res.status(500).json({
      message: "Error al eliminar el producto",
      error: error.message,
    });
  }
};

// 📋 LISTAR PRODUCTOS
export const listarProducto = async (req, res) => {
  try {
    // Si la asociación con Proveedor está configurada, puedes añadir 'include: [Proveedor]' aquí
    const products = await Producto.findAll(); 
    res.json(products);
  } catch (error) {
    console.error("Error al listar productos:", error);
    res.status(500).json({
      message: "Error al obtener productos",
      error: error.message,
    });
  }
};

// 🔍 BUSCAR PRODUCTO POR ID
export const buscarProdcuto = async (req, res) => {
  try {
    const { id } = req.params;
    // Si la asociación con Proveedor está configurada, puedes añadir 'include: [Proveedor]' aquí
    const product = await Producto.findByPk(id);

    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.json(product);
  } catch (error) {
    console.error("Error al buscar producto:", error);
    res.status(500).json({
      message: "Error al buscar el producto",
      error: error.message,
    });
  }
};