import { body, param, query } from "express-validator";
import { paginationValidation } from "../../middlewares/index.js";

const registerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .bail()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Email must be a valid email address")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .bail()
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .bail()
    .isEmail()
    .withMessage("Email must be a valid email address")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

const phoneRule = body("phone")
  .optional()
  .isString()
  .withMessage("Phone must be text")
  .bail()
  .trim()
  .isLength({ max: 20 })
  .withMessage("Phone must not exceed 20 characters")
  .matches(/^[0-9+\-\s()]*$/)
  .withMessage("Phone may only contain digits, spaces, +, - and parentheses");

const optionalName = body("name")
  .optional()
  .trim()
  .isLength({ min: 2, max: 50 })
  .withMessage("Name must be between 2 and 50 characters");

const updateMeValidation = [
  optionalName,
  phoneRule,
  body("password")
    .optional({ values: "falsy" })
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("currentPassword").custom((value, { req }) => {
    if (req.body?.password && !value) throw new Error("Current password is required to set a new one");
    return true;
  }),
  body().custom((_, { req }) => {
    const data = req.body ?? {};
    if (data.name === undefined && data.phone === undefined && !data.password) {
      throw new Error("Provide a name, phone or password to update");
    }
    return true;
  }),
];

const listUsersValidation = [
  ...paginationValidation,
  query("search").optional().isString().trim().isLength({ max: 100 }).withMessage("Search must not exceed 100 characters"),
  query("role").optional().isIn(["student", "admin"]).withMessage("Role must be student or admin"),
  query("status").optional().isIn(["active", "disabled"]).withMessage("Status must be active or disabled"),
];

const userIdValidation = [param("id").isMongoId().withMessage("User id must be a valid id")];

const updateUserValidation = [
  ...userIdValidation,
  optionalName,
  phoneRule,
  body("password").not().exists().withMessage("Password cannot be changed from this endpoint"),
  body().custom((_, { req }) => {
    const data = req.body ?? {};
    if (data.name === undefined && data.phone === undefined) {
      throw new Error("Provide a name or phone to update");
    }
    return true;
  }),
];

const setStatusValidation = [
  ...userIdValidation,
  body("status").isIn(["active", "disabled"]).withMessage("Status must be active or disabled"),
];

export {
  registerValidation,
  loginValidation,
  updateMeValidation,
  listUsersValidation,
  userIdValidation,
  updateUserValidation,
  setStatusValidation,
};
