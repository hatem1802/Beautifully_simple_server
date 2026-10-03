import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import ApiError from "./ApiError.js";

// Original PDFs only. This folder is not mounted as static files.
const CACHE_DIR = path.resolve("storage/pdfs");

const inflight = new Map();

const cachePath = (url) =>
  path.join(CACHE_DIR, `${crypto.createHash("sha256").update(url).digest("hex")}.pdf`);

const saveOriginalPdf = async (url, buffer) => {
  await fs.promises.mkdir(CACHE_DIR, { recursive: true });
  const dest = cachePath(url);
  const temp = `${dest}.${crypto.randomBytes(4).toString("hex")}.tmp`;
  await fs.promises.writeFile(temp, buffer);
  await fs.promises.rename(temp, dest);
};

const deleteCachedPdf = async (url) => {
  if (!url) return;
  await fs.promises.rm(cachePath(url), { force: true });
};

const downloadOriginal = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new ApiError(404, "File is missing on the server");
  const buffer = Buffer.from(await response.arrayBuffer());
  await saveOriginalPdf(url, buffer);
  return buffer;
};

// Serves the saved original. The first miss downloads it from Cloudinary and keeps it.
const readOriginalPdf = (url) => {
  const pending = inflight.get(url);
  if (pending) return pending;

  const job = (async () => {
    const dest = cachePath(url);
    try {
      return await fs.promises.readFile(dest);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      return downloadOriginal(url);
    }
  })().finally(() => inflight.delete(url));

  inflight.set(url, job);
  return job;
};

export { saveOriginalPdf, readOriginalPdf, deleteCachedPdf };
