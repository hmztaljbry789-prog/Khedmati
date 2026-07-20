// Cloudinary end-to-end diagnostic.
// Run from the server folder:  node scripts/testCloudinary.js
//
// It verifies, in order:
//   1. Cloudinary credentials are present in .env
//   2. The cloudinary library is installed
//   3. An image can be uploaded (same options as profile photos)
//   4. The returned secure_url is PUBLICLY reachable (the step that
//      fails when the Cloudinary account restricts image delivery)
import https from "https";
import dotenv from "dotenv";

dotenv.config();

function fetchStatus(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            res.resume();
            resolve(res.statusCode);
        }).on("error", reject);
    });
}

async function main() {
    console.log("============================================");
    console.log(" CLOUDINARY DELIVERY DIAGNOSTIC");
    console.log("============================================");

    // 1. Credentials
    const missing = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"]
        .filter((k) => !process.env[k]);
    if (missing.length) {
        console.error("❌ Missing env vars:", missing.join(", "));
        process.exit(1);
    }
    console.log("✅ 1/4 Credentials found in .env (cloud:", process.env.CLOUDINARY_CLOUD_NAME + ")");

    // 2. Library installed
    let cloudinary;
    try {
        cloudinary = (await import("cloudinary")).v2;
    } catch {
        console.error("❌ cloudinary library is NOT installed. Run: npm install cloudinary");
        process.exit(1);
    }
    console.log("✅ 2/4 cloudinary library is installed");

    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
    });

    // 3. Upload a tiny test image (1x1 red pixel PNG), same options as profile photos.
    const pixel = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64"
    );
    const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "khedmati/profiles",
                public_id: `delivery-test-${Date.now()}`,
                resource_type: "image",
                type: "upload",
                overwrite: false,
            },
            (error, res) => (error ? reject(error) : resolve(res))
        );
        stream.end(pixel);
    });
    console.log("✅ 3/4 Upload succeeded:", result.secure_url);

    // 4. Public delivery check — THE step that matters for display in the browser.
    const status = await fetchStatus(result.secure_url);
    if (status === 200) {
        console.log("✅ 4/4 Public delivery works (HTTP 200). Images WILL display in the browser.");
        console.log("\n➡️  Cloudinary is fine. If photos still don't show, run: node scripts/checkPhoto.js");
        console.log("   to verify the URL is saved in the database, and check the browser Network tab.");
    } else {
        console.error(`❌ 4/4 Delivery BLOCKED (HTTP ${status}). This is the problem!`);
        console.error("   The image exists on Cloudinary but the browser cannot load it.");
        console.error("   Fix: Cloudinary Console → Settings → Security →");
        console.error("   - Disable 'Strict transformations'");
        console.error("   - Under 'Restricted media types', make sure images/original media are NOT restricted.");
    }

    // Cleanup the test asset.
    await cloudinary.uploader.destroy(result.public_id, { resource_type: "image", type: "upload" });
    console.log("(test image cleaned up)");
}

main().catch((err) => {
    console.error("❌ Diagnostic failed:", err.message);
    process.exit(1);
});
