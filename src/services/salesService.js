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
 * Get list of sales with optional pagination and search
 * Note: API doesn't support date filtering - use getSalesInDateRange for that
 * @param {Object} params - Pagination and filter parameters
 * @param {string} params.ordering - Field to order by
 * @param {number} params.page - Page number
 * @param {string} params.search - Search term
 * @param {number} params.page_size - Number of items per page
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

        // Only add supported parameters (API doesn't support date filtering)
        if (params.ordering)
            url.searchParams.append("ordering", params.ordering);
        if (params.page) url.searchParams.append("page", params.page);
        if (params.search) url.searchParams.append("search", params.search);
        if (params.page_size)
            url.searchParams.append("page_size", params.page_size);

        console.log(`🔗 Fetching sales: ${url.toString()}`);

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
                // ❌ REMOVIDO: Lógica de confirm_breakdown
                // En el nuevo sistema esto no debería pasar ya que no hay productos compuestos
                const breakdownErr = new Error(
                    errorData.message || "Error del servidor"
                );
                breakdownErr.status = 409;
                breakdownErr.raw = errorData;
                throw breakdownErr;
            }

            // ✅ NUEVO: Manejar errores 400 con sugerencias de conversión
            if (
                response.status === 400 &&
                errorData &&
                errorData.error &&
                errorData.error.suggestions
            ) {
                const conversionErr = new Error(
                    errorData.error.message ||
                        "Stock insuficiente con sugerencias de conversión"
                );
                conversionErr.status = 400;
                conversionErr.raw = errorData;
                throw conversionErr;
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
 * Get sales statistics for last N days (new optimized version)
 * @param {number} days - Number of days to look back (default: 30)
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal for request cancellation
 * @returns {Promise<Object>} - Sales statistics for the period
 */
export const getSalesStatisticsByDays = async (
    days = 30,
    authToken,
    signal
) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const url = new URL(
            `${API_SALES_URL}statistics/`,
            window.location.origin
        );
        url.searchParams.append("days", days);

        console.log(
            `🔗 Fetching sales statistics for last ${days} days: ${url.toString()}`
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
        console.log(`✅ Sales statistics loaded for ${days} days:`, data);
        return data;
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
 * Get sales by location for last N days
 * @param {number} days - Number of days to look back (default: 30)
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal for request cancellation
 * @returns {Promise<Array>} - Sales by location for the period
 */
export const getSalesByLocation = async (days = 30, authToken, signal) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const url = new URL(
            `${API_SALES_URL}by_location/`,
            window.location.origin
        );
        url.searchParams.append("days", days);

        console.log(
            `🔗 Fetching sales by location for last ${days} days: ${url.toString()}`
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
        console.log(`✅ Sales by location loaded for ${days} days:`, data);
        return data;
    } catch (error) {
        console.error("Error fetching sales by location:", error);
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
 * Get top selling products for last N days (new optimized version)
 * @param {number} days - Number of days to look back (default: 30)
 * @param {number} limit - Maximum number of products to return (default: 10)
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal for request cancellation
 * @returns {Promise<Array>} - Top selling products for the period
 */
export const getTopProductsByDays = async (
    days = 30,
    limit = 10,
    authToken,
    signal
) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const url = new URL(
            `${API_SALE_ITEMS_URL}top_products/`,
            window.location.origin
        );
        url.searchParams.append("days", days);
        url.searchParams.append("limit", limit);

        console.log(
            `🔗 Fetching top ${limit} products for last ${days} days: ${url.toString()}`
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
        console.log(`✅ Top products loaded for ${days} days:`, data);
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

/**
 * Obtener todas las cuentas de crédito
 * @param {string} authToken - Token de autenticación
 * @param {string} search - Término de búsqueda para filtrar por cliente (opcional)
 * @returns {Promise<Object>} - Lista de cuentas de crédito
 */
export const getCreditAccounts = async (authToken, search = "") => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    let url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CREDITS_ACCOUNTS}`;

    // Agregar parámetro de búsqueda si se proporciona
    if (search) {
        url += `?search=${encodeURIComponent(search)}`;
    }

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching credit accounts:", error);
        throw error;
    }
};

/**
 * Crear una cuenta de crédito (crédito por cobrar)
 * @param {Object} creditData - Datos del crédito
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Crédito creado
 */
export const createCreditAccount = async (creditData, authToken) => {
    if (!authToken) throw new Error("No authentication token provided");

    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CREDITS_ACCOUNTS}`;
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${authToken}`,
            },
            body: JSON.stringify(creditData),
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
        console.error("Error creating credit account:", error);
        throw error;
    }
};

/**
 * Crear un crédito a partir de una venta
 * @param {Object} creditData - Datos del crédito (sale, original_amount)
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Crédito creado
 */
export const createCreditFromSale = async (creditData, authToken) => {
    if (!authToken) throw new Error("No authentication token provided");
    const url = `${API_CONFIG.BASE_URL}/credits/accounts/create_credit/`;
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${authToken}`,
            },
            body: JSON.stringify(creditData),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.detail ||
                    JSON.stringify(errorData) ||
                    `Error ${response.status}: ${response.statusText}`
            );
        }
        return await response.json();
    } catch (error) {
        console.error("Error creating credit from sale:", error);
        throw error;
    }
};

/**
 * Obtener resumen de deuda por cliente
 * @param {string} authToken - Token de autenticación
 * @param {string} [search] - Nombre o término de búsqueda de cliente (opcional)
 * @returns {Promise<Object>} - Resumen de deuda por cliente
 */
export const getDebtSummary = async (authToken, search = "") => {
    if (!authToken) throw new Error("No authentication token provided");
    // Construir la URL correctamente según entorno
    let url = `${API_CONFIG.BASE_URL}/credits/accounts/debt_summary/`;
    if (search) {
        url += `?search=${encodeURIComponent(search)}`;
    }
    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
        });
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching debt summary:", error);
        throw error;
    }
};

/**
 * Get sales for a specific date range using backend filtering
 * Now the API supports date filtering natively
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal for request cancellation
 * @returns {Promise<Array>} - Array of sales in the date range
 */
export const getSalesInDateRange = async (
    startDate,
    endDate,
    authToken,
    signal
) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        console.log(
            `🔄 Fetching sales from ${startDate} to ${endDate} using backend filtering`
        );

        // Build URL with date filters
        const url = new URL(API_SALES_URL, window.location.origin);

        // Add date range filters
        if (startDate) {
            url.searchParams.append("sale_date_from", startDate);
        }
        if (endDate) {
            url.searchParams.append("sale_date_to", endDate);
        }

        // Add pagination parameters
        url.searchParams.append("page_size", "100");
        url.searchParams.append("ordering", "-sale_date");

        console.log(`🔗 API URL with date filters: ${url.toString()}`);

        // Fetch sales with date filtering
        const allSales = [];
        let nextUrl = url;
        let pageCount = 0;
        const maxPages = 50;

        while (nextUrl && pageCount < maxPages) {
            pageCount++;
            console.log(`📄 Loading page ${pageCount} of filtered sales...`);

            const response = await fetch(nextUrl.toString(), {
                headers: {
                    Authorization: `Token ${authToken}`,
                    "Content-Type": "application/json",
                },
                signal,
            });

            if (!response.ok) {
                throw new Error(
                    `Error ${response.status}: ${response.statusText}`
                );
            }

            const data = await response.json();
            const sales = data.results || [];

            allSales.push(...sales);
            console.log(`✅ Page ${pageCount}: ${sales.length} sales loaded`);

            // Check for next page
            nextUrl = data.next
                ? new URL(convertToProxyUrl(data.next), window.location.origin)
                : null;

            if (!nextUrl) {
                console.log(
                    `🏁 All pages loaded. Total sales: ${allSales.length}`
                );
                break;
            }

            if (signal?.aborted) break;
        }

        if (pageCount >= maxPages) {
            console.warn(`⚠️ Reached maximum ${maxPages} pages limit`);
        }

        console.log(
            `✅ Backend filtered sales: ${allSales.length} sales for date range`
        );
        return allSales;
    } catch (error) {
        if (error.name === "AbortError") {
            console.log("Sales request was aborted");
            return [];
        }
        console.error("Error fetching sales in date range:", error);
        throw error;
    }
};

/**
 * Obtener todas las ventas sin paginación para reportes
 * @param {Object} params - Parámetros de filtro
 * @param {string} authToken - Token de autenticación
 * @param {AbortSignal} signal - AbortController signal
 * @returns {Promise<Array>} - Lista completa de ventas
 */
export const getAllSales = async (params = {}, authToken, signal) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const hasDateFilters = params.sale_date_from || params.sale_date_to;
        if (!hasDateFilters) {
            // Si no hay filtros de fecha, usar el endpoint /today
            console.log("🔄 Cargando ventas SOLO de hoy usando /today ...");
            const todayData = await getTodaySales({}, authToken, signal);
            // getTodaySales devuelve un objeto paginado { results: [], count: 0, next: null, previous: null }
            // Extraer solo el array de resultados
            if (
                todayData &&
                todayData.results &&
                Array.isArray(todayData.results)
            ) {
                console.log(
                    `✅ Ventas de hoy cargadas: ${todayData.results.length} ventas`
                );
                return todayData.results;
            } else if (Array.isArray(todayData)) {
                console.log(
                    `✅ Ventas de hoy cargadas: ${todayData.length} ventas`
                );
                return todayData;
            } else {
                console.log("✅ No hay ventas de hoy");
                return [];
            }
        }

        const filterInfo = hasDateFilters
            ? `con filtros de fecha (${
                  params.sale_date_from || "sin límite"
              } - ${params.sale_date_to || "sin límite"})`
            : "TODAS";

        console.log(`🔄 Cargando ventas ${filterInfo}...`);
        const allSales = [];
        let nextUrl = new URL(API_SALES_URL, window.location.origin);

        // Agregar parámetros de consulta (ahora incluye filtros de fecha)
        const supportedParams = [
            "search",
            "ordering",
            "page",
            "page_size",
            "sale_date_from",
            "sale_date_to",
            "date_range",
            "total_min",
            "total_max",
            "customer_name",
            "location_name",
            "sale_type",
            "should_invoice",
        ];

        Object.keys(params).forEach((key) => {
            if (
                supportedParams.includes(key) &&
                params[key] !== null &&
                params[key] !== undefined &&
                params[key] !== ""
            ) {
                nextUrl.searchParams.append(key, params[key]);
            }
        });

        // Agregar page_size para optimizar
        nextUrl.searchParams.append("page_size", "100");

        let pageCount = 0;
        const maxPages = 50; // Límite de seguridad

        while (nextUrl && pageCount < maxPages) {
            pageCount++;
            console.log(`📄 Cargando página ${pageCount} de ventas...`);

            const response = await fetch(nextUrl.toString(), {
                headers: {
                    Authorization: `Token ${authToken}`,
                    "Content-Type": "application/json",
                },
                signal,
            });

            if (!response.ok) {
                throw new Error(
                    `Error ${response.status}: ${response.statusText}`
                );
            }

            const data = await response.json();
            const sales = data.results || [];

            // Agregar ventas de esta página
            allSales.push(...sales);
            console.log(
                `✅ Página ${pageCount}: ${sales.length} ventas cargadas`
            );

            // Verificar si hay más páginas
            nextUrl = data.next
                ? new URL(convertToProxyUrl(data.next), window.location.origin)
                : null;

            // Si no hay más páginas, terminar
            if (!nextUrl) {
                console.log(
                    `🏁 No hay más páginas. Total de ventas cargadas ${filterInfo}: ${allSales.length}`
                );
                break;
            }

            if (signal?.aborted) break;
        }

        // Advertencia si llegamos al límite
        if (pageCount >= maxPages) {
            console.warn(
                `⚠️ Se alcanzó el límite de ${maxPages} páginas. Es posible que no se hayan cargado todas las ventas.`
            );
        }

        return allSales;
    } catch (error) {
        if (error.name === "AbortError") {
            console.log("All sales request was aborted");
            return [];
        }
        console.error("Error fetching all sales:", error);
        throw error;
    }
};

/**
 * Get sales using predefined date ranges from backend
 * @param {string} dateRange - Predefined date range (today, yesterday, this_week, last_week, this_month, last_month, last_7_days, last_30_days, last_90_days)
 * @param {Object} additionalParams - Additional filter parameters
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal for request cancellation
 * @returns {Promise<Array>} - Array of sales for the date range
 */
export const getSalesByDateRange = async (
    dateRange,
    additionalParams = {},
    authToken,
    signal
) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    if (!dateRange) {
        throw new Error("Date range parameter is required");
    }

    try {
        console.log(`🔄 Fetching sales for date range: ${dateRange}`);

        // Build URL with date range filter
        const url = new URL(API_SALES_URL, window.location.origin);
        url.searchParams.append("date_range", dateRange);

        // Add additional parameters
        Object.keys(additionalParams).forEach((key) => {
            if (
                additionalParams[key] !== null &&
                additionalParams[key] !== undefined &&
                additionalParams[key] !== ""
            ) {
                url.searchParams.append(key, additionalParams[key]);
            }
        });

        // Add pagination parameters
        url.searchParams.append("page_size", "100");
        url.searchParams.append("ordering", "-sale_date");

        console.log(`🔗 API URL with date range: ${url.toString()}`);

        // Fetch sales with date range filtering
        const allSales = [];
        let nextUrl = url;
        let pageCount = 0;
        const maxPages = 50;

        while (nextUrl && pageCount < maxPages) {
            pageCount++;
            console.log(
                `📄 Loading page ${pageCount} of ${dateRange} sales...`
            );

            const response = await fetch(nextUrl.toString(), {
                headers: {
                    Authorization: `Token ${authToken}`,
                    "Content-Type": "application/json",
                },
                signal,
            });

            if (!response.ok) {
                throw new Error(
                    `Error ${response.status}: ${response.statusText}`
                );
            }

            const data = await response.json();
            const sales = data.results || [];

            allSales.push(...sales);
            console.log(`✅ Page ${pageCount}: ${sales.length} sales loaded`);

            // Check for next page
            nextUrl = data.next
                ? new URL(convertToProxyUrl(data.next), window.location.origin)
                : null;

            if (!nextUrl) {
                console.log(
                    `🏁 All pages loaded. Total sales for ${dateRange}: ${allSales.length}`
                );
                break;
            }

            if (signal?.aborted) break;
        }

        if (pageCount >= maxPages) {
            console.warn(`⚠️ Reached maximum ${maxPages} pages limit`);
        }

        console.log(
            `✅ Backend filtered sales for ${dateRange}: ${allSales.length} sales`
        );
        return allSales;
    } catch (error) {
        if (error.name === "AbortError") {
            console.log("Sales request was aborted");
            return [];
        }
        console.error("Error fetching sales by date range:", error);
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
    getSalesStatisticsByDays,
    getTodaySales,
    getSalesByLocation,
    getTopProducts,
    getTopProductsByDays,
    updateSaleItem,
    deleteSaleItem,
    getCreditAccounts,
    createCreditAccount,
    createCreditFromSale,
    getDebtSummary,
    getAllSales,
    getSalesInDateRange,
    getSalesByDateRange,
};

// Default export
export default salesService;
