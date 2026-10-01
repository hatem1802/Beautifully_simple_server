import { Schema } from "mongoose";
import { enrollmentSchema } from "./enrollment.schema.js";

const subscriptionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Subscription userId is required"],
      index: true,
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      default: null,
    },
    lectureId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    packageId: {
      type: Schema.Types.ObjectId,
      ref: "Package",
      default: null,
    },
    // Absent for access an admin grants directly. Sparse so those documents don't collide.
    requestId: {
      type: Schema.Types.ObjectId,
      ref: "Request",
    },
    source: {
      type: String,
      enum: {
        values: ["request", "admin"],
        message: "Source must be request or admin",
      },
      default: "request",
    },
    startedAt: {
      type: Date,
      required: [true, "Subscription startedAt is required"],
    },
    endAt: {
      type: Date,
      required: [true, "Subscription endAt is required"],
    },
    status: {
      type: String,
      enum: {
        values: ["active", "expired", "cancelled"],
        message: "Status must be active, expired, or cancelled",
      },
      required: [true, "Subscription status is required"],
      default: "active",
    },
    enrollment: {
      type: enrollmentSchema,
      default: () => ({ subjects: [] }),
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

subscriptionSchema.pre("validate", function ensureExactlyOneTarget() {
  const hasSubject = Boolean(this.subjectId);
  const hasPackage = Boolean(this.packageId);

  if (hasSubject === hasPackage) {
    this.invalidate(
      "subjectId",
      "Subscription must have exactly one of subjectId or packageId"
    );
  }

  if (this.lectureId && !hasSubject) {
    this.invalidate("lectureId", "lectureId requires subjectId");
  }
});

subscriptionSchema.index({ requestId: 1 }, { unique: true, sparse: true });
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ userId: 1, status: 1, "enrollment.subjects.subjectId": 1 });

export { subscriptionSchema };
