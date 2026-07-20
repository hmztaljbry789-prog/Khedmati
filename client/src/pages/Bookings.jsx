import { useState, useEffect, useContext, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { getUserBookings, getProviderBookings, providerStartBooking, providerCompleteBooking, confirmServiceCompletion, approveBooking, reassignBooking, cancelBooking, createReview } from "../utils/api";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useFeedback } from "../components/FeedbackContext";
import { useNavigate } from "react-router-dom";
import PortalContext from "../context/PortalContext";
import { translations } from "../utils/translations";
import { BookOpen, ImageOff, ArrowRight, CheckCircle, Clock, Wrench, ChevronDown, ChevronUp, MessageSquare, Phone, User, MapPin, Check, RefreshCw, Loader, XCircle, Play, Star } from "lucide-react";
import ChatModal from "../components/ChatModal";
import RefreshButton from "../components/RefreshButton";
import { useAutoRefresh } from "../hooks/useAutoRefresh";
import { localizeCity, localizeAddress } from "../utils/localize";

function BookingCard({ booking, isProvider, onRefresh, onUpdate, locale }) {
    const t = translations[locale];
    const isRtl = locale === "ar";
    const { toast, confirm } = useFeedback();

    const STATUS = {
        PENDING_APPROVAL:  { label: isRtl ? "بانتظار الموافقة" : "Pending Approval", icon: <Clock size={12} />,        color: "var(--amber)",        bg: "var(--amber-dim)", border: "rgba(245,158,11,.3)" },
        CONFIRMED:         { label: isRtl ? "تم تعيين الفني" : "Technician Confirmed", icon: <Wrench size={12} />,       color: "var(--blue-bright)",  bg: "var(--blue-dim)",  border: "var(--border-blue)" },
        IN_PROGRESS:       { label: isRtl ? "جاري التنفيذ" : "In Progress", icon: <Loader size={12} />,         color: "#a855f7",             bg: "rgba(168,85,247,.12)", border: "rgba(168,85,247,.35)" },
        SERVICE_COMPLETED: { label: isRtl ? "اكتملت الخدمة" : "Completed", icon: <CheckCircle size={12} />,  color: "var(--green)",        bg: "var(--green-dim)", border: "rgba(16,185,129,.3)" },
        CANCELLED:         { label: isRtl ? "ملغي" : "Cancelled", icon: <XCircle size={12} />,                  color: "var(--red)",          bg: "var(--red-dim)",   border: "rgba(239,68,68,.3)" },
    };

    const [expanded, setExpanded] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [loadingAction, setLoadingAction] = useState(false);
    const [ratingValue, setRatingValue] = useState(0);
    const [reviewComment, setReviewComment] = useState("");
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const st = STATUS[booking.status] || STATUS.PENDING_APPROVAL;
    const readyToStart = booking.assignments?.length
        ? booking.assignments.every(
              (assignment) => assignment.providerResponse === "ACCEPTED"
          )
        : booking.providerResponse === "ACCEPTED";
    const applyResponse = (response) => {
        const updated = response?.booking || response;
        if (updated?._id && onUpdate) onUpdate(updated);
        return updated;
    };
    const refreshSilently = () => onRefresh && onRefresh(true);
    const startBtnStyle = {
        display: "flex", alignItems: "center", gap: 4,
        padding: "6px 12px", borderRadius: 10, fontSize: 11, fontWeight: 700,
        background: "linear-gradient(135deg, var(--blue), var(--cyan))",
        color: "#fff", border: "none", cursor: "pointer", fontFamily: "var(--font-body)",
        flexDirection: "row",
    };

    const handleComplete = async (e) => {
        e.stopPropagation();
        setLoadingAction(true);
        try {
            applyResponse(await providerCompleteBooking(booking.bookingId));
            refreshSilently();
        } catch (error) {
            console.error("Error completing booking:", error);
            toast(isRtl ? "حدث خطأ أثناء تحديث حالة الطلب." : "An error occurred while updating booking status.", "error");
        } finally {
            setLoadingAction(false);
        }
    };

    const handleConfirmCompletion = async (e) => {
        e.stopPropagation();
        setLoadingAction(true);
        try {
            applyResponse(await confirmServiceCompletion(booking.bookingId));
            refreshSilently();
        } catch (error) {
            console.error("Error confirming completion:", error);
            toast(isRtl ? "حدث خطأ أثناء تأكيد الاكتمال." : "An error occurred while confirming completion.", "error");
        } finally {
            setLoadingAction(false);
        }
    };

    const handleStartWork = async (e) => {
        e.stopPropagation();
        setLoadingAction(true);
        try {
            applyResponse(await providerStartBooking(booking._id));
            refreshSilently();
        } catch (error) {
            console.error("Error starting work:", error);
            toast(isRtl ? "حدث خطأ أثناء بدء العمل." : "An error occurred while starting the service.", "error");
        } finally {
            setLoadingAction(false);
        }
    };

    const handleApprove = async (e) => {
        e.stopPropagation();
        setLoadingAction(true);
        try {
            applyResponse(await approveBooking(booking._id));
            refreshSilently();
        } catch (error) {
            console.error("Error approving booking:", error);
            toast(isRtl ? "تعذر تأكيد الفني." : "Could not confirm technician.", "error");
        } finally {
            setLoadingAction(false);
        }
    };

    const handleReassign = async (e) => {
        e.stopPropagation();
        setLoadingAction(true);
        try {
            const res = await reassignBooking(booking._id);
            applyResponse(res);
            if (res?.message === "NO_MORE_PROVIDERS") {
                toast(isRtl ? "لا يوجد فنيون آخرون متاحون حالياً." : "No other technicians are available right now.", "info");
            }
            refreshSilently();
        } catch (error) {
            console.error("Error reassigning technician:", error);
            toast(isRtl ? "تعذر طلب فني آخر." : "Could not request another technician.", "error");
        } finally {
            setLoadingAction(false);
        }
    };

    const handleCancel = async (e) => {
        e.stopPropagation();
        const msg = isRtl
            ? "هل أنت متأكد من إلغاء هذا الحجز؟"
            : "Are you sure you want to cancel this booking?";
        const confirmed = await confirm(msg, {
            danger: true,
            confirmLabel: isRtl ? "نعم، إلغاء الحجز" : "Yes, cancel it",
            cancelLabel: isRtl ? "تراجع" : "Keep it",
        });
        if (!confirmed) return;
        setLoadingAction(true);
        try {
            applyResponse(await cancelBooking(booking._id));
            refreshSilently();
        } catch (error) {
            console.error("Error cancelling booking:", error);
            toast(isRtl ? "تعذر إلغاء الحجز." : "Could not cancel the booking.", "error");
        } finally {
            setLoadingAction(false);
        }
    };

    const handleReview = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (ratingValue < 1) {
            toast(isRtl ? "اختر عدد النجوم أولاً." : "Choose a star rating first.", "warning");
            return;
        }
        setReviewSubmitting(true);
        try {
            const result = await createReview({
                bookingId: booking.bookingId,
                rating: ratingValue,
                comment: reviewComment.trim(),
            });
            if (onUpdate) {
                onUpdate({
                    ...booking,
                    hasReview: true,
                    reviewRating: ratingValue,
                    provider: booking.provider
                        ? {
                              ...booking.provider,
                              rating: result.providerRating,
                              reviewCount: result.providerReviewCount,
                          }
                        : booking.provider,
                });
            }
            toast(isRtl ? "تم إرسال تقييمك، شكرًا لك." : "Your review was submitted. Thank you.", "success");
            setReviewComment("");
        } catch (error) {
            console.error("Error submitting review:", error);
            const alreadyReviewed = error?.code === "ALREADY_REVIEWED";
            if (alreadyReviewed && onUpdate) {
                onUpdate({ ...booking, hasReview: true });
            }
            toast(
                alreadyReviewed
                    ? isRtl ? "سبق أن قيّمت هذا الحجز." : "This booking was already reviewed."
                    : isRtl ? "تعذر إرسال التقييم." : "Could not submit the review.",
                alreadyReviewed ? "info" : "error"
            );
        } finally {
            setReviewSubmitting(false);
        }
    };

    return (
        <div style={{
            background: "var(--glass-bg)", border: "1px solid var(--border)",
            backdropFilter: "blur(12px)", borderRadius: 20, overflow: "hidden",
            transition: "border-color 0.2s",
            direction: isRtl ? "rtl" : "ltr"
        }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border-blue)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
        >
            {/* Header row — always visible */}
            <div
                onClick={() => setExpanded(v => !v)}
                style={{
                    width: "100%", display: "flex", alignItems: "center",
                    justifyContent: "space-between", gap: 12,
                    padding: "16px 18px", cursor: "pointer",
                    textAlign: isRtl ? "right" : "left",
                    flexDirection: "row"
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0, flexWrap: "wrap", flexDirection: "row" }}>
                    {/* Status dot */}
                    <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "4px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                        background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                        flexShrink: 0,
                        flexDirection: "row"
                    }}>
                        {st.icon} {st.label}
                    </span>

                    {/* ID + Date */}
                    <div style={{ minWidth: 0, textAlign: isRtl ? "right" : "left" }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-display)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            <span dir="ltr">#{booking.bookingId}</span>
                        </p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
                            <span dir="ltr">{format(new Date(booking.createdAt), "d MMM yyyy, h:mm a", isRtl ? { locale: ar } : undefined)}</span>
                        </p>
                    </div>
                </div>

                {/* Left side actions (Total + Chat button + expand) */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0, flexDirection: "row" }} onClick={e => e.stopPropagation()}>
                    {/* Chat button */}
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowChat(true); }}
                        style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "6px 12px", borderRadius: 10, fontSize: 11, fontWeight: 700,
                            background: "var(--blue-dim)", color: "var(--blue-bright)",
                            border: "1px solid var(--border-blue)", cursor: "pointer",
                            transition: "background 0.2s",
                            flexDirection: "row"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "var(--blue-glow)"}
                        onMouseLeave={e => e.currentTarget.style.background = "var(--blue-dim)"}
                    >
                        <MessageSquare size={13} />
                        <span>{t.chat}</span>
                    </button>

                    {/* Start work action (provider, once the booking is confirmed) */}
                    {isProvider && booking.status === "CONFIRMED" && readyToStart && (
                        <button
                            onClick={handleStartWork}
                            disabled={loadingAction}
                            className="btn-glow"
                            style={startBtnStyle}
                        >
                            <Play size={13} />
                            <span>{isRtl ? "بدء العمل" : "Start work"}</span>
                        </button>
                    )}

                    {/* End service action (provider, while the work is in progress) */}
                    {isProvider && booking.status === "IN_PROGRESS" && !booking.completionRequested && (
                        <button
                            onClick={handleComplete}
                            disabled={loadingAction}
                            className="btn-glow"
                            style={{
                                display: "flex", alignItems: "center", gap: 4,
                                padding: "6px 12px", borderRadius: 10, fontSize: 11, fontWeight: 700,
                                background: "linear-gradient(135deg, var(--green), #059669)",
                                color: "#fff", border: "none", cursor: loadingAction ? "not-allowed" : "pointer",
                                flexDirection: "row"
                            }}
                        >
                            <CheckCircle size={13} />
                            <span>{isRtl ? "إنهاء الخدمة" : "End service"}</span>
                        </button>
                    )}

                    {/* Waiting note (provider, after requesting completion) */}
                    {isProvider && booking.status === "IN_PROGRESS" && booking.completionRequested && (
                        <span style={ { fontSize: 11, fontWeight: 700, color: "#f59e0b", display: "flex", alignItems: "center", gap: 4 } }>
                            <Loader size={12} />
                            <span>{isRtl ? "بانتظار تأكيد الزبون" : "Awaiting customer confirmation"}</span>
                        </span>
                    )}

                    {/* Confirm completion (customer double-check to prevent fake completions) */}
                    {!isProvider && booking.status === "IN_PROGRESS" && booking.completionRequested && (
                        <button
                            onClick={handleConfirmCompletion}
                            disabled={loadingAction}
                            className="btn-glow"
                            style={ { display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 10, fontSize: 11, fontWeight: 700, background: "linear-gradient(135deg, var(--green), #34d399)", color: "#fff", border: "none", cursor: loadingAction ? "not-allowed" : "pointer", fontFamily: "var(--font-body)", flexDirection: "row" } }
                        >
                            <CheckCircle size={13} />
                            <span>{isRtl ? "تأكيد اكتمال الخدمة" : "Confirm completion"}</span>
                        </button>
                    )}

                    {/* Cancel booking — available to customer or technician before completion */}
                    {["PENDING_APPROVAL", "CONFIRMED", "IN_PROGRESS"].includes(booking.status) && (
                        <button
                            onClick={handleCancel}
                            disabled={loadingAction}
                            style={ { display: "flex", alignItems: "center", gap: 4, padding: "6px 12px", borderRadius: 10, fontSize: 11, fontWeight: 700, background: "var(--red-dim)", color: "var(--red)", border: "1px solid rgba(239,68,68,.3)", cursor: loadingAction ? "not-allowed" : "pointer", flexDirection: "row" } }
                        >
                            <XCircle size={13} />
                            <span>{isRtl ? "إلغاء الحجز" : "Cancel"}</span>
                        </button>
                    )}

                    <p style={{
                        fontSize: 15, fontWeight: 800,
                        background: "linear-gradient(135deg, var(--blue-bright), var(--cyan))",
                        WebkitBackgroundClip: "text", backgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        fontFamily: "var(--font-display)",
                        marginLeft: isRtl ? 4 : 0,
                        marginRight: !isRtl ? 4 : 0,
                    }}>
                        ₪{(booking.items || []).reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0).toFixed(2)}
                    </p>
                    <span style={{ color: "var(--text-muted)", cursor: "pointer" }} onClick={() => setExpanded(v => !v)}>
                        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </span>
                </div>
            </div>

            {/* Expanded: items */}
            {expanded && (
                <div style={{ borderTop: "1px solid var(--border)" }}>
                    {booking.items.map((item, idx) => (
                        <div key={idx} style={{
                            display: "flex", alignItems: "center", gap: 12,
                            padding: "12px 18px",
                            borderBottom: idx < booking.items.length - 1 ? "1px solid var(--border)" : "none",
                            flexDirection: "row"
                        }}>
                            {/* Thumb */}
                            <div style={{
                                width: 46, height: 46, borderRadius: 10, flexShrink: 0,
                                display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                                background: "rgba(59,130,246,.1)", border: "1px solid var(--border)",
                            }}>
                                {item.image
                                    ? <img loading="lazy" src={`${import.meta.env.VITE_BACKEND_URL}/${item.image}`} alt={t[item.title] || item.title} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 6 }} />
                                    : <ImageOff size={14} style={{ color: "var(--text-muted)" }} />}
                            </div>

                            <div style={{ flex: 1, minWidth: 0, textAlign: isRtl ? "right" : "left" }}>
                                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(isRtl && item.titleAr) || t[item.title] || item.title}</p>
                                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>₪{item.price?.toFixed(2)} × {item.quantity}</p>
                            </div>

                            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", flexShrink: 0 }}>
                                ₪{((item.price || 0) * (item.quantity || 1)).toFixed(2)}
                            </p>
                        </div>
                    ))}

                    {/* Address details */}
                    {booking.customerDetails?.address && (
                        <div style={{
                            padding: "12px 18px",
                            borderTop: "1px solid var(--border)",
                            fontSize: 12,
                            color: "var(--text-dim)",
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                            textAlign: isRtl ? "right" : "left"
                        }}>
                            <span style={{ color: "var(--text-muted)", fontWeight: 600, fontSize: 10, display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-start", flexDirection: "row" }}>
                                <MapPin size={12} /> {t.serviceAddress}
                            </span>
                            <span>{localizeAddress(booking.customerDetails.address, isRtl)}</span>
                        </div>
                    )}

                    {/* Auto-assigned technician — awaiting customer approval */}
                    {!isProvider && booking.status === "PENDING_APPROVAL" && booking.provider && (
                        <div style={ { display: "flex", flexDirection: "column", gap: 10, padding: 14, borderRadius: 14, background: "var(--amber-dim)", border: "1px solid rgba(245,158,11,.3)" } }>
                            <span style={ { display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--amber)" } }>
                                <User size={12} /> {isRtl ? "تم اقتراح فني" : "Proposed technician"}
                            </span>
                            <span>{booking.provider.first_name} {booking.provider.last_name}{booking.provider.city ? ` — ${localizeCity(booking.provider.city, isRtl)}` : ""}</span>
                            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, color: "var(--amber)" }}>
                                <Star size={13} fill="currentColor" />
                                {Number(booking.provider.rating || 0).toFixed(1)}
                                <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>
                                    ({booking.provider.reviewCount || 0} {isRtl ? "تقييم" : "reviews"})
                                </span>
                            </span>
                            <div style={ { display: "flex", gap: 10, flexWrap: "wrap" } }>
                                <button
                                    onClick={handleApprove}
                                    disabled={loadingAction}
                                    className="btn-glow"
                                    style={ { display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 700, background: "linear-gradient(135deg, var(--blue), var(--cyan))", color: "#fff", border: "none", cursor: "pointer" } }
                                >
                                    <Check size={13} /> {isRtl ? "الموافقة وتأكيد الفني" : "Approve technician"}
                                </button>
                                <button
                                    onClick={handleReassign}
                                    disabled={loadingAction}
                                    style={ { display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 700, background: "transparent", color: "var(--text)", border: "1px solid var(--border)", cursor: "pointer" } }
                                >
                                    <RefreshCw size={13} /> {isRtl ? "طلب فني آخر" : "Request another"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Provider details for Customer */}
                    {!isProvider && booking.provider && booking.isProviderConfirmed && (
                        <div style={{
                            padding: "12px 18px",
                            borderTop: "1px solid var(--border)",
                            background: "rgba(59,130,246,0.02)",
                            fontSize: 12,
                            color: "var(--text-dim)",
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                            textAlign: isRtl ? "right" : "left"
                        }}>
                            <span style={{ color: "var(--blue-bright)", fontWeight: 700, fontSize: 10, display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-start", flexDirection: "row" }}>
                                <User size={12} /> {t.providerAssigned}
                            </span>
                            <span>{t.nameLabel}: {booking.provider.first_name} {booking.provider.last_name}</span>
                            <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--amber)", fontWeight: 700 }}>
                                <Star size={13} fill="currentColor" />
                                {Number(booking.provider.rating || 0).toFixed(1)}
                                <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>
                                    ({booking.provider.reviewCount || 0} {isRtl ? "تقييم" : "reviews"})
                                </span>
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: 5, flexDirection: "row" }}>
                                <Phone size={12} /> <span style={{ opacity: 0.85 }}>{t.phoneLabel}:</span> <span dir="ltr">{booking.provider.phone}</span>
                            </span>
                        </div>
                    )}

                    {/* A completed booking can be reviewed exactly once by its customer. */}
                    {!isProvider && booking.status === "SERVICE_COMPLETED" && booking.provider && (
                        <form
                            onSubmit={handleReview}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                padding: "14px 18px",
                                borderTop: "1px solid var(--border)",
                                background: "linear-gradient(135deg, rgba(245,158,11,.08), rgba(59,130,246,.05))",
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                                textAlign: isRtl ? "right" : "left",
                            }}
                        >
                            <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text)" }}>
                                {isRtl ? "تقييم الفني" : "Rate the technician"}
                            </span>
                            {booking.hasReview ? (
                                <span style={{ display: "flex", alignItems: "center", gap: 7, color: "var(--green)", fontSize: 12, fontWeight: 700 }}>
                                    <CheckCircle size={15} />
                                    {isRtl ? "شكرًا، تم تسجيل تقييمك" : "Thank you, your review was recorded"}
                                    {booking.reviewRating ? ` (${booking.reviewRating}/5)` : ""}
                                </span>
                            ) : (
                                <>
                                    <div style={{ display: "flex", gap: 5, flexDirection: "row" }}>
                                        {[1, 2, 3, 4, 5].map((value) => (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => setRatingValue(value)}
                                                aria-label={`${value} stars`}
                                                style={{
                                                    padding: 2,
                                                    border: "none",
                                                    background: "transparent",
                                                    color: value <= ratingValue ? "#f59e0b" : "var(--border)",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                <Star size={22} fill="currentColor" />
                                            </button>
                                        ))}
                                    </div>
                                    <textarea
                                        value={reviewComment}
                                        onChange={(e) => setReviewComment(e.target.value.slice(0, 1000))}
                                        placeholder={isRtl ? "اكتب ملاحظتك عن الخدمة (اختياري)" : "Share feedback about the service (optional)"}
                                        rows={3}
                                        style={{
                                            width: "100%",
                                            resize: "vertical",
                                            padding: "9px 11px",
                                            borderRadius: 10,
                                            border: "1px solid var(--border)",
                                            background: "var(--input-bg)",
                                            color: "var(--text)",
                                            fontFamily: "inherit",
                                            boxSizing: "border-box",
                                        }}
                                    />
                                    <button
                                        type="submit"
                                        disabled={reviewSubmitting || ratingValue < 1}
                                        style={{
                                            alignSelf: "flex-start",
                                            padding: "8px 16px",
                                            borderRadius: 10,
                                            border: "none",
                                            background: "linear-gradient(135deg, #f59e0b, #f97316)",
                                            color: "#fff",
                                            fontWeight: 800,
                                            cursor: reviewSubmitting || ratingValue < 1 ? "not-allowed" : "pointer",
                                            opacity: reviewSubmitting || ratingValue < 1 ? 0.6 : 1,
                                        }}
                                    >
                                        {reviewSubmitting
                                            ? isRtl ? "جارٍ الإرسال..." : "Submitting..."
                                            : isRtl ? "إرسال التقييم" : "Submit review"}
                                    </button>
                                </>
                            )}
                        </form>
                    )}

                    {/* Customer details for Provider */}
                    {isProvider && booking.customerDetails && (
                        <div style={{
                            padding: "12px 18px",
                            borderTop: "1px solid var(--border)",
                            background: "rgba(59,130,246,0.02)",
                            fontSize: 12,
                            color: "var(--text-dim)",
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                            textAlign: isRtl ? "right" : "left"
                        }}>
                            <span style={{ color: "var(--blue-bright)", fontWeight: 700, fontSize: 10, display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-start", flexDirection: "row" }}>
                                <User size={12} /> {t.customerDetails}
                            </span>
                            <span>{t.nameLabel}: {booking.customerDetails.name}</span>
                            <span>{t.emailLabel}: {booking.customerDetails.email}</span>
                            <span style={{ display: "flex", alignItems: "center", gap: 5, flexDirection: "row" }}>
                                <Phone size={12} /> <span style={{ opacity: 0.85 }}>{t.phoneLabel}:</span> <span dir="ltr">{booking.customerDetails.phone}</span>
                            </span>
                        </div>
                    )}

                    {/* Summary strip */}
                    <div style={{
                        display: "flex", justifyContent: "flex-end", gap: 24,
                        padding: "12px 18px", background: "rgba(255,255,255,0.02)",
                        borderTop: "1px solid var(--border)",
                        flexDirection: "row"
                    }}>
                        {[].map(([l, v]) => (
                            <div key={l} style={{ textAlign: isRtl ? "right" : "left" }}>
                                <p style={{ fontSize: 10, color: "var(--text-muted)" }}>{l}</p>
                                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-dim)" }}>₪{v?.toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Chat Modal popup */}
            {showChat && (
                <ChatModal booking={booking} onClose={() => setShowChat(false)} />
            )}
        </div>
    );
}

export default function Bookings() {
    const { user, isAuthenticated } = useAuth();
    const { locale } = useContext(PortalContext);
    const t = translations[locale];
    const isRtl = locale === "ar";

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading]  = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError]      = useState(null);
    const navigate = useNavigate();

    const isProvider = user?.role === "provider";

    // useCallback keeps the function identity stable, so the effect below can
    // list it as a dependency (react-hooks/exhaustive-deps).
    const fetchBookingsList = useCallback(
        async (silent = false) => {
            if (!user?._id) return;
            if (silent) setRefreshing(true);
            else setLoading(true);
            try {
                const data = isProvider
                    ? await getProviderBookings(user._id)
                    : await getUserBookings(user._id);
                setBookings(data || []);
                setError(null);
            } catch (err) {
                console.error(err);
                setError(t.failedToLoadBookings);
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [user, isProvider, t.failedToLoadBookings],
    );

    // Manual refresh button + silent auto-refresh every 30s.
    const handleRefresh = useCallback(() => fetchBookingsList(true), [fetchBookingsList]);
    useAutoRefresh(handleRefresh, 30000, isAuthenticated && !!user?._id);

    useEffect(() => {
        if (!isAuthenticated) { navigate("/"); return; }
        fetchBookingsList();
    }, [isAuthenticated, fetchBookingsList, navigate]);

    // Apply the server response immediately so status buttons and labels change
    // without a manual page refresh. A silent fetch still runs afterward to
    // reconcile populated fields and counters.
    const handleBookingUpdate = useCallback((updated) => {
        if (!updated?._id) return;
        setBookings((current) =>
            current.map((booking) =>
                String(booking._id) === String(updated._id)
                    ? { ...booking, ...updated }
                    : booking
            )
        );
    }, []);

    const pageTitle = (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexDirection: "row" }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "clamp(1.5rem,3vw,2rem)", color: "var(--text)", letterSpacing: "-0.02em" }}>
                {isProvider ? t.assignedBookingsTitle : t.myBookingsTitle}
            </h1>
            <RefreshButton
                onClick={handleRefresh}
                refreshing={refreshing}
                label={refreshing ? t.refreshing : t.refresh}
            />
            {bookings.length > 0 && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: "4px 12px", borderRadius: 99, background: "var(--blue-dim)", color: "var(--blue-bright)", border: "1px solid var(--border-blue)" }}>
                    {bookings.length} {t.totalBookings}
                </span>
            )}
        </div>
    );

    if (loading) return (
        <div style={{ paddingTop: 28, maxWidth: 760, margin: "0 auto", direction: isRtl ? "rtl" : "ltr" }}>
            {pageTitle}
            {[1, 2, 3].map(i => (
                <div key={i} style={{ height: 64, borderRadius: 20, background: "var(--glass-bg)", border: "1px solid var(--border)", marginBottom: 10, animation: "pulse 1.5s ease infinite" }} />
            ))}
            <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
        </div>
    );

    if (error) return (
        <div style={{ paddingTop: 28, maxWidth: 760, margin: "0 auto", direction: isRtl ? "rtl" : "ltr" }}>
            {pageTitle}
            <div style={{ fontSize: 13, padding: "10px 14px", borderRadius: 12, background: "var(--red-dim)", color: "var(--red)", border: "1px solid rgba(239,68,68,.3)", textAlign: isRtl ? "right" : "left" }}>{error}</div>
        </div>
    );

    if (bookings.length === 0) return (
        <div style={{ paddingTop: 28, maxWidth: 760, margin: "0 auto", direction: isRtl ? "rtl" : "ltr" }}>
            {pageTitle}
            <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                padding: "56px 24px", textAlign: "center",
                background: "var(--glass-bg)", border: "1px solid var(--border)",
                backdropFilter: "blur(12px)", borderRadius: 20,
            }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: "var(--blue-dim)", border: "1px solid var(--border-blue)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                    <BookOpen size={24} style={{ color: "var(--blue-bright)" }} />
                </div>
                <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", color: "var(--text)", marginBottom: 6 }}>
                    {isProvider ? t.noAssignedBookingsYet : t.noBookingsYet}
                </h3>
                <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
                    {isProvider ? t.noAssignedBookingsDesc : t.noBookingsDesc}
                </p>
                {!isProvider && (
                    <button onClick={() => navigate("/")} className="btn-glow" style={{
                        display: "flex", alignItems: "center", gap: 8, padding: "10px 20px",
                        borderRadius: 12, fontSize: 13, fontWeight: 700,
                        background: "linear-gradient(135deg, var(--blue), var(--cyan))",
                        color: "#fff", border: "none", cursor: "pointer", fontFamily: "var(--font-display)",
                        flexDirection: "row"
                    }}>
                        <span>{t.browseServices}</span> <ArrowRight size={13} style={{ transform: isRtl ? "rotate(180deg)" : "rotate(0)" }} />
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div style={{ paddingTop: 28, paddingBottom: 48, maxWidth: 760, margin: "0 auto", direction: isRtl ? "rtl" : "ltr" }}>
            {pageTitle}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {bookings.map(b => (
                    <BookingCard
                        key={b.bookingId || b._id}
                        booking={b}
                        isProvider={isProvider}
                        onRefresh={fetchBookingsList}
                        onUpdate={handleBookingUpdate}
                        locale={locale}
                    />
                ))}
            </div>
        </div>
    );
}
