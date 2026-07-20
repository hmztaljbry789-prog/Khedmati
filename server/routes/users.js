import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import multer from "multer";
import path from "path";
import crypto from "crypto";
import User from "../models/User.js";
import { authenticateUser } from "../middleware/auth.js";
import { validateRegistrationInput } from "../utils/validate.js";
import logger from "../utils/logger.js";
import { uploadBuffer } from "../config/cloudinary.js";
import notify from "../utils/notify.js";
import { autoAssignPendingBookings } from "./bookings.js";

const router = express.Router();

// Storage for technician ID documents (admin-only verification requirement).
const idUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const validExtension = [".png", ".jpg", ".jpeg", ".webp", ".pdf"].includes(ext);
        const validMime = ["image/png", "image/jpeg", "image/webp", "application/pdf"].includes(file.mimetype);
        if (validExtension && validMime) cb(null, true);
        else cb(new Error("Only image or PDF files are allowed"));
    },
    limits: { fileSize: 5 * 1024 * 1024 },
});

// Only these roles may be chosen at self-registration. "admin" can never be
// granted by the public register endpoint.
const SELF_REGISTER_ROLES = ["user", "provider"];

//Register
router.post("/register", async (req, res) => {
    res.header("Access-Control-Allow-Credentials", true);

    const { first_name, last_name, phone, email, password } = req.body;

    const validationError = validateRegistrationInput(req.body);
    if (validationError) {
        return res.status(400).json({ msg: validationError });
    }

    try {
        let user = await User.findOne({ $or: [{ phone }, { email }] });
        if (user) {
            return res.status(400).json({ msg: "User already exists." });
        }
        const requestedRole = SELF_REGISTER_ROLES.includes(req.body.role)
            ? req.body.role
            : "user";

        user = new User({
            first_name,
            last_name,
            phone,
            email,
            password,
            role: requestedRole,
            city: req.body.city,
            latitude: req.body.latitude,
            longitude: req.body.longitude,
            // Technician profile fields (only meaningful for providers)
            specialties:
                requestedRole === "provider" && Array.isArray(req.body.specialties)
                    ? req.body.specialties
                    : [],
            serviceRadiusKm:
                requestedRole === "provider" && req.body.serviceRadiusKm
                    ? Number(req.body.serviceRadiusKm)
                    : 15,
            // New technicians start unverified and must be approved by an admin
            // after completing their profile and uploading an ID document.
            isVerified: requestedRole === "provider" ? false : true,
        });

        await user.save();

        const payload = {
            user: {
                _id: user._id,
                tokenVersion: user.tokenVersion || 0,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: "1d" },
            (err, token) => {
                if (err) throw err;
                res.cookie("token", token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite:
                        process.env.NODE_ENV === "production" ? "None" : "Lax",
                    maxAge: 24 * 60 * 60 * 1000, // 1 day
                }).json({
                    success: true,
                    user: {
                        _id: user._id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        email: user.email,
                        phone: user.phone,
                        role: user.role,
                    },
                });
            }
        );
    } catch (err) {
        logger.error(err.message);
        res.status(500).send("Server Error");
    }
});

//Login
router.post("/login", async (req, res) => {
    res.header("Access-Control-Allow-Credentials", true);

    const { phone, email, password, rememberMe } = req.body;

    try {
        // Only accept primitive strings (blocks NoSQL-injection payloads
        // such as { "$gt": "" }).
        const safeEmail = typeof email === "string" ? email.toLowerCase().trim() : "";
        const safePhone = typeof phone === "string" ? phone.trim() : "";
        let user;
        if (safeEmail) {
            user = await User.findOne({ email: safeEmail });
        } else if (safePhone) {
            user = await User.findOne({ phone: safePhone });
        } else {
            return res
                .status(400)
                .json({ msg: "Please provide email or phone number" });
        }

        if (!user) {
            return res.status(400).json({ msg: "Invalid Credentials" });
        }

        const isMatch =
            typeof password === "string" &&
            (await bcrypt.compare(password, user.password));
        if (!isMatch) {
            return res.status(400).json({ msg: "Invalid Credentials" });
        }

        const payload = {
            user: {
                _id: user._id,
                tokenVersion: user.tokenVersion || 0,
            },
        };

        // "Remember me" keeps the user signed in for 30 days; without it the
        // session lasts a single day.
        const tokenLife = rememberMe ? "30d" : "1d";
        const cookieMaxAge = (rememberMe ? 30 : 1) * 24 * 60 * 60 * 1000;

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: tokenLife },
            (err, token) => {
                if (err) throw err;
                res.cookie("token", token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === "production",
                    sameSite:
                        process.env.NODE_ENV === "production" ? "None" : "Lax",
                    maxAge: cookieMaxAge,
                }).json({
                    success: true,
                    user: {
                        _id: user._id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        email: user.email,
                        phone: user.phone,
                        role: user.role,
                    },
                });
            }
        );
    } catch (err) {
        logger.error(err.message);
        res.status(500).send("Server Error");
    }
});

//Logout
router.post("/logout", (req, res) => {
    res.header("Access-Control-Allow-Credentials", true);
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
        path: "/", // Clear from the entire domain
    });
    res.json({ success: true });
});

router.get("/user", async (req, res) => {
    res.header("Access-Control-Allow-Credentials", true);

    try {
        const token = req.cookies.token;
        if (!token)
            return res.status(401).json({
                msg: "No token, authorization denied",
                isAuthenticated: false,
            });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.user._id).select("-password");

        if (!user) {
            return res
                .status(404)
                .json({ msg: "User not found", isAuthenticated: false });
        }

        res.json({ isAuthenticated: true, user });
    } catch (err) {
        logger.error(err.message);
        res.status(500).send("Server Error");
    }
});

// ─────────────────────────────────────────────
//  Persistent shopping cart (per authenticated user)
// ─────────────────────────────────────────────

// Get the current user's saved cart
router.get("/cart", authenticateUser, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("cart");
        res.json({ success: true, cart: user?.cart || [] });
    } catch (err) {
        console.error("Error fetching cart:", err.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// Replace the current user's saved cart
router.put("/cart", authenticateUser, async (req, res) => {
    try {
        const { cart } = req.body;
        if (!Array.isArray(cart)) {
            return res.status(400).json({ success: false, message: "cart must be an array" });
        }
        if (cart.length > 100) {
            return res.status(400).json({ success: false, message: "Cart is too large" });
        }
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { cart },
            { returnDocument: "after" }
        ).select("cart");
        res.json({ success: true, cart: user.cart });
    } catch (err) {
        console.error("Error updating cart:", err.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// Clear the current user's saved cart
router.delete("/cart", authenticateUser, async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, { cart: [] });
        res.json({ success: true, cart: [] });
    } catch (err) {
        console.error("Error clearing cart:", err.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// ────────────────────────────────────
//  Technician (provider) self-service profile
// ────────────────────────────────────

// A provider updates their own service profile: coverage city/area,
// coordinates, specialties, service radius and availability.
// Wrap the ID-document upload so multer errors (unsupported file type, file
// too large, etc.) return a clean 400 instead of bubbling up as an opaque 500.
const uploadIdDocument = (req, res, next) => {
    idUpload.single("idDocument")(req, res, (err) => {
        if (err) {
            return res
                .status(400)
                .json({ success: false, message: err.message || "File upload failed" });
        }
        next();
    });
};

router.put("/profile", authenticateUser, uploadIdDocument, async (req, res) => {
    try {
        // authenticateUser already loaded the current user (without password).
        if (req.user.role !== "provider") {
            return res.status(403).json({ success: false, message: "Only technicians can update a service profile" });
        }

        const { city, area, latitude, longitude, serviceRadiusKm, isAvailable } = req.body;
        let { specialties } = req.body;
        // When sent as multipart FormData, arrays arrive as a JSON string.
        if (typeof specialties === "string") {
            try {
                specialties = JSON.parse(specialties);
            } catch {
                specialties = undefined;
            }
        }

        // Build a targeted update. Using findByIdAndUpdate with $set only
        // validates/casts the fields we actually change, so any pre-existing
        // data already stored on the document can never make a simple profile
        // save fail (a full document save() would re-validate everything).
        const updates = {};
        if (city !== undefined) updates.city = city;
        if (area !== undefined) updates.area = area;
        if (latitude !== undefined && latitude !== "") {
            const lat = Number(latitude);
            if (!Number.isNaN(lat)) updates.latitude = lat;
        }
        if (longitude !== undefined && longitude !== "") {
            const lng = Number(longitude);
            if (!Number.isNaN(lng)) updates.longitude = lng;
        }
        if (Array.isArray(specialties)) updates.specialties = specialties;
        if (serviceRadiusKm !== undefined) {
            const radius = Number(serviceRadiusKm);
            if (!Number.isNaN(radius) && radius > 0) updates.serviceRadiusKm = radius;
        }
        if (isAvailable !== undefined) updates.isAvailable = isAvailable === true || isAvailable === "true";
        if (req.file) {
            const result = await uploadBuffer(req.file.buffer, {
                folder: "khedmati/ids",
                public_id: `id-${req.user._id}-${crypto.randomUUID()}`,
                resource_type: "auto",
                type: "authenticated",
                overwrite: false,
            });
            updates.idDocument = result.public_id;
            updates.idDocumentResourceType = result.resource_type === "raw" ? "raw" : "image";
            updates.idDocumentFormat = result.format || path.extname(req.file.originalname).slice(1).toLowerCase();
            updates.isVerified = false;
            updates.verificationStatus = "pending";
            updates.verificationRejectionReason = "";
        }

        const safe = await User.findByIdAndUpdate(
            req.user._id,
            { $set: updates },
            { returnDocument: "after", runValidators: true }
        ).select("-password");

        if (!safe) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        // The technician just turned themself available: retry assignment for
        // bookings that are still waiting for a technician (fire-and-forget,
        // never delays the profile-save response).
        if (updates.isAvailable === true && safe.isVerified) {
            autoAssignPendingBookings();
        }
        if (req.file) {
            const admins = await User.find({ role: "admin" }).select("_id");
            await Promise.all(admins.map((admin) => notify({
                recipient: admin._id,
                type: "verification",
                titleAr: "هوية جديدة بانتظار المراجعة",
                titleEn: "New identity document awaiting review",
                bodyAr: `رفع الفني ${safe.first_name} ${safe.last_name} هوية جديدة للمراجعة.`,
                bodyEn: `${safe.first_name} ${safe.last_name} uploaded a new identity document for review.`,
                link: "/admin/users",
            })));
        }
        res.json({ success: true, user: safe });
    } catch (err) {
        console.error("Error updating provider profile:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

export default router;
