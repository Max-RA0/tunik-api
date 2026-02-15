const express = require('express');
const { body } = require('express-validator');
const quotesController = require('../controllers/quotes.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// ========== COTIZACIONES ==========
// GET /api/cotizaciones
router.get('/cotizaciones', quotesController.findAll);

// GET /api/cotizaciones/:idcotizaciones
router.get('/cotizaciones/:idcotizaciones', quotesController.findById);

// POST /api/cotizaciones
router.post('/cotizaciones', [
  body('placa').notEmpty().withMessage('Placa es requerida'),
  body('idmpago').isInt().withMessage('Método de pago es requerido'),
  body('fecha').notEmpty().withMessage('Fecha es requerida'),
  validate
], quotesController.create);

// PUT /api/cotizaciones/:idcotizaciones
router.put('/cotizaciones/:idcotizaciones', quotesController.update);

// DELETE /api/cotizaciones/:idcotizaciones
router.delete('/cotizaciones/:idcotizaciones', quotesController.delete);

// ========== DETALLES DE COTIZACIÓN ==========
// GET /api/detallecotizaciones
router.get('/detallecotizaciones', quotesController.findAllDetalles);

// GET /api/detallecotizaciones/cotizacion/:idcotizaciones
router.get('/detallecotizaciones/cotizacion/:idcotizaciones', quotesController.findDetallesByCotizacion);

// POST /api/detallecotizaciones
router.post('/detallecotizaciones', [
  body('idcotizaciones').isInt().withMessage('ID de cotización es requerido'),
  body('idservicios').isInt().withMessage('ID de servicio es requerido'),
  body('preciochange').isDecimal().withMessage('Precio es requerido'),
  validate
], quotesController.createDetalle);

// PUT /api/detallecotizaciones/:idcotizaciones/:idservicios
router.put('/detallecotizaciones/:idcotizaciones/:idservicios', quotesController.updateDetalle);

// DELETE /api/detallecotizaciones/:idcotizaciones/:idservicios
router.delete('/detallecotizaciones/:idcotizaciones/:idservicios', quotesController.deleteDetalle);

module.exports = router;
