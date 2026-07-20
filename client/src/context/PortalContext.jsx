import { createContext, useCallback, useState, useEffect } from "react";

const PortalContext = createContext();

export default PortalContext;

export function PortalProvider({ children }) {
    const [showAddress, setShowAddress] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [address, setAddress] = useState(() => localStorage.getItem("address") || "");

    // Structured location meta (city + area) for finer technician matching.
    const [locationMeta, setLocationMeta] = useState(() => {
        try {
            const saved = localStorage.getItem("locationMeta");
            return saved ? JSON.parse(saved) : { city: "", area: "" };
        } catch {
            return { city: "", area: "" };
        }
    });

    // Precise coordinates of the chosen address (when available)
    const [coords, setCoords] = useState(() => {
        try {
            const saved = localStorage.getItem("coords");
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    // Theme (Light/Dark) State. The product is light-first, so default to light
    // when the user has no saved preference (keeps the admin panel from
    // appearing dark while the public site is light).
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem("theme") || "light";
        return savedTheme;
    });

    // Language (AR/EN) State
    const [locale, setLocale] = useState(() => {
        const savedLocale = localStorage.getItem("locale") || "ar";
        return savedLocale;
    });

    // Handle HTML tag side effects on theme change
    useEffect(() => {
        document.documentElement.classList.toggle("light", theme === "light");
        localStorage.setItem("theme", theme);
    }, [theme]);

    // Handle HTML tag side effects on language change
    useEffect(() => {
        document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
        document.documentElement.lang = locale;
        localStorage.setItem("locale", locale);
    }, [locale]);

    const openAddress = () => setShowAddress(true);
    const closeAddress = useCallback(() => setShowAddress(false), []);

    const openLogin = () => setShowLogin(true);
    const closeLogin = useCallback(() => setShowLogin(false), []);

    const openRegister = () => setShowRegister(true);
    const closeRegister = useCallback(() => setShowRegister(false), []);

    const updateAddress = useCallback((addr, newCoords = null, meta = null) => {
        setAddress(addr);
        if (addr) {
            localStorage.setItem("address", addr);
        } else {
            localStorage.removeItem("address");
        }

        setCoords(newCoords);
        if (newCoords && typeof newCoords.lat === "number") {
            localStorage.setItem("coords", JSON.stringify(newCoords));
        } else {
            localStorage.removeItem("coords");
        }

        if (meta) {
            const nextMeta = { city: meta.city || "", area: meta.area || "" };
            setLocationMeta(nextMeta);
            localStorage.setItem("locationMeta", JSON.stringify(nextMeta));
        }
    }, []);

    const toggleTheme = useCallback(() => {
        setTheme(prev => (prev === "dark" ? "light" : "dark"));
    }, []);

    const toggleLocale = useCallback(() => {
        setLocale(prev => (prev === "ar" ? "en" : "ar"));
    }, []);

    const value = {
        showAddress,
        openAddress,
        closeAddress,
        showLogin,
        openLogin,
        closeLogin,
        showRegister,
        openRegister,
        closeRegister,
        address,
        coords,
        locationMeta,
        updateAddress,
        theme,
        toggleTheme,
        locale,
        toggleLocale,
    };

    return (
        <PortalContext.Provider value={value}>
            {children}
        </PortalContext.Provider>
    );
}
