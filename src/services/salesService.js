import API_CONFIG from "../config/api.js";

// API URLs
const API_SALES_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SALES}`;
const API_SALE_ITEMS_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SALE_ITEMS}`;

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
 * Get list of sales with optional pagination
 * @param {Object} params - Pagination parameters
 * @param {string} params.ordering - Field to order by
 * @param {number} params.page - Page number
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal for request cancellation
 * @returns {Promise<Object>} - Paginated list of sales
 */
export const getSales = async (params = {}, authToken, signal) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        // Build URL with query parameters
        const url = new URL(API_SALES_URL, window.location.origin);

        if (params.ordering)
            url.searchParams.append("ordering", params.ordering);
        if (params.page) url.searchParams.append("page", params.page);

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
        console.error("Error fetching sales:", error);
        throw error;
    }
};

/**
 * Create a new sale
 * @param {Object} saleData - Sale data
 * @param {number} saleData.customer_id - Customer ID (optional)
 * @param {string} saleData.sale_type - Sale type (required)
 * @param {boolean} saleData.should_invoice - Whether sale should be invoiced
 * @param {Array} saleData.items - Array of sale items (required)
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal for request cancellation
 * @returns {Promise<Object>} - Created sale
 */
export const createSale = async (saleData, authToken, signal) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    console.log("createSale - saleData received:", saleData);

    if (!saleData.items || saleData.items.length === 0) {
        console.error("No items found in sale data:", saleData);
        throw new Error("Sale must have at least one item");
    }

    console.log("createSale - validation passed, items:", saleData.items);

    try {
        console.log("createSale - sending request to:", API_SALES_URL);

        const jsonBody = JSON.stringify(saleData);
        console.log("createSale - JSON body to send:", jsonBody);
        console.log(
            "createSale - JSON body parsed back:",
            JSON.parse(jsonBody)
        );

        const response = await fetch(API_SALES_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${authToken}`,
            },
            body: jsonBody,
            signal,
        });

        console.log("createSale - response status:", response.status);

        if (!response.ok) {
            let errorData;
            const responseText = await response.text();
            console.error("createSale - raw error response:", responseText);
            
            try {
                errorData = JSON.parse(responseText);
                console.error("createSale - error response JSON:", errorData);
            } catch (parseError) {
                console.error(
                    "createSale - error parsing response as JSON:",
                    parseError
                );
                errorData = { detail: responseText };
            }

            // Si es un 409 de ruptura de kits/cajas
            if (response.status === 409 && errorData) {
                const breakdownErr = new Error(errorData.message || 'Se requiere confirmación de ruptura');
                breakdownErr.status = 409;
                breakdownErr.breakdownRequired = true;
                breakdownErr.breakdownPlan = errorData.breakdown_plan || [];
                breakdownErr.raw = errorData;
                throw breakdownErr;
            }

            // Si hay errores de validación, mostrarlos de forma más clara
            if (errorData && typeof errorData === "object") {
                console.error(
                    "createSale - validation errors:",
                    JSON.stringify(errorData, null, 2)
                );

                // Manejar errores específicos de stock
                if (errorData.items && Array.isArray(errorData.items)) {
                    const stockErrors = [];
                    errorData.items.forEach((itemError, index) => {
                        if (
                            itemError.quantity &&
                            Array.isArray(itemError.quantity)
                        ) {
                            itemError.quantity.forEach((error) => {
                                if (
                                    error.includes("stock") ||
                                    error.includes("inventory") ||
                                    error.includes("disponible")
                                ) {
                                    stockErrors.push(
                                        `Producto ${index + 1}: ${error}`
                                    );
                                }
                            });
                        }
                    });

                    if (stockErrors.length > 0) {
                        throw new Error(
                            `Problemas de stock:\n${stockErrors.join("\n")}`
                        );
                    }
                } else if (errorData.items) {
                    // Si items existe pero no es un array, incluirlo en el error general
                    console.error(
                        "Error en items (no es array):",
                        errorData.items
                    );
                }
            }

            throw new Error(
                errorData.detail ||
                    JSON.stringify(errorData) ||
                    `Error ${response.status}: ${response.statusText}`
            );
        }

        const result = await response.json();
        console.log("createSale - success response:", result);
        return result;
    } catch (error) {
        console.error("Error creating sale:", error);
        throw error;
    }
};

/**
 * Get sale by ID
 * @param {number} saleId - Sale ID
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal for request cancellation
 * @returns {Promise<Object>} - Sale data
 */
export const getSaleById = async (saleId, authToken, signal) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const url = `${API_SALES_URL}${saleId}/`;
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
        console.error("Error fetching sale:", error);
        throw error;
    }
};

/**
 * Update an existing sale
 * @param {number} saleId - The ID of the sale to update
 * @param {Object} saleData - The data to update
 * @param {string} authToken - Authentication token
 * @returns {Promise<Object>} - The updated sale object
 */
export const updateSale = async (saleId, saleData, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const url = `${API_SALES_URL}${saleId}/`;
        const response = await fetch(url, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${authToken}`,
            },
            body: JSON.stringify(saleData),
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
        console.error(`Error updating sale ${saleId}:`, error);
        throw error;
    }
};

/**
 * Delete sale by ID
 * @param {number} saleId - Sale ID
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal for request cancellation
 * @returns {Promise<boolean>} - Success status
 */
export const deleteSale = async (saleId, authToken, signal) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const url = `${API_SALES_URL}${saleId}/`;
        const response = await fetch(url, {
            method: "DELETE",
            headers: {
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

        return true;
    } catch (error) {
        console.error("Error deleting sale:", error);
        throw error;
    }
};

/**
 * Get sales statistics
 * @param {Object} params - Statistics parameters
 * @param {number} params.days - Number of days to look back (default: 30)
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal for request cancellation
 * @returns {Promise<Object>} - Sales statistics
 */
export const getSalesStatistics = async (params = {}, authToken, signal) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const url = new URL(
            `${API_SALES_URL}statistics/`,
            window.location.origin
        );

        if (params.days) url.searchParams.append("days", params.days);

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

        return await response.json();
    } catch (error) {
        console.error("Error fetching sales statistics:", error);
        throw error;
    }
};

/**
 * Get today's sales
 * @param {Object} params - Pagination parameters
 * @param {string} params.ordering - Field to order by
 * @param {number} params.page - Page number
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal for request cancellation
 * @returns {Promise<Object>} - Today's sales
 */
export const getTodaySales = async (params = {}, authToken, signal) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const url = new URL(`${API_SALES_URL}today/`, window.location.origin);

        if (params.ordering)
            url.searchParams.append("ordering", params.ordering);
        if (params.page) url.searchParams.append("page", params.page);

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
        console.error("Error fetching today's sales:", error);
        throw error;
    }
};

/**
 * Get top selling products
 * @param {Object} params - Query parameters
 * @param {number} params.days - Number of days to look back (default: 30)
 * @param {number} params.limit - Number of products to return (default: 10)
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal for request cancellation
 * @returns {Promise<Object>} - Top selling products
 */
export const getTopProducts = async (params = {}, authToken, signal) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const url = new URL(
            `${API_SALE_ITEMS_URL}top_products/`,
            window.location.origin
        );

        if (params.days) url.searchParams.append("days", params.days);
        if (params.limit) url.searchParams.append("limit", params.limit);

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
        console.error("Error fetching top products:", error);
        throw error;
    }
};

/**
 * Update a specific sale item
 * @param {number} saleItemId - The ID of the sale item to update
 * @param {Object} itemData - The data to update (e.g., { quantity: 5 })
 * @param {string} authToken - Authentication token
 * @returns {Promise<Object>} - The updated sale item object
 */
export const updateSaleItem = async (saleItemId, itemData, authToken) => {
    if (!authToken) throw new Error("No authentication token provided");
    try {
        const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SALE_ITEMS}${saleItemId}/`;
        const response = await fetch(url, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${authToken}`,
            },
            body: JSON.stringify(itemData),
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
        console.error(`Error updating sale item ${saleItemId}:`, error);
        throw error;
    }
};

/**
 * Delete a specific sale item
 * @param {number} saleItemId - The ID of the sale item to delete
 * @param {string} authToken - Authentication token
 * @returns {Promise<void>}
 */
export const deleteSaleItem = async (saleItemId, authToken) => {
    if (!authToken) throw new Error("No authentication token provided");
    try {
        const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SALE_ITEMS}${saleItemId}/`;
        const response = await fetch(url, {
            method: "DELETE",
            headers: {
                Authorization: `Token ${authToken}`,
            },
        });
        if (response.status !== 204) {
            // 204 No Content on success
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.detail ||
                    `Error ${response.status}: ${response.statusText}`
            );
        }
    } catch (error) {
        console.error(`Error deleting sale item ${saleItemId}:`, error);
        throw error;
    }
};

// Export all functions as a service object
export const salesService = {
    getSales,
    createSale,
    updateSale,
    getSaleById,
    deleteSale,
    getSalesStatistics,
    getTodaySales,
    getTopProducts,
    updateSaleItem,
    deleteSaleItem,
};

// Default export
export default salesService;
