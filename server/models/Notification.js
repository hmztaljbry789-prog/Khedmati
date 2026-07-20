import mongoose from "mongoose";

// A single in-app notification addressed to one user. Notifications are also
// pushed to the browser via the Web Push API (see utils/notify.js), but this
// collection is the durable source of truth that powers the in-app bell.
const notificationSchema = new mongoose.Schema(
    {
        // The user who should see this notification.
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        // Short machine-readable category, e.g. "booking", "chat", "support".
        type: { type: String, default: "general" },
        // Bilingual content so the bell can render in whichever language the
        // user is currently viewing.
        titleAr: { type: String, default: "" },
        titleEn: { type: String, default: "" },
        bodyAr: { type: String, default: "" },
        bodyEn: { type: String, default: "" },
        // In-app link to open when the notification is clicked (e.g. "/bookings").
        link: { type: String, default: "" },
        // Whether the recipient has read it yet.
        read: { type: Boolean, default: false, index: true },
    },
    { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

const Notification =
    mongoose.models.Notification ||
    mongoose.model("Notification", notificationSchema);

export default Notification;
