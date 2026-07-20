import { useState, useEffect, useContext, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import PortalContext from "../context/PortalContext";
import { translations } from "../utils/translations";
import {
    createSupportTicket,
    getMySupportTickets,
    getSupportTicket,
    sendSupportMessage,
} from "../utils/api";
import { LifeBuoy, Plus, Send, ArrowLeft, Clock } from "lucide-react";

const CATEGORIES = ["general", "booking", "payment", "complaint", "technical"];

// ── Styles (named objects keep us clear of inline-style braces) ──
const page = {
    maxWidth: "1100px",
    margin: "0 auto",
    padding: "96px 20px 60px",
    fontFamily: "var(--font-body)",
    color: "var(--text)",
};
const headerRow = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "6px",
};
const title = {
    fontFamily: "var(--font-display)",
    fontSize: "28px",
    fontWeight: 700,
    margin: 0,
};
const subtitle = {
    color: "var(--text-muted)",
    fontSize: "15px",
    marginBottom: "24px",
};
const layout = {
    display: "grid",
    gridTemplateColumns: "minmax(280px, 360px) 1fr",
    gap: "20px",
    alignItems: "start",
};
const card = {
    background: "var(--card-solid)",
    border: "1px solid var(--border)",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08), var(--shadow)",
};
const listHeader = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "12px",
    gap: "10px",
};
const listTitle = { fontWeight: 700, fontSize: "16px" };
const primaryBtn = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "linear-gradient(135deg, var(--blue), var(--blue-bright))",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    padding: "11px 20px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 4px 12px var(--blue-glow)",
    transition: "all 0.2s ease",
};
const ghostBtn = {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "transparent",
    color: "var(--text)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "10px 16px",
    fontSize: "14px",
    cursor: "pointer",
    transition: "all 0.2s ease",
};
const ticketItem = {
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "12px",
    marginBottom: "10px",
    cursor: "pointer",
    background: "var(--bg-2)",
    transition: "all 0.2s ease",
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
const label = {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    marginBottom: "6px",
    color: "var(--text-dim)",
};
const input = {
    width: "100%",
    boxSizing: "border-box",
    background: "var(--input-bg)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "12px 16px",
    color: "var(--text)",
    fontSize: "14px",
    fontFamily: "var(--font-body)",
    marginBottom: "14px",
    outline: "none",
    transition: "all 0.2s ease",
};
const textarea = {
    ...input,
    minHeight: "110px",
    resize: "vertical",
};
const threadBox = {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "460px",
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
const errorText = { color: "var(--red)", fontSize: "13px", marginBottom: "12px" };
const emptyState = {
    textAlign: "center",
    color: "var(--text-muted)",
    padding: "40px 10px",
    fontSize: "14px",
};
const promptWrap = { ...page, textAlign: "center", paddingTop: "140px" };

export default function Support() {
    const { user, isAuthenticated } = useAuth();
    const { locale } = useContext(PortalContext);
    const t = translations[locale].support;
    const isRtl = locale === "ar";

    const [tickets, setTickets] = useState([]);
    const [activeId, setActiveId] = useState(null);
    const [activeTicket, setActiveTicket] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [subject, setSubject] = useState("");
    const [category, setCategory] = useState("general");
    const [message, setMessage] = useState("");
    const [reply, setReply] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const endRef = useRef(null);

    const loadList = useCallback(async () => {
        try {
            const data = await getMySupportTickets();
            setTickets(data?.tickets || []);
        } catch (e) {
            console.error("Failed to load tickets", e);
        }
    }, []);

    const loadTicket = useCallback(async (id) => {
        try {
            const data = await getSupportTicket(id);
            setActiveTicket(data?.ticket || null);
        } catch (e) {
            console.error("Failed to load ticket", e);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) loadList();
    }, [isAuthenticated, loadList]);

    useEffect(() => {
        if (!activeId) return undefined;
        loadTicket(activeId);
        const interval = setInterval(() => loadTicket(activeId), 4000);
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

    // Computed style helpers (no inline double-brace literals).
    const badgeStyle = (s) => ({ ...badge, background: statusColor(s) });
    const bubbleStyle = (mine) => ({
        ...bubbleBase,
        alignSelf: mine ? "flex-end" : "flex-start",
        background: mine ? "var(--blue-dim)" : "var(--bg-2)",
        border: mine ? "1px solid var(--border-blue)" : "1px solid var(--border)",
    });
    const pageDir = { ...page, direction: isRtl ? "rtl" : "ltr" };
    const promptDir = { ...promptWrap, direction: isRtl ? "rtl" : "ltr" };
    const replyInput = { ...input, flex: 1, marginBottom: 0 };

    const handleCreate = async (e) => {
        e.preventDefault();
        setError("");
        if (!subject.trim() || !message.trim()) {
            setError(t.required);
            return;
        }
        try {
            setBusy(true);
            const data = await createSupportTicket({ subject, category, message });
            setSubject("");
            setMessage("");
            setCategory("general");
            setShowForm(false);
            await loadList();
            if (data?.ticket?._id) setActiveId(data.ticket._id);
        } catch (err) {
            setError(typeof err === "string" ? err : err?.message || "Error");
        } finally {
            setBusy(false);
        }
    };

    const handleReply = async (e) => {
        e.preventDefault();
        if (!reply.trim()) return;
        const text = reply;
        setReply("");
        try {
            const data = await sendSupportMessage(activeId, text);
            setActiveTicket(data?.ticket || null);
            loadList();
        } catch (err) {
            console.error("Failed to send reply", err);
        }
    };

    if (!isAuthenticated) {
        return (
            <div style={promptDir}>
                <LifeBuoy size={40} color="var(--blue)" />
                <h2 style={title}>{t.title}</h2>
                <p style={subtitle}>{t.loginPrompt}</p>
            </div>
        );
    }

    return (
        <div style={pageDir}>
            <div style={headerRow}>
                <LifeBuoy size={26} color="var(--blue)" />
                <h1 style={title}>{t.title}</h1>
            </div>
            <p style={subtitle}>{t.subtitle}</p>

            <div style={layout}>
                {/* Left column: list + new ticket */}
                <div style={card}>
                    <div style={listHeader}>
                        <span style={listTitle}>{t.myTickets}</span>
                        <button
                            type="button"
                            style={primaryBtn}
                            onClick={() => {
                                setShowForm((v) => !v);
                                setActiveId(null);
                                setActiveTicket(null);
                            }}
                        >
                            <Plus size={16} /> {t.newTicket}
                        </button>
                    </div>

                    {tickets.length === 0 && !showForm ? (
                        <div style={emptyState}>{t.noTickets}</div>
                    ) : (
                        tickets.map((tk) => (
                            <div
                                key={tk._id}
                                style={
                                    tk._id === activeId ? ticketItemActive : ticketItem
                                }
                                onClick={() => {
                                    setActiveId(tk._id);
                                    setShowForm(false);
                                }}
                            >
                                <div style={ticketSubject}>{tk.subject}</div>
                                <div style={metaRow}>
                                    <span style={badgeStyle(tk.status)}>
                                        {statusLabel(tk.status)}
                                    </span>
                                    <span>{t.cats?.[tk.category] || tk.category}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Right column: form or thread */}
                <div style={card}>
                    {showForm ? (
                        <form onSubmit={handleCreate}>
                            <label style={label}>{t.subject}</label>
                            <input
                                style={input}
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder={t.subjectPlaceholder}
                            />
                            <label style={label}>{t.category}</label>
                            <select
                                style={input}
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                {CATEGORIES.map((c) => (
                                    <option key={c} value={c}>
                                        {t.cats?.[c] || c}
                                    </option>
                                ))}
                            </select>
                            <label style={label}>{t.message}</label>
                            <textarea
                                style={textarea}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder={t.typeMessage}
                            />
                            {error ? <div style={errorText}>{error}</div> : null}
                            <button type="submit" style={primaryBtn} disabled={busy}>
                                {busy ? t.sending : t.create}
                            </button>
                        </form>
                    ) : activeTicket ? (
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
                                            {t.cats?.[activeTicket.category] ||
                                                activeTicket.category}
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

                            <div style={threadBox}>
                                {(activeTicket.messages || []).map((m, i) => {
                                    const mine =
                                        m.senderRole !== "admin" &&
                                        String(m.sender?._id || m.sender) ===
                                            String(user?._id);
                                    return (
                                        <div
                                            key={m._id || i}
                                            style={bubbleStyle(mine)}
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
                                                        : t.youLabel}
                                                </span>
                                            </div>
                                            <div>{m.text}</div>
                                        </div>
                                    );
                                })}
                                <div ref={endRef} />
                            </div>

                            {activeTicket.status === "closed" ? (
                                <div style={metaRow}>
                                    <Clock size={14} /> {t.closedNote}
                                </div>
                            ) : null}

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
