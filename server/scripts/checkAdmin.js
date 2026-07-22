import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

mongoose
    .connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log("Connected to MongoDB");
        const admins = await User.find({ role: "admin" }).select("first_name last_name email phone role");
        console.log("Admin accounts in DB:", admins);
        
        const allUsers = await User.find({}).limit(10).select("first_name last_name email phone role");
        console.log("Sample users (up to 10):", allUsers);
        
        mongoose.disconnect();
    })
    .catch((err) => {
        console.error("Could not connect to MongoDB", err);
    });
