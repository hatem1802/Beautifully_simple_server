import { Schema } from "mongoose";

const questionSchema = new Schema({
  question: {
    type: String,
    required: [true, "Question text is required"],
    trim: true,
  },
  options: {
    type: [{ type: String, trim: true }],
    validate: [
      {
        validator(value) {
          return Array.isArray(value) && value.length >= 2;
        },
        message: "Question must have at least 2 options",
      },
      {
        validator(value) {
          return new Set(value).size === value.length;
        },
        message: "Question options must be unique",
      },
    ],
  },
  correctAnswer: {
    type: String,
    required: [true, "Question correctAnswer is required"],
    trim: true,
    validate: {
      validator(value) {
        return Array.isArray(this.options) && this.options.includes(value);
      },
      message: "correctAnswer must be one of the options",
    },
  },
  duration: {
    type: Number,
    required: [true, "Question duration is required"],
    min: [1, "Question duration must be at least 1 second"],
  },
});

export { questionSchema };
