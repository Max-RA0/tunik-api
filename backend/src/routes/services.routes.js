const express = require('express');
const { body } = require('express-validator');
const servicesController = require('../controllers/services.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// ========== CATEGORÍAS DE SERVICIOS ==========
// GET /api/categoriaservicios
router.get('/categoriaservicios', servicesController.findAllCategorias);

// POST /api/categoriaservicios
router.post('/categoriaservicios', [
  body('nombrecategoriaservicio').notEmpty().withMessage('Nombre de la categoría es requerido'),
  validate
], servicesController.createCategoria);

// PUT /api/categoriaservicios/:idcategoriaservicios
router.put('/categoriaservicios/:idcategoriaservicios', [
  body('nombrecategoriaservicio').optional().notEmpty().withMessage('Nombre no puede estar vacío'),
  validate
], servicesController.updateCategoria);

// DELETE /api/categoriaservicios/:idcategoriaservicios
router.delete('/categoriaservicios/:idcategoriaservicios', servicesController.deleteCategoria);

// ========== SERVICIOS ==========
// GET /api/servicios
router.get('/servicios', servicesController.findAllServicios);

// GET /api/servicios/:idservicios
router.get('/servicios/:idservicios', servicesController.findServicioById);

// POST /api/servicios
router.post('/servicios', [
  body('nombreservicios').notEmpty().withMessage('Nombre del servicio es requerido'),
  body('descripcion').notEmpty().withMessage('Descripción es requerida'),
  body('idcategoriaservicios').isInt().withMessage('Categoría es requerida'),
  body('preciounitario').isDecimal().withMessage('Precio unitario es requerido'),
  validate
], servicesController.createServicio);

// PUT /api/servicios/:idservicios
router.put('/servicios/:idservicios', [
  body('nombreservicios').optional().notEmpty().withMessage('Nombre no puede estar vacío'),
  body('descripcion').optional().notEmpty().withMessage('Descripción no puede estar vacía'),
  validate
], servicesController.updateServicio);

// DELETE /api/servicios/:idservicios
router.delete('/servicios/:idservicios', servicesController.deleteServicio);

module.exports = router;
