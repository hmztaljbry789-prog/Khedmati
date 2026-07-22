import { useEffect, useState, useCallback, useContext } from "react";
import RefreshButton from "../../components/RefreshButton";
import PortalContext from "../../context/PortalContext";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import {
    getAllBookings,
    updateBookingStatus,
    getProviders,
    assignProvider,
    confirmProviderAssign,
} from "../../utils/api";
import { localizeCity, localizeAddress } from "../../utils/localize";

const STATUS_OPTIONS = ["PENDING_APPROVAL", "CONFIRMED", "SERVICE_COMPLETED", "CANCELLED"];

const STATUS_LABEL = {
    ar: {
        PENDING_APPROVAL: "بانتظار الموافقة",
        CONFIRMED: "مؤكد",
        SERVICE_COMPLETED: "مكتمل",
        CANCELLED: "ملغي",
    },
    en: {
        PENDING_APPROVAL: "Pending approval",
        CONFIRMED: "Confirmed",
        SERVICE_COMPLETED: "Completed",
        CANCELLED: "Cancelled",
    },
};

// Booking states that permanently lock a booking against further edits.
const FINAL_STATUSES = ["CANCELLED", "SERVICE_COMPLETED"];

const TXT = {
    ar: {
        title: "إدارة الحجوزات",
        refresh: "تحديث",
        refreshing: "جارٍ التحديث...",
        loading: "جارٍ التحميل...",
        searchPlaceholder: "ابحث بالاسم أو الهاتف أو رقم الحجز...",
        all: "الكل",
        noBookings: "لا توجد حجوزات.",
        noProviders: "لا يوجد فنيون.",
        technician: "الفني",
        techWord: "فني",
        unassigned: "غير معيّن",
        change: "تغيير",
        assign: "تعيين",
        confirmTech: "تأكيد الفني",
        changeTech: "تغيير الفني",
        assignTech: "تعيين فني",
        approved: "(تمت الموافقة)",
        awaitingCustomer: "(بانتظار موافقة العميل)",
        statusLabel: "الحالة:",
        locked: "حجز مقفل — الحجوزات الملغية أو المكتملة لا يمكن تعديلها.",
        respPENDING: "بالانتظار",
        respACCEPTED: "قبل",
        respREJECTED: "رفض",
    },
    en: {
        title: "Bookings Management",
        refresh: "Refresh",
        refreshing: "Refreshing...",
        loading: "Loading...",
        searchPlaceholder: "Search by name, phone or booking ID...",
        all: "All",
        noBookings: "No bookings.",
        noProviders: "No technicians.",
        technician: "Technician",
        techWord: "Technician",
        unassigned: "Unassigned",
        change: "Change",
        assign: "Assign",
        confirmTech: "Confirm technician",
        changeTech: "Change technician",
        assignTech: "Assign technician",
        approved: "(Approved)",
        awaitingCustomer: "(Awaiting customer approval)",
        statusLabel: "Status:",
        locked: "Locked — cancelled or completed bookings can no longer be edited.",
        respPENDING: "Pending",
        respACCEPTED: "Accepted",
        respREJECTED: "Rejected",
    },
};

const STATUS_CLASS = {
    PENDING_APPROVAL: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    CONFIRMED: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    SERVICE_COMPLETED: "bg-green-500/15 text-green-400 border-green-500/30",
    CANCELLED: "bg-red-500/15 text-red-400 border-red-500/30",
};



// Reusable technician picker dropdown (used for both single and per-slot assigns)
function ProviderPicker({ open, providers, busy, onPick, emptyLabel }) {
    if (!open) return null;
    return (
        <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
            {providers.length === 0 ? (
                <p className="text-xs text-gray-500">{emptyLabel}</p>
            ) : (
                providers.map((p) => (
                    <button
                        key={p._id}
                        onClick={() => onPick(p._id)}
                        disabled={busy}
                        className="w-full flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200"
                    >
                        <span>{`${p.first_name || ""} ${p.last_name || ""}`.trim()}</span>
                        <span className="text-xs text-gray-400">
                            ★ {Number(p.rating || 0).toFixed(1)} · {p.distanceText || p.city || ""}
                        </span>
                    </button>
                ))
            )}
        </div>
    );
}

export default function AdminBookings() {
    const { locale } = useContext(PortalContext);
    const isRtl = locale === "ar";
    const t = TXT[isRtl ? "ar" : "en"];
    const statusLabel = STATUS_LABEL[isRtl ? "ar" : "en"];
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [providersFor, setProvidersFor] = useState(null);
    const [providers, setProviders] = useState([]);
    const [busy, setBusy] = useState(false);
    const [statusFilter, setStatusFilter] = useState("");
    const [search, setSearch] = useState("");

    const load = useCallback(async (silent = false) => {
        if (silent) setRefreshing(true);
        else setLoading(true);
        try {
            const data = await getAllBookings();
            setBookings(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    // Manual refresh button + silent auto-refresh every 30s.
    const handleRefresh = useCallback(() => load(true), [load]);
    useAutoRefresh(handleRefresh, 30000, true);

    const handleStatus = async (id, status) => {
        try {
            await updateBookingStatus(id, status);
            await load();
        } catch (e) {
            console.error(e);
        }
    };

    const openProviders = async (bookingId, slotIndex = null) => {
        const key = slotIndex == null ? bookingId : `${bookingId}#${slotIndex}`;
        setProvidersFor(key);
        setProviders([]);
        try {
            const data = await getProviders(bookingId);
            setProviders(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        }
    };

    const handleAssign = async (bookingId, providerId, slotIndex = null) => {
        setBusy(true);
        try {
            await assignProvider(bookingId, providerId, slotIndex);
            setProvidersFor(null);
            await load();
        } catch (e) {
            console.error(e);
        } finally {
            setBusy(false);
        }
    };

    const handleConfirmAssign = async (bookingId) => {
        setBusy(true);
        try {
            await confirmProviderAssign(bookingId);
            await load();
        } catch (e) {
            console.error(e);
        } finally {
            setBusy(false);
        }
    };

    if (loading) {
        return <div className="p-6 text-gray-400">{t.loading}</div>;
    }

    const filtered = bookings.filter((b) => {
        if (statusFilter && b.status !== statusFilter) return false;
        if (search.trim()) {
            const q = search.trim().toLowerCase();
            const hay = [
                b.bookingId,
                b.customerDetails?.name,
                b.customerDetails?.phone,
                b.customerDetails?.email,
                b.customerDetails?.address,
                b.customerDetails?.city,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            if (!hay.includes(q)) return false;
        }
        return true;
    });

    const statusTabs = [
        { k: "", l: t.all },
        { k: "PENDING_APPROVAL", l: statusLabel.PENDING_APPROVAL },
        { k: "CONFIRMED", l: statusLabel.CONFIRMED },
        { k: "SERVICE_COMPLETED", l: statusLabel.SERVICE_COMPLETED },
        { k: "CANCELLED", l: statusLabel.CANCELLED },
    ];

    return (
        <div className="p-4 sm:p-6" dir={isRtl ? "rtl" : "ltr"}>
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <h1 className="text-xl font-bold text-white">{t.title}</h1>
                <RefreshButton
                    onClick={handleRefresh}
                    refreshing={refreshing}
                    label={refreshing ? t.refreshing : t.refresh}
                />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-4">
                <div className="flex flex-wrap gap-2">
                    {statusTabs.map((f) => (
                        <button
                            key={f.k}
                            onClick={() => setStatusFilter(f.k)}
                            className={`text-xs px-4 py-2 rounded-full font-semibold border transition ${
                                statusFilter === f.k
                                    ? "bg-blue-600 text-white border-transparent"
                                    : "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10"
                            }`}
                        >
                            {f.l}
                        </button>
                    ))}
                </div>
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm w-full sm:w-72 outline-none focus:border-blue-500/50 text-gray-200"
                />
            </div>

            {filtered.length === 0 ? (
                <p className="text-gray-400">{t.noBookings}</p>
            ) : (
                <div className="space-y-4">
                    {filtered.map((b) => {
                        const provider = b.provider;
                        const providerName = provider
                            ? `${provider.first_name || ""} ${provider.last_name || ""}`.trim()
                            : "";
                        const assignments = Array.isArray(b.assignments)
                            ? b.assignments
                            : [];
                        const isMulti = assignments.length > 1;
                        const isFinal = FINAL_STATUSES.includes(b.status);
                        return (
                            <div
                                key={b._id}
                                className="rounded-xl border border-white/10 bg-white/5 p-4"
                            >
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                    <div>
                                        <p className="text-xs text-gray-500">{b.bookingId}</p>
                                        <p className="text-white font-semibold">
                                            {b.customerDetails?.name || "-"}
                                        </p>
                                    </div>
                                    <span
                                        className={`text-xs px-2.5 py-1 rounded-full border ${STATUS_CLASS[b.status] || "bg-gray-500/15 text-gray-300 border-gray-500/30"}`}
                                    >
                                        {statusLabel[b.status] || b.status}
                                    </span>
                                </div>

                                <div className="space-y-1 mb-3">
                                    {(b.items || []).map((it, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between text-sm text-gray-300"
                                        >
                                            <span>
                                                {isRtl
                                                    ? it.titleAr || t[it.title] || it.title
                                                    : it.title || it.titleAr}
                                            </span>
                                            <span className="text-gray-400">₪{it.price ?? "-"}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-gray-400 mb-3">
                                    <span>📞 <span dir="ltr">{b.customerDetails?.phone || "-"}</span></span>
                                    <span>✉️ {b.customerDetails?.email || "-"}</span>
                                    <span className="sm:col-span-2">📍 {localizeAddress(b.customerDetails?.address, isRtl) || "-"}</span>
                                </div>

                                <div className="rounded-lg bg-black/20 border border-white/5 p-3 mb-3">
                                    <p className="text-xs text-gray-500 mb-1">{t.technician}</p>
                                    {isMulti ? (
                                        <div className="space-y-2">
                                            {assignments.map((a, idx) => {
                                                const ap = a.provider;
                                                const apName = ap
                                                    ? `${ap.first_name || ""} ${ap.last_name || ""}`.trim()
                                                    : "";
                                                const slotKey = `${b._id}#${idx}`;
                                                return (
                                                    <div
                                                        key={idx}
                                                        className="rounded-lg bg-white/5 border border-white/10 p-2"
                                                    >
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <div className="text-sm text-white">
                                                                <span className="text-xs text-gray-500">{`${t.techWord} ${idx + 1}: `}</span>
                                                                {apName || t.unassigned}
                                                                {a.providerResponse && (
                                                                    <span
                                                                        className={`ms-2 text-xs ${a.providerResponse === "ACCEPTED" ? "text-green-400" : a.providerResponse === "REJECTED" ? "text-red-400" : "text-amber-400"}`}
                                                                    >
                                                                        ({t[`resp${a.providerResponse}`] || a.providerResponse})
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {!isFinal && (
                                                                <button
                                                                    onClick={() => openProviders(b._id, idx)}
                                                                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-600 text-white border border-slate-600 hover:bg-slate-700 transition"
                                                                >
                                                                    {ap ? t.change : t.assign}
                                                                </button>
                                                            )}
                                                        </div>
                                                        <ProviderPicker
                                                            open={providersFor === slotKey}
                                                            providers={providers}
                                                            busy={busy}
                                                            onPick={(pid) => handleAssign(b._id, pid, idx)}
                                                            emptyLabel={t.noProviders}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : provider ? (
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div className="text-sm text-white">
                                                {providerName || t.techWord}
                                                <span className="text-gray-400">
                                                    {" "}
                                                    {provider.phone ? `• ${provider.phone}` : ""}
                                                    {provider.city ? ` • ${localizeCity(provider.city, isRtl)}` : ""}
                                                </span>
                                                <span
                                                    className={`ms-2 text-xs px-2 py-0.5 rounded-full ${b.isProviderConfirmed ? "bg-green-600 text-white" : "bg-amber-500 text-white"}`}
                                                >
                                                    {b.isProviderConfirmed
                                                        ? t.approved
                                                        : t.awaitingCustomer}
                                                </span>
                                            </div>
                                            {!isFinal && (
                                                <div className="flex gap-2">
                                                    {!b.isProviderConfirmed && (
                                                        <button
                                                            onClick={() => handleConfirmAssign(b._id)}
                                                            disabled={busy}
                                                            className="text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white border border-green-600 hover:bg-green-700 transition"
                                                        >
                                                            {t.confirmTech}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => openProviders(b._id)}
                                                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-600 text-white border border-slate-600 hover:bg-slate-700 transition"
                                                    >
                                                        {t.changeTech}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : !isFinal ? (
                                        <button
                                            onClick={() => openProviders(b._id)}
                                            className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 transition"
                                        >
                                            {t.assignTech}
                                        </button>
                                    ) : null}

                                    {providersFor === b._id && (
                                        <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
                                            {providers.length === 0 ? (
                                                <p className="text-xs text-gray-500">{t.noProviders}</p>
                                            ) : (
                                                providers.map((p) => (
                                                    <button
                                                        key={p._id}
                                                        onClick={() => handleAssign(b._id, p._id)}
                                                        disabled={busy}
                                                        className="w-full flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-200"
                                                    >
                                                        <span>
                                                            {`${p.first_name || ""} ${p.last_name || ""}`.trim()}
                                                        </span>
                                                        <span className="text-xs text-gray-400">
                                                            {p.distanceText || p.city || ""}
                                                        </span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs text-gray-500">{t.statusLabel}</span>
                                    <select
                                        value={b.status}
                                        onChange={(e) => handleStatus(b._id, e.target.value)}
                                        disabled={isFinal}
                                        className="bg-black/30 border border-white/10 rounded-lg text-sm text-gray-200 px-2 py-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {STATUS_OPTIONS.map((st) => (
                                            <option key={st} value={st}>
                                                {statusLabel[st]}
                                            </option>
                                        ))}
                                    </select>
                                    {isFinal && (
                                        <span className="text-xs text-amber-400">🔒 {t.locked}</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
