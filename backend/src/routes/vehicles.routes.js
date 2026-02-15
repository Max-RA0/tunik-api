const express = require('express');
const { body } = require('express-validator');
const vehiclesController = require('../controllers/vehicles.controller');
const { verifyToken } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// ========== TIPOS DE VEHÍCULOS ==========
// GET /api/tipovehiculos
router.get('/tipovehiculos', vehiclesController.findAllTipos);

// POST /api/tipovehiculos
router.post('/tipovehiculos', [
  body('nombretipovehiculo').notEmpty().withMessage('Nombre del tipo es requerido'),
  validate
], vehiclesController.createTipo);

// PUT /api/tipovehiculos/:idtipovehiculos
router.put('/tipovehiculos/:idtipovehiculos', [
  body('nombretipovehiculo').optional().notEmpty().withMessage('Nombre no puede estar vacío'),
  validate
], vehiclesController.updateTipo);

// DELETE /api/tipovehiculos/:idtipovehiculos
router.delete('/tipovehiculos/:idtipovehiculos', vehiclesController.deleteTipo);

// ========== MARCAS ==========
// GET /api/marcas
router.get('/marcas', vehiclesController.findAllMarcas);

// POST /api/marcas
router.post('/marcas', [
  body('nombremarca').notEmpty().withMessage('Nombre de la marca es requerido'),
  validate
], vehiclesController.createMarca);

// PUT /api/marcas/:idmarca
router.put('/marcas/:idmarca', [
  body('nombremarca').optional().notEmpty().withMessage('Nombre no puede estar vacío'),
  validate
], vehiclesController.updateMarca);

// DELETE /api/marcas/:idmarca
router.delete('/marcas/:idmarca', vehiclesController.deleteMarca);

// ========== VEHÍCULOS ==========
// GET /api/vehiculos
router.get('/vehiculos', vehiclesController.findAllVehiculos);

// GET /api/vehiculos/:placa
router.get('/vehiculos/:placa', vehiclesController.findVehiculoByPlaca);

// POST /api/vehiculos
router.post('/vehiculos', [
  body('placa').notEmpty().withMessage('Placa es requerida'),
  body('modelo').notEmpty().withMessage('Modelo es requerido'),
  body('color').notEmpty().withMessage('Color es requerido'),
  body('idtipovehiculos').isInt().withMessage('Tipo de vehículo es requerido'),
  body('idmarca').isInt().withMessage('Marca es requerida'),
  body('numero_documento').notEmpty().withMessage('Número de documento del propietario es requerido'),
  validate
], vehiclesController.createVehiculo);

// PUT /api/vehiculos/:placa
router.put('/vehiculos/:placa', [
  body('modelo').optional().notEmpty().withMessage('Modelo no puede estar vacío'),
  body('color').optional().notEmpty().withMessage('Color no puede estar vacío'),
  validate
], vehiclesController.updateVehiculo);

// DELETE /api/vehiculos/:placa
router.delete('/vehiculos/:placa', vehiclesController.deleteVehiculo);

module.exports = router;
