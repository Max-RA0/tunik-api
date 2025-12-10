// server/routes/roles.routes.js
import { Router } from "express";
import {
  listRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
} from "../controllers/roles.controller.js";

const router = Router();

/**
 * ✅ Passthrough para que /catalog y /:idroles/acl NO caigan en el CRUD.
 * Esto permite que el router roles.acl.static.routes.js los atienda.
 */
router.get("/catalog", (req, res, next) => next());
router.get("/:idroles/acl", (req, res, next) => next());
router.put("/:idroles/acl", (req, res, next) => next());

router.get("/", listRoles);
router.post("/", createRole);

// al final las dinámicas
router.get("/:idroles", getRole);
router.put("/:idroles", updateRole);
router.delete("/:idroles", deleteRole);

export default router;
