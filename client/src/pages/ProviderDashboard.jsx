import { useEffect, useState, useContext, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PortalContext from "../context/PortalContext";
import RefreshButton from "../components/RefreshButton";
import { useAutoRefresh } from "../hooks/useAutoRefresh";
import {
    getProviderBookings,
    getProviderStats,
    providerAcceptBooking,
    providerRejectBooking,
    providerStartBooking,
    providerSetPrice,
    providerCompleteBooking,
    cancelBooking,
} from "../utils/api";
import {
    Briefcase,
    Clock,
    CheckCircle2,
    Loader2,
    MapPin,
    Phone,
    User as UserIcon,
    Check,
    X,
    Play,
    Inbox,
    Settings,
} from "lucide-react";
import { localizeAddress } from "../utils/localize";
import { translations } from "../utils/translations";
import { useFeedback } from "../components/FeedbackContext";

const txt = {
    ar: {
        title: "لوحة الفني",
        subtitle: "تابع طلبات الصيانة المكلّف بها وأدر حالتها",
        incoming: "طلبات واردة",
        inProgress: "قيد التنفيذ",
        completed: "مكتملة",
        total: "الإجمالي",
        tabIncoming: "الطلبات الواردة",
        tabActive: "الجارية",
        tabDone: "المكتملة",
        empty: "لا توجد طلبات في هذه القائمة حالياً",
        customer: "الزبون",
        accept: "قبول",
        reject: "رفض",
        start: "بدء العمل",
        complete: "إنهاء الخدمة",
        awaitingCustomer: "بانتظار موافقة الزبون",
        loading: "جارٍ التحميل...",
        setFinalPrice: "السعر النهائي",
        priceWithin: "ضمن النطاق",
        save: "حفظ",
        cancel: "إلغاء الحجز",
        confirmCancel: "هل أنت متأكد من إلغاء هذا الحجز؟",
        cancelError: "تعذر إلغاء الحجز.",
        actionError: "تعذر تحديث الحجز. حاول مرة أخرى.",
        statusLabels: {
            PENDING_APPROVAL: "بانتظار الموافقة",
            CONFIRMED: "مؤكّد",
            IN_PROGRESS: "قيد التنفيذ",
            SERVICE_COMPLETED: "مكتمل",
            CANCELLED: "ملغي",
        },
    },
    en: {
        title: "Technician Dashboard",
        subtitle: "Track and manage the maintenance jobs assigned to you",
        incoming: "Incoming",
        inProgress: "In progress",
        completed: "Completed",
        total: "Total",
        tabIncoming: "Incoming requests",
        tabActive: "Active",
        tabDone: "Completed",
        empty: "No jobs in this list right now",
        customer: "Customer",
        accept: "Accept",
        reject: "Reject",
        start: "Start job",
        complete: "Complete service",
        awaitingCustomer: "Awaiting customer approval",
        loading: "Loading...",
        setFinalPrice: "Final price",
        priceWithin: "within range",
        save: "Save",
        cancel: "Cancel booking",
        confirmCancel: "Are you sure you want to cancel this booking?",
        cancelError: "Could not cancel the booking.",
        actionError: "Could not update the booking. Please try again.",
        statusLabels: {
            PENDING_APPROVAL: "Pending approval",
            CONFIRMED: "Confirmed",
            IN_PROGRESS: "In progress",
            SERVICE_COMPLETED: "Completed",
            CANCELLED: "Cancelled",
        },
    },
};

const statusColor = {
    PENDING_APPROVAL: "#f59e0b",
    CONFIRMED: "#5b8cff",
    IN_PROGRESS: "#a855f7",
    SERVICE_COMPLETED: "#22c55e",
    CANCELLED: "#f87171",
};

// All inline styles are defined as named objects and referenced with single
// braces (style={st.x}) to keep the JSX simple and consistent.
const st = {
    loading: {
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        color: "var(--text-dim, #aab3c5)",
    },
    loadingText: { margin: 0, fontSize: 14 },
    header: { marginBottom: 24 },
    headerRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 16,
        flexWrap: "wrap",
    },
    headerActions: {
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
    },
    profileLink: {
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
        borderRadius: 10,
        border: "1px solid var(--border, rgba(255,255,255,0.15))",
        color: "var(--text, #eaeef6)",
        textDecoration: "none",
        fontWeight: 600,
        fontSize: 14,
    },
    h1: { margin: "0 0 6px", fontSize: 26, fontWeight: 800 },
    subtitle: { margin: 0, color: "var(--text-dim, #aab3c5)", fontSize: 14 },
    statValue: { fontSize: 22, fontWeight: 800, lineHeight: 1 },
    statLabel: { fontSize: 12, color: "var(--text-dim, #aab3c5)", marginTop: 4 },
    serviceTitle: { fontWeight: 700, fontSize: 14 },
    servicePrice: {
        color: "var(--blue-bright, #5b8cff)",
        fontWeight: 700,
        fontSize: 13,
        marginTop: 2,
    },
    priceEdit: { display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" },
    priceInput: { width: 90, padding: "6px 8px", borderRadius: 8, border: "1px solid var(--border, #2a2f3a)", background: "var(--surface, #11151f)", color: "var(--text, #eaeef6)", fontSize: 13 },
    priceHint: { fontSize: 11, color: "var(--text-dim, #aab3c5)" },
    priceSaveBtn: { display: "inline-flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 8, border: "none", background: "var(--blue, #3b82f6)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" },
};

const iconBg = (color) => ({ background: color + "22", color });
const statusStyle = (status) => {
    const c = statusColor[status] || "#888888";
    return { background: c + "22", color: c };
};

export default function ProviderDashboard() {
    const { user } = useAuth();
    const { locale } = useContext(PortalContext);
    const isRtl = locale === "ar";
    const t = txt[isRtl ? "ar" : "en"];
    // Shared translations map service titles (e.g. "Doorbell Installation")
    // to the active language, same as the customer bookings page.
    const tr = translations[locale] || translations.en;
    const { toast, confirm } = useFeedback();

    const [bookings, setBookings] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [tab, setTab] = useState("incoming");
    const [busyId, setBusyId] = useState(null);
    const [priceInputs, setPriceInputs] = useState({});
    const [savingId, setSavingId] = useState(null);

    const load = useCallback(async (silent = false) => {
        if (!user?._id) return;
        if (silent) setRefreshing(true);
        try {
            const [list, stx] = await Promise.all([
                getProviderBookings(user._id),
                getProviderStats(user._id).catch(() => null),
            ]);
            setBookings(Array.isArray(list) ? list : list?.bookings || []);
            setStats(stx);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    // Manual refresh button + silent auto-refresh every 30s.
    const handleRefresh = useCallback(() => load(true), [load]);
    useAutoRefresh(handleRefresh, 30000, !!user?._id);

    useEffect(() => {
        load();
    }, [load]);

    const mergeBooking = useCallback((updated) => {
        if (!updated?._id) return;
        setBookings((current) =>
            current.map((booking) =>
                String(booking._id) === String(updated._id)
                    ? { ...booking, ...updated }
                    : booking
            )
        );
    }, []);

    const act = async (fn, id) => {
        setBusyId(id);
        try {
            const result = await fn(id);
            mergeBooking(result?.booking || result);
            // Reconcile counters and populated data in the background, while
            // the button/status already reflects the successful response.
            load(true);
        } catch (e) {
            console.error(e);
            toast(t.actionError, "error");
        } finally {
            setBusyId(null);
        }
    };

    // Emergency cancellation by the technician (confirmed before sending).
    const cancelJob = async (id) => {
        const confirmed = await confirm(t.confirmCancel, {
            danger: true,
            confirmLabel: isRtl ? "نعم، إلغاء الحجز" : "Yes, cancel it",
            cancelLabel: isRtl ? "تراجع" : "Keep it",
        });
        if (!confirmed) return;
        setBusyId(id);
        try {
            const result = await cancelBooking(id);
            mergeBooking(result?.booking || result);
            load(true);
        } catch (e) {
            console.error(e);
            toast(t.cancelError, "error");
        } finally {
            setBusyId(null);
        }
    };

    // Technician sets the final price within the platform-defined range.
    const savePrice = async (b) => {
        const item = (b.items && b.items[0]) || {};
        const range = item.priceRange || {};
        let value = Number(priceInputs[b._id]);
        if (!Number.isFinite(value)) return;
        if (range.min != null) value = Math.max(range.min, value);
        if (range.max != null) value = Math.min(range.max, value);
        setSavingId(b._id);
        try {
            const result = await providerSetPrice(b._id, value);
            mergeBooking(result?.booking || result);
            load(true);
        } catch (e) {
            console.error(e);
            toast(t.actionError, "error");
        } finally {
            setSavingId(null);
        }
    };

    // For multi-technician jobs each technician responds to their own slot, so
    // the logged-in technician's status must be read from their assignment
    // rather than the booking-level response (which only flips to ACCEPTED once
    // the whole team has accepted).
    const mySlot = (b) => {
        if (b.assignments && b.assignments.length) {
            return b.assignments.find(
                (a) =>
                    a.provider &&
                    String(a.provider._id || a.provider) === String(user?._id)
            );
        }
        return null;
    };
    const myResponse = (b) => {
        const slot = mySlot(b);
        if (slot) return slot.providerResponse || "PENDING";
        return b.providerResponse || "PENDING";
    };
    const teamProgress = (b) => {
        if (!b.assignments || !b.assignments.length) return null;
        const total = b.assignments.length;
        const accepted = b.assignments.filter(
            (a) => a.providerResponse === "ACCEPTED"
        ).length;
        return { accepted, total };
    };
    const teamReady = (b) =>
        !b.assignments || !b.assignments.length
            ? b.providerResponse === "ACCEPTED"
            : b.assignments.every((a) => a.providerResponse === "ACCEPTED");

    const incoming = bookings.filter(
        (b) =>
            myResponse(b) === "PENDING" &&
            ["PENDING_APPROVAL", "CONFIRMED"].includes(b.status)
    );
    const active = bookings.filter(
        (b) =>
            ["CONFIRMED", "IN_PROGRESS"].includes(b.status) &&
            myResponse(b) === "ACCEPTED"
    );
    const done = bookings.filter((b) => b.status === "SERVICE_COMPLETED");

    const lists = { incoming, active, done };
    const current = lists[tab] || [];

    const wrap = {
        maxWidth: 1100,
        margin: "0 auto",
        padding: "96px 16px 48px",
        direction: isRtl ? "rtl" : "ltr",
        color: "var(--text, #eaeef6)",
    };

    const statCards = [
        { key: "incoming", label: t.incoming, value: stats?.incoming, icon: Inbox, color: "#f59e0b" },
        { key: "inProgress", label: t.inProgress, value: stats?.inProgress, icon: Clock, color: "#a855f7" },
        { key: "completed", label: t.completed, value: stats?.completed, icon: CheckCircle2, color: "#22c55e" },
        { key: "total", label: t.total, value: stats?.total, icon: Briefcase, color: "#5b8cff" },
    ];

    if (loading) {
        return (
            <div style={st.loading}>
                <Loader2 className="spin" size={28} />
                <p style={st.loadingText}>{t.loading}</p>
            </div>
        );
    }

    return (
        <div style={wrap}>
            <header style={st.header}>
                <div style={st.headerRow}>
                    <div>
                        <h1 style={st.h1}>{t.title}</h1>
                        <p style={st.subtitle}>{t.subtitle}</p>
                    </div>
                    <div style={st.headerActions}>
                        <RefreshButton
                            onClick={handleRefresh}
                            refreshing={refreshing}
                            label={refreshing ? (isRtl ? "جارٍ التحديث..." : "Refreshing...") : (isRtl ? "تحديث" : "Refresh")}
                        />
                        <Link to="/provider/profile" style={st.profileLink}>
                            <Settings size={16} />
                            {isRtl ? "إعدادات الملف" : "Profile settings"}
                        </Link>
                    </div>
                </div>
            </header>

            <div className="pd-stats">
                {statCards.map((c) => (
                    <div key={c.key} className="pd-stat-card">
                        <div className="pd-stat-icon" style={iconBg(c.color)}>
                            <c.icon size={20} />
                        </div>
                        <div>
                            <div style={st.statValue}>{c.value ?? 0}</div>
                            <div style={st.statLabel}>{c.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="pd-tabs">
                {[
                    ["incoming", t.tabIncoming, incoming.length],
                    ["active", t.tabActive, active.length],
                    ["done", t.tabDone, done.length],
                ].map(([key, label, count]) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`pd-tab ${tab === key ? "pd-tab-active" : ""}`}
                    >
                        {label} <span className="pd-badge">{count}</span>
                    </button>
                ))}
            </div>

            {current.length === 0 ? (
                <div className="pd-empty">
                    <Inbox size={34} />
                    <p>{t.empty}</p>
                </div>
            ) : (
                <div className="pd-grid">
                    {current.map((b) => {
                        const item = (b.items && b.items[0]) || b.item || {};
                        const cust = b.customerDetails || {};
                        const busy = busyId === b._id;
                        return (
                            <div key={b._id} className="pd-card">
                                <div className="pd-card-head">
                                    <span className="pd-status" style={statusStyle(b.status)}>
                                        {t.statusLabels[b.status] || b.status}
                                    </span>
                                    {b.status === "PENDING_APPROVAL" && (
                                        <span className="pd-note">{t.awaitingCustomer}</span>
                                    )}
                                    {teamProgress(b) && (
                                        <span className="pd-note">
                                            {isRtl
                                                ? `الفريق: ${teamProgress(b).accepted}/${teamProgress(b).total} قبلوا`
                                                : `Team: ${teamProgress(b).accepted}/${teamProgress(b).total} accepted`}
                                        </span>
                                    )}
                                </div>

                                <div className="pd-service">
                                    {item.image ? (
                                        <img loading="lazy" src={item.image} alt="" className="pd-service-img" />
                                    ) : (
                                        <div className="pd-service-img pd-service-ph">
                                            <Briefcase size={18} />
                                        </div>
                                    )}
                                    <div>
                                        <div style={st.serviceTitle}>{(isRtl && item.titleAr) || tr[item.title] || item.title || "Service"}</div>
                                        {item.price != null && (
                                            <div style={st.servicePrice}>₪{item.price}</div>
                                        )}
                                    </div>
                                </div>

                                {item.priceRange &&
                                    (item.priceRange.min != null || item.priceRange.max != null) &&
                                    b.status !== "SERVICE_COMPLETED" && (
                                        <div style={st.priceEdit}>
                                            <span style={st.priceHint}>{t.setFinalPrice}:</span>
                                            <input
                                                type="number"
                                                style={st.priceInput}
                                                value={priceInputs[b._id] ?? (item.price ?? "")}
                                                min={item.priceRange.min}
                                                max={item.priceRange.max}
                                                onChange={(e) =>
                                                    setPriceInputs((p) => ({ ...p, [b._id]: e.target.value }))
                                                }
                                            />
                                            <span style={st.priceHint}>
                                                {t.priceWithin} ₪{item.priceRange.min}–{item.priceRange.max}
                                            </span>
                                            <button
                                                style={st.priceSaveBtn}
                                                disabled={savingId === b._id}
                                                onClick={() => savePrice(b)}
                                            >
                                                {savingId === b._id ? (
                                                    <Loader2 size={13} className="spin" />
                                                ) : (
                                                    <Check size={13} />
                                                )}{" "}
                                                {t.save}
                                            </button>
                                        </div>
                                    )}

                                <div className="pd-info">
                                    <div className="pd-info-row">
                                        <UserIcon size={14} /> {cust.name || t.customer}
                                    </div>
                                    {cust.phone && (
                                        <div className="pd-info-row">
                                            <Phone size={14} /> {cust.phone}
                                        </div>
                                    )}
                                    {cust.address && (
                                        <div className="pd-info-row">
                                            <MapPin size={14} /> {localizeAddress(cust.address, isRtl)}
                                        </div>
                                    )}
                                </div>

                                <div className="pd-actions">
                                    {tab === "incoming" && (
                                        <>
                                            <button
                                                className="pd-btn pd-btn-green"
                                                disabled={busy}
                                                onClick={() => act((id) => providerAcceptBooking(id, user._id), b._id)}
                                            >
                                                <Check size={15} /> {t.accept}
                                            </button>
                                            <button
                                                className="pd-btn pd-btn-ghost"
                                                disabled={busy}
                                                onClick={() => act((id) => providerRejectBooking(id, user._id), b._id)}
                                            >
                                                <X size={15} /> {t.reject}
                                            </button>
                                        </>
                                    )}
                                    {tab === "active" && b.status === "CONFIRMED" && teamReady(b) && (
                                        <button
                                            className="pd-btn pd-btn-blue"
                                            disabled={busy}
                                            onClick={() => act(providerStartBooking, b._id)}
                                        >
                                            <Play size={15} /> {t.start}
                                        </button>
                                    )}
                                    {tab === "active" && b.status === "CONFIRMED" && !teamReady(b) && (
                                        <span className="pd-note">
                                            {isRtl
                                                ? "بانتظار قبول باقي الفنيين"
                                                : "Waiting for the rest of the team"}
                                        </span>
                                    )}
                                    {tab === "active" && b.status === "IN_PROGRESS" && !b.completionRequested && (
                                        <button
                                            className="pd-btn pd-btn-green"
                                            disabled={busy}
                                            onClick={() =>
                                                act(() => providerCompleteBooking(b.bookingId), b._id)
                                            }
                                        >
                                            <CheckCircle2 size={15} /> {t.complete}
                                        </button>
                                    )}
                                    {tab === "active" && b.status === "IN_PROGRESS" && b.completionRequested && (
                                        <span className="pd-note">
                                            {isRtl
                                                ? "بانتظار تأكيد الزبون للاكتمال"
                                                : "Waiting for customer confirmation"}
                                        </span>
                                    )}
                                    {tab === "active" && ["CONFIRMED", "IN_PROGRESS"].includes(b.status) && (
                                        <button
                                            className="pd-btn pd-btn-ghost"
                                            disabled={busy}
                                            onClick={() => cancelJob(b._id)}
                                        >
                                            <X size={15} /> {t.cancel}
                                        </button>
                                    )}
                                    {busy && <Loader2 size={15} className="spin" />}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
