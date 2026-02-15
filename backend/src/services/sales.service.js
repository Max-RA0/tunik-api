const { Venta, DetalleVenta, PagoVenta, MetodoPago, Servicio } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../database/connection');

class SalesService {
  // Ventas
  async findAll(query = {}) {
    const { estado, from, to } = query;
    const where = {};

    if (estado) {
      where.estado = estado;
    }

    if (from && to) {
      where.fecha = {
        [Op.between]: [new Date(from), new Date(to)]
      };
    }

    return await Venta.findAll({
      where,
      include: [
        {
          model: DetalleVenta,
          as: 'detalles',
          include: [{ model: Servicio, as: 'servicio' }]
        },
        {
          model: PagoVenta,
          as: 'pagos',
          include: [{ model: MetodoPago, as: 'metodoPago' }]
        }
      ],
      order: [['fecha', 'DESC']]
    });
  }

  async findById(idventas) {
    const venta = await Venta.findByPk(idventas, {
      include: [
        {
          model: DetalleVenta,
          as: 'detalles',
          include: [{ model: Servicio, as: 'servicio' }]
        },
        {
          model: PagoVenta,
          as: 'pagos',
          include: [{ model: MetodoPago, as: 'metodoPago' }]
        }
      ]
    });

    if (!venta) {
      const error = new Error('Venta no encontrada');
      error.statusCode = 404;
      throw error;
    }

    return venta;
  }

  async create(data) {
    const { origen, idorigen, fecha, estado, total, detalles } = data;

    const transaction = await sequelize.transaction();

    try {
      const venta = await Venta.create({
        origen,
        idorigen,
        fecha: fecha || new Date(),
        estado: estado || 'pendiente',
        total: total || 0
      }, { transaction });

      if (detalles && detalles.length > 0) {
        const detallesData = detalles.map(d => ({
          idventas: venta.idventas,
          idservicios: d.idservicios,
          cantidad: d.cantidad || 1,
          precio_unitario: d.precio_unitario
        }));

        await DetalleVenta.bulkCreate(detallesData, { transaction });

        // Calculate total
        const calculatedTotal = detalles.reduce((sum, d) => {
          return sum + (parseFloat(d.precio_unitario) * (d.cantidad || 1));
        }, 0);

        await venta.update({ total: calculatedTotal }, { transaction });
      }

      await transaction.commit();
      return await this.findById(venta.idventas);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async update(idventas, data) {
    const venta = await Venta.findByPk(idventas);
    if (!venta) {
      const error = new Error('Venta no encontrada');
      error.statusCode = 404;
      throw error;
    }

    await venta.update(data);
    return await this.findById(idventas);
  }

  async delete(idventas) {
    const venta = await Venta.findByPk(idventas);
    if (!venta) {
      const error = new Error('Venta no encontrada');
      error.statusCode = 404;
      throw error;
    }
    await venta.destroy();
    return { message: 'Venta eliminada exitosamente' };
  }

  // Detalles de venta
  async findAllDetalles() {
    return await DetalleVenta.findAll({
      include: [
        { model: Venta, as: 'venta' },
        { model: Servicio, as: 'servicio' }
      ]
    });
  }

  async findDetallesByVenta(idventas) {
    return await DetalleVenta.findAll({
      where: { idventas },
      include: [{ model: Servicio, as: 'servicio' }]
    });
  }

  async createDetalle(data) {
    const detalle = await DetalleVenta.create(data);

    // Update venta total
    const detalles = await DetalleVenta.findAll({ where: { idventas: data.idventas } });
    const total = detalles.reduce((sum, d) => sum + (parseFloat(d.precio_unitario) * d.cantidad), 0);
    await Venta.update({ total }, { where: { idventas: data.idventas } });

    return await DetalleVenta.findByPk(detalle.iddetalleventas, {
      include: [{ model: Servicio, as: 'servicio' }]
    });
  }

  async deleteDetalle(iddetalleventas) {
    const detalle = await DetalleVenta.findByPk(iddetalleventas);
    if (!detalle) {
      const error = new Error('Detalle no encontrado');
      error.statusCode = 404;
      throw error;
    }

    const idventas = detalle.idventas;
    await detalle.destroy();

    // Update venta total
    const detalles = await DetalleVenta.findAll({ where: { idventas } });
    const total = detalles.reduce((sum, d) => sum + (parseFloat(d.precio_unitario) * d.cantidad), 0);
    await Venta.update({ total }, { where: { idventas } });

    return { message: 'Detalle eliminado exitosamente' };
  }

  // Pagos de venta
  async findAllPagos() {
    return await PagoVenta.findAll({
      include: [
        { model: Venta, as: 'venta' },
        { model: MetodoPago, as: 'metodoPago' }
      ]
    });
  }

  async findPagosByVenta(idventas) {
    return await PagoVenta.findAll({
      where: { idventas },
      include: [{ model: MetodoPago, as: 'metodoPago' }]
    });
  }

  async createPago(data) {
    const { idventas, idmpago, valor, comprobante } = data;

    // Verify venta exists
    const venta = await Venta.findByPk(idventas);
    if (!venta) {
      const error = new Error('Venta no encontrada');
      error.statusCode = 404;
      throw error;
    }

    // Check if payment exceeds balance
    const pagosExistentes = await PagoVenta.findAll({ where: { idventas } });
    const totalPagado = pagosExistentes.reduce((sum, p) => sum + parseFloat(p.valor), 0);
    const saldoPendiente = parseFloat(venta.total) - totalPagado;

    if (parseFloat(valor) > saldoPendiente) {
      const error = new Error('El pago excede el saldo pendiente');
      error.statusCode = 409;
      throw error;
    }

    const pago = await PagoVenta.create({
      idventas,
      idmpago,
      valor,
      fecha: new Date(),
      comprobante
    });

    // Update venta status if fully paid
    const nuevoTotalPagado = totalPagado + parseFloat(valor);
    if (nuevoTotalPagado >= parseFloat(venta.total)) {
      await venta.update({ estado: 'pagada' });
    }

    return await PagoVenta.findByPk(pago.idpagoventas, {
      include: [{ model: MetodoPago, as: 'metodoPago' }]
    });
  }

  async deletePago(idpagoventas) {
    const pago = await PagoVenta.findByPk(idpagoventas);
    if (!pago) {
      const error = new Error('Pago no encontrado');
      error.statusCode = 404;
      throw error;
    }

    const idventas = pago.idventas;
    await pago.destroy();

    // Update venta status
    const venta = await Venta.findByPk(idventas);
    const pagosRestantes = await PagoVenta.findAll({ where: { idventas } });
    const totalPagado = pagosRestantes.reduce((sum, p) => sum + parseFloat(p.valor), 0);

    if (totalPagado < parseFloat(venta.total)) {
      await venta.update({ estado: 'pendiente' });
    }

    return { message: 'Pago eliminado exitosamente' };
  }
}

module.exports = new SalesService();
