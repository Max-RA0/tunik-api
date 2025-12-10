// server/routes/dashboard.routes.js
import { Router } from "express";
import { getDashboardMetrics } from "../controllers/dashboard.controller.js";

const router = Router();

// GET /api/dashboard/metrics
router.get("/metrics", getDashboardMetrics);

export default router;
