const { MetodoPago } = require('../models');

class PaymentsService {
  async findAllMetodos() {
    return await MetodoPago.findAll();
  }

  async createMetodo(data) {
    return await MetodoPago.create(data);
  }

  async updateMetodo(idmpago, data) {
    const metodo = await MetodoPago.findByPk(idmpago);
    if (!metodo) {
      const error = new Error('Método de pago no encontrado');
      error.statusCode = 404;
      throw error;
    }
    await metodo.update(data);
    return metodo;
  }

  async deleteMetodo(idmpago) {
    const metodo = await MetodoPago.findByPk(idmpago);
    if (!metodo) {
      const error = new Error('Método de pago no encontrado');
      error.statusCode = 404;
      throw error;
    }
    await metodo.destroy();
    return { message: 'Método de pago eliminado exitosamente' };
  }
}

module.exports = new PaymentsService();
