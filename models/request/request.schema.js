import { Schema } from "mongoose";

const requestSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Request userId is required"],
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
    status: {
      type: String,
      enum: {
        values: ["reviewing", "approved", "rejected", "returned"],
        message: "Status must be reviewing, approved, rejected, or returned",
      },
      required: [true, "Request status is required"],
      default: "reviewing",
    },
    paymentProof: {
      type: String,
      required: [true, "Payment proof is required"],
      trim: true,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

requestSchema.pre("validate", function ensureExactlyOneTarget(next) {
  const hasSubject = Boolean(this.subjectId);
  const hasPackage = Boolean(this.packageId);

  if (hasSubject === hasPackage) {
    this.invalidate(
      "subjectId",
      "Request must have exactly one of subjectId or packageId"
    );
  }

  next();
});

requestSchema.index({ userId: 1, status: 1 });

export { requestSchema };
