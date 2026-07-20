import { useContext } from "react";
import { Link } from "react-router-dom";
import PortalContext from "../context/PortalContext";
import { translations } from "../utils/translations";

export default function Footer() {
    const { locale } = useContext(PortalContext);
    const t = translations[locale];

    const isRtl = locale === "ar";

    return (
        <footer style={{ marginTop: 64, paddingTop: 40, paddingBottom: 24, borderTop: "1px solid var(--border)", direction: isRtl ? "rtl" : "ltr" }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 32, marginBottom: 32 }}>
                {/* Brand */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start", textAlign: isRtl ? "right" : "left" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                            width: 30, height: 30, borderRadius: 9,
                            background: "linear-gradient(135deg, var(--blue), var(--cyan))",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "var(--shadow-blue)",
                        }}>
                            <img src="/logo-192.png" alt="" width="28" height="28" />
                        </div>
                        <span style={{
                            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.2rem",
                            letterSpacing: "-0.02em",
                            background: "linear-gradient(135deg, var(--text), var(--text-dim))",
                            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                        }}>{t.brand}</span>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 260, lineHeight: 1.6 }}>
                        {t.footerDesc}
                    </p>
                </div>

                {/* Links */}
                <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
                    {[
                        {
                            title: t.footerPages,
                            links: [
                                { label: t.footerAbout, to: "/about" },
                                { label: t.footerContact, to: "/contact" },
                                { label: t.footerFaq, to: "/faq" },
                            ],
                        },
                        {
                            title: t.footerLegal,
                            links: [
                                { label: t.footerTerms, to: "/terms" },
                                { label: t.footerPrivacy, to: "/privacy" },
                            ],
                        },
                    ].map(({ title, links }) => (
                        <div key={title} style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
                            <span style={{
                                fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
                                textTransform: "uppercase", color: "var(--text-muted)",
                                fontFamily: "var(--font-display)", marginBottom: 2,
                            }}>{title}</span>
                            {links.map(({ label, to, href }) =>
                                to
                                    ? <Link key={label} to={to} style={{ fontSize: 13, color: "var(--text-dim)", textDecoration: "none", transition: "color 0.15s" }}
                                        onMouseEnter={e => e.currentTarget.style.color = "var(--blue-bright)"}
                                        onMouseLeave={e => e.currentTarget.style.color = "var(--text-dim)"}
                                      >{label}</Link>
                                    : <a key={label} href={href} style={{ fontSize: 13, color: "var(--text-dim)", textDecoration: "none", transition: "color 0.15s" }}
                                        onMouseEnter={e => e.currentTarget.style.color = "var(--blue-bright)"}
                                        onMouseLeave={e => e.currentTarget.style.color = "var(--text-dim)"}
                                      >{label}</a>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, paddingTop: 20, borderTop: "1px solid var(--border)", textAlign: "center", width: "100%" }}>
                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>© 2026 {t.brand}. {t.footerRights}</p>
            </div>
        </footer>
    );
}
