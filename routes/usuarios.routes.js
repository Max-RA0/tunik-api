// server/routes/usuarios.routes.js
import { Router } from "express";
import { create, findAll, findOne, update, remove } from "../controllers/usuarios.controller.js";

const router = Router();

// Crear usuario
router.post("/", create);

// Listar todos los usuarios
router.get("/", findAll);

// Buscar usuario por cédula
router.get("/:numero_documento", findOne);

// Actualizar usuario por cédula
router.put("/:numero_documento", update);

// Eliminar usuario por cédula
router.delete("/:numero_documento", remove);

export default router;
