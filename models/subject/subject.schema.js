import { Schema } from "mongoose";
import { lectureSchema } from "./lecture.schema.js";
import { quizSchema } from "./quiz.schema.js";

const subjectSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Subject name is required"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Subject price is required"],
      min: [0, "Subject price must be at least 0"],
    },
    durationDays: {
      type: Number,
      default: 30,
      min: [1, "Subject durationDays must be at least 1"],
    },
    lectures: {
      type: [lectureSchema],
      default: [],
    },
    finalQuiz: {
      type: quizSchema,
      default: null,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

subjectSchema.pre("validate", function ensureUniqueLectureOrder() {
  const orders = this.lectures.map((lecture) => lecture.order);
  if (new Set(orders).size !== orders.length) {
    this.invalidate("lectures", "Lecture numbers (order) must be unique within a subject");
  }
});

export { subjectSchema };
