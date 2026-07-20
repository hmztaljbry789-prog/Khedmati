import { useContext } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import PortalContext from "../../context/PortalContext";
import { translations } from "../../utils/translations";

const wrap = { display: "flex", flexDirection: "column", gap: 14, minWidth: 200 };
const brandRow = { display: "flex", alignItems: "center", gap: 6 };
const logoImg = { height: 40 };
const brandText = {
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: "-0.03em",
    color: "var(--text)",
    textDecoration: "none",
};
const badge = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    background: "var(--blue-dim)",
    color: "var(--blue-bright)",
    border: "1px solid var(--border-blue)",
};
const backLink = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    padding: "8px 14px",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 600,
    background: "var(--glass-bg)",
    border: "1px solid var(--glass-border)",
    color: "var(--text)",
    textDecoration: "none",
};

export default function AdminSidebar() {
    const { locale } = useContext(PortalContext);
    const t = translations[locale];
    const isRtl = locale === "ar";
    const BackIcon = isRtl ? ArrowRight : ArrowLeft;

    return (
        <div style={wrap}>
            <div style={brandRow}>
                <img src="/logo-192.png" alt="" style={logoImg} />
                <Link to="/admin" className="logo" style={brandText}>
                    {t.brand}
                </Link>
            </div>

            <span style={badge}>
                <ShieldCheck size={13} />
                {isRtl ? "لوحة التحكم" : "Admin Panel"}
            </span>

            <Link to="/" style={backLink}>
                <BackIcon size={15} />
                {isRtl ? "العودة للموقع" : "Back to site"}
            </Link>
        </div>
    );
}
