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
    lectureId: {
      type: Schema.Types.ObjectId,
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
        values: ["reviewing", "approved", "rejected", "returned", "cancelled"],
        message: "Status must be reviewing, approved, rejected, returned, or cancelled",
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
    adminNotes: {
      type: String,
      default: "",
      trim: true,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

requestSchema.pre("validate", function ensureExactlyOneTarget() {
  const hasSubject = Boolean(this.subjectId);
  const hasPackage = Boolean(this.packageId);

  if (hasSubject === hasPackage) {
    this.invalidate(
      "subjectId",
      "Request must have exactly one of subjectId or packageId"
    );
  }

  if (this.lectureId && !hasSubject) {
    this.invalidate("lectureId", "lectureId requires subjectId");
  }
});

requestSchema.index({ userId: 1, status: 1 });

export { requestSchema };
