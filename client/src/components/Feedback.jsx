import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";
import FeedbackContext from "./FeedbackContext";

// Lightweight, dependency-free toast + confirm system that matches the app
// theme (CSS variables) and supports RTL. Usage:
//   const { toast, confirm } = useFeedback();
//   toast("Saved!", "success");
//   if (await confirm("Are you sure?", { danger: true })) { ... }

const palette = {
    success: { color: "#22c55e", Icon: CheckCircle },
    error: { color: "#ef4444", Icon: XCircle },
    warning: { color: "#f59e0b", Icon: AlertTriangle },
    info: { color: "#5b8cff", Icon: Info },
};

const stackStyle = {
    position: "fixed",
    top: 20,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 10000,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    width: "min(92vw, 440px)",
    pointerEvents: "none",
};

const toastStyle = (color) => ({
    display: "flex",
    alignItems: "center",
    gap: 10,
    maxWidth: "100%",
    padding: "10px 16px",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text, #eaeef6)",
    background: "var(--card-solid, #141826)",
    border: `1px solid ${color}55`,
    boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
    pointerEvents: "auto",
    animation: "kh-toast-in 0.25s ease",
});

const toastIconStyle = (color) => ({ color, flexShrink: 0 });

const overlayStyle = {
    position: "fixed",
    inset: 0,
    zIndex: 10001,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    background: "rgba(8, 9, 15, 0.6)",
    backdropFilter: "blur(6px)",
};

const dialogStyle = {
    width: "min(92vw, 380px)",
    padding: 24,
    borderRadius: 18,
    background: "var(--card-solid, #141826)",
    border: "1px solid var(--border, rgba(255,255,255,0.12))",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
    color: "var(--text, #eaeef6)",
    textAlign: "center",
    animation: "kh-toast-in 0.2s ease",
};

const dialogMsgStyle = { fontSize: 14, fontWeight: 600, lineHeight: 1.6, marginBottom: 20 };

const dialogBtnRow = { display: "flex", gap: 10, justifyContent: "center" };

const btnBase = {
    padding: "9px 20px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
};

const cancelBtnStyle = {
    ...btnBase,
    background: "transparent",
    color: "var(--text, #eaeef6)",
    border: "1px solid var(--border, rgba(255,255,255,0.2))",
};

const confirmBtnStyle = (danger) => ({
    ...btnBase,
    border: "none",
    color: "#fff",
    background: danger
        ? "linear-gradient(135deg, #ef4444, #f87171)"
        : "linear-gradient(135deg, var(--blue, #3b82f6), var(--cyan, #22d3ee))",
});

const keyframes = "@keyframes kh-toast-in { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }";

export function FeedbackProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const [dialog, setDialog] = useState(null);
    const idRef = useRef(0);

    const toast = useCallback((message, type = "info", duration = 4200) => {
        const id = ++idRef.current;
        setToasts((prev) => [...prev.slice(-3), { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((item) => item.id !== id));
        }, duration);
    }, []);

    const confirm = useCallback(
        (message, options = {}) =>
            new Promise((resolve) => {
                setDialog({ message, options, resolve });
            }),
        []
    );

    const closeDialog = (result) => {
        setDialog((current) => {
            if (current) current.resolve(result);
            return null;
        });
    };

    const value = { toast, confirm };

    return (
        <FeedbackContext.Provider value={value}>
            {children}
            {createPortal(
                <div style={stackStyle} aria-live="polite">
                    <style>{keyframes}</style>
                    {toasts.map((item) => {
                        const p = palette[item.type] || palette.info;
                        const IconCmp = p.Icon;
                        return (
                            <div key={item.id} style={toastStyle(p.color)} role="status" dir="auto">
                                <IconCmp size={16} style={toastIconStyle(p.color)} />
                                <span dir="auto">{item.message}</span>
                            </div>
                        );
                    })}
                </div>,
                document.body
            )}
            {dialog &&
                createPortal(
                    <div
                        style={overlayStyle}
                        onClick={() => closeDialog(false)}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div style={dialogStyle} onClick={(e) => e.stopPropagation()} dir="auto">
                            <p style={dialogMsgStyle} dir="auto">{dialog.message}</p>
                            <div style={dialogBtnRow}>
                                <button
                                    type="button"
                                    style={cancelBtnStyle}
                                    onClick={() => closeDialog(false)}
                                    autoFocus
                                >
                                    {dialog.options.cancelLabel || "Cancel"}
                                </button>
                                <button
                                    type="button"
                                    style={confirmBtnStyle(dialog.options.danger)}
                                    onClick={() => closeDialog(true)}
                                >
                                    {dialog.options.confirmLabel || "OK"}
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </FeedbackContext.Provider>
    );
}
