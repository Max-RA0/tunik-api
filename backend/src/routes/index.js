const express = require('express');

const authRoutes = require('./auth.routes');
const usersRoutes = require('./users.routes');
const rolesRoutes = require('./roles.routes');
const vehiclesRoutes = require('./vehicles.routes');
const servicesRoutes = require('./services.routes');
const appointmentsRoutes = require('./appointments.routes');
const quotesRoutes = require('./quotes.routes');
const salesRoutes = require('./sales.routes');
const paymentsRoutes = require('./payments.routes');
const inventoryRoutes = require('./inventory.routes');
const ratingsRoutes = require('./ratings.routes');
const dashboardRoutes = require('./dashboard.routes');

const router = express.Router();

// Auth routes (no prefix needed, already at /api/auth)
router.use('/auth', authRoutes);

// Users and Roles
router.use('/usuarios', usersRoutes);
router.use('/roles', rolesRoutes);

// Vehicles (tipos, marcas, vehiculos)
router.use('/', vehiclesRoutes);

// Services (categorias, servicios)
router.use('/', servicesRoutes);

// Appointments (agendacitas, detalleagendacitas)
router.use('/', appointmentsRoutes);

// Quotes (cotizaciones, detallecotizaciones)
router.use('/', quotesRoutes);

// Sales (ventas, detalleventas, pagosventas)
router.use('/', salesRoutes);

// Payment methods
router.use('/', paymentsRoutes);

// Inventory (productos, proveedores, pedidos)
router.use('/', inventoryRoutes);

// Ratings (evaluaciones)
router.use('/', ratingsRoutes);

// Dashboard
router.use('/dashboard', dashboardRoutes);

module.exports = router;
