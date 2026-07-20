import { useEffect, useRef } from "react";

// Calls `onRefresh` every `intervalMs` while `enabled` is true.
// - Pauses automatically when the browser tab is hidden (saves requests).
// - Fires once immediately when the tab becomes visible again so the data the
//   user sees is never stale.
// The latest `onRefresh` is kept in a ref so changing the callback does not
// restart the interval on every render.
export function useAutoRefresh(onRefresh, intervalMs = 30000, enabled = true) {
    const savedFn = useRef(onRefresh);

    useEffect(() => {
        savedFn.current = onRefresh;
    }, [onRefresh]);

    useEffect(() => {
        if (!enabled || !intervalMs) return undefined;

        let timer = null;

        const tick = () => {
            if (typeof document !== "undefined" && document.hidden) return;
            savedFn.current && savedFn.current();
        };
        const start = () => {
            if (timer) return;
            timer = setInterval(tick, intervalMs);
        };
        const stop = () => {
            if (!timer) return;
            clearInterval(timer);
            timer = null;
        };
        const onVisibility = () => {
            if (document.hidden) {
                stop();
            } else {
                savedFn.current && savedFn.current();
                start();
            }
        };

        start();
        document.addEventListener("visibilitychange", onVisibility);
        return () => {
            stop();
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, [intervalMs, enabled]);
}

export default useAutoRefresh;
