const express = require('express');
const { body } = require('express-validator');
const appointmentsController = require('../controllers/appointments.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// ========== AGENDA DE CITAS ==========
// GET /api/agendacitas
router.get('/agendacitas', appointmentsController.findAll);

// GET /api/agendacitas/:idagendacitas
router.get('/agendacitas/:idagendacitas', appointmentsController.findById);

// POST /api/agendacitas
router.post('/agendacitas', [
  body('placa').notEmpty().withMessage('Placa es requerida'),
  body('fecha').notEmpty().withMessage('Fecha es requerida'),
  validate
], appointmentsController.create);

// PUT /api/agendacitas/:idagendacitas
router.put('/agendacitas/:idagendacitas', appointmentsController.update);

// DELETE /api/agendacitas/:idagendacitas
router.delete('/agendacitas/:idagendacitas', appointmentsController.delete);

// ========== DETALLES DE AGENDA ==========
// GET /api/detalleagendacitas
router.get('/detalleagendacitas', appointmentsController.findAllDetalles);

// GET /api/detalleagendacitas/test
router.get('/detalleagendacitas/test', appointmentsController.testDetalles);

// GET /api/detalleagendacitas/agenda/:idagendacitas
router.get('/detalleagendacitas/agenda/:idagendacitas', appointmentsController.findDetallesByAgenda);

// GET /api/detalleagendacitas/agenda/:idagendacitas/total
router.get('/detalleagendacitas/agenda/:idagendacitas/total', appointmentsController.getTotalByAgenda);

// POST /api/detalleagendacitas
router.post('/detalleagendacitas', [
  body('idagendacitas').isInt().withMessage('ID de agenda es requerido'),
  body('idservicios').isInt().withMessage('ID de servicio es requerido'),
  body('precio_unitario').isDecimal().withMessage('Precio unitario es requerido'),
  validate
], appointmentsController.createDetalle);

// PUT /api/detalleagendacitas/agenda/:idagendacitas/servicio/:idservicios
router.put('/detalleagendacitas/agenda/:idagendacitas/servicio/:idservicios', appointmentsController.updateDetalle);

// DELETE /api/detalleagendacitas/agenda/:idagendacitas/servicio/:idservicios
router.delete('/detalleagendacitas/agenda/:idagendacitas/servicio/:idservicios', appointmentsController.deleteDetalle);

module.exports = router;
