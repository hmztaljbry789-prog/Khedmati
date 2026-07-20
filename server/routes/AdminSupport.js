import express from "express";
import SupportTicket from "../models/SupportTicket.js";
import notify from "../utils/notify.js";

const router = express.Router();

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
router.post("/:id/messages", async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || !text.trim()) {
            return res
                .status(400)
                .json({ success: false, message: "Message text is required" });
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
            text: text.trim(),
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
