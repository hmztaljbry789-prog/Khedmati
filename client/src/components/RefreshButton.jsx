import { RefreshCw } from "lucide-react";

// Shared manual-refresh button used across data pages. Pair it with the
// useAutoRefresh hook for periodic background refreshes.
const btnBase = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 14px",
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    border: "1px solid var(--border)",
    background: "var(--card-solid)",
    color: "var(--text)",
    fontFamily: "var(--font-body)",
    transition: "border-color 0.15s, opacity 0.15s",
};

const iconWrap = (spinning) => ({
    display: "inline-flex",
    animation: spinning ? "kh-spin 0.8s linear infinite" : "none",
});

export default function RefreshButton({
    onClick,
    refreshing = false,
    label = "Refresh",
    title,
    style,
}) {
    const merged = style ? { ...btnBase, ...style } : btnBase;
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={refreshing}
            title={title || label}
            style={merged}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--blue)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        >
            <span style={iconWrap(refreshing)}>
                <RefreshCw size={15} />
            </span>
            {label}
            <style>{`@keyframes kh-spin{to{transform:rotate(360deg)}}`}</style>
        </button>
    );
}
