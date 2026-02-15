const express = require('express');
const { body } = require('express-validator');
const rolesController = require('../controllers/roles.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// GET /api/roles
router.get('/', rolesController.findAll);

// GET /api/roles/:idroles
router.get('/:idroles', rolesController.findOne);

// POST /api/roles
router.post('/', [
  body('nombrerol').notEmpty().withMessage('Nombre del rol es requerido'),
  validate
], rolesController.create);

// PUT /api/roles/:idroles
router.put('/:idroles', [
  body('nombrerol').optional().notEmpty().withMessage('Nombre del rol no puede estar vacío'),
  validate
], rolesController.update);

// DELETE /api/roles/:idroles
router.delete('/:idroles', rolesController.delete);

module.exports = router;
