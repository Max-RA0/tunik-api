// server/controllers/roles.acl.static.controller.js
import {
  getAclForRole,
  saveAclForRole,
  MODULES,
  ACTIONS,
} from "../models/rol_perm_priv.model.js";

// GET /api/roles/:id/acl
export async function getAclStatic(req, res) {
  try {
    const { id } = req.params;
    const acl = await getAclForRole(id);
    res.json({
      ok: true,
      idroles: acl.idroles,
      permisos: acl.permisos,      // { modulo: [sub...] }
      privilegios: acl.privilegios // { sub: [acciones] }
    });
  } catch (err) {
    console.error("getAclStatic error:", err);
    res.status(500).json({ ok: false, msg: "Error leyendo ACL" });
  }
}

// PUT /api/roles/:id/acl
export async function putAclStatic(req, res) {
  try {
    const { id } = req.params;
    const saved = await saveAclForRole(id, req.body || {});
    res.json({
      ok: true,
      idroles: saved.idroles,
      permisos: saved.permisos,
      privilegios: saved.privilegios,
    });
  } catch (err) {
    console.error("putAclStatic error:", err);
    res.status(500).json({ ok: false, msg: "Error guardando ACL" });
  }
}

// Opcional: catálogo (si quieres usarlo en front)
export function catalogAcl(req, res) {
  res.json({ ok: true, modules: MODULES, actions: ACTIONS });
}
