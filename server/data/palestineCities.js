export const palestineCities = [
    { nameAr: "رام الله والبيرة", nameEn: "Ramallah & Al-Bireh", lat: 31.9029, lng: 35.2062 },
    { nameAr: "نابلس", nameEn: "Nablus", lat: 32.2211, lng: 35.2544 },
    { nameAr: "الخليل", nameEn: "Hebron", lat: 31.5298, lng: 35.0998 },
    { nameAr: "القدس", nameEn: "Jerusalem", lat: 31.7683, lng: 35.2137 },
    { nameAr: "بيت لحم", nameEn: "Bethlehem", lat: 31.7058, lng: 35.2007 },
    { nameAr: "جنين", nameEn: "Jenin", lat: 32.4610, lng: 35.2952 },
    { nameAr: "طولكرم", nameEn: "Tulkarm", lat: 32.3136, lng: 35.0275 },
    { nameAr: "قلقيلية", nameEn: "Qalqilya", lat: 32.1950, lng: 34.9814 },
    { nameAr: "أريحا", nameEn: "Jericho", lat: 31.8560, lng: 35.4443 },
    { nameAr: "سلفيت", nameEn: "Salfit", lat: 32.0850, lng: 35.1814 },
    { nameAr: "طوباس", nameEn: "Tubas", lat: 32.3228, lng: 35.3697 },
    { nameAr: "غزة", nameEn: "Gaza", lat: 31.5000, lng: 34.4667 },
    { nameAr: "خان يونس", nameEn: "Khan Yunis", lat: 31.3462, lng: 34.3025 },
    { nameAr: "رفح", nameEn: "Rafah", lat: 31.2842, lng: 34.2534 },
    { nameAr: "دير البلح", nameEn: "Deir al-Balah", lat: 31.4178, lng: 34.3503 },
    { nameAr: "جباليا", nameEn: "Jabalia", lat: 31.5292, lng: 34.4839 }
];

// Calculate distance in kilometers using the Haversine formula
export const getDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

// Match city coordinates from string
export const getCityCoordinates = (addressText) => {
    if (!addressText) return null;
    const lowerAddress = addressText.toLowerCase();
    for (const city of palestineCities) {
        if (
            lowerAddress.includes(city.nameEn.toLowerCase()) || 
            lowerAddress.includes(city.nameAr) ||
            (city.nameEn.includes("&") && lowerAddress.includes(city.nameEn.split("&")[0].trim().toLowerCase()))
        ) {
            return { lat: city.lat, lng: city.lng, city: city.nameEn };
        }
    }
    return null;
};
