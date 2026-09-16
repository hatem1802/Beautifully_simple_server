import { Schema } from "mongoose";

const fileSchema = new Schema({
  name: {
    type: String,
    required: [true, "File name is required"],
    trim: true,
  },
  url: {
    type: String,
    required: [true, "File URL is required"],
    trim: true,
  },
  order: {
    type: Number,
    required: [true, "File order is required"],
    min: [0, "File order must be at least 0"],
  },
  size: {
    type: Number,
    required: [true, "File size is required"],
    min: [0, "File size must be at least 0"],
  },
});

export { fileSchema };
