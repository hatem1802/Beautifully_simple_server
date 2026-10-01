import { Router } from "express";
import {
  asyncHandler,
  authenticate,
  authorize,
  paginationValidation,
  uploadPaymentProof,
  validate,
} from "../../middlewares/index.js";
import {
  cancelRequest,
  createRequest,
  deleteRequest,
  getAllRequests,
  getRequestById,
  getRequestsByUser,
  reviewRequest,
  updateRequest,
} from "./requests.controller.js";
import {
  createRequestValidation,
  idParamValidation,
  listRequestsValidation,
  reviewRequestValidation,
  updateRequestValidation,
  userIdParamValidation,
} from "./requests.validation.js";

const router = Router();

// Every request route needs a valid token; userId always comes from the token, never the body.
router.use(authenticate);

// POST /api/requests (student, form-data: subjectId | subjectId + lectureId | packageId, paymentProof image, notes)
router.post(
  "/",
  authorize("student"),
  uploadPaymentProof,
  createRequestValidation,
  validate,
  asyncHandler(createRequest)
);
// GET /api/requests?status= (admin: all requests)
router.get("/", authorize("admin"), listRequestsValidation, validate, asyncHandler(getAllRequests));
// GET /api/requests/user/:userId (admin, or the student reading their own). Declared before /:id.
router.get(
  "/user/:userId",
  authorize("student", "admin"),
  userIdParamValidation,
  paginationValidation,
  validate,
  asyncHandler(getRequestsByUser)
);
// GET /api/requests/:id (admin or the owner)
router.get(
  "/:id",
  authorize("student", "admin"),
  idParamValidation,
  validate,
  asyncHandler(getRequestById)
);
// PATCH /api/requests/:id (student: own request, only when "returned"; goes back to "reviewing")
router.patch(
  "/:id",
  authorize("student"),
  uploadPaymentProof,
  updateRequestValidation,
  validate,
  asyncHandler(updateRequest)
);
// PATCH /api/requests/:id/review { decision: approved | rejected | returned, adminNotes } (admin)
// Only "reviewing" requests; approving creates the subscription with its enrollment.
router.patch(
  "/:id/review",
  authorize("admin"),
  reviewRequestValidation,
  validate,
  asyncHandler(reviewRequest)
);
// POST /api/requests/:id/cancel (student: own request, only while reviewing or returned)
router.post(
  "/:id/cancel",
  authorize("student"),
  idParamValidation,
  validate,
  asyncHandler(cancelRequest)
);
// DELETE /api/requests/:id (admin, not for approved requests; also removes the payment proof image)
router.delete("/:id", authorize("admin"), idParamValidation, validate, asyncHandler(deleteRequest));

export default router;
