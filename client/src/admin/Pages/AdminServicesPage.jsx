import { useState, useEffect, useContext } from "react";
import {
    Plus,
    Edit,
    Trash2,
    ChevronDown,
    ChevronRight,
    X,
    Info,
    Layers,
    Tag,
    Wrench,
} from "lucide-react";
import {
    getServices,
    createService,
    updateService,
    deleteService,
    getServiceDetailsById,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    createServiceType,
    updateServiceType,
    deleteServiceType,
    createCategory,
    updateCategory,
    deleteCategory,
    createCategoryDirect,
    updateCategoryDirect,
    deleteCategoryDirect,
} from "../../utils/api";
import PortalContext from "../../context/PortalContext";
import { translations, formatDuration } from "../../utils/translations";

const BACKEND = import.meta.env.VITE_BACKEND_URL;
const imgUrl = (p) => (p ? `${BACKEND}/${p}` : null);

// Localize a database-stored name using the shared static map, preferring an
// explicit Arabic value when present.
const localizeName = (name, locale, ar) => {
    if (locale === "ar" && ar) return ar;
    return (name && translations[locale] && translations[locale][name]) || name;
};

const splitLines = (text) =>
    (text || "")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

/* ==========================================================================
   Shared styles. CSS variables keep everything aligned with the site theme,
   in both light and dark mode. All inline styles are named objects and are
   referenced with a single brace, e.g. style={S.card}.
   ========================================================================== */
const S = {
    page: { display: "flex", flexDirection: "column", gap: 20, width: "100%" },
    headerRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
    },
    rowBetween: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 10,
    },
    rowCenter: { display: "flex", alignItems: "center", gap: 10, minWidth: 0 },
    actionGroup: { display: "flex", alignItems: "center", gap: 8 },
    h1: { fontSize: 24, fontWeight: 800, color: "var(--text)", margin: 0 },
    h2: { fontSize: 20, fontWeight: 800, color: "var(--text)", margin: 0 },
    guide: {
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        background: "var(--blue-dim)",
        border: "1px solid var(--border-blue)",
        borderRadius: 12,
        padding: "12px 14px",
        color: "var(--text-dim)",
        fontSize: 13.5,
        lineHeight: 1.7,
    },
    guideStrong: { color: "var(--text)", display: "block", marginBottom: 2 },
    infoIcon: { color: "var(--blue-bright)", flexShrink: 0, marginTop: 2 },
    layout: { display: "flex", gap: 18, alignItems: "flex-start", flexWrap: "wrap" },
    listPane: {
        flex: "1 1 280px",
        minWidth: 260,
        maxWidth: 360,
        display: "flex",
        flexDirection: "column",
        gap: 10,
    },
    detailPane: { flex: "3 1 520px", minWidth: 300, display: "flex", flexDirection: "column", gap: 14 },
    colGap: { display: "flex", flexDirection: "column", gap: 10 },
    colGapLg: { display: "flex", flexDirection: "column", gap: 16, marginTop: 14 },
    card: {
        background: "var(--card-solid)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: 16,
    },
    itemCard: {
        background: "var(--glass-bg)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 10,
    },
    typeBlock: {
        border: "1px dashed var(--border-light)",
        borderRadius: 12,
        padding: 12,
    },
    listRow: { display: "flex", alignItems: "center", gap: 6 },
    serviceItemRow: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid var(--border)",
        cursor: "pointer",
        background: "transparent",
        color: "var(--text)",
        flex: 1,
        minWidth: 0,
        textAlign: "start",
    },
    serviceItemRowActive: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        borderRadius: 12,
        border: "1px solid var(--border-blue)",
        cursor: "pointer",
        background: "var(--blue-dim)",
        color: "var(--text)",
        flex: 1,
        minWidth: 0,
        textAlign: "start",
    },
    toggleBtn: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: "var(--text)",
        padding: 0,
        minWidth: 0,
        flex: 1,
    },
    thumb: {
        width: 40,
        height: 40,
        borderRadius: 10,
        objectFit: "cover",
        background: "var(--glass-bg)",
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-muted)",
    },
    thumbSmall: {
        width: 36,
        height: 36,
        borderRadius: 8,
        objectFit: "cover",
        background: "var(--glass-bg)",
    },
    strongText: { fontWeight: 700, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
    btnPrimary: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "var(--blue)",
        color: "#fff",
        border: "none",
        borderRadius: 10,
        padding: "9px 14px",
        fontSize: 14,
        fontWeight: 700,
        cursor: "pointer",
    },
    btnGhost: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "var(--glass-bg)",
        color: "var(--text)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "7px 12px",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
    },
    iconBtn: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: 9,
        border: "1px solid var(--border)",
        background: "var(--glass-bg)",
        color: "var(--text-dim)",
        cursor: "pointer",
        flexShrink: 0,
    },
    dangerBtn: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: 9,
        border: "1px solid var(--border)",
        background: "var(--glass-bg)",
        color: "#ef4444",
        cursor: "pointer",
        flexShrink: 0,
    },
    dangerSolidBtn: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "#ef4444",
        color: "#fff",
        border: "none",
        borderRadius: 10,
        padding: "9px 14px",
        fontSize: 14,
        fontWeight: 700,
        cursor: "pointer",
    },
    sectionTitle: { fontSize: 13, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.4 },
    badge: {
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 9px",
        borderRadius: 999,
        background: "var(--glass-bg)",
        color: "var(--text-muted)",
        border: "1px solid var(--border)",
    },
    badgeWrap: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 },
    muted: { color: "var(--text-muted)", fontSize: 13, margin: 0 },
    emptyPrompt: {
        background: "var(--card-solid)",
        border: "1px dashed var(--border-light)",
        borderRadius: 14,
        padding: 32,
        textAlign: "center",
        color: "var(--text-muted)",
        fontSize: 14,
    },
    emptyBox: {
        background: "var(--glass-bg)",
        border: "1px dashed var(--border-light)",
        borderRadius: 12,
        padding: 18,
        textAlign: "center",
        color: "var(--text-muted)",
        fontSize: 13.5,
    },
    overlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 1000,
    },
    modal: {
        width: "100%",
        maxWidth: 560,
        maxHeight: "90vh",
        overflowY: "auto",
        background: "var(--card-solid)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: 20,
    },
    modalWide: {
        width: "100%",
        maxWidth: 760,
        maxHeight: "90vh",
        overflowY: "auto",
        background: "var(--card-solid)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: 20,
    },
    modalHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    modalTitle: { fontSize: 18, fontWeight: 800, color: "var(--text)", margin: 0 },
    modalActions: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 },
    label: { display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-dim)", marginBottom: 6 },
    input: {
        width: "100%",
        boxSizing: "border-box",
        background: "var(--glass-bg)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "9px 12px",
        color: "var(--text)",
        fontSize: 14,
        outline: "none",
    },
    textarea: {
        width: "100%",
        boxSizing: "border-box",
        minHeight: 70,
        resize: "vertical",
        background: "var(--glass-bg)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: "9px 12px",
        color: "var(--text)",
        fontSize: 14,
        outline: "none",
        fontFamily: "inherit",
    },
    field: { marginBottom: 14 },
    fieldMt: { marginTop: 12 },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
    grid2Mt: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 10 },
    hint: { fontSize: 12, color: "var(--text-muted)", marginTop: 4 },
    imgPreviewRow: { display: "flex", alignItems: "center", gap: 8, marginTop: 8 },
    confirmMsg: { color: "var(--text-dim)", fontSize: 14, lineHeight: 1.7, margin: 0 },
    hr: { border: "none", borderTop: "1px solid var(--border)", margin: "16px 0" },
};

/* ==========================================================================
   Reusable bits
   ========================================================================== */
function Modal({ title, onClose, children, wide }) {
    const stop = (e) => e.stopPropagation();
    return (
        <div style={S.overlay} onMouseDown={onClose}>
            <div style={wide ? S.modalWide : S.modal} onMouseDown={stop}>
                <div style={S.modalHeader}>
                    <h3 style={S.modalTitle}>{title}</h3>
                    <button type="button" style={S.iconBtn} onClick={onClose} aria-label="close">
                        <X size={16} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

// Thumbnail that gracefully hides broken/unrecognized images and shows a
// fallback icon instead, so the admin never sees broken-image placeholders.
function Thumb({ src, children }) {
    const [err, setErr] = useState(false);
    const url = imgUrl(src);
    if (url && !err) {
        return <img src={url} alt="" style={S.thumb} onError={() => setErr(true)} />;
    }
    return <span style={S.thumb}>{children}</span>;
}

function ImageField({ t, current, onChange }) {
    return (
        <div style={S.field}>
            <label style={S.label}>{t.image}</label>
            <input
                type="file"
                accept="image/*"
                style={S.input}
                onChange={(e) => onChange(e.target.files[0] || null)}
            />
            <div style={S.hint}>{t.imageOptional}</div>
            {current ? (
                <div style={S.imgPreviewRow}>
                    <img src={imgUrl(current)} alt="" style={S.thumbSmall} />
                    <span style={S.muted}>{t.currentImage}</span>
                </div>
            ) : null}
        </div>
    );
}

/* ==========================================================================
   Service item editor (the priced rows inside a category)
   ========================================================================== */
// Predefined duration options (canonical English values). Displayed bilingually
// via formatDuration so admins pick from a list instead of free-typing.
const DURATION_OPTIONS = [
    "15 mins",
    "30 mins",
    "45 mins",
    "1 hr",
    "1 hr 30 mins",
    "2 hrs",
    "3 hrs",
    "4 hrs",
    "6 hrs",
    "8 hrs",
];

function blankItem() {
    return { title: "", titleAr: "", time: "", OurPrice: "", MRP: "", minPrice: "", maxPrice: "", descEn: "", descAr: "", techCount: "1" };
}

function itemFromDb(s) {
    return {
        _id: s._id,
        title: s.title || "",
        titleAr: s.titleAr || "",
        time: s.time || "",
        techCount: s.requiredTechnicians != null ? String(s.requiredTechnicians) : "1",
        OurPrice: s.OurPrice != null ? String(s.OurPrice) : "",
        MRP: s.MRP != null ? String(s.MRP) : "",
        minPrice: s.minPrice != null ? String(s.minPrice) : "",
        maxPrice: s.maxPrice != null ? String(s.maxPrice) : "",
        descEn: Array.isArray(s.description) ? s.description.join("\n") : (s.description || ""),
        descAr: Array.isArray(s.descriptionAr) ? s.descriptionAr.join("\n") : (s.descriptionAr || ""),
    };
}

function itemToDb(it) {
    const out = {
        title: it.title,
        titleAr: it.titleAr,
        time: it.time,
        requiredTechnicians: Number(it.techCount) || 1,
        OurPrice: it.OurPrice,
        MRP: it.MRP,
        minPrice: it.minPrice === "" || it.minPrice == null ? null : Number(it.minPrice),
        maxPrice: it.maxPrice === "" || it.maxPrice == null ? null : Number(it.maxPrice),
        description: splitLines(it.descEn),
        descriptionAr: splitLines(it.descAr),
    };
    if (it._id) out._id = it._id;
    return out;
}

function ServiceItemsEditor({ t, items, setItems }) {
    const { locale } = useContext(PortalContext);
    const update = (idx, key, val) =>
        setItems(items.map((it, i) => (i === idx ? { ...it, [key]: val } : it)));
    const remove = (idx) => setItems(items.filter((_, i) => i !== idx));
    const add = () => setItems([...items, blankItem()]);

    return (
        <div>
            <div style={S.rowBetween}>
                <span style={S.sectionTitle}>{t.servicesInCategory}</span>
                <button type="button" style={S.btnGhost} onClick={add}>
                    <Plus size={15} /> {t.addServiceItem}
                </button>
            </div>
            {items.length === 0 ? (
                <p style={S.muted}>{t.noServiceItems}</p>
            ) : (
                <div style={S.colGap}>
                    {items.map((it, idx) => (
                        <div key={idx} style={S.itemCard}>
                            <div style={S.rowBetween}>
                                <span style={S.strongText}>
                                    {it.titleAr || it.title || "#" + (idx + 1)}
                                </span>
                                <button type="button" style={S.dangerBtn} onClick={() => remove(idx)} aria-label="remove">
                                    <Trash2 size={15} />
                                </button>
                            </div>
                            <div style={S.grid2}>
                                <div>
                                    <label style={S.label}>{t.title} {t.arabicLabel}</label>
                                    <input style={S.input} value={it.titleAr} onChange={(e) => update(idx, "titleAr", e.target.value)} />
                                </div>
                                <div>
                                    <label style={S.label}>{t.title} {t.englishLabel}</label>
                                    <input style={S.input} value={it.title} onChange={(e) => update(idx, "title", e.target.value)} />
                                </div>
                            </div>
                            <div style={S.grid2}>
                                <div>
                                    <label style={S.label}>{t.ourPrice}</label>
                                    <input style={S.input} inputMode="numeric" value={it.OurPrice} onChange={(e) => update(idx, "OurPrice", e.target.value)} />
                                </div>
                                <div>
                                    <label style={S.label}>{t.mrp}</label>
                                    <input style={S.input} inputMode="numeric" value={it.MRP} onChange={(e) => update(idx, "MRP", e.target.value)} />
                                </div>
                            </div>
                            <div style={S.grid2}>
                                <div>
                                    <label style={S.label}>{t.minPrice}</label>
                                    <input style={S.input} inputMode="numeric" value={it.minPrice} onChange={(e) => update(idx, "minPrice", e.target.value)} />
                                </div>
                                <div>
                                    <label style={S.label}>{t.maxPrice}</label>
                                    <input style={S.input} inputMode="numeric" value={it.maxPrice} onChange={(e) => update(idx, "maxPrice", e.target.value)} />
                                </div>
                            </div>
                            <div style={S.grid2}>
                                <div>
                                    <label style={S.label}>{t.time}</label>
                                    <select style={S.input} value={it.time} onChange={(e) => update(idx, "time", e.target.value)}>
                                        <option value="">{t.selectDuration}</option>
                                        {DURATION_OPTIONS.map((d) => (
                                            <option key={d} value={d}>{formatDuration(d, locale)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={S.label}>{t.techCount}</label>
                                    <select style={S.input} value={it.techCount} onChange={(e) => update(idx, "techCount", e.target.value)}>
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <option key={n} value={String(n)}>{n + " " + t.technicianWord}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div style={S.grid2}>
                                <div>
                                    <label style={S.label}>{t.descriptionPoints} {t.arabicLabel}</label>
                                    <textarea style={S.textarea} value={it.descAr} onChange={(e) => update(idx, "descAr", e.target.value)} />
                                    <div style={S.hint}>{t.onePointPerLine}</div>
                                </div>
                                <div>
                                    <label style={S.label}>{t.descriptionPoints} {t.englishLabel}</label>
                                    <textarea style={S.textarea} value={it.descEn} onChange={(e) => update(idx, "descEn", e.target.value)} />
                                    <div style={S.hint}>{t.onePointPerLine}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

/* ==========================================================================
   Main page
   ========================================================================== */
const AdminServicesPage = () => {
    const { locale } = useContext(PortalContext);
    const isRtl = locale === "ar";
    const t = translations[locale].adm;

    const [services, setServices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeService, setActiveService] = useState(null);
    const [detail, setDetail] = useState(null);
    const [expanded, setExpanded] = useState(() => new Set());
    const [saving, setSaving] = useState(false);
    const [modal, setModal] = useState(null);
    const [confirm, setConfirm] = useState(null);

    useEffect(() => {
        fetchServices();
    }, []);

    useEffect(() => {
        if (activeService) fetchDetail(activeService._id);
        else setDetail(null);
    }, [activeService]);

    const fetchServices = async () => {
        try {
            setIsLoading(true);
            const data = await getServices();
            const sorted = [...data].sort((a, b) => a.order - b.order);
            setServices(sorted);
        } catch (err) {
            console.error("Error fetching services:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDetail = async (serviceId) => {
        try {
            const data = await getServiceDetailsById(serviceId);
            setDetail(data || null);
        } catch (err) {
            console.error("Error fetching service details:", err);
            setDetail(null);
        }
    };

    const refreshDetail = () => {
        if (activeService) fetchDetail(activeService._id);
    };

    const toggle = (key) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    /* ---- submit handlers ------------------------------------------------- */
    const runSave = async (fn) => {
        try {
            setSaving(true);
            await fn();
            setModal(null);
        } catch (err) {
            console.error(err);
            alert((err && (err.message || err.error)) || t.errorGeneric);
        } finally {
            setSaving(false);
        }
    };

    const submitService = (form) =>
        runSave(async () => {
            const fd = new FormData();
            fd.append("serviceName", form.serviceName);
            fd.append("serviceNameAr", form.serviceNameAr || "");
            if (form.file) fd.append("serviceImage", form.file);
            if (modal.mode === "add") await createService(fd);
            else await updateService(modal.service._id, fd);
            await fetchServices();
            refreshDetail();
        });

    const submitSubcategory = (form) =>
        runSave(async () => {
            const id = activeService._id;
            const fd = new FormData();
            fd.append("nameAr", form.nameAr || "");
            if (form.file) fd.append("image", form.file);
            if (modal.mode === "add") {
                fd.append("name", form.name);
                await createSubcategory(id, fd);
            } else {
                fd.append("newName", form.name);
                await updateSubcategory(id, modal.originalName, fd);
            }
            refreshDetail();
        });

    const submitType = (form) =>
        runSave(async () => {
            const id = activeService._id;
            const fd = new FormData();
            fd.append("nameAr", form.nameAr || "");
            if (form.file) fd.append("image", form.file);
            if (modal.mode === "add") {
                fd.append("name", form.name);
                await createServiceType(id, modal.subcategoryName, fd);
            } else {
                fd.append("newName", form.name);
                await updateServiceType(id, modal.subcategoryName, modal.originalName, fd);
            }
            refreshDetail();
        });

    const submitCategory = (form, items) =>
        runSave(async () => {
            const id = activeService._id;
            const fd = new FormData();
            fd.append("name", form.name);
            fd.append("nameAr", form.nameAr || "");
            fd.append("services", JSON.stringify(items.map(itemToDb)));
            if (form.file) fd.append("image", form.file);
            const subcategoryName = modal.subcategoryName;
            const typeName = modal.typeName;
            if (typeName) {
                if (modal.mode === "add") await createCategory(id, subcategoryName, typeName, fd);
                else await updateCategory(id, subcategoryName, typeName, modal.category._id, fd);
            } else {
                if (modal.mode === "add") await createCategoryDirect(id, subcategoryName, fd);
                else await updateCategoryDirect(id, subcategoryName, modal.category._id, fd);
            }
            refreshDetail();
        });

    /* ---- delete handlers ------------------------------------------------- */
    const askDelete = (message, fn) => setConfirm({ message, fn });
    const doDelete = async () => {
        const fn = confirm.fn;
        setConfirm(null);
        try {
            await fn();
            await fetchServices();
            refreshDetail();
        } catch (err) {
            console.error(err);
            alert((err && (err.message || err.error)) || t.errorGeneric);
        }
    };

    /* ---- master list ----------------------------------------------------- */
    const renderServiceList = () => (
        <div style={S.listPane}>
            <div style={S.headerRow}>
                <span style={S.sectionTitle}>{t.totalServices}</span>
                <button style={S.btnPrimary} onClick={() => setModal({ kind: "service", mode: "add" })}>
                    <Plus size={16} /> {t.addNewService}
                </button>
            </div>
            {isLoading ? (
                <p style={S.muted}>{t.loading}</p>
            ) : services.length === 0 ? (
                <p style={S.muted}>{t.noServicesYet}</p>
            ) : (
                services.map((s) => {
                    const active = activeService && activeService._id === s._id;
                    return (
                        <div key={s._id} style={S.listRow}>
                            <button style={active ? S.serviceItemRowActive : S.serviceItemRow} onClick={() => setActiveService(s)}>
                                <Thumb src={s.serviceImage}><Wrench size={18} /></Thumb>
                                <span style={S.strongText}>
                                    {localizeName(s.serviceName, locale, s.serviceNameAr)}
                                </span>
                            </button>
                            <button style={S.iconBtn} onClick={() => setModal({ kind: "service", mode: "edit", service: s })} aria-label="edit">
                                <Edit size={15} />
                            </button>
                            <button
                                style={S.dangerBtn}
                                onClick={() =>
                                    askDelete(t.confirmDeleteGeneric, async () => {
                                        await deleteService(s._id);
                                        if (activeService && activeService._id === s._id) setActiveService(null);
                                    })
                                }
                                aria-label="delete"
                            >
                                <Trash2 size={15} />
                            </button>
                        </div>
                    );
                })
            )}
        </div>
    );

    /* ---- one category card ---------------------------------------------- */
    const renderCategory = (category, subcategoryName, typeName) => {
        const count = (category.services || []).length;
        return (
            <div key={category._id} style={S.itemCard}>
                <div style={S.rowBetween}>
                    <div style={S.rowCenter}>
                        <Thumb src={category.categoryImage}><Tag size={16} /></Thumb>
                        <div>
                            <div style={S.strongText}>
                                {localizeName(category.name, locale, category.nameAr)}
                            </div>
                            <div style={S.muted}>{count} {t.itemsCount}</div>
                        </div>
                    </div>
                    <div style={S.actionGroup}>
                        <button
                            style={S.btnGhost}
                            onClick={() => setModal({ kind: "category", mode: "edit", subcategoryName, typeName: typeName || null, category })}
                        >
                            <Edit size={14} /> {t.manageContent}
                        </button>
                        <button
                            style={S.dangerBtn}
                            onClick={() =>
                                askDelete(t.confirmDeleteGeneric, async () => {
                                    if (typeName) await deleteCategory(activeService._id, subcategoryName, typeName, category._id);
                                    else await deleteCategoryDirect(activeService._id, subcategoryName, category._id);
                                })
                            }
                            aria-label="delete"
                        >
                            <Trash2 size={15} />
                        </button>
                    </div>
                </div>
                {count > 0 ? (
                    <div style={S.badgeWrap}>
                        {category.services.map((it, i) => (
                            <span key={it._id || i} style={S.badge}>
                                {(isRtl && it.titleAr ? it.titleAr : it.title) || ""}
                                {it.OurPrice ? " • ₪" + it.OurPrice : ""}
                                {it.time ? " • " + formatDuration(it.time, locale) : ""}
                                {it.requiredTechnicians > 1 ? " • " + it.requiredTechnicians + " " + (locale === "ar" ? "فني" : "tech") : ""}
                            </span>
                        ))}
                    </div>
                ) : null}
            </div>
        );
    };

    /* ---- one subcategory ------------------------------------------------- */
    const renderSubcategory = (name, sub) => {
        const key = "sub:" + name;
        const open = expanded.has(key);
        const types = sub.serviceTypes || {};
        const typeEntries = Object.entries(types);
        const directCats = sub.categories || [];
        return (
            <div key={name} style={S.card}>
                <div style={S.headerRow}>
                    <button style={S.toggleBtn} onClick={() => toggle(key)}>
                        {open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        <Thumb src={sub.image}><Layers size={16} /></Thumb>
                        <span style={S.strongText}>
                            {localizeName(name, locale, sub.nameAr)}
                        </span>
                    </button>
                    <div style={S.actionGroup}>
                        <button
                            style={S.iconBtn}
                            onClick={() => setModal({ kind: "subcategory", mode: "edit", originalName: name, name, nameAr: sub.nameAr, current: sub.image })}
                            aria-label="edit"
                        >
                            <Edit size={15} />
                        </button>
                        <button
                            style={S.dangerBtn}
                            onClick={() =>
                                askDelete(t.confirmDeleteGeneric, async () => {
                                    await deleteSubcategory(activeService._id, name);
                                })
                            }
                            aria-label="delete"
                        >
                            <Trash2 size={15} />
                        </button>
                    </div>
                </div>

                {open ? (
                    <div style={S.colGapLg}>
                        {typeEntries.map(([typeName, type]) => (
                            <div key={typeName} style={S.typeBlock}>
                                <div style={S.rowBetween}>
                                    <div style={S.rowCenter}>
                                        <span style={S.badge}>{t.typedCategoryBadge}</span>
                                        <span style={S.strongText}>
                                            {localizeName(typeName, locale, type.nameAr)}
                                        </span>
                                    </div>
                                    <div style={S.actionGroup}>
                                        <button
                                            style={S.btnGhost}
                                            onClick={() => setModal({ kind: "category", mode: "add", subcategoryName: name, typeName, category: null })}
                                        >
                                            <Plus size={14} /> {t.addCategory}
                                        </button>
                                        <button
                                            style={S.iconBtn}
                                            onClick={() => setModal({ kind: "type", mode: "edit", subcategoryName: name, originalName: typeName, name: typeName, nameAr: type.nameAr, current: type.image })}
                                            aria-label="edit"
                                        >
                                            <Edit size={15} />
                                        </button>
                                        <button
                                            style={S.dangerBtn}
                                            onClick={() =>
                                                askDelete(t.confirmDeleteGeneric, async () => {
                                                    await deleteServiceType(activeService._id, name, typeName);
                                                })
                                            }
                                            aria-label="delete"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                                <div style={S.colGap}>
                                    {(type.categories || []).length === 0 ? (
                                        <p style={S.muted}>{t.noCategories}</p>
                                    ) : (
                                        type.categories.map((cat) => renderCategory(cat, name, typeName))
                                    )}
                                </div>
                            </div>
                        ))}

                        <div>
                            <div style={S.rowBetween}>
                                <span style={S.sectionTitle}>{t.categories}</span>
                                <button
                                    style={S.btnGhost}
                                    onClick={() => setModal({ kind: "category", mode: "add", subcategoryName: name, typeName: null, category: null })}
                                >
                                    <Plus size={14} /> {t.addDirectCategory}
                                </button>
                            </div>
                            <div style={S.colGap}>
                                {directCats.length === 0 ? (
                                    <p style={S.muted}>{t.noCategories}</p>
                                ) : (
                                    directCats.map((cat) => renderCategory(cat, name, null))
                                )}
                            </div>
                        </div>

                        <div>
                            <button
                                style={S.btnGhost}
                                onClick={() => setModal({ kind: "type", mode: "add", subcategoryName: name, category: null })}
                            >
                                <Plus size={14} /> {t.addType}
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>
        );
    };

    /* ---- detail pane ----------------------------------------------------- */
    const renderDetail = () => {
        if (!activeService) {
            return <div style={S.emptyPrompt}>{t.selectServicePrompt}</div>;
        }
        const subs = (detail && detail.subcategories) || {};
        const subEntries = Object.entries(subs);
        return (
            <>
                <div style={S.headerRow}>
                    <h2 style={S.h2}>
                        {localizeName(activeService.serviceName, locale, activeService.serviceNameAr)}
                    </h2>
                    <button style={S.btnPrimary} onClick={() => setModal({ kind: "subcategory", mode: "add" })}>
                        <Plus size={16} /> {t.addSubcategory}
                    </button>
                </div>
                {subEntries.length === 0 ? (
                    <div style={S.emptyBox}>{t.noSubcategories}</div>
                ) : (
                    subEntries.map(([name, sub]) => renderSubcategory(name, sub))
                )}
            </>
        );
    };

    return (
        <div style={S.page} dir={isRtl ? "rtl" : "ltr"}>
            <div style={S.headerRow}>
                <h1 style={S.h1}>{t.servicesManagement}</h1>
            </div>
            <div style={S.guide}>
                <Info size={18} style={S.infoIcon} />
                <div>
                    <strong style={S.guideStrong}>{t.hierarchyTitle}</strong>
                    <div>{t.hierarchyBody}</div>
                </div>
            </div>
            <div style={S.layout}>
                {renderServiceList()}
                <div style={S.detailPane}>{renderDetail()}</div>
            </div>

            {modal && modal.kind === "service" ? (
                <ServiceModal t={t} saving={saving} modal={modal} onClose={() => setModal(null)} onSubmit={submitService} />
            ) : null}
            {modal && modal.kind === "subcategory" ? (
                <NameModal
                    t={t}
                    saving={saving}
                    title={modal.mode === "add" ? t.addNewSubcategory : t.editSubcategory}
                    initial={modal}
                    onClose={() => setModal(null)}
                    onSubmit={submitSubcategory}
                />
            ) : null}
            {modal && modal.kind === "type" ? (
                <NameModal
                    t={t}
                    saving={saving}
                    title={modal.mode === "add" ? t.addNewServiceType : t.editServiceType}
                    initial={modal}
                    onClose={() => setModal(null)}
                    onSubmit={submitType}
                />
            ) : null}
            {modal && modal.kind === "category" ? (
                <CategoryModal t={t} saving={saving} modal={modal} onClose={() => setModal(null)} onSubmit={submitCategory} />
            ) : null}

            {confirm ? (
                <Modal title={t.confirmDeletion} onClose={() => setConfirm(null)}>
                    <p style={S.confirmMsg}>{confirm.message}</p>
                    <div style={S.modalActions}>
                        <button style={S.btnGhost} onClick={() => setConfirm(null)}>{t.cancel}</button>
                        <button style={S.dangerSolidBtn} onClick={doDelete}>{t.delete}</button>
                    </div>
                </Modal>
            ) : null}
        </div>
    );
};

/* ==========================================================================
   Modals
   ========================================================================== */
function ServiceModal({ t, saving, modal, onClose, onSubmit }) {
    const svc = modal.service || {};
    const [serviceName, setServiceName] = useState(svc.serviceName || "");
    const [serviceNameAr, setServiceNameAr] = useState(svc.serviceNameAr || "");
    const [file, setFile] = useState(null);
    const submit = (e) => {
        e.preventDefault();
        if (!serviceName.trim()) return;
        onSubmit({ serviceName, serviceNameAr, file });
    };
    return (
        <Modal title={modal.mode === "add" ? t.addNewService : t.editService} onClose={onClose}>
            <form onSubmit={submit}>
                <div style={S.field}>
                    <label style={S.label}>{t.serviceName} {t.arabicLabel}</label>
                    <input style={S.input} value={serviceNameAr} onChange={(e) => setServiceNameAr(e.target.value)} />
                </div>
                <div style={S.field}>
                    <label style={S.label}>{t.serviceName} {t.englishLabel}</label>
                    <input style={S.input} value={serviceName} onChange={(e) => setServiceName(e.target.value)} required />
                </div>
                <ImageField t={t} current={svc.serviceImage} onChange={setFile} />
                <div style={S.modalActions}>
                    <button type="button" style={S.btnGhost} onClick={onClose}>{t.cancel}</button>
                    <button type="submit" style={S.btnPrimary} disabled={saving}>
                        {saving ? t.loading : modal.mode === "add" ? t.create : t.update}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

function NameModal({ t, saving, title, initial, onClose, onSubmit }) {
    const [name, setName] = useState(initial.name || "");
    const [nameAr, setNameAr] = useState(initial.nameAr || "");
    const [file, setFile] = useState(null);
    const submit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({ name, nameAr, file });
    };
    return (
        <Modal title={title} onClose={onClose}>
            <form onSubmit={submit}>
                <div style={S.field}>
                    <label style={S.label}>{t.name} {t.arabicLabel}</label>
                    <input style={S.input} value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
                </div>
                <div style={S.field}>
                    <label style={S.label}>{t.name} {t.englishLabel}</label>
                    <input style={S.input} value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <ImageField t={t} current={initial.current} onChange={setFile} />
                <div style={S.modalActions}>
                    <button type="button" style={S.btnGhost} onClick={onClose}>{t.cancel}</button>
                    <button type="submit" style={S.btnPrimary} disabled={saving}>
                        {saving ? t.loading : initial.mode === "add" ? t.create : t.update}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

function CategoryModal({ t, saving, modal, onClose, onSubmit }) {
    const cat = modal.category || {};
    const [name, setName] = useState(cat.name || "");
    const [nameAr, setNameAr] = useState(cat.nameAr || "");
    const [file, setFile] = useState(null);
    const [items, setItems] = useState(() => (cat.services || []).map(itemFromDb));
    const submit = (e) => {
        e.preventDefault();
        if (!name.trim() && !nameAr.trim()) return;
        onSubmit({ name, nameAr, file }, items);
    };
    return (
        <Modal title={modal.mode === "add" ? t.addNewCategory : t.editCategory} onClose={onClose} wide>
            <form onSubmit={submit}>
                <div style={S.grid2}>
                    <div>
                        <label style={S.label}>{t.name} {t.arabicLabel}</label>
                        <input style={S.input} value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
                    </div>
                    <div>
                        <label style={S.label}>{t.name} {t.englishLabel}</label>
                        <input style={S.input} value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                </div>
                <div style={S.fieldMt}>
                    <ImageField t={t} current={cat.categoryImage} onChange={setFile} />
                </div>
                <hr style={S.hr} />
                <ServiceItemsEditor t={t} items={items} setItems={setItems} />
                <div style={S.modalActions}>
                    <button type="button" style={S.btnGhost} onClick={onClose}>{t.cancel}</button>
                    <button type="submit" style={S.btnPrimary} disabled={saving}>
                        {saving ? t.loading : modal.mode === "add" ? t.create : t.save}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

export default AdminServicesPage;
