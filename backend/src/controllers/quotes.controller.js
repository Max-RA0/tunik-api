const quotesService = require('../services/quotes.service');
const response = require('../utils/response.util');

class QuotesController {
  async findAll(req, res, next) {
    try {
      const cotizaciones = await quotesService.findAll(req.query);
      return response.success(res, cotizaciones);
    } catch (error) {
      next(error);
    }
  }

  async findById(req, res, next) {
    try {
      const { idcotizaciones } = req.params;
      const cotizacion = await quotesService.findById(idcotizaciones);
      return response.success(res, cotizacion);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const cotizacion = await quotesService.create(req.body);
      return response.created(res, cotizacion, 'Cotización creada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { idcotizaciones } = req.params;
      const cotizacion = await quotesService.update(idcotizaciones, req.body);
      return response.success(res, cotizacion, 'Cotización actualizada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { idcotizaciones } = req.params;
      await quotesService.delete(idcotizaciones);
      return response.success(res, null, 'Cotización eliminada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  // Detalles
  async findAllDetalles(req, res, next) {
    try {
      const detalles = await quotesService.findAllDetalles();
      return response.success(res, detalles);
    } catch (error) {
      next(error);
    }
  }

  async findDetallesByCotizacion(req, res, next) {
    try {
      const { idcotizaciones } = req.params;
      const detalles = await quotesService.findDetallesByCotizacion(idcotizaciones);
      return response.success(res, detalles);
    } catch (error) {
      next(error);
    }
  }

  async createDetalle(req, res, next) {
    try {
      const detalle = await quotesService.createDetalle(req.body);
      return response.created(res, detalle, 'Detalle creado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async updateDetalle(req, res, next) {
    try {
      const { idcotizaciones, idservicios } = req.params;
      const detalle = await quotesService.updateDetalle(idcotizaciones, idservicios, req.body);
      return response.success(res, detalle, 'Detalle actualizado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async deleteDetalle(req, res, next) {
    try {
      const { idcotizaciones, idservicios } = req.params;
      await quotesService.deleteDetalle(idcotizaciones, idservicios);
      return response.success(res, null, 'Detalle eliminado exitosamente');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new QuotesController();
