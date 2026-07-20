import { useContext, useState } from "react";
import { ChevronDown } from "lucide-react";
import PortalContext from "../context/PortalContext";

const wrapStyle = {
    maxWidth: 760,
    margin: "0 auto",
    padding: "40px 0 24px",
    display: "flex",
    flexDirection: "column",
    gap: 28,
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

const introStyle = { fontSize: 15, color: "var(--text-muted)", lineHeight: 1.8, maxWidth: 540 };

const listStyle = { display: "flex", flexDirection: "column", gap: 10 };

const itemStyle = {
    background: "var(--glass-bg)",
    border: "1px solid var(--glass-border)",
    borderRadius: 16,
    overflow: "hidden",
};

const itemOpenStyle = {
    background: "var(--glass-bg)",
    border: "1px solid var(--border-blue)",
    borderRadius: 16,
    overflow: "hidden",
};

const qBtnStyle = {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "16px 18px",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 700,
    color: "var(--text)",
    fontFamily: "var(--font-display)",
    textAlign: "inherit",
};

const answerStyle = {
    padding: "0 18px 16px",
    fontSize: 13.5,
    color: "var(--text-muted)",
    lineHeight: 1.8,
};

const CONTENT = {
    ar: {
        kicker: "مركز المساعدة",
        title: "الأسئلة الشائعة",
        intro: "إجابات سريعة عن أكثر ما يسأل عنه عملاؤنا. لم تجد سؤالك؟ تواصل معنا من صفحة الدعم.",
        items: [
            { q: "كيف أحجز خدمة؟", a: "اختر الخدمة المناسبة من الصفحة الرئيسية، حدد موقعك وتفاصيل المشكلة، ثم أكد الطلب. يوزَّع طلبك تلقائيًا على أقرب فني معتمد ومتاح، ويصلك إشعار فور قبوله." },
            { q: "هل الفنيون موثوقون؟", a: "نعم. كل فني يرفع وثيقة إثبات هوية تُراجع وتُعتمد من الإدارة قبل أن يتمكن من استقبال أي طلب، وتظهر علامة التوثيق على ملفه، إضافة إلى تقييمات حقيقية من عملاء سابقين." },
            { q: "كيف يتم تحديد السعر؟", a: "نعتمد تسعيرًا هجينًا: أسعار أساسية معلنة لكل خدمة تراها قبل الحجز، وبعد المعاينة يقدم الفني عرضًا نهائيًا حسب حجم العمل — ولا يبدأ التنفيذ إلا بعد موافقتك." },
            { q: "هل يمكنني إلغاء الحجز؟", a: "نعم، يمكنك إلغاء الحجز من صفحة «حجوزاتي» طالما لم يبدأ التنفيذ، وسيصل إشعار فوري للفني بالإلغاء." },
            { q: "كيف أتواصل مع الفني؟", a: "بعد قبول الطلب تُفتح محادثة آمنة داخل المنصة بينك وبين الفني لتنسيق الموعد والتفاصيل، دون الحاجة لمشاركة رقمك الشخصي." },
            { q: "كيف أنضم كفني إلى المنصة؟", a: "أنشئ حسابًا كمزود خدمة، أكمل ملفك وارفع وثيقة التوثيق، وبعد اعتماد الإدارة ستبدأ باستقبال الطلبات القريبة من منطقتك مباشرة." },
        ],
    },
    en: {
        kicker: "Help Center",
        title: "Frequently Asked Questions",
        intro: "Quick answers to what our customers ask most. Can't find your question? Reach us from the support page.",
        items: [
            { q: "How do I book a service?", a: "Pick the service you need from the home page, set your location and problem details, then confirm. Your request is automatically dispatched to the nearest available verified technician, and you get notified once accepted." },
            { q: "Are the technicians trustworthy?", a: "Yes. Every technician uploads an identity document that is reviewed and approved by our team before they can receive requests. A verification badge appears on their profile, alongside genuine reviews from previous customers." },
            { q: "How is the price determined?", a: "We use hybrid pricing: published base prices for each service that you see before booking, then after inspection the technician offers a final quote based on the scope of work — nothing starts without your approval." },
            { q: "Can I cancel a booking?", a: "Yes, you can cancel from the My Bookings page as long as work has not started, and the technician is instantly notified." },
            { q: "How do I communicate with the technician?", a: "Once your request is accepted, a secure in-app chat opens between you and the technician to arrange timing and details — no need to share your personal number." },
            { q: "How do I join as a technician?", a: "Register as a service provider, complete your profile and upload your verification document. Once approved by our team, you will start receiving requests near your area right away." },
        ],
    },
};

export default function FAQ() {
    const { locale } = useContext(PortalContext);
    const isRtl = locale === "ar";
    const c = CONTENT[locale] || CONTENT.ar;
    const [open, setOpen] = useState(0);

    return (
        <div style={wrapStyle} dir={isRtl ? "rtl" : "ltr"}>
            <div style={headStyle}>
                <span style={kickerStyle}>{c.kicker}</span>
                <h1 style={titleStyle}>{c.title}</h1>
                <p style={introStyle}>{c.intro}</p>
            </div>

            <div style={listStyle}>
                {c.items.map((item, i) => {
                    const isOpen = open === i;
                    const chevronStyle = {
                        transition: "transform 0.2s",
                        transform: isOpen ? "rotate(180deg)" : "none",
                        color: "var(--blue-bright)",
                        flexShrink: 0,
                    };
                    return (
                        <div key={item.q} style={isOpen ? itemOpenStyle : itemStyle}>
                            <button
                                style={qBtnStyle}
                                onClick={() => setOpen(isOpen ? -1 : i)}
                                aria-expanded={isOpen}
                            >
                                <span>{item.q}</span>
                                <ChevronDown size={17} style={chevronStyle} />
                            </button>
                            {isOpen && <p style={answerStyle}>{item.a}</p>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
