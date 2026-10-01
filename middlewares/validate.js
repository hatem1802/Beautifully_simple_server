import { validationResult } from "express-validator";
import { ApiError } from "../utils/index.js";

// Place after express-validator rules: stops the request with 400 before it reaches the controller.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = [...new Set(errors.array().map((error) => error.msg))].join(", ");
    return next(new ApiError(400, message));
  }

  next();
};

export default validate;
