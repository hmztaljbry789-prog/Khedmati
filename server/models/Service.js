import mongoose from "mongoose";

const serviceDetailSchema = new mongoose.Schema({
    title: String,
    titleAr: String,
    price: Number,
    description: String,
    descriptionAr: [String],
    image: String,
    time: String,
    MRP: String,
    category: String,
    type: String
});

const ServiceSchema = new mongoose.Schema({
    serviceName: {
        type: String,
        required: true,
        trim: true,
    },
    serviceNameAr: {
        type: String,
        default: "",
    },
    // Optional: services can be created without an image (a placeholder is
    // shown in the UI) and the image can be added later via edit.
    serviceImage: {
        type: String,
        default: "",
    },
    order: {
        type: Number,
        required: true,
    },
    // details: [serviceDetailSchema],
    subcategories: {
        type: Map,
        of: {
            image: String,
            nameAr: String,
            serviceTypes: {
                type: Map,
                of: {
                    image: String,
                    nameAr: String,
                    categories: [{
                        name: String,
                        nameAr: String,
                        categoryImage: String,
                        services: [serviceDetailSchema]
                    }]
                }
            },
            categories: [{
                name: String,
                nameAr: String,
                categoryImage: String,
                services: [serviceDetailSchema]
            }]
        }
    }
});

export default mongoose.model("Service", ServiceSchema);
