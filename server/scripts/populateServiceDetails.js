import dns from "dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);
dns.setDefaultResultOrder("ipv4first");

import mongoose from "mongoose";
import dotenv from "dotenv";
import ServiceDetail from "../models/ServiceDetail.js";
import { servicesDetailsData } from "../data/servicesDetailsData.js";

dotenv.config();

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("Could not connect to MongoDB", err));

const processSubcategories = (subcategoriesMap) => {
    const processed = new Map();
    for (const [subCatName, subCatDetails] of Object.entries(subcategoriesMap)) {
        let processedSubCategory = {
            image: subCatDetails.image,
            nameAr: subCatDetails.nameAr,
        };

        if (subCatDetails.serviceTypes) {
            processedSubCategory.serviceTypes = new Map();
            for (const [sType, sTypeDetails] of Object.entries(subCatDetails.serviceTypes)) {
                processedSubCategory.serviceTypes.set(sType, {
                    image: sTypeDetails.image,
                    nameAr: sTypeDetails.nameAr,
                    categories: sTypeDetails.categories,
                });
            }
        }

        if (subCatDetails.categories) {
            processedSubCategory.categories = subCatDetails.categories;
        }

        processed.set(subCatName, processedSubCategory);
    }
    return processed;
};

const populateServiceDetails = async () => {
    try {
        await ServiceDetail.deleteMany({});

        // Transform servicesDetailsData to split "Electrician, Plumber & Carpenter"
        const finalData = {};

        for (const [serviceName, details] of Object.entries(servicesDetailsData)) {
            if (serviceName === "Women's Salon & Spa" || serviceName === "Men's Salon & Spa") {
                continue;
            }
            if (serviceName === "Electrician, Plumber & Carpenter") {
                const subSec = details.subcategories;

                // 1. Electrician
                if (subSec.Electrician) {
                    finalData["Electrician"] = {
                        serviceNameAr: subSec.Electrician.nameAr || "\u0643\u0647\u0631\u0628\u0627\u0626\u064a",
                        subcategories: {
                            "Electrical Services": {
                                image: subSec.Electrician.image,
                                nameAr: "\u062e\u062f\u0645\u0627\u062a \u0627\u0644\u0643\u0647\u0631\u0628\u0627\u0621",
                                categories: subSec.Electrician.categories
                            }
                        }
                    };
                }

                // 2. Plumber
                if (subSec.Plumber) {
                    finalData["Plumber"] = {
                        serviceNameAr: subSec.Plumber.nameAr || "\u0633\u0628\u0627\u0643",
                        subcategories: {
                            "Plumbing Services": {
                                image: subSec.Plumber.image,
                                nameAr: "\u062e\u062f\u0645\u0627\u062a \u0627\u0644\u0633\u0628\u0627\u0643\u0629",
                                categories: subSec.Plumber.categories
                            }
                        }
                    };
                }

                // 3. Carpenter
                if (subSec.Carpenter) {
                    finalData["Carpenter"] = {
                        serviceNameAr: subSec.Carpenter.nameAr || "\u0646\u062c\u0627\u0631",
                        subcategories: {
                            "Carpentry Services": {
                                image: subSec.Carpenter.image,
                                nameAr: "\u062e\u062f\u0645\u0627\u062a \u0627\u0644\u0646\u062c\u0627\u0631\u0629",
                                categories: subSec.Carpenter.categories
                            }
                        }
                    };
                }
            } else {
                finalData[serviceName] = details;
            }
        }

        for (const [serviceName, details] of Object.entries(finalData)) {
            const processedSubcategories = processSubcategories(details.subcategories);

            const serviceDetailData = {
                serviceName,
                serviceNameAr: details.serviceNameAr,
                subcategories: processedSubcategories,
                services: details.services,
            };

            // Remove undefined fields
            Object.keys(serviceDetailData).forEach(
                (key) =>
                    serviceDetailData[key] === undefined &&
                    delete serviceDetailData[key]
            );

            const serviceDetail = new ServiceDetail(serviceDetailData);
            await serviceDetail.save();
            console.log(`Inserted service detail for: ${serviceName}`);
        }

        console.log("All service details inserted successfully after split!");
    } catch (error) {
        console.error("Error populating service details:", error);
    } finally {
        mongoose.disconnect();
    }
};

populateServiceDetails();
