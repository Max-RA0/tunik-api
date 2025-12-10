// server/controllers/categoriaservicio.controller.js
import CategoriaServicio from "../models/categoriaservicio.js";

// Crear
export const create = async (req, res) => {
  try {
    const categoria = await CategoriaServicio.create(req.body);
    res.json(categoria);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Listar todas
export const findAll = async (req, res) => {
  try {
    const categorias = await CategoriaServicio.findAll();
    res.json(categorias);
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
