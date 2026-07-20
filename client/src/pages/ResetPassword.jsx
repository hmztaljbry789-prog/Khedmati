import { useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { resetPassword } from "../utils/api";
import PortalContext from "../context/PortalContext";
import { Lock, Eye, EyeOff, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

const pageStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "70vh",
    padding: "40px 20px",
    fontFamily: "var(--font-body)",
};

const cardStyle = {
    width: "min(100%, 420px)",
    background: "var(--card-solid)",
    border: "1px solid var(--border)",
    borderRadius: "20px",
    padding: "32px",
    boxShadow: "var(--shadow-lg)",
};

const inputContainer = {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    position: "relative",
};

const inputLabel = {
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--text-dim)",
};

const inputStyle = {
    width: "100%",
    padding: "11px 12px 11px 40px",
    borderRadius: "12px",
    fontSize: "13px",
    outline: "none",
    background: "var(--input-bg)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    fontFamily: "var(--font-body)",
    transition: "border-color 0.2s, box-shadow 0.2s",
};

const submitBtnStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
    color: "#fff",
    background: "linear-gradient(135deg, var(--blue), var(--cyan))",
    fontFamily: "var(--font-display)",
    boxShadow: "var(--shadow-blue)",
    transition: "opacity 0.2s",
};

const alertStyle = {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: "12px 16px",
    borderRadius: "12px",
    fontSize: "13px",
    lineHeight: "1.4",
};

const translations = {
    ar: {
        title: "إعادة تعيين كلمة المرور",
        subtitle: "يرجى إدخال كلمة المرور الجديدة وتأكيدها لتحديث حسابك.",
        newPassword: "كلمة المرور الجديدة",
        confirmPassword: "تأكيد كلمة المرور الجديدة",
        submit: "حفظ كلمة المرور",
        saving: "جاري الحفظ...",
        success: "تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول.",
        login: "تسجيل الدخول",
        mismatch: "كلمتا المرور غير متطابقتين!",
        short: "يجب أن تكون كلمة المرور 8 رموز على الأقل.",
        errorGeneral: "تعذّر تغيير كلمة المرور. يرجى التحقق من الرابط والمحاولة مجدداً."
    },
    en: {
        title: "Reset Password",
        subtitle: "Please enter your new password and confirm it to update your account.",
        newPassword: "New Password",
        confirmPassword: "Confirm New Password",
        submit: "Save Password",
        saving: "Saving...",
        success: "Password changed successfully! You can now log in.",
        login: "Log In",
        mismatch: "Passwords do not match!",
        short: "Password must be at least 8 characters long.",
        errorGeneral: "Could not reset the password. Please check the link and try again."
    }
};

export default function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    const { locale, openLogin } = useContext(PortalContext);
    const isRtl = locale === "ar";
    const t = translations[locale] || translations.en;

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    
    const [showPass, setShowPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (newPassword.length < 8) {
            setError(t.short);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError(t.mismatch);
            return;
        }

        setLoading(true);
        try {
            await resetPassword(token, newPassword);
            setSuccess(true);
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            setError(err.msg || t.errorGeneral);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ ...pageStyle, direction: isRtl ? "rtl" : "ltr" }}>
            <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={cardStyle}
            >
                {/* Header */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 28 }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 14,
                        background: "linear-gradient(135deg, var(--blue), var(--cyan))",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: "var(--shadow-blue)",
                        marginBottom: 16
                    }}>
                        <Sparkles size={20} color="#fff" />
                    </div>
                    <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.4rem", color: "var(--text)", marginBottom: 8 }}>
                        {t.title}
                    </h2>
                    <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: "90%", lineHeight: 1.4 }}>
                        {t.subtitle}
                    </p>
                </div>

                {success ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{ display: "flex", flexDirection: "column", gap: 20 }}
                    >
                        <div style={{ ...alertStyle, background: "var(--green-dim)", color: "var(--green)", border: "1px solid rgba(16,185,129,0.2)" }}>
                            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                            <span>{t.success}</span>
                        </div>
                        <button 
                            type="button" 
                            onClick={() => {
                                navigate("/");
                                openLogin();
                            }} 
                            style={submitBtnStyle}
                        >
                            {t.login}
                        </button>
                    </motion.div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                        {/* New Password */}
                        <div style={inputContainer}>
                            <label style={inputLabel}>{t.newPassword}</label>
                            <div style={{ position: "relative" }}>
                                <span style={{
                                    position: "absolute",
                                    left: isRtl ? "auto" : "12px",
                                    right: isRtl ? "12px" : "auto",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "var(--text-muted)",
                                    display: "flex",
                                    alignItems: "center"
                                }}>
                                    <Lock size={15} />
                                </span>
                                <input
                                    type={showPass ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder={t.placeholderNew}
                                    required
                                    style={{
                                        ...inputStyle,
                                        paddingLeft: isRtl ? "12px" : "40px",
                                        paddingRight: isRtl ? "40px" : "12px",
                                        textAlign: isRtl ? "right" : "left"
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    style={{
                                        position: "absolute",
                                        right: isRtl ? "auto" : "12px",
                                        left: isRtl ? "12px" : "auto",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        color: "var(--text-muted)",
                                        padding: 0,
                                        display: "flex",
                                        alignItems: "center"
                                    }}
                                >
                                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div style={inputContainer}>
                            <label style={inputLabel}>{t.confirmPassword}</label>
                            <div style={{ position: "relative" }}>
                                <span style={{
                                    position: "absolute",
                                    left: isRtl ? "auto" : "12px",
                                    right: isRtl ? "12px" : "auto",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "var(--text-muted)",
                                    display: "flex",
                                    alignItems: "center"
                                }}>
                                    <Lock size={15} />
                                </span>
                                <input
                                    type={showConfirmPass ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder={t.placeholderConfirm}
                                    required
                                    style={{
                                        ...inputStyle,
                                        paddingLeft: isRtl ? "12px" : "40px",
                                        paddingRight: isRtl ? "40px" : "12px",
                                        textAlign: isRtl ? "right" : "left"
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                                    style={{
                                        position: "absolute",
                                        right: isRtl ? "auto" : "12px",
                                        left: isRtl ? "12px" : "auto",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        color: "var(--text-muted)",
                                        padding: 0,
                                        display: "flex",
                                        alignItems: "center"
                                    }}
                                >
                                    {showConfirmPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ ...alertStyle, background: "var(--red-dim)", color: "var(--red)", border: "1px solid rgba(239,68,68,0.2)" }}
                            >
                                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                                <span>{error}</span>
                            </motion.div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                ...submitBtnStyle,
                                opacity: loading ? 0.6 : 1,
                                cursor: loading ? "not-allowed" : "pointer"
                            }}
                        >
                            {loading ? t.saving : t.submit}
                        </button>
                    </form>
                )}
            </motion.div>
        </div>
    );
}
