import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useRef,
} from "react";
import { useAuth } from "./AuthContext";
import {
    getNotifications,
    markNotificationRead,
    markAllNotificationsRead,
} from "../utils/api";

const NotificationContext = createContext(null);

// Convenience hook for components that need the notification state.
// eslint-disable-next-line react-refresh/only-export-components
export const useNotifications = () => useContext(NotificationContext);

// Holds the current user's in-app notifications and keeps them fresh by
// polling the backend every 15s (the app has no websockets). The list is also
// refreshed instantly whenever the tab regains focus, and a short chime is
// played when a brand-new unread notification arrives. Push notifications are
// handled separately by the service worker; this powers the in-app bell.
export function NotificationProvider({ children }) {
    const { isAuthenticated, user } = useAuth();
    const [items, setItems] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const timerRef = useRef(null);
    const audioCtxRef = useRef(null);
    const firstLoadRef = useRef(true);
    const knownIdsRef = useRef(new Set());

    // Browsers block audio until the user interacts with the page, so we
    // create/unlock the AudioContext on the first click or key press. After
    // that, the chime can play from background polling as well.
    useEffect(() => {
        const unlock = () => {
            try {
                const Ctx = window.AudioContext || window.webkitAudioContext;
                if (Ctx) {
                    if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
                    if (audioCtxRef.current.state === "suspended") {
                        audioCtxRef.current.resume();
                    }
                }
            } catch (err) {
                // Sound is best-effort only.
            }
            window.removeEventListener("pointerdown", unlock);
            window.removeEventListener("keydown", unlock);
        };
        window.addEventListener("pointerdown", unlock);
        window.addEventListener("keydown", unlock);
        return () => {
            window.removeEventListener("pointerdown", unlock);
            window.removeEventListener("keydown", unlock);
        };
    }, []);

    // A short two-tone chime generated with the Web Audio API, so no audio
    // file has to be shipped. Fails silently when audio is unavailable.
    const playChime = useCallback(() => {
        try {
            const ctx = audioCtxRef.current;
            if (!ctx || ctx.state !== "running") return;
            const now = ctx.currentTime;
            [880, 1174.66].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = "sine";
                osc.frequency.value = freq;
                const start = now + i * 0.12;
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(0.08, start + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(start);
                osc.stop(start + 0.4);
            });
        } catch (err) {
            // Sound is best-effort only.
        }
    }, []);

    const refresh = useCallback(async () => {
        if (!isAuthenticated || !user) return;
        try {
            const data = await getNotifications();
            const fresh = data.items || [];
            // Chime only for notifications we have never seen before, and
            // never on the very first load after login/refresh.
            if (firstLoadRef.current) {
                firstLoadRef.current = false;
            } else if (
                fresh.some((n) => !n.read && !knownIdsRef.current.has(n._id))
            ) {
                playChime();
            }
            knownIdsRef.current = new Set(fresh.map((n) => n._id));
            setItems(fresh);
            setUnreadCount(data.unreadCount || 0);
        } catch (err) {
            // Notifications are non-critical; stay silent on failure.
        }
    }, [isAuthenticated, user, playChime]);

    const markRead = useCallback(async (id) => {
        setItems((prev) =>
            prev.map((n) => (n._id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
        try {
            await markNotificationRead(id);
        } catch (err) {
            // ignore
        }
    }, []);

    const markAll = useCallback(async () => {
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
        try {
            await markAllNotificationsRead();
        } catch (err) {
            // ignore
        }
    }, []);

    useEffect(() => {
        if (!isAuthenticated || !user) {
            setItems([]);
            setUnreadCount(0);
            firstLoadRef.current = true;
            knownIdsRef.current = new Set();
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }
        refresh();
        timerRef.current = setInterval(refresh, 15000);
        // Catch up immediately when the user returns to the tab instead of
        // waiting for the next polling tick.
        const onFocus = () => refresh();
        const onVisible = () => {
            if (!document.hidden) refresh();
        };
        window.addEventListener("focus", onFocus);
        document.addEventListener("visibilitychange", onVisible);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            window.removeEventListener("focus", onFocus);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [isAuthenticated, user, refresh]);

    const value = { items, unreadCount, refresh, markRead, markAll };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
}

export default NotificationContext;
