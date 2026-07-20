import { useContext } from "react";
import CartContext from "../context/CartState";
import PortalContext from "../context/PortalContext";
import { translations } from "../utils/translations";
import { Link } from "react-router-dom";
import { Plus, Minus, Trash2, ShoppingCart, ArrowRight } from "lucide-react";

export default function ServiceCart() {
    const { locale } = useContext(PortalContext);
    const t = translations[locale];
    const isRtl = locale === "ar";
    const { cartServices, addToCart, removeFromCart, clearCart, getCartTotal } =
        useContext(CartContext);

    return (
        <div
            className="flex flex-col h-full rounded-2xl overflow-hidden"
            style={{
                backgroundColor: "var(--glass-bg)",
                border: "1px solid var(--border)",
                boxShadow: "0 4px 12px rgba(0,0,0,.5)",
            }}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 py-3.5"
                style={{ borderBottom: "1px solid var(--border)" }}
            >
                <div className="flex items-center gap-2">
                    <ShoppingCart size={16} style={{ color: "var(--blue-bright)" }} />
                    <h3
                        className="text-sm font-bold"
                        style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}
                    >
                        {t.cart}
                    </h3>
                    {cartServices.length > 0 && (
                        <span
                            className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                            style={{ backgroundColor: "var(--blue-bright)" }}
                        >
                            {cartServices.length}
                        </span>
                    )}
                </div>
                {cartServices.length > 0 && (
                    <button
                        onClick={clearCart}
                        className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg transition-colors hover:bg-red-50"
                        style={{ color: "var(--red)", border: "none", background: "none", cursor: "pointer" }}
                    >
                        <Trash2 size={11} />
                        {isRtl ? "تفريغ" : "Clear"}
                    </button>
                )}
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-4 py-3" style={{ textAlign: isRtl ? "right" : "left" }}>
                {cartServices.length === 0 ? (
                    <div
                        className="flex flex-col items-center justify-center h-full py-8 text-center"
                        style={{ color: "var(--text-muted)" }}
                    >
                        <ShoppingCart size={28} className="mb-2 opacity-40" />
                        <p className="text-xs">{t.cartEmpty}</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {cartServices.map((service, idx) => (
                            <div key={service._id}>
                                <div className="flex items-center justify-between gap-3">
                                    {/* Name + price */}
                                    <div className="flex-1 min-w-0" style={{ textAlign: isRtl ? "right" : "left" }}>
                                        <p
                                            className="text-xs font-semibold truncate"
                                            style={{ color: "var(--text)" }}
                                        >
                                            {t[service.title] || service.title}
                                        </p>
                                        <p
                                            className="text-xs mt-0.5"
                                            style={{ color: "var(--blue-bright)" }}
                                        >
                                            ₪{service.OurPrice}
                                        </p>
                                    </div>

                                    {/* Qty controls */}
                                    <div
                                        className="flex items-center rounded-lg overflow-hidden flex-shrink-0"
                                        style={{ border: "1.5px solid var(--border)" }}
                                    >
                                        <button
                                            onClick={() => removeFromCart(service)}
                                            className="w-7 h-7 flex items-center justify-center transition-colors hover:bg-red-50"
                                            style={{ color: "var(--text-muted)", border: "none", background: "none", cursor: "pointer" }}
                                        >
                                            {service.quantity === 1
                                                ? <Trash2 size={11} style={{ color: "var(--red)" }} />
                                                : <Minus size={11} />}
                                        </button>
                                        <span
                                            className="w-7 text-center text-xs font-bold"
                                            style={{ color: "var(--text)" }}
                                        >
                                            {cartServices.find((c) => c._id === service._id)?.quantity}
                                        </span>
                                        <button
                                            onClick={() => addToCart(service)}
                                            className="w-7 h-7 flex items-center justify-center transition-colors hover:bg-green-50"
                                            style={{ color: "var(--text-muted)", border: "none", background: "none", cursor: "pointer" }}
                                        >
                                            <Plus size={11} />
                                        </button>
                                    </div>
                                </div>
                                {idx < cartServices.length - 1 && (
                                    <div className="mt-3 h-px" style={{ backgroundColor: "var(--border)" }} />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            {cartServices.length > 0 && (
                <div
                    className="px-4 py-3"
                    style={{ borderTop: "1px solid var(--border)" }}
                >
                    <div
                        className="flex items-center justify-between text-sm font-bold mb-3"
                        style={{ color: "var(--text)" }}
                    >
                        <span>{t.total}</span>
                        <span style={{ color: "var(--blue-bright)" }}>₪{getCartTotal()}</span>
                    </div>
                    <Link
                        to="/viewcart"
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-90"
                        style={{
                            backgroundColor: "var(--text)",
                            color: "#fff",
                            textDecoration: "none",
                            fontFamily: "var(--font-display)",
                        }}
                    >
                        {t.viewCartFloating}
                        <ArrowRight size={13} style={{ transform: isRtl ? "rotate(180deg)" : "rotate(0)" }} />
                    </Link>
                </div>
            )}
        </div>
    );
}
