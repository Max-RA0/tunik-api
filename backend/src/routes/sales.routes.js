const express = require('express');
const { body } = require('express-validator');
const salesController = require('../controllers/sales.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// ========== VENTAS ==========
// GET /api/ventas
router.get('/ventas', salesController.findAll);

// GET /api/ventas/:idventas
router.get('/ventas/:idventas', salesController.findById);

// POST /api/ventas
router.post('/ventas', [
  body('origen').notEmpty().withMessage('Origen es requerido'),
  body('idorigen').isInt().withMessage('ID de origen es requerido'),
  validate
], salesController.create);

// PUT /api/ventas/:idventas
router.put('/ventas/:idventas', salesController.update);

// DELETE /api/ventas/:idventas
router.delete('/ventas/:idventas', salesController.delete);

// ========== DETALLES DE VENTA ==========
// GET /api/detalleventas
router.get('/detalleventas', salesController.findAllDetalles);

// GET /api/detalleventas/venta/:idventas
router.get('/detalleventas/venta/:idventas', salesController.findDetallesByVenta);

// POST /api/detalleventas
router.post('/detalleventas', [
  body('idventas').isInt().withMessage('ID de venta es requerido'),
  body('idservicios').isInt().withMessage('ID de servicio es requerido'),
  body('precio_unitario').isDecimal().withMessage('Precio unitario es requerido'),
  validate
], salesController.createDetalle);

// DELETE /api/detalleventas/:iddetalleventas
router.delete('/detalleventas/:iddetalleventas', salesController.deleteDetalle);

// ========== PAGOS DE VENTA ==========
// GET /api/pagosventas
router.get('/pagosventas', salesController.findAllPagos);

// GET /api/pagosventas/venta/:idventas
router.get('/pagosventas/venta/:idventas', salesController.findPagosByVenta);

// POST /api/pagosventas
router.post('/pagosventas', [
  body('idventas').isInt().withMessage('ID de venta es requerido'),
  body('idmpago').isInt().withMessage('Método de pago es requerido'),
  body('valor').isDecimal().withMessage('Valor es requerido'),
  validate
], salesController.createPago);

// DELETE /api/pagosventas/:idpagoventas
router.delete('/pagosventas/:idpagoventas', salesController.deletePago);

module.exports = router;
