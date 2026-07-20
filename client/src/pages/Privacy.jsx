import { useContext } from "react";
import { ShieldCheck } from "lucide-react";
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

const badgeStyle = {
    width: 56,
    height: 56,
    borderRadius: 18,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--blue-dim)",
    border: "1px solid var(--border-blue)",
    color: "var(--blue-bright)",
};

const titleStyle = {
    fontFamily: "var(--font-display)",
    fontWeight: 800,
    fontSize: "clamp(1.7rem, 4vw, 2.4rem)",
    letterSpacing: "-0.02em",
    color: "var(--text)",
    lineHeight: 1.25,
};

const updatedStyle = { fontSize: 12, color: "var(--text-muted)" };

const sectionStyle = {
    background: "var(--glass-bg)",
    border: "1px solid var(--glass-border)",
    borderRadius: 16,
    padding: "20px 20px",
};

const sectionTitleStyle = {
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    fontSize: 15,
    color: "var(--text)",
    marginBottom: 8,
};

const sectionTextStyle = { fontSize: 13.5, color: "var(--text-muted)", lineHeight: 1.9 };

const CONTENT = {
    ar: {
        title: "سياسة الخصوصية",
        updated: "آخر تحديث: يوليو 2026",
        sections: [
            { h: "1. البيانات التي نجمعها", p: "نجمع البيانات اللازمة لتشغيل الخدمة فقط: الاسم، البريد الإلكتروني، رقم الهاتف، العنوان وموقع الخدمة، تفاصيل الحجوزات، ومحتوى المحادثات داخل المنصة. للفنيين تُضاف وثيقة التوثيق التي لا تظهر إلا للإدارة." },
            { h: "2. كيف نستخدم بياناتك", p: "نستخدم البيانات لتوزيع الطلبات على أقرب فني، وإتمام الحجوزات، وإرسال الإشعارات المتعلقة بطلباتك، وتحسين جودة الخدمة. لا نبيع بياناتك ولا نشاركها مع أي طرف ثالث لأغراض تسويقية." },
            { h: "3. مشاركة البيانات", p: "يرى الفني اسمك وعنوان الخدمة وتفاصيل الطلب فقط بعد إسناد الطلب إليه. ولا تُكشف وثائق التوثيق أو بيانات الحسابات لأي مستخدم آخر." },
            { h: "4. حماية البيانات", p: "كلمات المرور مشفرة بخوارزمية Bcrypt ولا تُخزن نصًا صريحًا، والجلسات محمية برموز JWT، وجميع الاتصالات تتم عبر HTTPS مع ترويسات أمان صارمة (CSP وHSTS وغيرها)، إضافة إلى حد لمعدل محاولات الدخول." },
            { h: "5. الكوكيز والتخزين المحلي", p: "نستخدم التخزين المحلي لحفظ تفضيلاتك (كاللغة والوضع الليلي) وكوكيز الجلسة لتسجيل الدخول الآمن فقط — دون أي كوكيز تتبع إعلانية." },
            { h: "6. حقوقك", p: "يمكنك تعديل بيانات حسابك في أي وقت، وطلب حذف حسابك وبياناتك نهائيًا عبر نظام الدعم، وسنستجيب لطلبك خلال مدة معقولة." },
            { h: "7. التواصل", p: "لأي استفسار حول الخصوصية، تواصل معنا عبر صفحة «تواصل معنا» أو افتح تذكرة من نظام الدعم داخل المنصة." },
        ],
    },
    en: {
        title: "Privacy Policy",
        updated: "Last updated: July 2026",
        sections: [
            { h: "1. Data We Collect", p: "We collect only what is needed to run the service: name, email, phone number, address and service location, booking details, and in-app chat content. Technicians additionally provide a verification document visible only to the administration." },
            { h: "2. How We Use Your Data", p: "We use data to dispatch requests to the nearest technician, complete bookings, send notifications about your orders, and improve service quality. We never sell your data or share it with third parties for marketing." },
            { h: "3. Data Sharing", p: "A technician sees your name, service address, and request details only after the request is assigned to them. Verification documents and account data are never exposed to other users." },
            { h: "4. Data Protection", p: "Passwords are hashed with Bcrypt and never stored in plain text, sessions are protected with JWT tokens, and all traffic runs over HTTPS with strict security headers (CSP, HSTS, and more), plus rate limiting on login attempts." },
            { h: "5. Cookies & Local Storage", p: "We use local storage for your preferences (such as language and dark mode) and session cookies for secure login only — with no advertising or tracking cookies." },
            { h: "6. Your Rights", p: "You can edit your account data at any time and request permanent deletion of your account and data through the support system; we will respond within a reasonable period." },
            { h: "7. Contact", p: "For any privacy question, reach us via the Contact Us page or open a ticket from the in-app support system." },
        ],
    },
};

export default function Privacy() {
    const { locale } = useContext(PortalContext);
    const isRtl = locale === "ar";
    const c = CONTENT[locale] || CONTENT.ar;

    return (
        <div style={wrapStyle} dir={isRtl ? "rtl" : "ltr"}>
            <div style={headStyle}>
                <div style={badgeStyle}><ShieldCheck size={24} /></div>
                <h1 style={titleStyle}>{c.title}</h1>
                <span style={updatedStyle}>{c.updated}</span>
            </div>
            {c.sections.map((s) => (
                <section key={s.h} style={sectionStyle}>
                    <h2 style={sectionTitleStyle}>{s.h}</h2>
                    <p style={sectionTextStyle}>{s.p}</p>
                </section>
            ))}
        </div>
    );
}
