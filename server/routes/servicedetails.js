import express from "express";
import Service from "../models/Service.js";
import ServiceDetail from "../models/ServiceDetail.js";

const router = express.Router();

router.get("/servicedetails", async (req, res) => {
    try {
        const serviceDetails = await ServiceDetail.find();
        res.json(serviceDetails);
    } catch (error) {
        res.status(500).json({ message: "Error fetching services" });
    }
});
