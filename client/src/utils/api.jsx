import axios from "axios";

// Set up base URL for the API and create an axios instance with default settings.
const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

// IMPORTANT: do NOT set a default "Content-Type" header here.
// axios sets "application/json" automatically for plain-object payloads,
// and a hard-coded JSON default silently converts FormData uploads
// (profile photos, service images, ID documents) into JSON — the file
// gets stripped and the server never receives it.
const axiosInstance = axios.create({
    withCredentials: true,
});

// User Registration API
export const register = async (userData) => {
    try {
        const response = await axiosInstance.post(
            `${API_URL}/users/register`,
            userData
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// User Login API
export const login = async (userData) => {
    try {
        const response = await axiosInstance.post(
            `${API_URL}/users/login`,
            userData
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Get User Details API
export const getUserDetails = async () => {
    try {
        const response = await axiosInstance.get(`${API_URL}/users/user`);
        const data = response.data;
        return data;
    } catch (error) {
        console.error("Error fetching user details:", error);
        throw error.response?.data || error.message;
    }
};

// User Logout API
export const logout = async () => {
    try {
        await axiosInstance.post(`${API_URL}/users/logout`);
    } catch (error) {
        console.error("Logout failed:", error);
        throw error.response?.data || error.message;
    }
};

// Forgot Password API – request a password reset token/link
export const forgotPassword = async (emailOrPhone) => {
    try {
        const response = await axiosInstance.post(
            `${API_URL}/auth/forgot-password`,
            { emailOrPhone }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Reset Password API – set a new password using a valid reset token
export const resetPassword = async (token, password) => {
    try {
        const response = await axiosInstance.post(
            `${API_URL}/auth/reset-password/${token}`,
            { password }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Get Services List API
export const getServices = async () => {
    try {
        const response = await axiosInstance.get(`${API_URL}/services`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Get Service Details API
export const getServiceDetails = async (serviceName) => {
    try {
        const response = await axiosInstance.get(
            `${API_URL}/services/${encodeURIComponent(serviceName)}/details`
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Approve the auto-assigned technician (customer confirms) -> CONFIRMED
export const approveBooking = async (bookingId) => {
    try {
        const response = await axiosInstance.put(
            `${API_URL}/bookings/${bookingId}/approve`
        );
        return response.data;
    } catch (error) {
        console.error("Error approving booking:", error);
        throw error.response?.data || error.message;
    }
};

// Request a different technician -> reassign to the next closest.
// For multi-technician jobs, pass the slotIndex of the technician to swap.
export const reassignBooking = async (bookingId, slotIndex = null) => {
    try {
        const response = await axiosInstance.put(
            `${API_URL}/bookings/${bookingId}/reassign`,
            slotIndex != null ? { slotIndex } : {}
        );
        return response.data;
    } catch (error) {
        console.error("Error reassigning technician:", error);
        throw error.response?.data || error.message;
    }
};


//Admin API
export const getDashboardStats = async (timeRange = "all") => {
    try {
        const response = await axiosInstance.get(
            `${API_URL}/admin/dashboard/stats`,
            {
                params: { timeRange },
            }
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        throw error.response?.data || error.message;
    }
};

export const createService = async (formData) => {
    try {
        const response = await axiosInstance.post(
            `${API_URL}/admin/services/`,
            formData
        );
        return response.data;
    } catch (error) {
        console.error("Error creating service:", error);
        throw error.response?.data || error.message;
    }
};

// Update an existing service
export const updateService = async (id, formData) => {
    try {
        const response = await axiosInstance.put(
            `${API_URL}/admin/services/${id}`,
            formData
        );
        return response.data;
    } catch (error) {
        console.error("Error updating service:", error);
        throw error.response?.data || error.message;
    }
};

// Delete a service
export const deleteService = async (id) => {
    try {
        const response = await axiosInstance.delete(
            `${API_URL}/admin/services/${id}`
        );
        return response.data;
    } catch (error) {
        console.error("Error deleting service:", error);
        throw error.response?.data || error.message;
    }
};

// Get service details by service ID
export const getServiceDetailsById = async (serviceId) => {
    try {
        const response = await axiosInstance.get(
            `${API_URL}/admin/servicedetails/${serviceId}`
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching service details:", error);
        throw error.response?.data || error.message;
    }
};

// Subcategory operations
export const createSubcategory = async (serviceId, formData) => {
    try {
        const response = await axiosInstance.post(
            `${API_URL}/admin/servicedetails/${serviceId}/subcategories`,
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" },
            }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const updateSubcategory = async (serviceId, subcategoryName, formData) => {
    try {
        const response = await axiosInstance.put(
            `${API_URL}/admin/servicedetails/${serviceId}/subcategories/${subcategoryName}`,
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" },
            }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const deleteSubcategory = async (serviceId, subcategoryName) => {
    try {
        const response = await axiosInstance.delete(
            `${API_URL}/admin/servicedetails/${serviceId}/subcategories/${subcategoryName}`
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Service Type operations
export const createServiceType = async (serviceId, subcategoryName, formData) => {
    try {
        const response = await axiosInstance.post(
            `${API_URL}/admin/servicedetails/${serviceId}/subcategories/${subcategoryName}/types`,
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" },
            }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Add similar functions for updating and deleting service types

// Category operations
export const createCategory = async (serviceId, subcategoryName, typeName, formData) => {
    try {
        const response = await axiosInstance.post(
            `${API_URL}/admin/servicedetails/${serviceId}/subcategories/${subcategoryName}/types/${typeName}/categories`,
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" },
            }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Add similar functions for updating and deleting categories

// Service Type operations (completing the missing functions)
export const updateServiceType = async (serviceId, subcategoryName, typeKey, formData) => {
    try {
        const response = await axiosInstance.put(
            `${API_URL}/admin/servicedetails/${serviceId}/subcategories/${subcategoryName}/types/${typeKey}`,
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" },
            }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const deleteServiceType = async (serviceId, subcategoryName, typeKey) => {
    try {
        const response = await axiosInstance.delete(
            `${API_URL}/admin/servicedetails/${serviceId}/subcategories/${subcategoryName}/types/${typeKey}`
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Category operations (completing the missing functions)
export const updateCategory = async (serviceId, subcategoryName, typeName, categoryId, formData) => {
    try {
        const response = await axiosInstance.put(
            `${API_URL}/admin/servicedetails/${serviceId}/subcategories/${subcategoryName}/types/${typeName}/categories/${categoryId}`,
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" },
            }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const deleteCategory = async (serviceId, subcategoryName, typeName, categoryId) => {
    try {
        const response = await axiosInstance.delete(
            `${API_URL}/admin/servicedetails/${serviceId}/subcategories/${subcategoryName}/types/${typeName}/categories/${categoryId}`
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Direct category operations (subcategory WITHOUT a service type)
export const createCategoryDirect = async (serviceId, subcategoryName, formData) => {
    try {
        const response = await axiosInstance.post(
            `${API_URL}/admin/servicedetails/${serviceId}/subcategories/${subcategoryName}/categories`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const updateCategoryDirect = async (serviceId, subcategoryName, categoryId, formData) => {
    try {
        const response = await axiosInstance.put(
            `${API_URL}/admin/servicedetails/${serviceId}/subcategories/${subcategoryName}/categories/${categoryId}`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const deleteCategoryDirect = async (serviceId, subcategoryName, categoryId) => {
    try {
        const response = await axiosInstance.delete(
            `${API_URL}/admin/servicedetails/${serviceId}/subcategories/${subcategoryName}/categories/${categoryId}`
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Service Detail operations
export const createServiceDetail = async (serviceId, formData) => {
    try {
        const response = await axiosInstance.post(
            `${API_URL}/admin/services/${serviceId}/details`,
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" },
            }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const updateServiceDetail = async (serviceId, detailId, formData) => {
    try {
        const response = await axiosInstance.put(
            `${API_URL}/admin/services/${serviceId}/details/${detailId}`,
            formData,
            {
                headers: { "Content-Type": "multipart/form-data" },
            }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const deleteServiceDetail = async (serviceId, detailId) => {
    try {
        const response = await axiosInstance.delete(
            `${API_URL}/admin/services/${serviceId}/details/${detailId}`
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

// Get all bookings (admin only)
export const getAllBookings = async () => {
    try {
        const response = await axiosInstance.get(`${API_URL}/admin/bookings`);
        return response.data;
    } catch (error) {
        console.error("Error fetching all bookings:", error);
        throw error.response?.data || error.message;
    }
};

// Update booking status (admin only)
export const updateBookingStatus = async (bookingId, status) => {
    try {
        const response = await axiosInstance.put(
            `${API_URL}/admin/bookings/${bookingId}/status`,
            { status }
        );
        return response.data;
    } catch (error) {
        console.error("Error updating booking status:", error);
        throw error.response?.data || error.message;
    }
};

// Cancel a booking as a participant (customer or assigned technician). Uses the
// user-scoped bookings route so it is not limited to admins.
export const cancelBooking = async (bookingId) => {
    try {
        const response = await axiosInstance.put(
            `${API_URL}/bookings/${bookingId}/cancel`
        );
        return response.data;
    } catch (error) {
        console.error("Error cancelling booking:", error);
        throw error.response?.data || error.message;
    }
};

// Create a new booking
export const createBooking = async (bookingData) => {
    try {
        const response = await axiosInstance.post(
            `${API_URL}/bookings/create`,
            bookingData
        );
        return response.data;
    } catch (error) {
        console.error("Error creating booking:", error);
        throw error.response?.data || error.message;
    }
};

// Get all bookings for a user
export const getUserBookings = async (userId) => {
    try {
        const response = await axiosInstance.get(
            `${API_URL}/bookings/user/${userId}`
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching bookings:", error);
        throw error.response?.data || error.message;
    }
};

// Get all bookings assigned to a provider
export const getProviderBookings = async (providerId) => {
    try {
        const response = await axiosInstance.get(
            `${API_URL}/bookings/provider/${providerId}`
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching provider bookings:", error);
        throw error.response?.data || error.message;
    }
};

// Get all providers (admin only)
export const getProviders = async (bookingId = "") => {
    try {
        const url = bookingId 
            ? `${API_URL}/admin/bookings/providers?bookingId=${bookingId}`
            : `${API_URL}/admin/bookings/providers`;
        const response = await axiosInstance.get(url);
        return response.data;
    } catch (error) {
        console.error("Error fetching providers:", error);
        throw error.response?.data || error.message;
    }
};

// Assign a provider to a booking (admin only)
export const assignProvider = async (bookingId, providerId, slotIndex = null) => {
    try {
        const body = slotIndex == null ? { providerId } : { providerId, slotIndex };
        const response = await axiosInstance.put(
            `${API_URL}/admin/bookings/${bookingId}/assign`,
            body
        );
        return response.data;
    } catch (error) {
        console.error("Error assigning provider:", error);
        throw error.response?.data || error.message;
    }
};

// Confirm suggested provider assignment (admin only)
export const confirmProviderAssign = async (bookingId) => {
    try {
        const response = await axiosInstance.put(
            `${API_URL}/admin/bookings/${bookingId}/confirm-assign`
        );
        return response.data;
    } catch (error) {
        console.error("Error confirming provider assignment:", error);
        throw error.response?.data || error.message;
    }
};

// Get chat history for a booking
export const getChatMessages = async (bookingId) => {
    try {
        const response = await axiosInstance.get(`${API_URL}/chat/${bookingId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching chat messages:", error);
        throw error.response?.data || error.message;
    }
};

// Send a chat message. The sender is resolved on the server from the auth
// token, so we intentionally do not send a senderId from the client. The
// second argument is kept for backward compatibility with existing callers.
export const sendChatMessage = async (bookingId, _senderId, text) => {
    try {
        const response = await axiosInstance.post(`${API_URL}/chat/send`, {
            bookingId,
            text,
        });
        return response.data;
    } catch (error) {
        console.error("Error sending message:", error);
        throw error.response?.data || error.message;
    }
};

// ─────────────────────────────────────────────
//  Support tickets
// ─────────────────────────────────────────────

// Create a new support ticket (customer or technician).
export const createSupportTicket = async (payload) => {
    try {
        const response = await axiosInstance.post(`${API_URL}/support`, payload);
        return response.data;
    } catch (error) {
        console.error("Error creating support ticket:", error);
        throw error.response?.data || error.message;
    }
};

// List the current user's support tickets.
export const getMySupportTickets = async () => {
    try {
        const response = await axiosInstance.get(`${API_URL}/support/mine`);
        return response.data;
    } catch (error) {
        console.error("Error fetching support tickets:", error);
        throw error.response?.data || error.message;
    }
};

// Get a single support ticket with its messages.
export const getSupportTicket = async (id) => {
    try {
        const response = await axiosInstance.get(`${API_URL}/support/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching support ticket:", error);
        throw error.response?.data || error.message;
    }
};

// Add a reply to one of the current user's tickets.
export const sendSupportMessage = async (id, text) => {
    try {
        const response = await axiosInstance.post(
            `${API_URL}/support/${id}/messages`,
            { text }
        );
        return response.data;
    } catch (error) {
        console.error("Error sending support message:", error);
        throw error.response?.data || error.message;
    }
};

// ── Admin support endpoints ──

// List all tickets for the admin inbox (optionally filtered by status).
export const getAdminSupportTickets = async (status) => {
    try {
        const response = await axiosInstance.get(`${API_URL}/admin/support`, {
            params: status ? { status } : {},
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching admin support tickets:", error);
        throw error.response?.data || error.message;
    }
};

// Get a single ticket for the admin view.
export const getAdminSupportTicket = async (id) => {
    try {
        const response = await axiosInstance.get(`${API_URL}/admin/support/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching admin support ticket:", error);
        throw error.response?.data || error.message;
    }
};

// Admin reply to a ticket.
export const replyAdminSupportTicket = async (id, text) => {
    try {
        const response = await axiosInstance.post(
            `${API_URL}/admin/support/${id}/messages`,
            { text }
        );
        return response.data;
    } catch (error) {
        console.error("Error replying to support ticket:", error);
        throw error.response?.data || error.message;
    }
};

// Admin change of a ticket's status.
export const updateAdminSupportStatus = async (id, status) => {
    try {
        const response = await axiosInstance.put(
            `${API_URL}/admin/support/${id}/status`,
            { status }
        );
        return response.data;
    } catch (error) {
        console.error("Error updating support status:", error);
        throw error.response?.data || error.message;
    }
};

// ─────────────────────────────────────────────
//  Persistent cart (authenticated users)
// ─────────────────────────────────────────────

// Fetch the current user's saved cart
export const getUserCart = async () => {
    try {
        const response = await axiosInstance.get(`${API_URL}/users/cart`);
        return response.data;
    } catch (error) {
        console.error("Error fetching cart:", error);
        throw error.response?.data || error.message;
    }
};

// Replace the current user's saved cart
export const updateUserCart = async (cart) => {
    try {
        const response = await axiosInstance.put(`${API_URL}/users/cart`, {
            cart,
        });
        return response.data;
    } catch (error) {
        console.error("Error updating cart:", error);
        throw error.response?.data || error.message;
    }
};

// Clear the current user's saved cart
export const clearUserCart = async () => {
    try {
        const response = await axiosInstance.delete(`${API_URL}/users/cart`);
        return response.data;
    } catch (error) {
        console.error("Error clearing cart:", error);
        throw error.response?.data || error.message;
    }
};

// ─────────────────────────────────────────────
//  Provider (technician) self-service endpoints
// ─────────────────────────────────────────────

// Provider job counters for the dashboard header
export const getProviderStats = async (providerId) => {
    try {
        const response = await axiosInstance.get(
            `${API_URL}/bookings/provider/${providerId}/stats`
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching provider stats:", error);
        throw error.response?.data || error.message;
    }
};

// Provider accepts an assigned job. For multi-technician jobs, pass the
// provider's own id so only their slot is marked accepted.
export const providerAcceptBooking = async (bookingId, providerId = null) => {
    try {
        const response = await axiosInstance.put(
            `${API_URL}/bookings/${bookingId}/provider-accept`,
            providerId ? { providerId } : {}
        );
        return response.data;
    } catch (error) {
        console.error("Error accepting job:", error);
        throw error.response?.data || error.message;
    }
};

// Provider rejects an assigned job (reassigns to next closest). For
// multi-technician jobs, pass the provider's own id so only their slot moves.
export const providerRejectBooking = async (bookingId, providerId = null) => {
    try {
        const response = await axiosInstance.put(
            `${API_URL}/bookings/${bookingId}/provider-reject`,
            providerId ? { providerId } : {}
        );
        return response.data;
    } catch (error) {
        console.error("Error rejecting job:", error);
        throw error.response?.data || error.message;
    }
};

// A technician updates their own service profile (city/area/specialties/etc.)
export const updateProviderProfile = async (profile) => {
    try {
        const form = new FormData();
        if (profile.city !== undefined) form.append("city", profile.city ?? "");
        if (profile.area !== undefined) form.append("area", profile.area ?? "");
        if (profile.latitude !== undefined && profile.latitude !== null) form.append("latitude", profile.latitude);
        if (profile.longitude !== undefined && profile.longitude !== null) form.append("longitude", profile.longitude);
        if (Array.isArray(profile.specialties)) form.append("specialties", JSON.stringify(profile.specialties));
        if (profile.serviceRadiusKm !== undefined) form.append("serviceRadiusKm", profile.serviceRadiusKm);
        if (profile.isAvailable !== undefined) form.append("isAvailable", profile.isAvailable);
        if (profile.idDocument instanceof File) form.append("idDocument", profile.idDocument);
        const response = await axiosInstance.put(
            `${API_URL}/users/profile`,
            form
        );
        return response.data;
    } catch (error) {
        console.error("Error updating provider profile:", error);
        throw error.response?.data || error.message;
    }
};

// Provider marks a confirmed job as in progress
export const providerStartBooking = async (bookingId) => {
    try {
        const response = await axiosInstance.put(
            `${API_URL}/bookings/${bookingId}/provider-start`
        );
        return response.data;
    } catch (error) {
        console.error("Error starting job:", error);
        throw error.response?.data || error.message;
    }
};

// Technician marks the service as completed. Uses the user-scoped bookings
// status route, which also bumps the technician's completed-jobs counter and
// notifies the customer. Pass the human-readable bookingId (e.g. "BK-..."),
// not the Mongo _id, because the server matches on the bookingId field.
export const providerCompleteBooking = async (bookingId) => {
    try {
        const response = await axiosInstance.put(
            `${API_URL}/bookings/${bookingId}/request-completion`
        );
        return response.data;
    } catch (error) {
        console.error("Error completing service:", error);
        throw error.response?.data || error.message;
    }
};

// Customer confirms the technician really completed the service.
export const confirmServiceCompletion = async (bookingId) => {
    try {
        const response = await axiosInstance.put(
            `${API_URL}/bookings/${bookingId}/confirm-completion`
        );
        return response.data;
    } catch (error) {
        console.error("Error confirming completion:", error);
        throw error.response?.data || error.message;
    }
};

// Provider sets the final price (within the platform range) for a job
export const providerSetPrice = async (bookingId, price) => {
    try {
        const response = await axiosInstance.put(
            `${API_URL}/bookings/${bookingId}/provider-price`,
            { price }
        );
        return response.data;
    } catch (error) {
        console.error("Error setting job price:", error);
        throw error.response?.data || error.message;
    }
};

// ─────────────────────────────────────────────
//  Admin: user & provider management
// ─────────────────────────────────────────────

export const getAdminUsers = async (role = "", search = "") => {
    try {
        const response = await axiosInstance.get(`${API_URL}/admin/users`, {
            params: { role: role || undefined, search: search || undefined },
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching users:", error);
        throw error.response?.data || error.message;
    }
};

export const getAdminUserStats = async () => {
    try {
        const response = await axiosInstance.get(`${API_URL}/admin/users/stats`);
        return response.data;
    } catch (error) {
        console.error("Error fetching user stats:", error);
        throw error.response?.data || error.message;
    }
};

export const getAdminUser = async (userId) => {
    try {
        const response = await axiosInstance.get(
            `${API_URL}/admin/users/${userId}`
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching user:", error);
        throw error.response?.data || error.message;
    }
};

export const updateUserRole = async (userId, role) => {
    try {
        const response = await axiosInstance.put(
            `${API_URL}/admin/users/${userId}/role`,
            { role }
        );
        return response.data;
    } catch (error) {
        console.error("Error updating role:", error);
        throw error.response?.data || error.message;
    }
};

export const toggleUserAvailability = async (userId, isAvailable) => {
    try {
        const response = await axiosInstance.put(
            `${API_URL}/admin/users/${userId}/availability`,
            { isAvailable }
        );
        return response.data;
    } catch (error) {
        console.error("Error updating availability:", error);
        throw error.response?.data || error.message;
    }
};

export const toggleUserVerified = async (userId, isVerified, rejectionReason = "") => {
    try {
        const response = await axiosInstance.put(
            `${API_URL}/admin/users/${userId}/verified`,
            { isVerified, rejectionReason }
        );
        return response.data;
    } catch (error) {
        console.error("Error updating verification:", error);
        throw error.response?.data || error.message;
    }
};

export const deleteAdminUser = async (userId) => {
    try {
        const response = await axiosInstance.delete(
            `${API_URL}/admin/users/${userId}`
        );
        return response.data;
    } catch (error) {
        console.error("Error deleting user:", error);
        throw error.response?.data || error.message;
    }
};

export const updateAccount=async(payload)=>{const f=new FormData();f.append("first_name",payload.first_name);f.append("last_name",payload.last_name);if(payload.profilePhoto instanceof File)f.append("profilePhoto",payload.profilePhoto);try{return(await axiosInstance.put(`${API_URL}/account/profile`,f)).data}catch(e){throw e.response?.data||e.message}};
export const changePassword=async(currentPassword,newPassword)=>{try{return(await axiosInstance.put(`${API_URL}/account/password`,{currentPassword,newPassword})).data}catch(e){throw e.response?.data||e.message}};
export const createReview=async payload=>{try{return(await axiosInstance.post(`${API_URL}/reviews`,payload)).data}catch(e){throw e.response?.data||e.message}};

// ─── Notifications ───
export const getNotifications = async () => {
    try {
        const response = await axiosInstance.get(`${API_URL}/notifications`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getUnreadCount = async () => {
    try {
        const response = await axiosInstance.get(
            `${API_URL}/notifications/unread-count`
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const markNotificationRead = async (id) => {
    try {
        const response = await axiosInstance.put(
            `${API_URL}/notifications/${id}/read`
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const markAllNotificationsRead = async () => {
    try {
        const response = await axiosInstance.put(
            `${API_URL}/notifications/read-all`
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const getVapidKey = async () => {
    try {
        const response = await axiosInstance.get(
            `${API_URL}/notifications/vapid-public-key`
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const subscribePush = async (subscription) => {
    try {
        const response = await axiosInstance.post(
            `${API_URL}/notifications/subscribe`,
            { subscription }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};

export const unsubscribePush = async (endpoint) => {
    try {
        const response = await axiosInstance.post(
            `${API_URL}/notifications/unsubscribe`,
            { endpoint }
        );
        return response.data;
    } catch (error) {
        throw error.response?.data || error.message;
    }
};
