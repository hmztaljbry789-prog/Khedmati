import { createContext, useContext, useState, useEffect } from "react";
import { getUserDetails, logout as logoutAPI } from "../utils/api";

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUserState] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check authentication status on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                setLoading(true);
                const userData = await getUserDetails();

                if (userData.isAuthenticated && userData.user) {
                    setIsAuthenticated(true);
                    setUserState(userData.user);
                } else {
                    handleLogout();
                }
            } catch (error) {
                console.error("Auth check failed:", error);
                handleLogout();
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = (userData) => {
        setIsAuthenticated(true);
        setUserState(userData.user || userData);
    };

    // Re-fetch the current user from the server so role/profile changes
    // (e.g. being promoted to admin) take effect without a full page reload.
    const refreshUser = async () => {
        try {
            const userData = await getUserDetails();
            if (userData.isAuthenticated && userData.user) {
                setIsAuthenticated(true);
                setUserState(userData.user);
                return userData.user;
            }
        } catch (error) {
            console.error("Refresh user failed:", error);
        }
        return null;
    };

    const handleLogout = async () => {
        try {
            await logoutAPI();
            setIsAuthenticated(false);
            setUserState(null);
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const isAdmin = () => {
        return user?.role === "admin";
    };

    const setUser = (nextUser) => setUserState(nextUser);

    const value = {
        isAuthenticated,
        user,
        setUser,
        loading,
        login,
        refreshUser,
        logout: handleLogout,
        isAdmin,
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
