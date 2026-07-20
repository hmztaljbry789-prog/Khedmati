import { useContext, useEffect, useState } from "react";
import { Camera, Lock, Save, User, Key, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import PortalContext from "../context/PortalContext";
import { changePassword, updateAccount } from "../utils/api";
import { photoUrl } from "../utils/photoUrl";

export default function AccountSettings() {
    const { user, setUser, refreshUser, logout } = useAuth();
    const { locale } = useContext(PortalContext);
    const ar = locale === "ar";

    const [names, setNames] = useState({ first_name: "", last_name: "" });
    const [file, setFile] = useState(null);
    const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirm: "" });
    const [status, setStatus] = useState({ type: "", text: "" });
    const [saving, setSaving] = useState(false);

    // Keep local name fields in sync with the authenticated user.
    useEffect(() => {
        if (user) {
            setNames({ first_name: user.first_name || "", last_name: user.last_name || "" });
        }
    }, [user]);

    const preview = file
        ? URL.createObjectURL(file)
        : photoUrl(user?.profilePhoto, "/logo-192.png");

    async function saveProfile() {
        try {
            setSaving(true);
            setStatus({ type: "", text: "" });
            const result = await updateAccount({ ...names, profilePhoto: file });

            // Optimistically update the user state so the new photo is visible
            // immediately across the whole app (Navbar, admin, bookings, etc.).
            if (result?.success && result.user) {
                setUser(result.user);
            }
            // Also refresh from the server to guarantee consistency.
            await refreshUser();
            setFile(null);
            setStatus({
                type: "success",
                text: ar ? "تم تحديث الملف الشخصي بنجاح!" : "Profile updated successfully!"
            });
        } catch (error) {
            setStatus({
                type: "error",
                text: error?.message || (ar ? "تعذّر حفظ التعديلات" : "Could not save profile")
            });
        } finally {
            setSaving(false);
        }
    }

    async function savePassword() {
        if (passwords.newPassword.length < 10 || passwords.newPassword !== passwords.confirm) {
            setStatus({
                type: "error",
                text: ar ? "تحقق من تطابق كلمة المرور وأنها 10 أحرف على الأقل" : "Passwords must match and contain at least 10 characters"
            });
            return;
        }
        try {
            setStatus({ type: "", text: "" });
            await changePassword(passwords.currentPassword, passwords.newPassword);
            setStatus({
                type: "success",
                text: ar ? "تم تغيير كلمة المرور بنجاح، جاري تسجيل الخروج..." : "Password changed successfully, logging out..."
            });
            setTimeout(() => logout(), 2000);
        } catch (error) {
            setStatus({
                type: "error",
                text: error?.message || (ar ? "تعذّر تغيير كلمة المرور" : "Could not change password")
            });
        }
    }

    const styles = {
        container: Object.assign({
            maxWidth: "900px",
            margin: "0 auto",
            padding: "40px 20px 80px",
            fontFamily: "var(--font-cairo, 'Cairo', sans-serif)",
            color: "var(--text)"
        }),
        title: Object.assign({
            fontSize: "28px",
            fontWeight: 800,
            marginBottom: "30px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            borderBottom: "1px solid var(--border)",
            paddingBottom: "15px"
        }),
        grid: Object.assign({
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px"
        }),
        card: Object.assign({
            background: "var(--card-solid)",
            border: "1px solid var(--border)",
            borderRadius: "20px",
            padding: "28px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
            display: "flex",
            flexDirection: "column",
            gap: "20px"
        }),
        sectionHeader: Object.assign({
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "18px",
            fontWeight: 700,
            color: "var(--blue-bright)",
            borderBottom: "1px solid var(--border)",
            paddingBottom: "12px"
        }),
        photoSection: Object.assign({
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
            margin: "10px 0"
        }),
        photoWrapper: Object.assign({
            position: "relative",
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            padding: "4px",
            background: "linear-gradient(135deg, var(--blue), var(--cyan))",
            boxShadow: "0 8px 20px rgba(59, 130, 246, 0.25)"
        }),
        photoImg: Object.assign({
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            objectFit: "cover"
        }),
        cameraBtn: Object.assign({
            position: "absolute",
            bottom: "0",
            right: "0",
            background: "var(--blue)",
            color: "#ffffff",
            border: "none",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
            transition: "transform 0.2s"
        }),
        formGroup: Object.assign({
            display: "flex",
            flexDirection: "column",
            gap: "8px"
        }),
        label: Object.assign({
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--text-dim)"
        }),
        input: Object.assign({
            width: "100%",
            boxSizing: "border-box",
            padding: "12px 16px",
            borderRadius: "12px",
            border: "1px solid var(--border)",
            background: "var(--input-bg)",
            color: "var(--text)",
            fontSize: "14px",
            outline: "none",
            transition: "all 0.2s ease"
        }),
        submitBtn: Object.assign({
            padding: "13px 24px",
            border: "none",
            borderRadius: "12px",
            background: "linear-gradient(135deg, var(--blue), var(--blue-bright))",
            color: "#ffffff",
            fontWeight: 700,
            fontSize: "14px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            cursor: "pointer",
            boxShadow: "0 4px 12px var(--blue-glow)",
            transition: "all 0.2s ease"
        }),
        alert: (type) => Object.assign({
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "14px 18px",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: 500,
            marginTop: "20px",
            background: type === "success" ? "var(--green-dim)" : "var(--red-dim)",
            border: `1px solid ${type === "success" ? "var(--green)" : "var(--red)"}`,
            color: type === "success" ? "var(--green)" : "var(--red)"
        }),
        roleBadge: Object.assign({
            display: "inline-block",
            padding: "4px 10px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: 700,
            marginTop: "4px",
            background: "rgba(255, 255, 255, 0.08)",
            color: "var(--text-muted)"
        })
    };

    return (
        <main style={styles.container} dir={ar ? "rtl" : "ltr"}>
            <h1 style={styles.title}>
                <User size={28} style={Object.assign({ color: "var(--blue-bright)" })} />
                {ar ? "إعدادات الحساب" : "Account Settings"}
            </h1>

            {status.text && (
                <div style={styles.alert(status.type)}>
                    {status.type === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                    <span>{status.text}</span>
                </div>
            )}

            <div style={styles.grid}>
                <section style={styles.card}>
                    <h2 style={styles.sectionHeader}>
                        <User size={18} />
                        {ar ? "الملف الشخصي" : "Profile Details"}
                    </h2>

                    <div style={styles.photoSection}>
                        <div style={styles.photoWrapper}>
                            <img
                                src={preview}
                                alt=""
                                style={styles.photoImg}
                                onError={(e) => { console.error("[photo] failed to load:", e.target.src); e.target.onerror = null; e.target.src = "/logo-192.png"; }}
                            />
                            <label style={styles.cameraBtn} title={ar ? "تغيير الصورة" : "Change photo"}>
                                <Camera size={16} />
                                <input
                                    hidden
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    onChange={(event) => setFile(event.target.files?.[0] || null)}
                                />
                            </label>
                        </div>
                        {user?.role && (
                            <span style={styles.roleBadge}>
                                {ar ? "نوع الحساب: " : "Role: "}
                                {user.role === "admin" ? (ar ? "مدير" : "Admin")
                                    : user.role === "provider" ? (ar ? "مزود خدمة" : "Service Provider")
                                    : (ar ? "زبون" : "Customer")}
                            </span>
                        )}
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>{ar ? "الاسم الأول" : "First Name"}</label>
                        <input
                            style={styles.input}
                            value={names.first_name}
                            onChange={(event) => setNames({ ...names, first_name: event.target.value })}
                            placeholder={ar ? "الاسم الأول" : "First Name"}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>{ar ? "اسم العائلة" : "Last Name"}</label>
                        <input
                            style={styles.input}
                            value={names.last_name}
                            onChange={(event) => setNames({ ...names, last_name: event.target.value })}
                            placeholder={ar ? "اسم العائلة" : "Last Name"}
                        />
                    </div>

                    <button style={styles.submitBtn} onClick={saveProfile} disabled={saving}>
                        {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                        {ar ? "حفظ التغييرات" : "Save Profile"}
                    </button>
                </section>

                <section style={styles.card}>
                    <h2 style={styles.sectionHeader}>
                        <Lock size={18} />
                        {ar ? "تغيير كلمة المرور" : "Change Password"}
                    </h2>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>{ar ? "كلمة المرور الحالية" : "Current Password"}</label>
                        <input
                            type="password"
                            style={styles.input}
                            value={passwords.currentPassword}
                            placeholder={ar ? "أدخل كلمة المرور الحالية" : "Enter current password"}
                            onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>{ar ? "كلمة المرور الجديدة" : "New Password"}</label>
                        <input
                            type="password"
                            style={styles.input}
                            value={passwords.newPassword}
                            placeholder={ar ? "كلمة المرور الجديدة (10 أحرف كحد أدنى)" : "New password (min 10 chars)"}
                            onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>{ar ? "تأكيد كلمة المرور" : "Confirm New Password"}</label>
                        <input
                            type="password"
                            style={styles.input}
                            value={passwords.confirm}
                            placeholder={ar ? "تأكيد كلمة المرور الجديدة" : "Confirm new password"}
                            onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })}
                        />
                    </div>

                    <button style={styles.submitBtn} onClick={savePassword}>
                        <Key size={16} />
                        {ar ? "تحديث كلمة المرور" : "Update Password"}
                    </button>
                </section>
            </div>
        </main>
    );
}
