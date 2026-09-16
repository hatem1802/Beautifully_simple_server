import { Schema } from "mongoose";
import { lectureSchema } from "./lecture.schema.js";

const subjectSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Subject price is required"],
      min: [0, "Subject price must be at least 0"],
    },
    lectures: {
      type: [lectureSchema],
      default: [],
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

export { subjectSchema };
