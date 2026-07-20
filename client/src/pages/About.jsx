import { useContext } from "react";
import { ShieldCheck, Zap, HeartHandshake, MapPin } from "lucide-react";
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

const introStyle = { fontSize: 15, color: "var(--text-muted)", lineHeight: 1.8, maxWidth: 640 };

const sectionTitleStyle = {
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    fontSize: "1.2rem",
    color: "var(--text)",
    marginBottom: 10,
};

const missionCardStyle = {
    background: "var(--glass-bg)",
    border: "1px solid var(--border-blue)",
    borderRadius: 18,
    padding: "26px 24px",
};

const missionTextStyle = { fontSize: 14, color: "var(--text-dim)", lineHeight: 1.9 };

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

const cardTitleStyle = { fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, color: "var(--text)" };
const cardTextStyle = { fontSize: 13, color: "var(--text-muted)", lineHeight: 1.7 };

const CONTENT = {
    ar: {
        kicker: "عن المنصة",
        title: "من نحن",
        intro: "«خدمتي» منصة فلسطينية تربط أصحاب المنازل بفنيين موثوقين في مختلف التخصصات — سباكة، كهرباء، نجارة، تنظيف، صيانة أجهزة، ودهان — بتجربة حجز سريعة وشفافة من أي جهاز.",
        missionTitle: "رسالتنا",
        mission: "نؤمن أن الحصول على فني موثوق لا يجب أن يكون مغامرة. لذلك بنينا منصة توزّع الطلبات تلقائيًا على أقرب فني معتمد ومتاح، وتتيح التواصل الآمن داخل المنصة، وتعرض تقييمات حقيقية من عملاء حقيقيين — لنرفع جودة الخدمات المنزلية ونخلق فرص عمل عادلة للفنيين المهرة.",
        valuesTitle: "قيمنا",
        values: [
            { icon: ShieldCheck, title: "موثوقية معتمدة", text: "كل فني يخضع لتوثيق هوية يعتمده فريق الإدارة قبل استقبال أي طلب." },
            { icon: Zap, title: "سرعة الاستجابة", text: "توزيع تلقائي ذكي للطلبات على أقرب فني متاح خلال دقائق." },
            { icon: HeartHandshake, title: "شفافية كاملة", text: "أسعار معلنة وتقييمات حقيقية ومحادثة مباشرة قبل تأكيد أي عمل." },
            { icon: MapPin, title: "قريبون منك", text: "نخدم مدنًا وقرى متعددة ونتوسع باستمرار لنغطي كل المناطق." },
        ],
    },
    en: {
        kicker: "About the platform",
        title: "About Us",
        intro: "Khedmati is a Palestinian platform connecting homeowners with trusted technicians across specialties — plumbing, electricity, carpentry, cleaning, appliance repair, and painting — with a fast, transparent booking experience on any device.",
        missionTitle: "Our Mission",
        mission: "We believe finding a reliable technician should never be a gamble. That is why we built a platform that automatically assigns requests to the nearest available verified technician, enables safe in-app communication, and shows real reviews from real customers — raising the quality of home services while creating fair opportunities for skilled technicians.",
        valuesTitle: "Our Values",
        values: [
            { icon: ShieldCheck, title: "Verified Trust", text: "Every technician passes an identity verification approved by our team before receiving requests." },
            { icon: Zap, title: "Fast Response", text: "Smart automatic dispatching to the nearest available technician within minutes." },
            { icon: HeartHandshake, title: "Full Transparency", text: "Published prices, genuine reviews, and direct chat before any work is confirmed." },
            { icon: MapPin, title: "Close to You", text: "We serve many cities and towns and keep expanding to cover every area." },
        ],
    },
};

export default function About() {
    const { locale } = useContext(PortalContext);
    const isRtl = locale === "ar";
    const c = CONTENT[locale] || CONTENT.ar;

    return (
        <div style={wrapStyle} dir={isRtl ? "rtl" : "ltr"}>
            <div style={headStyle}>
                <span style={kickerStyle}>{c.kicker}</span>
                <h1 style={titleStyle}>{c.title}</h1>
                <p style={introStyle}>{c.intro}</p>
            </div>

            <div style={missionCardStyle}>
                <h2 style={sectionTitleStyle}>{c.missionTitle}</h2>
                <p style={missionTextStyle}>{c.mission}</p>
            </div>

            <div>
                <h2 style={sectionTitleStyle}>{c.valuesTitle}</h2>
                <div style={gridStyle}>
                    {c.values.map((v) => {
                        const Icon = v.icon;
                        return (
                            <div key={v.title} style={cardStyle}>
                                <div style={cardIconStyle}>
                                    <Icon size={20} />
                                </div>
                                <span style={cardTitleStyle}>{v.title}</span>
                                <p style={cardTextStyle}>{v.text}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
