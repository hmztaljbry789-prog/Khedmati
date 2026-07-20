import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema({
    title: String,
    titleAr: String,
    descriptionAr: [String],
    image: String,
    time: String,
    // How many technicians this service typically requires (admin-defined).
    requiredTechnicians: { type: Number, default: 1 },
    // Suggested platform price shown to the customer.
    OurPrice: String,
    MRP: String,
    // Hybrid pricing: the platform-defined range the assigned technician may
    // pick the final price within.
    minPrice: Number,
    maxPrice: Number,
    description: [String],
});

const categorySchema = new mongoose.Schema({
    name: String,
    nameAr: String,
    categoryImage: String,
    services: [serviceSchema],
});

const serviceTypeSchema = new mongoose.Schema({
    image: String,
    nameAr: String,
    categories: [categorySchema],
});

const subcategorySchema = new mongoose.Schema({
    image: String,
    nameAr: String,
    // Make both serviceTypes and categories optional
    serviceTypes: {
        type: Map,
        of: {
            image: String,
            nameAr: String,
            categories: [categorySchema],
        },
        required: false,
    },
    // Direct categories for subcategories without serviceTypes
    categories: {
        type: [categorySchema],
        required: false,
    },
});

const ServiceDetailSchema = new mongoose.Schema({
    serviceName: String,
    serviceNameAr: String,
    subcategories: {
        type: Map,
        of: subcategorySchema,
        required: false,
    },
    services: {
        type: [serviceSchema],
        required: false,
    },
});

const ServiceDetail = mongoose.model("ServiceDetail", ServiceDetailSchema);

export default ServiceDetail;
