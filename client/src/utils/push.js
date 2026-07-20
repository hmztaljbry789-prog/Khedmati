// Helpers for registering the browser for Web Push notifications.
import { getVapidKey, subscribePush, unsubscribePush } from "./api";

// Convert a base64 VAPID key into the Uint8Array the Push API expects.
function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");
    const raw = window.atob(base64);
    const output = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
        output[i] = raw.charCodeAt(i);
    }
    return output;
}

// Ask the browser for permission and register a push subscription tied to the
// logged-in user. Safe to call repeatedly; it reuses an existing subscription.
// Returns true only when a push subscription was successfully registered.
export async function enablePush() {
    try {
        if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
            return false;
        }
        if (typeof Notification === "undefined") return false;

        const permission = await Notification.requestPermission();
        if (permission !== "granted") return false;

        const registration = await navigator.serviceWorker.ready;

        // The server only supports push when VAPID keys are configured.
        const { key } = await getVapidKey();
        if (!key) return false;

        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(key),
            });
        }

        await subscribePush(subscription);
        return true;
    } catch (err) {
        console.error("Failed to enable push:", err);
        return false;
    }
}

// Remove the current push subscription (best-effort).
export async function disablePush() {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            await unsubscribePush(subscription.endpoint);
            await subscription.unsubscribe();
        }
    } catch (err) {
        console.error("Failed to disable push:", err);
    }
}
