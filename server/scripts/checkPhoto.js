// Diagnostic script: prints each user's stored profilePhoto value.
// Run from the server folder:  node scripts/checkPhoto.js
// Same DNS fix as server.js — required on Windows for mongodb+srv URIs.
import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
dns.setDefaultResultOrder("ipv4first");
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";

dotenv.config();

async function main() {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/Khedmati");
    const users = await User.find({}).select("first_name last_name email role profilePhoto profilePhotoPublicId");
    console.log("====================================================");
    console.log(" PROFILE PHOTO DIAGNOSTIC");
    console.log("====================================================");
    for (const u of users) {
        const photo = u.profilePhoto || "(EMPTY)";
        const ok = photo.startsWith("https://") ? "OK  ✅ will display" : "BAD ❌ will NOT display";
        console.log(`\n- ${u.first_name} ${u.last_name} <${u.email}> [${u.role}]`);
        console.log(`  profilePhoto        : ${photo}`);
        console.log(`  profilePhotoPublicId: ${u.profilePhotoPublicId || "(EMPTY)"}`);
        console.log(`  status              : ${ok}`);
    }
    console.log("\n====================================================");
    console.log("If profilePhoto is EMPTY while the image exists on Cloudinary,");
    console.log("the database write failed. If it shows a https URL, the backend");
    console.log("is fine and the problem is in the FRONTEND build/deploy.");
    console.log("====================================================");
    await mongoose.disconnect();
}

main().catch((err) => {
    console.error("Diagnostic failed:", err.message);
    process.exit(1);
});
