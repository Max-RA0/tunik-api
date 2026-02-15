const express = require('express');
const { body } = require('express-validator');
const paymentsController = require('../controllers/payments.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// GET /api/metodospago
router.get('/metodospago', paymentsController.findAllMetodos);

// POST /api/metodospago
router.post('/metodospago', [
  body('nombrempago').notEmpty().withMessage('Nombre del método de pago es requerido'),
  validate
], paymentsController.createMetodo);

// PUT /api/metodospago/:idmpago
router.put('/metodospago/:idmpago', [
  body('nombrempago').optional().notEmpty().withMessage('Nombre no puede estar vacío'),
  validate
], paymentsController.updateMetodo);

// DELETE /api/metodospago/:idmpago
router.delete('/metodospago/:idmpago', paymentsController.deleteMetodo);

module.exports = router;
