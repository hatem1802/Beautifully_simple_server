import { Router } from "express";
import {
  asyncHandler,
  authenticate,
  authLimiter,
  authorize,
  validate,
} from "../../middlewares/index.js";
import {
  getMe,
  getUser,
  listUsers,
  login,
  register,
  setUserStatus,
  updateMe,
  updateUser,
} from "./users.controller.js";
import {
  listUsersValidation,
  loginValidation,
  registerValidation,
  setStatusValidation,
  updateMeValidation,
  updateUserValidation,
  userIdValidation,
} from "./users.validation.js";

const router = Router();

// Failed attempts are rate limited (10 per 15 minutes).
// POST /api/users/register (name, email, password). Always creates an active student.
router.post("/register", authLimiter, registerValidation, validate, asyncHandler(register));
// POST /api/users/login (email, password). Returns a JWT token.
router.post("/login", authLimiter, loginValidation, validate, asyncHandler(login));

// GET / PATCH /api/users/me (the signed-in user). Declared before /:id.
router.get("/me", authenticate, asyncHandler(getMe));
router.patch("/me", authenticate, updateMeValidation, validate, asyncHandler(updateMe));

// GET /api/users?search=&role=&status=&page=&limit= (admin)
router.get("/", authenticate, authorize("admin"), listUsersValidation, validate, asyncHandler(listUsers));
// GET /api/users/:id (admin)
router.get("/:id", authenticate, authorize("admin"), userIdValidation, validate, asyncHandler(getUser));
// PATCH /api/users/:id (admin: name, phone)
router.patch("/:id", authenticate, authorize("admin"), updateUserValidation, validate, asyncHandler(updateUser));
// POST /api/users/:id/status { status: active | disabled } (admin, not for their own account)
router.post("/:id/status", authenticate, authorize("admin"), setStatusValidation, validate, asyncHandler(setUserStatus));

export default router;
