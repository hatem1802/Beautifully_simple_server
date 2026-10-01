import { body, param, query } from "express-validator";
import { paginationValidation } from "../../middlewares/index.js";

const STATUSES = ["active", "expired", "cancelled"];

const idParam = (field, label) => param(field).isMongoId().withMessage(`${label} must be a valid id`);

const idParamValidation = [idParam("id", "Subscription id")];

const listSubscriptionsValidation = [
  ...paginationValidation,
  query("userId").optional().isMongoId().withMessage("userId must be a valid id"),
  query("status")
    .optional()
    .isIn(STATUSES)
    .withMessage(`Status must be one of: ${STATUSES.join(", ")}`),
];

const subjectParamsValidation = [...idParamValidation, idParam("subjectId", "subjectId")];

const lectureParamsValidation = [...subjectParamsValidation, idParam("lectureId", "lectureId")];

// { answers: [{ questionId, selectedAnswer }] }, questions left out count as wrong.
const answersRules = [
  body("answers")
    .isArray({ max: 200 })
    .withMessage("Answers must be an array of at most 200 items"),
  body("answers.*.questionId").isMongoId().withMessage("Each answer questionId must be a valid id"),
  body("answers.*.selectedAnswer")
    .isString()
    .withMessage("Each selectedAnswer must be text")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Each selectedAnswer is required"),
];

const lectureQuizValidation = [...lectureParamsValidation, ...answersRules];

const finalQuizValidation = [...subjectParamsValidation, ...answersRules];

const grantAccessValidation = [
  body("userId").isMongoId().withMessage("userId must be a valid id"),
  body("subjectId").optional({ values: "falsy" }).isMongoId().withMessage("subjectId must be a valid id"),
  body("lectureId").optional({ values: "falsy" }).isMongoId().withMessage("lectureId must be a valid id"),
  body("packageId").optional({ values: "falsy" }).isMongoId().withMessage("packageId must be a valid id"),
  body("durationDays")
    .optional()
    .isInt({ min: 1, max: 3650 })
    .withMessage("durationDays must be a number of days between 1 and 3650")
    .toInt(),
  body().custom((_, { req }) => {
    const data = req.body ?? {};
    if (Boolean(data.subjectId) === Boolean(data.packageId)) {
      throw new Error("Grant must have exactly one of subjectId or packageId");
    }
    if (data.lectureId && !data.subjectId) throw new Error("lectureId requires subjectId");
    return true;
  }),
];

export {
  idParamValidation,
  listSubscriptionsValidation,
  grantAccessValidation,
  lectureParamsValidation,
  lectureQuizValidation,
  finalQuizValidation,
};
