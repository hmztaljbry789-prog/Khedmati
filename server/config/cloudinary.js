import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

export function isCloudinaryConfigured() {
    return Boolean(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );
}

export function uploadBuffer(buffer, options = {}) {
    if (!isCloudinaryConfigured()) {
        throw new Error("Cloudinary is not configured");
    }
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
            if (error) reject(error);
            else resolve(result);
        });
        Readable.from(buffer).pipe(stream);
    });
}

export async function destroyAsset(publicId, options = {}) {
    if (!publicId || !isCloudinaryConfigured()) return;
    try {
        await cloudinary.uploader.destroy(publicId, {
            resource_type: options.resource_type || "image",
            type: options.type || "upload",
            invalidate: true,
        });
    } catch (error) {
        console.error("Cloudinary cleanup failed:", error.message);
    }
}

export function signedAuthenticatedUrl(publicId, options = {}) {
    if (!isCloudinaryConfigured()) throw new Error("Cloudinary is not configured");
    return cloudinary.url(publicId, {
        secure: true,
        sign_url: true,
        type: "authenticated",
        resource_type: options.resourceType || "image",
        format: options.format || undefined,
        expires_at: Math.floor(Date.now() / 1000) + 5 * 60,
    });
}

export default cloudinary;
