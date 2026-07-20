import { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PortalContext from "../context/PortalContext";
import { serviceCategories, specialtyLabel } from "../utils/serviceCategories";
import { PALESTINE_LOCATIONS } from "../utils/locations";
import { updateProviderProfile } from "../utils/api";
import {
    ArrowLeft,
    Check,
    Loader2,
    MapPin,
    Save,
    ShieldCheck,
    Star,
    Briefcase,
    Upload,
    Wrench,
} from "lucide-react";

const pf = {
    wrap: {
        maxWidth: 720,
        margin: "0 auto",
        padding: "32px 20px 60px",
    },
    back: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "transparent",
        border: "none",
        color: "var(--text-dim, #aab3c5)",
        cursor: "pointer",
        fontSize: 14,
        marginBottom: 16,
        padding: 0,
    },
    title: { margin: "0 0 6px", fontSize: 26, fontWeight: 800 },
    subtitle: {
        margin: "0 0 28px",
        color: "var(--text-dim, #aab3c5)",
        fontSize: 14,
    },
    ratingStrip: {
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: 10,
        marginBottom: 18,
    },
    ratingItem: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        minWidth: 0,
        padding: "11px 8px",
        borderRadius: 13,
        border: "1px solid var(--border)",
        background: "var(--glass-bg)",
        color: "var(--text)",
        fontSize: 12,
        fontWeight: 700,
        textAlign: "center",
    },
    card: {
        background: "var(--card-solid)",
        border: "1px solid var(--border)",
        borderRadius: 20,
        padding: 28,
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08), var(--shadow)",
    },
    section: { marginBottom: 24 },
    label: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontWeight: 700,
        fontSize: 15,
        marginBottom: 12,
    },
    chips: { display: "flex", flexWrap: "wrap", gap: 10 },
    chip: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "8px 14px",
        borderRadius: 999,
        border: "1px solid var(--border)",
        background: "transparent",
        color: "var(--text)",
        cursor: "pointer",
        fontSize: 14,
        transition: "all 0.2s ease",
    },
    chipActive: {
        borderColor: "var(--blue)",
        background: "var(--blue-dim)",
        color: "var(--blue-bright)",
        fontWeight: 700,
    },
    row: { display: "flex", gap: 16, flexWrap: "wrap" },
    field: { flex: 1, minWidth: 200 },
    select: {
        width: "100%",
        padding: "12px 16px",
        borderRadius: 12,
        border: "1px solid var(--border)",
        background: "var(--input-bg)",
        color: "var(--text)",
        fontSize: 14,
        outline: "none",
        cursor: "pointer",
        transition: "all 0.2s ease",
    },
    input: {
        width: "100%",
        padding: "12px 16px",
        borderRadius: 12,
        border: "1px solid var(--border)",
        background: "var(--input-bg)",
        color: "var(--text)",
        fontSize: 14,
        boxSizing: "border-box",
        outline: "none",
        transition: "all 0.2s ease",
    },
    toggleRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "14px 16px",
        borderRadius: 12,
        border: "1px solid var(--border)",
        background: "var(--input-bg)",
    },
    toggleText: { fontSize: 14, fontWeight: 600 },
    saveBtn: {
        marginTop: 8,
        width: "100%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "13px 18px",
        borderRadius: 12,
        border: "none",
        background: "linear-gradient(135deg, var(--blue), var(--blue-bright))",
        color: "#fff",
        fontWeight: 700,
        fontSize: 15,
        cursor: "pointer",
        boxShadow: "0 4px 12px var(--blue-glow)",
        transition: "all 0.2s ease",
    },
    msgOk: {
        marginTop: 14,
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: "var(--green, #45c08a)",
        fontSize: 14,
        fontWeight: 600,
    },
    msgErr: {
        marginTop: 14,
        color: "var(--red, #ef5a6f)",
        fontSize: 14,
        fontWeight: 600,
    },
    hint: {
        margin: "6px 0 0",
        fontSize: 12,
        color: "var(--text-muted, #7c879b)",
    },
    uploadBox: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "12px 14px",
        borderRadius: 12,
        border: "1px dashed var(--border, rgba(255,255,255,0.25))",
        background: "var(--input-bg, rgba(255,255,255,0.04))",
        color: "var(--text, #eaeef6)",
        cursor: "pointer",
        fontSize: 14,
    },
    statusRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "14px 16px",
        borderRadius: 12,
        border: "1px solid var(--border, rgba(255,255,255,0.12))",
        background: "var(--input-bg, rgba(255,255,255,0.04))",
        marginBottom: 12,
    },
    statusOk: { fontSize: 13, fontWeight: 700, color: "var(--green, #45c08a)" },
    statusPending: { fontSize: 13, fontWeight: 700, color: "var(--amber, #f0b429)" },
    statusRejected: { fontSize: 13, fontWeight: 700, color: "var(--red, #ef5a6f)" },
    rejectionBox: {
        margin: "0 0 12px",
        padding: "12px 14px",
        borderRadius: 10,
        border: "1px solid rgba(239,90,111,.35)",
        background: "rgba(239,90,111,.10)",
        color: "var(--red, #ef5a6f)",
        fontSize: 13,
        lineHeight: 1.6,
    },
    idOk: {
        margin: "10px 0 0",
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 13,
        fontWeight: 600,
        color: "var(--green, #45c08a)",
    },
    hidden: { display: "none" },
};

export default function ProviderProfile() {
    const { user, refreshUser } = useAuth();
    const { locale } = useContext(PortalContext);
    const isRtl = locale === "ar";
    const navigate = useNavigate();

    const [specialties, setSpecialties] = useState([]);
    const [city, setCity] = useState("");
    const [area, setArea] = useState("");
    const [radius, setRadius] = useState(15);
    const [available, setAvailable] = useState(true);
    const [saving, setSaving] = useState(false);
    const [ok, setOk] = useState(false);
    const [error, setError] = useState("");
    const [idFile, setIdFile] = useState(null);

    useEffect(() => {
        if (!user) return;
        setSpecialties(Array.isArray(user.specialties) ? user.specialties : []);
        setCity(user.city || "");
        setArea(user.area || "");
        setRadius(user.serviceRadiusKm != null ? user.serviceRadiusKm : 15);
        setAvailable(user.isAvailable !== false);
    }, [user]);

    const selectedCity = useMemo(
        () => PALESTINE_LOCATIONS.find((c) => c.nameEn === city),
        [city]
    );
    const areaOptions = selectedCity?.areas || [];

    const toggleSpecialty = (key) => {
        setSpecialties((prev) =>
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        );
    };

    const onSave = async () => {
        setSaving(true);
        setOk(false);
        setError("");
        
        const radiusNum = Number(radius) || 0;
        if (radiusNum < 1 || radiusNum > 100) {
            setError(
                isRtl
                    ? "نطاق الخدمة يجب أن يكون بين 1 و 100 كم."
                    : "Service radius must be between 1 and 100 km."
            );
            setSaving(false);
            return;
        }

        try {
            const payload = {
                specialties,
                city,
                area,
                serviceRadiusKm: radiusNum,
                isAvailable: available,
            };
            if (selectedCity) {
                payload.latitude = selectedCity.lat;
                payload.longitude = selectedCity.lng;
            }
            if (idFile) payload.idDocument = idFile;
            await updateProviderProfile(payload);
            if (refreshUser) await refreshUser();
            setIdFile(null);
            setOk(true);
        } catch (e) {
            setError(
                e?.message ||
                    (isRtl ? "تعذّر حفظ التغييرات" : "Could not save changes")
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={pf.wrap} dir={isRtl ? "rtl" : "ltr"}>
            <button style={pf.back} onClick={() => navigate("/provider")}>
                <ArrowLeft size={16} />
                {isRtl ? "العودة إلى اللوحة" : "Back to dashboard"}
            </button>

            <h1 style={pf.title}>
                {isRtl ? "الملف المهني" : "Service profile"}
            </h1>
            <p style={pf.subtitle}>
                {isRtl
                    ? "حدّد تخصصاتك ومنطقة تغطيتك حتى تصلك الطلبات المناسبة لك."
                    : "Set your specialties and coverage area so the right jobs reach you."}
            </p>

            <div style={pf.ratingStrip}>
                <div style={pf.ratingItem}>
                    <Star size={16} fill="currentColor" color="#f59e0b" />
                    <span>
                        {Number(user?.rating || 0).toFixed(1)} / 5
                    </span>
                </div>
                <div style={pf.ratingItem}>
                    <span>{user?.reviewCount || 0}</span>
                    <span>{isRtl ? "تقييم" : "reviews"}</span>
                </div>
                <div style={pf.ratingItem}>
                    <Briefcase size={16} color="var(--blue-bright)" />
                    <span>{user?.completedJobs || 0}</span>
                    <span>{isRtl ? "مهمة" : "jobs"}</span>
                </div>
            </div>

            <div style={pf.card}>
                <div style={pf.section}>
                    <div style={pf.label}>
                        <Wrench size={16} />
                        {isRtl ? "التخصصات" : "Specialties"}
                    </div>
                    <div style={pf.chips}>
                        {serviceCategories.map((cat) => {
                            const activeChip = specialties.includes(cat.key);
                            return (
                                <button
                                    key={cat.key}
                                    type="button"
                                    onClick={() => toggleSpecialty(cat.key)}
                                    style={
                                        activeChip
                                            ? { ...pf.chip, ...pf.chipActive }
                                            : pf.chip
                                    }
                                >
                                    {activeChip ? <Check size={14} /> : null}
                                    {specialtyLabel(cat.key, isRtl)}
                                </button>
                            );
                        })}
                    </div>
                    <p style={pf.hint}>
                        {isRtl
                            ? "اختر خدمة واحدة أو أكثر تجيد تقديمها."
                            : "Pick one or more services you can provide."}
                    </p>
                </div>

                <div style={pf.section}>
                    <div style={pf.label}>
                        <MapPin size={16} />
                        {isRtl ? "منطقة التغطية" : "Coverage area"}
                    </div>
                    <div style={pf.row}>
                        <div style={pf.field}>
                            <select
                                style={pf.select}
                                value={city}
                                onChange={(e) => {
                                    setCity(e.target.value);
                                    setArea("");
                                }}
                            >
                                <option value="">
                                    {isRtl ? "اختر المدينة" : "Select city"}
                                </option>
                                {PALESTINE_LOCATIONS.map((c) => (
                                    <option key={c.nameEn} value={c.nameEn}>
                                        {isRtl ? c.nameAr : c.nameEn}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div style={pf.field}>
                            <select
                                style={pf.select}
                                value={area}
                                disabled={!areaOptions.length}
                                onChange={(e) => setArea(e.target.value)}
                            >
                                <option value="">
                                    {isRtl ? "كل المناطق" : "All areas"}
                                </option>
                                {areaOptions.map((a) => (
                                    <option key={a.nameEn} value={a.nameEn}>
                                        {isRtl ? a.nameAr : a.nameEn}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div style={pf.section}>
                    <div style={pf.label}>
                        {isRtl ? "نطاق الخدمة (كم)" : "Service radius (km)"}
                    </div>
                    <input
                        type="number"
                        min={1}
                        max={100}
                        style={pf.input}
                        value={radius}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === "") {
                                setRadius("");
                                return;
                            }
                            const num = Number(val);
                            if (num > 100) {
                                setRadius(100);
                            } else {
                                setRadius(val);
                            }
                        }}
                    />
                    <p style={pf.hint}>
                        {isRtl
                            ? "أقصى مسافة تقبل التنقل إليها لتنفيذ الطلبات."
                            : "The maximum distance you are willing to travel for jobs."}
                    </p>
                </div>

                <div style={pf.section}>
                    <div style={pf.label}>
                        <ShieldCheck size={16} />
                        {isRtl ? "التوثيق والهوية" : "Verification & ID"}
                    </div>

                    <div style={pf.statusRow}>
                        <span style={pf.toggleText}>
                            {isRtl ? "حالة التوثيق" : "Verification status"}
                        </span>
                        <span
                            style={user?.verificationStatus === "rejected"
                                ? pf.statusRejected
                                : user?.isVerified
                                ? pf.statusOk
                                : pf.statusPending}
                        >
                            {user?.verificationStatus === "rejected"
                                ? isRtl ? "مرفوض — يلزم التصحيح" : "Rejected — action required"
                                : user?.isVerified
                                ? isRtl ? "موثّق" : "Verified"
                                : isRtl ? "قيد المراجعة" : "Under review"}
                        </span>
                    </div>

                    {user?.verificationStatus === "rejected" && user?.verificationRejectionReason ? (
                        <div style={pf.rejectionBox}>
                            <strong>{isRtl ? "سبب الرفض: " : "Rejection reason: "}</strong>
                            {user.verificationRejectionReason}
                            <br />
                            {isRtl
                                ? "صحّح البيانات أو ارفع صورة وهوية واضحتين ثم احفظ لإعادة إرسال الطلب."
                                : "Correct the details or upload clear profile and ID images, then save to resubmit."}
                        </div>
                    ) : null}

                    <label style={pf.uploadBox}>
                        <Upload size={16} />
                        <span>
                            {idFile
                                ? idFile.name
                                : isRtl
                                ? "ارفع صورة الهوية"
                                : "Upload ID document"}
                        </span>
                        <input
                            type="file"
                            accept="image/*,application/pdf"
                            style={pf.hidden}
                            onChange={(e) =>
                                setIdFile(e.target.files?.[0] || null)
                            }
                        />
                    </label>

                    {user?.idDocument ? (
                        <p style={pf.idOk}>
                            <Check size={14} />
                            {isRtl ? "تم رفع الهوية" : "ID uploaded"}
                        </p>
                    ) : null}

                    <p style={pf.hint}>
                        {isRtl
                            ? "هويتك يطّلع عليها المشرف فقط للتحقق. يلزم رفع الهوية واستكمال التخصصات والمدينة حتى يتم اعتمادك، وتحديد المنطقة اختياري — اتركها «كل المناطق» إذا كنت تغطي المدينة كاملة."
                            : "Your ID is visible to the admin only for verification. Approval requires an ID plus completed specialties and a city. The area is optional — leave it as \"All areas\" if you cover the whole city."}
                    </p>
                </div>

                <div style={pf.section}>
                    <label style={pf.toggleRow}>
                        <span style={pf.toggleText}>
                            {isRtl
                                ? "متاح لاستقبال طلبات جديدة"
                                : "Available for new jobs"}
                        </span>
                        <input
                            type="checkbox"
                            checked={available}
                            onChange={(e) => setAvailable(e.target.checked)}
                        />
                    </label>
                </div>

                <button style={pf.saveBtn} onClick={onSave} disabled={saving}>
                    {saving ? (
                        <Loader2 size={16} className="spin" />
                    ) : (
                        <Save size={16} />
                    )}
                    {isRtl ? "حفظ التغييرات" : "Save changes"}
                </button>

                {ok ? (
                    <p style={pf.msgOk}>
                        <Check size={16} />
                        {isRtl ? "تم حفظ ملفك بنجاح" : "Your profile was saved"}
                    </p>
                ) : null}
                {error ? <p style={pf.msgErr}>{error}</p> : null}
            </div>
        </div>
    );
}
