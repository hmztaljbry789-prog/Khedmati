import express from "express";
import Booking from "../models/Booking.js";
import Review from "../models/Review.js";
import User from "../models/User.js";
import notify from "../utils/notify.js";

const router = express.Router();

// A customer may review the assigned technician once, and only after the
// booking has reached the completed state.
router.post("/", async (req, res) => {
    try {
        const score = Number(req.body.rating);
        const comment = String(req.body.comment || "").trim();
        if (!Number.isInteger(score) || score < 1 || score > 5 || comment.length > 1000) {
            return res.status(400).json({
                success: false,
                message: "Rating must be 1–5 and the comment at most 1000 characters",
            });
        }

        const booking = await Booking.findOne({ bookingId: req.body.bookingId });
        if (!booking || String(booking.user) !== String(req.user._id)) {
            return res.status(403).json({ success: false, message: "Not allowed" });
        }
        if (booking.status !== "SERVICE_COMPLETED" || !booking.provider) {
            return res.status(409).json({
                success: false,
                message: "Only completed bookings can be reviewed",
            });
        }

        const review = await Review.create({
            booking: booking._id,
            customer: req.user._id,
            provider: booking.provider,
            rating: score,
            comment,
        });

        const [summary] = await Review.aggregate([
            { $match: { provider: booking.provider } },
            {
                $group: {
                    _id: "$provider",
                    rating: { $avg: "$rating" },
                    count: { $sum: 1 },
                },
            },
        ]);
        const providerRating = Math.round(summary.rating * 10) / 10;
        await User.findByIdAndUpdate(booking.provider, {
            rating: providerRating,
            reviewCount: summary.count,
        });

        await notify({
            recipient: booking.provider,
            type: "review",
            titleAr: "تقييم جديد",
            titleEn: "New review",
            bodyAr: `قيّمك الزبون بـ ${score} من 5 نجوم.`,
            bodyEn: `A customer rated you ${score} out of 5 stars.`,
            link: "/provider/profile",
        });

        res.status(201).json({
            success: true,
            review,
            providerRating,
            providerReviewCount: summary.count,
        });
    } catch (error) {
        if (error?.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Booking already reviewed",
                code: "ALREADY_REVIEWED",
            });
        }
        console.error("Could not create review:", error);
        res.status(500).json({ success: false, message: "Could not create review" });
    }
});

router.get("/provider/:id", async (req, res) => {
    try {
        const items = await Review.find({ provider: req.params.id })
            .populate("customer", "first_name last_name profilePhoto")
            .sort({ createdAt: -1 })
            .limit(50);
        res.json({ success: true, items });
    } catch (error) {
        res.status(500).json({ success: false, message: "Could not load reviews" });
    }
});

export default router;
