const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { validate } = require('../middleware/validation.middleware');

const router = express.Router();

// POST /api/auth/register
router.post('/register', [
  body('numero_documento').notEmpty().withMessage('Número de documento es requerido'),
  body('tipo_documento').notEmpty().withMessage('Tipo de documento es requerido'),
  body('nombre').notEmpty().withMessage('Nombre es requerido'),
  body('telefono').notEmpty().withMessage('Teléfono es requerido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('contrasena').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  validate
], authController.register);

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Email inválido'),
  body('contrasena').notEmpty().withMessage('Contraseña es requerida'),
  validate
], authController.login);

// POST /api/auth/refresh
router.post('/refresh', [
  body('refreshToken').notEmpty().withMessage('Refresh token es requerido'),
  validate
], authController.refresh);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// POST /api/auth/forgot-password
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Email inválido'),
  validate
], authController.forgotPassword);

// POST /api/auth/reset-password
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Token es requerido'),
  body('newPassword').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  validate
], authController.resetPassword);

module.exports = router;
