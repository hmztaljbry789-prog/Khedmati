import { useEffect, useState, useCallback, useContext, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PortalContext from "../context/PortalContext";
import Login from "../components/Login";
import Register from "../components/Register";
import PortalLayout from "../components/PortalLayout";
import Location from "../components/Location";
import NotificationBell from "../components/NotificationBell";
import { translations } from "../utils/translations";
import { localizeAddress } from "../utils/localize";
import { BookOpen, LogOut, MapPin, Menu, X, ChevronDown, Sun, Moon, Globe, Wrench, ShoppingCart, LayoutDashboard, LifeBuoy } from "lucide-react";

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { 
        showAddress, openAddress, closeAddress, 
        showLogin, openLogin, closeLogin, 
        showRegister, openRegister, closeRegister, 
        address,
        theme, toggleTheme,
        locale, toggleLocale
    } = useContext(PortalContext);
    
    const { isAuthenticated, user, login, logout } = useAuth();

    const [scrolled, setScrolled]       = useState(false);
    const [mobileOpen, setMobileOpen]   = useState(false);
    const [userDrop, setUserDrop]       = useState(false);
    const dropRef = useRef(null);

    const t = translations[locale];
    const isRtl = locale === "ar";

    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 12);
        window.addEventListener("scroll", fn, { passive: true });
        return () => window.removeEventListener("scroll", fn);
    }, []);

    useEffect(() => { setMobileOpen(false); }, [location]);

    useEffect(() => {
        const fn = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setUserDrop(false); };
        document.addEventListener("mousedown", fn);
        return () => document.removeEventListener("mousedown", fn);
    }, []);

    const handleLoginSuccess  = useCallback((u) => {
        login(u);
        closeLogin();
        // Admins land straight on the management dashboard after signing in.
        if (u?.role === "admin") navigate("/admin");
    }, [closeLogin, login, navigate]);
    const handleRegSuccess    = useCallback((u) => { login(u); closeRegister(); }, [closeRegister, login]);
    const handleLogout        = useCallback(async () => {
        try { await logout(); setUserDrop(false); navigate("/"); } catch { /* empty */ }
    }, [logout, navigate]);

    /* ── shared styles ── */
    const pill = {
        display: "flex", alignItems: "center", gap: "8px",
        padding: "8px 14px", borderRadius: "12px", fontSize: "13px", fontWeight: 500,
        background: "var(--glass-bg)", border: "1px solid var(--glass-border)",
        backdropFilter: "blur(12px)", color: "var(--text)",
        textDecoration: "none", cursor: "pointer", transition: "all 0.2s",
    };

    return (
        <>
            <nav style={{
                height: 72,
                padding: "0 40px",
                background: scrolled ? "rgba(var(--bg), 0.80)" : "rgba(var(--bg), 0.40)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                borderBottom: `1px solid ${scrolled ? "var(--border-light)" : "var(--border)"}`,
                transition: "all 0.3s ease",
                boxShadow: scrolled ? "0 4px 30px rgba(0,0,0,0.15)" : "none",
                direction: isRtl ? "rtl" : "ltr"
            }}>
                <div style={{ maxWidth: 1400, margin: "0 auto", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>

                    {/* Right logo & brand — desktop */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
                            <div style={{
                                width: 32, height: 32, borderRadius: 10,
                                background: "linear-gradient(135deg, var(--blue), var(--cyan))",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: "var(--shadow-blue)",
                            }}>
                                <img src="/logo-192.png" alt="" width="30" height="30" />
                            </div>
                            <span style={{
                                fontFamily: "var(--font-display)", fontWeight: 800,
                                fontSize: "1.35rem", letterSpacing: "-0.02em",
                                background: "linear-gradient(135deg, var(--text), var(--text-dim))",
                                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                            }}>{t.brand}</span>
                        </Link>
                        {isAuthenticated && user?.role === "admin" && (
                            <Link to="/admin" style={{
                                fontSize: 10, fontWeight: 700, padding: "2px 8px",
                                borderRadius: 99, background: "var(--blue-dim)",
                                color: "var(--blue-bright)", border: "1px solid var(--border-blue)",
                                textDecoration: "none",
                            }}>{t.admin}</Link>
                        )}
                    </div>

                    {/* Center Links (Cart + Bookings) — desktop */}
                    <div className="nav-desktop" style={{ alignItems: "center", gap: 8 }}>
                        {/* Bookings */}
                        {isAuthenticated && user && (
                            <Link to="/bookings" style={{ ...pill }}>
                                <BookOpen size={16} strokeWidth={2} />
                                <span>{t.bookings}</span>
                            </Link>
                        )}

                        {/* Support */}
                        {isAuthenticated && user?.role !== "admin" && (
                            <Link to="/support" style={pill}>
                                <LifeBuoy size={16} strokeWidth={2} />
                                <span>{t.support?.nav}</span>
                            </Link>
                        )}

                        {/* Cart */}
                        {isAuthenticated && user?.role !== "admin" && (
                            <Link to="/cart" style={pill}>
                                <ShoppingCart size={16} strokeWidth={2} />
                                <span>{t.cart}</span>
                            </Link>
                        )}

                        {/* Technician dashboard */}
                        {isAuthenticated && user?.role === "provider" && (
                            <Link to="/provider" style={pill}>
                                <Wrench size={16} strokeWidth={2} />
                                <span>{isRtl ? "لوحة الفني" : "Technician"}</span>
                            </Link>
                        )}

                        {isAuthenticated && user && <Link to="/account" style={pill}><span>{isRtl ? "الحساب" : "Account"}</span></Link>}

                        {/* Admin panel */}
                        {isAuthenticated && user?.role === "admin" && (
                            <Link to="/admin" style={pill}>
                                <LayoutDashboard size={16} strokeWidth={2} />
                                <span>{isRtl ? "لوحة التحكم" : "Admin Panel"}</span>
                            </Link>
                        )}

                        {/* Location */}
                        <button onClick={openAddress} style={{ ...pill, maxWidth: 260, color: address ? "var(--text)" : "var(--text-muted)" }}>
                            <MapPin size={14} style={{ color: "var(--blue)", flexShrink: 0 }} />
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {address ? localizeAddress(address, locale === "ar") : t.enterLocation}
                            </span>
                        </button>
                    </div>

                    {/* Left (Auth + Actions) — desktop */}
                    <div className="nav-desktop" style={{ alignItems: "center", gap: 8 }}>

                        {/* Auth */}
                        {isAuthenticated && user ? (
                            <div ref={dropRef} style={{ position: "relative" }}>
                                <button onClick={() => setUserDrop(v => !v)} style={{ ...pill }}>
                                    <div style={{
                                        width: 26, height: 26, borderRadius: "50%",
                                        background: "linear-gradient(135deg, var(--blue), var(--cyan))",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0,
                                    }}>
                                        {user?.profilePhoto && user.profilePhoto.startsWith("http") ? <img src={user.profilePhoto} alt="" style={Object.assign({ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" })} onError={(e) => { console.error("[photo] failed to load:", e.target.src); e.target.onerror = null; e.target.src = "/logo-192.png"; }} /> : user?.first_name?.[0]?.toUpperCase()}
                                    </div>
                                    <span style={{ maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {user?.first_name}
                                    </span>
                                    <ChevronDown size={13} style={{ transition: "transform 0.2s", transform: userDrop ? "rotate(180deg)" : "rotate(0)" }} />
                                </button>
                                {userDrop && (
                                    <div style={{
                                        position: "absolute", left: isRtl ? 0 : "auto", right: isRtl ? "auto" : 0, top: "calc(100% + 8px)",
                                        width: 160, borderRadius: 14, overflow: "hidden",
                                        background: "var(--card-solid)", border: "1px solid var(--border-light)",
                                        boxShadow: "var(--shadow-lg)", zIndex: 100,
                                    }}>
                                        <button onClick={handleLogout} style={{
                                            width: "100%", display: "flex", alignItems: "center", gap: 8,
                                            padding: "10px 14px", fontSize: 13, cursor: "pointer",
                                            color: "var(--red)", background: "transparent", border: "none",
                                            transition: "background 0.15s",
                                            textAlign: isRtl ? "right" : "left"
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.background = "var(--red-dim)"}
                                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                        >
                                            <LogOut size={14} /> <span>{t.signOut}</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={openLogin} style={pill}>{t.loginBtn}</button>
                                <button onClick={openRegister} className="btn-glow" style={{
                                    padding: "8px 18px", borderRadius: 12, fontSize: 13, fontWeight: 700,
                                    background: "linear-gradient(135deg, var(--blue), var(--cyan))",
                                    color: "#fff", border: "none", cursor: "pointer",
                                    fontFamily: "var(--font-display)",
                                }}>{t.registerBtn}</button>
                            </div>
                        )}

                        <div style={{ width: 1, height: 24, background: "var(--border)" }} />

                        {isAuthenticated && user && <NotificationBell />}

                        {/* Theme Toggle Button */}
                        <button onClick={toggleTheme} style={{ ...pill, padding: 8, borderRadius: "50%" }} title={theme === "light" ? "Dark Mode" : "Light Mode"}>
                            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
                        </button>

                        {/* Language Toggle Button */}
                        <button onClick={toggleLocale} style={{ ...pill, padding: "8px 12px" }} title="تغيير اللغة / Change Language">
                            <Globe size={14} />
                            <span style={{ fontSize: 11, fontWeight: 700 }}>{t.languageSwitch}</span>
                        </button>

                    </div>

                    {/* Mobile icons */}
                    <div className="nav-mobile" style={{ alignItems: "center", gap: 6 }}>
                        <button onClick={toggleTheme} style={{ ...pill, padding: 8, borderRadius: "50%" }}>
                            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
                        </button>
                        <button onClick={toggleLocale} style={{ ...pill, padding: 8, borderRadius: "50%" }}>
                            <Globe size={16} />
                        </button>
                        {isAuthenticated && user && <NotificationBell />}
                        <button onClick={() => setMobileOpen(v => !v)} style={{ ...pill, padding: 8 }}>
                            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div className="nav-mobile-panel" style={{
                    position: "fixed", top: 72, left: 0, right: 0, zIndex: 40,
                    padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8,
                    background: "var(--card-solid)", backdropFilter: "blur(24px)",
                    borderBottom: "1px solid var(--border-light)",
                    direction: isRtl ? "rtl" : "ltr",
                }}>
                    <button onClick={() => { openAddress(); setMobileOpen(false); }} style={{ ...pill, justifyContent: "flex-start", color: address ? "var(--text)" : "var(--text-muted)" }}>
                        <MapPin size={15} style={{ color: "var(--blue)" }} />
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%", textAlign: isRtl ? "right" : "left" }}>
                            {address ? localizeAddress(address, locale === "ar") : t.enterLocation}
                        </span>
                    </button>
                    {isAuthenticated && user && (
                        <Link to="/bookings" style={{ ...pill, justifyContent: "flex-start" }}>
                            <BookOpen size={15} /><span>{t.bookings}</span>
                        </Link>
                    )}
                    <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
                    {isAuthenticated && user ? (
                        <div style={{ ...pill, justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{
                                    width: 30, height: 30, borderRadius: "50%",
                                    background: "linear-gradient(135deg, var(--blue), var(--cyan))",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 12, fontWeight: 700, color: "#fff",
                                }}>
                                    {user?.profilePhoto && user.profilePhoto.startsWith("http") ? <img src={user.profilePhoto} alt="" style={Object.assign({ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" })} onError={(e) => { console.error("[photo] failed to load:", e.target.src); e.target.onerror = null; e.target.src = "/logo-192.png"; }} /> : user?.first_name?.[0]?.toUpperCase()}
                                </div>
                                <span style={{ fontSize: 13 }}>
                                    {locale === "ar" ? `مرحباً، ${user?.first_name}` : `Welcome, ${user?.first_name}`}
                                </span>
                            </div>
                            <button onClick={handleLogout} style={{
                                display: "flex", alignItems: "center", gap: 6, fontSize: 12,
                                color: "var(--red)", background: "var(--red-dim)",
                                padding: "4px 10px", borderRadius: 8, border: "none", cursor: "pointer",
                            }}>
                                <LogOut size={13} /> <span>{t.signOut}</span>
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => { openLogin(); setMobileOpen(false); }} style={{ ...pill, flex: 1, justifyContent: "center" }}>{t.loginBtn}</button>
                            <button onClick={() => { openRegister(); setMobileOpen(false); }} className="btn-glow" style={{
                                flex: 1, padding: "10px 14px", borderRadius: 12, fontSize: 13, fontWeight: 700,
                                background: "linear-gradient(135deg, var(--blue), var(--cyan))",
                                color: "#fff", border: "none", cursor: "pointer",
                            }}>{t.registerBtn}</button>
                        </div>
                    )}
                </div>
            )}

            {/* Portals */}
            <PortalLayout isOpen={showAddress} onClose={closeAddress}><Location /></PortalLayout>
            <PortalLayout isOpen={showLogin} onClose={closeLogin}>
                <Login onLoginSuccess={handleLoginSuccess} onClose={closeLogin} onSwitchToRegister={openRegister} />
            </PortalLayout>
            <PortalLayout isOpen={showRegister} onClose={closeRegister}>
                <Register onRegisterSuccess={handleRegSuccess} onClose={closeRegister} onSwitchToLogin={openLogin} openLogin={openLogin} />
            </PortalLayout>
        </>
    );
}
