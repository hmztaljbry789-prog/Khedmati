// Load environment variables FIRST so every subsequent import (cloudinary,
// mailer, etc.) can read process.env during its top-level initialization.
import "dotenv/config";

import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
dns.setDefaultResultOrder("ipv4first");
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import { rateLimit } from "./middleware/rateLimit.js";
import logger from "./utils/logger.js";

// Import routes
import userRoutes from "./routes/users.js";
import servicesRoutes from "./routes/services.js";
import bookingsRoutes from "./routes/bookings.js";
import authRoutes from "./routes/auth.js";
import chatRoutes from "./routes/chat.js";
import supportRoutes from "./routes/support.js";
import notificationsRoutes from "./routes/notifications.js";
import reviewsRoutes from "./routes/reviews.js";
import accountRoutes from "./routes/account.js";
import { originGuard } from "./middleware/originGuard.js";
import { authenticateUser, authenticateAdmin } from "./middleware/auth.js";
import { isCloudinaryConfigured } from "./config/cloudinary.js";

import AdminServices from "./routes/AdminServices.js";
import adminDashboardRoutes from "./routes/AdminDashboard.js";
import adminServicesRouter from "./routes/AdminServicesRouter.js";
import adminBookingsRoutes from "./routes/AdminBookings.js";
import adminUsersRoutes from "./routes/AdminUsers.js";
import adminSupportRoutes from "./routes/AdminSupport.js";

// Set __dirname and __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Refuse to boot without a signing secret — otherwise every issued
// session token would be forgeable.
if (!process.env.JWT_SECRET) {
    console.error("FATAL: JWT_SECRET is not set. Add it to your .env file.");
    process.exit(1);
}

// Initialize express app
const app = express();

// Security middleware
app.use(
  helmet({
    // Uploaded images are consumed by the Vercel frontend (another origin).
    crossOriginResourcePolicy: { policy: "cross-origin" },
    // Explicit, long-lived HSTS so browsers always use HTTPS.
    hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
    // The API never renders HTML, so it must never be framed.
    frameguard: { action: "deny" },
  })
);

//Middleware
app.use(express.json());
// Render/most PaaS run the app behind a reverse proxy. Trusting it makes
// req.ip (used by the rate limiter) and secure cookies work correctly.
app.set("trust proxy", 1);

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(cookieParser());
app.use(originGuard);

// Technician ID documents are sensitive: only an admin (or the document's
// owner) may fetch them. This guard runs before the static handler below.
app.use("/assets/ids", authenticateUser, (req, res, next) => {
    const isOwner = req.path.startsWith(`/id-${req.user._id}-`);
    if (req.user.role === "admin" || isOwner) return next();
    return res.status(403).json({ success: false, message: "Access denied." });
});

// Serve static files
app.use(
    "/assets",
    express.static(path.join(__dirname, "public/assets"), {
        setHeaders: (res) => {
            // Uploaded files (including SVG, which can embed scripts) must
            // never execute anything when opened directly: this neutralizes
            // stored-XSS via crafted uploads while images keep rendering fine.
            res.set("Content-Security-Policy", "default-src 'none'; sandbox");
            res.set("X-Content-Type-Options", "nosniff");
        },
    })
);

// Throttle credential endpoints against brute-force / enumeration attacks.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
const resetLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10 });
app.use(["/api/users/login", "/api/users/register"], authLimiter);
app.use(["/api/auth/forgot-password", "/api/auth/reset-password"], resetLimiter);

// Deployment health check — open https://<backend-url>/api/health in a browser
// to verify WHICH code version is running and whether Cloudinary env vars
// are configured on the production host. Exposes no secrets.
app.get("/api/health", (req, res) => {
    res.json({
        ok: true,
        version: "photo-fix-2026-07-15",
        cloudinaryConfigured: isCloudinaryConfigured(),
        env: process.env.NODE_ENV || "development",
    });
});

//Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/services", servicesRoutes);
// Bookings and chat require an authenticated, logged-in user.
app.use("/api/bookings", authenticateUser, bookingsRoutes);
app.use("/api/chat", authenticateUser, chatRoutes);
// Support tickets opened by customers and technicians.
app.use("/api/support", authenticateUser, supportRoutes);
// In-app + Web Push notifications for the logged-in user.
app.use("/api/notifications", authenticateUser, notificationsRoutes);
app.use("/api/reviews", authenticateUser, reviewsRoutes);
app.use("/api/account", authenticateUser, accountRoutes);

// All admin endpoints require an authenticated admin account.
app.use("/api/admin/services", authenticateAdmin, AdminServices);
app.use("/api/admin/dashboard", authenticateAdmin, adminDashboardRoutes);
app.use("/api/admin/servicedetails", authenticateAdmin, adminServicesRouter);
app.use("/api/admin/bookings", authenticateAdmin, adminBookingsRoutes);
app.use("/api/admin/users", authenticateAdmin, adminUsersRoutes);
app.use("/api/admin/support", authenticateAdmin, adminSupportRoutes);

// Global error handler. Full details are logged server-side; clients only
// see them in development.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    logger.error(err.stack || err.message);
    res.status(err.status || 500).json({
        success: false,
        message: "Server error",
        ...(process.env.NODE_ENV === "development"
            ? { error: err.message }
            : {}),
    });
});

//Start server
const PORT = process.env.PORT || 5000;

mongoose
    .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/Khedmati")
    .then(() => {
        logger.info("Connected to MongoDB");
        app.listen(PORT, () =>
            logger.info(`Server is running on port ${PORT}`)
        );
    })
    .catch((err) => {
        logger.error("Failed to connect to MongoDB", err);
        process.exit(1);
    });
