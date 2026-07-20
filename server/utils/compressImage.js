import fs from "fs";
import path from "path";
import sharp from "sharp";

const COMPRESSIBLE = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const MAX_WIDTH = 1200;

/**
 * Express middleware that compresses the image uploaded by multer (req.file)
 * in place on disk.
 *
 * - Resizes anything wider than MAX_WIDTH px (never enlarges).
 * - Re-encodes JPEG/PNG/WebP at sensible quality; SVG and PDF are untouched.
 * - Only replaces the file when the result is actually smaller.
 * - Never fails the request: on any error the original upload is kept as-is.
 */
export async function compressUploadedImage(req, res, next) {
    try {
        const file = req.file;
        if (!file || !file.path) return next();

        const ext = path.extname(file.path).toLowerCase();
        if (!COMPRESSIBLE.has(ext)) return next();

        const meta = await sharp(file.path).metadata();

        let pipeline = sharp(file.path).rotate();
        if (meta.width && meta.width > MAX_WIDTH) {
            pipeline = pipeline.resize({ width: MAX_WIDTH, withoutEnlargement: true });
        }

        if (ext === ".png") {
            pipeline = pipeline.png({ compressionLevel: 9, palette: true });
        } else if (ext === ".webp") {
            pipeline = pipeline.webp({ quality: 80 });
        } else {
            pipeline = pipeline.jpeg({ quality: 80, mozjpeg: true });
        }

        const buffer = await pipeline.toBuffer();

        // Keep the original when compression would not shrink the file.
        if (buffer.length < file.size) {
            await fs.promises.writeFile(file.path, buffer);
            file.size = buffer.length;
        }
        next();
    } catch (err) {
        console.warn("Image compression skipped:", err.message);
        next();
    }
}
