const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// GET /api/dashboard/stats
router.get('/stats', dashboardController.getStats);

module.exports = router;
