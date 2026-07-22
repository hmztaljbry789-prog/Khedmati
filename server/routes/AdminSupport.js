import express from "express";
import multer from "multer";
import sharp from "sharp";
import crypto from "crypto";
import path from "path";
import SupportTicket from "../models/SupportTicket.js";
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

const VALID_STATUSES = ["open", "in_progress", "closed"];

// List every ticket, optionally filtered by status, with quick status counts
// for the inbox badges.
router.get("/", async (req, res) => {
    try {
        const { status } = req.query;
        const filter = {};
        if (status && VALID_STATUSES.includes(status)) filter.status = status;

        const tickets = await SupportTicket.find(filter)
            .populate("user", "first_name last_name email role profilePhoto")
            .sort({ lastMessageAt: -1 })
            .lean();

        const counts = {
            open: await SupportTicket.countDocuments({ status: "open" }),
            in_progress: await SupportTicket.countDocuments({
                status: "in_progress",
            }),
            closed: await SupportTicket.countDocuments({ status: "closed" }),
        };

        res.json({ success: true, tickets, counts });
    } catch (err) {
        console.error("Error listing tickets (admin):", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// Get one ticket with author and message senders populated.
router.get("/:id", async (req, res) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id)
            .populate("user", "first_name last_name email role profilePhoto")
            .populate("messages.sender", "first_name last_name role profilePhoto");
        if (!ticket) {
            return res
                .status(404)
                .json({ success: false, message: "Ticket not found" });
        }
        res.json({ success: true, ticket });
    } catch (err) {
        console.error("Error fetching ticket (admin):", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// Admin replies to a ticket. An open ticket moves to in_progress.
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

        ticket.messages.push({
            sender: req.user._id,
            senderRole: "admin",
            text: msgText,
            image: imageUrl,
        });
        ticket.lastMessageAt = new Date();
        if (ticket.status === "open") ticket.status = "in_progress";
        await ticket.save();

        await notify({
            recipient: ticket.user,
            type: "support",
            titleAr: "رد جديد من فريق الدعم",
            titleEn: "New reply from the support team",
            bodyAr: `ردّ فريق الدعم على تذكرتك: «${ticket.subject}»`,
            bodyEn: `The support team replied to your ticket: "${ticket.subject}"`,
            link: "/support",
        });

        const populated = await SupportTicket.findById(ticket._id)
            .populate("user", "first_name last_name email role profilePhoto")
            .populate("messages.sender", "first_name last_name role profilePhoto");
        res.json({ success: true, ticket: populated });
    } catch (err) {
        console.error("Error replying to ticket (admin):", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// Update a ticket's status (open / in_progress / closed).
router.put("/:id/status", async (req, res) => {
    try {
        const { status } = req.body;
        if (!VALID_STATUSES.includes(status)) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid status" });
        }
        const ticket = await SupportTicket.findByIdAndUpdate(
            req.params.id,
            { $set: { status } },
            { returnDocument: "after" }
        );
        if (!ticket) {
            return res
                .status(404)
                .json({ success: false, message: "Ticket not found" });
        }
        if (status === "closed") {
            await notify({
                recipient: ticket.user,
                type: "support",
                titleAr: "تم إغلاق تذكرة الدعم",
                titleEn: "Support ticket closed",
                bodyAr: `أُغلقت تذكرتك «${ticket.subject}». يمكنك إعادة فتحها بإرسال رسالة جديدة.`,
                bodyEn: `Your ticket "${ticket.subject}" was closed. Send a new message to reopen it.`,
                link: "/support",
            });
        }
        res.json({ success: true, ticket });
    } catch (err) {
        console.error("Error updating ticket status (admin):", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

export default router;
