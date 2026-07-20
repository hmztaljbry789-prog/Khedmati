import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Service from "../models/Service.js";
import ServiceDetail from "../models/ServiceDetail.js";
import { compressUploadedImage } from "../utils/compressImage.js";

const router = express.Router();

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Ensure the folder exists (fresh deploys start with an empty disk).
        const dir = "public/assets/services/";
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `service-${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (
            ext === ".svg" ||
            ext === ".png" ||
            ext === ".jpg" ||
            ext === ".jpeg" ||
            ext === ".webp"
        ) {
            cb(null, true);
        } else {
            cb(new Error("Only images are allowed"));
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB file size limit
    },
});

// Get all services
router.get("/", async (req, res) => {
    try {
        const services = await Service.find();
        res.json(services);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching services",
            error: error.message,
        });
    }
});

// Create a new service
router.post("/", upload.single("serviceImage"), compressUploadedImage, async (req, res) => {
    try {
        const { serviceName, serviceNameAr } = req.body;
        const serviceImage = req.file
            ? `assets/services/${req.file.filename}`
            : "";

        const newService = new Service({
            serviceName,
            serviceNameAr: serviceNameAr || "",
            serviceImage,
            order: (await Service.countDocuments()) + 1,
        });

        const savedService = await newService.save();
        res.status(201).json(savedService);
    } catch (error) {
        res.status(400).json({
            message: "Error creating service",
            error: error.message,
        });
    }
});

// Update a service
router.put("/:id", upload.single("serviceImage"), compressUploadedImage, async (req, res) => {
    try {
        const { id } = req.params;
        const { serviceName, serviceNameAr } = req.body;

        const updateData = { serviceName };
        if (serviceNameAr !== undefined) {
            updateData.serviceNameAr = serviceNameAr;
        }

        // If a new image is uploaded, update the image
        if (req.file) {
            updateData.serviceImage = `assets/services/${req.file.filename}`;
        }

        const updatedService = await Service.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
        });

        if (!updatedService) {
            return res.status(404).json({ message: "Service not found" });
        }

        res.json(updatedService);
    } catch (error) {
        res.status(400).json({
            message: "Error updating service",
            error: error.message,
        });
    }
});

// Delete a service
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const service = await Service.findById(id);

        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        // Delete the image file if it exists
        if (service.serviceImage) {
            const imagePath = path.join(
                process.cwd(),
                "public",
                service.serviceImage
            );
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        // Delete the service from database
        const deletedService = await Service.findByIdAndDelete(id);

        res.json({ message: "Service deleted successfully", deletedService });
    } catch (error) {
        res.status(500).json({
            message: "Error deleting service",
            error: error.message,
        });
    }
});

// Get service details
router.get("/:id/details", async (req, res) => {
    try {
        const service = await Service.findById(req.params.id).populate(
            "details"
        );
        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }
        res.json(service.details);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching service details",
            error: error.message,
        });
    }
});

// Create service detail
router.post("/:id/details", upload.single("image"), compressUploadedImage, async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        const { title, price, description } = req.body;
        const image = req.file ? `assets/services/${req.file.filename}` : "";

        const detail = {
            title,
            price: parseFloat(price),
            description,
            image,
        };

        service.details.push(detail);
        await service.save();

        res.status(201).json(detail);
    } catch (error) {
        res.status(400).json({
            message: "Error creating service detail",
            error: error.message,
        });
    }
});

// Update service detail
router.put(
    "/:id/details/:detailId",
    upload.single("image"),
    async (req, res) => {
        try {
            const service = await Service.findById(req.params.id);
            if (!service) {
                return res.status(404).json({ message: "Service not found" });
            }

            const detail = service.details.id(req.params.detailId);
            if (!detail) {
                return res.status(404).json({ message: "Detail not found" });
            }

            const { title, price, description } = req.body;
            detail.title = title;
            detail.price = parseFloat(price);
            detail.description = description;

            if (req.file) {
                detail.image = `assets/services/${req.file.filename}`;
            }

            await service.save();
            res.json(detail);
        } catch (error) {
            res.status(400).json({
                message: "Error updating service detail",
                error: error.message,
            });
        }
    }
);

// Delete service detail
router.delete("/:id/details/:detailId", async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ message: "Service not found" });
        }

        const detail = service.details.id(req.params.detailId);
        if (!detail) {
            return res.status(404).json({ message: "Detail not found" });
        }

        if (detail.image) {
            const imagePath = path.join(process.cwd(), "public", detail.image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        service.details.pull(req.params.detailId);
        await service.save();

        res.json({ message: "Service detail deleted successfully" });
    } catch (error) {
        res.status(500).json({
            message: "Error deleting service detail",
            error: error.message,
        });
    }
});

export default router;
