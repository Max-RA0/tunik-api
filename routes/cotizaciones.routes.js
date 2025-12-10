// server/routes/cotizaciones.routes.js
import { Router } from "express";
import {
  createCotizacion,
  getCotizaciones,
  getCotizacionById,
  updateCotizacion,
  deleteCotizacion,

  createDetalleCotizacion,
  getDetallesCotizacion,
  getDetallesByCotizacion,
  getTotalByCotizacion,
  updateDetalleCotizacion,
  deleteDetalleCotizacion,
  testDetalleCotizacion,
} from "../controllers/cotizaciones.controller.js";

const cotizacionesRouter = Router();

cotizacionesRouter.get("/", getCotizaciones);
cotizacionesRouter.get("/:idcotizaciones", getCotizacionById);
cotizacionesRouter.post("/", createCotizacion);
cotizacionesRouter.put("/:idcotizaciones", updateCotizacion);
cotizacionesRouter.delete("/:idcotizaciones", deleteCotizacion);

export const detalleCotizacionesRouter = Router();

detalleCotizacionesRouter.get("/test", testDetalleCotizacion);
detalleCotizacionesRouter.get("/", getDetallesCotizacion);
detalleCotizacionesRouter.get("/cotizacion/:idcotizaciones", getDetallesByCotizacion);
detalleCotizacionesRouter.get("/cotizacion/:idcotizaciones/total", getTotalByCotizacion);
detalleCotizacionesRouter.post("/", createDetalleCotizacion);
detalleCotizacionesRouter.put("/cotizacion/:idcotizaciones/servicio/:idservicios", updateDetalleCotizacion);
detalleCotizacionesRouter.delete("/cotizacion/:idcotizaciones/servicio/:idservicios", deleteDetalleCotizacion);

export default cotizacionesRouter;
