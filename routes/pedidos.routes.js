// server/routes/pedidos.routes.js
import { Router } from "express";
import {
  createPedido,
  getPedidos,
  getPedidoById,
  updatePedido,
  deletePedido,
} from "../controllers/pedidos.controller.js";

const router = Router();

router.get("/", getPedidos);
router.get("/:idpedidos", getPedidoById);
router.post("/", createPedido);
router.put("/:idpedidos", updatePedido);
router.delete("/:idpedidos", deletePedido);

export default router;
