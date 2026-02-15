const servicesService = require('../services/services.service');
const response = require('../utils/response.util');

class ServicesController {
  // Categorías
  async findAllCategorias(req, res, next) {
    try {
      const categorias = await servicesService.findAllCategorias();
      return response.success(res, categorias);
    } catch (error) {
      next(error);
    }
  }

  async createCategoria(req, res, next) {
    try {
      const categoria = await servicesService.createCategoria(req.body);
      return response.created(res, categoria, 'Categoría creada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async updateCategoria(req, res, next) {
    try {
      const { idcategoriaservicios } = req.params;
      const categoria = await servicesService.updateCategoria(idcategoriaservicios, req.body);
      return response.success(res, categoria, 'Categoría actualizada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async deleteCategoria(req, res, next) {
    try {
      const { idcategoriaservicios } = req.params;
      await servicesService.deleteCategoria(idcategoriaservicios);
      return response.success(res, null, 'Categoría eliminada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  // Servicios
  async findAllServicios(req, res, next) {
    try {
      const servicios = await servicesService.findAllServicios(req.query);
      return response.success(res, servicios);
    } catch (error) {
      next(error);
    }
  }

  async findServicioById(req, res, next) {
    try {
      const { idservicios } = req.params;
      const servicio = await servicesService.findServicioById(idservicios);
      return response.success(res, servicio);
    } catch (error) {
      next(error);
    }
  }

  async createServicio(req, res, next) {
    try {
      const servicio = await servicesService.createServicio(req.body);
      return response.created(res, servicio, 'Servicio creado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async updateServicio(req, res, next) {
    try {
      const { idservicios } = req.params;
      const servicio = await servicesService.updateServicio(idservicios, req.body);
      return response.success(res, servicio, 'Servicio actualizado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async deleteServicio(req, res, next) {
    try {
      const { idservicios } = req.params;
      await servicesService.deleteServicio(idservicios);
      return response.success(res, null, 'Servicio eliminado exitosamente');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ServicesController();
