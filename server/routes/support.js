import express from "express";
import multer from "multer";
import sharp from "sharp";
import crypto from "crypto";
import path from "path";
import SupportTicket from "../models/SupportTicket.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import notify from "../utils/notify.js";
import { uploadBuffer, isCloudinaryConfigured } from "../config/cloudinary.js";

const router = express.Router();

const allowedExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"]);
const allowedMimeTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const valid = allowedExtensions.has(ext) && allowedMimeTypes.has(file.mimetype);
        callback(valid ? null : new Error("Only PNG, JPG and WebP images are allowed"), valid);
    },
});

const acceptSupportImage = (req, res, next) => {
    upload.single("image")(req, res, (error) => {
        if (error) return res.status(400).json({ success: false, message: error.message });
        next();
    });
};

async function processAndUploadImage(file, userId) {
    if (!file) return "";
    try {
        if (isCloudinaryConfigured()) {
            const processed = await sharp(file.buffer)
                .rotate()
                .resize(1400, 1400, { fit: "inside", withoutEnlargement: true })
                .webp({ quality: 82 })
                .toBuffer();
            const result = await uploadBuffer(processed, {
                folder: "khedmati/support",
                public_id: `support-${userId}-${crypto.randomUUID()}`,
                resource_type: "image",
                type: "upload",
                format: "webp",
                overwrite: false,
            });
            return result.secure_url;
        }
    } catch (err) {
        console.error("Cloudinary upload failed for support image, falling back:", err);
    }

    try {
        const processed = await sharp(file.buffer)
            .rotate()
            .resize(1000, 1000, { fit: "inside", withoutEnlargement: true })
            .webp({ quality: 75 })
            .toBuffer();
        return `data:image/webp;base64,${processed.toString("base64")}`;
    } catch (e) {
        return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
    }
}

const VALID_CATEGORIES = [
    "general",
    "booking",
    "payment",
    "complaint",
    "technical",
];

// Map the logged-in user's account role to a message senderRole.
const senderRoleFor = (user) => (user.role === "provider" ? "provider" : "user");

// Tell every admin about support activity. For follow-up messages we skip
// admins who already have an unread notification for the same ticket so a
// burst of messages does not flood the bell.
const notifyAdmins = async ({ titleAr, titleEn, bodyAr, bodyEn, dedupe }) => {
    const admins = await User.find({ role: "admin" }).select("_id");
    await Promise.all(admins.map(async (admin) => {
        if (dedupe) {
            const existing = await Notification.findOne({
                recipient: admin._id,
                type: "support",
                titleAr,
                bodyAr,
                read: false,
            });
            if (existing) return null;
        }
        return notify({
            recipient: admin._id,
            type: "support",
            titleAr,
            titleEn,
            bodyAr,
            bodyEn,
            link: "/admin/support",
        });
    }));
};

// Create a new support ticket. An optional first message or image can be included.
router.post("/", acceptSupportImage, async (req, res) => {
    try {
        const { subject, category, message, bookingId } = req.body;
        if (!subject || !subject.trim()) {
            return res
                .status(400)
                .json({ success: false, message: "Subject is required" });
        }

        const safeCategory = VALID_CATEGORIES.includes(category)
            ? category
            : "general";

        const imageUrl = await processAndUploadImage(req.file, req.user._id);

        const messages = [];
        const msgText = (message || "").trim();
        if (msgText || imageUrl) {
            messages.push({
                sender: req.user._id,
                senderRole: senderRoleFor(req.user),
                text: msgText,
                image: imageUrl,
            });
        }

        const ticket = await SupportTicket.create({
            user: req.user._id,
            subject: subject.trim(),
            category: safeCategory,
            bookingId: bookingId || undefined,
            messages,
            lastMessageAt: new Date(),
        });

        await notifyAdmins({
            titleAr: "تذكرة دعم جديدة",
            titleEn: "New support ticket",
            bodyAr: `فتح ${req.user.first_name} ${req.user.last_name} تذكرة جديدة: «${ticket.subject}»`,
            bodyEn: `${req.user.first_name} ${req.user.last_name} opened a new ticket: "${ticket.subject}"`,
        });

        res.status(201).json({ success: true, ticket });
    } catch (err) {
        console.error("Error creating support ticket:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// List the current user's tickets (most recent activity first).
router.get("/mine", async (req, res) => {
    try {
        const tickets = await SupportTicket.find({ user: req.user._id })
            .sort({ lastMessageAt: -1 })
            .lean();
        res.json({ success: true, tickets });
    } catch (err) {
        console.error("Error listing support tickets:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// Get a single ticket. The requester must own it.
router.get("/:id", async (req, res) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id).populate(
            "messages.sender",
            "first_name last_name role profilePhoto"
        );
        if (!ticket) {
            return res
                .status(404)
                .json({ success: false, message: "Ticket not found" });
        }
        if (String(ticket.user) !== String(req.user._id)) {
            return res.status(403).json({ success: false, message: "Not allowed" });
        }
        res.json({ success: true, ticket });
    } catch (err) {
        console.error("Error fetching support ticket:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// Add a message to an own ticket. Posting re-opens a closed ticket.
router.post("/:id/messages", acceptSupportImage, async (req, res) => {
    try {
        const { text } = req.body;
        const msgText = (text || "").trim();
        const imageUrl = await processAndUploadImage(req.file, req.user._id);

        if (!msgText && !imageUrl) {
            return res
                .status(400)
                .json({ success: false, message: "Message text or an image is required" });
        }
        const ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) {
            return res
                .status(404)
                .json({ success: false, message: "Ticket not found" });
        }
        if (String(ticket.user) !== String(req.user._id)) {
            return res.status(403).json({ success: false, message: "Not allowed" });
        }

        ticket.messages.push({
            sender: req.user._id,
            senderRole: senderRoleFor(req.user),
            text: msgText,
            image: imageUrl,
        });
        ticket.lastMessageAt = new Date();
        if (ticket.status === "closed") ticket.status = "open";
        await ticket.save();

        await notifyAdmins({
            titleAr: "رسالة جديدة في تذكرة دعم",
            titleEn: "New message in a support ticket",
            bodyAr: `أضاف ${req.user.first_name} ${req.user.last_name} رسالة على التذكرة: «${ticket.subject}»`,
            bodyEn: `${req.user.first_name} ${req.user.last_name} added a message to: "${ticket.subject}"`,
            dedupe: true,
        });

        const populated = await SupportTicket.findById(ticket._id).populate(
            "messages.sender",
            "first_name last_name role profilePhoto"
        );
        res.json({ success: true, ticket: populated });
    } catch (err) {
        console.error("Error posting support message:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

export default router;
