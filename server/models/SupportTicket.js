import mongoose from "mongoose";

// A single message inside a support ticket thread. We embed messages directly
// on the ticket because a thread is always read/written as a whole.
const supportMessageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // Snapshot of who wrote the message so the UI can style it correctly
        // even if the user's role changes later.
        senderRole: {
            type: String,
            enum: ["user", "provider", "admin"],
            required: true,
        },
        text: { type: String, trim: true, default: "" },
        image: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now },
    },
    { _id: true }
);

const supportTicketSchema = new mongoose.Schema({
    // The customer or technician who opened the ticket.
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    subject: { type: String, required: true, trim: true },
    // High-level topic so the admin can triage quickly.
    category: {
        type: String,
        enum: ["general", "booking", "payment", "complaint", "technical"],
        default: "general",
    },
    // open: waiting for admin, in_progress: admin replied, closed: resolved.
    status: {
        type: String,
        enum: ["open", "in_progress", "closed"],
        default: "open",
        index: true,
    },
    // Optional link to a related booking (when the issue is about an order).
    bookingId: { type: String },
    messages: [supportMessageSchema],
    // Used to sort inboxes by most recent activity.
    lastMessageAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

supportTicketSchema.pre("save", function () {
    this.updatedAt = new Date();
});

export default mongoose.model("SupportTicket", supportTicketSchema);
