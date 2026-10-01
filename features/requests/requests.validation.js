import { body, param, query } from "express-validator";
import { paginationValidation } from "../../middlewares/index.js";

const STATUSES = ["reviewing", "approved", "rejected", "returned", "cancelled"];
const DECISIONS = ["approved", "rejected", "returned"];
const TARGET_FIELDS = ["subjectId", "lectureId", "packageId"];

const mongoIdField = (field) =>
  body(field)
    .optional({ values: "falsy" })
    .isMongoId()
    .withMessage(`${field} must be a valid id`);

const notesRule = body("notes")
  .optional()
  .isString()
  .withMessage("Notes must be text")
  .bail()
  .trim()
  .isLength({ max: 500 })
  .withMessage("Notes must not exceed 500 characters");

const hasTarget = (data) => TARGET_FIELDS.some((field) => data[field]);

const targetRule = ({ required }) =>
  body().custom((_, { req }) => {
    const data = req.body ?? {};
    if (!required && !hasTarget(data)) return true;

    if (Boolean(data.subjectId) === Boolean(data.packageId)) {
      throw new Error("Request must have exactly one of subjectId or packageId");
    }
    if (data.lectureId && !data.subjectId) {
      throw new Error("lectureId requires subjectId");
    }
    return true;
  });

const idParamValidation = [
  param("id").isMongoId().withMessage("Request id must be a valid id"),
];

const userIdParamValidation = [
  param("userId").isMongoId().withMessage("userId must be a valid id"),
];

const listRequestsValidation = [
  ...paginationValidation,
  query("status")
    .optional()
    .isIn(STATUSES)
    .withMessage(`Status must be one of: ${STATUSES.join(", ")}`),
];

const createRequestValidation = [
  ...TARGET_FIELDS.map(mongoIdField),
  targetRule({ required: true }),
  body("paymentProof").custom((_, { req }) => {
    if (!req.file) throw new Error("Payment proof image is required");
    return true;
  }),
  notesRule,
];

const updateRequestValidation = [
  ...idParamValidation,
  ...TARGET_FIELDS.map(mongoIdField),
  targetRule({ required: false }),
  notesRule,
];

// adminNotes is required when rejecting or returning, so the student knows why.
const reviewRequestValidation = [
  ...idParamValidation,
  body("decision")
    .isIn(DECISIONS)
    .withMessage(`Decision must be one of: ${DECISIONS.join(", ")}`),
  body("adminNotes")
    .optional()
    .isString()
    .withMessage("adminNotes must be text")
    .bail()
    .trim()
    .isLength({ max: 500 })
    .withMessage("adminNotes must not exceed 500 characters"),
  body("adminNotes").custom((value, { req }) => {
    if (["rejected", "returned"].includes(req.body?.decision) && !value?.trim?.()) {
      throw new Error("adminNotes is required when rejecting or returning a request");
    }
    return true;
  }),
];

export {
  idParamValidation,
  userIdParamValidation,
  listRequestsValidation,
  createRequestValidation,
  updateRequestValidation,
  reviewRequestValidation,
};
