import express from "express";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import { getDistance, getCityCoordinates } from "../data/palestineCities.js";
import notify from "../utils/notify.js";
import { isBookingCustomer, isAssignedProvider, isBookingParticipant, denyBookingAccess } from "../middleware/bookingAccess.js";

const router = express.Router();

// Resolve the best coordinates for a booking, in priority order:
// 1. Explicit coords captured from the location picker
// 2. "Coordinates: lat, lng" embedded in the address text
// 3. City coordinates matched from the address text
function resolveCoords({ coords, addressText }) {
    if (coords && typeof coords.lat === "number" && typeof coords.lng === "number") {
        return { lat: coords.lat, lng: coords.lng };
    }

    if (addressText && addressText.includes("Coordinates:")) {
        const coordsPart = addressText.split("Coordinates:")[1];
        if (coordsPart) {
            const parts = coordsPart.split(",");
            if (parts.length === 2) {
                const lat = parseFloat(parts[0].trim());
                const lng = parseFloat(parts[1].trim());
                if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
            }
        }
    }

    if (addressText) {
        const matchedCity = getCityCoordinates(addressText);
        if (matchedCity) return { lat: matchedCity.lat, lng: matchedCity.lng };
    }

    return { lat: null, lng: null };
}

// Normalize a string for case-insensitive comparison.
const norm = (v) => (v || "").toString().trim().toLowerCase();

// Rank and return up to `count` distinct technicians best suited for a job.
// Priority: matching area > within service radius > matching city > distance.
async function findClosestProviders({
    coords,
    addressText,
    count = 1,
    excludeIds = [],
    requiredCategories = [],
    requiredArea = "",
    requiredCity = "",
}) {
    try {
        const { lat, lng } = resolveCoords({ coords, addressText });
        const exclude = (excludeIds || []).filter(Boolean).map((id) => id.toString());
        const cats = (requiredCategories || []).filter(Boolean);
        const wantArea = norm(requiredArea);
        const wantCity = norm(requiredCity);
        const addr = norm(addressText);

        let providers = await User.find({ role: "provider" });
        // Never assign a booking to the person who requested it.
        providers = providers.filter((p) => !exclude.includes(p._id.toString()));

        // Prefer technicians who are currently marked available.
        providers = providers.filter((p) => p.isAvailable === true && p.isVerified === true);

        if (!providers.length) return [];

        // Prefer technicians whose specialties cover the requested service
        // categories. Only narrow the pool when at least one match exists.
        let pool = providers;
        if (cats.length) {
            const specialized = providers.filter(
                (p) =>
                    Array.isArray(p.specialties) &&
                    p.specialties.some((s) => cats.includes(s))
            );
            if (specialized.length) pool = specialized;
        }

        // Score every candidate so we can rank them consistently.
        const scored = pool.map((p) => {
            const hasGeo =
                p.latitude != null && p.longitude != null && lat !== null && lng !== null;
            const distance = hasGeo
                ? getDistance(lat, lng, p.latitude, p.longitude)
                : Infinity;
            const radius = p.serviceRadiusKm || Infinity;
            const areaMatch = !!wantArea && norm(p.area) === wantArea;
            const cityMatch =
                (!!wantCity && norm(p.city) === wantCity) ||
                (!!p.city && !!addr && addr.includes(norm(p.city)));
            return {
                provider: p,
                distance,
                withinRadius: hasGeo ? distance <= radius : false,
                areaMatch,
                cityMatch,
            };
        });

        scored.sort((a, b) => {
            if (a.areaMatch !== b.areaMatch) return a.areaMatch ? -1 : 1;
            if (a.withinRadius !== b.withinRadius) return a.withinRadius ? -1 : 1;
            if (a.cityMatch !== b.cityMatch) return a.cityMatch ? -1 : 1;
            return a.distance - b.distance;
        });

        return scored.slice(0, Math.max(1, count)).map((s) => s.provider);
    } catch (error) {
        console.error("Error finding closest providers:", error);
        return [];
    }
}

// Backward-compatible single-technician finder.
async function findClosestProvider(args) {
    const list = await findClosestProviders({ ...args, count: 1 });
    return list[0] || null;
}


// ── Auto-assign pending bookings when a technician becomes available ──
// Matching normally runs only once, at booking creation. When no technician
// was available at that moment the booking stays PENDING_APPROVAL with no
// provider. This helper re-runs the same matching for those bookings and is
// triggered whenever a technician becomes newly eligible (turns available or
// gets verified by an admin). The customer-approval flow is preserved: the
// proposed technician still needs the customer's approval, exactly like the
// auto-assignment at booking creation.
export async function autoAssignPendingBookings() {
    try {
        const pending = await Booking.find({
            status: "PENDING_APPROVAL",
            $or: [{ provider: null }, { provider: { $exists: false } }],
        }).sort({ createdAt: 1 });

        let assignedCount = 0;
        for (const booking of pending) {
            const requiredCategories = (booking.items || [])
                .map((it) => it.category)
                .filter(Boolean);
            const requiredTechnicians = Math.max(
                1,
                Number(booking.requiredTechnicians) || 1
            );

            // Never propose the customer themself or a technician this
            // customer already rejected.
            const excludeIds = [
                booking.user,
                ...(booking.rejectedProviders || []),
            ].filter(Boolean);

            const hasCoords =
                booking.coords &&
                typeof booking.coords.lat === "number" &&
                typeof booking.coords.lng === "number";

            const matched = await findClosestProviders({
                coords: hasCoords ? booking.coords : null,
                addressText: booking.customerDetails?.address,
                requiredCategories,
                requiredCity: booking.customerDetails?.city || "",
                requiredArea: booking.customerDetails?.area || "",
                excludeIds,
                count: requiredTechnicians,
            });
            if (!matched.length) continue;

            booking.provider = matched[0]._id;
            booking.isProviderConfirmed = false;
            booking.providerResponse = "PENDING";
            if (requiredTechnicians > 1) {
                booking.assignments = matched.map((p) => ({
                    provider: p._id,
                    providerResponse: "PENDING",
                    isCustomerApproved: false,
                }));
            }
            await booking.save();
            assignedCount++;

            // Tell the customer a technician is now proposed and awaiting
            // their approval — same flow as assignment at creation.
            await notify({
                recipient: booking.user,
                type: "booking",
                titleAr: "تم اقتراح فني لطلبك",
                titleEn: "A technician was proposed for your booking",
                bodyAr: `أصبح فني متاحًا وتم اقتراحه للحجز ${booking.bookingId}. يرجى الموافقة عليه من صفحة حجوزاتك.`,
                bodyEn: `A technician became available and was proposed for booking ${booking.bookingId}. Please approve them from your bookings page.`,
                link: "/bookings",
            });
        }
        if (assignedCount > 0) {
            console.log(
                `[autoAssign] Proposed technicians for ${assignedCount} pending booking(s).`
            );
        }
    } catch (error) {
        console.error("Error auto-assigning pending bookings:", error);
    }
}

const PROVIDER_FIELDS = "first_name last_name phone email city latitude longitude specialties rating reviewCount completedJobs serviceRadiusKm isAvailable isVerified profilePhoto";

// Create a new booking for a single service.
// Auto-assigns the closest technician and waits for the customer's approval.
router.post("/create", async (req, res) => {
    try {
        const { item, items, customerDetails, coords, idempotencyKey } = req.body;
        // Trust the authenticated user over any client-supplied id.
        const userId = req.user?._id?.toString() || req.body.userId;

        const finalItems = Array.isArray(items) && items.length
            ? items
            : item
            ? [item]
            : [];

        if (!userId || finalItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Missing required booking details",
            });
        }

        // ── Idempotency guard #1: explicit client key ──
        // Guarantees one booking per user action even with duplicate requests
        // (React StrictMode double render, double click, retries).
        if (idempotencyKey) {
            const existing = await Booking.findOne({ idempotencyKey, user: userId }).populate(
                "provider",
                PROVIDER_FIELDS
            );
            if (existing) {
                return res.json({
                    success: true,
                    message: "Booking already created (idempotent)",
                    booking: existing,
                    duplicate: true,
                });
            }
        }

        // ── Idempotency guard #2: time-window dedup ──
        // Even without a key, reject a near-identical booking from the same
        // user created within the last 15 seconds.
        const fifteenSecondsAgo = new Date(Date.now() - 15 * 1000);
        const recentDuplicate = await Booking.findOne({
            user: userId,
            createdAt: { $gte: fifteenSecondsAgo },
            "items.0.title": finalItems[0]?.title,
        })
            .sort({ createdAt: -1 })
            .populate("provider", PROVIDER_FIELDS);
        if (recentDuplicate && recentDuplicate.items.length === finalItems.length) {
            return res.json({
                success: true,
                message: "Duplicate booking suppressed",
                booking: recentDuplicate,
                duplicate: true,
            });
        }

        const bookingId = `BOOK-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 7)
            .toUpperCase()}`;

        const hasCoords = coords && typeof coords.lat === "number";

        // Service categories requested in this booking, used to match a
        // technician whose specialties cover the work.
        const requiredCategories = finalItems
            .map((it) => it.category)
            .filter(Boolean);

        // How many technicians does this job need? Take the largest count
        // requested across the items (e.g. a big job may need a small team).
        const requiredTechnicians = Math.max(
            1,
            ...finalItems.map((it) => Number(it.requiredTechnicians) || 1)
        );

        // Structured location captured from the picker, for finer matching.
        const requiredCity = customerDetails?.city || "";
        const requiredArea = customerDetails?.area || "";

        // Pick as many distinct technicians as the job needs.
        const matchedProviders = await findClosestProviders({
            coords: hasCoords ? coords : null,
            addressText: customerDetails?.address,
            requiredCategories,
            requiredCity,
            requiredArea,
            // A provider ordering as a customer must not be assigned to their own job.
            excludeIds: userId ? [userId] : [],
            count: requiredTechnicians,
        });
        const provider = matchedProviders[0] || null;

        // For multi-technician jobs, propose one technician per required slot.
        const assignments =
            requiredTechnicians > 1
                ? matchedProviders.map((p) => ({
                      provider: p._id,
                      providerResponse: "PENDING",
                      isCustomerApproved: false,
                  }))
                : [];

        const newBooking = new Booking({
            user: userId,
            bookingId,
            idempotencyKey: idempotencyKey || undefined,
            items: finalItems,
            customerDetails,
            coords: hasCoords ? { lat: coords.lat, lng: coords.lng } : undefined,
            requiredTechnicians,
            assignments,
            provider: provider?._id,
            isProviderConfirmed: false,
            status: "PENDING_APPROVAL",
        });

        await newBooking.save();
        await newBooking.populate("provider", PROVIDER_FIELDS);
        await newBooking.populate("assignments.provider", PROVIDER_FIELDS);

        res.json({
            success: true,
            message: "Booking created successfully",
            booking: newBooking,
        });
    } catch (error) {
        // A duplicate key error means a concurrent request already created this
        // booking with the same idempotencyKey — return it gracefully.
        if (error && error.code === 11000) {
            const existing = await Booking.findOne({
                idempotencyKey: req.body.idempotencyKey,
            }).populate("provider", PROVIDER_FIELDS);
            if (existing) {
                return res.json({
                    success: true,
                    message: "Booking already created (idempotent)",
                    booking: existing,
                    duplicate: true,
                });
            }
        }
        console.error("Error creating booking:", error);
        res.status(500).json({
            success: false,
            message: "Error creating booking",
            error: error.message,
        });
    }
});

// Customer approves the currently proposed technician -> CONFIRMED
router.put("/:id/approve", async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }
        if (!isBookingCustomer(booking, req.user)) return denyBookingAccess(res);
        if (!booking.provider) {
            return res.status(400).json({ success: false, message: "No technician to approve" });
        }

        // For multi-technician jobs the customer approves the whole proposed team.
        if (booking.assignments && booking.assignments.length) {
            booking.assignments.forEach((a) => {
                a.isCustomerApproved = true;
            });
        }
        booking.isProviderConfirmed = true;
        booking.status = "CONFIRMED";
        await booking.save();
        await booking.populate("provider", PROVIDER_FIELDS);
        await booking.populate("assignments.provider", PROVIDER_FIELDS);

        // Tell the technician the customer approved their assignment.
        if (booking.provider) {
            await notify({
                recipient: booking.provider,
                type: "booking",
                titleAr: "تم تأكيد حجز",
                titleEn: "Booking confirmed",
                bodyAr: `وافق العميل على تعيينك للحجز ${booking.bookingId}.`,
                bodyEn: `A customer approved your assignment for booking ${booking.bookingId}.`,
                link: "/provider",
            });
        }

        res.json({ success: true, booking });
    } catch (error) {
        console.error("Error approving booking:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Customer requests a different technician -> reassign to the next closest
router.put("/:id/reassign", async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }
        if (!isBookingCustomer(booking, req.user)) return denyBookingAccess(res);

        const requiredCategories = (booking.items || [])
            .map((it) => it.category)
            .filter(Boolean);
        const matchBase = {
            coords: booking.coords && booking.coords.lat != null ? booking.coords : null,
            addressText: booking.customerDetails?.address,
            requiredCategories,
            requiredCity: booking.customerDetails?.city || "",
            requiredArea: booking.customerDetails?.area || "",
        };

        // Multi-technician job: the customer asks to swap one proposed slot.
        if (booking.assignments && booking.assignments.length && req.body.slotIndex != null) {
            const idx = Number(req.body.slotIndex);
            const slot = booking.assignments[idx];
            if (!slot) {
                return res.status(400).json({ success: false, message: "Invalid technician slot" });
            }
            if (slot.provider) {
                const already = booking.rejectedProviders.some(
                    (id) => id.toString() === slot.provider.toString()
                );
                if (!already) booking.rejectedProviders.push(slot.provider);
            }
            const proposed = booking.assignments
                .map((a, i) => (i === idx ? null : a.provider))
                .filter(Boolean);
            const next = await findClosestProvider({
                ...matchBase,
                excludeIds: [
                    ...(booking.rejectedProviders || []),
                    ...proposed,
                    booking.user,
                ],
            });
            slot.provider = next?._id;
            slot.providerResponse = "PENDING";
            slot.isCustomerApproved = false;
            booking.provider = booking.assignments[0]?.provider;
            await booking.save();
            await booking.populate("assignments.provider", PROVIDER_FIELDS);
            await booking.populate("provider", PROVIDER_FIELDS);
            return res.json({
                success: true,
                booking,
                message: next ? "REASSIGNED" : "NO_MORE_PROVIDERS",
            });
        }

        if (booking.provider) {
            const alreadyRejected = booking.rejectedProviders.some(
                (id) => id.toString() === booking.provider.toString()
            );
            if (!alreadyRejected) booking.rejectedProviders.push(booking.provider);
        }

        const next = await findClosestProvider({
            ...matchBase,
            excludeIds: [...(booking.rejectedProviders || []), booking.user],
        });

        if (!next) {
            booking.provider = undefined;
            booking.isProviderConfirmed = false;
            booking.status = "PENDING_APPROVAL";
            await booking.save();
            return res.json({
                success: true,
                booking,
                message: "NO_MORE_PROVIDERS",
            });
        }

        booking.provider = next._id;
        booking.isProviderConfirmed = false;
        booking.status = "PENDING_APPROVAL";
        await booking.save();
        await booking.populate("provider", PROVIDER_FIELDS);

        res.json({ success: true, booking });
    } catch (error) {
        console.error("Error reassigning technician:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get all bookings for a user
router.get("/user/:userId", async (req, res) => {
    try {
        if (req.user.role !== "admin" && String(req.user._id) !== String(req.params.userId)) return denyBookingAccess(res);
        const bookings = await Booking.find({ user: req.params.userId })
            .populate("provider", PROVIDER_FIELDS)
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        console.error("Error fetching bookings:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching bookings",
            error: error.message,
        });
    }
});

// Get bookings assigned to a provider.
// Once the customer confirms the technician, the job is visible to the provider
// (whether it is awaiting the provider's response, in progress, or completed).
router.get("/provider/:providerId", async (req, res) => {
    try {
        if (req.user.role !== "admin" && (req.user.role !== "provider" || String(req.user._id) !== String(req.params.providerId))) return denyBookingAccess(res);
        const bookings = await Booking.find({
            $or: [
                { provider: req.params.providerId },
                { "assignments.provider": req.params.providerId },
            ],
            status: { $in: ["CONFIRMED", "IN_PROGRESS", "SERVICE_COMPLETED"] },
        })
            .populate("provider", PROVIDER_FIELDS)
            .populate("assignments.provider", PROVIDER_FIELDS)
            .populate("user", "first_name last_name email phone city")
            .sort({ createdAt: -1 });
        res.json(bookings);
    } catch (error) {
        console.error("Error fetching provider bookings:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching provider bookings",
            error: error.message,
        });
    }
});

// Lightweight stats for the technician dashboard
router.get("/provider/:providerId/stats", async (req, res) => {
    try {
        if (req.user.role !== "admin" && (req.user.role !== "provider" || String(req.user._id) !== String(req.params.providerId))) return denyBookingAccess(res);
        const providerId = req.params.providerId;
        const [incoming, inProgress, completed, total] = await Promise.all([
            Booking.countDocuments({ provider: providerId, status: "CONFIRMED", providerResponse: "PENDING" }),
            Booking.countDocuments({ provider: providerId, status: "IN_PROGRESS" }),
            Booking.countDocuments({ provider: providerId, status: "SERVICE_COMPLETED" }),
            Booking.countDocuments({ provider: providerId, status: { $in: ["CONFIRMED", "IN_PROGRESS", "SERVICE_COMPLETED"] } }),
        ]);
        res.json({ incoming, inProgress, completed, total });
    } catch (error) {
        console.error("Error fetching provider stats:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Technician accepts an assigned job
router.put("/:id/provider-accept", async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
        if (!isAssignedProvider(booking, req.user)) return denyBookingAccess(res);
        const pid = req.user._id;
        if (booking.assignments && booking.assignments.length && pid) {
            const slot = booking.assignments.find(
                (a) => a.provider && a.provider.toString() === pid.toString()
            );
            if (slot) slot.providerResponse = "ACCEPTED";
            // The job counts as accepted once every technician has accepted.
            const allAccepted = booking.assignments.every(
                (a) => a.providerResponse === "ACCEPTED"
            );
            if (allAccepted) booking.providerResponse = "ACCEPTED";
        } else {
            booking.providerResponse = "ACCEPTED";
        }
        await booking.save();
        await booking.populate("provider", PROVIDER_FIELDS);
        await booking.populate("assignments.provider", PROVIDER_FIELDS);
        await booking.populate("user", "first_name last_name email phone city");
        res.json({ success: true, booking });
    } catch (error) {
        console.error("Error accepting booking:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Technician rejects an assigned job -> hand it back and reassign to next closest
router.put("/:id/provider-reject", async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
        if (!isAssignedProvider(booking, req.user)) return denyBookingAccess(res);

        const requiredCategories = (booking.items || [])
            .map((it) => it.category)
            .filter(Boolean);
        const matchBase = {
            coords: booking.coords && booking.coords.lat != null ? booking.coords : null,
            addressText: booking.customerDetails?.address,
            requiredCategories,
            requiredCity: booking.customerDetails?.city || "",
            requiredArea: booking.customerDetails?.area || "",
        };

        // Multi-technician job: only the rejecting technician's slot is replaced.
        const pid = req.user._id;
        if (booking.assignments && booking.assignments.length && pid) {
            const slot = booking.assignments.find(
                (a) => a.provider && a.provider.toString() === pid.toString()
            );
            if (slot) {
                if (slot.provider) {
                    const already = booking.rejectedProviders.some(
                        (id) => id.toString() === slot.provider.toString()
                    );
                    if (!already) booking.rejectedProviders.push(slot.provider);
                }
                const proposed = booking.assignments
                    .filter((a) => a !== slot)
                    .map((a) => a.provider)
                    .filter(Boolean);
                const replacement = await findClosestProvider({
                    ...matchBase,
                    excludeIds: [
                        ...(booking.rejectedProviders || []),
                        ...proposed,
                        booking.user,
                    ],
                });
                slot.provider = replacement?._id;
                slot.providerResponse = "PENDING";
                slot.isCustomerApproved = false;
                booking.provider = booking.assignments[0]?.provider;
                booking.isProviderConfirmed = false;
                booking.status = "PENDING_APPROVAL";
                await booking.save();
                await booking.populate("assignments.provider", PROVIDER_FIELDS);
                await booking.populate("provider", PROVIDER_FIELDS);
                return res.json({
                    success: true,
                    booking,
                    message: replacement ? "REASSIGNED" : "NO_MORE_PROVIDERS",
                });
            }
        }

        if (booking.provider) {
            const alreadyRejected = booking.rejectedProviders.some(
                (id) => id.toString() === booking.provider.toString()
            );
            if (!alreadyRejected) booking.rejectedProviders.push(booking.provider);
        }

        const next = await findClosestProvider({
            ...matchBase,
            excludeIds: [...(booking.rejectedProviders || []), booking.user],
        });

        booking.provider = next?._id;
        booking.isProviderConfirmed = false;
        booking.providerResponse = "PENDING";
        booking.status = "PENDING_APPROVAL";
        await booking.save();
        if (next) await booking.populate("provider", PROVIDER_FIELDS);

        res.json({
            success: true,
            booking,
            message: next ? "REASSIGNED" : "NO_MORE_PROVIDERS",
        });
    } catch (error) {
        console.error("Error rejecting booking:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Technician starts the service -> IN_PROGRESS
router.put("/:id/provider-start", async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status: "IN_PROGRESS", providerResponse: "ACCEPTED" },
            { returnDocument: "after" }
        ).populate("provider", PROVIDER_FIELDS);
        if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
        if (!isAssignedProvider(booking, req.user)) return denyBookingAccess(res);

        // Tell the customer the technician started the service.
        if (booking.user) {
            await notify({
                recipient: booking.user,
                type: "booking",
                titleAr: "بدأ تنفيذ الخدمة",
                titleEn: "Service started",
                bodyAr: `بدأ الفني تنفيذ الخدمة للحجز ${booking.bookingId}.`,
                bodyEn: `The technician has started your service for booking ${booking.bookingId}.`,
                link: "/bookings",
            });
        }

        res.json({ success: true, booking });
    } catch (error) {
        console.error("Error starting booking:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Provider asks the customer to confirm the service is complete.
// The booking stays IN_PROGRESS until the customer confirms, which
// prevents a technician from faking a completed job.
router.put("/:bookingId/request-completion", async (req, res) => {
    try {
        const booking = await Booking.findOne({ bookingId: req.params.bookingId });
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }
        if (!isAssignedProvider(booking, req.user)) return denyBookingAccess(res);
        if (booking.status !== "IN_PROGRESS") {
            return res.status(400).json({
                success: false,
                message: "Only an in-progress booking can be completed",
            });
        }
        booking.completionRequested = true;
        booking.completionRequestedAt = new Date();
        await booking.save();

        // Ask the customer to confirm the completion.
        if (booking.user) {
            await notify({
                recipient: booking.user,
                type: "booking",
                titleAr: "الفني أنهى العمل — بانتظار تأكيدك",
                titleEn: "Technician finished — please confirm",
                bodyAr: `أشار الفني إلى إكمال الخدمة للحجز ${booking.bookingId}. يرجى تأكيد الاكتمال من صفحة حجوزاتك.`,
                bodyEn: `The technician marked booking ${booking.bookingId} as done. Please confirm completion from your bookings page.`,
                link: "/bookings",
            });
        }

        res.json({ success: true, booking });
    } catch (error) {
        console.error("Error requesting completion:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Customer confirms the service is really complete.
router.put("/:bookingId/confirm-completion", async (req, res) => {
    try {
        const booking = await Booking.findOne({ bookingId: req.params.bookingId });
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }
        if (!isBookingCustomer(booking, req.user)) return denyBookingAccess(res);
        if (booking.status !== "IN_PROGRESS" || !booking.completionRequested) {
            return res.status(400).json({
                success: false,
                message: "No completion request to confirm",
            });
        }
        booking.status = "SERVICE_COMPLETED";
        booking.completionRequested = false;
        await booking.save();

        // The job is now officially done: bump the technician's counter
        // and let them know the customer confirmed.
        if (booking.provider) {
            await User.findByIdAndUpdate(booking.provider, { $inc: { completedJobs: 1 } });
            await notify({
                recipient: booking.provider,
                type: "booking",
                titleAr: "أكد الزبون اكتمال الخدمة",
                titleEn: "Customer confirmed completion",
                bodyAr: `أكد الزبون اكتمال الخدمة للحجز ${booking.bookingId}.`,
                bodyEn: `The customer confirmed completion for booking ${booking.bookingId}.`,
                link: "/provider",
            });
        }

        res.json({ success: true, booking });
    } catch (error) {
        console.error("Error confirming completion:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Cancel a booking. Either the customer or an assigned technician can cancel
// (the customer changed their mind, or the technician has an emergency). The
// other party is notified so nobody is left waiting.
router.put("/:id/cancel", async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate("provider", PROVIDER_FIELDS)
            .populate("assignments.provider", PROVIDER_FIELDS);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }
        if (!isBookingParticipant(booking, req.user)) return denyBookingAccess(res);
        if (booking.status === "SERVICE_COMPLETED") {
            return res
                .status(400)
                .json({ success: false, message: "Cannot cancel a completed booking" });
        }

        booking.status = "CANCELLED";
        booking.cancellation = { by: req.user._id, role: req.user.role, reason: String(req.body.reason || "").trim().slice(0, 500), at: new Date() };
        await booking.save();

        // Work out who cancelled so we notify the other side appropriately.
        const actorId = String(req.user?._id || "");
        const customerId = booking.user ? String(booking.user) : "";
        const cancelledByCustomer = actorId && actorId === customerId;
        const reasonAr = cancelledByCustomer
            ? "ألغى العميل الحجز."
            : "ألغى الفني الحجز.";
        const reasonEn = cancelledByCustomer
            ? "The customer cancelled the booking."
            : "The technician cancelled the booking.";

        // Gather everyone tied to the booking (single or multi-technician).
        const recipients = new Set();
        if (customerId) recipients.add(customerId);
        if (booking.provider) {
            recipients.add(String(booking.provider._id || booking.provider));
        }
        (booking.assignments || []).forEach((a) => {
            if (a.provider) recipients.add(String(a.provider._id || a.provider));
        });
        recipients.delete(actorId);

        recipients.forEach((rid) => {
            notify({
                recipient: rid,
                type: "booking",
                titleAr: "تم إلغاء الحجز",
                titleEn: "Booking cancelled",
                bodyAr: `${reasonAr} رقم الحجز ${booking.bookingId}.`,
                bodyEn: `${reasonEn} Booking ${booking.bookingId}.`,
                link: rid === customerId ? "/bookings" : "/provider",
            });
        });

        res.json({ success: true, booking });
    } catch (error) {
        console.error("Error cancelling booking:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Update booking status (e.g. provider marks completed)
router.patch("/:bookingId/status", async (req, res) => {
    try {
        if (req.user.role !== "admin") return denyBookingAccess(res);
        const { status } = req.body;
        const validStatuses = [
            "PENDING_APPROVAL",
            "CONFIRMED",
            "IN_PROGRESS",
            "SERVICE_COMPLETED",
            "CANCELLED",
        ];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }
        const existing = await Booking.findOne({ bookingId: req.params.bookingId });
        if (!existing) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }
        // Two-step completion: a booking may only become SERVICE_COMPLETED after
        // the technician requested completion and the customer confirmed it.
        if (status === "SERVICE_COMPLETED" && !existing.completionRequested) {
            return res.status(409).json({
                success: false,
                message:
                    "Completion must be requested by the technician and confirmed by the customer",
                code: "COMPLETION_NOT_CONFIRMED",
            });
        }
        const booking = await Booking.findOneAndUpdate(
            { bookingId: req.params.bookingId },
            { status },
            { returnDocument: "after" }
        );
        // When a job is completed, bump the technician's completed-jobs counter.
        if (status === "SERVICE_COMPLETED" && booking.provider) {
            await User.findByIdAndUpdate(booking.provider, { $inc: { completedJobs: 1 } });
        }
        // Tell the customer when their service is completed.
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
        res.json({ success: true, booking });
    } catch (error) {
        console.error("Error updating booking status:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Technician sets the final price for a job, clamped to the platform range.
router.put("/:id/provider-price", async (req, res) => {
    try {
        const { price, itemIndex } = req.body;
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }
        if (!isAssignedProvider(booking, req.user)) return denyBookingAccess(res);
        const idx = Number.isInteger(itemIndex) ? itemIndex : 0;
        const item = booking.items[idx];
        if (!item) {
            return res.status(400).json({ success: false, message: "Invalid item" });
        }
        let value = Number(price);
        if (!Number.isFinite(value)) {
            return res.status(400).json({ success: false, message: "Invalid price" });
        }
        const range = item.priceRange || {};
        if (range.min != null) value = Math.max(range.min, value);
        if (range.max != null) value = Math.min(range.max, value);
        item.price = value;
        await booking.save();
        await booking.populate("provider", PROVIDER_FIELDS);
        await booking.populate("user", "first_name last_name email phone city");
        res.json({ success: true, booking });
    } catch (error) {
        console.error("Error setting booking price:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

export default router;
