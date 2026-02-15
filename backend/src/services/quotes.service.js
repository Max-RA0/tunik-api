const { Cotizacion, DetalleCotizacion, Vehiculo, MetodoPago, AgendaCita, Servicio, TipoVehiculo, Marca, User } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../database/connection');

class QuotesService {
  async findAll(query = {}) {
    const { estado, from, to } = query;
    const where = {};

    if (estado) {
      where.estado = estado;
    }

    if (from && to) {
      where.fecha = {
        [Op.between]: [from, to]
      };
    }

    return await Cotizacion.findAll({
      where,
      include: [
        {
          model: Vehiculo,
          as: 'vehiculo',
          include: [
            { model: TipoVehiculo, as: 'tipo' },
            { model: Marca, as: 'marca' },
            { model: User, as: 'usuario', attributes: ['numero_documento', 'nombre', 'email', 'telefono'] }
          ]
        },
        { model: MetodoPago, as: 'metodoPago' },
        { model: AgendaCita, as: 'agendaCita' },
        {
          model: DetalleCotizacion,
          as: 'detalles',
          include: [{ model: Servicio, as: 'servicio' }]
        }
      ],
      order: [['fecha', 'DESC']]
    });
  }

  async findById(idcotizaciones) {
    const cotizacion = await Cotizacion.findByPk(idcotizaciones, {
      include: [
        {
          model: Vehiculo,
          as: 'vehiculo',
          include: [
            { model: TipoVehiculo, as: 'tipo' },
            { model: Marca, as: 'marca' },
            { model: User, as: 'usuario', attributes: ['numero_documento', 'nombre', 'email', 'telefono'] }
          ]
        },
        { model: MetodoPago, as: 'metodoPago' },
        { model: AgendaCita, as: 'agendaCita' },
        {
          model: DetalleCotizacion,
          as: 'detalles',
          include: [{ model: Servicio, as: 'servicio' }]
        }
      ]
    });

    if (!cotizacion) {
      const error = new Error('Cotización no encontrada');
      error.statusCode = 404;
      throw error;
    }

    return cotizacion;
  }

  async create(data) {
    const { placa, idmpago, estado, fecha, idagendacitas, detalles } = data;

    const transaction = await sequelize.transaction();

    try {
      const cotizacion = await Cotizacion.create({
        placa,
        idmpago,
        estado: estado || 'Pendiente',
        fecha,
        idagendacitas
      }, { transaction });

      if (detalles && detalles.length > 0) {
        const detallesData = detalles.map(d => ({
          idcotizaciones: cotizacion.idcotizaciones,
          idservicios: d.idservicios,
          preciochange: d.preciochange
        }));

        await DetalleCotizacion.bulkCreate(detallesData, { transaction });
      }

      await transaction.commit();
      return await this.findById(cotizacion.idcotizaciones);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async update(idcotizaciones, data) {
    const cotizacion = await Cotizacion.findByPk(idcotizaciones);
    if (!cotizacion) {
      const error = new Error('Cotización no encontrada');
      error.statusCode = 404;
      throw error;
    }

    await cotizacion.update(data);
    return await this.findById(idcotizaciones);
  }

  async delete(idcotizaciones) {
    const cotizacion = await Cotizacion.findByPk(idcotizaciones);
    if (!cotizacion) {
      const error = new Error('Cotización no encontrada');
      error.statusCode = 404;
      throw error;
    }
    await cotizacion.destroy();
    return { message: 'Cotización eliminada exitosamente' };
  }

  // Detalles de cotización
  async findAllDetalles() {
    return await DetalleCotizacion.findAll({
      include: [
        { model: Cotizacion, as: 'cotizacion' },
        { model: Servicio, as: 'servicio' }
      ]
    });
  }

  async findDetallesByCotizacion(idcotizaciones) {
    return await DetalleCotizacion.findAll({
      where: { idcotizaciones },
      include: [{ model: Servicio, as: 'servicio' }]
    });
  }

  async createDetalle(data) {
    const detalle = await DetalleCotizacion.create(data);
    return detalle;
  }

  async updateDetalle(idcotizaciones, idservicios, data) {
    const detalle = await DetalleCotizacion.findOne({
      where: { idcotizaciones, idservicios }
    });

    if (!detalle) {
      const error = new Error('Detalle no encontrado');
      error.statusCode = 404;
      throw error;
    }

    await detalle.update(data);
    return detalle;
  }

  async deleteDetalle(idcotizaciones, idservicios) {
    const detalle = await DetalleCotizacion.findOne({
      where: { idcotizaciones, idservicios }
    });

    if (!detalle) {
      const error = new Error('Detalle no encontrado');
      error.statusCode = 404;
      throw error;
    }

    await detalle.destroy();
    return { message: 'Detalle eliminado exitosamente' };
  }
}

module.exports = new QuotesService();
