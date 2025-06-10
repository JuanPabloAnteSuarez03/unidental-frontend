import API_CONFIG from "../config/api.js";

// API URLs
const API_CUSTOMERS_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CUSTOMERS}`;

/**
 * Convert absolute backend URLs to relative URLs for proxy in development
 * @param {string} url - Absolute or relative URL
 * @returns {string} - Relative URL that works with Vite proxy
 */
const convertToProxyUrl = (url) => {
    if (!url) return url;
    
    // If already a relative URL, return as is
    if (url.startsWith('/')) return url;
    
    // If it's an absolute URL from our backend, convert to relative
    const backendBaseUrl = 'https://unidental-backend-production.up.railway.app';
    if (url.startsWith(backendBaseUrl)) {
        // Remove the base URL, keep the path starting with /api
        return url.replace(backendBaseUrl, '');
    }
    
    // For any other absolute URL, return as is (shouldn't happen in our case)
    return url;
};

/**
 * Get list of customers with optional search and pagination
 * @param {Object} params - Search and pagination parameters
 * @param {string} params.search - Search term for customer name
 * @param {string} params.ordering - Field to order by
 * @param {number} params.page - Page number
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal for request cancellation
 * @returns {Promise<Object>} - Paginated list of customers
 */
export const getCustomers = async (params = {}, authToken, signal) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        // Build URL with query parameters
        const url = new URL(API_CUSTOMERS_URL, window.location.origin);
        
        if (params.search) url.searchParams.append('search', params.search);
        if (params.ordering) url.searchParams.append('ordering', params.ordering);
        if (params.page) url.searchParams.append('page', params.page);

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Token ${authToken}`,
            },
            signal,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Convert URLs for pagination
        if (data.next) data.next = convertToProxyUrl(data.next);
        if (data.previous) data.previous = convertToProxyUrl(data.previous);
        
        return data;
    } catch (error) {
        console.error("Error fetching customers:", error);
        throw error;
    }
};

/**
 * Create a new customer
 * @param {Object} customerData - Customer data
 * @param {string} customerData.name - Customer name (required)
 * @param {string} customerData.phone - Customer phone (optional)
 * @param {string} customerData.email - Customer email (optional)
 * @param {string} customerData.notes - Customer notes (optional)
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal for request cancellation
 * @returns {Promise<Object>} - Created customer
 */
export const createCustomer = async (customerData, authToken, signal) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    if (!customerData.name || customerData.name.trim() === "") {
        throw new Error("Customer name is required");
    }

    try {
        const response = await fetch(API_CUSTOMERS_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Token ${authToken}`,
            },
            body: JSON.stringify(customerData),
            signal,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error creating customer:", error);
        throw error;
    }
};

/**
 * Get customer by ID
 * @param {number} customerId - Customer ID
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal for request cancellation
 * @returns {Promise<Object>} - Customer data
 */
export const getCustomerById = async (customerId, authToken, signal) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const url = `${API_CUSTOMERS_URL}${customerId}/`;
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Token ${authToken}`,
            },
            signal,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching customer:", error);
        throw error;
    }
};

/**
 * Update customer by ID
 * @param {number} customerId - Customer ID
 * @param {Object} customerData - Customer data to update
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal for request cancellation
 * @returns {Promise<Object>} - Updated customer
 */
export const updateCustomer = async (customerId, customerData, authToken, signal) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const url = `${API_CUSTOMERS_URL}${customerId}/`;
        const response = await fetch(url, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Token ${authToken}`,
            },
            body: JSON.stringify(customerData),
            signal,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error updating customer:", error);
        throw error;
    }
};

/**
 * Delete customer by ID
 * @param {number} customerId - Customer ID
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal for request cancellation
 * @returns {Promise<boolean>} - Success status
 */
export const deleteCustomer = async (customerId, authToken, signal) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const url = `${API_CUSTOMERS_URL}${customerId}/`;
        const response = await fetch(url, {
            method: "DELETE",
            headers: {
                "Authorization": `Token ${authToken}`,
            },
            signal,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
        }

        return true;
    } catch (error) {
        console.error("Error deleting customer:", error);
        throw error;
    }
};

/**
 * Get customer sales history
 * @param {number} customerId - Customer ID
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal for request cancellation
 * @returns {Promise<Array>} - Customer sales history
 */
export const getCustomerSalesHistory = async (customerId, authToken, signal) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const url = `${API_CUSTOMERS_URL}${customerId}/sales_history/`;
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Token ${authToken}`,
            },
            signal,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching customer sales history:", error);
        throw error;
    }
};

// Export all functions as a service object
export const customersService = {
    getCustomers,
    createCustomer,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
    getCustomerSalesHistory,
    searchCustomers: getCustomers, // Alias for search functionality
};

// Default export
export default customersService; 