import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

mongoose
    .connect(process.env.MONGODB_URI)
    .then(async () => {
        console.log("Connected to MongoDB");
        
        const email = process.env.ADMIN_EMAIL || "admin@khedmati.ps";
        const password = process.env.ADMIN_PASSWORD;
        if (!password || password.length < 8) {
            console.error(
                "Set ADMIN_PASSWORD (min 8 characters) in .env before seeding an admin."
            );
            process.exit(1);
        }
        let adminUser = await User.findOne({ email });
        
        if (adminUser) {
            console.log("Admin user already exists. Updating role to admin...");
            adminUser.role = "admin";
            await adminUser.save();
        } else {
            console.log("Creating new admin user...");
            
            adminUser = new User({
                first_name: "المدير",
                last_name: "العام",
                phone: "0599999999",
                email: email,
                password: password,
                role: "admin"
            });
            await adminUser.save();
            console.log("Admin user created successfully!");
        }
        
        console.log("Admin Details:");
        console.log("Email:", email);
        console.log("Password: (value of ADMIN_PASSWORD)");
        console.log("Role: admin");
        
        mongoose.disconnect();
    })
    .catch((err) => {
        console.error("Could not connect to MongoDB", err);
    });
