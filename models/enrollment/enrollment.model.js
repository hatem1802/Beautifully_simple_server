import { model } from "mongoose";
import { enrollmentSchema } from "./enrollment.schema.js";

const Enrollment = model("Enrollment", enrollmentSchema);

export { Enrollment };
