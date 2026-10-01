import { Router } from "express";
import {
  asyncHandler,
  authenticate,
  authorize,
  optionalAuthenticate,
  paginationValidation,
  parseJsonField,
  uploadLectureFiles,
  uploadNewLectureFiles,
  uploadSubjectFiles,
  validate,
} from "../../middlewares/index.js";
import {
  addLecture,
  addLectureFiles,
  createSubject,
  deleteLecture,
  deleteLectureFile,
  deleteSubject,
  downloadLectureFile,
  getFinalQuizContent,
  getLectureContent,
  getSubject,
  listSubjects,
  loadLecture,
  removeFinalQuiz,
  removeLectureQuiz,
  setFinalQuiz,
  setLectureQuiz,
  updateLecture,
  updateSubject,
} from "./subjects.controller.js";
import {
  createLectureValidation,
  createSubjectValidation,
  fileParamsValidation,
  finalQuizValidation,
  lectureFilesValidation,
  lectureParamsValidation,
  lectureQuizValidation,
  subjectFilesValidation,
  subjectIdValidation,
  updateLectureValidation,
  updateSubjectValidation,
} from "./subjects.validation.js";

const router = Router();

// Public catalog: admins get the full subject, everyone else gets it without answers or links.
// GET /api/subjects
router.get("/", optionalAuthenticate, paginationValidation, validate, asyncHandler(listSubjects));
// GET /api/subjects/:subjectId
router.get("/:subjectId", optionalAuthenticate, subjectIdValidation, validate, asyncHandler(getSubject));

// Subscribed content: admin, or a student with an active subscription covering it (403 otherwise).
// GET /api/subjects/:subjectId/lectures/:lectureId (files list + quiz questions, no correct answers for students)
router.get(
  "/:subjectId/lectures/:lectureId",
  authenticate,
  lectureParamsValidation,
  validate,
  asyncHandler(getLectureContent)
);
// GET /api/subjects/:subjectId/lectures/:lectureId/files/:fileId/download (the PDF itself)
router.get(
  "/:subjectId/lectures/:lectureId/files/:fileId/download",
  authenticate,
  fileParamsValidation,
  validate,
  asyncHandler(downloadLectureFile)
);
// GET /api/subjects/:subjectId/final-quiz (full subject subscription only)
router.get(
  "/:subjectId/final-quiz",
  authenticate,
  subjectIdValidation,
  validate,
  asyncHandler(getFinalQuizContent)
);

// Every route below is admin-only, checked before any file is written.
router.use(authenticate, authorize("admin"));

// POST /api/subjects (form-data: data = subject JSON, lecture_<order> = PDFs)
router.post(
  "/",
  uploadSubjectFiles,
  parseJsonField("data"),
  createSubjectValidation,
  subjectFilesValidation,
  validate,
  asyncHandler(createSubject)
);
// PATCH /api/subjects/:subjectId (name, description, price, durationDays)
router.patch("/:subjectId", updateSubjectValidation, validate, asyncHandler(updateSubject));
// DELETE /api/subjects/:subjectId (blocked if it has active subscriptions or is in a package)
router.delete("/:subjectId", subjectIdValidation, validate, asyncHandler(deleteSubject));

// PUT / DELETE /api/subjects/:subjectId/final-quiz
router.put("/:subjectId/final-quiz", finalQuizValidation, validate, asyncHandler(setFinalQuiz));
router.delete("/:subjectId/final-quiz", subjectIdValidation, validate, asyncHandler(removeFinalQuiz));

// POST /api/subjects/:subjectId/lectures (form-data: data = lecture JSON, files = PDFs)
router.post(
  "/:subjectId/lectures",
  uploadNewLectureFiles,
  parseJsonField("data"),
  createLectureValidation,
  validate,
  asyncHandler(addLecture)
);
// PATCH / DELETE /api/subjects/:subjectId/lectures/:lectureId (delete also removes its PDFs)
router.patch("/:subjectId/lectures/:lectureId", updateLectureValidation, validate, asyncHandler(updateLecture));
router.delete("/:subjectId/lectures/:lectureId", lectureParamsValidation, validate, asyncHandler(deleteLecture));

// PUT / DELETE /api/subjects/:subjectId/lectures/:lectureId/quiz
router.put("/:subjectId/lectures/:lectureId/quiz", lectureQuizValidation, validate, asyncHandler(setLectureQuiz));
router.delete(
  "/:subjectId/lectures/:lectureId/quiz",
  lectureParamsValidation,
  validate,
  asyncHandler(removeLectureQuiz)
);

// POST /api/subjects/:subjectId/lectures/:lectureId/files (form-data: files = PDFs)
router.post(
  "/:subjectId/lectures/:lectureId/files",
  lectureParamsValidation,
  validate,
  // Loads the lecture so the uploaded PDFs can be named and attached to it.
  asyncHandler(loadLecture),
  uploadLectureFiles,
  lectureFilesValidation,
  validate,
  asyncHandler(addLectureFiles)
);
// DELETE /api/subjects/:subjectId/lectures/:lectureId/files/:fileId (also removes the PDF from disk)
router.delete(
  "/:subjectId/lectures/:lectureId/files/:fileId",
  fileParamsValidation,
  validate,
  asyncHandler(deleteLectureFile)
);

export default router;
