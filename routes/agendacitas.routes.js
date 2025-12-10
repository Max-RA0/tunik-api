// server/routes/agendacitas.routes.js
import { Router } from "express";
import {
  createAgendacita,
  getAgendacitas,
  getAgendacitaById,
  updateAgendacita,
  deleteAgendacita,
} from "../controllers/agendacitas.controller.js";

const router = Router();

/**
 * Base: /api/agendacitas
 */
router.get("/", getAgendacitas);
router.get("/:idagendacitas", getAgendacitaById);
router.post("/", createAgendacita);
router.put("/:idagendacitas", updateAgendacita);
router.delete("/:idagendacitas", deleteAgendacita);

// 👇 MUY IMPORTANTE: export default
export default router;
