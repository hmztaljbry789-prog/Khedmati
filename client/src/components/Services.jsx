import { useContext } from "react";
import PortalContext from "../context/PortalContext";
import { translations } from "../utils/translations";

const Services = ({ serviceImage, serviceName, onServiceClick }) => {
    const { locale } = useContext(PortalContext);
    const t = translations[locale];
    const displayName = t[serviceName] || serviceName;

    return (
        <div onClick={() => onServiceClick(serviceName)} style={{ cursor: "pointer" }}>
            <div
                style={{
                    borderRadius: 18, overflow: "hidden",
                    background: "var(--glass-bg)", border: "1px solid var(--glass-border)",
                    backdropFilter: "blur(12px)",
                    transition: "all 0.25s ease",
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.border = "1px solid var(--border-blue)";
                    e.currentTarget.style.boxShadow = "var(--shadow-blue)";
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.background = "rgba(59,130,246,0.07)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.border = "1px solid var(--glass-border)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.background = "var(--glass-bg)";
                }}
            >
                {/* Image area */}
                <div style={{
                    width: "100%", height: 130,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: 16,
                    background: "radial-gradient(ellipse at center, rgba(59,130,246,0.10) 0%, rgba(8,9,15,0.4) 100%)",
                }}>
                    <img loading="lazy"
                        src={`${import.meta.env.VITE_BACKEND_URL}/${serviceImage}`}
                        alt={displayName}
                        style={{ height: 80, width: "100%", objectFit: "contain", transition: "transform 0.3s ease" }}
                        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.1)"}
                        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                    />
                </div>

                {/* Label */}
                <div style={{
                    padding: "10px 12px", textAlign: "center",
                    borderTop: "1px solid var(--border)",
                }}>
                    <h3 style={{
                        fontSize: 12, fontWeight: 600, color: "var(--text)",
                        fontFamily: "var(--font-display)", lineHeight: 1.3,
                    }}>{displayName}</h3>
                </div>
            </div>
        </div>
    );
};

export default Services;
