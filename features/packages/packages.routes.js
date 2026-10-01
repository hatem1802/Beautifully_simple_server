import { Router } from "express";
import {
  asyncHandler,
  authenticate,
  authorize,
  optionalAuthenticate,
  validate,
} from "../../middlewares/index.js";
import {
  createPackage,
  deletePackage,
  getPackage,
  listPackages,
  updatePackage,
} from "./packages.controller.js";
import {
  createPackageValidation,
  idParamValidation,
  listPackagesValidation,
  updatePackageValidation,
} from "./packages.validation.js";

const router = Router();

// Public catalog shows published packages. An admin token also returns drafts (?status=draft|published).
// GET /api/packages?page=&limit=
router.get("/", optionalAuthenticate, listPackagesValidation, validate, asyncHandler(listPackages));
// GET /api/packages/:id
router.get("/:id", optionalAuthenticate, idParamValidation, validate, asyncHandler(getPackage));

// POST /api/packages (admin)
router.post("/", authenticate, authorize("admin"), createPackageValidation, validate, asyncHandler(createPackage));
// PATCH /api/packages/:id (admin)
router.patch("/:id", authenticate, authorize("admin"), updatePackageValidation, validate, asyncHandler(updatePackage));
// DELETE /api/packages/:id (admin, blocked while it has active subscriptions)
router.delete("/:id", authenticate, authorize("admin"), idParamValidation, validate, asyncHandler(deletePackage));

export default router;
