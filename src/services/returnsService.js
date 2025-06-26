import API_CONFIG from "../config/api.js";

// API URLs
const API_SALES_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SALES}`;
const API_RETURNS_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RETURNS}`;
const API_RETURN_ITEMS_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RETURN_ITEMS}`;
const API_RETURNS_STATISTICS_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RETURNS_STATISTICS}`;
const API_RETURNS_TODAY_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.RETURNS_TODAY}`;

/**
 * Convert absolute backend URLs to relative URLs for proxy in development
 * @param {string} url - Absolute or relative URL
 * @returns {string} - Relative URL that works with Vite proxy
 */
const convertToProxyUrl = (url) => {
    if (!url) return url;

    // If already a relative URL, return as is
    if (url.startsWith("/")) return url;

    // If it's an absolute URL from our backend, convert to relative
    const backendBaseUrl = "https://unidental-backend.onrender.com";
    if (url.startsWith(backendBaseUrl)) {
        // Remove the base URL, keep the path starting with /api
        return url.replace(backendBaseUrl, "");
    }

    // For any other absolute URL, return as is (shouldn't happen in our case)
    return url;
};

/**
 * Search sales by ID or customer name for returns
 * @param {Object} params - Search parameters
 * @param {string} params.search - Search term (sale ID or customer name)
 * @param {number} params.page - Page number
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal for request cancellation
 * @returns {Promise<Object>} - Paginated list of sales
 */
export const searchSalesForReturns = async (params = {}, authToken, signal) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        // Build URL with query parameters
        const url = new URL(API_SALES_URL, window.location.origin);

        if (params.search) url.searchParams.append("search", params.search);
        if (params.page) url.searchParams.append("page", params.page);
        if (params.ordering)
            url.searchParams.append(
                "ordering",
                params.ordering || "-created_at"
            );

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${authToken}`,
            },
            signal,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.detail ||
                    `Error ${response.status}: ${response.statusText}`
            );
        }

        const data = await response.json();

        // Convert URLs for pagination
        if (data.next) data.next = convertToProxyUrl(data.next);
        if (data.previous) data.previous = convertToProxyUrl(data.previous);

        return data;
    } catch (error) {
        console.error("Error searching sales for returns:", error);
        throw error;
    }
};

/**
 * Get sale details with items for return processing
 * @param {number} saleId - Sale ID
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal for request cancellation
 * @returns {Promise<Object>} - Sale data with items
 */
export const getSaleForReturn = async (saleId, authToken, signal) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        // Get sale details
        const saleUrl = `${API_SALES_URL}${saleId}/`;
        const saleResponse = await fetch(saleUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${authToken}`,
            },
            signal,
        });

        if (!saleResponse.ok) {
            const errorData = await saleResponse.json().catch(() => ({}));
            throw new Error(
                errorData.detail ||
                    `Error ${saleResponse.status}: ${saleResponse.statusText}`
            );
        }

        const saleData = await saleResponse.json();

        // Sale data should already include items based on API docs
        return saleData;
    } catch (error) {
        console.error("Error fetching sale for return:", error);
        throw error;
    }
};

/**
 * Create a return using the proper returns API endpoint
 * @param {Object} returnData - Return data
 * @param {number} returnData.original_sale_id - Original sale ID
 * @param {string} returnData.reason - Reason for return
 * @param {Array} returnData.items - Items to return with quantities
 * @param {string} returnData.notes - Additional notes
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal for request cancellation
 * @returns {Promise<Object>} - Created return
 */
export const createReturn = async (returnData, authToken, signal) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    if (!returnData.items || returnData.items.length === 0) {
        throw new Error("Return must have at least one item");
    }

    try {
        // Prepare return data for the API, ensuring correct data types
        const returnPayload = {
            original_sale: parseInt(returnData.original_sale, 10),
            location: parseInt(returnData.location, 10),
            reason: returnData.reason,
            notes: returnData.notes || "",
            items: returnData.items.map((item) => ({
                sale_item: parseInt(item.sale_item, 10),
                product: parseInt(item.product, 10),
                quantity_returned: parseInt(item.quantity_returned, 10),
                unit_price: String(item.unit_price), // Ensure unit_price is a string
            })),
        };

        console.log(
            "Sending return data to API:",
            JSON.stringify(returnPayload, null, 2)
        );

        const response = await fetch(API_RETURNS_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${authToken}`,
            },
            body: JSON.stringify(returnPayload),
            signal,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Return creation failed:", response.status);
            console.error(
                "Full error data:",
                JSON.stringify(errorData, null, 2)
            );

            // Provide more detailed error information for 400 errors
            if (response.status === 400) {
                const errorMessages = [];
                if (errorData.non_field_errors) {
                    errorMessages.push(...errorData.non_field_errors);
                }
                Object.keys(errorData).forEach((field) => {
                    if (field !== "non_field_errors") {
                        const errorValue = errorData[field];
                        if (Array.isArray(errorValue)) {
                            const itemErrors = errorValue.map(err => 
                                (typeof err === 'object' && err !== null) ? JSON.stringify(err) : err
                            ).join(", ");
                            errorMessages.push(`${field}: ${itemErrors}`);
                        } else if (typeof errorValue === "object" && errorValue !== null) {
                            errorMessages.push(
                                `${field}: ${JSON.stringify(errorValue)}`
                            );
                        } else {
                            errorMessages.push(`${field}: ${errorValue}`);
                        }
                    }
                });

                if (errorMessages.length > 0) {
                    throw new Error(
                        `Errores de validación: ${errorMessages.join(". ")}`
                    );
                }
            }

            throw new Error(
                errorData.detail ||
                    `Error ${response.status}: ${response.statusText}`
            );
        }

        const result = await response.json();
        console.log("Return created successfully:", result);

        return result;
    } catch (error) {
        console.error("Error creating return:", error);
        throw error;
    }
};

/**
 * Get return history/list
 * @param {Object} params - Query parameters
 * @param {number} params.page - Page number
 * @param {string} params.ordering - Ordering field
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal for request cancellation
 * @returns {Promise<Object>} - Return list
 */
export const getReturnHistory = async (params = {}, authToken, signal) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const url = new URL(API_RETURNS_URL, window.location.origin);

        // Append all params to the URL for filtering (e.g., original_sale)
        Object.keys(params).forEach((key) => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.append(key, params[key]);
            }
        });

        // Ensure ordering is set if not provided
        if (!params.ordering) {
            url.searchParams.append("ordering", "-return_date");
        }

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${authToken}`,
            },
            signal,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.detail ||
                    `Error ${response.status}: ${response.statusText}`
            );
        }

        const data = await response.json();

        // Convert URLs for pagination
        if (data.next) data.next = convertToProxyUrl(data.next);
        if (data.previous) data.previous = convertToProxyUrl(data.previous);

        return data;
    } catch (error) {
        console.error("Error fetching return history:", error);
        throw error;
    }
};

/**
 * Get return statistics
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal for request cancellation
 * @returns {Promise<Object>} - Return statistics
 */
export const getReturnStatistics = async (authToken, signal) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const response = await fetch(API_RETURNS_STATISTICS_URL, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${authToken}`,
            },
            signal,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.detail ||
                    `Error ${response.status}: ${response.statusText}`
            );
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching return statistics:", error);
        throw error;
    }
};

/**
 * Get today's returns
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal for request cancellation
 * @returns {Promise<Object>} - Today's returns
 */
export const getTodayReturns = async (authToken, signal) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const response = await fetch(API_RETURNS_TODAY_URL, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${authToken}`,
            },
            signal,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.detail ||
                    `Error ${response.status}: ${response.statusText}`
            );
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching today's returns:", error);
        throw error;
    }
};

/**
 * Update return status (approve, reject, etc.)
 * @param {number} returnId - Return ID
 * @param {Object} updateData - Data to update
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal for request cancellation
 * @returns {Promise<Object>} - Updated return
 */
export const updateReturn = async (returnId, updateData, authToken, signal) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const returnUrl = `${API_RETURNS_URL}${returnId}/`;

        const response = await fetch(returnUrl, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${authToken}`,
            },
            body: JSON.stringify(updateData),
            signal,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.detail ||
                    `Error ${response.status}: ${response.statusText}`
            );
        }

        return await response.json();
    } catch (error) {
        console.error("Error updating return:", error);
        throw error;
    }
};

/**
 * Get return details with all its items.
 * @param {number} returnId - The ID of the return to fetch.
 * @param {string} authToken - Authentication token.
 * @param {AbortSignal} signal - AbortController signal for request cancellation.
 * @returns {Promise<Object>} - The full return object with its items.
 */
export const getReturnDetails = async (returnId, authToken, signal) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }
    if (!returnId) {
        throw new Error("A return ID is required to fetch details.");
    }

    try {
        const url = `${API_RETURNS_URL}${returnId}/`; // Uses /sales/returns/{id}/
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${authToken}`,
            },
            signal,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.detail ||
                    `Error ${response.status}: ${response.statusText}`
            );
        }

        return await response.json();
    } catch (error) {
        console.error(`Error fetching details for return ${returnId}:`, error);
        throw error;
    }
};

// Export all functions as a service object
export const returnsService = {
    searchSalesForReturns,
    getSaleForReturn,
    createReturn,
    getReturnHistory,
    getReturnStatistics,
    getTodayReturns,
    updateReturn,
    getReturnDetails,
};

// Default export
export default returnsService;
