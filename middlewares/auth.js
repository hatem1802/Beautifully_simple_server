import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import { ApiError } from "../utils/index.js";
import asyncHandler from "./asyncHandler.js";

// Verifies "Authorization: Bearer <token>" and sets req.user = { id, role }.
const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new ApiError(401, "Authentication token is required");
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(401, "Invalid or expired token");
  }

  const user = await User.findById(payload.id);
  if (!user) {
    throw new ApiError(401, "User no longer exists");
  }
  if (user.status === "disabled") {
    throw new ApiError(403, "Account is disabled");
  }

  req.user = { id: user._id.toString(), role: user.role };
  next();
});

// Public routes: sets req.user only when a token is sent (an invalid token still returns 401).
const optionalAuthenticate = (req, res, next) => {
  if (!req.headers.authorization) return next();
  return authenticate(req, res, next);
};

// Use after authenticate. Returns 403 when the user's role is not in the list.
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return next(new ApiError(403, "You are not allowed to perform this action"));
  }
  next();
};

export { authenticate, authorize, optionalAuthenticate };
