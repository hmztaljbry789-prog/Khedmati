import express from "express";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import { signedAuthenticatedUrl } from "../config/cloudinary.js";
import notify from "../utils/notify.js";
import { writeAudit } from "../utils/audit.js";
import { autoAssignPendingBookings } from "./bookings.js";

const router = express.Router();

const SAFE_FIELDS =
    "first_name last_name email phone role city area latitude longitude isAvailable isVerified verificationStatus verificationRejectionReason specialties serviceRadiusKm rating reviewCount completedJobs profilePhoto idDocument idDocumentResourceType idDocumentFormat createdAt";

// The primary (founding) admin can never be demoted or deleted — not even
// by another admin. Primary = the account whose email matches ADMIN_EMAIL,
// or the earliest-created admin when ADMIN_EMAIL is not configured.
async function isPrimaryAdmin(target) {
    if (!target || target.role !== "admin") return false;
    const configured = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
    if (configured) {
        return (target.email || "").toLowerCase() === configured;
    }
    const firstAdmin = await User.findOne({ role: "admin" })
        .sort({ createdAt: 1 })
        .select("_id");
    return firstAdmin && String(firstAdmin._id) === String(target._id);
}

// List users, optionally filtered by role (?role=provider | user | admin)
router.get("/", async (req, res) => {
    try {
        const { role, search } = req.query;
        const query = {};
        if (role) query.role = role;
        if (search) {
            const rx = new RegExp(search, "i");
            query.$or = [
                { first_name: rx },
                { last_name: rx },
                { email: rx },
                { phone: rx },
                { city: rx },
            ];
        }
        const users = await User.find(query).select(SAFE_FIELDS).sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Error fetching users" });
    }
});

// Aggregate counts for the admin overview
router.get("/stats", async (req, res) => {
    try {
        const [customers, providers, admins, availableProviders, pendingVerification] = await Promise.all([
            User.countDocuments({ role: "user" }),
            User.countDocuments({ role: "provider" }),
            User.countDocuments({ role: "admin" }),
            User.countDocuments({ role: "provider", isAvailable: true }),
            User.countDocuments({
                role: "provider",
                isVerified: false,
                idDocument: { $nin: [null, ""] },
                profilePhoto: { $nin: [null, ""] },
                latitude: { $ne: null },
                longitude: { $ne: null },
                "specialties.0": { $exists: true },
            }),
        ]);
        res.json({ customers, providers, admins, availableProviders, pendingVerification });
    } catch (error) {
        console.error("Error fetching user stats:", error);
        res.status(500).json({ message: "Error fetching user stats" });
    }
});

// Open an identity document through a short-lived signed Cloudinary URL.
// Old local paths remain supported during migration.
router.get("/:id/id-document", async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select(
            "idDocument idDocumentResourceType idDocumentFormat"
        );
        if (!user?.idDocument) return res.status(404).json({ message: "ID document not found" });
        if (user.idDocument.startsWith("assets/")) {
            return res.redirect(`/${user.idDocument}`);
        }
        const url = signedAuthenticatedUrl(user.idDocument, {
            resourceType: user.idDocumentResourceType,
            format: user.idDocumentFormat,
        });
        return res.redirect(url);
    } catch (error) {
        console.error("Error opening identity document:", error.message);
        return res.status(500).json({ message: "Could not open identity document" });
    }
});

// Get a single provider together with a small jobs summary
router.get("/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select(SAFE_FIELDS);
        if (!user) return res.status(404).json({ message: "User not found" });

        let jobs = null;
        if (user.role === "provider") {
            const [active, completed] = await Promise.all([
                Booking.countDocuments({
                    provider: user._id,
                    status: { $in: ["CONFIRMED", "IN_PROGRESS"] },
                }),
                Booking.countDocuments({ provider: user._id, status: "SERVICE_COMPLETED" }),
            ]);
            jobs = { active, completed };
        }
        res.json({ user, jobs });
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Error fetching user" });
    }
});

// Change a user's role (user <-> provider <-> admin)
router.put("/:id/role", async (req, res) => {
    try {
        const { role } = req.body;
        if (!["user", "provider", "admin"].includes(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }
        const target = await User.findById(req.params.id);
        if (!target) return res.status(404).json({ message: "User not found" });

        // Guard rails when stripping admin rights from an existing admin.
        if (target.role === "admin" && role !== "admin") {
            // 1. The primary admin can never be demoted, even by another admin.
            if (await isPrimaryAdmin(target)) {
                return res.status(403).json({
                    message: "The primary admin account cannot be demoted",
                    code: "PRIMARY_ADMIN_PROTECTED",
                });
            }
            // 2. The workspace must always keep at least one admin.
            const adminCount = await User.countDocuments({ role: "admin" });
            if (adminCount <= 1) {
                return res.status(400).json({
                    message: "Cannot demote the last remaining admin",
                    code: "LAST_ADMIN_PROTECTED",
                });
            }
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { returnDocument: "after" }
        ).select(SAFE_FIELDS);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (error) {
        console.error("Error updating role:", error);
        res.status(500).json({ message: "Error updating role" });
    }
});

// Toggle a technician's availability
router.put("/:id/availability", async (req, res) => {
    try {
        const { isAvailable } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isAvailable: !!isAvailable },
            { returnDocument: "after" }
        ).select(SAFE_FIELDS);
        if (!user) return res.status(404).json({ message: "User not found" });
        // Turned available by an admin: retry assignment for bookings that
        // are still waiting for a technician (fire-and-forget).
        if (user.isAvailable && user.isVerified) {
            autoAssignPendingBookings();
        }
        res.json(user);
    } catch (error) {
        console.error("Error updating availability:", error);
        res.status(500).json({ message: "Error updating availability" });
    }
});

// Requirements a technician must satisfy before they can be verified:
// an ID document plus a complete profile (specialties, coordinates).
// The area is intentionally optional: a technician may cover a whole city,
// which is common for small cities and towns.
function verificationMissing(target) {
    const missing = [];
    if (!target.idDocument) missing.push("idDocument");
    if (!Array.isArray(target.specialties) || target.specialties.length === 0) missing.push("specialties");
    if (target.latitude == null || target.longitude == null) missing.push("coordinates");
    return missing;
}


// Approve / suspend a technician (admin trust flag, separate from availability).
// Approval is only allowed once the verification requirements are met.
router.put("/:id/verified", async (req, res) => {
    try {
        const { isVerified } = req.body;
        const rejectionReason = typeof req.body.rejectionReason === "string"
            ? req.body.rejectionReason.trim()
            : "";
        const target = await User.findById(req.params.id);
        if (!target) return res.status(404).json({ message: "User not found" });
        if (target.role !== "provider") {
            return res.status(400).json({ message: "Verification decisions apply to providers only" });
        }

        if (isVerified) {
            const missing = verificationMissing(target);
            if (missing.length > 0) {
                return res.status(400).json({
                    message: "Provider does not meet verification requirements",
                    missing,
                });
            }
        } else if (rejectionReason.length < 5 || rejectionReason.length > 500) {
            return res.status(400).json({
                message: "A rejection reason between 5 and 500 characters is required",
            });
        }

        // Update only the trust flag. Using findByIdAndUpdate with validators
        // disabled avoids running full-document validation and the password-hash
        // pre-save hook, which previously made unverifying a provider fail with a
        // 500 "Error updating verification".
        const user = await User.findByIdAndUpdate(
            req.params.id,
            {
                isVerified: !!isVerified,
                verificationStatus: isVerified ? "verified" : "rejected",
                verificationRejectionReason: isVerified ? "" : rejectionReason,
            },
            { returnDocument: "after", runValidators: false }
        ).select(SAFE_FIELDS);
        if (!user) return res.status(404).json({ message: "User not found" });
        // Newly verified and already marked available: retry assignment for
        // bookings that are still waiting for a technician.
        if (isVerified && user.isAvailable) {
            autoAssignPendingBookings();
        }
        await notify({
            recipient: user._id,
            type: "verification",
            titleAr: isVerified ? "تم قبول توثيق حسابك" : "تم رفض طلب التوثيق",
            titleEn: isVerified ? "Your verification was approved" : "Verification request rejected",
            bodyAr: isVerified
                ? "تمت مراجعة صورتك الشخصية وهويتك واعتماد حسابك كفني موثّق."
                : `سبب الرفض: ${rejectionReason}`,
            bodyEn: isVerified
                ? "Your profile photo and identity document were reviewed and your provider account is now verified."
                : `Reason: ${rejectionReason}`,
            link: "/provider/profile",
        });
        await writeAudit(req, {
            action: isVerified ? "provider.verification_approved" : "provider.verification_rejected",
            entityType: "user",
            entityId: user._id,
            before: {
                isVerified: target.isVerified,
                verificationStatus: target.verificationStatus,
            },
            after: {
                isVerified: user.isVerified,
                verificationStatus: user.verificationStatus,
                rejectionReason: user.verificationRejectionReason,
            },
        });
        res.json(user);
    } catch (error) {
        console.error("Error updating verification:", error);
        res.status(500).json({ message: "Error updating verification" });
    }
});

// Delete a user (cannot delete admins through this endpoint)
router.delete("/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        // Admin accounts (including the primary admin) can never be deleted
        // through this endpoint — demote first, which is itself guarded so
        // the primary admin and the last remaining admin are untouchable.
        if (user.role === "admin") {
            return res.status(403).json({
                message: "Cannot delete an admin account",
                code: "ADMIN_DELETE_FORBIDDEN",
            });
        }
        await User.findByIdAndDelete(req.params.id);
        res.json({ success: true, deletedId: req.params.id });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Error deleting user" });
    }
});

export default router;
