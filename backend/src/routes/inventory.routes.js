const express = require('express');
const { body } = require('express-validator');
const inventoryController = require('../controllers/inventory.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// ========== PRODUCTOS ==========
// GET /api/productos
router.get('/productos', inventoryController.findAllProductos);

// POST /api/productos
router.post('/productos', [
  body('nombreproducto').notEmpty().withMessage('Nombre del producto es requerido'),
  body('precio').isDecimal().withMessage('Precio es requerido'),
  validate
], inventoryController.createProducto);

// PUT /api/productos/:idproductos
router.put('/productos/:idproductos', inventoryController.updateProducto);

// DELETE /api/productos/:idproductos
router.delete('/productos/:idproductos', inventoryController.deleteProducto);

// ========== PROVEEDORES ==========
// GET /api/proveedores
router.get('/proveedores', inventoryController.findAllProveedores);

// POST /api/proveedores
router.post('/proveedores', [
  body('nombreproveedor').notEmpty().withMessage('Nombre del proveedor es requerido'),
  validate
], inventoryController.createProveedor);

// PUT /api/proveedores/:idproveedor
router.put('/proveedores/:idproveedor', inventoryController.updateProveedor);

// DELETE /api/proveedores/:idproveedor
router.delete('/proveedores/:idproveedor', inventoryController.deleteProveedor);

// ========== PEDIDOS ==========
// GET /api/pedidos
router.get('/pedidos', inventoryController.findAllPedidos);

// POST /api/pedidos
router.post('/pedidos', [
  body('idproveedor').isInt().withMessage('Proveedor es requerido'),
  body('idproductos').isInt().withMessage('Producto es requerido'),
  body('cantidad').isInt({ min: 1 }).withMessage('Cantidad debe ser mayor a 0'),
  body('fecha').notEmpty().withMessage('Fecha es requerida'),
  validate
], inventoryController.createPedido);

// PUT /api/pedidos/:idpedidos
router.put('/pedidos/:idpedidos', inventoryController.updatePedido);

// DELETE /api/pedidos/:idpedidos
router.delete('/pedidos/:idpedidos', inventoryController.deletePedido);

module.exports = router;
