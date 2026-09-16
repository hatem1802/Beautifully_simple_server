import { Router } from "express";
import { asyncHandler } from "../../middlewares/index.js";
import { getHealth } from "./health.controller.js";

const router = Router();

router.get("/", asyncHandler(getHealth));

export default router;
