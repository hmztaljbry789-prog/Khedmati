import { useContext, useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getServiceDetails } from "../utils/api";
import BookingModal from "../components/BookingModal";
import PortalContext from "../context/PortalContext";
import { translations, formatDuration } from "../utils/translations";
import {
    Loader2, Plus, ChevronLeft, ChevronRight,
    ShieldCheck, Star, Zap, Award,
} from "lucide-react";

export default function ServiceList() {
    const { serviceName, subcategory, serviceType } = useParams();
    const [bookingService, setBookingService] = useState(null);
    const handleBook = (service) => setBookingService(service);
    const { locale } = useContext(PortalContext);
    const t = translations[locale];
    const isRtl = locale === "ar";
    const rangeHintStyle = { fontSize: 11, color: "var(--text-muted)", marginTop: 4 };
    const navigate = useNavigate();

    const [services, setServices]   = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState(null);
    const [activeCategory, setActive] = useState(null);
    const catRefs = useRef({});

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const data = await getServiceDetails(serviceName);
                let svc = [], cats = [];

                const sub = data.subcategories?.[subcategory];
                if (sub) {
                    const src = serviceType && sub.serviceTypes
                        ? sub.serviceTypes[serviceType]
                        : sub;
                    if (src?.categories) {
                        cats = src.categories;
                        svc  = cats.flatMap(c => (c.services || []).map(s => ({ ...s, category: c.name })));
                    } else if (src?.services) {
                        svc  = src.services;
                        cats = [...new Set(svc.map(s => s.category))].map(name => ({ name }));
                    }
                }

                setServices(svc);
                setCategories(cats.sort((a, b) => a.name.localeCompare(b.name)));
                if (cats.length) setActive(cats[0].name);
            } catch {
                setError("فشل تحميل قائمة الخدمات");
            } finally {
                setLoading(false);
            }
        })();
    }, [serviceName, subcategory, serviceType]);

    const scrollTo = (name) => {
        setActive(name);
        catRefs.current[name]?.scrollIntoView({ behavior: "smooth", block: "start" });
    };


    if (loading) return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
            <Loader2 size={32} style={{ color: "var(--blue)", animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );

    if (error) return (
        <div style={{ padding: "32px 0", fontSize: 13, color: "var(--red)", textAlign: "center" }}>{error}</div>
    );

    return (
        <div style={{ paddingBottom: 40, paddingTop: 24, direction: isRtl ? "rtl" : "ltr" }}>

            {/* Breadcrumb */}
            <div style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 12, color: "var(--text-muted)", marginBottom: 20
            }}>
                <span
                    style={{ cursor: "pointer", transition: "color 0.15s" }}
                    onClick={() => navigate("/")}
                    onMouseEnter={e => e.currentTarget.style.color = "var(--blue-bright)"}
                    onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
                >{t.homeBreadcrumb}</span>
                {isRtl ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
                <span>{t[serviceName] || serviceName}</span>
                {isRtl ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
                <span>{t[subcategory] || subcategory}</span>
                {serviceType && (
                    <>
                        {isRtl ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
                        <span style={{ color: "var(--text)", fontWeight: 600 }}>{t[serviceType] || serviceType}</span>
                    </>
                )}
            </div>

            {/* Page title */}
            <h1 style={{
                fontFamily: "var(--font-display)", fontWeight: 800,
                fontSize: "clamp(1.5rem, 3vw, 2rem)",
                color: "var(--text)", letterSpacing: "-0.02em",
                marginBottom: 6, textAlign: isRtl ? "right" : "left"
            }}>
                {t[serviceType] || t[subcategory] || serviceType || subcategory}
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24, textAlign: isRtl ? "right" : "left" }}>
                {services.length} {t.servicesCount}
            </p>

            {/* Quality badges */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
                {[
                    { icon: <Star size={12} fill="currentColor" />, text: t.ratingBadge },
                    { icon: <ShieldCheck size={12} />,               text: t.verifiedBadge },
                    { icon: <Award size={12} />,                     text: t.premiumBadge },
                    { icon: <Zap size={12} />,                       text: t.expertBadge },
                ].map(({ icon, text }) => (
                    <span key={text} style={{
                        display: "flex", alignItems: "center", gap: 5,
                        fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 99,
                        background: "var(--blue-dim)", color: "var(--blue-bright)",
                        border: "1px solid var(--border-blue)",
                    }}>
                        {icon} {text}
                    </span>
                ))}
            </div>

            {/* Category pills — horizontal scroll */}
            <div style={{
                display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4,
                marginBottom: 28, scrollbarWidth: "none"
            }}>
                {categories.map(cat => (
                    <button
                        key={cat.name}
                        onClick={() => scrollTo(cat.name)}
                        style={{
                            flexShrink: 0, padding: "7px 16px", borderRadius: 99,
                            fontSize: 12, fontWeight: 600, cursor: "pointer",
                            transition: "all 0.2s",
                            background: activeCategory === cat.name
                                ? "linear-gradient(135deg, var(--blue), var(--cyan))"
                                : "var(--glass-bg)",
                            color: activeCategory === cat.name ? "#fff" : "var(--text-dim)",
                            border: activeCategory === cat.name
                                ? "1px solid transparent"
                                : "1px solid var(--border)",
                            boxShadow: activeCategory === cat.name ? "var(--shadow-blue)" : "none",
                        }}
                    >
                        {(isRtl && cat.nameAr) || t[cat.name] || cat.name}
                    </button>
                ))}
            </div>

            {/* Two-column: sidebar nav (desktop) + cards */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "min(200px, 20%) 1fr",
                gap: 24,
            }} className="service-list-grid">

                {/* Left nav — sticky, desktop only (JSX placed first to follow layout direction) */}
                <div className="desktop-only">
                    <div style={{
                        position: "sticky", top: 88,
                        background: "var(--glass-bg)", border: "1px solid var(--border)",
                        backdropFilter: "blur(12px)", borderRadius: 16, overflow: "hidden",
                    }}>
                        <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", textAlign: isRtl ? "right" : "left" }}>
                            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", color: "var(--text-muted)", fontFamily: "var(--font-display)" }}>
                                {t.availableCategories}
                            </p>
                        </div>
                        {categories.map(cat => (
                            <button
                                key={cat.name}
                                onClick={() => scrollTo(cat.name)}
                                style={{
                                    width: "100%", padding: "10px 14px",
                                    fontSize: 12, fontWeight: activeCategory === cat.name ? 700 : 400,
                                    textAlign: isRtl ? "right" : "left", cursor: "pointer", border: "none",
                                    background: activeCategory === cat.name ? "var(--blue-dim)" : "transparent",
                                    color: activeCategory === cat.name ? "var(--blue-bright)" : "var(--text-dim)",
                                    borderRight: isRtl && activeCategory === cat.name ? "2px solid var(--blue)" : "none",
                                    borderLeft: !isRtl && activeCategory === cat.name ? "2px solid var(--blue)" : "none",
                                    transition: "all 0.15s",
                                }}
                                onMouseEnter={e => { if (activeCategory !== cat.name) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                                onMouseLeave={e => { if (activeCategory !== cat.name) e.currentTarget.style.background = "transparent"; }}
                            >
                                {(isRtl && cat.nameAr) || t[cat.name] || cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: service cards */}
                <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                    {categories.map(cat => {
                        const catSvcs = services.filter(s => s.category === cat.name);
                        if (!catSvcs.length) return null;

                        return (
                            <div
                                key={cat.name}
                                ref={el => catRefs.current[cat.name] = el}
                                style={{ scrollMarginTop: 100 }}
                            >
                                {/* Category heading */}
                                <h2 style={{
                                    fontFamily: "var(--font-display)", fontWeight: 700,
                                    fontSize: 15, color: "var(--text)",
                                    marginBottom: 14, letterSpacing: "-0.01em",
                                    paddingBottom: 10,
                                    borderBottom: "1px solid var(--border)",
                                    textAlign: isRtl ? "right" : "left"
                                }}>{(isRtl && cat.nameAr) || t[cat.name] || cat.name}</h2>

                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                    {catSvcs.map((service, idx) => {
                                        const inCart    = false;
                                        const hasDiscount = service.MRP && service.MRP !== service.OurPrice;
                                        const disc      = hasDiscount ? Math.round(((service.MRP - service.OurPrice) / service.MRP) * 100) : 0;

                                        return (
                                            <div
                                                key={idx}
                                                style={{
                                                    display: "flex", gap: 14, padding: 14, borderRadius: 16,
                                                    background: "var(--glass-bg)",
                                                    border: `1px solid ${inCart ? "var(--border-blue)" : "var(--border)"}`,
                                                    backdropFilter: "blur(10px)",
                                                    transition: "border-color 0.2s",
                                                    alignItems: "flex-start"
                                                }}
                                                onMouseEnter={e => { if (!inCart) e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; }}
                                                onMouseLeave={e => { if (!inCart) e.currentTarget.style.borderColor = "var(--border)"; }}
                                            >
                                                {/* Info */}
                                                <div style={{ flex: 1, minWidth: 0, textAlign: isRtl ? "right" : "left" }}>
                                                    <h4 style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>
                                                        {(isRtl && service.titleAr) || t[service.title] || service.title}
                                                    </h4>

                                                    {/* Price row */}
                                                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                                        <span style={{
                                                            fontSize: 14, fontWeight: 700,
                                                            background: "linear-gradient(135deg, var(--blue-bright), var(--cyan))",
                                                            WebkitBackgroundClip: "text", backgroundClip: "text",
                                                            WebkitTextFillColor: "transparent",
                                                        }}>₪{service.OurPrice}</span>
                                                        {hasDiscount && (
                                                            <>
                                                                <span style={{ fontSize: 12, color: "var(--text-muted)", textDecoration: "line-through" }}>₪{service.MRP}</span>
                                                                <span style={{ fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 99, background: "var(--green-dim)", color: "var(--green)" }}>
                                                                    {isRtl ? `خصم ${disc}%` : `${disc}% OFF`}
                                                                </span>
                                                            </>
                                                        )}
                                                        {service.time && (
                                                            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>· ⏱ {formatDuration(service.time, locale)}</span>
                                                        )}
                                                    </div>

                                                    {service.minPrice != null && service.maxPrice != null && (
                                                        <p style={rangeHintStyle}>
                                                            {isRtl
                                                                ? `النطاق: ${service.minPrice}–${service.maxPrice} ₪ · يحدّده الفني ضمنه`
                                                                : `Range: ₪${service.minPrice}–${service.maxPrice} · technician sets within`}
                                                        </p>
                                                    )}

                                                    {/* Description */}
                                                    {(isRtl && service.descriptionAr?.length ? service.descriptionAr : service.description)?.length > 0 && (
                                                        <ul style={{ paddingInlineStart: 14, margin: 0, display: "flex", flexDirection: "column", gap: 2, listStyleType: "disc" }}>
                                                            {(isRtl && service.descriptionAr?.length ? service.descriptionAr : service.description).slice(0, 3).map((pt, i) => (
                                                                <li key={i} style={{ fontSize: 11, color: "var(--text-muted)", lineHeight: 1.5 }}>{pt}</li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>

                                                {/* Image + add button */}
                                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0 }}>
                                                    {service.image && (
                                                        <div style={{
                                                            width: 88, height: 66, borderRadius: 12, overflow: "hidden",
                                                            border: "1px solid var(--border)",
                                                        }}>
                                                            <img
                                                                src={`${import.meta.env.VITE_BACKEND_URL}/${service.image}`}
                                                                alt={(isRtl && service.titleAr) || t[service.title] || service.title}
                                                                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
                                                            />
                                                        </div>
                                                    )}

                                                    {(
                                                        <button
                                                            onClick={() => handleBook(service)}
                                                            className="btn-glow"
                                                            style={ { display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 12, fontSize: 13, fontWeight: 700, background: "linear-gradient(135deg, var(--blue), var(--cyan))", color: "#fff", border: "none", cursor: "pointer", whiteSpace: "nowrap" } }
                                                        >
                                                            <Plus size={12} /> {isRtl ? "احجز الآن" : "Book now"}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>

            <style>{`
                @keyframes slideUp {
                    from { opacity:0; transform:translateX(-50%) translateY(16px); }
                    to   { opacity:1; transform:translateX(-50%) translateY(0); }
                }
                @media (max-width: 767px) {
                    .service-list-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
                    {bookingService && (
                <BookingModal service={bookingService} onClose={() => setBookingService(null)} />
            )}
        </div>
    );
}
