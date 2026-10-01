import { Schema } from "mongoose";

const packageSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Package name is required"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [2000, "Description must not exceed 2000 characters"],
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
          if (!Array.isArray(value) || value.length < 1) return false;
          return new Set(value.map(String)).size === value.length;
        },
        message: "Package must include at least one subject, without duplicates",
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
    status: {
      type: String,
      enum: {
        values: ["published", "draft"],
        message: "Status must be published or draft",
      },
      default: "published",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

export { packageSchema };
