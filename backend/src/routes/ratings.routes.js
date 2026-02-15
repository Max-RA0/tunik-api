const express = require('express');
const { body } = require('express-validator');
const ratingsController = require('../controllers/ratings.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// GET /api/evaluaciones
router.get('/evaluaciones', ratingsController.findAll);

// GET /api/evaluaciones/summary
router.get('/evaluaciones/summary', ratingsController.getSummary);

// GET /api/evaluaciones/:idevaluacionservicios
router.get('/evaluaciones/:idevaluacionservicios', ratingsController.findById);

// POST /api/evaluaciones
router.post('/evaluaciones', [
  body('idventas').isInt().withMessage('ID de venta es requerido'),
  body('calificacion').isInt({ min: 1, max: 5 }).withMessage('Calificación debe ser entre 1 y 5'),
  validate
], ratingsController.create);

// PUT /api/evaluaciones/:idevaluacionservicios
router.put('/evaluaciones/:idevaluacionservicios', ratingsController.update);

// DELETE /api/evaluaciones/:idevaluacionservicios
router.delete('/evaluaciones/:idevaluacionservicios', ratingsController.delete);

module.exports = router;
