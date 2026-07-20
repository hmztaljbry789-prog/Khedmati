import express from "express";
import Booking from "../models/Booking.js";
import Service from "../models/Service.js";
import User from "../models/User.js";

const router = express.Router();

// Count every individual bookable service nested inside the Service documents
// (subcategories -> [serviceTypes ->] categories -> services[]). Works whether
// Mongoose Map fields come back as Maps or as plain objects (e.g. with .lean()).
const toValues = (mapOrObj) => {
    if (!mapOrObj) return [];
    if (mapOrObj instanceof Map) return Array.from(mapOrObj.values());
    return Object.values(mapOrObj);
};

const countServicesInCategories = (categories) => {
    if (!Array.isArray(categories)) return 0;
    return categories.reduce(
        (sum, cat) => sum + (Array.isArray(cat?.services) ? cat.services.length : 0),
        0
    );
};

const countNestedServices = (serviceDocs) => {
    let count = 0;
    for (const doc of serviceDocs || []) {
        for (const sub of toValues(doc?.subcategories)) {
            if (!sub) continue;
            count += countServicesInCategories(sub.categories);
            for (const type of toValues(sub.serviceTypes)) {
                count += countServicesInCategories(type?.categories);
            }
        }
    }
    return count;
};

const getDateRange = (range) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (range) {
        case "today":
            return { createdAt: { $gte: today } };
        case "week": {
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return { createdAt: { $gte: weekAgo } };
        }
        case "month": {
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return { createdAt: { $gte: monthAgo } };
        }
        case "year": {
            const yearAgo = new Date(today);
            yearAgo.setFullYear(yearAgo.getFullYear() - 1);
            return { createdAt: { $gte: yearAgo } };
        }
        default:
            return {};
    }
};

router.get("/stats", async (req, res) => {
    try {
        const timeRange = req.query.timeRange || "all";
        const dateFilter = getDateRange(timeRange);

        const bookings = await Booking.find(dateFilter)
            .sort({ createdAt: -1 })
            .populate("user", "first_name last_name email")
            .populate("provider", "first_name last_name")
            .lean();

        // "Revenue" is repurposed as confirmed-booking volume (no payments anymore)
        const confirmedCount = bookings.filter(
            (b) => b.status === "CONFIRMED" || b.status === "SERVICE_COMPLETED"
        ).length;

        // Cancelled bookings are not real payments, so exclude them from the
        // payments count and the recent-payments list.
        const nonCancelledBookings = bookings.filter(
            (b) => b.status !== "CANCELLED"
        );

        // Top services by number of bookings (using items array)
        const serviceStats = await Booking.aggregate([
            { $match: { ...dateFilter, "items.title": { $exists: true } } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.title",
                    titleAr: { $first: "$items.titleAr" },
                    totalSales: { $sum: { $ifNull: ["$items.quantity", 1] } },
                    revenue: { $sum: { $ifNull: ["$items.quantity", 1] } },
                },
            },
            { $match: { _id: { $ne: null } } },
            { $sort: { revenue: -1 } },
            { $limit: 10 },
        ]);

        // Booking status distribution
        const bookingStatusStats = await Booking.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: { $ifNull: ["$status", "PENDING_APPROVAL"] },
                    count: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 1,
                    count: 1,
                    status: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$_id", "PENDING_APPROVAL"] }, then: "Pending Approval" },
                                { case: { $eq: ["$_id", "CONFIRMED"] }, then: "Confirmed" },
                                { case: { $eq: ["$_id", "SERVICE_COMPLETED"] }, then: "Completed" },
                            ],
                            default: "Other",
                        },
                    },
                },
            },
        ]);

        // Monthly booking volume
        const monthlyRevenue = await Booking.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(
                            new Date().setFullYear(new Date().getFullYear() - 1)
                        ),
                    },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                    },
                    total: { $sum: 1 },
                    count: { $sum: 1 },
                },
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
        ]);

        // Use fixed English month keys so the client can match them reliably
        // regardless of the server's system locale (a localized name such as
        // "يوليو" would never match the client's "Jul" and the chart
        // would render flat at zero).
        const MONTH_SHORT = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        ];
        const formattedMonthlyRevenue = monthlyRevenue.map((item) => ({
            year: item._id.year,
            monthIndex: item._id.month,
            month: MONTH_SHORT[item._id.month - 1],
            total: item.total || 0,
            count: item.count,
        }));

        // Global catalog/user counts (independent of the selected time range).
        const [totalUsers, totalServices, serviceDocs] = await Promise.all([
            User.countDocuments(),
            Service.countDocuments(),
            Service.find().lean(),
        ]);
        const totalServiceDetails = countNestedServices(serviceDocs);

        res.json({
            totalBookings: bookings.length,
            totalUsers,
            totalServices,
            totalServiceDetails,
            totalPayments: nonCancelledBookings.length,
            revenue: { total: confirmedCount, count: confirmedCount },
            monthlyRevenue: formattedMonthlyRevenue,
            bookingStatusStats,
            topServices: serviceStats,
            recentBookings: nonCancelledBookings.slice(0, 5),
            timeRange,
        });
    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({
            message: "Error fetching dashboard stats",
            error: error.message,
        });
    }
});

export default router;
