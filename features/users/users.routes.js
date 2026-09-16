import { Router } from "express";
import { asyncHandler } from "../../middlewares/index.js";
import { register, login } from "./users.controller.js";

const router = Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));

export default router;
