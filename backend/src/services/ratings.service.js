const { EvaluacionServicio, Venta } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../database/connection');

class RatingsService {
  async findAll(query = {}) {
    const { from, to, idventas } = query;
    const where = {};

    if (from && to) {
      where.fecha = {
        [Op.between]: [new Date(from), new Date(to)]
      };
    }

    if (idventas) {
      where.idventas = idventas;
    }

    return await EvaluacionServicio.findAll({
      where,
      include: [{ model: Venta, as: 'venta' }],
      order: [['fecha', 'DESC']]
    });
  }

  async findById(idevaluacionservicios) {
    const evaluacion = await EvaluacionServicio.findByPk(idevaluacionservicios, {
      include: [{ model: Venta, as: 'venta' }]
    });

    if (!evaluacion) {
      const error = new Error('Evaluación no encontrada');
      error.statusCode = 404;
      throw error;
    }

    return evaluacion;
  }

  async create(data) {
    const { idventas, calificacion, comentario } = data;

    // Verify venta exists
    const venta = await Venta.findByPk(idventas);
    if (!venta) {
      const error = new Error('Venta no encontrada');
      error.statusCode = 404;
      throw error;
    }

    // Validate calificacion range
    if (calificacion < 1 || calificacion > 5) {
      const error = new Error('La calificación debe estar entre 1 y 5');
      error.statusCode = 400;
      throw error;
    }

    const evaluacion = await EvaluacionServicio.create({
      idventas,
      calificacion,
      comentario,
      fecha: new Date()
    });

    return await this.findById(evaluacion.idevaluacionservicios);
  }

  async update(idevaluacionservicios, data) {
    const evaluacion = await EvaluacionServicio.findByPk(idevaluacionservicios);
    if (!evaluacion) {
      const error = new Error('Evaluación no encontrada');
      error.statusCode = 404;
      throw error;
    }

    if (data.calificacion && (data.calificacion < 1 || data.calificacion > 5)) {
      const error = new Error('La calificación debe estar entre 1 y 5');
      error.statusCode = 400;
      throw error;
    }

    await evaluacion.update(data);
    return await this.findById(idevaluacionservicios);
  }

  async delete(idevaluacionservicios) {
    const evaluacion = await EvaluacionServicio.findByPk(idevaluacionservicios);
    if (!evaluacion) {
      const error = new Error('Evaluación no encontrada');
      error.statusCode = 404;
      throw error;
    }
    await evaluacion.destroy();
    return { message: 'Evaluación eliminada exitosamente' };
  }

  async getSummary(query = {}) {
    const { from, to } = query;
    const where = {};

    if (from && to) {
      where.fecha = {
        [Op.between]: [new Date(from), new Date(to)]
      };
    }

    const evaluaciones = await EvaluacionServicio.findAll({ where });

    if (evaluaciones.length === 0) {
      return {
        total: 0,
        promedio: 0,
        distribucion: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };
    }

    const total = evaluaciones.length;
    const suma = evaluaciones.reduce((acc, e) => acc + e.calificacion, 0);
    const promedio = suma / total;

    const distribucion = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    evaluaciones.forEach(e => {
      distribucion[e.calificacion]++;
    });

    return {
      total,
      promedio: Math.round(promedio * 100) / 100,
      distribucion
    };
  }
}

module.exports = new RatingsService();
