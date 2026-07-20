// src/App.jsx
import "./App.css";
import { Routes, Route } from "react-router-dom";
import PortalLayout from "./components/PortalLayout";
import Layout from "./layout/layout";
import HomePage from "./pages/HomePage";
import ServiceList from "./pages/ServiceList";
import ServiceDetails from "./components/ServiceDetails";
import Bookings from "./pages/Bookings";
import Cart from "./pages/Cart";
import ProviderDashboard from "./pages/ProviderDashboard";
import ProviderProfile from "./pages/ProviderProfile";
import Support from "./pages/Support";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import About from "./pages/About";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import AccountSettings from "./pages/AccountSettings";
import Admin from "./admin/Pages/Main";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import ProtectedProviderRoute from "./components/ProtectedProviderRoute";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { PortalProvider } from "./context/PortalContext";
import { NotificationProvider } from "./context/NotificationContext";
import { AnimatePresence } from "framer-motion";

import Loader from "./components/Loader";

function AppContent() {
    const { loading, isAuthenticated } = useAuth();

    if (loading) {
        return <Loader />;
    }

    return (
        <NotificationProvider>
        <PortalProvider>
            <CartProvider isAuthenticated={isAuthenticated}>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<HomePage />} />
                    <Route path="/services">
                        <Route
                            path=":serviceName"
                            element={<ServiceDetails />}
                        />
                        <Route
                            path=":serviceName/:subcategory"
                            element={<ServiceList />}
                        />
                        <Route
                            path=":serviceName/:subcategory/:serviceType"
                            element={<ServiceList />}
                        />
                        <Route
                            path=":serviceName/portal"
                            element={<PortalLayout />}
                        />
                    </Route>
                    <Route path="/bookings" element={<Bookings />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/support" element={<Support />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    <Route
                        path="/provider"
                        element={
                            <ProtectedProviderRoute>
                                <ProviderDashboard />
                            </ProtectedProviderRoute>
                        }
                    />
                    <Route
                        path="/provider/profile"
                        element={
                            <ProtectedProviderRoute>
                                <ProviderProfile />
                            </ProtectedProviderRoute>
                        }
                    />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/account" element={<AccountSettings />} />
                    <Route path="*" element={<NotFound />} />
                </Route>

                {/* Protected Admin Routes */}
                <Route
                    path="/admin/*"
                    element={
                        <ProtectedAdminRoute>
                            <Routes>
                                <Route path="*" element={<Admin />} />
                            </Routes>
                        </ProtectedAdminRoute>
                    }
                />
            </Routes>
            </CartProvider>
        </PortalProvider>
        </NotificationProvider>
    );
}

function App() {
    return (
        <AnimatePresence mode="wait">
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </AnimatePresence>
    );
}

export default App;
