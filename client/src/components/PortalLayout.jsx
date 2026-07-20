import { useContext, useEffect, useRef } from "react";
import { X } from "lucide-react";
import PortalContext from "../context/PortalContext";
import useFocusTrap from "../utils/useFocusTrap";

export default function PortalLayout({ isOpen, onClose, children }) {
    const ref = useRef(null);
    const { locale } = useContext(PortalContext);
    const isRtl = locale === "ar";
    useFocusTrap(ref, isOpen);

    useEffect(() => {
        if (!isOpen) return;
        const clickOut = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
        const keyDown  = (e) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("mousedown", clickOut);
        document.addEventListener("keydown", keyDown);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("mousedown", clickOut);
            document.removeEventListener("keydown", keyDown);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 50,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
            background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)",
        }}>
            <div
                ref={ref}
                style={{
                    position: "relative", maxHeight: "90vh", overflowY: "auto",
                    background: "var(--card-solid)", border: "1px solid var(--border-light)",
                    borderRadius: 24, boxShadow: "var(--shadow-lg), var(--shadow-blue)",
                    animation: "modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)",
                }}
            >
                <button
                    onClick={onClose}
                    style={{
                        position: "absolute", top: 12, zIndex: 10,
                        // Mirror the close button with the reading direction.
                        ...(isRtl ? { left: 12 } : { right: 12 }),
                        width: 30, height: 30, borderRadius: "50%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "var(--glass-bg)", border: "1px solid var(--border)",
                        color: "var(--text-muted)", cursor: "pointer",
                        transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "var(--red-dim)"; e.currentTarget.style.color = "var(--red)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "var(--glass-bg)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                >
                    <X size={14} />
                </button>
                {children}
            </div>
            <style>{`
                @keyframes modalIn {
                    from { opacity:0; transform:scale(0.92) translateY(12px); }
                    to   { opacity:1; transform:scale(1) translateY(0); }
                }
            `}</style>
        </div>
    );
}
