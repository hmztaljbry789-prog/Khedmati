/**
 * Returns a safe image URL for user profile photos.
 * Only accepts full http/https Cloudinary URLs. Anything else (legacy local
 * paths, empty strings, invalid values) falls back to the site logo.
 */
export function photoUrl(photo, fallback = "/logo-192.png") {
    if (typeof photo !== "string" || photo.trim() === "") return fallback;
    if (photo.startsWith("http://") || photo.startsWith("https://")) return photo;
    return fallback;
}
