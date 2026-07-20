import express from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import { sendPasswordResetEmail, isMailConfigured } from "../utils/mailer.js";
import logger from "../utils/logger.js";
import { MIN_PASSWORD_LENGTH } from "../utils/validate.js";

const router = express.Router();

// Verify token middleware
const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: "Access denied" });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        // Token payload shape is { user: { _id } }
        req.user = verified.user;
        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
};

// Verify route - checks if user is authenticated
router.get("/verify", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

// ── Forgot password: issue a one-time reset token ──
// The user submits their email or phone. If a matching account exists we
// generate a random token, store only its hash, and (in development) return
// the token so the reset can be completed without an email service.
router.post("/forgot-password", async (req, res) => {
    res.header("Access-Control-Allow-Credentials", true);
    try {
        const { email, phone, emailOrPhone } = req.body;
        const identifier = emailOrPhone || email || phone;
        if (!identifier) {
            return res.status(400).json({ msg: "Please provide your email or phone number" });
        }

        const query = String(identifier).includes("@")
            ? { email: String(identifier).toLowerCase() }
            : { phone: String(identifier) };
        const user = await User.findOne(query);

        // Always create a token so the response shape/timing does not reveal
        // whether the account exists (basic protection against enumeration).
        const rawToken = crypto.randomBytes(32).toString("hex");

        if (user) {
            const hashed = crypto.createHash("sha256").update(rawToken).digest("hex");
            user.resetPasswordToken = hashed;
            user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // valid for 1 hour
            await user.save();
        }

        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;

        const payload = {
            success: true,
            msg: "If an account matches, a password reset link has been generated.",
        };

        if (user) {
            // Prefer emailing the reset link via Gmail SMTP when configured.
            if (user.email && isMailConfigured()) {
                try {
                    await sendPasswordResetEmail({ to: user.email, resetUrl });
                } catch (mailErr) {
                    console.error("Failed to send reset email:", mailErr.message);
                    // Don't fail the request; in development expose the link so
                    // the flow stays testable even if the mailer misbehaves.
                    if (process.env.NODE_ENV !== "production") {
                        payload.resetToken = rawToken;
                        payload.resetUrl = resetUrl;
                    }
                }
            } else if (process.env.NODE_ENV !== "production") {
                // No mail service configured (or no email on file): return the
                // link directly for local development/testing only.
                payload.resetToken = rawToken;
                payload.resetUrl = resetUrl;
            }
        }
        res.json(payload);
    } catch (err) {
        logger.error(err.message);
        res.status(500).send("Server Error");
    }
});

// ── Reset password using a valid, non-expired token ──
router.post("/reset-password/:token", async (req, res) => {
    res.header("Access-Control-Allow-Credentials", true);
    try {
        const { password } = req.body;
        if (!password || typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json({
                msg: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
            });
        }

        const hashed = crypto.createHash("sha256").update(req.params.token).digest("hex");
        const user = await User.findOne({
            resetPasswordToken: hashed,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ msg: "Reset link is invalid or has expired" });
        }

        // Assigning the plain password triggers the model pre-save hook that
        // hashes it with bcrypt; we then clear the one-time token fields.
        user.password = password;
        user.tokenVersion = (user.tokenVersion || 0) + 1;
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.json({ success: true, msg: "Password has been reset successfully" });
    } catch (err) {
        logger.error(err.message);
        res.status(500).send("Server Error");
    }
});

export default router;
