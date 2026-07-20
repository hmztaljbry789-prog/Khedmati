import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Service from "../models/Service.js";
import ServiceDetail from "../models/ServiceDetail.js";
import { compressUploadedImage } from "../utils/compressImage.js";

const router = express.Router();

/* ==========================================================================
   Uploads (images are ALWAYS optional)
   Stored under public/assets/services/ and referenced as assets/services/<f>.
   ========================================================================== */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = "public/assets/services/";
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `service-${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname)}`);
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if ([".svg", ".png", ".jpg", ".jpeg", ".webp"].includes(ext)) cb(null, true);
        else cb(new Error("Only images are allowed"));
    },
    limits: { fileSize: 5 * 1024 * 1024 },
});

/* ---- helpers ------------------------------------------------------------- */

// Load the ServiceDetail document that belongs to a Service id.
// Auto-creates an empty details document when one does not exist yet, so any
// service can be managed immediately.
async function loadDetail(id) {
    const service = await Service.findById(id);
    if (!service) return { status: 404, message: "Service not found" };
    let detail = await ServiceDetail.findOne({ serviceName: service.serviceName });
    if (!detail) {
        detail = await ServiceDetail.create({
            serviceName: service.serviceName,
            serviceNameAr: service.serviceNameAr || "",
            subcategories: {},
            services: [],
        });
    }
    return { service, detail };
}

// Build the stored image path for an uploaded file (or null when none).
const filePath = (req) => (req.file ? `assets/services/${req.file.filename}` : null);

// Remove an image file from disk, ignoring errors.
function removeImage(relPath) {
    if (!relPath) return;
    try {
        const abs = path.join(process.cwd(), "public", relPath);
        if (fs.existsSync(abs)) fs.unlinkSync(abs);
    } catch (err) {
        console.warn("Could not remove image:", relPath, err.message);
    }
}

// Service items (the priced rows inside a category) arrive as a JSON string
// when sent through multipart FormData. Parse them defensively.
function parseServices(value) {
    if (value === undefined || value === null || value === "") return [];
    if (Array.isArray(value)) return value;
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

// Get the categories array for a subcategory, optionally inside a service type.
// Returns { categories, container, type } or an error object.
function resolveCategoryContainer(detail, subcategoryName, typeName) {
    if (!detail.subcategories.has(subcategoryName)) {
        return { status: 404, message: "Subcategory not found" };
    }
    const subcategory = detail.subcategories.get(subcategoryName);
    if (typeName) {
        if (!subcategory.serviceTypes || !subcategory.serviceTypes.has(typeName)) {
            return { status: 404, message: "Service type not found" };
        }
        const type = subcategory.serviceTypes.get(typeName);
        if (!Array.isArray(type.categories)) type.categories = [];
        return { subcategory, type, categories: type.categories };
    }
    if (!Array.isArray(subcategory.categories)) subcategory.categories = [];
    return { subcategory, categories: subcategory.categories };
}

// Persist nested Map/array mutations reliably.
async function persist(detail, subcategoryName, subcategory) {
    detail.subcategories.set(subcategoryName, subcategory);
    detail.markModified("subcategories");
    await detail.save();
}

/* ==========================================================================
   GET service details by Service id
   ========================================================================== */
router.get("/:id", async (req, res) => {
    try {
        const r = await loadDetail(req.params.id);
        if (r.status) return res.status(r.status).json({ message: r.message });
        res.json(r.detail);
    } catch (error) {
        console.error("Error fetching service details:", error);
        res.status(500).json({ message: "Error fetching service details", error: error.message });
    }
});

/* ==========================================================================
   SUBCATEGORIES
   ========================================================================== */
router.post("/:id/subcategories", upload.single("image"), compressUploadedImage, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ message: "Name is required" });
        const r = await loadDetail(req.params.id);
        if (r.status) return res.status(r.status).json({ message: r.message });
        const { detail } = r;
        if (detail.subcategories.has(name)) {
            return res.status(400).json({ message: "Subcategory already exists" });
        }
        const subcategory = {
            image: filePath(req) || "",
            nameAr: req.body.nameAr || "",
            serviceTypes: new Map(),
            categories: [],
        };
        detail.subcategories.set(name, subcategory);
        detail.markModified("subcategories");
        await detail.save();
        res.status(201).json({ name, ...subcategory });
    } catch (error) {
        console.error("Error creating subcategory:", error);
        res.status(500).json({ message: "Error creating subcategory", error: error.message });
    }
});

router.put("/:id/subcategories/:name", upload.single("image"), compressUploadedImage, async (req, res) => {
    try {
        const { name } = req.params;
        const { newName, nameAr } = req.body;
        const r = await loadDetail(req.params.id);
        if (r.status) return res.status(r.status).json({ message: r.message });
        const { detail } = r;
        if (!detail.subcategories.has(name)) {
            return res.status(404).json({ message: "Subcategory not found" });
        }
        const subcategory = detail.subcategories.get(name);
        if (nameAr !== undefined) subcategory.nameAr = nameAr;
        if (req.file) {
            removeImage(subcategory.image);
            subcategory.image = filePath(req);
        }
        if (newName && newName !== name) {
            detail.subcategories.delete(name);
            detail.subcategories.set(newName, subcategory);
        } else {
            detail.subcategories.set(name, subcategory);
        }
        detail.markModified("subcategories");
        await detail.save();
        res.json({ name: newName || name, ...subcategory });
    } catch (error) {
        console.error("Error updating subcategory:", error);
        res.status(500).json({ message: "Error updating subcategory", error: error.message });
    }
});

router.delete("/:id/subcategories/:name", async (req, res) => {
    try {
        const { name } = req.params;
        const r = await loadDetail(req.params.id);
        if (r.status) return res.status(r.status).json({ message: r.message });
        const { detail } = r;
        if (!detail.subcategories.has(name)) {
            return res.status(404).json({ message: "Subcategory not found" });
        }
        removeImage(detail.subcategories.get(name).image);
        detail.subcategories.delete(name);
        detail.markModified("subcategories");
        await detail.save();
        res.json({ message: "Subcategory deleted successfully" });
    } catch (error) {
        console.error("Error deleting subcategory:", error);
        res.status(500).json({ message: "Error deleting subcategory", error: error.message });
    }
});

/* ==========================================================================
   SERVICE TYPES (optional middle level)
   ========================================================================== */
router.post("/:id/subcategories/:subcategoryName/types", upload.single("image"), compressUploadedImage, async (req, res) => {
    try {
        const { subcategoryName } = req.params;
        const { name } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ message: "Name is required" });
        const r = await loadDetail(req.params.id);
        if (r.status) return res.status(r.status).json({ message: r.message });
        const { detail } = r;
        if (!detail.subcategories.has(subcategoryName)) {
            return res.status(404).json({ message: "Subcategory not found" });
        }
        const subcategory = detail.subcategories.get(subcategoryName);
        if (!subcategory.serviceTypes) subcategory.serviceTypes = new Map();
        if (subcategory.serviceTypes.has(name)) {
            return res.status(400).json({ message: "Service type already exists" });
        }
        const serviceType = { image: filePath(req) || "", nameAr: req.body.nameAr || "", categories: [] };
        subcategory.serviceTypes.set(name, serviceType);
        await persist(detail, subcategoryName, subcategory);
        res.status(201).json({ name, ...serviceType });
    } catch (error) {
        console.error("Error creating service type:", error);
        res.status(500).json({ message: "Error creating service type", error: error.message });
    }
});

router.put("/:id/subcategories/:subcategoryName/types/:typeName", upload.single("image"), compressUploadedImage, async (req, res) => {
    try {
        const { subcategoryName, typeName } = req.params;
        const { newName, nameAr } = req.body;
        const r = await loadDetail(req.params.id);
        if (r.status) return res.status(r.status).json({ message: r.message });
        const { detail } = r;
        if (!detail.subcategories.has(subcategoryName)) {
            return res.status(404).json({ message: "Subcategory not found" });
        }
        const subcategory = detail.subcategories.get(subcategoryName);
        if (!subcategory.serviceTypes || !subcategory.serviceTypes.has(typeName)) {
            return res.status(404).json({ message: "Service type not found" });
        }
        const serviceType = subcategory.serviceTypes.get(typeName);
        if (nameAr !== undefined) serviceType.nameAr = nameAr;
        if (req.file) {
            removeImage(serviceType.image);
            serviceType.image = filePath(req);
        }
        if (newName && newName !== typeName) {
            subcategory.serviceTypes.delete(typeName);
            subcategory.serviceTypes.set(newName, serviceType);
        } else {
            subcategory.serviceTypes.set(typeName, serviceType);
        }
        await persist(detail, subcategoryName, subcategory);
        res.json({ name: newName || typeName, ...serviceType });
    } catch (error) {
        console.error("Error updating service type:", error);
        res.status(500).json({ message: "Error updating service type", error: error.message });
    }
});

router.delete("/:id/subcategories/:subcategoryName/types/:typeName", async (req, res) => {
    try {
        const { subcategoryName, typeName } = req.params;
        const r = await loadDetail(req.params.id);
        if (r.status) return res.status(r.status).json({ message: r.message });
        const { detail } = r;
        if (!detail.subcategories.has(subcategoryName)) {
            return res.status(404).json({ message: "Subcategory not found" });
        }
        const subcategory = detail.subcategories.get(subcategoryName);
        if (!subcategory.serviceTypes || !subcategory.serviceTypes.has(typeName)) {
            return res.status(404).json({ message: "Service type not found" });
        }
        removeImage(subcategory.serviceTypes.get(typeName).image);
        subcategory.serviceTypes.delete(typeName);
        await persist(detail, subcategoryName, subcategory);
        res.json({ message: "Service type deleted successfully" });
    } catch (error) {
        console.error("Error deleting service type:", error);
        res.status(500).json({ message: "Error deleting service type", error: error.message });
    }
});

/* ==========================================================================
   CATEGORIES inside a SERVICE TYPE (typed categories)
   ========================================================================== */
router.post("/:id/subcategories/:subcategoryName/types/:typeName/categories", upload.single("image"), compressUploadedImage, async (req, res) => {
    try {
        const { subcategoryName, typeName } = req.params;
        const r = await loadDetail(req.params.id);
        if (r.status) return res.status(r.status).json({ message: r.message });
        const { detail } = r;
        const c = resolveCategoryContainer(detail, subcategoryName, typeName);
        if (c.status) return res.status(c.status).json({ message: c.message });
        c.categories.push({
            name: req.body.name || "",
            nameAr: req.body.nameAr || "",
            categoryImage: filePath(req) || "",
            services: parseServices(req.body.services),
        });
        await persist(detail, subcategoryName, c.subcategory);
        res.status(201).json(c.categories[c.categories.length - 1]);
    } catch (error) {
        console.error("Error creating category:", error);
        res.status(500).json({ message: "Error creating category", error: error.message });
    }
});

router.put("/:id/subcategories/:subcategoryName/types/:typeName/categories/:categoryId", upload.single("image"), compressUploadedImage, async (req, res) => {
    try {
        const { subcategoryName, typeName, categoryId } = req.params;
        const r = await loadDetail(req.params.id);
        if (r.status) return res.status(r.status).json({ message: r.message });
        const { detail } = r;
        const c = resolveCategoryContainer(detail, subcategoryName, typeName);
        if (c.status) return res.status(c.status).json({ message: c.message });
        const category = c.type.categories.id(categoryId);
        if (!category) return res.status(404).json({ message: "Category not found" });
        if (req.body.name !== undefined) category.name = req.body.name;
        if (req.body.nameAr !== undefined) category.nameAr = req.body.nameAr;
        if (req.body.services !== undefined) category.services = parseServices(req.body.services);
        if (req.file) {
            removeImage(category.categoryImage);
            category.categoryImage = filePath(req);
        }
        await persist(detail, subcategoryName, c.subcategory);
        res.json(category);
    } catch (error) {
        console.error("Error updating category:", error);
        res.status(500).json({ message: "Error updating category", error: error.message });
    }
});

router.delete("/:id/subcategories/:subcategoryName/types/:typeName/categories/:categoryId", async (req, res) => {
    try {
        const { subcategoryName, typeName, categoryId } = req.params;
        const r = await loadDetail(req.params.id);
        if (r.status) return res.status(r.status).json({ message: r.message });
        const { detail } = r;
        const c = resolveCategoryContainer(detail, subcategoryName, typeName);
        if (c.status) return res.status(c.status).json({ message: c.message });
        const category = c.type.categories.id(categoryId);
        if (!category) return res.status(404).json({ message: "Category not found" });
        removeImage(category.categoryImage);
        c.type.categories.pull(categoryId);
        await persist(detail, subcategoryName, c.subcategory);
        res.json({ message: "Category deleted successfully" });
    } catch (error) {
        console.error("Error deleting category:", error);
        res.status(500).json({ message: "Error deleting category", error: error.message });
    }
});

/* ==========================================================================
   DIRECT CATEGORIES inside a SUBCATEGORY (no service type)
   ========================================================================== */
router.post("/:id/subcategories/:subcategoryName/categories", upload.single("image"), compressUploadedImage, async (req, res) => {
    try {
        const { subcategoryName } = req.params;
        const r = await loadDetail(req.params.id);
        if (r.status) return res.status(r.status).json({ message: r.message });
        const { detail } = r;
        const c = resolveCategoryContainer(detail, subcategoryName, null);
        if (c.status) return res.status(c.status).json({ message: c.message });
        c.categories.push({
            name: req.body.name || "",
            nameAr: req.body.nameAr || "",
            categoryImage: filePath(req) || "",
            services: parseServices(req.body.services),
        });
        await persist(detail, subcategoryName, c.subcategory);
        res.status(201).json(c.categories[c.categories.length - 1]);
    } catch (error) {
        console.error("Error creating direct category:", error);
        res.status(500).json({ message: "Error creating category", error: error.message });
    }
});

router.put("/:id/subcategories/:subcategoryName/categories/:categoryId", upload.single("image"), compressUploadedImage, async (req, res) => {
    try {
        const { subcategoryName, categoryId } = req.params;
        const r = await loadDetail(req.params.id);
        if (r.status) return res.status(r.status).json({ message: r.message });
        const { detail } = r;
        const c = resolveCategoryContainer(detail, subcategoryName, null);
        if (c.status) return res.status(c.status).json({ message: c.message });
        const category = c.subcategory.categories.id(categoryId);
        if (!category) return res.status(404).json({ message: "Category not found" });
        if (req.body.name !== undefined) category.name = req.body.name;
        if (req.body.nameAr !== undefined) category.nameAr = req.body.nameAr;
        if (req.body.services !== undefined) category.services = parseServices(req.body.services);
        if (req.file) {
            removeImage(category.categoryImage);
            category.categoryImage = filePath(req);
        }
        await persist(detail, subcategoryName, c.subcategory);
        res.json(category);
    } catch (error) {
        console.error("Error updating direct category:", error);
        res.status(500).json({ message: "Error updating category", error: error.message });
    }
});

router.delete("/:id/subcategories/:subcategoryName/categories/:categoryId", async (req, res) => {
    try {
        const { subcategoryName, categoryId } = req.params;
        const r = await loadDetail(req.params.id);
        if (r.status) return res.status(r.status).json({ message: r.message });
        const { detail } = r;
        const c = resolveCategoryContainer(detail, subcategoryName, null);
        if (c.status) return res.status(c.status).json({ message: c.message });
        const category = c.subcategory.categories.id(categoryId);
        if (!category) return res.status(404).json({ message: "Category not found" });
        removeImage(category.categoryImage);
        c.subcategory.categories.pull(categoryId);
        await persist(detail, subcategoryName, c.subcategory);
        res.json({ message: "Category deleted successfully" });
    } catch (error) {
        console.error("Error deleting direct category:", error);
        res.status(500).json({ message: "Error deleting category", error: error.message });
    }
});

export default router;
