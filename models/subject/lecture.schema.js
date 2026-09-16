import { Schema } from "mongoose";
import { fileSchema } from "./file.schema.js";
import { quizSchema } from "./quiz.schema.js";

const lectureSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Lecture title is required"],
      trim: true,
    },
    order: {
      type: Number,
      required: [true, "Lecture order is required"],
      min: [0, "Lecture order must be at least 0"],
    },
    files: {
      type: [fileSchema],
      default: [],
    },
    quizzes: {
      type: [quizSchema],
      default: [],
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

export { lectureSchema };
