import { useState, useContext } from "react";
import { register } from "../utils/api";
import PortalContext from "../context/PortalContext";
import { translations } from "../utils/translations";
import { Mail, Lock, Phone, User, Eye, EyeOff, Sparkles } from "lucide-react";

const inputBase = {
    width: "100%", padding: "10px 12px 10px 36px",
    borderRadius: 12, fontSize: 13, outline: "none",
    background: "var(--input-bg)",
    border: "1px solid var(--border)",
    color: "var(--text)", fontFamily: "var(--font-body)",
    transition: "border-color 0.2s",
};

const palestineCities = [
    { nameAr: "رام الله والبيرة", nameEn: "Ramallah & Al-Bireh", lat: 31.9029, lng: 35.2062 },
    { nameAr: "نابلس", nameEn: "Nablus", lat: 32.2211, lng: 35.2544 },
    { nameAr: "الخليل", nameEn: "Hebron", lat: 31.5298, lng: 35.0998 },
    { nameAr: "القدس", nameEn: "Jerusalem", lat: 31.7683, lng: 35.2137 },
    { nameAr: "بيت لحم", nameEn: "Bethlehem", lat: 31.7058, lng: 35.2007 },
    { nameAr: "جنين", nameEn: "Jenin", lat: 32.4610, lng: 35.2952 },
    { nameAr: "طولكرم", nameEn: "Tulkarm", lat: 32.3136, lng: 35.0275 },
    { nameAr: "قلقيلية", nameEn: "Qalqilya", lat: 32.1950, lng: 34.9814 },
    { nameAr: "أريحا", nameEn: "Jericho", lat: 31.8560, lng: 35.4443 },
    { nameAr: "سلفيت", nameEn: "Salfit", lat: 32.0850, lng: 35.1814 },
    { nameAr: "طوباس", nameEn: "Tubas", lat: 32.3228, lng: 35.3697 },
    { nameAr: "غزة", nameEn: "Gaza", lat: 31.5000, lng: 34.4667 },
    { nameAr: "خان يونس", nameEn: "Khan Yunis", lat: 31.3462, lng: 34.3025 },
    { nameAr: "رفح", nameEn: "Rafah", lat: 31.2842, lng: 34.2534 },
    { nameAr: "دير البلح", nameEn: "Deir al-Balah", lat: 31.4178, lng: 34.3503 },
    { nameAr: "جباليا", nameEn: "Jabalia", lat: 31.5292, lng: 34.4839 }
];

export default function Register({ onRegisterSuccess, onClose, onSwitchToLogin }) {
    const { locale } = useContext(PortalContext);
    const t = translations[locale];
    const isRtl = locale === "ar";

    const [data, setData] = useState({ 
        first_name: "", 
        last_name: "", 
        phone: "", 
        email: "", 
        password: "", 
        role: "user",
        city: "",
        latitude: 0,
        longitude: 0
    });
    const [error, setError]     = useState("");
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(""); setLoading(true);
        if (!data.city) {
            setError(isRtl ? "يرجى تحديد المدينة أولاً." : "Please select your city first.");
            setLoading(false);
            return;
        }
        try {
            const res = await register(data);
            onRegisterSuccess(res.user); onClose();
        } catch (err) {
            setError(err.msg || (isRtl ? "حدث خطأ ما. يرجى المحاولة مجدداً." : "An error occurred. Please try again."));
        } finally { setLoading(false); }
    };

    const onFocus = e => e.target.style.borderColor = "var(--blue)";
    const onBlur  = e => e.target.style.borderColor = "var(--border)";

    const inputBaseRTL = {
        ...inputBase,
        paddingLeft: isRtl ? 12 : 36,
        paddingRight: isRtl ? 36 : 12,
    };

    return (
        <div style={{ width: "min(92vw, 420px)", padding: 28, direction: isRtl ? "rtl" : "ltr" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22, textAlign: isRtl ? "right" : "left" }}>
                <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: "linear-gradient(135deg, var(--blue), var(--cyan))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "var(--shadow-blue)",
                }}>
                    <Sparkles size={15} color="#fff" />
                </div>
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.15rem", color: "var(--text)" }}>
                        {t.createAccount}
                    </h2>
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.joinUsDesc}</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Name row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                        { key: "first_name", label: t.firstName, placeholder: isRtl ? "الاسم" : "First name" },
                        { key: "last_name",  label: t.lastName,  placeholder: isRtl ? "العائلة" : "Last name" },
                    ].map(({ key, label, placeholder }) => (
                        <div key={key} style={{ display: "flex", flexDirection: "column", gap: 5, textAlign: isRtl ? "right" : "left" }}>
                            <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)" }}>{label}</label>
                            <div style={{ position: "relative" }}>
                                <User size={14} style={{ position: "absolute", right: isRtl ? 11 : "auto", left: isRtl ? "auto" : 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                                <input
                                    type="text" value={data[key]} placeholder={placeholder} required
                                    onChange={e => setData({ ...data, [key]: e.target.value })}
                                    style={{ ...inputBaseRTL, textAlign: isRtl ? "right" : "left" }} onFocus={onFocus} onBlur={onBlur}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Account Type */}
                <div style={{ display: "flex", flexDirection: "column", gap: 5, textAlign: isRtl ? "right" : "left" }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)" }}>{t.accountType}</label>
                    <div style={{ position: "relative" }}>
                        <select
                            value={data.role}
                            onChange={e => setData({ ...data, role: e.target.value })}
                            style={{
                                ...inputBase,
                                paddingLeft: isRtl ? 12 : 36,
                                paddingRight: isRtl ? 36 : 12,
                                cursor: "pointer",
                                textAlign: isRtl ? "right" : "left"
                            }}
                        >
                            <option value="user">{t.customerRole}</option>
                            <option value="provider">{t.providerRole}</option>
                        </select>
                    </div>
                </div>

                {/* City Selection */}
                <div style={{ display: "flex", flexDirection: "column", gap: 5, textAlign: isRtl ? "right" : "left" }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)" }}>
                        {isRtl ? "المدينة / المنطقة" : "City / Region"}
                    </label>
                    <div style={{ position: "relative" }}>
                        <select
                            value={data.city}
                            required
                            onChange={e => {
                                const matched = palestineCities.find(c => c.nameEn === e.target.value);
                                if (matched) {
                                    setData({
                                        ...data,
                                        city: matched.nameEn,
                                        latitude: matched.lat,
                                        longitude: matched.lng
                                    });
                                }
                            }}
                            style={{
                                ...inputBase,
                                paddingLeft: isRtl ? 12 : 36,
                                paddingRight: isRtl ? 36 : 12,
                                cursor: "pointer",
                                textAlign: isRtl ? "right" : "left"
                            }}
                        >
                            <option value="">{isRtl ? "اختر المدينة..." : "Select City..."}</option>
                            {palestineCities.map(c => (
                                <option key={c.nameEn} value={c.nameEn}>
                                    {isRtl ? c.nameAr : c.nameEn}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Phone */}
                <div style={{ display: "flex", flexDirection: "column", gap: 5, textAlign: isRtl ? "right" : "left" }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)" }}>{t.phoneNumber}</label>
                    <div style={{ position: "relative" }}>
                        <Phone size={14} style={{ position: "absolute", right: isRtl ? 11 : "auto", left: isRtl ? "auto" : 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                        <input
                            type="tel" value={data.phone} placeholder={isRtl ? "رقم الهاتف (10 أرقام)" : "Phone number (10 digits)"}
                            pattern="[0-9]{10}" maxLength="10" required
                            onChange={e => setData({ ...data, phone: e.target.value.replace(/\D/g, "") })}
                            style={{ ...inputBaseRTL, textAlign: isRtl ? "right" : "left" }} onFocus={onFocus} onBlur={onBlur}
                        />
                    </div>
                </div>

                {/* Email */}
                <div style={{ display: "flex", flexDirection: "column", gap: 5, textAlign: isRtl ? "right" : "left" }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)" }}>{t.emailLabel}</label>
                    <div style={{ position: "relative" }}>
                        <Mail size={14} style={{ position: "absolute", right: isRtl ? 11 : "auto", left: isRtl ? "auto" : 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                        <input
                            type="email" value={data.email} placeholder="name@example.com" required
                            onChange={e => setData({ ...data, email: e.target.value })}
                            style={{ ...inputBaseRTL, textAlign: isRtl ? "right" : "left" }} onFocus={onFocus} onBlur={onBlur}
                        />
                    </div>
                </div>

                {/* Password */}
                <div style={{ display: "flex", flexDirection: "column", gap: 5, textAlign: isRtl ? "right" : "left" }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)" }}>{t.password}</label>
                    <div style={{ position: "relative" }}>
                        <Lock size={14} style={{ position: "absolute", right: isRtl ? 11 : "auto", left: isRtl ? "auto" : 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                        <input
                            type={showPass ? "text" : "password"} value={data.password}
                            placeholder={t.chooseSecurePassword} required
                            onChange={e => setData({ ...data, password: e.target.value })}
                            style={{ ...inputBaseRTL, paddingLeft: 36, paddingRight: 36, textAlign: isRtl ? "right" : "left" }} onFocus={onFocus} onBlur={onBlur}
                        />
                        <button type="button" onClick={() => setShowPass(v => !v)} style={{
                            position: "absolute", left: isRtl ? 11 : "auto", right: isRtl ? "auto" : 11, top: "50%", transform: "translateY(-50%)",
                            background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)",
                        }}>
                            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                    </div>
                </div>

                {error && (
                    <div style={{
                        fontSize: 12, padding: "8px 12px", borderRadius: 10,
                        background: "var(--red-dim)", color: "var(--red)",
                        border: "1px solid rgba(239,68,68,0.3)",
                        textAlign: isRtl ? "right" : "left"
                    }}>{error}</div>
                )}

                <button type="submit" disabled={loading} className="btn-glow" style={{
                    padding: "12px", borderRadius: 12, fontSize: 13, fontWeight: 700,
                    background: "linear-gradient(135deg, var(--blue), var(--cyan))",
                    color: "#fff", border: "none", cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1, marginTop: 4,
                    fontFamily: "var(--font-display)",
                }}>
                    {loading ? (isRtl ? "جاري إنشاء الحساب..." : "Creating account...") : t.registerBtn}
                </button>

                <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
                    {t.alreadyHaveAccount}{" "}
                    <button type="button"
                        onClick={(e) => { e.preventDefault(); onClose(); onSwitchToLogin(); }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--blue-bright)", fontWeight: 600, fontSize: 13 }}
                    >{t.loginBtn}</button>
                </p>
            </form>
        </div>
    );
}
