import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import path from "path";
import multer from "multer";
import sharp from "sharp";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { destroyAsset, uploadBuffer } from "../config/cloudinary.js";
import notify from "../utils/notify.js";

const router = express.Router();
const allowedExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const allowedMimeTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
        const valid = allowedExtensions.has(path.extname(file.originalname).toLowerCase()) &&
            allowedMimeTypes.has(file.mimetype);
        callback(valid ? null : new Error("Only PNG, JPG and WebP images are allowed"), valid);
    },
});

const acceptProfilePhoto = (req, res, next) => {
    upload.single("profilePhoto")(req, res, (error) => {
        if (error) return res.status(400).json({ success: false, message: error.message });
        next();
    });
};

router.put("/profile", acceptProfilePhoto, async (req, res) => {
    try {
        const updates = {};
        for (const key of ["first_name", "last_name"]) {
            if (req.body[key] === undefined) continue;
            const value = String(req.body[key]).trim();
            if (value.length < 2 || value.length > 80) {
                return res.status(400).json({ success: false, message: "Names must contain 2–80 characters" });
            }
            updates[key] = value;
        }

        if (req.file) {
            const metadata = await sharp(req.file.buffer).metadata();
            if ((metadata.width || 0) < 256 || (metadata.height || 0) < 256) {
                return res.status(400).json({ success: false, message: "Profile photo must be at least 256×256 pixels" });
            }
            const processed = await sharp(req.file.buffer)
                .rotate()
                .resize(512, 512, { fit: "cover", position: "attention" })
                .webp({ quality: 84 })
                .toBuffer();
            const result = await uploadBuffer(processed, {
                folder: "khedmati/profiles",
                public_id: `profile-${req.user._id}-${crypto.randomUUID()}`,
                resource_type: "image",
                type: "upload",
                format: "webp",
                overwrite: false,
            });
            if (!result || !result.secure_url) {
                throw new Error("Cloudinary upload did not return a secure URL");
            }
            console.log("Cloudinary upload result:", result);
            updates.profilePhoto = result.secure_url;
            updates.profilePhotoPublicId = result.public_id;


            if (req.user.role === "provider") {
                updates.isVerified = false;
                updates.verificationStatus = req.user.idDocument ? "pending" : "not_submitted";
            }
        }

        const oldPublicId = req.user.profilePhotoPublicId;
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select("-password -resetPasswordToken");
        if (req.file && oldPublicId && oldPublicId !== updates.profilePhotoPublicId) {
            await destroyAsset(oldPublicId, { resource_type: "image", type: "upload" });
        }
        if (req.file && user.role === "provider") {
            const admins = await User.find({ role: "admin" }).select("_id");
            const titleAr = "صورة شخصية جديدة بانتظار المراجعة";
            const bodyAr = `رفع الفني ${user.first_name} ${user.last_name} صورة شخصية جديدة للمراجعة.`;
            await Promise.all(admins.map(async (admin) => {
                // De-duplicate: if this admin already has an UNREAD notification
                // about the same provider's photo review, don't create another
                // one (providers may save their profile several times in a row).
                const existing = await Notification.findOne({
                    recipient: admin._id,
                    type: "verification",
                    titleAr,
                    bodyAr,
                    read: false,
                });
                if (existing) return null;
                return notify({
                    recipient: admin._id,
                    type: "verification",
                    titleAr,
                    titleEn: "New profile photo awaiting review",
                    bodyAr,
                    bodyEn: `${user.first_name} ${user.last_name} uploaded a new profile photo for review.`,
                    link: "/admin/users",
                });
            }));
        }
        res.json({ success: true, user });
    } catch (error) {
        console.error("Cloudinary profile upload failed:", error.message);
        const notConfigured = /not configured/i.test(error.message || "");
        res.status(500).json({
            success: false,
            message: notConfigured
                ? "Cloudinary is not configured on the server — add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET to the host environment variables."
                : "Could not update account photo",
        });
    }
});

router.put("/password", async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (typeof currentPassword !== "string" || typeof newPassword !== "string" || newPassword.length < 10 || newPassword.length > 128) {
            return res.status(400).json({ success: false, message: "New password must contain 10–128 characters" });
        }
        const user = await User.findById(req.user._id);
        if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
            return res.status(400).json({ success: false, message: "Current password is incorrect" });
        }
        user.password = newPassword;
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        await user.save();
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
            path: "/",
        });
        res.json({ success: true, message: "Password changed" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Could not change password" });
    }
});

export default router;
