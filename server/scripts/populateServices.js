// scripts/populateServices.js
import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
dns.setDefaultResultOrder("ipv4first");

import mongoose from "mongoose";
import dotenv from "dotenv";
import Service from "../models/Service.js";
import { servicesData } from "../data/servicesData.js";

dotenv.config();

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("Could not connect to MongoDB", err));

const populateServices = async () => {
    try {
        await Service.deleteMany({}); // Clear existing services
        const servicesWithOrder = servicesData.map((service, index) => ({
            ...service,
            order: index,
        }));
        const result = await Service.insertMany(servicesWithOrder);
        console.log(`${result.length} services inserted`);
    } catch (error) {
        console.error("Error populating services:", error);
    } finally {
        mongoose.disconnect();
    }
};

populateServices();
