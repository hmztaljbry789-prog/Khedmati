import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { getServiceDetails } from "../utils/api";
import PortalContext from "../context/PortalContext";
import { translations } from "../utils/translations";
import { ChevronRight, ChevronLeft, Loader2 } from "lucide-react";

export default function ServiceDetails({ serviceName }) {
    const { locale } = useContext(PortalContext);
    const t = translations[locale];
    const isRtl = locale === "ar";

    const [details, setDetails]   = useState(null);
    const [loading, setLoading]   = useState(true);
    const [step, setStep]         = useState(null); // selected subcategory
    const navigate = useNavigate();

    useEffect(() => {
        getServiceDetails(serviceName)
            .then(setDetails)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [serviceName]);

    useEffect(() => {
        if (!step || !details?.subcategories?.[step]) return;
        const st = details.subcategories[step].serviceTypes;
        const hasServiceTypes = st && Object.keys(st).length > 0;
        // A subcategory with no (or empty) service types should go straight to
        // the service list page instead of opening an empty selection step.
        if (!hasServiceTypes) {
            navigate(`/services/${serviceName}/${step}`);
        }
    }, [step, details, navigate, serviceName]);

    if (loading) return (
        <div style={{ width: "min(90vw,480px)", height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Loader2 size={28} style={{ color: "var(--blue)", animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );

    if (!details) return null;

    const subs = details.subcategories || {};

    return (
        <div style={{ width: "min(92vw, 500px)", direction: isRtl ? "rtl" : "ltr" }}>
            {/* Header */}
            <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--border)", textAlign: isRtl ? "right" : "left" }}>
                {step && (
                    <button onClick={() => setStep(null)} style={{
                        display: "flex", alignItems: "center", gap: 4,
                        fontSize: 11, color: "var(--text-muted)", background: "none", border: "none",
                        cursor: "pointer", marginBottom: 8, padding: 0,
                        flexDirection: "row"
                    }}
                        onMouseEnter={e => e.currentTarget.style.color = "var(--blue-bright)"}
                        onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
                    >
                        {isRtl ? <ChevronRight size={13} /> : <ChevronLeft size={13} />} {t.backBtn}
                    </button>
                )}
                <h2 style={{
                    fontFamily: "var(--font-display)", fontWeight: 800,
                    fontSize: "1.1rem", color: "var(--text)",
                }}>
                    {step ? ((isRtl && subs[step]?.nameAr) || t[step] || step) : ((isRtl && details?.serviceNameAr) || t[serviceName] || serviceName)}
                </h2>
                {!step && (
                    <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                        {Object.keys(subs).length} {t.servicesCategories}
                    </p>
                )}
            </div>

            {/* Step 1: subcategories */}
            {!step ? (
                <div style={{
                    padding: 16,
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                    gap: 10,
                }}>
                    {Object.keys(subs).map(sub => (
                        <button
                            key={sub}
                            onClick={() => setStep(sub)}
                            style={{
                                borderRadius: 14, overflow: "hidden", textAlign: isRtl ? "right" : "left",
                                cursor: "pointer", border: "1px solid var(--border)",
                                background: "var(--glass-bg)", backdropFilter: "blur(10px)",
                                transition: "all 0.2s",
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = "var(--border-blue)";
                                e.currentTarget.style.transform = "translateY(-2px)";
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = "var(--border)";
                                e.currentTarget.style.transform = "translateY(0)";
                            }}
                        >
                            {subs[sub].image && (
                                <div style={{ height: 90, background: "rgba(59,130,246,.08)", display: "flex", alignItems: "center", justifyContent: "center", padding: 10 }}>
                                    <img loading="lazy"
                                        src={`${import.meta.env.VITE_BACKEND_URL}/${subs[sub].image}`}
                                        alt={sub}
                                        style={{ height: "100%", objectFit: "contain" }}
                                    />
                                </div>
                            )}
                            <div style={{ padding: "8px 10px", borderTop: "1px solid var(--border)" }}>
                                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text)", lineHeight: 1.3, fontFamily: "var(--font-display)" }}>{(isRtl && subs[sub]?.nameAr) || t[sub] || sub}</p>
                            </div>
                        </button>
                    ))}
                </div>
            ) : (
                /* Step 2: service types */
                <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                    {Object.keys(subs[step]?.serviceTypes || {}).map(sType => {
                        const tier = {
                            "Salon Classic": [isRtl ? "اقتصادي" : "Economical", "var(--green-dim)", "var(--green)"],
                            "Salon Prime": [isRtl ? "ممتاز" : "Premium", "var(--blue-dim)", "var(--blue-bright)"],
                            "Salon Luxe": [isRtl ? "شركاء النخبة" : "Top Partners", "rgba(139,92,246,.15)", "#A78BFA"]
                        }[sType];
                        return (
                            <button
                                key={sType}
                                onClick={() => navigate(`/services/${serviceName}/${step}/${sType}`)}
                                style={{
                                    display: "flex", alignItems: "center", gap: 12, borderRadius: 14,
                                    overflow: "hidden", cursor: "pointer", border: "1px solid var(--border)",
                                    background: "var(--glass-bg)", backdropFilter: "blur(10px)",
                                    transition: "all 0.2s", textAlign: isRtl ? "right" : "left",
                                    flexDirection: "row"
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = "var(--border-blue)";
                                    e.currentTarget.style.transform = "translateY(-1px)";
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = "var(--border)";
                                    e.currentTarget.style.transform = "translateY(0)";
                                }}
                            >
                                {subs[step].serviceTypes[sType].image && (
                                    <div style={{ width: 88, height: 72, flexShrink: 0, overflow: "hidden" }}>
                                        <img loading="lazy"
                                            src={`${import.meta.env.VITE_BACKEND_URL}/${subs[step].serviceTypes[sType].image}`}
                                            alt={(isRtl && subs[step]?.serviceTypes?.[sType]?.nameAr) || t[sType] || sType}
                                            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
                                        />
                                    </div>
                                )}
                                <div style={{ flex: 1, padding: "10px 4px", textAlign: isRtl ? "right" : "left" }}>
                                    <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", marginBottom: 6, fontFamily: "var(--font-display)" }}>{(isRtl && subs[step]?.serviceTypes?.[sType]?.nameAr) || t[sType] || sType}</p>
                                    {tier && (
                                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: tier[1], color: tier[2] }}>
                                            {tier[0]}
                                        </span>
                                    )}
                                </div>
                                {isRtl ? <ChevronLeft size={14} style={{ color: "var(--text-muted)", marginLeft: 14, flexShrink: 0 }} /> : <ChevronRight size={14} style={{ color: "var(--text-muted)", marginRight: 14, flexShrink: 0 }} />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
