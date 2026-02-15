const { Servicio, CategoriaServicio } = require('../models');
const { Op } = require('sequelize');

class ServicesService {
  // Categorías de servicios
  async findAllCategorias() {
    return await CategoriaServicio.findAll();
  }

  async createCategoria(data) {
    return await CategoriaServicio.create(data);
  }

  async updateCategoria(idcategoriaservicios, data) {
    const categoria = await CategoriaServicio.findByPk(idcategoriaservicios);
    if (!categoria) {
      const error = new Error('Categoría no encontrada');
      error.statusCode = 404;
      throw error;
    }
    await categoria.update(data);
    return categoria;
  }

  async deleteCategoria(idcategoriaservicios) {
    const categoria = await CategoriaServicio.findByPk(idcategoriaservicios);
    if (!categoria) {
      const error = new Error('Categoría no encontrada');
      error.statusCode = 404;
      throw error;
    }
    await categoria.destroy();
    return { message: 'Categoría eliminada exitosamente' };
  }

  // Servicios
  async findAllServicios(query = {}) {
    const { q, idcategoriaservicios } = query;
    const where = {};

    if (q) {
      where[Op.or] = [
        { nombreservicios: { [Op.like]: `%${q}%` } },
        { descripcion: { [Op.like]: `%${q}%` } }
      ];
    }

    if (idcategoriaservicios) {
      where.idcategoriaservicios = idcategoriaservicios;
    }

    return await Servicio.findAll({
      where,
      include: [{ model: CategoriaServicio, as: 'categoria' }]
    });
  }

  async findServicioById(idservicios) {
    const servicio = await Servicio.findByPk(idservicios, {
      include: [{ model: CategoriaServicio, as: 'categoria' }]
    });

    if (!servicio) {
      const error = new Error('Servicio no encontrado');
      error.statusCode = 404;
      throw error;
    }

    return servicio;
  }

  async createServicio(data) {
    const servicio = await Servicio.create(data);
    return await this.findServicioById(servicio.idservicios);
  }

  async updateServicio(idservicios, data) {
    const servicio = await Servicio.findByPk(idservicios);
    if (!servicio) {
      const error = new Error('Servicio no encontrado');
      error.statusCode = 404;
      throw error;
    }
    await servicio.update(data);
    return await this.findServicioById(idservicios);
  }

  async deleteServicio(idservicios) {
    const servicio = await Servicio.findByPk(idservicios);
    if (!servicio) {
      const error = new Error('Servicio no encontrado');
      error.statusCode = 404;
      throw error;
    }
    await servicio.destroy();
    return { message: 'Servicio eliminado exitosamente' };
  }
}

module.exports = new ServicesService();
