import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : null;
    if (!token) return res.status(401).json({ ok: false, msg: "Sin token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // esperado: decoded = { idusuarios, idroles, rol, ... }
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ ok: false, msg: "Token inválido" });
  }
};

export const authorizeRoles = (...allowed) => {
  const allowedSet = new Set(allowed.map(String));
  return (req, res, next) => {
    const rol = String(req.user?.rol || "");
    const idroles = String(req.user?.idroles || "");
    // permite por nombre de rol o por idroles
    if (allowedSet.has(rol) || allowedSet.has(idroles)) return next();
    return res.status(403).json({ ok: false, msg: "No autorizado" });
  };
};
