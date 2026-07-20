import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    bookingId: {
        type: String,
        required: true,
        unique: true,
    },
    // Client-generated key used to guarantee that a single user action
    // creates exactly one booking, even if the request is sent twice
    // (e.g. React StrictMode double-invoke, double click, network retry).
    idempotencyKey: {
        type: String,
        index: { unique: true, sparse: true },
    },
    // PENDING_APPROVAL: technician auto-assigned, waiting for customer approval
    // CONFIRMED: customer approved the technician (visible to the provider)
    // IN_PROGRESS: provider started the service
    // SERVICE_COMPLETED: provider marked the service as done
    // CANCELLED: booking cancelled by customer/admin
    status: {
        type: String,
        enum: [
            "PENDING_APPROVAL",
            "CONFIRMED",
            "IN_PROGRESS",
            "SERVICE_COMPLETED",
            "CANCELLED",
        ],
        default: "PENDING_APPROVAL",
    },
    // How the assigned technician responded to a CONFIRMED booking.
    providerResponse: {
        type: String,
        enum: ["PENDING", "ACCEPTED", "REJECTED"],
        default: "PENDING",
    },
    // Two-step completion: the technician requests completion and the customer
    // must confirm it before the booking actually becomes SERVICE_COMPLETED.
    // This prevents a technician from faking a completed job.
    completionRequested: {
        type: Boolean,
        default: false,
    },
    completionRequestedAt: Date,
    items: [
        {
            serviceId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Service",
            },
            image: String,
            title: String,
            // Arabic service title, stored so bookings can render in either language.
            titleAr: String,
            // Top-level service category (e.g. "Plumber"), used to match the
            // booking to a technician whose specialties cover this category.
            category: String,
            quantity: { type: Number, default: 1 },
            // Number of technicians this job needs (from the service definition).
            requiredTechnicians: { type: Number, default: 1 },
            // Final price for the job. Defaults to the suggested price and may be
            // adjusted by the assigned technician within the platform range.
            price: Number,
            suggestedPrice: Number,
            priceRange: {
                min: Number,
                max: Number,
            },
        },
    ],
    customerDetails: {
        name: String,
        email: String,
        phone: String,
        address: String,
        // Structured location for finer technician matching.
        city: String,
        area: String,
    },
    scheduledAt: { type: Date, index: true },
    cancellation: { by: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, role: String, reason: { type: String, maxlength: 500 }, at: Date },
    // Optional precise coordinates captured from the location picker
    coords: {
        lat: Number,
        lng: Number,
    },
    // How many technicians this job needs (max across items). Used to decide
    // whether to assign a single technician or a team.
    requiredTechnicians: { type: Number, default: 1 },
    // For multi-technician jobs: one entry per required technician slot.
    // The single `provider` field below is kept in sync with the first slot
    // for backward compatibility with existing single-technician flows.
    assignments: [
        {
            provider: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            providerResponse: {
                type: String,
                enum: ["PENDING", "ACCEPTED", "REJECTED"],
                default: "PENDING",
            },
            isCustomerApproved: { type: Boolean, default: false },
        },
    ],
    // The currently proposed / assigned technician
    provider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    // Technicians the customer rejected (so reassignment picks someone else)
    rejectedProviders: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    // True once the customer approves the proposed technician
    isProviderConfirmed: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Indexes for the most common lookups (customer history, technician
// dashboards, and admin status filters).
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ provider: 1, status: 1 });
bookingSchema.index({ "assignments.provider": 1, status: 1 });
bookingSchema.index({ status: 1 });

bookingSchema.pre("save", function () {
    this.updatedAt = new Date();
});

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
