import { Router } from "express";
import {
  create,
  createMine,
  findAll,
  findMine,
  findOne,
  update,
  remove,
} from "../controllers/vehiculo.controller.js";

const router = Router();

router.get("/mios", findMine);
router.post("/mios", createMine);

router.post("/", create);
router.get("/", findAll);
router.get("/:id", findOne);
router.put("/:id", update);
router.delete("/:id", remove);

export default router;
