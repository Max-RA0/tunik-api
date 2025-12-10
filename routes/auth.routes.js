// server/routes/auth.routes.js
import { Router } from "express";

import { 
  login,
  register,
  hashPasswordsOnce,
  requestPasswordReset,
  resetPassword
} from "../controllers/auth.controller.js";
const router = Router();
router.post("/login", login);
router.post("/register", register);
router.get("/hash-passwords", hashPasswordsOnce);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password/:token", resetPassword);

export default router;
