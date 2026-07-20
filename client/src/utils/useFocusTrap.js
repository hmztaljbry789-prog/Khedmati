import { useEffect } from "react";

const FOCUSABLE_SELECTOR = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "textarea:not([disabled])",
    "select:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
].join(", ");

/**
 * Traps keyboard focus inside a modal container while it is open.
 *
 * - Moves focus to the first focusable element when the modal opens.
 * - Tab / Shift+Tab cycle within the container instead of escaping to the page.
 * - Restores focus to the previously focused element when the modal closes.
 *
 * @param {object} containerRef - React ref pointing at the modal container.
 * @param {boolean} active - Whether the trap is currently enabled.
 */
export default function useFocusTrap(containerRef, active) {
    useEffect(() => {
        if (!active || !containerRef.current) return;
        const container = containerRef.current;
        const previouslyFocused = document.activeElement;

        // Move focus into the dialog on open.
        const initial = container.querySelector(FOCUSABLE_SELECTOR);
        if (initial) initial.focus();

        const onKeyDown = (event) => {
            if (event.key !== "Tab") return;
            const items = Array.from(
                container.querySelectorAll(FOCUSABLE_SELECTOR)
            ).filter((el) => el.offsetParent !== null || el === document.activeElement);
            if (items.length === 0) return;

            const first = items[0];
            const last = items[items.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("keydown", onKeyDown);
            if (previouslyFocused && previouslyFocused.focus) {
                previouslyFocused.focus();
            }
        };
    }, [containerRef, active]);
}
