import { Router } from "express";
import healthRoutes from "../features/health/health.routes.js";
import usersRoutes from "../features/users/users.routes.js";
import requestsRoutes from "../features/requests/requests.routes.js";
import subjectsRoutes from "../features/subjects/subjects.routes.js";
import packagesRoutes from "../features/packages/packages.routes.js";
import subscriptionsRoutes from "../features/subscriptions/subscriptions.routes.js";

const router = Router();

// Mounted under /api in app.js
router.use("/health", healthRoutes);
router.use("/users", usersRoutes);
router.use("/requests", requestsRoutes);
router.use("/subjects", subjectsRoutes);
router.use("/packages", packagesRoutes);
router.use("/subscriptions", subscriptionsRoutes);

export default router;
