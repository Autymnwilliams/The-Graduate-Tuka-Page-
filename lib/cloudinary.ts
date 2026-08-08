import { Readable } from "stream";
import { v2 as cloudinary } from "cloudinary";

/**
 * Same init pattern as backend_main's config/cloudinary.js, so credentials
 * can be copy-pasted directly from that app's existing config -- this app
 * uses the same Cloudinary account, just a different upload folder
 * (hotel-pilot/... vs backend_main's circle-app/...) to keep uploads
 * organized separately within it.
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export function isCloudinaryConfigured(): boolean {
  return !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

/** Buffer -> stream -> Cloudinary, same shape as backend_main's uploadController.js. Rejects on any upload error rather than resolving with an undefined result. */
export function uploadImageBuffer(buffer: Buffer, folder: string): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ folder, resource_type: "auto" }, (error, result) => {
      if (error || !result) {
        reject(error ?? new Error("Cloudinary upload returned no result"));
        return;
      }
      resolve({ url: result.secure_url, publicId: result.public_id });
    });
    Readable.from(buffer).pipe(uploadStream);
  });
}

/**
 * Cloudinary's destroy() takes a public_id, not a URL, but rec.photoUrls only
 * stores plain secure_url strings -- derive the public_id back out of the
 * URL (folder path + filename, minus the version segment and extension)
 * rather than adding a second parallel array just to track ids.
 */
function publicIdFromUrl(url: string): string | null {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+(?:\?.*)?$/);
  return match ? match[1] : null;
}

export async function deleteImageByUrl(url: string): Promise<void> {
  const publicId = publicIdFromUrl(url);
  if (!publicId) {
    console.warn("[cloudinary] Could not derive public_id from URL, skipping delete:", url);
    return;
  }
  await cloudinary.uploader.destroy(publicId);
}
