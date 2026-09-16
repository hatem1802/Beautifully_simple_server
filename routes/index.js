import { Router } from "express";
import healthRoutes from "../features/health/health.routes.js";
import usersRoutes from "../features/users/users.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/users", usersRoutes);

export default router;
