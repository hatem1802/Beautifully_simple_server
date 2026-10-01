import { ApiError } from "../utils/index.js";

// form-data sends text only: turns the JSON in req.body[field] into req.body. JSON requests pass through.
const parseJsonField = (field) => (req, res, next) => {
  if (!req.is("multipart/form-data")) return next();

  const raw = req.body?.[field];
  if (typeof raw !== "string") {
    return next(new ApiError(400, `The "${field}" field is required and must contain JSON text`));
  }

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    req.body = parsed;
  } catch {
    return next(new ApiError(400, `The "${field}" field must be a valid JSON object`));
  }

  next();
};

export default parseJsonField;
