import { Schema } from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email must be a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
      maxlength: [20, "Phone must not exceed 20 characters"],
    },
    role: {
      type: String,
      enum: {
        values: ["student", "admin"],
        message: "Role must be either student or admin",
      },
      default: "student",
    },
    status: {
      type: String,
      enum: {
        values: ["active", "disabled"],
        message: "Status must be active or disabled",
      },
      default: "active",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toPublic = function toPublic() {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    role: this.role,
    status: this.status,
    created_at: this.created_at,
  };
};

export { userSchema };
