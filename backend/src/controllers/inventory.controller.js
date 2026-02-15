const inventoryService = require('../services/inventory.service');
const response = require('../utils/response.util');

class InventoryController {
  // Productos
  async findAllProductos(req, res, next) {
    try {
      const productos = await inventoryService.findAllProductos(req.query);
      return response.success(res, productos);
    } catch (error) {
      next(error);
    }
  }

  async createProducto(req, res, next) {
    try {
      const producto = await inventoryService.createProducto(req.body);
      return response.created(res, producto, 'Producto creado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async updateProducto(req, res, next) {
    try {
      const { idproductos } = req.params;
      const producto = await inventoryService.updateProducto(idproductos, req.body);
      return response.success(res, producto, 'Producto actualizado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async deleteProducto(req, res, next) {
    try {
      const { idproductos } = req.params;
      await inventoryService.deleteProducto(idproductos);
      return response.success(res, null, 'Producto eliminado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  // Proveedores
  async findAllProveedores(req, res, next) {
    try {
      const proveedores = await inventoryService.findAllProveedores();
      return response.success(res, proveedores);
    } catch (error) {
      next(error);
    }
  }

  async createProveedor(req, res, next) {
    try {
      const proveedor = await inventoryService.createProveedor(req.body);
      return response.created(res, proveedor, 'Proveedor creado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async updateProveedor(req, res, next) {
    try {
      const { idproveedor } = req.params;
      const proveedor = await inventoryService.updateProveedor(idproveedor, req.body);
      return response.success(res, proveedor, 'Proveedor actualizado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async deleteProveedor(req, res, next) {
    try {
      const { idproveedor } = req.params;
      await inventoryService.deleteProveedor(idproveedor);
      return response.success(res, null, 'Proveedor eliminado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  // Pedidos
  async findAllPedidos(req, res, next) {
    try {
      const pedidos = await inventoryService.findAllPedidos(req.query);
      return response.success(res, pedidos);
    } catch (error) {
      next(error);
    }
  }

  async createPedido(req, res, next) {
    try {
      const pedido = await inventoryService.createPedido(req.body);
      return response.created(res, pedido, 'Pedido creado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async updatePedido(req, res, next) {
    try {
      const { idpedidos } = req.params;
      const pedido = await inventoryService.updatePedido(idpedidos, req.body);
      return response.success(res, pedido, 'Pedido actualizado exitosamente');
    } catch (error) {
      next(error);
    }
  }

  async deletePedido(req, res, next) {
    try {
      const { idpedidos } = req.params;
      await inventoryService.deletePedido(idpedidos);
      return response.success(res, null, 'Pedido eliminado exitosamente');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new InventoryController();
