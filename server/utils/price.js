// Clamp a proposed price into the platform-approved range.
// Returns null when the value is not a finite number.
export function clampPrice(value, range = {}) {
    let v = Number(value);
    if (!Number.isFinite(v)) return null;
    if (range.min != null) v = Math.max(range.min, v);
    if (range.max != null) v = Math.min(range.max, v);
    return v;
}

export default clampPrice;
