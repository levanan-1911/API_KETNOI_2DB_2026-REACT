import express from "express";
import * as ctrl from "./controller.js";

const router = express.Router();

router.get("/departments", ctrl.getDepartments);
router.get("/positions", ctrl.getPositions);

router.put("/departments/:id", ctrl.updateDepartment);
router.put("/positions/:id", ctrl.updatePosition);

export default router;