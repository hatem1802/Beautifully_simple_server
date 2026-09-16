import { Schema } from "mongoose";

const mcqSchema = new Schema(
  {
    num: {
      type: Number,
      required: [true, "MCQ number is required"],
      min: [1, "MCQ number must be at least 1"],
    },
    name: {
      type: String,
      required: [true, "MCQ option name is required"],
      trim: true,
    },
    isCorrect: {
      type: Boolean,
      required: [true, "MCQ isCorrect is required"],
    },
  },
  { _id: false }
);

export { mcqSchema };
