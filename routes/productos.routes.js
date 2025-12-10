import { Router } from "express";
import {crearProducto, editarProducto, eliminarProducto, listarProducto, buscarProdcuto,} from "../controllers/productos.controller.js";

const router = Router();

router.post("/", crearProducto)
router.put("/:id", editarProducto)
router.delete("/:id", eliminarProducto)
router.get("/", listarProducto)
router.get("/:id", buscarProdcuto)

export default router;