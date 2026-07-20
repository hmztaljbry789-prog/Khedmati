import { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { ClipboardList, Globe, LayoutDashboard, LifeBuoy, Moon, PackageOpen, Sun, Users } from "lucide-react";
import PortalContext from "../../context/PortalContext";

const navWrap = {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginBottom: 28,
};
const baseTab = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 16px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    textDecoration: "none",
    border: "1px solid var(--glass-border)",
    background: "var(--glass-bg)",
    color: "var(--text-dim)",
    transition: "all 0.2s",
};
const activeTab = {
    ...baseTab,
    background: "linear-gradient(135deg, var(--blue) 0%, var(--blue-bright) 100%)",
    color: "#fff",
    border: "1px solid transparent",
    boxShadow: "0 6px 18px var(--blue-glow)",
};
// Theme / language controls live on the far side of the admin tab bar so the
// panel can match the site (light/dark) just like the main navbar.
const toggleGroup = { display: "flex", alignItems: "center", gap: 8, marginInlineStart: "auto" };
const iconBtn = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid var(--glass-border)",
    background: "var(--glass-bg)",
    color: "var(--text)",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
};

export default function AdminNavbar() {
    const location = useLocation();
    const { locale, theme, toggleTheme, toggleLocale } = useContext(PortalContext);
    const isRtl = locale === "ar";

    const tabs = [
        { to: "/admin", icon: LayoutDashboard, ar: "لوحة المعلومات", en: "Dashboard", exact: true },
        { to: "/admin/services", icon: PackageOpen, ar: "الخدمات", en: "Services" },
        { to: "/admin/bookings", icon: ClipboardList, ar: "الحجوزات", en: "Bookings" },
        { to: "/admin/users", icon: Users, ar: "المستخدمون", en: "Users" },
        { to: "/admin/support", icon: LifeBuoy, ar: "الدعم", en: "Support" },
    ];

    const isActive = (tab) =>
        tab.exact
            ? location.pathname === "/admin" || location.pathname === "/admin/"
            : location.pathname === tab.to;

    return (
        <div style={navWrap} dir={isRtl ? "rtl" : "ltr"}>
            {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                    <Link
                        key={tab.to}
                        to={tab.to}
                        style={isActive(tab) ? activeTab : baseTab}
                    >
                        <Icon size={14} strokeWidth={2} />
                        {isRtl ? tab.ar : tab.en}
                    </Link>
                );
            })}
            <div style={toggleGroup}>
                <button
                    type="button"
                    onClick={toggleTheme}
                    style={iconBtn}
                    title={theme === "light" ? "الوضع الداكن" : "الوضع الفاتح"}
                    aria-label="Toggle theme"
                >
                    {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
                </button>
                <button
                    type="button"
                    onClick={toggleLocale}
                    style={iconBtn}
                    title="AR / EN"
                    aria-label="Toggle language"
                >
                    <Globe size={14} />
                    {locale === "ar" ? "EN" : "ع"}
                </button>
            </div>
        </div>
    );
}
