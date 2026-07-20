import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Only authenticated technicians (role === "provider") may reach the provider
// dashboard. Everyone else is sent back to the home page.
const ProtectedProviderRoute = ({ children }) => {
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    if (user?.role !== "provider") {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedProviderRoute;
