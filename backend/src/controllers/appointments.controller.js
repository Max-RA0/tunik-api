const appointmentsService = require('../services/appointments.service');
const response = require('../utils/response.util');

class AppointmentsController {
  // Agenda de citas
  async findAll(req, res, next) {
    try {
      const citas = await appointmentsService.findAll(req.query);
      return response.success(res, citas);
    } catch (error) {
      next(error);
    }
  }

  async findById(req, res, next) {
    try {
      const { idagendacitas } = req.params;
      const cita = await appointmentsService.findById(idagendacitas);
      return response.success(res, cita);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const cita = await appointmentsService.create(req.body);
      return response.created(res, cita, 'Cita creada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { idagendacitas } = req.params;
      const cita = await appointmentsService.update(idagendacitas, req.body);
      return response.success(res, cita, 'Cita actualizada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { idagendacitas } = req.params;
      await appointmentsService.delete(idagendacitas);
      return response.success(res, null, 'Cita eliminada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  // Detalles
  async findAllDetalles(req, res, next) {
    try {
      const detalles = await appointmentsService.findAllDetalles();
      return response.success(res, detalles);
    } catch (error) {
      next(error);
    }
  }

  async testDetalles(req, res, next) {
    try {
      return response.success(res, { message: 'Endpoint de test funcionando' });
    } catch (error) {
      next(error);
    }
  }

  async findDetallesByAgenda(req, res, next) {
    try {
      const { idagendacitas } = req.params;
      const detalles = await appointmentsService.findDetallesByAgenda(idagendacitas);
      return response.success(res, detalles);
    } catch (error) {
      next(error);
    }
  }

  async getTotalByAgenda(req, res, next) {
    try {
      const { idagendacitas } = req.params;
      const total = await appointmentsService.getTotalByAgenda(idagendacitas);
      return response.success(res, total);
    } catch (error) {
      next(error);
    }
  }

  async createDetalle(req, res, next) {
    try {
      const detalle = await appointmentsService.createDetalle(req.body);
      return response.created(res, detalle, 'Detalle creado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async updateDetalle(req, res, next) {
    try {
      const { idagendacitas, idservicios } = req.params;
      const detalle = await appointmentsService.updateDetalle(idagendacitas, idservicios, req.body);
      return response.success(res, detalle, 'Detalle actualizado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async deleteDetalle(req, res, next) {
    try {
      const { idagendacitas, idservicios } = req.params;
      await appointmentsService.deleteDetalle(idagendacitas, idservicios);
      return response.success(res, null, 'Detalle eliminado exitosamente');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AppointmentsController();
