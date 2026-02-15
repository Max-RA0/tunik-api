const ratingsService = require('../services/ratings.service');
const response = require('../utils/response.util');

class RatingsController {
  async findAll(req, res, next) {
    try {
      const evaluaciones = await ratingsService.findAll(req.query);
      return response.success(res, evaluaciones);
    } catch (error) {
      next(error);
    }
  }

  async findById(req, res, next) {
    try {
      const { idevaluacionservicios } = req.params;
      const evaluacion = await ratingsService.findById(idevaluacionservicios);
      return response.success(res, evaluacion);
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const evaluacion = await ratingsService.create(req.body);
      return response.created(res, evaluacion, 'Evaluación creada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const { idevaluacionservicios } = req.params;
      const evaluacion = await ratingsService.update(idevaluacionservicios, req.body);
      return response.success(res, evaluacion, 'Evaluación actualizada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { idevaluacionservicios } = req.params;
      await ratingsService.delete(idevaluacionservicios);
      return response.success(res, null, 'Evaluación eliminada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req, res, next) {
    try {
      const summary = await ratingsService.getSummary(req.query);
      return response.success(res, summary);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RatingsController();
