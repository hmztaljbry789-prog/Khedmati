import { useContext } from "react";
import { motion } from "framer-motion";
import { MousePointerClick, MapPin, Wrench, ArrowRight } from "lucide-react";
import PortalContext from "../context/PortalContext";
import { translations } from "../utils/translations";

/* Landing page sections: "How it works" steps + closing CTA banner. */

const sectionStyle = { padding: "0 0 48px" };

const headWrapStyle = { textAlign: "center", marginBottom: 26 };

const titleStyle = {
    fontFamily: "var(--font-display)",
    fontWeight: 800,
    fontSize: "1.5rem",
    color: "var(--text)",
    marginBottom: 6,
};

const subtitleStyle = { fontSize: 13, color: "var(--text-muted)" };

const rowStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
};

const cardStyle = {
    position: "relative",
    padding: "24px 20px 20px",
    borderRadius: 18,
    background: "var(--glass-bg)",
    border: "1px solid var(--border)",
    backdropFilter: "blur(12px)",
    textAlign: "center",
};

const stepBadgeStyle = {
    position: "absolute",
    top: 14,
    insetInlineStart: 14,
    width: 24,
    height: 24,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 800,
    fontFamily: "var(--font-display)",
    color: "var(--blue-bright)",
    background: "var(--blue-dim)",
    border: "1px solid var(--border-blue)",
};

const iconBoxStyle = {
    width: 52,
    height: 52,
    margin: "0 auto 14px",
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    background: "linear-gradient(135deg, var(--blue), var(--cyan))",
    boxShadow: "0 8px 24px rgba(59,130,246,0.35)",
};

const stepTitleStyle = {
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    fontSize: 15,
    color: "var(--text)",
    marginBottom: 8,
};

const stepDescStyle = { fontSize: 12.5, lineHeight: 1.8, color: "var(--text-muted)" };

const cardVariants = {
    hidden: { opacity: 0, y: 18 },
    show: (i) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.12, duration: 0.4, ease: "easeOut" },
    }),
};

const viewportOnce = { once: true, margin: "-40px" };

export default function HowItWorks() {
    const { locale } = useContext(PortalContext);
    const t = translations[locale];

    const STEPS = [
        { icon: <MousePointerClick size={22} />, title: t.hiw1Title, desc: t.hiw1Desc },
        { icon: <MapPin size={22} />, title: t.hiw2Title, desc: t.hiw2Desc },
        { icon: <Wrench size={22} />, title: t.hiw3Title, desc: t.hiw3Desc },
    ];

    return (
        <section style={sectionStyle}>
            <div style={headWrapStyle}>
                <h2 style={titleStyle}>{t.hiwTitle}</h2>
                <p style={subtitleStyle}>{t.hiwSubtitle}</p>
            </div>
            <div style={rowStyle}>
                {STEPS.map((step, i) => (
                    <motion.div
                        key={step.title}
                        style={cardStyle}
                        custom={i}
                        variants={cardVariants}
                        initial="hidden"
                        whileInView="show"
                        viewport={viewportOnce}
                    >
                        <span style={stepBadgeStyle}>{i + 1}</span>
                        <div style={iconBoxStyle}>{step.icon}</div>
                        <h3 style={stepTitleStyle}>{step.title}</h3>
                        <p style={stepDescStyle}>{step.desc}</p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}

/* ---- Closing CTA banner ------------------------------------------------ */

const ctaWrapStyle = {
    marginBottom: 56,
    padding: "40px 24px",
    borderRadius: 22,
    textAlign: "center",
    background:
        "linear-gradient(135deg, rgba(59,130,246,0.14) 0%, rgba(34,211,238,0.08) 100%)",
    border: "1px solid var(--border-blue)",
    position: "relative",
    overflow: "hidden",
};

const ctaTitleStyle = {
    fontFamily: "var(--font-display)",
    fontWeight: 800,
    fontSize: "1.7rem",
    color: "var(--text)",
    marginBottom: 10,
};

const ctaDescStyle = {
    fontSize: 13.5,
    color: "var(--text-dim)",
    maxWidth: 420,
    margin: "0 auto 22px",
    lineHeight: 1.8,
};

const ctaBtnStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "13px 30px",
    borderRadius: 14,
    fontSize: 14,
    fontWeight: 700,
    background: "linear-gradient(135deg, var(--blue), var(--cyan))",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    fontFamily: "var(--font-display)",
};

const ctaFade = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

export function CtaBanner() {
    const { locale } = useContext(PortalContext);
    const t = translations[locale];
    const isRtl = locale === "ar";
    const arrowStyle = { transform: isRtl ? "rotate(180deg)" : "none" };

    const scrollToServices = () =>
        document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });

    return (
        <motion.section
            style={ctaWrapStyle}
            variants={ctaFade}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
        >
            <h2 style={ctaTitleStyle}>{t.ctaTitle}</h2>
            <p style={ctaDescStyle}>{t.ctaDesc}</p>
            <button className="btn-glow" style={ctaBtnStyle} onClick={scrollToServices}>
                <span>{t.ctaButton}</span>
                <ArrowRight size={15} style={arrowStyle} />
            </button>
        </motion.section>
    );
}
