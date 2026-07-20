import { useState, useContext, useEffect, useCallback } from "react";
import GooglePlacesAutocomplete from "react-google-places-autocomplete";
import { Loader, Locate, MapPin, Check } from "lucide-react";
import PortalContext from "../context/PortalContext";
import { translations } from "../utils/translations";
import { PALESTINE_LOCATIONS } from "../utils/locations";

// Local styles for the City + Area picker (named consts to avoid inline literals).
const lsx = {
    pickerWrap: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 },
    pickerLabel: { fontSize: 13, fontWeight: 600, color: "var(--text-dim)" },
    select: { width: "100%", padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 14, outline: "none" },
    confirmBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "10px 12px", borderRadius: 12, border: "none", background: "var(--blue)", color: "#fff", fontWeight: 600, cursor: "pointer", marginTop: 4 },
};

export const Location = () => {
    const { address, updateAddress, closeAddress, locale } = useContext(PortalContext);
    const t = translations[locale];
    const isRtl = locale === "ar";

    const [currentLocation, setCurrentLocation] = useState(null);
    const [manualAddress, setManualAddress] = useState(address || "");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Manual method #2: structured City + Area selection.
    const [selCity, setSelCity] = useState("");
    const [selArea, setSelArea] = useState("");
    const selectedCity = PALESTINE_LOCATIONS.find((c) => c.nameEn === selCity);
    const areaOptions = selectedCity?.areas || [];

    const triggerSuccess = useCallback(() => {
        setSaveSuccess(true);
        setTimeout(() => {
            setSaveSuccess(false);
            closeAddress();
        }, 850);
    }, [closeAddress]);

    const saveCityArea = () => {
        if (!selectedCity) return;
        const areaObj = areaOptions.find((a) => a.nameEn === selArea);
        const cityName = isRtl ? selectedCity.nameAr : selectedCity.nameEn;
        const areaName = areaObj ? (isRtl ? areaObj.nameAr : areaObj.nameEn) : "";
        const label = areaName ? areaName + "، " + cityName : cityName;
        // Always store the canonical English names so technician matching is
        // language-independent.
        updateAddress(
            label,
            { lat: selectedCity.lat, lng: selectedCity.lng },
            { city: selectedCity.nameEn, area: areaObj ? areaObj.nameEn : "" }
        );
        setManualAddress(label);
        triggerSuccess();
    };

    const hasApiKey = !!import.meta.env.VITE_PLACES_NEW_API_KEY;

    useEffect(() => {
        if (currentLocation?.label) {
            updateAddress(currentLocation.label);
            setManualAddress(currentLocation.label);
            triggerSuccess();
        }
    }, [currentLocation, updateAddress, triggerSuccess]);

    const handleManualSave = (e) => {
        e.preventDefault();
        if (manualAddress.trim()) {
            updateAddress(manualAddress.trim());
            triggerSuccess();
        }
    };

    const getCurrentLocation = () => {
        setIsLoading(true);
        setError(null);

        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;

                    if (!window.google || !window.google.maps) {
                        const coordsLabel = isRtl ? "الإحداثيات" : "Coordinates";
                        const coordinatesAddress = `${coordsLabel}: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
                        updateAddress(coordinatesAddress, { lat: latitude, lng: longitude });
                        setManualAddress(coordinatesAddress);
                        setIsLoading(false);
                        triggerSuccess();
                        return;
                    }

                    const geocoder = new window.google.maps.Geocoder();
                    geocoder.geocode(
                        { location: { lat: latitude, lng: longitude } },
                        (results, status) => {
                            setIsLoading(false);
                            if (status === "OK" && results[0]) {
                                const addr = results[0].formatted_address;
                                updateAddress(addr, { lat: latitude, lng: longitude });
                                setManualAddress(addr);
                                triggerSuccess();
                            } else {
                                setError(isRtl ? "فشل تحديد تفاصيل الموقع" : "Unable to get location details");
                            }
                        }
                    );
                },
                (err) => {
                    setIsLoading(false);
                    switch (err.code) {
                        case err.PERMISSION_DENIED:
                            setError(isRtl ? "تم رفض الوصول للموقع من قبل المستخدم" : "Location access denied by user");
                            break;
                        case err.POSITION_UNAVAILABLE:
                            setError(isRtl ? "معلومات الموقع الجغرافي غير متوفرة" : "Location information is unavailable");
                            break;
                        case err.TIMEOUT:
                            setError(isRtl ? "انتهت مهلة طلب تحديد الموقع" : "Location request timed out");
                            break;
                        default:
                            setError(isRtl ? "حدث خطأ غير معروف" : "An unknown error occurred");
                    }
                }
            );
        } else {
            setError(isRtl ? "المتصفح لا يدعم تحديد الموقع الجغرافي" : "Geolocation is not supported by this browser");
            setIsLoading(false);
        }
    };

    return (
        <div style={{ width: "min(92vw, 420px)", padding: 28, direction: isRtl ? "rtl" : "ltr" }} className="relative">
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, flexDirection: "row", textAlign: isRtl ? "right" : "left" }}>
                <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: "linear-gradient(135deg, var(--blue), var(--cyan))",
                    display: "flex", alignItems: "center", justifyItems: "center",
                    justifyContent: "center", alignContent: "center",
                    boxShadow: "var(--shadow-blue)",
                }}>
                    <MapPin size={15} color="#fff" style={{ margin: "auto" }} />
                </div>
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.15rem", color: "var(--text)" }}>
                        {t.enterLocationTitle}
                    </h2>
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.enterLocationDesc}</p>
                </div>
            </div>

            {error && (
                <div style={{
                    fontSize: 12, padding: "8px 12px", borderRadius: 10,
                    background: "var(--red-dim)", color: "var(--red)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    marginBottom: 16,
                    textAlign: isRtl ? "right" : "left"
                }}>{error}</div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {/* Geolocation Button */}
                <button
                    onClick={getCurrentLocation}
                    disabled={isLoading}
                    className="btn-glow"
                    style={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        padding: "12px", borderRadius: 12, fontSize: 13, fontWeight: 700,
                        background: "linear-gradient(135deg, var(--blue), var(--cyan))",
                        color: "#fff", border: "none", cursor: isLoading ? "not-allowed" : "pointer",
                        opacity: isLoading ? 0.6 : 1,
                        fontFamily: "var(--font-display)",
                        flexDirection: "row"
                    }}
                >
                    {isLoading ? (
                        <Loader size={15} className="animate-spin" />
                    ) : (
                        <Locate size={15} />
                    )}
                    <span>{isRtl ? "استخدم موقعي الحالي" : "Use my current location"}</span>
                </button>

                {/* Google Places AutoComplete (If API Key Configured) */}
                {hasApiKey && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, textAlign: isRtl ? "right" : "left" }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)" }}>{isRtl ? "البحث عن عنوان" : "Search for address"}</label>
                        <div style={{ position: "relative" }}>
                            <GooglePlacesAutocomplete
                                apiKey={import.meta.env.VITE_PLACES_NEW_API_KEY}
                                apiOptions={{ language: locale }}
                                selectProps={{
                                    value: currentLocation,
                                    onChange: setCurrentLocation,
                                    placeholder: isRtl ? "اكتب للبحث عن موقعك..." : "Type to search address...",
                                    className: "w-full",
                                    styles: {
                                        control: (provided) => ({
                                            ...provided,
                                            backgroundColor: "rgba(255, 255, 255, 0.04)",
                                            border: "1px solid var(--border)",
                                            borderRadius: "12px",
                                            boxShadow: "none",
                                            color: "var(--text)",
                                            padding: "2px",
                                            "&:hover": {
                                                borderColor: "var(--blue)",
                                            }
                                        }),
                                        singleValue: (provided) => ({
                                            ...provided,
                                            color: "var(--text)",
                                        }),
                                        placeholder: (provided) => ({
                                            ...provided,
                                            color: "var(--text-muted)",
                                            fontSize: "13px",
                                        }),
                                        input: (provided) => ({
                                            ...provided,
                                            color: "var(--text)",
                                        }),
                                        menu: (provided) => ({
                                            ...provided,
                                            backgroundColor: "var(--bg-2)",
                                            border: "1px solid var(--border-light)",
                                            borderRadius: "12px",
                                            overflow: "hidden",
                                        }),
                                        option: (provided, state) => ({
                                            ...provided,
                                            backgroundColor: state.isFocused ? "var(--blue-dim)" : "transparent",
                                            color: state.isFocused ? "var(--blue-bright)" : "var(--text-dim)",
                                            cursor: "pointer",
                                            fontSize: "13px",
                                            "&:active": {
                                                backgroundColor: "var(--blue)",
                                            }
                                        }),
                                    }
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Divider */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexDirection: "row" }}>
                    <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                        {isRtl ? "أو أدخل العنوان يدوياً" : "Or enter address manually"}
                    </span>
                    <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                </div>

                {/* City + Area structured picker (manual method #2) */}
                <div style={lsx.pickerWrap}>
                    <label style={lsx.pickerLabel}>{isRtl ? "اختر المدينة" : "Select city"}</label>
                    <select style={lsx.select} value={selCity} onChange={(e) => { setSelCity(e.target.value); setSelArea(""); }}>
                        <option value="">{isRtl ? "— اختر المدينة —" : "— Select city —"}</option>
                        {PALESTINE_LOCATIONS.map((c) => (
                            <option key={c.nameEn} value={c.nameEn}>{isRtl ? c.nameAr : c.nameEn}</option>
                        ))}
                    </select>
                    {selCity && areaOptions.length > 0 && (
                        <div style={lsx.pickerWrap}>
                            <label style={lsx.pickerLabel}>{isRtl ? "اختر المنطقة" : "Select area"}</label>
                            <select style={lsx.select} value={selArea} onChange={(e) => setSelArea(e.target.value)}>
                                <option value="">{isRtl ? "— اختر المنطقة (اختياري) —" : "— Select area (optional) —"}</option>
                                {areaOptions.map((a) => (
                                    <option key={a.nameEn} value={a.nameEn}>{isRtl ? a.nameAr : a.nameEn}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <button type="button" disabled={!selCity} style={lsx.confirmBtn} onClick={saveCityArea}>
                        <Check size={15} /> {isRtl ? "تأكيد المدينة والمنطقة" : "Confirm city & area"}
                    </button>
                </div>

                {/* Manual Address Form */}
                <form onSubmit={handleManualSave} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, textAlign: isRtl ? "right" : "left" }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)" }}>{isRtl ? "العنوان بالتفصيل" : "Detailed Address"}</label>
                        <textarea
                            value={manualAddress}
                            onChange={(e) => setManualAddress(e.target.value)}
                            placeholder={t.manualAddressPlaceholder}
                            required
                            rows={3}
                            style={{
                                width: "100%", padding: "10px 12px",
                                borderRadius: 12, fontSize: 13, outline: "none",
                                background: "rgba(255,255,255,0.04)",
                                border: "1px solid var(--border)",
                                color: "var(--text)", fontFamily: "var(--font-body)",
                                transition: "border-color 0.2s",
                                resize: "none",
                                textAlign: isRtl ? "right" : "left"
                            }}
                            onFocus={e => e.target.style.borderColor = "var(--blue)"}
                            onBlur={e => e.target.style.borderColor = "var(--border)"}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!manualAddress.trim() || saveSuccess}
                        className={manualAddress.trim() ? "btn-glow" : ""}
                        style={{
                            padding: "12px", borderRadius: 12, fontSize: 13, fontWeight: 700,
                            background: saveSuccess 
                                ? "linear-gradient(135deg, var(--green), var(--green))"
                                : manualAddress.trim()
                                    ? "linear-gradient(135deg, var(--blue), var(--cyan))"
                                    : "rgba(255, 255, 255, 0.03)",
                            color: manualAddress.trim() ? "#fff" : "var(--text-muted)",
                            border: "none", cursor: (!manualAddress.trim() || saveSuccess) ? "not-allowed" : "pointer",
                            transition: "all 0.3s ease",
                            fontFamily: "var(--font-display)",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        }}
                    >
                        {saveSuccess ? (
                            <>
                                <Check size={14} /> <span>{t.saveAddressSuccess}</span>
                            </>
                        ) : (
                            t.saveAddressBtn
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Location;
