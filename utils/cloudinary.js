import { v2 as cloudinary } from "cloudinary";

const FOLDER = "beautifully_simple";

const client = () => {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud_name || !api_key || !api_secret) {
    throw new Error("Cloudinary is not configured");
  }
  cloudinary.config({ cloud_name, api_key, api_secret });
  return cloudinary;
};

// publicId keeps the same subjectName-lecnum-uniqueID.pdf name, inside beautifully_simple/.
const uploadPdf = (buffer, filename) =>
  new Promise((resolve, reject) => {
    const stream = client().uploader.upload_stream(
      {
        resource_type: "raw",
        public_id: `${FOLDER}/${filename}`,
        unique_filename: false,
        overwrite: false,
      },
      (error, result) => (error ? reject(error) : resolve(result.secure_url))
    );
    stream.end(buffer);
  });

const publicIdFromUrl = (url) => {
  const path = url.split("?")[0].split("/upload/")[1] || "";
  return path.replace(/^v\d+\//, "");
};

const isCloudinaryUrl = (value) => typeof value === "string" && value.includes("res.cloudinary.com");

const destroyPdf = async (url) => {
  const publicId = publicIdFromUrl(url);
  if (!publicId) return;
  await client().uploader.destroy(publicId, { resource_type: "raw" });
};

export { uploadPdf, destroyPdf, isCloudinaryUrl };
