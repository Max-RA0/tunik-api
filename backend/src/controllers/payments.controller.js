const paymentsService = require('../services/payments.service');
const response = require('../utils/response.util');

class PaymentsController {
  async findAllMetodos(req, res, next) {
    try {
      const metodos = await paymentsService.findAllMetodos();
      return response.success(res, metodos);
    } catch (error) {
      next(error);
    }
  }

  async createMetodo(req, res, next) {
    try {
      const metodo = await paymentsService.createMetodo(req.body);
      return response.created(res, metodo, 'Método de pago creado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async updateMetodo(req, res, next) {
    try {
      const { idmpago } = req.params;
      const metodo = await paymentsService.updateMetodo(idmpago, req.body);
      return response.success(res, metodo, 'Método de pago actualizado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async deleteMetodo(req, res, next) {
    try {
      const { idmpago } = req.params;
      await paymentsService.deleteMetodo(idmpago);
      return response.success(res, null, 'Método de pago eliminado exitosamente');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentsController();
