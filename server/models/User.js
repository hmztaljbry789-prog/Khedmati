import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema({
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    tokenVersion: { type: Number, default: 0 },
    role: { type: String, enum: ["user", "provider", "admin"], default: "user" },
    city: { type: String, trim: true },
    // Neighborhood / area within the city (used for finer matching).
    area: { type: String, trim: true },
    latitude: { type: Number },
    longitude: { type: Number },

    // ── Persisted shopping cart (per user) ──
    cart: [
        {
            service: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
            title: String,
            quantity: { type: Number, default: 1 },
            OurPrice: Number,
            MRP: Number,
            category: String,
            type: String,
            time: String,
            description: String,
            image: String,
        },
    ],

    // ── Technician (provider) profile fields ──
    isAvailable: { type: Boolean, default: true },
    // Safe default: a technician must be explicitly verified by an admin
    // before ever appearing in auto-assignment results.
    isVerified: { type: Boolean, default: false },
    specialties: [{ type: String }],
    serviceRadiusKm: { type: Number, default: 15 },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    profilePhoto: { type: String, default: "" },
    profilePhotoPublicId: { type: String, default: "" },
    completedJobs: { type: Number, default: 0 },
    // Uploaded ID document path (admin-only, used as a verification requirement).
    idDocument: { type: String, default: "" },
    idDocumentResourceType: { type: String, enum: ["image", "raw"], default: "image" },
    idDocumentFormat: { type: String, default: "" },
    verificationStatus: { type: String, enum: ["not_submitted", "pending", "verified", "rejected"], default: "not_submitted" },
    verificationRejectionReason: { type: String, default: "", maxlength: 1000 },

    // ── Password reset (forgot-password flow) ──
    // We store only a SHA-256 hash of the reset token (never the raw token)
    // together with an expiry timestamp after which the token stops working.
    resetPasswordToken: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },

    createdAt: { type: Date, default: Date.now },
});

// Hash password before saving
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

export default mongoose.model("User", UserSchema);
