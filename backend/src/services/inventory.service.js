const { Producto, Proveedor, Pedido } = require('../models');
const { Op } = require('sequelize');

class InventoryService {
  // Productos
  async findAllProductos(query = {}) {
    const { q } = query;
    const where = {};

    if (q) {
      where[Op.or] = [
        { nombreproducto: { [Op.like]: `%${q}%` } },
        { descripcion: { [Op.like]: `%${q}%` } }
      ];
    }

    return await Producto.findAll({ where });
  }

  async findProductoById(idproductos) {
    const producto = await Producto.findByPk(idproductos);
    if (!producto) {
      const error = new Error('Producto no encontrado');
      error.statusCode = 404;
      throw error;
    }
    return producto;
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

  // Proveedores
  async findAllProveedores() {
    return await Proveedor.findAll();
  }

  async findProveedorById(idproveedor) {
    const proveedor = await Proveedor.findByPk(idproveedor);
    if (!proveedor) {
      const error = new Error('Proveedor no encontrado');
      error.statusCode = 404;
      throw error;
    }
    return proveedor;
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

  // Pedidos
  async findAllPedidos(query = {}) {
    const { estado, idproveedor } = query;
    const where = {};

    if (estado) {
      where.estado = estado;
    }

    if (idproveedor) {
      where.idproveedor = idproveedor;
    }

    return await Pedido.findAll({
      where,
      include: [
        { model: Proveedor, as: 'proveedor' },
        { model: Producto, as: 'producto' }
      ],
      order: [['fecha', 'DESC']]
    });
  }

  async findPedidoById(idpedidos) {
    const pedido = await Pedido.findByPk(idpedidos, {
      include: [
        { model: Proveedor, as: 'proveedor' },
        { model: Producto, as: 'producto' }
      ]
    });
    if (!pedido) {
      const error = new Error('Pedido no encontrado');
      error.statusCode = 404;
      throw error;
    }
    return pedido;
  }

  async createPedido(data) {
    const pedido = await Pedido.create({
      ...data,
      estado: data.estado || 'Pendiente'
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

    const previousEstado = pedido.estado;
    await pedido.update(data);

    // If status changed to "Recibido", update product stock
    if (data.estado === 'Recibido' && previousEstado !== 'Recibido') {
      const producto = await Producto.findByPk(pedido.idproductos);
      if (producto) {
        await producto.update({
          stock: producto.stock + pedido.cantidad
        });
      }
    }

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
}

module.exports = new InventoryService();
