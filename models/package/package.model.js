import { model } from "mongoose";
import { packageSchema } from "./package.schema.js";

const Package = model("Package", packageSchema);

export { Package };
