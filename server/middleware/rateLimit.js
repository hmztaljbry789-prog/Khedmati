// Simple in-memory fixed-window rate limiter (dependency-free).
// Suitable for a single-process deployment; swap for a Redis-backed
// limiter when running multiple instances.
const buckets = new Map();

export function rateLimit({
    windowMs = 15 * 60 * 1000,
    max = 20,
    message = "Too many requests. Please try again later.",
} = {}) {
    return (req, res, next) => {
        const now = Date.now();
        const key = `${req.ip}:${req.baseUrl || ""}${req.path}`;
        let bucket = buckets.get(key);
        if (!bucket || now - bucket.start >= windowMs) {
            bucket = { start: now, count: 0 };
            buckets.set(key, bucket);
        }
        bucket.count += 1;
        if (bucket.count > max) {
            const retryAfter = Math.ceil((bucket.start + windowMs - now) / 1000);
            res.set("Retry-After", String(Math.max(retryAfter, 1)));
            return res.status(429).json({ success: false, message });
        }
        next();
    };
}

// Drop stale buckets so memory stays bounded.
const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
        if (now - bucket.start > 60 * 60 * 1000) buckets.delete(key);
    }
}, 30 * 60 * 1000);
if (typeof cleanup.unref === "function") cleanup.unref();

export default rateLimit;
