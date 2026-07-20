import webpush from "web-push";
import Notification from "../models/Notification.js";
import PushSubscription from "../models/PushSubscription.js";

// ── Web Push (VAPID) setup ──
// VAPID keys identify our server to the browser push services. Generate a pair
// once with:   npx web-push generate-vapid-keys
// then add them to the server .env file:
//   VAPID_PUBLIC_KEY=...
//   VAPID_PRIVATE_KEY=...
//   VAPID_SUBJECT=mailto:you@example.com
// IMPORTANT: Because ES-module imports are hoisted and evaluated BEFORE the
// module body (including dotenv.config()) runs, reading process.env at the
// top level here gives empty strings.  We therefore defer the VAPID
// initialisation to the first time it is actually needed (lazy init).
let pushReady = false;
let vapidInitDone = false;

// Return the current public key (always read fresh from process.env).
export const getVapidPublicKey = () => process.env.VAPID_PUBLIC_KEY || "";

const ensureVapidInit = () => {
    if (vapidInitDone) return;
    vapidInitDone = true;
    const pub = process.env.VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    const subj = process.env.VAPID_SUBJECT || "mailto:admin@khedmati.app";
    if (pub && priv) {
        try {
            webpush.setVapidDetails(subj, pub, priv);
            pushReady = true;
            console.log("[notify] VAPID configured — browser push enabled.");
        } catch (err) {
            console.error("[notify] Failed to configure web-push:", err.message);
        }
    } else {
        console.warn(
            "[notify] VAPID keys not set — browser push disabled (in-app notifications still work)."
        );
    }
};

// Send a Web Push message to every subscription owned by a user. Dead
// subscriptions (410/404) are pruned automatically. Failures never throw.
const sendPush = async (userId, payload) => {
    ensureVapidInit();
    if (!pushReady) return;
    let subs = [];
    try {
        subs = await PushSubscription.find({ user: userId });
    } catch (err) {
        console.error("[notify] Failed to load subscriptions:", err.message);
        return;
    }
    await Promise.all(
        subs.map(async (sub) => {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: { p256dh: sub.keys?.p256dh, auth: sub.keys?.auth },
                    },
                    JSON.stringify(payload)
                );
            } catch (err) {
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await PushSubscription.deleteOne({ _id: sub._id }).catch(() => {});
                } else {
                    console.error(
                        "[notify] Push send failed:",
                        err.statusCode || err.message
                    );
                }
            }
        })
    );
};

// Create an in-app notification for a user and fire a matching browser push.
// `recipient` may be a user id, ObjectId, or populated user document. All
// content is bilingual. This helper is fire-and-forget safe: it logs but never
// throws, so a notification failure can't break the flow that triggered it.
export const notify = async ({
    recipient,
    type = "general",
    titleAr = "",
    titleEn = "",
    bodyAr = "",
    bodyEn = "",
    link = "",
}) => {
    if (!recipient) return null;
    const recipientId = recipient._id || recipient;
    try {
        const doc = await Notification.create({
            recipient: recipientId,
            type,
            titleAr,
            titleEn,
            bodyAr,
            bodyEn,
            link,
        });

        // Fire push in the background; we deliberately do not await so the
        // caller's response isn't delayed by the push round-trip.
        sendPush(recipientId, {
            title: titleAr || titleEn,
            body: bodyAr || bodyEn,
            titleAr,
            titleEn,
            bodyAr,
            bodyEn,
            link,
            type,
            id: String(doc._id),
        });

        return doc;
    } catch (err) {
        console.error("[notify] Failed to create notification:", err.message);
        return null;
    }
};

export default notify;
