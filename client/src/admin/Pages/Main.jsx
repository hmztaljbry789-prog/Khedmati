import { useContext } from "react";
import { Routes, Route } from "react-router-dom";
import AdminSidebar from "../Components/AdminSidebar";
import AdminNavbar from "../Components/AdminNavbar";
import AdminServicesPage from "./AdminServicesPage";
import AdminDashboard from "./AdminDashboard";
import AdminBookings from "./AdminBookings";
import AdminUsers from "./AdminUsers";
import AdminSupport from "./AdminSupport";
import PortalContext from "../../context/PortalContext";
import "../admin-theme.css";

const shell = {
    minHeight: "100vh",
    background: "rgb(var(--bg))",
    color: "var(--text)",
    padding: "20px clamp(16px, 4vw, 40px)",
    display: "flex",
    flexDirection: "column",
    gap: 24,
};
const contentWrap = { width: "100%", display: "flex", flexDirection: "column" };

export default function Main() {
    const { locale } = useContext(PortalContext);
    const isRtl = locale === "ar";

    return (
        <div className="admin-scope" style={shell} dir={isRtl ? "rtl" : "ltr"}>
            <AdminSidebar />
            <div style={contentWrap}>
                <AdminNavbar />
                <Routes>
                    <Route path="/" element={<AdminDashboard />} />
                    <Route path="/services" element={<AdminServicesPage />} />
                    <Route path="/bookings" element={<AdminBookings />} />
                    <Route path="/users" element={<AdminUsers />} />
                    <Route path="/support" element={<AdminSupport />} />
                    <Route
                        path="*"
                        element={
                            <div>{isRtl ? "الصفحة غير موجودة" : "Page not found"}</div>
                        }
                    />
                </Routes>
            </div>
        </div>
    );
}
