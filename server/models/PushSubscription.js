import mongoose from "mongoose";

// A browser push subscription belonging to a user. One user may have several
// (one per device/browser). Stored separately so subscriptions can be added or
// removed without touching the User document.
const pushSubscriptionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        // The unique endpoint URL is the natural key for a subscription.
        endpoint: { type: String, required: true, unique: true },
        keys: {
            p256dh: { type: String, default: "" },
            auth: { type: String, default: "" },
        },
        userAgent: { type: String, default: "" },
    },
    { timestamps: true }
);

const PushSubscription =
    mongoose.models.PushSubscription ||
    mongoose.model("PushSubscription", pushSubscriptionSchema);

export default PushSubscription;
