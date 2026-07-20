import { Component } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

const wrapStyle = {
    minHeight: "60vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    padding: 24,
    textAlign: "center",
    color: "var(--text, #eaeef6)",
};

const iconWrapStyle = {
    width: 56,
    height: 56,
    borderRadius: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(245, 158, 11, 0.12)",
    color: "#f59e0b",
    border: "1px solid rgba(245, 158, 11, 0.3)",
};

const titleStyle = { margin: 0, fontSize: 18, fontWeight: 800 };
const subStyle = { margin: 0, fontSize: 13, opacity: 0.7, maxWidth: 420, lineHeight: 1.7 };

const btnStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    padding: "10px 22px",
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 700,
    color: "#fff",
    border: "none",
    cursor: "pointer",
    background: "linear-gradient(135deg, #3b82f6, #22d3ee)",
};

// Catches unexpected render errors anywhere in the tree so a single broken
// component shows a friendly recovery screen instead of a blank page.
export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        if (import.meta.env.DEV) {
            console.error("ErrorBoundary caught:", error, info);
        }
    }

    render() {
        if (!this.state.hasError) return this.props.children;
        return (
            <div style={wrapStyle}>
                <div style={iconWrapStyle}>
                    <AlertTriangle size={26} />
                </div>
                <h2 style={titleStyle} dir="rtl">حدث خطأ غير متوقع</h2>
                <p style={subStyle} dir="rtl">
                    نعتذر عن هذا الخلل — جرّب إعادة تحميل الصفحة.
                    <br />
                    Something went wrong — please reload the page.
                </p>
                <button
                    type="button"
                    style={btnStyle}
                    onClick={() => window.location.reload()}
                >
                    <RotateCw size={15} /> إعادة التحميل / Reload
                </button>
            </div>
        );
    }
}
