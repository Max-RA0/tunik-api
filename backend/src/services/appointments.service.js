const { AgendaCita, DetalleAgendaCita, Vehiculo, Servicio, TipoVehiculo, Marca, User } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../database/connection');

class AppointmentsService {
  // Agenda de citas
  async findAll(query = {}) {
    const { from, to, estado, placa } = query;
    const where = {};

    if (from && to) {
      where.fecha = {
        [Op.between]: [new Date(from), new Date(to)]
      };
    } else if (from) {
      where.fecha = { [Op.gte]: new Date(from) };
    } else if (to) {
      where.fecha = { [Op.lte]: new Date(to) };
    }

    if (estado) {
      where.estado = estado;
    }

    if (placa) {
      where.placa = placa;
    }

    return await AgendaCita.findAll({
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
        {
          model: DetalleAgendaCita,
          as: 'detalles',
          include: [{ model: Servicio, as: 'servicio' }]
        }
      ],
      order: [['fecha', 'DESC']]
    });
  }

  async findById(idagendacitas) {
    const cita = await AgendaCita.findByPk(idagendacitas, {
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
        {
          model: DetalleAgendaCita,
          as: 'detalles',
          include: [{ model: Servicio, as: 'servicio' }]
        }
      ]
    });

    if (!cita) {
      const error = new Error('Cita no encontrada');
      error.statusCode = 404;
      throw error;
    }

    return cita;
  }

  async create(data) {
    const { placa, fecha, estado, detalles } = data;

    const transaction = await sequelize.transaction();

    try {
      const cita = await AgendaCita.create({
        placa,
        fecha,
        estado: estado || 'Pendiente'
      }, { transaction });

      if (detalles && detalles.length > 0) {
        const detallesData = detalles.map(d => ({
          idagendacitas: cita.idagendacitas,
          idservicios: d.idservicios,
          cantidad: d.cantidad || 1,
          precio_unitario: d.precio_unitario
        }));

        await DetalleAgendaCita.bulkCreate(detallesData, { transaction });
      }

      await transaction.commit();
      return await this.findById(cita.idagendacitas);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async update(idagendacitas, data) {
    const cita = await AgendaCita.findByPk(idagendacitas);
    if (!cita) {
      const error = new Error('Cita no encontrada');
      error.statusCode = 404;
      throw error;
    }

    await cita.update(data);
    return await this.findById(idagendacitas);
  }

  async delete(idagendacitas) {
    const cita = await AgendaCita.findByPk(idagendacitas);
    if (!cita) {
      const error = new Error('Cita no encontrada');
      error.statusCode = 404;
      throw error;
    }
    await cita.destroy();
    return { message: 'Cita eliminada exitosamente' };
  }

  // Detalles de agenda
  async findAllDetalles() {
    return await DetalleAgendaCita.findAll({
      include: [
        { model: AgendaCita, as: 'agendaCita' },
        { model: Servicio, as: 'servicio' }
      ]
    });
  }

  async findDetallesByAgenda(idagendacitas) {
    return await DetalleAgendaCita.findAll({
      where: { idagendacitas },
      include: [{ model: Servicio, as: 'servicio' }]
    });
  }

  async getTotalByAgenda(idagendacitas) {
    const detalles = await DetalleAgendaCita.findAll({
      where: { idagendacitas }
    });

    const total = detalles.reduce((sum, d) => {
      return sum + (parseFloat(d.precio_unitario) * d.cantidad);
    }, 0);

    return { idagendacitas, total };
  }

  async createDetalle(data) {
    const detalle = await DetalleAgendaCita.create(data);
    return await DetalleAgendaCita.findByPk(detalle.iddetalleagenda, {
      include: [{ model: Servicio, as: 'servicio' }]
    });
  }

  async updateDetalle(idagendacitas, idservicios, data) {
    const detalle = await DetalleAgendaCita.findOne({
      where: { idagendacitas, idservicios }
    });

    if (!detalle) {
      const error = new Error('Detalle no encontrado');
      error.statusCode = 404;
      throw error;
    }

    await detalle.update(data);
    return detalle;
  }

  async deleteDetalle(idagendacitas, idservicios) {
    const detalle = await DetalleAgendaCita.findOne({
      where: { idagendacitas, idservicios }
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

module.exports = new AppointmentsService();
