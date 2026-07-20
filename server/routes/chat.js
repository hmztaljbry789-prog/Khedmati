import express from "express";
import Message from "../models/Message.js";
import Booking from "../models/Booking.js";
import notify from "../utils/notify.js";

const router = express.Router();

// True when the authenticated user may read/post in this booking's chat:
// the customer who created it, the assigned technician (current `provider`
// field or any team slot in `assignments`), or an admin.
const canAccessBooking = (booking, user) => {
    if (!booking || !user) return false;
    if (user.role === "admin") return true;
    const uid = String(user._id);
    if (booking.user && String(booking.user) === uid) return true;
    if (booking.provider && String(booking.provider) === uid) return true;
    if (Array.isArray(booking.assignments)) {
        return booking.assignments.some(
            (slot) => slot.provider && String(slot.provider) === uid
        );
    }
    return false;
};

// Get chat history for a booking (participants only).
router.get("/:bookingId", async (req, res) => {
    try {
        const { bookingId } = req.params;

        const booking = await Booking.findOne({ bookingId });
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        if (!canAccessBooking(booking, req.user)) {
            return res.status(403).json({ message: "Not allowed" });
        }

        const messages = await Message.find({ bookingId })
            .populate("sender", "first_name last_name role profilePhoto")
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ message: "Error fetching messages" });
    }
});

// Send a message. The sender is taken from the auth token (never the body),
// and only booking participants are allowed to post.
router.post("/send", async (req, res) => {
    try {
        const { bookingId, text } = req.body;

        if (!bookingId || typeof text !== "string" || !text.trim()) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        if (text.trim().length > 2000) {
            return res
                .status(400)
                .json({ message: "Message is too long (max 2000 characters)" });
        }

        const booking = await Booking.findOne({ bookingId });
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        if (!canAccessBooking(booking, req.user)) {
            return res.status(403).json({ message: "Not allowed" });
        }

        const newMessage = new Message({
            bookingId,
            sender: req.user._id,
            text: text.trim(),
        });

        await newMessage.save();

        // Notify the other participants (customer + assigned technicians).
        try {
            const senderId = String(req.user._id);
            const recipients = new Set();
            if (booking.user) recipients.add(String(booking.user));
            if (booking.provider) recipients.add(String(booking.provider));
            if (Array.isArray(booking.assignments)) {
                booking.assignments.forEach((slot) => {
                    if (slot.provider) recipients.add(String(slot.provider));
                });
            }
            recipients.delete(senderId);
            const senderName = `${req.user.first_name || ""} ${req.user.last_name || ""}`.trim();
            const preview = text.trim().slice(0, 80);
            for (const r of recipients) {
                await notify({
                    recipient: r,
                    type: "chat",
                    titleAr: "رسالة جديدة",
                    titleEn: "New message",
                    bodyAr: `${senderName || "مستخدم"}: ${preview}`,
                    bodyEn: `${senderName || "User"}: ${preview}`,
                    link: "/bookings",
                });
            }
        } catch (e) {
            console.error("Chat notify failed:", e.message);
        }

        // Populate sender info to return a complete message object
        const populatedMessage = await Message.findById(newMessage._id).populate(
            "sender",
            "first_name last_name role profilePhoto"
        );

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ message: "Error sending message" });
    }
});

export default router;
