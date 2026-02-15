const salesService = require('../services/sales.service');
const response = require('../utils/response.util');

class SalesController {
  // Ventas
  async findAll(req, res, next) {
    try {
      const ventas = await salesService.findAll(req.query);
      return response.success(res, ventas);
    } catch (error) {
      next(error);
    }
  }

  async findById(req, res, next) {
    try {
      const { idventas } = req.params;
      const venta = await salesService.findById(idventas);
      return response.success(res, venta);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const venta = await salesService.create(req.body);
      return response.created(res, venta, 'Venta creada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { idventas } = req.params;
      const venta = await salesService.update(idventas, req.body);
      return response.success(res, venta, 'Venta actualizada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { idventas } = req.params;
      await salesService.delete(idventas);
      return response.success(res, null, 'Venta eliminada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  // Detalles
  async findAllDetalles(req, res, next) {
    try {
      const detalles = await salesService.findAllDetalles();
      return response.success(res, detalles);
    } catch (error) {
      next(error);
    }
  }

  async findDetallesByVenta(req, res, next) {
    try {
      const { idventas } = req.params;
      const detalles = await salesService.findDetallesByVenta(idventas);
      return response.success(res, detalles);
    } catch (error) {
      next(error);
    }
  }

  async createDetalle(req, res, next) {
    try {
      const detalle = await salesService.createDetalle(req.body);
      return response.created(res, detalle, 'Detalle creado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async deleteDetalle(req, res, next) {
    try {
      const { iddetalleventas } = req.params;
      await salesService.deleteDetalle(iddetalleventas);
      return response.success(res, null, 'Detalle eliminado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  // Pagos
  async findAllPagos(req, res, next) {
    try {
      const pagos = await salesService.findAllPagos();
      return response.success(res, pagos);
    } catch (error) {
      next(error);
    }
  }

  async findPagosByVenta(req, res, next) {
    try {
      const { idventas } = req.params;
      const pagos = await salesService.findPagosByVenta(idventas);
      return response.success(res, pagos);
    } catch (error) {
      next(error);
    }
  }

  async createPago(req, res, next) {
    try {
      const pago = await salesService.createPago(req.body);
      return response.created(res, pago, 'Pago registrado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async deletePago(req, res, next) {
    try {
      const { idpagoventas } = req.params;
      await salesService.deletePago(idpagoventas);
      return response.success(res, null, 'Pago eliminado exitosamente');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SalesController();
