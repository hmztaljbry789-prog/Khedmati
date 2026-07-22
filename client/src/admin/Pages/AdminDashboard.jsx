import { useState, useEffect, useContext, useCallback } from "react";
import { getDashboardStats } from "../../utils/api";
import PortalContext from "../../context/PortalContext";
import RefreshButton from "../../components/RefreshButton";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import { translations } from "../../utils/translations";
import { Calendar, ChevronDown, Users, Wrench, Layers } from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

/* ---- shared themed styles (no inline object literals to keep JSX clean) ---- */
const page = { display: "flex", flexDirection: "column", gap: 24 };
const headerRow = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    flexWrap: "wrap",
};
const pageTitle = { fontSize: 30, fontWeight: 700, color: "var(--text)" };
const headerActions = { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" };

// Solid (non-translucent) surface so cards stay crisp and high-contrast in
// both light and dark themes instead of washing out over the page background.
const card = {
    background: "var(--card-solid)",
    border: "1px solid var(--border)",
    borderRadius: 20,
    padding: 20,
    boxShadow: "var(--shadow)",
};
const cardRow = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
};
const statLabel = { fontSize: 13, fontWeight: 600, color: "var(--text-muted)", marginBottom: 6 };
const statValue = { fontSize: 30, fontWeight: 700, color: "var(--text)" };
const iconChip = (from, to) => ({
    width: 46,
    height: 46,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    flexShrink: 0,
    background: `linear-gradient(135deg, ${from}, ${to})`,
});

const chartTitle = {
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "var(--text-dim)",
    marginBottom: 16,
};
const chartArea = { height: 210, fontSize: 12 };
const emptyState = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "var(--text-dim)",
};
const tooltipStyle = {
    background: "var(--card-solid)",
    border: "1px solid var(--glass-border)",
    borderRadius: 10,
    color: "var(--text)",
};
const tooltipLabel = { color: "var(--text)" };
const tooltipItem = { color: "var(--text)" };

const selectWrap = { position: "relative" };
const selectStyle = {
    appearance: "none",
    WebkitAppearance: "none",
    background: "var(--card-solid)",
    border: "1px solid var(--border)",
    color: "var(--text)",
    borderRadius: 12,
    paddingTop: 8,
    paddingBottom: 8,
    paddingInlineStart: 14,
    paddingInlineEnd: 36,
    fontSize: 14,
    outline: "none",
    cursor: "pointer",
};
const chevronStyle = {
    position: "absolute",
    insetInlineEnd: 10,
    top: "50%",
    transform: "translateY(-50%)",
    color: "var(--text-dim)",
    pointerEvents: "none",
};

const topScroll = { maxHeight: 200, overflowY: "auto", paddingInlineEnd: 8 };
const topItem = { marginBottom: 14 };
const topItemRow = {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 6,
    gap: 8,
};
const topName = {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text)",
    maxWidth: "70%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
};
const topVal = { fontSize: 13, color: "var(--text-dim)" };
const barTrack = {
    width: "100%",
    height: 8,
    borderRadius: 999,
    background: "var(--border-light)",
    overflow: "hidden",
};
const barFill = (pct) => ({
    width: `${pct}%`,
    height: 8,
    borderRadius: 999,
    background: "linear-gradient(90deg, var(--blue), var(--blue-bright))",
});

const centerWrap = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "calc(100vh - 200px)",
};
const spinner = {
    width: 48,
    height: 48,
    borderRadius: "50%",
    border: "3px solid var(--glass-border)",
    borderBottomColor: "var(--blue)",
};
const errorText = { color: "var(--red)", marginBottom: 12 };
const centerText = { textAlign: "center" };
const retryBtn = {
    background: "var(--blue)",
    color: "#fff",
    border: "none",
    padding: "8px 18px",
    borderRadius: 10,
    cursor: "pointer",
};
const mutedText = { color: "var(--text-dim)" };

const TimeRangeSelector = ({ value, onChange, t }) => (
    <div style={selectWrap}>
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={selectStyle}
        >
            <option value="all">{t.allTime}</option>
            <option value="today">{t.today}</option>
            <option value="week">{t.thisWeek}</option>
            <option value="month">{t.thisMonth}</option>
            <option value="year">{t.thisYear}</option>
        </select>
        <ChevronDown style={chevronStyle} size={16} />
    </div>
);

const StatCard = ({ label, value, Icon, from, to }) => (
    <div style={card}>
        <div style={cardRow}>
            <div>
                <p style={statLabel}>{label}</p>
                <h3 style={statValue}>{value}</h3>
            </div>
            <div style={iconChip(from, to)}>
                <Icon size={22} />
            </div>
        </div>
    </div>
);

const RevenueChart = ({ data, t }) => (
    <div style={card}>
        <h3 style={chartTitle}>{t.monthlyBookings}</h3>
        <div style={chartArea}>
            {data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={ { top: 5, right: 10, left: -10, bottom: 5 } }>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="month" tick={ { fontSize: 11, fill: "var(--text-dim)" } } />
                        <YAxis allowDecimals={false} tick={ { fontSize: 11, fill: "var(--text-dim)" } } />
                        <Tooltip
                            contentStyle={tooltipStyle}
                            labelStyle={tooltipLabel}
                            itemStyle={tooltipItem}
                            formatter={(value) => [value.toLocaleString(), t.bookings || "Bookings"]}
                        />
                        <Line
                            type="monotone"
                            dataKey="total"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={ { r: 3, fill: "#3b82f6", strokeWidth: 0 } }
                            activeDot={ { r: 6, fill: "#60a5fa", stroke: "#fff", strokeWidth: 2 } }
                            isAnimationActive={true}
                        />
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <div style={emptyState}>{t.noBookingsData}</div>
            )}
        </div>
    </div>
);

const TopServicesChart = ({ data, t, isRtl }) => (
    <div style={card}>
        <h3 style={chartTitle}>{t.topServices}</h3>
        <div style={topScroll}>
            {data && data.length > 0 ? (
                data.map((service) => (
                    <div key={service._id} style={topItem}>
                        <div style={topItemRow}>
                            <span style={topName}>
                                {isRtl
                                    ? service.titleAr || t[service._id] || service._id
                                    : service._id}
                            </span>
                            <span style={topVal}>
                                {service.revenue.toLocaleString()}
                            </span>
                        </div>
                        <div style={barTrack}>
                            <div
                                style={barFill(
                                    (service.revenue / data[0].revenue) * 100,
                                )}
                            />
                        </div>
                    </div>
                ))
            ) : (
                <div style={emptyState}>{t.noServicesData}</div>
            )}
        </div>
    </div>
);

const STATUS_KEY = {
    PENDING_APPROVAL: "stPending",
    CONFIRMED: "stConfirmed",
    IN_PROGRESS: "stInProgress",
    SERVICE_COMPLETED: "stCompleted",
    CANCELLED: "stCancelled",
};

const StatusDistribution = ({ data, t }) => {
    const total = (data || []).reduce((sum, d) => sum + (d.count || 0), 0);
    return (
        <div style={card}>
            <h3 style={chartTitle}>{t.statusDistribution}</h3>
            <div style={topScroll}>
                {data && data.length > 0 ? (
                    data.map((d) => (
                        <div key={d._id} style={topItem}>
                            <div style={topItemRow}>
                                <span style={topName}>{t[STATUS_KEY[d._id]] || t.stOther}</span>
                                <span style={topVal}>{d.count}</span>
                            </div>
                            <div style={barTrack}>
                                <div style={barFill(total ? (d.count / total) * 100 : 0)} />
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={emptyState}>{t.noStatusData}</div>
                )}
            </div>
        </div>
    );
};

export default function AdminDashboard() {
    const { locale } = useContext(PortalContext);
    const t = translations[locale].adm;

    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [timeRange, setTimeRange] = useState("all");

    const fetchStats = useCallback(async (silent = false) => {
        try {
            if (silent) setRefreshing(true);
            else setLoading(true);
            setError(null);
            const data = await getDashboardStats(timeRange);
            setStats({
                totalServices: data.totalServices || 0,
                totalServiceDetails: data.totalServiceDetails || 0,
                totalUsers: data.totalUsers || 0,
                totalBookings: data.totalBookings || 0,
                revenue: data.revenue || { total: 0, count: 0 },
                monthlyRevenue: data.monthlyRevenue || [],
                topServices: data.topServices || [],
                bookingStatusStats: data.bookingStatusStats || [],
                timeRange: data.timeRange,
            });
        } catch (err) {
            console.error("Error fetching dashboard stats:", err);
            setError(err.message || t.failedStats);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [timeRange, t]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Manual refresh button + silent auto-refresh every 30s.
    const handleRefresh = useCallback(() => fetchStats(true), [fetchStats]);
    useAutoRefresh(handleRefresh, 30000, true);

    if (loading) {
        return (
            <div style={centerWrap}>
                <div className="animate-spin" style={spinner} />
            </div>
        );
    }

    if (error) {
        return (
            <div style={centerWrap}>
                <div style={centerText}>
                    <p style={errorText}>{error}</p>
                    <button onClick={() => window.location.reload()} style={retryBtn}>
                        {t.retry}
                    </button>
                </div>
            </div>
        );
    }

    if (!stats) {
        return (
            <div style={centerWrap}>
                <p style={mutedText}>{t.noData}</p>
            </div>
        );
    }

    const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ];

    const chartData = Array.from({ length: 12 }, (_, i) => {
        // Prefer the numeric monthIndex sent by the server (locale-proof);
        // fall back to the English short name for older API responses.
        const matches = stats.monthlyRevenue.filter((item) =>
            item.monthIndex
                ? item.monthIndex - 1 === i
                : monthNames.indexOf(item.month) === i,
        );
        return {
            month: monthNames[i],
            total: matches.reduce((sum, item) => sum + (item.total || 0), 0),
            count: matches.reduce((sum, item) => sum + (item.count || 0), 0),
        };
    });

    const statCards = [
        { label: t.totalUsers, value: stats.totalUsers, Icon: Users, from: "#3b82f6", to: "#60a5fa" },
        { label: t.totalServices, value: stats.totalServices, Icon: Wrench, from: "#10b981", to: "#34d399" },
        { label: t.serviceDetails, value: stats.totalServiceDetails, Icon: Layers, from: "#6366f1", to: "#818cf8" },
        { label: t.totalBookings, value: stats.totalBookings, Icon: Calendar, from: "#0ea5e9", to: "#38bdf8" },
    ];

    return (
        <div style={page}>
            <div style={headerRow}>
                <h1 style={pageTitle}>{t.dashboard}</h1>
                <div style={headerActions}>
                    <RefreshButton
                        onClick={handleRefresh}
                        refreshing={refreshing}
                        label={refreshing ? t.refreshing : t.refresh}
                    />
                    <TimeRangeSelector value={timeRange} onChange={setTimeRange} t={t} />
                </div>
            </div>

            <div className="dash-stats">
                {statCards.map((c) => (
                    <StatCard
                        key={c.label}
                        label={c.label}
                        value={c.value}
                        Icon={c.Icon}
                        from={c.from}
                        to={c.to}
                    />
                ))}
            </div>

            <div className="dash-charts">
                <RevenueChart data={chartData} t={t} />
                <TopServicesChart data={stats.topServices} t={t} isRtl={locale === "ar"} />
            </div>

            <div className="dash-charts">
                <StatusDistribution data={stats.bookingStatusStats} t={t} />
            </div>
        </div>
    );
}
