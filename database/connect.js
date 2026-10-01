import mongoose from "mongoose";
import dotenv from "dotenv";
import { Subscription } from "../models/index.js";

dotenv.config();

const connectDatabase = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  // Replaces the old non-sparse unique index on requestId, so admin grants (no request) can coexist.
  await Subscription.syncIndexes();
  console.log("Database connected successfully");
};

export { connectDatabase };
