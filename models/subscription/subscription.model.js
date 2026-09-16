import { model } from "mongoose";
import { subscriptionSchema } from "./subscription.schema.js";

const Subscription = model("Subscription", subscriptionSchema);

export { Subscription };
