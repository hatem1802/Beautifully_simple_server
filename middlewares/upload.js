import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { ApiError, uniqueId } from "../utils/index.js";

const PDF_TYPES = { "application/pdf": ".pdf" };
const LECTURE_FIELD = /^lecture_\d+$/;

// Builds a multer middleware: allowed types, size/count limits, and friendly 400 messages.
// PDFs stay in memory and are sent to Cloudinary after validation. Payment proofs stay on disk.
const createUploader = ({ dir, memory, types, maxSizeMB, label, filename, select, maxCount, fieldPattern }) => {
  if (!memory) fs.mkdirSync(dir, { recursive: true });

  const upload = multer({
    storage: memory
      ? multer.memoryStorage()
      : multer.diskStorage({
          destination: dir,
          filename: (req, file, cb) => cb(null, filename(req) + types[file.mimetype]),
        }),
    limits: {
      fileSize: maxSizeMB * 1024 * 1024,
      fieldSize: 5 * 1024 * 1024,
      ...(maxCount && { files: maxCount }),
    },
    fileFilter: (req, file, cb) => {
      if (fieldPattern && !fieldPattern.test(file.fieldname)) {
        return cb(
          new ApiError(400, `Unexpected file field "${file.fieldname}", use lecture_<number>`)
        );
      }
      if (!types[file.mimetype]) {
        return cb(new ApiError(400, `${label} must be of type: ${Object.values(types).join(", ")}`));
      }
      cb(null, true);
    },
  });

  const handler = select(upload);

  return (req, res, next) =>
    handler(req, res, (err) => {
      if (err?.code === "LIMIT_FILE_SIZE") {
        return next(new ApiError(400, `${label} must not exceed ${maxSizeMB}MB`));
      }
      if (err?.code === "LIMIT_FILE_COUNT") {
        return next(new ApiError(400, `You can upload up to ${maxCount} files at once`));
      }
      next(err);
    });
};

const uploadPaymentProof = createUploader({
  dir: path.join("uploads", "payment-proofs"),
  types: { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" },
  maxSizeMB: 5,
  label: "Payment proof",
  filename: () => uniqueId(),
  select: (upload) => upload.single("paymentProof"),
});

// PDFs are held in memory; the service uploads them to Cloudinary as subjectName-lecnum-uniqueID.pdf.
const uploadSubjectFiles = createUploader({
  memory: true,
  types: PDF_TYPES,
  maxSizeMB: 20,
  label: "Lecture file",
  maxCount: 50,
  fieldPattern: LECTURE_FIELD,
  select: (upload) => upload.any(),
});

const uploadNewLectureFiles = createUploader({
  memory: true,
  types: PDF_TYPES,
  maxSizeMB: 20,
  label: "Lecture file",
  maxCount: 10,
  select: (upload) => upload.array("files", 10),
});

const uploadLectureFiles = createUploader({
  memory: true,
  types: PDF_TYPES,
  maxSizeMB: 20,
  label: "Lecture file",
  maxCount: 10,
  select: (upload) => upload.array("files", 10),
});

export { uploadPaymentProof, uploadSubjectFiles, uploadNewLectureFiles, uploadLectureFiles };
