const express = require('express');
const { body } = require('express-validator');
const usersController = require('../controllers/users.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// GET /api/usuarios
router.get('/', usersController.findAll);

// GET /api/usuarios/:numero_documento
router.get('/:numero_documento', usersController.findOne);

// POST /api/usuarios
router.post('/', [
  body('numero_documento').notEmpty().withMessage('Número de documento es requerido'),
  body('tipo_documento').notEmpty().withMessage('Tipo de documento es requerido'),
  body('nombre').notEmpty().withMessage('Nombre es requerido'),
  body('telefono').notEmpty().withMessage('Teléfono es requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('contrasena').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('idroles').isInt().withMessage('Rol es requerido'),
  validate
], usersController.create);

// PUT /api/usuarios/:numero_documento
router.put('/:numero_documento', [
  body('nombre').optional().notEmpty().withMessage('Nombre no puede estar vacío'),
  body('telefono').optional().notEmpty().withMessage('Teléfono no puede estar vacío'),
  body('email').optional().isEmail().withMessage('Email inválido'),
  validate
], usersController.update);

// DELETE /api/usuarios/:numero_documento
router.delete('/:numero_documento', usersController.delete);

module.exports = router;
