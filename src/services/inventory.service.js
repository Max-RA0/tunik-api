const { Producto, Proveedor, Pedido, DetallePedidoProducto } = require('../models');
const { Op } = require('sequelize');

class InventoryService {
  // PRODUCTOS
  async findAllProductos(query = {}) {
    const { q } = query;
    const where = {};
    if (q) where.nombreproductos = { [Op.like]: `%${q}%` };

    const productos = await Producto.findAll({
      where,
      include: [{ model: Proveedor, as: 'proveedor' }],
    });

    return productos.map((p) => ({
      ...p.toJSON(),
      stockbase: parseFloat(p.stockbase),
      precio: parseFloat(p.precio),
    }));
  }

  async createProducto(data) {
    return await Producto.create(data);
  }

  async updateProducto(idproductos, data) {
    const producto = await Producto.findByPk(idproductos);
    if (!producto) {
      const error = new Error('Producto no encontrado');
      error.statusCode = 404;
      throw error;
    }

    await producto.update(data);
    return producto;
  }

  async deleteProducto(idproductos) {
    const producto = await Producto.findByPk(idproductos);
    if (!producto) {
      const error = new Error('Producto no encontrado');
      error.statusCode = 404;
      throw error;
    }

    await producto.destroy();
    return { message: 'Producto eliminado exitosamente' };
  }

  // PROVEEDORES
  async findAllProveedores() {
    return await Proveedor.findAll();
  }

  async createProveedor(data) {
    return await Proveedor.create(data);
  }

  async updateProveedor(idproveedor, data) {
    const proveedor = await Proveedor.findByPk(idproveedor);
    if (!proveedor) {
      const error = new Error('Proveedor no encontrado');
      error.statusCode = 404;
      throw error;
    }

    await proveedor.update(data);
    return proveedor;
  }

  async deleteProveedor(idproveedor) {
    const proveedor = await Proveedor.findByPk(idproveedor);
    if (!proveedor) {
      const error = new Error('Proveedor no encontrado');
      error.statusCode = 404;
      throw error;
    }

    await proveedor.destroy();
    return { message: 'Proveedor eliminado exitosamente' };
  }

  // KEYWORDS: PEDIDOS / CODCOMPRAS / AUTOGENERATE / UNIQUE_CODE
  async generarCodCompra() {
    const ultimoPedido = await Pedido.findOne({
      where: {
        codcompras: {
          [Op.like]: 'COM-%',
        },
      },
      order: [['idpedidos', 'DESC']],
    });

    let siguiente = 200;

    if (ultimoPedido?.codcompras) {
      const partes = String(ultimoPedido.codcompras).split('-');
      const numeroActual = Number(partes[1]);

      if (!Number.isNaN(numeroActual)) {
        siguiente = numeroActual + 1;
      }
    }

    return `COM-${String(siguiente).padStart(6, '0')}`;
  }

  // KEYWORDS: NORMALIZE_PEDIDO_OUTPUT / CLEAN_DECIMALS
  normalizePedidoOutput(pedido) {
    const p = pedido.toJSON ? pedido.toJSON() : pedido;

    p.detalles = (p.detalles || []).map((detalle) => {
      if (detalle.producto) {
        detalle.producto.stockbase = parseFloat(detalle.producto.stockbase);
        detalle.producto.precio = parseFloat(detalle.producto.precio);
      }

      if (detalle.preciounitario !== undefined && detalle.preciounitario !== null) {
        detalle.preciounitario = parseFloat(detalle.preciounitario);
      }

      if (detalle.total !== undefined && detalle.total !== null) {
        detalle.total = parseFloat(detalle.total);
      }

      if (detalle.cantidadcontenidobase !== undefined && detalle.cantidadcontenidobase !== null) {
        detalle.cantidadcontenidobase = parseFloat(detalle.cantidadcontenidobase);
      }

      if (detalle.cantidadcontenido !== undefined && detalle.cantidadcontenido !== null) {
        detalle.cantidadcontenido = parseFloat(detalle.cantidadcontenido);
      }

      return detalle;
    });

    return p;
  }

  // KEYWORDS: CALC_ROLLOS_LONGITUD / 21M_MAX
  calcularCantidadExistentePorMedida(producto, cantidad, cantidadContenido, unidadContenido) {
    const unidad = String(unidadContenido || '').toLowerCase().trim();

    if (producto.tipomedida === 'longitud') {
      let metrosTotales = 0;

      if (unidad === 'm' || unidad === 'metro' || unidad === 'metros') {
        metrosTotales = Number(cantidad) * Number(cantidadContenido);
      } else if (unidad === 'cm') {
        metrosTotales = (Number(cantidad) * Number(cantidadContenido)) / 100;
      }

      // cada rollo soporta maximo 21 metros
      return Math.ceil(metrosTotales / 21);
    }

    // volumen y unidad siguen sumando por cantidad fisica comprada
    return Number(cantidad);
  }

  // KEYWORDS: REVERSA_DETALLE / STOCK / CANTIDAD_EXISTENTE
  calcularReversaDetalle(detalle, producto) {
    const cantidad = Number(detalle.cantidad || 0);
    const cantidadContenidoBase = Number(detalle.cantidadcontenidobase || 0);
    const cantidadContenido = Number(detalle.cantidadcontenido || 0);
    const unidadContenido = detalle.unidadcontenido || '';

    const reversaStock = Number((cantidad * cantidadContenidoBase).toFixed(3));
    const reversaCantidadExistente = this.calcularCantidadExistentePorMedida(
      producto,
      cantidad,
      cantidadContenido,
      unidadContenido
    );

    return {
      reversaStock,
      reversaCantidadExistente,
    };
  }

  // PEDIDOS
  async findAllPedidos(query = {}) {
    const { estado, idproveedor } = query;
    const where = {};
    if (estado) where.estado = estado;
    if (idproveedor) where.idproveedor = idproveedor;

    const pedidos = await Pedido.findAll({
      where,
      include: [
        { model: Proveedor, as: 'proveedor' },
        {
          model: DetallePedidoProducto,
          as: 'detalles',
          include: [{ model: Producto, as: 'producto' }],
        },
      ],
      order: [['fechaPedido', 'DESC']],
    });

    return pedidos.map((pedido) => this.normalizePedidoOutput(pedido));
  }

  async findPedidoById(idpedidos) {
    const pedido = await Pedido.findByPk(idpedidos, {
      include: [
        { model: Proveedor, as: 'proveedor' },
        {
          model: DetallePedidoProducto,
          as: 'detalles',
          include: [{ model: Producto, as: 'producto' }],
        },
      ],
    });

    if (!pedido) {
      const error = new Error('Pedido no encontrado');
      error.statusCode = 404;
      throw error;
    }

    return this.normalizePedidoOutput(pedido);
  }

  async createPedido(data) {
    const idproveedor = Number(data?.idproveedor);
    if (!idproveedor) {
      const error = new Error('Proveedor es requerido');
      error.statusCode = 400;
      throw error;
    }

    const proveedor = await Proveedor.findByPk(idproveedor);
    if (!proveedor) {
      const error = new Error('Proveedor no válido');
      error.statusCode = 400;
      throw error;
    }

    let codcompras = data?.codcompras ? String(data.codcompras).trim() : '';

    if (codcompras) {
      const existeCodigo = await Pedido.findOne({
        where: { codcompras },
      });

      if (existeCodigo) {
        const error = new Error('El código de compra ya existe');
        error.statusCode = 400;
        throw error;
      }
    } else {
      codcompras = await this.generarCodCompra();
    }

    const estadoFinal = String(data?.estado || 'Realizada').trim();

    if (estadoFinal !== 'Realizada') {
      const error = new Error("Al crear un pedido solo se permite el estado 'Realizada'");
      error.statusCode = 400;
      throw error;
    }

    const pedido = await Pedido.create({
      ...data,
      codcompras,
      idproveedor,
      estado: estadoFinal,
    });

    return await this.findPedidoById(pedido.idpedidos);
  }

  async updatePedido(idpedidos, data) {
    const pedido = await Pedido.findByPk(idpedidos);
    if (!pedido) {
      const error = new Error('Pedido no encontrado');
      error.statusCode = 404;
      throw error;
    }


    if (data?.idproveedor !== undefined && data?.idproveedor !== null) {
      const idproveedor = Number(data.idproveedor);
      const proveedor = await Proveedor.findByPk(idproveedor);
      if (!proveedor) {
        const error = new Error('Proveedor no válido');
        error.statusCode = 400;
        throw error;
      }
      data.idproveedor = idproveedor;
    }

    if (data?.codcompras !== undefined) {
      const codcompras = String(data.codcompras).trim();

      const existeCodigo = await Pedido.findOne({
        where: {
          codcompras,
          idpedidos: { [Op.ne]: Number(idpedidos) },
        },
      });

      if (existeCodigo) {
        const error = new Error('El código de compra ya existe');
        error.statusCode = 400;
        throw error;
      }

      data.codcompras = codcompras;
    }

    if (data?.estado !== undefined) {
      const nuevoEstado = String(data.estado).trim();

      if (!['Realizada', 'Anulada'].includes(nuevoEstado)) {
        const error = new Error("El estado del pedido solo puede ser 'Realizada' o 'Anulada'");
        error.statusCode = 400;
        throw error;
      }

      // KEYWORDS: BLOQUEAR_ANULACION_SI_NO_ALCANZA_STOCK
      if (pedido.estado === 'Realizada' && nuevoEstado === 'Anulada') {
        const detalles = await DetallePedidoProducto.findAll({
          where: { idpedido: Number(idpedidos) },
        });

        // validar primero
        for (const detalle of detalles) {
          const producto = await Producto.findByPk(Number(detalle.idproducto));

          if (!producto) {
            const error = new Error('Producto asociado no encontrado');
            error.statusCode = 404;
            throw error;
          }

          const { reversaStock, reversaCantidadExistente } = this.calcularReversaDetalle(detalle, producto);

          const stockActual = Number(producto.stockbase || 0);
          const cantidadExistenteActual = Number(producto.cantidadexistente || 0);

          if (stockActual < reversaStock) {
            const error = new Error(
              `No se puede anular el pedido porque el stock de ${producto.nombreproductos} no alcanza para revertir la compra`
            );
            error.statusCode = 400;
            throw error;
          }

          if (cantidadExistenteActual < reversaCantidadExistente) {
            const error = new Error(
              `No se puede anular el pedido porque la cantidad existente de ${producto.nombreproductos} no alcanza para revertir la compra`
            );
            error.statusCode = 400;
            throw error;
          }
        }

        // aplicar reversa
        for (const detalle of detalles) {
          const producto = await Producto.findByPk(Number(detalle.idproducto));

          const { reversaStock, reversaCantidadExistente } = this.calcularReversaDetalle(detalle, producto);

          const stockActual = Number(producto.stockbase || 0);
          const cantidadExistenteActual = Number(producto.cantidadexistente || 0);

          const nuevoStock = Number((stockActual - reversaStock).toFixed(3));
          const nuevaCantidadExistente = cantidadExistenteActual - reversaCantidadExistente;

          await producto.update({
            stockbase: nuevoStock < 0 ? 0 : nuevoStock,
            cantidadexistente: nuevaCantidadExistente < 0 ? 0 : nuevaCantidadExistente,
          });
        }
      }
    }

    await pedido.update(data);
    return await this.findPedidoById(idpedidos);
  }

  async deletePedido(idpedidos) {
    const pedido = await Pedido.findByPk(idpedidos);
    if (!pedido) {
      const error = new Error('Pedido no encontrado');
      error.statusCode = 404;
      throw error;
    }

    await pedido.destroy();
    return { message: 'Pedido eliminado exitosamente' };
  }

  // DETALLES
  async findAllDetallesPedido() {
    const detalles = await DetallePedidoProducto.findAll({
      include: [{ model: Producto, as: 'producto' }],
    });

    return detalles.map((detalle) => {
      const d = detalle.toJSON();

      if (d.producto) {
        d.producto.stockbase = parseFloat(d.producto.stockbase);
        d.producto.precio = parseFloat(d.producto.precio);
      }

      if (d.preciounitario !== undefined && d.preciounitario !== null) {
        d.preciounitario = parseFloat(d.preciounitario);
      }

      if (d.total !== undefined && d.total !== null) {
        d.total = parseFloat(d.total);
      }

      if (d.cantidadcontenidobase !== undefined && d.cantidadcontenidobase !== null) {
        d.cantidadcontenidobase = parseFloat(d.cantidadcontenidobase);
      }

      return d;
    });
  }

  async findDetallesByPedido(idpedidos) {
    const detalles = await DetallePedidoProducto.findAll({
      where: { idpedido: Number(idpedidos) },
      include: [{ model: Producto, as: 'producto' }],
    });

    return detalles.map((detalle) => {
      const d = detalle.toJSON();

      if (d.producto) {
        d.producto.stockbase = parseFloat(d.producto.stockbase);
        d.producto.precio = parseFloat(d.producto.precio);
      }

      if (d.preciounitario !== undefined && d.preciounitario !== null) {
        d.preciounitario = parseFloat(d.preciounitario);
      }

      if (d.total !== undefined && d.total !== null) {
        d.total = parseFloat(d.total);
      }

      if (d.cantidadcontenidobase !== undefined && d.cantidadcontenidobase !== null) {
        d.cantidadcontenidobase = parseFloat(d.cantidadcontenidobase);
      }

      return d;
    });
  }

  async createDetallePedido(detalleData) {
    const idpedido = Number(detalleData?.idpedido);
    const idproveedor = Number(detalleData?.idproveedor);
    const idproducto = Number(detalleData?.idproducto);
    const cantidad = Number(detalleData?.cantidad);

    if (!idpedido || !idproveedor || !idproducto || !cantidad) {
      const error = new Error('Datos de detalle incompletos');
      error.statusCode = 400;
      throw error;
    }

    const pedido = await Pedido.findByPk(idpedido);
    if (!pedido) {
      const error = new Error('Pedido no válido');
      error.statusCode = 400;
      throw error;
    }

    if (Number(pedido.idproveedor) !== idproveedor) {
      const error = new Error('El proveedor no coincide con el pedido');
      error.statusCode = 400;
      throw error;
    }

    const producto = await Producto.findByPk(idproducto);
    if (!producto) {
      const error = new Error('Producto no válido');
      error.statusCode = 400;
      throw error;
    }

    if (Number(producto.idproveedor) !== idproveedor) {
      const error = new Error('El producto no pertenece al proveedor seleccionado');
      error.statusCode = 400;
      throw error;
    }

    const precioUnitario = Number(detalleData?.preciounitario);
    if (Number.isNaN(precioUnitario) || precioUnitario <= 0) {
      const error = new Error('El precio unitario debe ser mayor a 0');
      error.statusCode = 400;
      throw error;
    }

    const cantidadContenido = Number(detalleData?.cantidadcontenido);
    const unidadContenido = detalleData?.unidadcontenido;

    if (Number.isNaN(cantidadContenido) || cantidadContenido <= 0 || !unidadContenido) {
      const error = new Error('Cantidad de contenido y unidad de contenido son requeridos');
      error.statusCode = 400;
      throw error;
    }

    const cantidadContenidoBase = this.convertirContenidoABase(
      producto,
      cantidadContenido,
      unidadContenido
    );

    const entradaTotalBase = Number((cantidad * cantidadContenidoBase));
    const stockActual = Number(producto.stockbase || 0);
    const nuevoStock = Number((stockActual + entradaTotalBase).toFixed(3));

    const cantidadExistenteActual = Number(producto.cantidadexistente || 0);
    const cantidadAumentar = this.calcularCantidadExistentePorMedida(
      producto,
      cantidad,
      cantidadContenido,
      unidadContenido
    );
    const nuevaCantidadExistente = cantidadExistenteActual + cantidadAumentar;

    await producto.update({
      precio: precioUnitario,
      stockbase: nuevoStock,
      cantidadexistente: nuevaCantidadExistente,
    });

    const total = Number((cantidad * precioUnitario).toFixed(2));

    const detalle = await DetallePedidoProducto.create({
      ...detalleData,
      idpedido,
      idproveedor,
      idproducto,
      cantidad,
      preciounitario: precioUnitario,
      cantidadcontenido: cantidadContenido,
      unidadcontenido: unidadContenido,
      cantidadcontenidobase: cantidadContenidoBase,
      total,
    });

    const detalleJson = detalle.toJSON();
    detalleJson.preciounitario = parseFloat(detalleJson.preciounitario);
    detalleJson.total = parseFloat(detalleJson.total);
    detalleJson.cantidadcontenidobase = parseFloat(detalleJson.cantidadcontenidobase);

    return detalleJson;
  }

  async updateDetallePedido(idpedido, idproducto, data) {
    const detalle = await DetallePedidoProducto.findOne({
      where: { idpedido: Number(idpedido), idproducto: Number(idproducto) },
    });

    if (!detalle) {
      const error = new Error('Detalle de pedido no encontrado');
      error.statusCode = 404;
      throw error;
    }

    const producto = await Producto.findByPk(Number(idproducto));
    if (!producto) {
      const error = new Error('Producto no encontrado');
      error.statusCode = 404;
      throw error;
    }

    const cantidadAnterior = Number(detalle.cantidad || 0);
    const cantidadContenidoAnterior = Number(detalle.cantidadcontenido || 0);
    const unidadContenidoAnterior = detalle.unidadcontenido || '';
    const cantidadContenidoBaseAnterior = Number(detalle.cantidadcontenidobase || 0);

    const cantidadNueva =
      data?.cantidad !== undefined ? Number(data.cantidad) : cantidadAnterior;

    if (Number.isNaN(cantidadNueva) || cantidadNueva < 1) {
      const error = new Error('Cantidad debe ser mayor a 0');
      error.statusCode = 400;
      throw error;
    }

    const precioNuevo =
      data?.preciounitario !== undefined ? Number(data.preciounitario) : Number(detalle.preciounitario);

    if (Number.isNaN(precioNuevo) || precioNuevo <= 0) {
      const error = new Error('El precio unitario debe ser mayor a 0');
      error.statusCode = 400;
      throw error;
    }

    const cantidadContenidoNueva =
      data?.cantidadcontenido !== undefined ? Number(data.cantidadcontenido) : cantidadContenidoAnterior;

    const unidadContenidoNueva =
      data?.unidadcontenido !== undefined ? data.unidadcontenido : unidadContenidoAnterior;

    if (Number.isNaN(cantidadContenidoNueva) || cantidadContenidoNueva <= 0 || !unidadContenidoNueva) {
      const error = new Error('Cantidad de contenido y unidad de contenido son requeridos');
      error.statusCode = 400;
      throw error;
    }

    const cantidadContenidoBaseNueva = this.convertirContenidoABase(
      producto,
      cantidadContenidoNueva,
      unidadContenidoNueva
    );

    const entradaAnterior = Number((cantidadAnterior * cantidadContenidoBaseAnterior).toFixed(3));
    const entradaNueva = Number((cantidadNueva * cantidadContenidoBaseNueva).toFixed(3));

    const cantidadExistenteAnterior = this.calcularCantidadExistentePorMedida(
      producto,
      cantidadAnterior,
      cantidadContenidoAnterior,
      unidadContenidoAnterior
    );

    const cantidadExistenteNueva = this.calcularCantidadExistentePorMedida(
      producto,
      cantidadNueva,
      cantidadContenidoNueva,
      unidadContenidoNueva
    );

    const stockActual = Number(producto.stockbase || 0);
    const cantidadExistenteActual = Number(producto.cantidadexistente || 0);

    const stockSinDetalleActual = Number((stockActual - entradaAnterior).toFixed(3));
    const cantidadExistenteSinDetalleActual = cantidadExistenteActual - cantidadExistenteAnterior;

    if (stockSinDetalleActual < 0 || cantidadExistenteSinDetalleActual < 0) {
      const error = new Error('No se puede actualizar el detalle porque el inventario actual quedó inconsistente');
      error.statusCode = 400;
      throw error;
    }

    const nuevoStock = Number((stockSinDetalleActual + entradaNueva).toFixed(3));
    const nuevaCantidadExistente = cantidadExistenteSinDetalleActual + cantidadExistenteNueva;

    await producto.update({
      precio: precioNuevo,
      stockbase: nuevoStock,
      cantidadexistente: nuevaCantidadExistente,
    });

    data.cantidad = cantidadNueva;
    data.preciounitario = precioNuevo;
    data.cantidadcontenido = cantidadContenidoNueva;
    data.unidadcontenido = unidadContenidoNueva;
    data.cantidadcontenidobase = cantidadContenidoBaseNueva;
    data.total = Number((cantidadNueva * precioNuevo).toFixed(2));

    await detalle.update(data);

    const detalleActualizado = await DetallePedidoProducto.findOne({
      where: { idpedido: Number(idpedido), idproducto: Number(idproducto) },
      include: [{ model: Producto, as: 'producto' }],
    });

    const d = detalleActualizado.toJSON();

    if (d.producto) {
      d.producto.stockbase = parseFloat(d.producto.stockbase);
      d.producto.precio = parseFloat(d.producto.precio);
    }
    d.preciounitario = parseFloat(d.preciounitario);
    d.total = parseFloat(d.total);
    d.cantidadcontenidobase = parseFloat(d.cantidadcontenidobase);

    return d;
  }

  async deleteDetallePedido(idpedido, idproducto) {
    const detalle = await DetallePedidoProducto.findOne({
      where: { idpedido: Number(idpedido), idproducto: Number(idproducto) },
    });

    if (!detalle) {
      const error = new Error('Detalle de pedido no encontrado');
      error.statusCode = 404;
      throw error;
    }

    const producto = await Producto.findByPk(Number(idproducto));
    if (!producto) {
      const error = new Error('Producto no encontrado');
      error.statusCode = 404;
      throw error;
    }

    const { reversaStock, reversaCantidadExistente } = this.calcularReversaDetalle(detalle, producto);

    const stockActual = Number(producto.stockbase || 0);
    const cantidadExistenteActual = Number(producto.cantidadexistente || 0);

    if (stockActual < reversaStock) {
      const error = new Error(
        `No se puede eliminar el detalle porque el stock de ${producto.nombreproductos} no alcanza para revertir la compra`
      );
      error.statusCode = 400;
      throw error;
    }

    if (cantidadExistenteActual < reversaCantidadExistente) {
      const error = new Error(
        `No se puede eliminar el detalle porque la cantidad existente de ${producto.nombreproductos} no alcanza para revertir la compra`
      );
      error.statusCode = 400;
      throw error;
    }

    const nuevoStock = Number((stockActual - reversaStock).toFixed(3));
    const nuevaCantidadExistente = cantidadExistenteActual - reversaCantidadExistente;

    await producto.update({
      stockbase: nuevoStock < 0 ? 0 : nuevoStock,
      cantidadexistente: nuevaCantidadExistente < 0 ? 0 : nuevaCantidadExistente,
    });

    await detalle.destroy();
    return { message: 'Detalle de pedido eliminado exitosamente' };
  }

  // KEYWORDS: SOLO_GALONES_EN_VOLUMEN / M_A_CM_EN_LONGITUD
  convertirContenidoABase(producto, cantidadContenido, unidadContenido) {
    const cantidad = Number(cantidadContenido);
    const unidad = String(unidadContenido || '').toLowerCase().trim();

    if (Number.isNaN(cantidad) || cantidad <= 0) {
      const error = new Error('La cantidad de contenido debe ser mayor a 0');
      error.statusCode = 400;
      throw error;
    }

    if (!producto?.tipomedida || !producto?.unidadbase) {
      const error = new Error(
        `El producto ${producto?.nombreproductos || ''} no tiene tipo de medida o unidad base configurada`
      );
      error.statusCode = 400;
      throw error;
    }

    if (producto.tipomedida === 'volumen') {
      if (unidad === 'gal' || unidad === 'galon' || unidad === 'galones') {
        return cantidad;
      }

      const error = new Error('Para productos de volumen solo se permiten galones');
      error.statusCode = 400;
      throw error;
    }

    if (producto.tipomedida === 'longitud') {
      if (unidad === 'm' || unidad === 'metro' || unidad === 'metros') {
        return cantidad * 100;
      }
      if (unidad === 'cm') {
        return cantidad;
      }

      const error = new Error('Unidad de contenido no válida para productos de longitud');
      error.statusCode = 400;
      throw error;
    }

    if (producto.tipomedida === 'unidad') {
      return cantidad;
    }

    const error = new Error('Tipo de medida no soportado');
    error.statusCode = 400;
    throw error;
  }
}

module.exports = new InventoryService();
