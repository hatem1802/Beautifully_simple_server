import { body, param } from "express-validator";

const at = (prefix, field) => (prefix ? `${prefix}.${field}` : field);

const quizRules = (prefix, label) => [
  (prefix ? body(prefix).optional({ values: "null" }) : body()).custom((quiz) => {
    if (!quiz || typeof quiz !== "object" || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
      throw new Error(`${label} must have at least one question`);
    }
    if (quiz.questions.length > 100) {
      throw new Error(`${label} must not exceed 100 questions`);
    }
    return true;
  }),
  body(at(prefix, "questions.*.question"))
    .isString()
    .withMessage("Question text is required")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Question text is required"),
  body(at(prefix, "questions.*.options"))
    .isArray({ min: 2, max: 10 })
    .withMessage("Each question must have 2 to 10 options"),
  body(at(prefix, "questions.*.options.*"))
    .isString()
    .withMessage("Options must be text")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("Options must not be empty"),
  body(at(prefix, "questions.*.correctAnswer"))
    .isString()
    .withMessage("correctAnswer is required")
    .bail()
    .trim()
    .notEmpty()
    .withMessage("correctAnswer is required"),
  body(at(prefix, "questions.*.duration"))
    .isInt({ min: 1, max: 3600 })
    .withMessage("duration must be a number of seconds between 1 and 3600")
    .toInt(),
  body(at(prefix, "questions.*")).custom((question) => {
    if (!question || !Array.isArray(question.options)) return true;
    if (new Set(question.options).size !== question.options.length) {
      throw new Error("Question options must be unique");
    }
    if (!question.options.includes(question.correctAnswer)) {
      throw new Error("correctAnswer must be one of the options");
    }
    return true;
  }),
];

const lectureFieldRules = (prefix, { partial }) => {
  const field = (name) => {
    const chain = body(at(prefix, name));
    return partial ? chain.optional() : chain;
  };

  return [
    field("title")
      .isString()
      .withMessage("Lecture title is required")
      .bail()
      .trim()
      .notEmpty()
      .withMessage("Lecture title is required")
      .isLength({ max: 200 })
      .withMessage("Lecture title must not exceed 200 characters"),
    field("order")
      .isInt({ min: 1 })
      .withMessage("Lecture order must be a number starting from 1")
      .toInt(),
    body(at(prefix, "description"))
      .optional()
      .isString()
      .withMessage("Lecture description must be text")
      .bail()
      .trim()
      .isLength({ max: 2000 })
      .withMessage("Lecture description must not exceed 2000 characters"),
  ];
};

const subjectFieldRules = ({ partial }) => {
  const field = (name) => (partial ? body(name).optional() : body(name));

  return [
    field("name")
      .isString()
      .withMessage("Subject name is required")
      .bail()
      .trim()
      .notEmpty()
      .withMessage("Subject name is required")
      .isLength({ max: 120 })
      .withMessage("Subject name must not exceed 120 characters"),
    field("price")
      .isFloat({ min: 0 })
      .withMessage("Price must be a number greater than or equal to 0")
      .toFloat(),
    body("durationDays")
      .optional()
      .isInt({ min: 1 })
      .withMessage("durationDays must be a whole number starting from 1")
      .toInt(),
    body("description")
      .optional()
      .isString()
      .withMessage("Description must be text")
      .bail()
      .trim()
      .isLength({ max: 2000 })
      .withMessage("Description must not exceed 2000 characters"),
  ];
};

const subjectIdParam = param("subjectId").isMongoId().withMessage("subjectId must be a valid id");
const lectureIdParam = param("lectureId").isMongoId().withMessage("lectureId must be a valid id");
const fileIdParam = param("fileId").isMongoId().withMessage("fileId must be a valid id");

const subjectIdValidation = [subjectIdParam];
const lectureParamsValidation = [subjectIdParam, lectureIdParam];
const fileParamsValidation = [subjectIdParam, lectureIdParam, fileIdParam];

const createSubjectValidation = [
  ...subjectFieldRules({ partial: false }),
  body("lectures")
    .optional()
    .isArray({ max: 200 })
    .withMessage("lectures must be a list of up to 200 lectures")
    .bail()
    .custom((lectures) => {
      const orders = lectures.map((lecture) => Number(lecture?.order));
      if (new Set(orders).size !== orders.length) {
        throw new Error("Lecture numbers (order) must be unique within a subject");
      }
      return true;
    }),
  ...lectureFieldRules("lectures.*", { partial: false }),
  ...quizRules("lectures.*.quiz", "Lecture quiz"),
  ...quizRules("finalQuiz", "Final quiz"),
];

const updateSubjectValidation = [
  subjectIdParam,
  ...subjectFieldRules({ partial: true }),
  body().custom((data) => {
    const fields = ["name", "price", "durationDays", "description"];
    if (!fields.some((field) => data?.[field] !== undefined)) {
      throw new Error(`Provide at least one of: ${fields.join(", ")}`);
    }
    return true;
  }),
];

const createLectureValidation = [
  subjectIdParam,
  ...lectureFieldRules(null, { partial: false }),
  ...quizRules("quiz", "Lecture quiz"),
];

const updateLectureValidation = [
  ...lectureParamsValidation,
  ...lectureFieldRules(null, { partial: true }),
  body().custom((data) => {
    const fields = ["title", "order", "description"];
    if (!fields.some((field) => data?.[field] !== undefined)) {
      throw new Error(`Provide at least one of: ${fields.join(", ")}`);
    }
    return true;
  }),
];

const finalQuizValidation = [subjectIdParam, ...quizRules(null, "Final quiz")];
const lectureQuizValidation = [...lectureParamsValidation, ...quizRules(null, "Lecture quiz")];

const subjectFilesValidation = [
  body().custom((data, { req }) => {
    const orders = new Set(
      (Array.isArray(data?.lectures) ? data.lectures : []).map((lecture) => Number(lecture?.order))
    );
    for (const file of req.files ?? []) {
      if (!orders.has(Number(file.fieldname.split("_")[1]))) {
        throw new Error(`${file.fieldname} does not match any lecture number`);
      }
    }
    return true;
  }),
];

const lectureFilesValidation = [
  body("files").custom((_, { req }) => {
    if (!req.files?.length) throw new Error("Upload at least one PDF in the files field");
    return true;
  }),
];

export {
  subjectIdValidation,
  lectureParamsValidation,
  fileParamsValidation,
  createSubjectValidation,
  updateSubjectValidation,
  createLectureValidation,
  updateLectureValidation,
  finalQuizValidation,
  lectureQuizValidation,
  subjectFilesValidation,
  lectureFilesValidation,
};
