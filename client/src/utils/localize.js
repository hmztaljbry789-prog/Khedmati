import { PALESTINE_LOCATIONS } from "./locations";

// Returns a city or area name in the requested UI language. Bookings store the
// canonical English city name, but the picker is bilingual, so we map between
// English and Arabic whenever the stored value is recognised.
export const localizeCity = (name, isRtl) => {
    if (!name) return "";
    for (const city of PALESTINE_LOCATIONS) {
        if (city.nameEn === name || city.nameAr === name) {
            return isRtl ? city.nameAr : city.nameEn;
        }
        const areas = city.areas || [];
        for (const area of areas) {
            if (area.nameEn === name || area.nameAr === name) {
                return isRtl ? area.nameAr : area.nameEn;
            }
        }
    }
    return name;
};

// Localizes a stored address string. Handles the "Coordinates: lat, lng"
// fallback (which may have been stored in either language) so the label always
// follows the current UI language.
export const localizeAddress = (address, isRtl) => {
    if (!address) return address;
    const match = address.match(/^\s*(Coordinates|الإحداثيات)\s*:\s*(.+)$/);
    if (match) {
        // Wrap the numeric part in LTR isolates so "lat, lng" keeps its
        // natural order when rendered inside RTL text.
        const coords = isRtl ? "\u2066" + match[2] + "\u2069" : match[2];
        return (isRtl ? "الإحداثيات" : "Coordinates") + ": " + coords;
    }
    return address;
};
