import { useState, useContext } from "react";
import { login, forgotPassword, resetPassword } from "../utils/api";
import PortalContext from "../context/PortalContext";
import { translations } from "../utils/translations";
import { Mail, Lock, Eye, EyeOff, Sparkles } from "lucide-react";

const inputStyle = {
    width: "100%", padding: "10px 12px 10px 36px",
    borderRadius: 12, fontSize: 13, outline: "none",
    background: "var(--input-bg)",
    border: "1px solid var(--border)",
    color: "var(--text)", fontFamily: "var(--font-body)",
    transition: "border-color 0.2s",
};

const rememberRowStyle = {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginTop: 4, marginBottom: 4,
};
const rememberLabelStyle = {
    display: "flex", alignItems: "center", gap: 6,
    fontSize: 12, color: "var(--text)", cursor: "pointer",
    fontFamily: "var(--font-body)",
};
const linkBtnStyle = {
    background: "none", border: "none", padding: 0, cursor: "pointer",
    color: "var(--blue)", fontSize: 12, fontFamily: "var(--font-body)",
    textDecoration: "underline",
};
const infoBoxStyle = {
    background: "var(--input-bg)", border: "1px solid var(--border)",
    borderRadius: 12, padding: "10px 12px", fontSize: 12,
    color: "var(--text)", wordBreak: "break-all", marginBottom: 4,
    fontFamily: "var(--font-body)",
};
const formColStyle = {
    display: "flex", flexDirection: "column", gap: 12,
};
const plainInputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: 12, fontSize: 13,
    outline: "none", background: "var(--input-bg)",
    border: "1px solid var(--border)", color: "var(--text)",
    fontFamily: "var(--font-body)",
};
const submitBtnStyle = {
    width: "100%", padding: "11px 12px", borderRadius: 12, fontSize: 14,
    border: "none", cursor: "pointer", color: "#fff",
    background: "var(--blue)", fontFamily: "var(--font-body)",
};

export default function Login({ onLoginSuccess, onClose, onSwitchToRegister }) {
    const { locale } = useContext(PortalContext);
    const t = translations[locale];
    const isRtl = locale === "ar";

    const [data, setData]       = useState({ emailOrPhone: "", password: "" });
    const [error, setError]     = useState("");
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [remember, setRemember] = useState(true);
    // mode: "login" | "forgot" | "reset"
    const [mode, setMode] = useState("login");
    const [resetToken, setResetToken] = useState("");
    const [newPass, setNewPass] = useState("");
    const [info, setInfo] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(""); setLoading(true);
        try {
            const res = await login({
                email: data.emailOrPhone.includes("@") ? data.emailOrPhone : undefined,
                phone: !data.emailOrPhone.includes("@") ? data.emailOrPhone : undefined,
                password: data.password,
                rememberMe: remember,
            });
            onLoginSuccess(res.user); onClose();
        } catch (err) {
            setError(err.msg || (isRtl ? "بيانات الدخول غير صحيحة." : "Invalid credentials. Please try again."));
        } finally { setLoading(false); }
    };

    const handleForgot = async (e) => {
        e.preventDefault(); setError(""); setInfo(""); setLoading(true);
        try {
            const res = await forgotPassword(data.emailOrPhone);
            // In development the backend returns the reset token directly so the
            // flow can be completed end-to-end without an email service.
            if (res.resetToken) {
                setResetToken(res.resetToken);
                setMode("reset");
                setInfo(isRtl
                    ? "تم إنشاء رابط إعادة التعيين. أدخل كلمة المرور الجديدة."
                    : "A reset link was generated. Enter your new password.");
            } else {
                setInfo(isRtl
                    ? "إذا كان الحساب موجوداً فقد تم إرسال رابط إعادة التعيين."
                    : "If the account exists, a reset link has been sent.");
            }
        } catch (err) {
            setError(err.msg || (isRtl ? "تعذّر إرسال الطلب." : "Could not process the request."));
        } finally { setLoading(false); }
    };

    const handleReset = async (e) => {
        e.preventDefault(); setError(""); setInfo(""); setLoading(true);
        try {
            await resetPassword(resetToken, newPass);
            setInfo(isRtl
                ? "تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن."
                : "Password changed successfully. You can sign in now.");
            setMode("login");
            setNewPass("");
        } catch (err) {
            setError(err.msg || (isRtl ? "تعذّر تغيير كلمة المرور." : "Could not reset the password."));
        } finally { setLoading(false); }
    };

    return (
        <div style={{ width: "min(92vw, 380px)", padding: 28, direction: isRtl ? "rtl" : "ltr" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24, textAlign: isRtl ? "right" : "left" }}>
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
                        {t.welcomeBack}
                    </h2>
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {isRtl ? `قم بتسجيل الدخول إلى حسابك في ${t.brand}` : `Sign in to your account on ${t.brand}`}
                    </p>
                </div>
            </div>

            {mode === "login" && (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Email/Phone */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, textAlign: isRtl ? "right" : "left" }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)" }}>{t.emailOrPhone}</label>
                    <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", right: isRtl ? 11 : "auto", left: isRtl ? "auto" : 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}><Mail size={14} /></span>
                        <input
                            type="text" value={data.emailOrPhone} placeholder={isRtl ? "البريد الإلكتروني أو رقم الهاتف" : "Email or phone number"} required
                            onChange={e => setData({ ...data, emailOrPhone: e.target.value })}
                            style={{ ...inputStyle, paddingLeft: isRtl ? 12 : 36, paddingRight: isRtl ? 36 : 12, textAlign: isRtl ? "right" : "left" }}
                            onFocus={e => e.target.style.borderColor = "var(--blue)"}
                            onBlur={e => e.target.style.borderColor = "var(--border)"}
                        />
                    </div>
                </div>

                {/* Password */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6, textAlign: isRtl ? "right" : "left" }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text-dim)" }}>{t.password}</label>
                    <div style={{ position: "relative" }}>
                        <span style={{ position: "absolute", right: isRtl ? 11 : "auto", left: isRtl ? "auto" : 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}><Lock size={14} /></span>
                        <input
                            type={showPass ? "text" : "password"} value={data.password}
                            placeholder="••••••••" required
                            onChange={e => setData({ ...data, password: e.target.value })}
                            style={{ ...inputStyle, paddingLeft: isRtl ? 36 : 36, paddingRight: isRtl ? 36 : 36, textAlign: isRtl ? "right" : "left" }}
                            onFocus={e => e.target.style.borderColor = "var(--blue)"}
                            onBlur={e => e.target.style.borderColor = "var(--border)"}
                        />
                        <button type="button" onClick={() => setShowPass(v => !v)} style={{
                            position: "absolute", left: isRtl ? 11 : "auto", right: isRtl ? "auto" : 11, top: "50%", transform: "translateY(-50%)",
                            background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)",
                        }}>
                            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                    </div>
                </div>

                <div style={rememberRowStyle}>
                    <label style={rememberLabelStyle}>
                        <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
                        {t.rememberMe}
                    </label>
                    <button type="button" style={linkBtnStyle} onClick={() => { setMode("forgot"); setError(""); setInfo(""); }}>
                        {isRtl ? "نسيت كلمة المرور؟" : "Forgot password?"}
                    </button>
                </div>

                {info && (
                    <div style={infoBoxStyle}>{info}</div>
                )}

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
                    {loading ? (isRtl ? "جاري الدخول..." : "Signing in...") : t.signIn}
                </button>

                <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
                    {t.noAccount}{" "}
                    <button type="button"
                        onClick={(e) => { e.preventDefault(); onClose(); onSwitchToRegister(); }}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--blue-bright)", fontWeight: 600, fontSize: 13 }}
                    >{t.createAccount}</button>
                </p>
            </form>
            )}

            {mode === "forgot" && (
                <form onSubmit={handleForgot} style={formColStyle}>
                    <p style={rememberLabelStyle}>
                        {isRtl
                            ? "أدخل بريدك الإلكتروني أو رقم هاتفك لاستعادة كلمة المرور."
                            : "Enter your email or phone to recover your password."}
                    </p>
                    <input
                        type="text"
                        value={data.emailOrPhone}
                        placeholder={isRtl ? "البريد الإلكتروني أو رقم الهاتف" : "Email or phone number"}
                        required
                        onChange={e => setData({ ...data, emailOrPhone: e.target.value })}
                        style={plainInputStyle}
                    />
                    {info && (<div style={infoBoxStyle}>{info}</div>)}
                    {error && (<div style={infoBoxStyle}>{error}</div>)}
                    <button type="submit" disabled={loading} style={submitBtnStyle}>
                        {loading ? (isRtl ? "جاري الإرسال..." : "Sending...") : (isRtl ? "إرسال رابط الاستعادة" : "Send reset link")}
                    </button>
                    <button type="button" style={linkBtnStyle} onClick={() => { setMode("login"); setError(""); setInfo(""); }}>
                        {isRtl ? "العودة لتسجيل الدخول" : "Back to sign in"}
                    </button>
                </form>
            )}

            {mode === "reset" && (
                <form onSubmit={handleReset} style={formColStyle}>
                    <p style={rememberLabelStyle}>
                        {isRtl ? "أدخل كلمة المرور الجديدة." : "Enter your new password."}
                    </p>
                    <input
                        type="password"
                        value={newPass}
                        placeholder={isRtl ? "كلمة المرور الجديدة" : "New password"}
                        required
                        minLength={6}
                        onChange={e => setNewPass(e.target.value)}
                        style={plainInputStyle}
                    />
                    {info && (<div style={infoBoxStyle}>{info}</div>)}
                    {error && (<div style={infoBoxStyle}>{error}</div>)}
                    <button type="submit" disabled={loading} style={submitBtnStyle}>
                        {loading ? (isRtl ? "جاري الحفظ..." : "Saving...") : (isRtl ? "تعيين كلمة المرور" : "Set new password")}
                    </button>
                    <button type="button" style={linkBtnStyle} onClick={() => { setMode("login"); setError(""); setInfo(""); }}>
                        {isRtl ? "العودة لتسجيل الدخول" : "Back to sign in"}
                    </button>
                </form>
            )}
        </div>
    );
}
