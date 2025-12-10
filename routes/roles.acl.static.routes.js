// server/routes/roles.acl.static.routes.js
import { Router } from "express";
import { getAclStatic, putAclStatic, catalogAcl } from "../controllers/roles.acl.static.controller.js";

const router = Router();

// Catalog opcional
router.get("/catalog", catalogAcl);

// ACL por rol
router.get("/:id/acl", getAclStatic);
router.put("/:id/acl", putAclStatic);

export default router;
