import express from "express";
import morgan from "morgan";
import { errorHandler, notFound } from "./middlewares/index.js";
import routes from "./routes/index.js";

const app = express()

app.use(express.json());
app.use(morgan("dev"));

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
