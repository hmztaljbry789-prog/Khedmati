import { useEffect, useState, useCallback, useContext } from "react";
import {
    getAdminUsers,
    getAdminUserStats,
    updateUserRole,
    toggleUserAvailability,
    toggleUserVerified,
    deleteAdminUser,
} from "../../utils/api";
import {
    Users,
    Wrench,
    ShieldCheck,
    CircleCheck,
    Trash2,
    Search,
    Loader2,
    FileText,
} from "lucide-react";
import PortalContext from "../../context/PortalContext";
import RefreshButton from "../../components/RefreshButton";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import { photoUrl } from "../../utils/photoUrl";
import { translations } from "../../utils/translations";

const BACKEND = import.meta.env.VITE_BACKEND_URL;

const roleBadge = {
    user: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    provider: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    admin: "bg-amber-500/15 text-amber-300 border-amber-500/30",
};

// Verification requirements: a provider can only be approved once they have an
// ID document plus a complete profile (specialties, area, coordinates).
const verifyReq = (u) => ({
    id: !!u.idDocument,
    photo: true,
    specialties: Array.isArray(u.specialties) && u.specialties.length > 0,
    area: !!u.area,
    coords: u.latitude != null && u.longitude != null,
});

const allRequirementsMet = (u) => {
    const v = verifyReq(u);
    return v.id && v.photo && v.specialties && v.area && v.coords;
};

export default function AdminUsers() {
    const { locale } = useContext(PortalContext);
    const t = translations[locale].adm;
    // NOTE: these state hooks must be declared before `roleTabs`, which reads
    // `stats` below. Declaring them after would throw a ReferenceError
    // (temporal dead zone) and crash the whole page on open.
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [role, setRole] = useState("");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const roleTabs = [
        { key: "", label: t.all },
        { key: "user", label: t.customers },
        { key: "provider", label: t.technicians },
        { key: "admin", label: t.admins },
        {
            key: "pending",
            label: stats?.pendingVerification
                ? `${t.verifyRequests} (${stats.pendingVerification})`
                : t.verifyRequests,
        },
    ];
    const roleLabels = {
        user: t.roleUser,
        provider: t.roleProvider,
        admin: t.roleAdmin,
    };
    const load = useCallback(async (silent = false) => {
        if (silent) setRefreshing(true);
        else setLoading(true);
        try {
            const effectiveRole = role === "pending" ? "provider" : role;
            const [list, st] = await Promise.all([
                getAdminUsers(effectiveRole, search),
                getAdminUserStats().catch(() => null),
            ]);
            setUsers(Array.isArray(list) ? list : []);
            setStats(st);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [role, search]);

    useEffect(() => {
        const id = setTimeout(load, 250);
        return () => clearTimeout(id);
    }, [load]);

    // Manual refresh button + silent auto-refresh every 30s.
    const handleRefresh = useCallback(() => load(true), [load]);
    useAutoRefresh(handleRefresh, 30000, true);

    const changeRole = async (id, newRole) => {
        setBusyId(id);
        try {
            await updateUserRole(id, newRole);
            await load();
        } catch (e) {
            console.error(e);
        } finally {
            setBusyId(null);
        }
    };

    const toggleAvail = async (u) => {
        setBusyId(u._id);
        try {
            await toggleUserAvailability(u._id, !u.isAvailable);
            await load();
        } catch (e) {
            console.error(e);
        } finally {
            setBusyId(null);
        }
    };

    const approveVerify = async (u) => {
        setBusyId(u._id);
        try {
            await toggleUserVerified(u._id, true);
            await load();
            alert(locale === "ar" ? "تم قبول التوثيق وإشعار الفني" : "Verification approved and provider notified");
        } catch (e) {
            console.error(e);
            alert(e?.message || t.reqNotMet);
        } finally {
            setBusyId(null);
        }
    };

    const rejectVerify = async (u) => {
        const reason = window.prompt(
            locale === "ar" ? "اكتب سبب الرفض بوضوح (5 أحرف على الأقل):" : "Enter a clear rejection reason (at least 5 characters):",
            u.verificationRejectionReason || ""
        );
        if (reason === null) return;
        if (reason.trim().length < 5) {
            alert(locale === "ar" ? "سبب الرفض قصير جدًا" : "Rejection reason is too short");
            return;
        }
        setBusyId(u._id);
        try {
            await toggleUserVerified(u._id, false, reason.trim());
            await load();
            alert(locale === "ar" ? "تم رفض الطلب وإرسال السبب للفني" : "Request rejected and reason sent");
        } catch (e) {
            alert(e?.message || (locale === "ar" ? "تعذّر رفض الطلب" : "Could not reject request"));
        } finally {
            setBusyId(null);
        }
    };

    const remove = async (id) => {
        if (!window.confirm(t.deleteConfirm)) return;
        setBusyId(id);
        try {
            await deleteAdminUser(id);
            await load();
        } catch (e) {
            console.error(e);
            alert(e?.message || t.deleteError);
        } finally {
            setBusyId(null);
        }
    };

    const displayUsers =
        role === "pending"
            ? users.filter(
                  (u) =>
                      u.role === "provider" &&
                      u.isVerified === false &&
                      allRequirementsMet(u)
              )
            : users;

    const statCards = [
        { label: t.customers, value: stats?.customers, Icon: Users, color: "text-blue-300" },
        { label: t.technicians, value: stats?.providers, Icon: Wrench, color: "text-purple-300" },
        { label: t.availableNow, value: stats?.availableProviders, Icon: CircleCheck, color: "text-green-300" },
        { label: t.admins, value: stats?.admins, Icon: ShieldCheck, color: "text-amber-300" },
    ];

    return (
        <div className="text-slate-200">
            <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold mb-1">{t.usersTitle}</h1>
                    <p className="text-sm text-slate-400">{t.usersSubtitle}</p>
                </div>
                <RefreshButton
                    onClick={handleRefresh}
                    refreshing={refreshing}
                    label={refreshing ? t.refreshing : t.refresh}
                />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {statCards.map((c) => (
                    <div
                        key={c.label}
                        className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3"
                    >
                        <c.Icon className={c.color} size={24} />
                        <div>
                            <div className="text-xl font-bold">{c.value ?? 0}</div>
                            <div className="text-xs text-slate-400">{c.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-4">
                <div className="flex flex-wrap gap-2">
                    {roleTabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setRole(tab.key)}
                            className={`text-xs px-4 py-2 rounded-full font-semibold border transition ${
                                role === tab.key
                                    ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white border-transparent"
                                    : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <Search
                        size={15}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                    />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t.searchUsers}
                        className="bg-white/5 border border-white/10 rounded-full pl-9 pr-4 py-2 text-sm w-full sm:w-64 outline-none focus:border-blue-500/50"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
                    <Loader2 className="animate-spin" size={20} /> {t.loading}
                </div>
            ) : displayUsers.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                    {role === "pending" ? t.noVerifyRequests : t.noUsers}
                </div>
            ) : (
                <div className="overflow-x-auto border border-white/10 rounded-2xl">
                    <table className="w-full text-sm min-w-[640px]">
                        <thead className="bg-white/5 text-slate-400 text-xs uppercase">
                            <tr>
                                <th className="text-start px-4 py-3">{t.colName}</th>
                                <th className="text-start px-4 py-3">{t.colContact}</th>
                                <th className="text-start px-4 py-3">{t.colCity}</th>
                                <th className="text-start px-4 py-3">{t.colRole}</th>
                                <th className="text-start px-4 py-3">{t.statusCol}</th>
                                <th className="text-end px-4 py-3">{t.colActions}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayUsers.map((u) => {
                                const vr = verifyReq(u);
                                const allMet = allRequirementsMet(u);
                                return (
                                <tr
                                    key={u._id}
                                    className="border-t border-white/5 hover:bg-white/5"
                                >
                                    <td className="px-4 py-3 font-medium">
                                        <img src={photoUrl(u.profilePhoto, "/logo-192.png")} alt="" className="w-9 h-9 rounded-xl object-cover inline-block me-2" onError={(e) => { console.error("[photo] failed to load:", e.target.src); e.target.onerror = null; e.target.src = "/logo-192.png"; }} /> {u.first_name} {u.last_name}
                                        {u.role === "provider" && (
                                            <span className="block text-xs text-slate-500">
                                                {u.completedJobs ?? 0} {t.jobs} · ★ {u.rating ?? 0}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-slate-400">
                                        <div>{u.email}</div>
                                        <div className="text-xs">{u.phone}</div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-400">{u.city || "—"}</td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`text-xs px-2.5 py-1 rounded-full border ${
                                                roleBadge[u.role] || ""
                                            }`}
                                        >
                                            {roleLabels[u.role] || u.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {u.role === "provider" ? (
                                            <div className="space-y-2">
                                                <div className="flex flex-wrap gap-1.5">
                                                    <button
                                                        disabled={busyId === u._id}
                                                        onClick={() => toggleAvail(u)}
                                                        className={`text-xs px-2.5 py-1 rounded-full border ${
                                                            u.isAvailable
                                                                ? "bg-green-500/15 text-green-300 border-green-500/30"
                                                                : "bg-slate-500/15 text-slate-400 border-slate-500/30"
                                                        }`}
                                                    >
                                                        {u.isAvailable ? t.available : t.unavailable}
                                                    </button>
                                                    <button
                                                        disabled={
                                                            busyId === u._id ||
                                                            (u.isVerified === false && !allMet)
                                                        }
                                                        onClick={() => u.isVerified ? rejectVerify(u) : approveVerify(u)}
                                                        title={
                                                            u.isVerified === false
                                                                ? allMet
                                                                    ? t.verify
                                                                    : t.reqNotMet
                                                                : t.unverify
                                                        }
                                                        className={`text-xs px-2.5 py-1 rounded-full border ${
                                                            u.isVerified === false
                                                                ? allMet
                                                                    ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                                                                    : "bg-slate-500/10 text-slate-500 border-slate-500/20 cursor-not-allowed"
                                                                : "bg-blue-500/15 text-blue-300 border-blue-500/30"
                                                        }`}
                                                    >
                                                        {u.isVerified === false ? t.notVerified : t.verified}
                                                    </button>
                                                    {u.isVerified === false && (
                                                        <button
                                                            disabled={busyId === u._id}
                                                            onClick={() => rejectVerify(u)}
                                                            className="text-xs px-2.5 py-1 rounded-full border bg-red-500/15 text-red-300 border-red-500/30"
                                                        >
                                                            {locale === "ar" ? "رفض مع السبب" : "Reject with reason"}
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-1 text-[10px]">
                                                    <span className={vr.id ? "text-green-400" : "text-slate-500"}>
                                                        {vr.id ? "✓" : "✗"} {t.reqId}
                                                    </span>
                                                    <span className={vr.specialties ? "text-green-400" : "text-slate-500"}>
                                                        {vr.specialties ? "✓" : "✗"} {t.reqSpecialties}
                                                    </span>
                                                    <span className={vr.area ? "text-green-400" : "text-slate-500"}>
                                                        {vr.area ? "✓" : "✗"} {t.reqArea}
                                                    </span>
                                                    <span className={vr.coords ? "text-green-400" : "text-slate-500"}>
                                                        {vr.coords ? "✓" : "✗"} {t.reqCoords}
                                                    </span>
                                                </div>
                                                {u.idDocument ? (
                                                    <a
                                                        href={u.idDocument.startsWith("assets/") ? `${BACKEND}/${u.idDocument}` : `${BACKEND}/api/admin/users/${u._id}/id-document`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1 text-[11px] text-blue-300 hover:underline"
                                                    >
                                                        <FileText size={12} /> {t.viewId}
                                                    </a>
                                                ) : null}
                                            </div>
                                        ) : (
                                            <span className="text-slate-600 text-xs">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-2">
                                            <select
                                                value={u.role}
                                                disabled={busyId === u._id}
                                                onChange={(e) => changeRole(u._id, e.target.value)}
                                                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs outline-none"
                                            >
                                                <option value="user">{t.optCustomer}</option>
                                                <option value="provider">{t.optTechnician}</option>
                                                <option value="admin">{t.optAdmin}</option>
                                            </select>
                                            {u.role !== "admin" && (
                                                <button
                                                    disabled={busyId === u._id}
                                                    onClick={() => remove(u._id)}
                                                    className="p-1.5 rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20"
                                                    title={t.delete}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
