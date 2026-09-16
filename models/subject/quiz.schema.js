import { Schema } from "mongoose";
import { mcqSchema } from "./mcq.schema.js";

const quizSchema = new Schema({
  order: {
    type: Number,
    required: [true, "Quiz order is required"],
    min: [0, "Quiz order must be at least 0"],
  },
  question: {
    type: String,
    required: [true, "Quiz question is required"],
    trim: true,
  },
  mcqs: {
    type: [mcqSchema],
    validate: [
      {
        validator(value) {
          return Array.isArray(value) && value.length >= 2;
        },
        message: "Quiz must have at least 2 MCQ options",
      },
      {
        validator(value) {
          return Array.isArray(value) && value.some((mcq) => mcq.isCorrect === true);
        },
        message: "Quiz must have at least one correct MCQ option",
      },
    ],
  },
});

export { quizSchema };
