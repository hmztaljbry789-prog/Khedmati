import { useContext } from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Clock, LifeBuoy, ArrowRight } from "lucide-react";
import PortalContext from "../context/PortalContext";

const wrapStyle = {
    maxWidth: 860,
    margin: "0 auto",
    padding: "40px 0 24px",
    display: "flex",
    flexDirection: "column",
    gap: 32,
};

const headStyle = { textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 };

const kickerStyle = {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "var(--blue-bright)",
    fontFamily: "var(--font-display)",
};

const titleStyle = {
    fontFamily: "var(--font-display)",
    fontWeight: 800,
    fontSize: "clamp(1.7rem, 4vw, 2.6rem)",
    letterSpacing: "-0.02em",
    color: "var(--text)",
    lineHeight: 1.25,
};

const introStyle = { fontSize: 15, color: "var(--text-muted)", lineHeight: 1.8, maxWidth: 560 };

const gridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 };

const cardStyle = {
    background: "var(--glass-bg)",
    border: "1px solid var(--glass-border)",
    borderRadius: 18,
    padding: "22px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    alignItems: "flex-start",
};

const cardIconStyle = {
    width: 40,
    height: 40,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--blue-dim)",
    border: "1px solid var(--border-blue)",
    color: "var(--blue-bright)",
};

const cardTitleStyle = { fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, color: "var(--text)" };
const cardValueStyle = { fontSize: 13, color: "var(--text-dim)", lineHeight: 1.7, direction: "ltr", textDecoration: "none", wordBreak: "break-word" };
const cardNoteStyle = { fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 };

const supportCardStyle = {
    background: "var(--glass-bg)",
    border: "1px solid var(--border-blue)",
    borderRadius: 18,
    padding: "28px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    gap: 12,
};

const supportTitleStyle = { fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.15rem", color: "var(--text)" };
const supportTextStyle = { fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 480 };

const supportBtnStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "12px 24px",
    marginTop: 4,
    borderRadius: 14,
    fontSize: 14,
    fontWeight: 700,
    background: "linear-gradient(135deg, var(--blue), var(--cyan))",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    textDecoration: "none",
    boxShadow: "var(--shadow-blue)",
    fontFamily: "var(--font-display)",
};

const CONTENT = {
    ar: {
        kicker: "يسعدنا سماعك",
        title: "تواصل معنا",
        intro: "سؤال، اقتراح، أو مشكلة؟ فريقنا جاهز لمساعدتك عبر القنوات التالية، أو مباشرة من نظام الدعم داخل المنصة.",
        emailTitle: "البريد الإلكتروني",
        phoneTitle: "الهاتف / واتساب",
        phoneNote: "السبت – الخميس",
        locationTitle: "الموقع",
        locationValue: "غزة، فلسطين",
        hoursTitle: "ساعات العمل",
        hoursValue: "8:00 صباحًا – 8:00 مساءً",
        supportTitle: "أسرع طريقة للتواصل",
        supportText: "افتح تذكرة من نظام الدعم داخل المنصة وسيرد عليك فريقنا مباشرة — يمكنك متابعة حالة التذكرة والرد في أي وقت.",
        supportBtn: "فتح تذكرة دعم",
    },
    en: {
        kicker: "We would love to hear from you",
        title: "Contact Us",
        intro: "A question, suggestion, or an issue? Our team is ready to help through the channels below, or directly via the in-app support system.",
        emailTitle: "Email",
        phoneTitle: "Phone / WhatsApp",
        phoneNote: "Saturday – Thursday",
        locationTitle: "Location",
        locationValue: "Gaza, Palestine",
        hoursTitle: "Working Hours",
        hoursValue: "8:00 AM – 8:00 PM",
        supportTitle: "The fastest way to reach us",
        supportText: "Open a ticket from the in-app support system and our team will reply directly — you can track the ticket status and respond anytime.",
        supportBtn: "Open a Support Ticket",
    },
};

const EMAIL = "khedmati.contact@gmail.com";
const PHONE = "+970 59 123 4567";
const PHONE_HREF = "tel:+970591234567";

export default function Contact() {
    const { locale } = useContext(PortalContext);
    const isRtl = locale === "ar";
    const c = CONTENT[locale] || CONTENT.ar;
    const arrowStyle = { transform: isRtl ? "rotate(180deg)" : "none" };

    return (
        <div style={wrapStyle} dir={isRtl ? "rtl" : "ltr"}>
            <div style={headStyle}>
                <span style={kickerStyle}>{c.kicker}</span>
                <h1 style={titleStyle}>{c.title}</h1>
                <p style={introStyle}>{c.intro}</p>
            </div>

            <div style={gridStyle}>
                <div style={cardStyle}>
                    <div style={cardIconStyle}><Mail size={20} /></div>
                    <span style={cardTitleStyle}>{c.emailTitle}</span>
                    <a href={"mailto:" + EMAIL} style={cardValueStyle}>{EMAIL}</a>
                </div>
                <div style={cardStyle}>
                    <div style={cardIconStyle}><Phone size={20} /></div>
                    <span style={cardTitleStyle}>{c.phoneTitle}</span>
                    <a href={PHONE_HREF} style={cardValueStyle}>{PHONE}</a>
                    <span style={cardNoteStyle}>{c.phoneNote}</span>
                </div>
                <div style={cardStyle}>
                    <div style={cardIconStyle}><MapPin size={20} /></div>
                    <span style={cardTitleStyle}>{c.locationTitle}</span>
                    <span style={cardNoteStyle}>{c.locationValue}</span>
                </div>
                <div style={cardStyle}>
                    <div style={cardIconStyle}><Clock size={20} /></div>
                    <span style={cardTitleStyle}>{c.hoursTitle}</span>
                    <span style={cardNoteStyle}>{c.hoursValue}</span>
                </div>
            </div>

            <div style={supportCardStyle}>
                <div style={cardIconStyle}><LifeBuoy size={20} /></div>
                <h2 style={supportTitleStyle}>{c.supportTitle}</h2>
                <p style={supportTextStyle}>{c.supportText}</p>
                <Link to="/support" style={supportBtnStyle} className="btn-glow">
                    <span>{c.supportBtn}</span> <ArrowRight size={15} style={arrowStyle} />
                </Link>
            </div>
        </div>
    );
}
