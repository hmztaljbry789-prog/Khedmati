import express from "express";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import { getDistance, getCityCoordinates } from "../data/palestineCities.js";
import notify from "../utils/notify.js";

const router = express.Router();

const PROVIDER_FIELDS =
    "first_name last_name phone email city area latitude longitude specialties serviceRadiusKm isAvailable isVerified rating reviewCount completedJobs profilePhoto";

// Get all bookings (admin sees everything)
router.get("/", async (req, res) => {
    try {
        const bookings = await Booking.find()
            .populate("provider", PROVIDER_FIELDS)
            .populate("assignments.provider", PROVIDER_FIELDS)
            .populate("user", "first_name last_name email phone")
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({ message: "Error fetching bookings" });
    }
});

// Update booking status
router.put("/:bookingId/status", async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { status } = req.body;

        const validStatuses = [
            "PENDING_APPROVAL",
            "CONFIRMED",
            "SERVICE_COMPLETED",
            "CANCELLED",
        ];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        // Final states are locked: once a booking is cancelled or completed
        // it can no longer be edited, so its history stays trustworthy.
        const existing = await Booking.findById(bookingId);
        if (!existing) {
            return res.status(404).json({ message: "Booking not found" });
        }
        if (
            ["CANCELLED", "SERVICE_COMPLETED"].includes(existing.status) &&
            status !== existing.status
        ) {
            return res.status(409).json({
                message: "This booking is final and locked against changes",
                code: "BOOKING_LOCKED",
            });
        }

        const booking = await Booking.findByIdAndUpdate(
            bookingId,
            { status },
            { returnDocument: "after" }
        ).populate("provider", PROVIDER_FIELDS);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Keep the customer (and technician on cancellation) informed.
        if (status === "SERVICE_COMPLETED" && booking.user) {
            await notify({
                recipient: booking.user,
                type: "booking",
                titleAr: "اكتملت الخدمة",
                titleEn: "Service completed",
                bodyAr: `تم إكمال الخدمة للحجز ${booking.bookingId}.`,
                bodyEn: `Your service for booking ${booking.bookingId} is complete.`,
                link: "/bookings",
            });
        }
        if (status === "CANCELLED") {
            if (booking.user) {
                await notify({
                    recipient: booking.user,
                    type: "booking",
                    titleAr: "تم إلغاء الحجز",
                    titleEn: "Booking cancelled",
                    bodyAr: `تم إلغاء الحجز ${booking.bookingId} من قبل الإدارة.`,
                    bodyEn: `Booking ${booking.bookingId} was cancelled by the admin.`,
                    link: "/bookings",
                });
            }
            if (booking.provider) {
                await notify({
                    recipient: booking.provider,
                    type: "booking",
                    titleAr: "تم إلغاء الحجز",
                    titleEn: "Booking cancelled",
                    bodyAr: `تم إلغاء الحجز ${booking.bookingId} من قبل الإدارة.`,
                    bodyEn: `Booking ${booking.bookingId} was cancelled by the admin.`,
                    link: "/provider",
                });
            }
        }

        res.json(booking);
    } catch (error) {
        console.error("Error updating booking status:", error);
        res.status(500).json({ message: "Error updating booking status" });
    }
});

// Get all technicians (optionally sorted by proximity to a booking)
router.get("/providers", async (req, res) => {
    try {
        const { bookingId } = req.query;
        let lat = null;
        let lng = null;
        let booking = null;

        if (bookingId) {
            booking = await Booking.findById(bookingId);
            if (booking) {
                // Prefer explicit coordinates stored on the booking
                if (booking.coords && booking.coords.lat != null && booking.coords.lng != null) {
                    lat = booking.coords.lat;
                    lng = booking.coords.lng;
                }
                const addressText = booking.customerDetails?.address;
                if ((lat === null || isNaN(lat)) && addressText) {
                    if (addressText.includes("Coordinates:")) {
                        const coordsPart = addressText.split("Coordinates:")[1];
                        if (coordsPart) {
                            const parts = coordsPart.split(",");
                            if (parts.length === 2) {
                                lat = parseFloat(parts[0].trim());
                                lng = parseFloat(parts[1].trim());
                            }
                        }
                    }
                    if (lat === null || isNaN(lat) || isNaN(lng)) {
                        const matchedCity = getCityCoordinates(addressText);
                        if (matchedCity) {
                            lat = matchedCity.lat;
                            lng = matchedCity.lng;
                        }
                    }
                }
            }
        }

        const requiredCategories = (booking?.items || [])
            .map((item) => item.category)
            .filter(Boolean);
        const query = {
            role: "provider",
            isVerified: true,
            isAvailable: true,
        };
        // A technician who placed the booking as a customer must never appear
        // in the admin picker for that same booking.
        if (booking?.user) query._id = { $ne: booking.user };

        const candidates = await User.find(query).select(PROVIDER_FIELDS);
        const providers = requiredCategories.length
            ? candidates.filter(
                  (provider) =>
                      Array.isArray(provider.specialties) &&
                      provider.specialties.some((specialty) =>
                          requiredCategories.includes(specialty)
                      )
              )
            : candidates;

        const mappedProviders = providers.map((p) => {
            const pObj = p.toObject();
            let distance = null;
            let distanceText = "";

            if (lat !== null && !isNaN(lat) && lng !== null && !isNaN(lng) && p.latitude && p.longitude) {
                distance = getDistance(lat, lng, p.latitude, p.longitude);
                distanceText = `${distance.toFixed(1)} km`;
            } else if (p.city) {
                distanceText = p.city;
            }

            return { ...pObj, distance, distanceText };
        });

        if (lat !== null && !isNaN(lat) && lng !== null && !isNaN(lng)) {
            mappedProviders.sort((a, b) => {
                if (a.distance === null) return 1;
                if (b.distance === null) return -1;
                return a.distance - b.distance;
            });
        } else {
            mappedProviders.sort((a, b) =>
                `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
            );
        }

        res.json(mappedProviders);
    } catch (error) {
        console.error("Error fetching providers:", error);
        res.status(500).json({ message: "Error fetching providers" });
    }
});

// Admin manually assigns a technician to a booking (override; counts as confirmed).
// Auto-assignment on booking creation still runs as the default; this endpoint is
// only used when an admin steps in to (re)assign manually.
// For multi-technician bookings, pass slotIndex to (re)assign a specific slot.
router.put("/:bookingId/assign", async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { providerId, slotIndex } = req.body;

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        if (["CANCELLED", "SERVICE_COMPLETED"].includes(booking.status)) {
            return res.status(409).json({
                message: "Cancelled or completed bookings cannot be reassigned",
                code: "BOOKING_LOCKED",
            });
        }

        const provider = await User.findById(providerId);
        if (!provider || provider.role !== "provider") {
            return res.status(400).json({ message: "Invalid technician" });
        }
        if (String(provider._id) === String(booking.user)) {
            return res.status(409).json({
                message: "A technician cannot be assigned to their own booking",
                code: "SELF_ASSIGNMENT_FORBIDDEN",
            });
        }
        if (!provider.isVerified || !provider.isAvailable) {
            return res.status(409).json({
                message: "The technician must be verified and available",
                code: "PROVIDER_NOT_ELIGIBLE",
            });
        }
        const requiredCategories = (booking.items || [])
            .map((item) => item.category)
            .filter(Boolean);
        const specialtyMatches =
            !requiredCategories.length ||
            (Array.isArray(provider.specialties) &&
                provider.specialties.some((specialty) =>
                    requiredCategories.includes(specialty)
                ));
        if (!specialtyMatches) {
            return res.status(409).json({
                message: "The technician does not cover the requested service",
                code: "SPECIALTY_MISMATCH",
            });
        }

        const hasSlots =
            Array.isArray(booking.assignments) && booking.assignments.length > 0;

        if (hasSlots && slotIndex != null) {
            // Multi-technician booking: assign one specific slot.
            const idx = Number(slotIndex);
            if (idx < 0 || idx >= booking.assignments.length) {
                return res.status(400).json({ message: "Invalid slot" });
            }
            const usedInAnotherSlot = booking.assignments.some(
                (assignment, assignmentIndex) =>
                    assignmentIndex !== idx &&
                    assignment.provider &&
                    String(assignment.provider) === String(providerId)
            );
            if (usedInAnotherSlot) {
                return res.status(409).json({
                    message: "The same technician cannot fill two team slots",
                    code: "DUPLICATE_TEAM_MEMBER",
                });
            }
            booking.assignments[idx].provider = providerId;
            booking.assignments[idx].providerResponse = "ACCEPTED";
            booking.assignments[idx].isCustomerApproved = true;
            booking.provider = booking.assignments[0].provider || providerId;
            const allReady = booking.assignments.every(
                (a) => a.provider && a.providerResponse === "ACCEPTED"
            );
            if (allReady) {
                booking.isProviderConfirmed = true;
                booking.status = "CONFIRMED";
            }
        } else {
            // Single-technician booking (or no explicit slot): assign the primary.
            booking.provider = providerId;
            booking.isProviderConfirmed = true;
            booking.status = "CONFIRMED";
            if (hasSlots) {
                booking.assignments[0].provider = providerId;
                booking.assignments[0].providerResponse = "ACCEPTED";
                booking.assignments[0].isCustomerApproved = true;
            }
        }

        await booking.save();
        await booking.populate("provider", PROVIDER_FIELDS);
        await booking.populate("assignments.provider", PROVIDER_FIELDS);

        // Notify the customer and the assigned technician.
        if (booking.user) {
            await notify({
                recipient: booking.user,
                type: "booking",
                titleAr: "تم تعيين فني",
                titleEn: "Technician assigned",
                bodyAr: `تم تعيين فني للحجز ${booking.bookingId}.`,
                bodyEn: `A technician has been assigned to booking ${booking.bookingId}.`,
                link: "/bookings",
            });
        }
        if (booking.provider) {
            await notify({
                recipient: booking.provider,
                type: "booking",
                titleAr: "حجز جديد",
                titleEn: "New job assigned",
                bodyAr: `تم تعيينك لتنفيذ الحجز ${booking.bookingId}.`,
                bodyEn: `You have been assigned to booking ${booking.bookingId}.`,
                link: "/provider",
            });
        }

        res.json(booking);
    } catch (error) {
        console.error("Error assigning technician:", error);
        res.status(500).json({ message: "Error assigning technician" });
    }
});

// Admin confirms the auto-proposed technician
router.put("/:bookingId/confirm-assign", async (req, res) => {
    try {
        const { bookingId } = req.params;
        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }
        if (["CANCELLED", "SERVICE_COMPLETED"].includes(booking.status)) {
            return res.status(409).json({
                message: "Cancelled or completed bookings cannot be re-confirmed",
                code: "BOOKING_LOCKED",
            });
        }
        if (!booking.provider) {
            return res.status(400).json({ message: "No technician assigned to confirm" });
        }

        booking.isProviderConfirmed = true;
        booking.status = "CONFIRMED";
        await booking.save();
        await booking.populate("provider", PROVIDER_FIELDS);

        // Notify the customer and the assigned technician of the confirmation.
        if (booking.user) {
            await notify({
                recipient: booking.user,
                type: "booking",
                titleAr: "تم تأكيد الحجز",
                titleEn: "Booking confirmed",
                bodyAr: `تم تأكيد الفني للحجز ${booking.bookingId}.`,
                bodyEn: `The technician for booking ${booking.bookingId} is confirmed.`,
                link: "/bookings",
            });
        }
        if (booking.provider) {
            await notify({
                recipient: booking.provider,
                type: "booking",
                titleAr: "حجز مؤكد",
                titleEn: "Job confirmed",
                bodyAr: `تم تأكيد تعيينك للحجز ${booking.bookingId}.`,
                bodyEn: `Your assignment for booking ${booking.bookingId} is confirmed.`,
                link: "/provider",
            });
        }

        res.json(booking);
    } catch (error) {
        console.error("Error confirming technician assignment:", error);
        res.status(500).json({ message: "Error confirming technician assignment" });
    }
});

export default router;
