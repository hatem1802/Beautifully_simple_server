import { ApiError } from "../utils/index.js";

const notFound = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

export default notFound;
