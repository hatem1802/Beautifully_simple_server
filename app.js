import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler, notFound } from "./middlewares/index.js";
import routes from "./routes/index.js";
import { ApiError } from "./utils/index.js";

const app = express()

// Comma-separated list in CLIENT_ORIGIN, read per request so .env is loaded first.
const allowedOrigins = () =>
  (process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins().includes(origin)) return callback(null, true);
      return callback(new ApiError(403, "Origin not allowed"));
    },
  })
);
// cross-origin so the frontend can display payment-proof images served by this API.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json());
app.use(morgan("dev"));
app.use("/uploads/payment-proofs", express.static("uploads/payment-proofs"));

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
