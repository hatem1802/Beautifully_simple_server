import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { destroyPdf, isCloudinaryUrl } from "./cloudinary.js";
import { deleteCachedPdf } from "./pdfCache.js";

const toFilePath = (file) => file.path.split(path.sep).join("/");

const removeFile = async (filePath) => {
  if (!filePath) return;
  if (isCloudinaryUrl(filePath)) {
    await deleteCachedPdf(filePath);
    await destroyPdf(filePath);
    return;
  }
  await fs.promises.rm(filePath, { force: true });
};

const slugify = (text) =>
  String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "") || "subject";

const uniqueId = () => `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;

const lectureFileName = (subjectName, lectureOrder) =>
  `${slugify(subjectName)}-${lectureOrder}-${uniqueId()}`;

export { toFilePath, removeFile, slugify, uniqueId, lectureFileName };
