import { Schema } from "mongoose";

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
    packageId: {
      type: Schema.Types.ObjectId,
      ref: "Package",
      default: null,
    },
    requestId: {
      type: Schema.Types.ObjectId,
      ref: "Request",
      required: [true, "Subscription requestId is required"],
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
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

subscriptionSchema.pre("validate", function ensureExactlyOneTarget(next) {
  const hasSubject = Boolean(this.subjectId);
  const hasPackage = Boolean(this.packageId);

  if (hasSubject === hasPackage) {
    this.invalidate(
      "subjectId",
      "Subscription must have exactly one of subjectId or packageId"
    );
  }

  next();
});

subscriptionSchema.index({ userId: 1, status: 1 });

export { subscriptionSchema };
