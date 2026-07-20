import { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PortalContext from "../context/PortalContext";
import { createBooking, approveBooking, reassignBooking } from "../utils/api";
import { X, MapPin, User, Phone, Check, RefreshCw, CheckCircle2, Loader } from "lucide-react";
import { localizeCity, localizeAddress } from "../utils/localize";
import useFocusTrap from "../utils/useFocusTrap";

const s = {
    overlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(8, 9, 15, 0.6)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 1000,
    },
    card: {
        position: "relative",
        width: "100%",
        maxWidth: 440,
        background: "var(--card-solid)",
        border: "1px solid var(--border, rgba(255,255,255,0.08))",
        borderRadius: 22,
        padding: "28px 24px",
        color: "var(--text, #eaeef6)",
        boxShadow: "var(--shadow-lg)",
        backdropFilter: "blur(12px)",
        maxHeight: "90vh",
        overflowY: "auto",
    },
    close: {
        position: "absolute",
        top: 14,
        insetInlineEnd: 14,
        background: "var(--input-bg, rgba(255,255,255,0.05))",
        border: "1px solid var(--border, rgba(255,255,255,0.08))",
        color: "var(--text-dim, #aab3c5)",
        borderRadius: 10,
        width: 32,
        height: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
    },
    title: {
        fontFamily: "var(--font-display)",
        fontSize: 20,
        fontWeight: 700,
        margin: "0 0 18px",
    },
    serviceRow: {
        display: "flex",
        gap: 12,
        alignItems: "center",
        padding: 12,
        background: "var(--input-bg, rgba(255,255,255,0.04))",
        border: "1px solid var(--border, rgba(255,255,255,0.08))",
        borderRadius: 12,
        marginBottom: 12,
    },
    serviceImg: {
        width: 48,
        height: 48,
        borderRadius: 10,
        objectFit: "cover",
    },
    serviceTitle: {
        margin: 0,
        fontWeight: 600,
        fontSize: 14,
    },
    servicePrice: {
        margin: "2px 0 0",
        color: "var(--blue-bright, #5b8cff)",
        fontWeight: 700,
        fontSize: 14,
    },
    addressRow: {
        display: "flex",
        gap: 8,
        alignItems: "center",
        fontSize: 13,
        color: "var(--text-dim, #aab3c5)",
        marginBottom: 16,
    },
    center: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        padding: "18px 0",
        textAlign: "center",
    },
    dim: {
        margin: 0,
        color: "var(--text-dim, #aab3c5)",
        fontSize: 13,
    },
    errText: {
        margin: 0,
        color: "var(--red, #f87171)",
        fontSize: 13,
    },
    proposeBox: {
        marginTop: 4,
    },
    proposeLabel: {
        margin: "0 0 8px",
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        color: "var(--text-muted, #7c8499)",
    },
    providerRow: {
        display: "flex",
        gap: 12,
        alignItems: "center",
        padding: 14,
        background: "var(--input-bg, rgba(255,255,255,0.04))",
        border: "1px solid var(--border-blue, rgba(91,140,255,0.3))",
        borderRadius: 12,
    },
    avatar: {
        width: 42,
        height: 42,
        borderRadius: "50%",
        background: "var(--blue-dim, rgba(91,140,255,0.15))",
        color: "var(--blue-bright, #5b8cff)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    providerName: {
        margin: 0,
        fontWeight: 700,
        fontSize: 15,
    },
    phone: {
        margin: "4px 0 0",
        display: "flex",
        gap: 6,
        alignItems: "center",
        fontSize: 13,
        color: "var(--text-dim, #aab3c5)",
    },
    hint: {
        margin: "14px 0",
        fontSize: 13,
        color: "var(--text-dim, #aab3c5)",
    },
    actions: {
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
    },
    approveBtn: {
        flex: 1,
        minWidth: 140,
        display: "flex",
        gap: 8,
        alignItems: "center",
        justifyContent: "center",
        padding: "11px 14px",
        border: "none",
        borderRadius: 10,
        background: "linear-gradient(135deg, var(--blue), var(--cyan))",
        color: "#fff",
        fontWeight: 700,
        boxShadow: "0 6px 18px rgba(59, 130, 246, 0.30)",
        cursor: "pointer",
    },
    reassignBtn: {
        flex: 1,
        minWidth: 140,
        display: "flex",
        gap: 8,
        alignItems: "center",
        justifyContent: "center",
        padding: "11px 14px",
        borderRadius: 10,
        background: "transparent",
        border: "1px solid var(--border, rgba(255,255,255,0.15))",
        color: "var(--text, #eaeef6)",
        fontWeight: 600,
        cursor: "pointer",
    },
    secondaryBtn: {
        padding: "10px 16px",
        borderRadius: 10,
        background: "linear-gradient(135deg, var(--blue), var(--cyan))",
        border: "none",
        color: "#fff",
        fontWeight: 600,
        cursor: "pointer",
    },
    doneText: {
        margin: 0,
        fontWeight: 700,
        fontSize: 16,
    },
    slotRow: {
        display: "flex",
        gap: 12,
        alignItems: "center",
        padding: 12,
        background: "var(--input-bg, rgba(255,255,255,0.04))",
        border: "1px solid var(--border-blue, rgba(91,140,255,0.3))",
        borderRadius: 12,
        marginBottom: 10,
    },
    slotInfo: {
        flex: 1,
        minWidth: 0,
    },
    slotSwapBtn: {
        flexShrink: 0,
        width: 36,
        height: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
        background: "transparent",
        border: "1px solid var(--border, rgba(255,255,255,0.15))",
        color: "var(--text, #eaeef6)",
        cursor: "pointer",
    },
};

export default function BookingModal({ service, onClose }) {
    const { user, isAuthenticated } = useAuth();
    const { address, coords, locationMeta, openLogin, openAddress, locale } = useContext(PortalContext);
    const isRtl = locale === "ar";
    const navigate = useNavigate();

    const [step, setStep] = useState("loading"); // loading | propose | nomore | done | error
    const [booking, setBooking] = useState(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    // Guards against duplicate bookings: a stable idempotency key for this modal
    // instance plus an in-flight ref so a double click / Strict-Mode double mount
    // can never fire two create requests.
    const idempotencyKeyRef = useRef(
        `bk_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
    );
    const submittingRef = useRef(false);
    const cardRef = useRef(null);
    useFocusTrap(cardRef, true);
    const hasSubmittedRef = useRef(false);

    useEffect(() => {
        if (!isAuthenticated || !user?._id) {
            openLogin();
            onClose();
            return;
        }
        if (!address) {
            openAddress();
            onClose();
            return;
        }
        if (!hasSubmittedRef.current) submit();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const submit = async () => {
        // Block re-entrancy: only one create request may ever be in flight, and
        // a successful submission is never repeated for the same modal instance.
        if (submittingRef.current || hasSubmittedRef.current) return;
        submittingRef.current = true;
        setStep("loading");
        setError("");
        try {
            const res = await createBooking({
                userId: user._id,
                idempotencyKey: idempotencyKeyRef.current,
                item: {
                    serviceId: service._id,
                    image: service.image,
                    title: service.title,
                    titleAr: service.titleAr || "",
                    quantity: 1,
                    category: service.category,
                    requiredTechnicians: service.requiredTechnicians || 1,
                    price: service.OurPrice,
                    suggestedPrice: service.OurPrice,
                    priceRange: { min: service.minPrice, max: service.maxPrice },
                },
                customerDetails: {
                    name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
                    email: user.email,
                    phone: user.phone,
                    address,
                    city: locationMeta?.city || "",
                    area: locationMeta?.area || "",
                },
                coords: coords && typeof coords.lat === "number" ? coords : null,
            });
            const bk = res.booking;
            hasSubmittedRef.current = true;
            setBooking(bk);
            setStep(bk && bk.provider ? "propose" : "nomore");
        } catch (e) {
            setError(e?.message || (isRtl ? "تعذّر إنشاء الحجز" : "Could not create booking"));
            setStep("error");
        } finally {
            submittingRef.current = false;
        }
    };

    const handleApprove = async () => {
        if (!booking) return;
        setBusy(true);
        try {
            await approveBooking(booking._id);
            setStep("done");
            setTimeout(() => {
                onClose();
                navigate("/bookings");
            }, 1200);
        } catch (e) {
            setError(e?.message || (isRtl ? "تعذّرت الموافقة" : "Could not approve"));
        } finally {
            setBusy(false);
        }
    };

    const handleReassign = async (slotIndex = null) => {
        if (!booking) return;
        setBusy(true);
        try {
            const res = await reassignBooking(booking._id, slotIndex);
            const bk = res.booking;
            setBooking(bk);
            const hasProvider =
                bk &&
                (bk.provider ||
                    (bk.assignments && bk.assignments.some((a) => a.provider)));
            setStep(hasProvider ? "propose" : "nomore");
        } catch (e) {
            setError(e?.message || (isRtl ? "تعذّر تغيير الفني" : "Could not change technician"));
        } finally {
            setBusy(false);
        }
    };

    const provider = booking?.provider;
    const providerName = provider
        ? `${provider.first_name || ""} ${provider.last_name || ""}`.trim()
        : "";
    const assignments = booking?.assignments || [];
    const isMulti = (booking?.requiredTechnicians || 1) > 1 && assignments.length > 0;

    return (
        <div style={s.overlay} onClick={onClose}>
            <div
                ref={cardRef}
                style={s.card}
                onClick={(e) => e.stopPropagation()}
                dir={isRtl ? "rtl" : "ltr"}
            >
                <button style={s.close} onClick={onClose} aria-label="close">
                    <X size={18} />
                </button>

                <h3 style={s.title}>{isRtl ? "تأكيد الحجز" : "Confirm booking"}</h3>

                <div style={s.serviceRow}>
                    {service.image ? (
                        <img src={service.image} alt="" style={s.serviceImg} />
                    ) : null}
                    <div>
                        <p style={s.serviceTitle}>{(isRtl && service.titleAr) || service.title}</p>
                        <p style={s.servicePrice}>₪{service.OurPrice}</p>
                        {service.requiredTechnicians > 1 ? (
                            <p style={s.dim}>
                                {isRtl
                                    ? "تحتاج هذه الخدمة إلى " + service.requiredTechnicians + " فنيين"
                                    : "Requires " + service.requiredTechnicians + " technicians"}
                            </p>
                        ) : null}
                    </div>
                </div>

                <div style={s.addressRow}>
                    <MapPin size={14} />
                    <span>{localizeAddress(address, isRtl)}</span>
                </div>

                {step === "loading" && (
                    <div style={s.center}>
                        <Loader size={26} className="spin" />
                        <p style={s.dim}>
                            {isRtl
                                ? "جارٍ تعيين أقرب فني..."
                                : "Assigning the nearest technician..."}
                        </p>
                    </div>
                )}

                {step === "error" && (
                    <div style={s.center}>
                        <p style={s.errText}>{error}</p>
                        <button style={s.secondaryBtn} onClick={submit}>
                            {isRtl ? "إعادة المحاولة" : "Retry"}
                        </button>
                    </div>
                )}

                {step === "nomore" && (
                    <div style={s.center}>
                        <p style={s.dim}>
                            {isRtl
                                ? "لا يوجد فنيون متاحون حاليًا. سيتم التواصل معك قريبًا."
                                : "No technicians available right now. We'll reach out soon."}
                        </p>
                        <button
                            style={s.secondaryBtn}
                            onClick={() => {
                                onClose();
                                navigate("/bookings");
                            }}
                        >
                            {isRtl ? "عرض حجوزاتي" : "View my bookings"}
                        </button>
                    </div>
                )}

                {step === "propose" && !isMulti && provider && (
                    <div style={s.proposeBox}>
                        <p style={s.proposeLabel}>
                            {isRtl ? "الفني المقترح" : "Proposed technician"}
                        </p>
                        <div style={s.providerRow}>
                            <div style={s.avatar}>
                                {provider.profilePhoto && provider.profilePhoto.startsWith("http") ? <img src={provider.profilePhoto} alt="" style={Object.assign({ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" })} onError={(e) => { console.error("[photo] failed to load:", e.target.src); e.target.onerror = null; e.target.src = "/logo-192.png"; }} /> : <User size={18} />}
                            </div>
                            <div>
                                <p style={s.providerName}>
                                    {providerName || (isRtl ? "فني" : "Technician")}
                                </p>
                                {provider.city ? (
                                    <p style={s.dim}>{localizeCity(provider.city, isRtl)}</p>
                                ) : null}
                                {provider.phone ? (
                                    <p style={s.phone}>
                                        <Phone size={12} /> {provider.phone}
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        <p style={s.hint}>
                            {isRtl
                                ? "هل توافق على هذا الفني أم تريد طلب فني آخر؟"
                                : "Approve this technician or request another one?"}
                        </p>

                        <div style={s.actions}>
                            <button
                                style={s.approveBtn}
                                onClick={handleApprove}
                                disabled={busy}
                            >
                                <Check size={16} /> {isRtl ? "موافقة وتأكيد" : "Approve & confirm"}
                            </button>
                            <button
                                style={s.reassignBtn}
                                onClick={() => handleReassign()}
                                disabled={busy}
                            >
                                <RefreshCw size={16} /> {isRtl ? "طلب فني آخر" : "Request another"}
                            </button>
                        </div>
                    </div>
                )}

                {step === "propose" && isMulti && (
                    <div style={s.proposeBox}>
                        <p style={s.proposeLabel}>
                            {isRtl
                                ? "الفنيون المقترحون (" + assignments.length + ")"
                                : "Proposed technicians (" + assignments.length + ")"}
                        </p>
                        {assignments.map((a, idx) => {
                            const p = a.provider || {};
                            const name = `${p.first_name || ""} ${p.last_name || ""}`.trim();
                            return (
                                <div key={idx} style={s.slotRow}>
                                    <div style={s.avatar}>
                                        {p.profilePhoto && p.profilePhoto.startsWith("http") ? <img src={p.profilePhoto} alt="" style={Object.assign({ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" })} onError={(e) => { console.error("[photo] failed to load:", e.target.src); e.target.onerror = null; e.target.src = "/logo-192.png"; }} /> : <User size={18} />}
                                    </div>
                                    <div style={s.slotInfo}>
                                        <p style={s.providerName}>
                                            {name || (isRtl ? "فني" : "Technician")}
                                        </p>
                                        {p.city ? <p style={s.dim}>{p.city}</p> : null}
                                        {p.phone ? (
                                            <p style={s.phone}>
                                                <Phone size={12} /> {p.phone}
                                            </p>
                                        ) : null}
                                    </div>
                                    <button
                                        style={s.slotSwapBtn}
                                        onClick={() => handleReassign(idx)}
                                        disabled={busy}
                                        title={isRtl ? "طلب فني آخر" : "Request another"}
                                    >
                                        <RefreshCw size={15} />
                                    </button>
                                </div>
                            );
                        })}

                        <p style={s.hint}>
                            {isRtl
                                ? "هؤلاء هم الفنيون الأقرب لطلبك. يمكنك استبدال أي منهم أو الموافقة على الفريق."
                                : "These are the closest technicians for your job. Swap any of them or approve the whole team."}
                        </p>

                        <div style={s.actions}>
                            <button
                                style={s.approveBtn}
                                onClick={handleApprove}
                                disabled={busy}
                            >
                                <Check size={16} />{" "}
                                {isRtl ? "موافقة على الفريق وتأكيد" : "Approve team & confirm"}
                            </button>
                        </div>
                    </div>
                )}

                {step === "done" && (
                    <div style={s.center}>
                        <CheckCircle2 size={32} color="var(--green)" />
                        <p style={s.doneText}>
                            {isRtl ? "تم تأكيد الحجز بنجاح" : "Booking confirmed"}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
