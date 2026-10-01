import { Schema } from "mongoose";
import { questionSchema } from "./question.schema.js";

const quizSchema = new Schema(
  {
    questions: {
      type: [questionSchema],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length >= 1;
        },
        message: "Quiz must have at least one question",
      },
    },
  },
  { _id: false }
);

export { quizSchema };
