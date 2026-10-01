import { body, param, query } from "express-validator";
import { paginationValidation } from "../../middlewares/index.js";

const STATUSES = ["published", "draft"];

const idParamValidation = [
  param("id").isMongoId().withMessage("Package id must be a valid id"),
];

const subjectIdsRule = body("subjectIds")
  .isArray({ min: 1 })
  .withMessage("subjectIds must include at least one subject");

const subjectIdsItems = [
  body("subjectIds.*").isMongoId().withMessage("Each subjectId must be a valid id"),
  body("subjectIds").custom((ids) => {
    if (!Array.isArray(ids)) return true;
    if (new Set(ids).size !== ids.length) throw new Error("subjectIds must not contain duplicates");
    return true;
  }),
];

const listPackagesValidation = [
  ...paginationValidation,
  query("status")
    .optional()
    .isIn(STATUSES)
    .withMessage(`Status must be one of: ${STATUSES.join(", ")}`),
];

const packageFields = ({ partial }) => {
  const optionalFirst = (chain) => (partial ? chain.optional() : chain);
  const name = optionalFirst(body("name"))
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters");
  const description = body("description")
    .optional()
    .isString()
    .withMessage("Description must be text")
    .bail()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description must not exceed 2000 characters");
  const price = optionalFirst(body("price"))
    .isFloat({ min: 0 })
    .withMessage("Price must be a number greater than or equal to 0")
    .toFloat();
  const duration = optionalFirst(body("durationDays"))
    .isInt({ min: 1, max: 3650 })
    .withMessage("durationDays must be a number of days between 1 and 3650")
    .toInt();
  const status = body("status")
    .optional()
    .isIn(STATUSES)
    .withMessage(`Status must be one of: ${STATUSES.join(", ")}`);

  if (partial) {
    return [
      ...idParamValidation,
      name,
      description,
      price,
      duration,
      body("subjectIds").optional().isArray({ min: 1 }).withMessage("subjectIds must include at least one subject"),
      body("subjectIds.*").optional().isMongoId().withMessage("Each subjectId must be a valid id"),
      body("subjectIds")
        .optional()
        .custom((ids) => {
          if (!Array.isArray(ids)) return true;
          if (new Set(ids).size !== ids.length) throw new Error("subjectIds must not contain duplicates");
          return true;
        }),
      status,
      body().custom((_, { req }) => {
        const data = req.body ?? {};
        const fields = ["name", "description", "price", "durationDays", "subjectIds", "status"];
        if (!fields.some((field) => data[field] !== undefined)) {
          throw new Error("Provide at least one field to update");
        }
        return true;
      }),
    ];
  }

  return [name, description, price, duration, subjectIdsRule, ...subjectIdsItems, status];
};

const createPackageValidation = packageFields({ partial: false });
const updatePackageValidation = packageFields({ partial: true });

export { idParamValidation, listPackagesValidation, createPackageValidation, updatePackageValidation };
