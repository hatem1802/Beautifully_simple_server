import { model } from "mongoose";
import { requestSchema } from "./request.schema.js";

const Request = model("Request", requestSchema);

export { Request };
