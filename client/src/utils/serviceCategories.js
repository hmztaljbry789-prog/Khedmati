// Canonical technician specialties.
// These keys MUST mirror the top-level service names in
// server/data/servicesData.js so that booking-to-technician matching works.
export const serviceCategories = [
    { key: "Plumber", nameAr: "سباكة", nameEn: "Plumbing" },
    { key: "Electrician", nameAr: "كهرباء", nameEn: "Electrical" },
    { key: "Cleaning & Pest Control", nameAr: "تنظيف ومكافحة حشرات", nameEn: "Cleaning & Pest Control" },
    { key: "AC & Appliances Repair", nameAr: "تكييف وأجهزة", nameEn: "AC & Appliances Repair" },
    { key: "Painting & Waterproofing", nameAr: "دهان وعزل", nameEn: "Painting & Waterproofing" },
    { key: "Carpenter", nameAr: "نجارة", nameEn: "Carpentry" },
];

// Translate a specialty key to a human label.
export const specialtyLabel = (key, isRtl) => {
    const found = serviceCategories.find((c) => c.key === key);
    if (!found) return key;
    return isRtl ? found.nameAr : found.nameEn;
};

export default serviceCategories;
