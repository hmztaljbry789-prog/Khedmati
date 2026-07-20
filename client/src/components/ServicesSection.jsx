import { useEffect, useMemo, useState, useContext } from "react";
import { motion } from "framer-motion";
import { Search, SearchX } from "lucide-react";
import { getServices } from "../utils/api";
import Services from "./Services";
import PortalLayout from "./PortalLayout";
import ServiceDetails from "./ServiceDetails";
import PortalContext from "../context/PortalContext";
import { translations } from "../utils/translations";

const skeletonCardStyle = {
    borderRadius: 16,
    overflow: "hidden",
    background: "var(--glass-bg)",
    border: "1px solid var(--border)",
    animation: "pulse 1.5s ease infinite",
};

const skeletonImgStyle = { height: 110, background: "rgba(255,255,255,0.03)" };
const skeletonFootStyle = { padding: "10px 12px", borderTop: "1px solid var(--border)" };
const skeletonLineStyle = {
    height: 11,
    width: "60%",
    borderRadius: 6,
    background: "rgba(255,255,255,0.06)",
    margin: "0 auto",
};

function SkeletonCard() {
    return (
        <div style={skeletonCardStyle}>
            <div style={skeletonImgStyle} />
            <div style={skeletonFootStyle}>
                <div style={skeletonLineStyle} />
            </div>
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
        </div>
    );
}

const dividerRowStyle = { display: "flex", alignItems: "center", gap: 16, marginBottom: 24 };
const dividerLineStyle = { flex: 1, height: 1, background: "var(--border)" };
const dividerChipStyle = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "var(--blue-bright)",
    fontFamily: "var(--font-display)",
    padding: "4px 14px",
    borderRadius: 99,
    background: "var(--blue-dim)",
    border: "1px solid var(--border-blue)",
};

const searchWrapStyle = { position: "relative", maxWidth: 400, margin: "0 auto 26px" };

const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
    gap: 12,
};

const emptyStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    padding: "40px 16px",
    color: "var(--text-muted)",
    fontSize: 13,
};

const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    show: (i) => ({
        opacity: 1,
        y: 0,
        transition: { delay: Math.min(i * 0.05, 0.45), duration: 0.35, ease: "easeOut" },
    }),
};

const viewportOnce = { once: true, margin: "-30px" };

export default function ServicesSection() {
    const { locale } = useContext(PortalContext);
    const t = translations[locale];
    const isRtl = locale === "ar";

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [query, setQuery] = useState("");

    useEffect(() => {
        getServices()
            .then((d) => setData(d.sort((a, b) => a.order - b.order)))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // Match against both the localized and the raw service name so the search
    // works in Arabic and English regardless of the active language.
    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return data;
        return data.filter((s) => {
            const localized = String(t[s.serviceName] || s.serviceName).toLowerCase();
            return localized.includes(q) || s.serviceName.toLowerCase().includes(q);
        });
    }, [data, query, t]);

    const searchIconStyle = {
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        color: "var(--text-muted)",
        pointerEvents: "none",
        insetInlineStart: 14,
    };

    const searchInputStyle = {
        width: "100%",
        padding: isRtl ? "12px 42px 12px 16px" : "12px 16px 12px 42px",
        borderRadius: 14,
        fontSize: 13.5,
        color: "var(--text)",
        background: "var(--glass-bg)",
        border: "1px solid var(--border)",
        backdropFilter: "blur(12px)",
        outline: "none",
        fontFamily: "inherit",
        transition: "border-color 0.2s",
    };

    return (
        <section id="services" style={ { paddingBottom: 56 } }>
            {/* Section divider */}
            <div style={dividerRowStyle}>
                <div style={dividerLineStyle} />
                <span style={dividerChipStyle}>{t.ourServices}</span>
                <div style={dividerLineStyle} />
            </div>

            {/* Live search */}
            <div style={searchWrapStyle}>
                <Search size={15} style={searchIconStyle} />
                <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t.searchServices}
                    aria-label={t.searchServices}
                    style={searchInputStyle}
                    onFocus={(e) => (e.target.style.borderColor = "var(--border-blue)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
            </div>

            {/* Grid */}
            {loading ? (
                <div style={gridStyle}>
                    {Array(8).fill(null).map((_, i) => <SkeletonCard key={i} />)}
                </div>
            ) : visible.length === 0 ? (
                <div style={emptyStyle}>
                    <SearchX size={28} />
                    <span>{t.noServicesFound}</span>
                </div>
            ) : (
                <div style={gridStyle}>
                    {visible.map((s, i) => (
                        <motion.div
                            key={s._id}
                            custom={i}
                            variants={cardVariants}
                            initial="hidden"
                            whileInView="show"
                            viewport={viewportOnce}
                        >
                            <Services
                                serviceImage={s.serviceImage}
                                serviceName={s.serviceName}
                                onServiceClick={setSelected}
                            />
                        </motion.div>
                    ))}
                </div>
            )}

            <PortalLayout isOpen={!!selected} onClose={() => setSelected(null)}>
                {selected && <ServiceDetails serviceName={selected} />}
            </PortalLayout>
        </section>
    );
}
