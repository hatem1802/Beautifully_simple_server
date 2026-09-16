import { Schema } from "mongoose";

const packageSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Package name is required"],
      trim: true,
    },
    subjectIds: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "Subject",
        },
      ],
      required: [true, "Package subjects are required"],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length >= 1;
        },
        message: "Package must include at least one subject",
      },
    },
    price: {
      type: Number,
      required: [true, "Package price is required"],
      min: [0, "Package price must be at least 0"],
    },
    durationDays: {
      type: Number,
      required: [true, "Package durationDays is required"],
      min: [1, "Package durationDays must be at least 1"],
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

export { packageSchema };
