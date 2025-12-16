// server/routes/agendacitas.routes.js
import { Router } from "express";
import {
  createAgendacita,
  getAgendacitas,
  getAgendacitaById,
  updateAgendacita,
  deleteAgendacita,

  testDetalleAgenda,
  createDetalleAgenda,
  getDetallesAgenda,
  getDetallesByAgenda,
  getTotalByAgenda,
  updateDetalleAgenda,
  deleteDetalleAgenda,
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

// ==============================
// DETALLE: /api/detalleagendacitas
// ==============================
export const detalleAgendacitasRouter = Router();

detalleAgendacitasRouter.get("/test", testDetalleAgenda);
detalleAgendacitasRouter.get("/", getDetallesAgenda);
detalleAgendacitasRouter.get("/agenda/:idagendacitas", getDetallesByAgenda);
detalleAgendacitasRouter.get("/agenda/:idagendacitas/total", getTotalByAgenda);
detalleAgendacitasRouter.post("/", createDetalleAgenda);
detalleAgendacitasRouter.put("/agenda/:idagendacitas/servicio/:idservicios", updateDetalleAgenda);
detalleAgendacitasRouter.delete("/agenda/:idagendacitas/servicio/:idservicios", deleteDetalleAgenda);

export default router;
