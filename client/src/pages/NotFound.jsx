import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Home, SearchX } from "lucide-react";
import PortalContext from "../context/PortalContext";

const wrapStyle = {
    minHeight: "60vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    gap: 14,
    padding: "48px 16px",
};

const badgeStyle = {
    width: 84,
    height: 84,
    borderRadius: 26,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--blue-dim)",
    border: "1px solid var(--border-blue)",
    color: "var(--blue-bright)",
    marginBottom: 6,
};

const codeStyle = {
    fontFamily: "var(--font-display)",
    fontWeight: 800,
    fontSize: "clamp(3rem, 8vw, 5rem)",
    letterSpacing: "-0.04em",
    lineHeight: 1,
    background: "linear-gradient(135deg, var(--blue-bright), var(--cyan))",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
};

const titleStyle = {
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)",
    color: "var(--text)",
};

const descStyle = {
    fontSize: 14,
    color: "var(--text-muted)",
    maxWidth: 420,
    lineHeight: 1.7,
};

const btnStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 22px",
    marginTop: 8,
    borderRadius: 14,
    fontSize: 14,
    fontWeight: 700,
    background: "linear-gradient(135deg, var(--blue), var(--cyan))",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    boxShadow: "var(--shadow-blue)",
};

export default function NotFound() {
    const { locale } = useContext(PortalContext);
    const isRtl = locale === "ar";
    const navigate = useNavigate();

    return (
        <div style={wrapStyle} dir={isRtl ? "rtl" : "ltr"}>
            <div style={badgeStyle}>
                <SearchX size={38} />
            </div>
            <div style={codeStyle}>404</div>
            <h1 style={titleStyle}>
                {isRtl ? "الصفحة غير موجودة" : "Page not found"}
            </h1>
            <p style={descStyle}>
                {isRtl
                    ? "يبدو أن الرابط الذي فتحته غير صحيح أو أن الصفحة تم نقلها."
                    : "The link you opened seems to be broken or the page has been moved."}
            </p>
            <button className="btn-glow" style={btnStyle} onClick={() => navigate("/")}>
                <Home size={16} /> {isRtl ? "العودة للرئيسية" : "Back to home"}
            </button>
        </div>
    );
}
