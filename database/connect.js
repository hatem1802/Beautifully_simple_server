import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDatabase = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Database connected successfully");
};

export { connectDatabase };
