import { useState, useEffect, useContext, useRef, useCallback } from "react";
import PortalContext from "../../context/PortalContext";
import { translations } from "../../utils/translations";
import {
    getAdminSupportTickets,
    getAdminSupportTicket,
    replyAdminSupportTicket,
    updateAdminSupportStatus,
} from "../../utils/api";
import { LifeBuoy, Send, ArrowLeft, User as UserIcon } from "lucide-react";

const STATUSES = ["open", "in_progress", "closed"];

// ── Styles (named objects; no inline double-brace literals) ──
const page = {
    padding: "24px",
    fontFamily: "var(--font-body)",
    color: "var(--text)",
};
const headerRow = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px",
};
const title = {
    fontFamily: "var(--font-display)",
    fontSize: "24px",
    fontWeight: 700,
    margin: 0,
};
const filterRow = {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "18px",
};
const layout = {
    display: "grid",
    gridTemplateColumns: "minmax(300px, 380px) 1fr",
    gap: "20px",
    alignItems: "start",
};
const card = {
    background: "var(--card-solid)",
    border: "1px solid var(--border)",
    borderRadius: "16px",
    padding: "18px",
    boxShadow: "var(--shadow)",
};
const ticketItem = {
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "12px",
    marginBottom: "10px",
    cursor: "pointer",
    background: "var(--bg-2)",
};
const ticketItemActive = {
    ...ticketItem,
    borderColor: "var(--border-blue)",
    boxShadow: "var(--shadow-blue)",
};
const ticketSubject = { fontWeight: 600, fontSize: "15px", marginBottom: "4px" };
const metaRow = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
    fontSize: "12px",
    color: "var(--text-muted)",
};
const badge = {
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 600,
    color: "#fff",
};
const listHeader = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "12px",
    gap: "10px",
};
const primaryBtn = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "var(--blue)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    padding: "9px 14px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
};
const ghostBtn = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "transparent",
    color: "var(--text)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    padding: "8px 12px",
    fontSize: "13px",
    cursor: "pointer",
};
const threadBox = {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "420px",
    overflowY: "auto",
    padding: "6px 4px",
    marginBottom: "14px",
};
const bubbleBase = {
    maxWidth: "78%",
    padding: "10px 14px",
    borderRadius: "14px",
    fontSize: "14px",
    lineHeight: 1.5,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
};
const bubbleHeader = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    fontWeight: 600,
    color: "var(--text-muted)",
    marginBottom: "6px",
};
const replyRow = { display: "flex", gap: "8px", alignItems: "flex-end" };
const input = {
    width: "100%",
    boxSizing: "border-box",
    background: "var(--bg-2)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    padding: "10px 12px",
    color: "var(--text)",
    fontSize: "14px",
    fontFamily: "var(--font-body)",
};
const statusBtnRow = {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "14px",
};
const emptyState = {
    textAlign: "center",
    color: "var(--text-muted)",
    padding: "40px 10px",
    fontSize: "14px",
};

export default function AdminSupport() {
    const { locale } = useContext(PortalContext);
    const t = translations[locale].support;
    const isRtl = locale === "ar";

    const [tickets, setTickets] = useState([]);
    const [counts, setCounts] = useState({ open: 0, in_progress: 0, closed: 0 });
    const [filter, setFilter] = useState("all");
    const [activeId, setActiveId] = useState(null);
    const [activeTicket, setActiveTicket] = useState(null);
    const [reply, setReply] = useState("");
    const endRef = useRef(null);

    const loadList = useCallback(async () => {
        try {
            const data = await getAdminSupportTickets(
                filter === "all" ? undefined : filter
            );
            setTickets(data?.tickets || []);
            if (data?.counts) setCounts(data.counts);
        } catch (e) {
            console.error("Failed to load tickets", e);
        }
    }, [filter]);

    const loadTicket = useCallback(async (id) => {
        try {
            const data = await getAdminSupportTicket(id);
            setActiveTicket(data?.ticket || null);
        } catch (e) {
            console.error("Failed to load ticket", e);
        }
    }, []);

    useEffect(() => {
        loadList();
    }, [loadList]);

    useEffect(() => {
        if (!activeId) return undefined;
        loadTicket(activeId);
        const interval = setInterval(() => loadTicket(activeId), 5000);
        return () => clearInterval(interval);
    }, [activeId, loadTicket]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeTicket]);

    const statusLabel = (s) =>
        s === "open"
            ? t.statusOpen
            : s === "in_progress"
            ? t.statusInProgress
            : t.statusClosed;

    const statusColor = (s) =>
        s === "open"
            ? "var(--amber)"
            : s === "in_progress"
            ? "var(--blue)"
            : "var(--green)";

    const badgeStyle = (s) => ({ ...badge, background: statusColor(s) });
    const bubbleStyle = (isAdmin) => ({
        ...bubbleBase,
        alignSelf: isAdmin ? "flex-end" : "flex-start",
        background: isAdmin ? "var(--blue-dim)" : "var(--bg-2)",
        border: isAdmin
            ? "1px solid var(--border-blue)"
            : "1px solid var(--border)",
    });
    const replyInput = { ...input, flex: 1 };
    const pageDir = { ...page, direction: isRtl ? "rtl" : "ltr" };
    const filterBtnStyle = (key) => ({
        ...ghostBtn,
        borderColor: filter === key ? "var(--border-blue)" : "var(--border)",
        color: filter === key ? "var(--blue)" : "var(--text)",
        fontWeight: filter === key ? 700 : 500,
    });

    const personName = (u) =>
        u ? `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email : "";

    const handleReply = async (e) => {
        e.preventDefault();
        if (!reply.trim()) return;
        const text = reply;
        setReply("");
        try {
            const data = await replyAdminSupportTicket(activeId, text);
            setActiveTicket(data?.ticket || null);
            loadList();
        } catch (err) {
            console.error("Failed to reply", err);
        }
    };

    const handleStatus = async (status) => {
        try {
            const data = await updateAdminSupportStatus(activeId, status);
            setActiveTicket(data?.ticket || null);
            loadList();
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    const filterTabs = [
        { key: "all", label: t.all },
        { key: "open", label: `${t.statusOpen} (${counts.open})` },
        {
            key: "in_progress",
            label: `${t.statusInProgress} (${counts.in_progress})`,
        },
        { key: "closed", label: `${t.statusClosed} (${counts.closed})` },
    ];

    return (
        <div style={pageDir}>
            <div style={headerRow}>
                <LifeBuoy size={24} color="var(--blue)" />
                <h1 style={title}>{t.inbox}</h1>
            </div>

            <div style={filterRow}>
                {filterTabs.map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        style={filterBtnStyle(tab.key)}
                        onClick={() => {
                            setFilter(tab.key);
                            setActiveId(null);
                            setActiveTicket(null);
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div style={layout}>
                <div style={card}>
                    {tickets.length === 0 ? (
                        <div style={emptyState}>{t.empty}</div>
                    ) : (
                        tickets.map((tk) => (
                            <div
                                key={tk._id}
                                style={
                                    tk._id === activeId
                                        ? ticketItemActive
                                        : ticketItem
                                }
                                onClick={() => setActiveId(tk._id)}
                            >
                                <div style={ticketSubject}>{tk.subject}</div>
                                <div style={metaRow}>
                                    <span style={badgeStyle(tk.status)}>
                                        {statusLabel(tk.status)}
                                    </span>
                                    <span>
                                        <UserIcon size={12} /> {personName(tk.user)}
                                    </span>
                                    <span>
                                        {t.cats?.[tk.category] || tk.category}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div style={card}>
                    {activeTicket ? (
                        <div>
                            <div style={listHeader}>
                                <div>
                                    <div style={ticketSubject}>
                                        {activeTicket.subject}
                                    </div>
                                    <div style={metaRow}>
                                        <span style={badgeStyle(activeTicket.status)}>
                                            {statusLabel(activeTicket.status)}
                                        </span>
                                        <span>
                                            {t.from}: {personName(activeTicket.user)}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    style={ghostBtn}
                                    onClick={() => {
                                        setActiveId(null);
                                        setActiveTicket(null);
                                    }}
                                >
                                    <ArrowLeft size={15} /> {t.back}
                                </button>
                            </div>

                            <div style={statusBtnRow}>
                                {STATUSES.map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        style={ghostBtn}
                                        onClick={() => handleStatus(s)}
                                    >
                                        {statusLabel(s)}
                                    </button>
                                ))}
                            </div>

                            <div style={threadBox}>
                                {(activeTicket.messages || []).map((m, i) => (
                                    <div
                                        key={m._id || i}
                                        style={bubbleStyle(m.senderRole === "admin")}
                                    >
                                        <div style={bubbleHeader}>
                                            {m.sender?.profilePhoto && m.sender.profilePhoto.startsWith("http") ? (
                                                <img
                                                    src={m.sender.profilePhoto}
                                                    alt=""
                                                    style={Object.assign({
                                                        width: "22px",
                                                        height: "22px",
                                                        borderRadius: "50%",
                                                        objectFit: "cover",
                                                        flexShrink: 0,
                                                    })}
                                                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                                                />
                                            ) : null}
                                            <span>
                                                {m.senderRole === "admin"
                                                    ? t.teamLabel
                                                    : personName(m.sender) ||
                                                      t.customerLabel}
                                            </span>
                                        </div>
                                        <div>{m.text}</div>
                                    </div>
                                ))}
                                <div ref={endRef} />
                            </div>

                            <form onSubmit={handleReply} style={replyRow}>
                                <input
                                    style={replyInput}
                                    value={reply}
                                    onChange={(e) => setReply(e.target.value)}
                                    placeholder={t.typeMessage}
                                />
                                <button type="submit" style={primaryBtn}>
                                    <Send size={16} /> {t.send}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div style={emptyState}>{t.selectPrompt}</div>
                    )}
                </div>
            </div>
        </div>
    );
}
