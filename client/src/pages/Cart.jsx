import { useContext, useState } from "react";
import CartContext from "../context/CartState";
import { useNavigate } from "react-router-dom";
import { clearUserCart, createBooking } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import PortalContext from "../context/PortalContext";
import { translations } from "../utils/translations";
import { useFeedback } from "../components/FeedbackContext";
import { ShoppingCart, ImageOff, Plus, Minus, Trash2, ArrowRight, CheckCircle } from "lucide-react";

export default function Cart() {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [isBooking, setIsBooking] = useState(false);
    const { openLogin, openAddress, address, coords, locale } = useContext(PortalContext);
    const { cartServices, addToCart, removeFromCart, getCartTax, getCartSubTotal, getCartTotal } = useContext(CartContext);

    const t = translations[locale];
    const isRtl = locale === "ar";
    const { toast } = useFeedback();

    const sorted = [...cartServices].sort((a, b) => a.category.localeCompare(b.category));

    const handleBooking = async () => {
        try {
            setIsBooking(true);
            // Deterministic key derived from the cart contents so that two
            // rapid submissions of the same cart create exactly one booking.
            const idempotencyKey = `cart-${user._id}-${sorted
                .map((s) => `${s._id}x${s.quantity}`)
                .join("_")}`;
            const result = await createBooking({
                userId: user._id,
                idempotencyKey,
                coords: coords || undefined,
                items: sorted.map(s => ({
                    serviceId: s._id, image: s.image, title: s.title, category: s.category,
                    quantity: s.quantity, price: s.OurPrice, total: s.OurPrice * s.quantity,
                    suggestedPrice: s.OurPrice, priceRange: { min: s.minPrice, max: s.maxPrice },
                })),
                summary: { subtotal: getCartSubTotal(), tax: getCartTax(), total: getCartTotal(), itemCount: sorted.length },
                customerDetails: { name: user.first_name, email: user.email, phone: user.phone, address },
            });
            if (result.success) {
                sorted.forEach(s => removeFromCart(s));
                await clearUserCart();
                navigate("/bookings");
            } else throw new Error(result.message);
        } catch (err) {
            console.error(err);
            toast(isRtl ? "فشل إكمال عملية الحجز، يرجى المحاولة لاحقاً." : "Unable to complete booking. Please try again.", "error");
        } finally { setIsBooking(false); }
    };

    const handleWrap = (e) => {
        e.preventDefault();
        if (!isAuthenticated) { openLogin(); return; }
        if (!address) {
            toast(t.addressAlert, "warning");
            openAddress();
            return;
        }
        handleBooking();
    };

    /* Empty */
    if (sorted.length === 0) return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", textAlign: "center", gap: 16 }}>
            <div style={{
                width: 72, height: 72, borderRadius: 20,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "var(--blue-dim)", border: "1px solid var(--border-blue)",
            }}>
                <ShoppingCart size={32} style={{ color: "var(--blue-bright)" }} />
            </div>
            <div>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.4rem", color: "var(--text)", marginBottom: 6 }}>
                    {t.cartEmpty}
                </h2>
                <p style={{ fontSize: 13, color: "var(--text-muted)" }}>{t.cartEmptyDesc}</p>
            </div>
            <button onClick={() => navigate("/")} className="btn-glow" style={{
                display: "flex", alignItems: "center", gap: 8, padding: "11px 22px",
                borderRadius: 12, fontSize: 13, fontWeight: 700,
                background: "linear-gradient(135deg, var(--blue), var(--cyan))",
                color: "#fff", border: "none", cursor: "pointer",
                fontFamily: "var(--font-display)", marginTop: 4,
                flexDirection: "row"
            }}>
                <span>{t.browseServices}</span> <ArrowRight size={14} style={{ transform: isRtl ? "rotate(180deg)" : "rotate(0)" }} />
            </button>
        </div>
    );

    return (
        <div style={{ padding: "28px 0", maxWidth: 720, margin: "0 auto", direction: isRtl ? "rtl" : "ltr" }}>
            <h1 style={{
                fontFamily: "var(--font-display)", fontWeight: 800,
                fontSize: "clamp(1.6rem,3vw,2rem)", color: "var(--text)",
                letterSpacing: "-0.02em", marginBottom: 24,
                textAlign: isRtl ? "right" : "left"
            }}>{t.cart}</h1>

            {/* Items */}
            <div style={{
                background: "var(--glass-bg)", border: "1px solid var(--border)",
                backdropFilter: "blur(12px)", borderRadius: 20, overflow: "hidden",
                marginBottom: 16,
            }}>
                {sorted.map((service, idx) => (
                    <div key={service._id}>
                        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", flexDirection: "row" }}>
                            {/* Thumb */}
                            <div style={{
                                width: 60, height: 60, borderRadius: 12, flexShrink: 0,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                overflow: "hidden",
                                background: "radial-gradient(ellipse,rgba(59,130,246,.15),rgba(8,9,15,.5))",
                                border: "1px solid var(--border)",
                            }}>
                                {service.image
                                    ? <img loading="lazy" src={`${import.meta.env.VITE_BACKEND_URL}/${service.image}`} alt={t[service.title] || service.title} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 8 }} />
                                    : <ImageOff size={18} style={{ color: "var(--text-muted)" }} />}
                            </div>

                            {/* Info */}
                            <div style={{ flex: 1, minWidth: 0, textAlign: isRtl ? "right" : "left" }}>
                                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 3 }}>
                                    {t[service.title] || service.title}
                                </p>
                                <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
                                    ₪{service.OurPrice} {isRtl ? "للوحدة" : "/ unit"}
                                </p>
                            </div>

                            {/* Qty */}
                            <div style={{ display: "flex", alignItems: "center", borderRadius: 10, overflow: "hidden", border: "1px solid var(--border-blue)", flexShrink: 0, flexDirection: "row" }}>
                                <button onClick={() => removeFromCart(service)} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--blue-dim)", border: "none", cursor: "pointer", color: "var(--text)" }}>
                                    {cartServices.find(c => c._id === service._id)?.quantity === 1
                                        ? <Trash2 size={12} style={{ color: "var(--red)" }} />
                                        : <Minus size={12} />}
                                </button>
                                <span style={{ width: 32, textAlign: "center", fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                                    {cartServices.find(c => c._id === service._id)?.quantity}
                                </span>
                                <button onClick={() => addToCart(service)} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--blue)", border: "none", cursor: "pointer", color: "#fff" }}>
                                    <Plus size={12} />
                                </button>
                            </div>

                            {/* Line total */}
                            <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", width: 64, textAlign: isRtl ? "left" : "right", flexShrink: 0 }}>
                                ₪{service.OurPrice * service.quantity}
                            </p>
                        </div>
                        {idx < sorted.length - 1 && <div style={{ height: 1, background: "var(--border)", margin: "0 18px" }} />}
                    </div>
                ))}
            </div>

            {/* Summary + CTA */}
            <div style={{
                background: "var(--glass-bg)", border: "1px solid var(--border-blue)",
                backdropFilter: "blur(12px)", borderRadius: 20, overflow: "hidden",
            }}>
                <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
                    {[[t.subtotal, getCartSubTotal()], [t.taxAndFees, getCartTax()]].map(([l, v]) => (
                        <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, flexDirection: "row" }}>
                            <span style={{ color: "var(--text-muted)" }}>{l}</span>
                            <span style={{ color: "var(--text-dim)" }}>₪{v}</span>
                        </div>
                    ))}
                    <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, flexDirection: "row" }}>
                        <span style={{ color: "var(--text)", fontFamily: "var(--font-display)" }}>{t.total}</span>
                        <span style={{
                            background: "linear-gradient(135deg, var(--blue-bright), var(--cyan))",
                            WebkitBackgroundClip: "text", backgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                        }}>₪{getCartTotal()}</span>
                    </div>
                </div>
                <button onClick={handleWrap} disabled={isBooking} className="btn-glow" style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    padding: "16px", fontSize: 14, fontWeight: 700,
                    background: "linear-gradient(135deg, var(--blue), var(--cyan))",
                    color: "#fff", border: "none", cursor: isBooking ? "not-allowed" : "pointer",
                    opacity: isBooking ? 0.6 : 1, fontFamily: "var(--font-display)",
                    flexDirection: "row"
                }}>
                    {isBooking ? t.sendingBooking : <><CheckCircle size={16} /> {t.confirmAndSaveOrder}</>}
                </button>
            </div>
        </div>
    );
}
