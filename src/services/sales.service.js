// src/services/sales.service.js
// KEYWORDS: SALES_SERVICE / MULTI_VEHICLES / DETALLES_WITH_PLACA / TRANSACTION / TOTAL_CALC
// KEYWORDS: CONSUMO_PRODUCTO / AUTO_DISCOUNT_STOCK / CONVERT_CONSUMO_TO_BASE

const { Venta, DetalleVenta, PagoVenta, MetodoPago, Servicio, Producto } = require("../models");
const { Op } = require("sequelize");
const { sequelize } = require("../database/connection");

class SalesService {
  // KEYWORDS: CONVERT_CONSUMO_TO_BASE / VOLUMEN / LONGITUD / UNIDAD
  convertirConsumoABase(producto, cantidadConsumo, unidadConsumo) {
    const cantidad = Number(cantidadConsumo);
    const unidad = String(unidadConsumo || "").toLowerCase().trim();

    if (Number.isNaN(cantidad) || cantidad <= 0) {
      const error = new Error("La cantidad de consumo debe ser mayor a 0");
      error.statusCode = 400;
      throw error;
    }

    if (!producto?.tipomedida || !producto?.unidadbase) {
      const error = new Error(
        `El producto ${producto?.nombreproductos || ""} no tiene tipo de medida o unidad base configurada`
      );
      error.statusCode = 400;
      throw error;
    }

    // KEYWORDS: CONVERSION_VOLUMEN
    if (producto.tipomedida === "volumen") {
      if (unidad === "ml") return cantidad;
      if (unidad === "l" || unidad === "lt" || unidad === "litro" || unidad === "litros") {
        return cantidad * 1000;
      }
      if (unidad === "gal" || unidad === "galon" || unidad === "galones") {
        return cantidad * 3785.41;
      }

      const error = new Error("Unidad de consumo no válida para productos de volumen");
      error.statusCode = 400;
      throw error;
    }

    // KEYWORDS: CONVERSION_LONGITUD
    if (producto.tipomedida === "longitud") {
      if (unidad === "cm") return cantidad;
      if (unidad === "m" || unidad === "metro" || unidad === "metros") {
        return cantidad * 100;
      }

      const error = new Error("Unidad de consumo no válida para productos de longitud");
      error.statusCode = 400;
      throw error;
    }

    // KEYWORDS: CONVERSION_UNIDAD
    if (producto.tipomedida === "unidad") {
      return cantidad;
    }

    const error = new Error("Tipo de medida no soportado");
    error.statusCode = 400;
    throw error;
  }

  // Ventas
  async findAll(query = {}) {
    const { estado, from, to } = query;
    const where = {};

    if (estado) where.estado = estado;

    if (from && to) {
      where.fecha = { [Op.between]: [new Date(from), new Date(to)] };
    }

    return await Venta.findAll({
      where,
      include: [
        {
          model: DetalleVenta,
          as: "detalles",
          include: [
            { model: Servicio, as: "servicio" },
            { model: Producto, as: "producto", required: false },
          ],
        },
        { model: PagoVenta, as: "pagos", include: [{ model: MetodoPago, as: "metodoPago" }] },
      ],
      order: [["fecha", "DESC"]],
    });
  }

  async findById(idventas) {
    const venta = await Venta.findByPk(idventas, {
      include: [
        {
          model: DetalleVenta,
          as: "detalles",
          include: [
            { model: Servicio, as: "servicio" },
            { model: Producto, as: "producto", required: false },
          ],
        },
        { model: PagoVenta, as: "pagos", include: [{ model: MetodoPago, as: "metodoPago" }] },
      ],
    });

    if (!venta) {
      const error = new Error("Venta no encontrada");
      error.statusCode = 404;
      throw error;
    }
    return venta;
  }

  async create(data) {
    const { origen, fecha, estado, total, detalles } = data;

    const transaction = await sequelize.transaction();

    try {
      const venta = await Venta.create(
        {
          origen,
          fecha: fecha || new Date(),
          estado: estado || "pendiente",
          total: total || 0,
        },
        { transaction }
      );

      if (Array.isArray(detalles) && detalles.length > 0) {
        for (const d of detalles) {
          let cantidadConsumoBase = null;

          // KEYWORDS: CONSUMO_PRODUCTO / AUTO_DISCOUNT_STOCK
          if (
            d.idproducto !== undefined &&
            d.idproducto !== null &&
            d.cantidadconsumo !== undefined &&
            d.cantidadconsumo !== null &&
            d.unidadconsumo
          ) {
            const producto = await Producto.findByPk(Number(d.idproducto), { transaction });

            if (!producto) {
              const error = new Error("Producto no encontrado");
              error.statusCode = 404;
              throw error;
            }

            cantidadConsumoBase = this.convertirConsumoABase(
              producto,
              d.cantidadconsumo,
              d.unidadconsumo
            );

            const stockActual = Number(producto.stockbase || 0);

            if (stockActual < cantidadConsumoBase) {
              const error = new Error(`Stock insuficiente para ${producto.nombreproductos}`);
              error.statusCode = 400;
              throw error;
            }

            await producto.update(
              {
                stockbase: Number((stockActual - cantidadConsumoBase).toFixed(3)),
              },
              { transaction }
            );
          }

          await DetalleVenta.create(
            {
              idventas: venta.idventas,
              idservicios: d.idservicios,
              cantidad: d.cantidad || 1,
              precio_unitario: d.precio_unitario,
              placa: d.placa || null,
              descripcionvehiculo: d.descripcionvehiculo || null,

              // KEYWORDS: NUEVOS_CAMPOS_CONSUMO
              idproducto: d.idproducto || null,
              cantidadconsumo: d.cantidadconsumo || null,
              unidadconsumo: d.unidadconsumo || null,
              cantidadconsumobase: cantidadConsumoBase,
            },
            { transaction }
          );
        }

        // KEYWORDS: TOTAL_CALC
        const calculatedTotal = detalles.reduce((sum, d) => {
          const qty = d.cantidad || 1;
          return sum + parseFloat(d.precio_unitario) * qty;
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
      const error = new Error("Venta no encontrada");
      error.statusCode = 404;
      throw error;
    }
    await venta.update(data);
    return await this.findById(idventas);
  }

  async delete(idventas) {
    const venta = await Venta.findByPk(idventas);
    if (!venta) {
      const error = new Error("Venta no encontrada");
      error.statusCode = 404;
      throw error;
    }
    await venta.destroy();
    return { message: "Venta eliminada exitosamente" };
  }

  // Detalles de venta
  async findAllDetalles() {
    return await DetalleVenta.findAll({
      include: [
        { model: Venta, as: "venta" },
        { model: Servicio, as: "servicio" },
        { model: Producto, as: "producto", required: false },
      ],
    });
  }

  async findDetallesByVenta(idventas) {
    return await DetalleVenta.findAll({
      where: { idventas },
      include: [
        { model: Servicio, as: "servicio" },
        { model: Producto, as: "producto", required: false },
      ],
    });
  }

  async createDetalle(data) {
    const transaction = await sequelize.transaction();

    try {
      let cantidadConsumoBase = null;

      if (
        data.idproducto !== undefined &&
        data.idproducto !== null &&
        data.cantidadconsumo !== undefined &&
        data.cantidadconsumo !== null &&
        data.unidadconsumo
      ) {
        const producto = await Producto.findByPk(Number(data.idproducto), { transaction });

        if (!producto) {
          const error = new Error("Producto no encontrado");
          error.statusCode = 404;
          throw error;
        }

        cantidadConsumoBase = this.convertirConsumoABase(
          producto,
          data.cantidadconsumo,
          data.unidadconsumo
        );

        const stockActual = Number(producto.stockbase || 0);

        if (stockActual < cantidadConsumoBase) {
          const error = new Error(`Stock insuficiente para ${producto.nombreproductos}`);
          error.statusCode = 400;
          throw error;
        }

        await producto.update(
          {
            stockbase: Number((stockActual - cantidadConsumoBase).toFixed(3)),
          },
          { transaction }
        );
      }

      const detalle = await DetalleVenta.create(
        {
          ...data,
          cantidadconsumobase: cantidadConsumoBase,
        },
        { transaction }
      );

      const detalles = await DetalleVenta.findAll({
        where: { idventas: data.idventas },
        transaction,
      });

      const total = detalles.reduce(
        (sum, d) => sum + parseFloat(d.precio_unitario) * d.cantidad,
        0
      );

      await Venta.update({ total }, { where: { idventas: data.idventas }, transaction });

      await transaction.commit();

      return await DetalleVenta.findByPk(detalle.iddetalleventas, {
        include: [
          { model: Servicio, as: "servicio" },
          { model: Producto, as: "producto", required: false },
        ],
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async deleteDetalle(iddetalleventas) {
    const detalle = await DetalleVenta.findByPk(iddetalleventas);
    if (!detalle) {
      const error = new Error("Detalle no encontrado");
      error.statusCode = 404;
      throw error;
    }

    const idventas = detalle.idventas;
    await detalle.destroy();

    const detalles = await DetalleVenta.findAll({ where: { idventas } });
    const total = detalles.reduce((sum, d) => sum + parseFloat(d.precio_unitario) * d.cantidad, 0);
    await Venta.update({ total }, { where: { idventas } });

    return { message: "Detalle eliminado exitosamente" };
  }

  // Pagos de venta
  async findAllPagos() {
    return await PagoVenta.findAll({
      include: [
        { model: Venta, as: "venta" },
        { model: MetodoPago, as: "metodoPago" },
      ],
    });
  }

  async findPagosByVenta(idventas) {
    return await PagoVenta.findAll({
      where: { idventas },
      include: [{ model: MetodoPago, as: "metodoPago" }],
    });
  }

  async createPago(data) {
    const { idventas, idmpago, valor, comprobante } = data;

    const venta = await Venta.findByPk(idventas);
    if (!venta) {
      const error = new Error("Venta no encontrada");
      error.statusCode = 404;
      throw error;
    }

    const pagosExistentes = await PagoVenta.findAll({ where: { idventas } });
    const totalPagado = pagosExistentes.reduce((sum, p) => sum + parseFloat(p.valor), 0);
    const saldoPendiente = parseFloat(venta.total) - totalPagado;

    if (parseFloat(valor) > saldoPendiente) {
      const error = new Error("El pago excede el saldo pendiente");
      error.statusCode = 409;
      throw error;
    }

    const pago = await PagoVenta.create({
      idventas,
      idmpago,
      valor,
      fecha: new Date(),
      comprobante,
    });

    const nuevoTotalPagado = totalPagado + parseFloat(valor);
    if (nuevoTotalPagado >= parseFloat(venta.total)) {
      await venta.update({ estado: "pagada" });
    }

    return await PagoVenta.findByPk(pago.idpagoventas, {
      include: [{ model: MetodoPago, as: "metodoPago" }],
    });
  }

  async deletePago(idpagoventas) {
    const pago = await PagoVenta.findByPk(idpagoventas);
    if (!pago) {
      const error = new Error("Pago no encontrado");
      error.statusCode = 404;
      throw error;
    }

    const idventas = pago.idventas;
    await pago.destroy();

    const venta = await Venta.findByPk(idventas);
    const pagosRestantes = await PagoVenta.findAll({ where: { idventas } });
    const totalPagado = pagosRestantes.reduce((sum, p) => sum + parseFloat(p.valor), 0);

    if (totalPagado < parseFloat(venta.total)) {
      await venta.update({ estado: "pendiente" });
    }

    return { message: "Pago eliminado exitosamente" };
  }
}

module.exports = new SalesService();