import { removeFile } from "../utils/index.js";

const errorHandler = async (err, req, res, next) => {
  // A failed request must not leave uploaded files on disk.
  const uploaded = [req.file, ...(Array.isArray(req.files) ? req.files : [])].filter(Boolean);
  await Promise.all(uploaded.map((file) => removeFile(file.path).catch(() => {})));

  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((error) => error.message)
      .join(", ");
  }

  if (err.name === "MulterError") {
    statusCode = 400;
  }

  if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}`;
  }

  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `${field} already exists` : "Duplicate field value entered";
  }

  res.status(statusCode).json({
    success: false,
    status: statusCode.toString().startsWith("4") ? "fail" : "error",
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export default errorHandler;
