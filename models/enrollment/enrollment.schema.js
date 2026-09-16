import { Schema } from "mongoose";

const enrollmentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Enrollment userId is required"],
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: [true, "Enrollment subjectId is required"],
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
      required: [true, "Enrollment subscriptionId is required"],
    },
    completedLectureIds: {
      type: [
        {
          type: Schema.Types.ObjectId,
        },
      ],
      default: [],
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

enrollmentSchema.index(
  { userId: 1, subjectId: 1, subscriptionId: 1 },
  { unique: true }
);
enrollmentSchema.index({ userId: 1, subjectId: 1 });

export { enrollmentSchema };
