import { query } from "express-validator";

const paginationValidation = [
  query("page")
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage("page must be a number between 1 and 10000")
    .toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be a number between 1 and 100")
    .toInt(),
];

export { paginationValidation };
