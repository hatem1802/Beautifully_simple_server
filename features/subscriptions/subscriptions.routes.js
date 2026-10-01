import { Router } from "express";
import { asyncHandler, authenticate, authorize, paginationValidation, validate } from "../../middlewares/index.js";
import {
  cancelSubscription,
  completeLecture,
  getAllSubscriptions,
  getMySubscriptions,
  getSubscription,
  grantAccess,
  submitFinalQuiz,
  submitLectureQuiz,
} from "./subscriptions.controller.js";
import {
  finalQuizValidation,
  grantAccessValidation,
  idParamValidation,
  lectureParamsValidation,
  lectureQuizValidation,
  listSubscriptionsValidation,
} from "./subscriptions.validation.js";

const router = Router();

// Subscriptions come from approving a request, or from an admin grant below.
router.use(authenticate);

// GET /api/subscriptions/me (student: own subscriptions with progress percent per subject). Declared before /:id.
router.get("/me", authorize("student"), paginationValidation, validate, asyncHandler(getMySubscriptions));
// GET /api/subscriptions?userId=&status= (admin)
router.get("/", authorize("admin"), listSubscriptionsValidation, validate, asyncHandler(getAllSubscriptions));
// POST /api/subscriptions (admin: grant access without a request)
router.post("/", authorize("admin"), grantAccessValidation, validate, asyncHandler(grantAccess));
// GET /api/subscriptions/:id (owner or admin: lectures, completion and quiz answers)
router.get("/:id", authorize("student", "admin"), idParamValidation, validate, asyncHandler(getSubscription));
// PATCH /api/subscriptions/:id/cancel (admin: revoke an active subscription)
router.patch("/:id/cancel", authorize("admin"), idParamValidation, validate, asyncHandler(cancelSubscription));

// Progress and quizzes: owner only, active subscription only.
// PATCH /api/subscriptions/:id/subjects/:subjectId/lectures/:lectureId/complete
router.patch(
  "/:id/subjects/:subjectId/lectures/:lectureId/complete",
  authorize("student"),
  lectureParamsValidation,
  validate,
  asyncHandler(completeLecture)
);
// POST /api/subscriptions/:id/subjects/:subjectId/lectures/:lectureId/quiz { answers } (one attempt)
router.post(
  "/:id/subjects/:subjectId/lectures/:lectureId/quiz",
  authorize("student"),
  lectureQuizValidation,
  validate,
  asyncHandler(submitLectureQuiz)
);
// POST /api/subscriptions/:id/subjects/:subjectId/final-quiz { answers } (full subject access, one attempt)
router.post(
  "/:id/subjects/:subjectId/final-quiz",
  authorize("student"),
  finalQuizValidation,
  validate,
  asyncHandler(submitFinalQuiz)
);

export default router;
