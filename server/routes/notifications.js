import express from "express";
import Notification from "../models/Notification.js";
import PushSubscription from "../models/PushSubscription.js";
import { getVapidPublicKey } from "../utils/notify.js";

const router = express.Router();

// Expose the public VAPID key so the browser can create a push subscription.
router.get("/vapid-public-key", (req, res) => {
    res.json({ key: getVapidPublicKey() });
});

// Lightweight endpoint used by polling to keep the bell badge up to date.
router.get("/unread-count", async (req, res) => {
    try {
        const unreadCount = await Notification.countDocuments({
            recipient: req.user._id,
            read: false,
        });
        res.json({ unreadCount });
    } catch (error) {
        console.error("Error counting notifications:", error);
        res.status(500).json({ message: "Error counting notifications" });
    }
});

// Mark all of the current user's notifications as read.
router.put("/read-all", async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, read: false },
            { read: true }
        );
        res.json({ success: true });
    } catch (error) {
        console.error("Error marking all read:", error);
        res.status(500).json({ message: "Error updating notifications" });
    }
});

// Save (or refresh) a browser push subscription for the current user.
router.post("/subscribe", async (req, res) => {
    try {
        const { subscription } = req.body;
        if (!subscription || !subscription.endpoint) {
            return res.status(400).json({ message: "Invalid subscription" });
        }
        await PushSubscription.findOneAndUpdate(
            { endpoint: subscription.endpoint },
            {
                user: req.user._id,
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subscription.keys?.p256dh || "",
                    auth: subscription.keys?.auth || "",
                },
                userAgent: req.headers["user-agent"] || "",
            },
            { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
        );
        res.json({ success: true });
    } catch (error) {
        console.error("Error saving push subscription:", error);
        res.status(500).json({ message: "Error saving subscription" });
    }
});

// Remove a push subscription (e.g. user disabled notifications).
router.post("/unsubscribe", async (req, res) => {
    try {
        const { endpoint } = req.body;
        if (endpoint) {
            await PushSubscription.deleteOne({ endpoint, user: req.user._id });
        }
        res.json({ success: true });
    } catch (error) {
        console.error("Error removing push subscription:", error);
        res.status(500).json({ message: "Error removing subscription" });
    }
});

// Mark a single notification as read.
router.put("/:id/read", async (req, res) => {
    try {
        await Notification.updateOne(
            { _id: req.params.id, recipient: req.user._id },
            { read: true }
        );
        res.json({ success: true });
    } catch (error) {
        console.error("Error marking notification read:", error);
        res.status(500).json({ message: "Error updating notification" });
    }
});

// List the current user's notifications (newest first) plus the unread count.
router.get("/", async (req, res) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 30, 100);
        const [items, unreadCount] = await Promise.all([
            Notification.find({ recipient: req.user._id })
                .sort({ createdAt: -1 })
                .limit(limit),
            Notification.countDocuments({ recipient: req.user._id, read: false }),
        ]);
        res.json({ items, unreadCount });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: "Error fetching notifications" });
    }
});

export default router;
