import { Schema } from "mongoose";

const answerSchema = new Schema(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      required: [true, "Answer questionId is required"],
    },
    selectedAnswer: {
      type: String,
      default: null,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
  },
  { _id: false }
);

const quizAttemptSchema = new Schema(
  {
    answers: {
      type: [answerSchema],
      default: [],
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    submittedAt: {
      type: Date,
      required: true,
    },
  },
  { _id: false }
);

const lectureProgressSchema = new Schema(
  {
    lectureId: {
      type: Schema.Types.ObjectId,
      required: [true, "Lecture progress lectureId is required"],
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    quizAttempt: {
      type: quizAttemptSchema,
      default: null,
    },
  },
  { _id: false }
);

const subjectProgressSchema = new Schema(
  {
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Enrollment subjectId is required"],
    },
    // false when the subscription covers a single lecture only
    fullAccess: {
      type: Boolean,
      required: true,
    },
    lectures: {
      type: [lectureProgressSchema],
      default: [],
    },
    finalQuizAttempt: {
      type: quizAttemptSchema,
      default: null,
    },
  },
  { _id: false }
);

const enrollmentSchema = new Schema(
  {
    subjects: {
      type: [subjectProgressSchema],
      default: [],
    },
  },
  { _id: false }
);

export { enrollmentSchema };
