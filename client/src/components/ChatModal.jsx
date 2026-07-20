import { useState, useEffect, useRef, useContext, useCallback } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../context/AuthContext";
import { getChatMessages, sendChatMessage } from "../utils/api";
import PortalContext from "../context/PortalContext";
import { translations } from "../utils/translations";
import { X, Send, Clock, Sparkles } from "lucide-react";
import useFocusTrap from "../utils/useFocusTrap";
import { format } from "date-fns";

const s = {
    overlay: {
        position: "fixed",
        inset: 0,
        zIndex: 999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(8, 9, 15, 0.6)",
        backdropFilter: "blur(8px)",
    },
    card: {
        width: "min(92vw, 480px)",
        height: "min(85vh, 600px)",
        display: "flex",
        flexDirection: "column",
        background: "var(--card-solid)",
        border: "1px solid var(--border-light)",
        borderRadius: 24,
        boxShadow: "var(--shadow-lg)",
        overflow: "hidden",
        animation: "chatSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
    },
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px 20px",
        borderBottom: "1px solid var(--border)",
        background: "var(--glass-bg)",
        flexShrink: 0,
    },
    headerInfo: { display: "flex", alignItems: "center", gap: 10 },
    headerIcon: {
        width: 34,
        height: 34,
        borderRadius: 10,
        background: "linear-gradient(135deg, var(--blue), var(--cyan))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    headerText: { textAlign: "start" },
    headerTitle: {
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: 14,
        color: "var(--text)",
        margin: 0,
    },
    headerSub: { fontSize: 11, color: "var(--text-muted)" },
    closeBtn: {
        background: "var(--glass-bg)",
        border: "1px solid var(--border)",
        cursor: "pointer",
        color: "var(--text-muted)",
        padding: 6,
        borderRadius: 10,
        width: 32,
        height: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
    },
    body: {
        flex: 1,
        overflowY: "auto",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        background:
            "radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.05), transparent 70%)",
    },
    stateBox: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100%",
        fontSize: 13,
        color: "var(--text-muted)",
    },
    emptyBox: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        color: "var(--text-muted)",
        textAlign: "center",
        gap: 8,
        padding: 24,
    },
    emptyEmoji: { fontSize: 28 },
    emptyTitle: { fontSize: 13, fontWeight: 600, color: "var(--text-dim)", margin: 0 },
    emptyDesc: { fontSize: 11, margin: 0 },
    senderTag: {
        fontSize: 10,
        color: "var(--text-muted)",
        marginBottom: 3,
        padding: "0 4px",
    },
    time: {
        fontSize: 9,
        color: "var(--text-muted)",
        marginTop: 3,
        display: "flex",
        alignItems: "center",
        gap: 3,
        padding: "0 4px",
    },
    footer: {
        padding: "16px 20px",
        borderTop: "1px solid var(--border)",
        background: "var(--glass-bg)",
        display: "flex",
        gap: 10,
        alignItems: "center",
        flexShrink: 0,
    },
    input: {
        flex: 1,
        padding: "10px 14px",
        borderRadius: 12,
        fontSize: 13,
        border: "1px solid var(--border)",
        background: "var(--glass-bg)",
        color: "var(--text)",
        outline: "none",
        fontFamily: "var(--font-body)",
        transition: "border-color 0.2s",
        textAlign: "start",
    },
    sendBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        background: "linear-gradient(135deg, var(--blue), var(--cyan))",
        color: "#fff",
        border: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        padding: 0,
        transition: "opacity 0.2s",
    },
};

export default function ChatModal({ booking, onClose }) {
    const { user } = useAuth();
    const { locale } = useContext(PortalContext);
    const t = translations[locale];
    const isRtl = locale === "ar";
    const dir = isRtl ? "rtl" : "ltr";

    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const cardRef = useRef(null);
    useFocusTrap(cardRef, true);

    // useCallback keeps the function identity stable per booking, so the
    // effects below can list it as a dependency (react-hooks/exhaustive-deps).
    const fetchMessages = useCallback(
        async (showLoading = false) => {
            try {
                if (showLoading) setLoading(true);
                const data = await getChatMessages(booking.bookingId);
                setMessages(data || []);
            } catch (error) {
                console.error("Error fetching chat messages:", error);
            } finally {
                if (showLoading) setLoading(false);
            }
        },
        [booking.bookingId]
    );

    useEffect(() => {
        fetchMessages(true);
    }, [fetchMessages]);

    useEffect(() => {
        const interval = setInterval(() => {
            fetchMessages(false);
        }, 3000);
        return () => clearInterval(interval);
    }, [fetchMessages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim() || !user?._id) return;
        const originalText = text;
        setText("");
        try {
            const newMsg = await sendChatMessage(
                booking.bookingId,
                user._id,
                originalText
            );
            setMessages((prev) => [...prev, newMsg]);
        } catch (error) {
            console.error("Error sending message:", error);
            alert(t.failedToSendMessage);
            setText(originalText);
        }
    };

    const canSend = text.trim().length > 0;
    const sendBtnStyle = {
        ...s.sendBtn,
        opacity: canSend ? 1 : 0.5,
        cursor: canSend ? "pointer" : "not-allowed",
    };
    const sendIconStyle = { transform: isRtl ? "rotate(180deg)" : "rotate(0deg)" };

    // Render through a portal on document.body: parent cards use backdrop-filter
    // and overflow hidden, which would otherwise trap and clip this fixed overlay.
    return createPortal(
        <div style={s.overlay} onClick={onClose}>
            <div ref={cardRef} style={s.card} dir={dir} onClick={(e) => e.stopPropagation()}>
                <div style={s.header}>
                    <div style={s.headerInfo}>
                        <div style={s.headerIcon}>
                            <Sparkles size={15} color="#fff" />
                        </div>
                        <div style={s.headerText}>
                            <h3 style={s.headerTitle}>{t.chatTitle}</h3>
                            <span style={s.headerSub}>
                                {t.chatOrder} #{booking.bookingId}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} style={s.closeBtn} aria-label="close">
                        <X size={18} />
                    </button>
                </div>

                <div style={s.body}>
                    {loading ? (
                        <div style={s.stateBox}>{t.loadingChat}</div>
                    ) : messages.length === 0 ? (
                        <div style={s.emptyBox}>
                            <div style={s.emptyEmoji}>{"\ud83d\udcac"}</div>
                            <p style={s.emptyTitle}>{t.noMessagesYet}</p>
                            <p style={s.emptyDesc}>{t.noMessagesDesc}</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => {
                            const isMe = msg.sender?._id === user?._id;
                            const isSenderProvider = msg.sender?.role === "provider";
                            const rowStyle = {
                                display: "flex",
                                flexDirection: "column",
                                alignItems: isMe ? "flex-end" : "flex-start",
                                width: "100%",
                            };
                            const bubbleStyle = {
                                maxWidth: "80%",
                                padding: "10px 14px",
                                borderRadius: isMe
                                    ? "18px 18px 4px 18px"
                                    : "18px 18px 18px 4px",
                                background: isMe
                                    ? "linear-gradient(135deg, var(--blue), var(--blue-bright))"
                                    : "var(--card-solid)",
                                border: isMe ? "none" : "1px solid var(--border)",
                                color: isMe ? "#fff" : "var(--text)",
                                boxShadow: isMe
                                    ? "0 4px 10px rgba(59, 130, 246, 0.15)"
                                    : "var(--shadow)",
                                wordBreak: "break-word",
                                fontSize: 13,
                                lineHeight: 1.5,
                                textAlign: "start",
                            };
                            return (
                                <div key={msg._id || idx} style={rowStyle}>
                                    <span style={s.senderTag}>
                                        {msg.sender?.profilePhoto && msg.sender.profilePhoto.startsWith("http") && (
                                            <img
                                                src={msg.sender.profilePhoto}
                                                alt=""
                                                style={Object.assign({
                                                    width: "18px",
                                                    height: "18px",
                                                    borderRadius: "50%",
                                                    objectFit: "cover",
                                                    verticalAlign: "middle",
                                                    marginInlineEnd: "5px",
                                                    border: "1px solid var(--border)"
                                                })}
                                                onError={(e) => { e.target.style.display = "none"; }}
                                            />
                                        )}
                                        {msg.sender?.first_name} {msg.sender?.last_name} (
                                        {isSenderProvider
                                            ? t.roleLabelProvider
                                            : t.roleLabelCustomer}
                                        )
                                    </span>
                                    <div style={bubbleStyle}>{msg.text}</div>
                                    <span style={s.time}>
                                        <Clock size={9} />
                                        {msg.createdAt
                                            ? format(new Date(msg.createdAt), "h:mm a")
                                            : ""}
                                    </span>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSend} style={s.footer}>
                    <input
                        type="text"
                        value={text}
                        placeholder={t.writeMessagePlaceholder}
                        required
                        dir={dir}
                        onChange={(e) => setText(e.target.value)}
                        style={s.input}
                        onFocus={(e) => (e.target.style.borderColor = "var(--blue)")}
                        onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                    />
                    <button
                        type="submit"
                        disabled={!canSend}
                        className="btn-glow"
                        style={sendBtnStyle}
                    >
                        <Send size={15} style={sendIconStyle} />
                    </button>
                </form>
            </div>
            <style>{`
                @keyframes chatSlideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>,
        document.body
    );
}
