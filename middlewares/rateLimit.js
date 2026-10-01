import rateLimit from "express-rate-limit";
import { ApiResponse } from "../utils/index.js";

// Counts failed attempts only, so a normal login does not eat the budget.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res
      .status(429)
      .json(new ApiResponse(429, null, "Too many attempts, please try again in 15 minutes"));
  },
});

export { authLimiter };
