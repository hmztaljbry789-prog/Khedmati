import { useContext } from "react";
import { ScrollText } from "lucide-react";
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
        title: "شروط الاستخدام",
        updated: "آخر تحديث: يوليو 2026",
        sections: [
            { h: "1. استخدام المنصة", p: "باستخدامك منصة «خدمتي» فأنت توافق على هذه الشروط. المنصة وسيط يربط بين طالبي الخدمات المنزلية والفنيين المستقلين، وتُستخدم للأغراض المشروعة فقط." },
            { h: "2. الحسابات", p: "أنت مسؤول عن دقة بيانات حسابك وعن الحفاظ على سرية كلمة المرور. يحق للإدارة تعليق أي حساب يخالف الشروط أو يسيء استخدام المنصة." },
            { h: "3. الحجوزات والأسعار", p: "الأسعار الأساسية المعلنة تقديرية، والسعر النهائي يُتفق عليه مع الفني بعد المعاينة وقبل بدء التنفيذ. يمكن إلغاء الحجز قبل بدء العمل دون أي رسوم." },
            { h: "4. التزامات الفني", p: "يلتزم الفني بتوثيق هويته لدى الإدارة، وتنفيذ الأعمال المقبولة بجودة واحترافية وفي الموعد المتفق عليه، وبالتواصل مع العميل عبر المنصة." },
            { h: "5. السلوك والمحتوى", p: "يُمنع نشر محتوى مسيء أو مضلل في المحادثات والتقييمات. التقييمات يجب أن تعكس تجربة حقيقية، ويحق للإدارة إزالة أي محتوى مخالف." },
            { h: "6. حدود المسؤولية", p: "تعمل المنصة على اعتماد الفنيين ومتابعة الجودة، إلا أن عقد تنفيذ الخدمة يبقى بين العميل والفني. لا تتحمل المنصة مسؤولية الأضرار الناتجة عن سوء التنفيذ، مع التزامها بمتابعة الشكاوى عبر نظام الدعم واتخاذ الإجراءات المناسبة." },
            { h: "7. تعديل الشروط", p: "قد تُحدَّث هذه الشروط من وقت لآخر، وسيُعلن عن أي تغيير جوهري داخل المنصة. استمرارك في الاستخدام بعد التحديث يعني موافقتك على الشروط المعدلة." },
        ],
    },
    en: {
        title: "Terms of Use",
        updated: "Last updated: July 2026",
        sections: [
            { h: "1. Using the Platform", p: "By using Khedmati you agree to these terms. The platform is an intermediary connecting home-service customers with independent technicians, and must be used for lawful purposes only." },
            { h: "2. Accounts", p: "You are responsible for the accuracy of your account information and for keeping your password confidential. The administration may suspend any account that violates these terms or abuses the platform." },
            { h: "3. Bookings & Pricing", p: "Published base prices are estimates; the final price is agreed with the technician after inspection and before work begins. Bookings can be cancelled before work starts at no charge." },
            { h: "4. Technician Obligations", p: "Technicians must verify their identity with the administration, deliver accepted work professionally and on time, and communicate with customers through the platform." },
            { h: "5. Conduct & Content", p: "Abusive or misleading content in chats and reviews is prohibited. Reviews must reflect a genuine experience, and the administration may remove violating content." },
            { h: "6. Limitation of Liability", p: "The platform verifies technicians and monitors quality; however, the service contract remains between the customer and the technician. The platform is not liable for damages caused by poor execution, while remaining committed to handling complaints through the support system." },
            { h: "7. Changes to the Terms", p: "These terms may be updated from time to time, and material changes will be announced in the platform. Continued use after an update means you accept the revised terms." },
        ],
    },
};

export default function Terms() {
    const { locale } = useContext(PortalContext);
    const isRtl = locale === "ar";
    const c = CONTENT[locale] || CONTENT.ar;

    return (
        <div style={wrapStyle} dir={isRtl ? "rtl" : "ltr"}>
            <div style={headStyle}>
                <div style={badgeStyle}><ScrollText size={24} /></div>
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
