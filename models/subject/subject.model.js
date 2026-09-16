import { model } from "mongoose";
import { subjectSchema } from "./subject.schema.js";

const Subject = model("Subject", subjectSchema);

export { Subject };
