import { useState, useRef, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check } from "lucide-react";
import PortalContext from "../context/PortalContext";
import { useNotifications } from "../context/NotificationContext";
import { enablePush } from "../utils/push";
import { translations } from "../utils/translations";

export default function NotificationBell() {
    const { locale } = useContext(PortalContext);
    const t =
        translations[locale]?.notifications || translations.ar.notifications;
    const isRtl = locale === "ar";
    const { items, unreadCount, markRead, markAll } = useNotifications();
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const navigate = useNavigate();

    // Try to enable browser push once when the bell first mounts. This is a
    // no-op if the user denies permission or the server has no VAPID keys.
    useEffect(() => {
        enablePush();
    }, []);

    // Close the dropdown when clicking outside it.
    useEffect(() => {
        const onClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    const handleOpen = (n) => {
        if (!n.read) markRead(n._id);
        if (n.link) {
            setOpen(false);
            navigate(n.link);
        }
    };

    const s = {
        wrap: { position: "relative" },
        btn: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 8,
            borderRadius: "50%",
            background: "var(--card)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            cursor: "pointer",
            position: "relative",
        },
        badge: {
            position: "absolute",
            top: -2,
            insetInlineEnd: -2,
            minWidth: 16,
            height: 16,
            padding: "0 4px",
            borderRadius: 8,
            background: "var(--red)",
            color: "#fff",
            fontSize: 10,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        },
        panel: {
            position: "absolute",
            top: 44,
            insetInlineEnd: 0,
            width: 320,
            maxWidth: "calc(100vw - 24px)",
            maxHeight: 420,
            overflowY: "auto",
            background: "var(--card-solid)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
            zIndex: 60,
            direction: isRtl ? "rtl" : "ltr",
        },
        header: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 14px",
            borderBottom: "1px solid var(--border)",
            fontWeight: 700,
            color: "var(--text)",
        },
        markAllBtn: {
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 12,
            color: "var(--blue)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
        },
        title: { fontSize: 13, fontWeight: 700, color: "var(--text)" },
        body: { fontSize: 12, color: "var(--text-muted)", marginTop: 2 },
        empty: {
            padding: 24,
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: 13,
        },
    };

    const itemStyle = (read) => ({
        padding: "10px 14px",
        borderBottom: "1px solid var(--border-light)",
        background: read ? "transparent" : "var(--blue-dim)",
        cursor: "pointer",
    });

    return (
        <div style={s.wrap} ref={ref}>
            <button
                style={s.btn}
                onClick={() => setOpen((v) => !v)}
                title={t.title}
            >
                <Bell size={16} />
                {unreadCount > 0 && (
                    <span style={s.badge}>
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>
            {open && (
                <div style={s.panel}>
                    <div style={s.header}>
                        <span>{t.title}</span>
                        {items.length > 0 && (
                            <button style={s.markAllBtn} onClick={markAll}>
                                <Check size={13} />
                                <span>{t.markAll}</span>
                            </button>
                        )}
                    </div>
                    {items.length === 0 ? (
                        <div style={s.empty}>{t.empty}</div>
                    ) : (
                        items.map((n) => (
                            <div
                                key={n._id}
                                style={itemStyle(n.read)}
                                onClick={() => handleOpen(n)}
                            >
                                <div style={s.title}>
                                    {isRtl
                                        ? n.titleAr || n.titleEn
                                        : n.titleEn || n.titleAr}
                                </div>
                                <div style={s.body}>
                                    {isRtl
                                        ? n.bodyAr || n.bodyEn
                                        : n.bodyEn || n.bodyAr}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
