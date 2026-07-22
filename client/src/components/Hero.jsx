import { useContext, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Clock, Star, Users, BadgeCheck, Layers3 } from "lucide-react";
import PortalContext from "../context/PortalContext";
import { translations } from "../utils/translations";

const sectionStyle = {
    position: "relative",
    padding: "56px 0 48px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: 28,
};

// Soft ambient glow behind the headline.
const glowStyle = {
    position: "absolute",
    top: -90,
    left: "50%",
    transform: "translateX(-50%)",
    width: "min(560px, 100vw)",
    height: 400,
    borderRadius: "50%",
    background:
        "radial-gradient(ellipse at center, rgba(59,130,246,0.15) 0%, rgba(34,211,238,0.06) 45%, transparent 70%)",
    filter: "blur(24px)",
    pointerEvents: "none",
    zIndex: -1,
};

const trustRowStyle = {
    display: "flex",
    alignItems: "center",
    gap: 20,
    flexWrap: "wrap",
    justifyContent: "center",
};

const trustItemStyle = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-muted)",
};

const trustIconStyle = { color: "var(--blue)" };

const headWrapStyle = { maxWidth: 640 };

const h1Style = {
    fontFamily: "var(--font-display)",
    fontWeight: 800,
    fontSize: "clamp(2.1rem, 5vw, 3.5rem)",
    lineHeight: 1.2,
    letterSpacing: "-0.02em",
    color: "var(--text)",
    marginBottom: 16,
};

const descStyle = {
    fontSize: 15,
    color: "var(--text-muted)",
    lineHeight: 1.7,
    maxWidth: 480,
    margin: "0 auto",
};

const ctaRowStyle = { display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" };

const primaryBtnStyle = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "13px 28px",
    borderRadius: 14,
    fontSize: 14,
    fontWeight: 700,
    background: "linear-gradient(135deg, var(--blue), var(--cyan))",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    fontFamily: "var(--font-display)",
};

const secondaryBtnStyle = {
    padding: "13px 24px",
    borderRadius: 14,
    fontSize: 14,
    fontWeight: 500,
    background: "var(--glass-bg)",
    border: "1px solid var(--glass-border)",
    backdropFilter: "blur(12px)",
    color: "var(--text-dim)",
    cursor: "pointer",
    transition: "border-color 0.2s",
};

// Staggered entrance: each hero block fades in slightly after the previous one.
const fadeUp = {
    hidden: { opacity: 0, y: 18 },
    show: (i) => ({
        opacity: 1,
        y: 0,
        transition: { delay: 0.08 + i * 0.12, duration: 0.45, ease: "easeOut" },
    }),
};function parseStatValue(valStr) {
    if (typeof valStr !== "string") return { number: 0, prefix: "", suffix: "", decimals: 0 };
    const match = valStr.match(/([0-9]+(?:\.[0-9]+)?)/);
    if (!match) return { number: 0, prefix: "", suffix: valStr, decimals: 0 };
    const num = parseFloat(match[1]);
    const index = match.index;
    const prefix = valStr.substring(0, index);
    const suffix = valStr.substring(index + match[1].length);
    const decimals = match[1].includes(".") ? match[1].split(".")[1].length : 0;
    return { number: num, prefix, suffix, decimals };
}

function StatCounter({ value }) {
    const { number, prefix, suffix, decimals } = parseStatValue(value);
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime = null;
        const duration = 1600;
        let animationFrameId;

        const animate = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            const easeProgress = progress * (2 - progress);
            const currentVal = easeProgress * number;

            setCount(currentVal);

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(animate);
            }
        };

        animationFrameId = requestAnimationFrame(animate);

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [number]);

    const formattedNum = count.toFixed(decimals);

    return (
        <span className="stat-counter-box">
            <span dir="ltr" className="stat-num">
                {prefix}{formattedNum}
            </span>
            {suffix && <span className="stat-suffix">{suffix.trim()}</span>}
        </span>
    );
}


export default function Hero() {
    const { openAddress, locale } = useContext(PortalContext);
    const t = translations[locale];

    const isRtl = locale === "ar";
    const arrowStyle = { transform: isRtl ? "rotate(180deg)" : "rotate(0)" };

    const TRUST = [
        { icon: <Star size={14} fill="currentColor" />, text: t.heroTrust1 },
        { icon: <ShieldCheck size={14} />, text: t.heroTrust2 },
        { icon: <Clock size={14} />, text: t.heroTrust3 },
    ];

    const STATS = [
        { value: t.heroStat1Val, label: t.heroStat1Lbl, icon: Users, accent: "blue" },
        { value: t.heroStat2Val, label: t.heroStat2Lbl, icon: BadgeCheck, accent: "green" },
        { value: t.heroStat3Val, label: t.heroStat3Lbl, icon: Layers3, accent: "cyan" },
        { value: t.heroStat4Val, label: t.heroStat4Lbl, icon: Star, accent: "amber" },
    ];

    return (
        <section style={sectionStyle}>
            <div style={glowStyle} />

            {/* Trust strip */}
            <motion.div
                style={trustRowStyle}
                custom={0}
                variants={fadeUp}
                initial="hidden"
                animate="show"
            >
                {TRUST.map(({ icon, text }) => (
                    <span key={text} style={trustItemStyle}>
                        <span style={trustIconStyle}>{icon}</span>
                        {text}
                    </span>
                ))}
            </motion.div>

            {/* Headline */}
            <motion.div
                style={headWrapStyle}
                custom={1}
                variants={fadeUp}
                initial="hidden"
                animate="show"
            >
                <h1 style={h1Style}>{t.heroSubtitle}</h1>
                <p style={descStyle}>{t.heroDesc}</p>
            </motion.div>

            {/* CTAs */}
            <motion.div
                style={ctaRowStyle}
                custom={2}
                variants={fadeUp}
                initial="hidden"
                animate="show"
            >
                <button
                    className="btn-glow"
                    onClick={() =>
                        document.getElementById("services")?.scrollIntoView({ behavior: "smooth" })
                    }
                    style={primaryBtnStyle}
                >
                    <span>{t.browseServices}</span> <ArrowRight size={15} style={arrowStyle} />
                </button>
                <button
                    onClick={openAddress}
                    style={secondaryBtnStyle}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-blue)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--glass-border)")}
                >
                    {t.enterLocation}
                </button>
            </motion.div>

            {/* Stats row */}
            <motion.div
                className="hero-stats-grid"
                custom={3}
                variants={fadeUp}
                initial="hidden"
                animate="show"
            >
                {STATS.map(({ value, label, icon: Icon, accent }, index) => (
                    <motion.div
                        key={label}
                        className={`hero-stat-card hero-stat-${accent}`}
                        initial={{ opacity: 0, y: 12, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: 0.48 + index * 0.08, duration: 0.35 }}
                        whileHover={{ y: -5, scale: 1.025 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <span className="hero-stat-icon" aria-hidden="true">
                            <Icon size={19} fill={accent === "amber" ? "currentColor" : "none"} />
                        </span>
                        <div className="hero-stat-copy">
                            <p className="hero-stat-value"><StatCounter value={value} /></p>
                            <p className="hero-stat-label">{label}</p>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </section>
    );
}
