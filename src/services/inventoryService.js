import API_CONFIG from "../config/api.js";

// API URLs
const API_PRODUCTS_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVENTORY}`;
const API_STOCK_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STOCK}`;
const API_STOCK_SUMMARY_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STOCK_SUMMARY}`;
const API_CATEGORIES_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CATEGORIES}`;
const API_INVENTORY_MOVEMENTS_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVENTORY_MOVEMENTS}`;
const API_LOCATIONS_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOCATIONS}`;

/**
 * Get products with optional filtering parameters
 * @param {Object} params - Filter parameters
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal for request cancellation
 * @returns {Promise<Object>} - Products data with pagination
 */
export const getProducts = async (params = {}, authToken, signal) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    // Build URL with params
    const url = buildUrlWithParams(API_PRODUCTS_URL, params);

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
            signal,
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        if (error.name === "AbortError") {
            console.log("Request was aborted");
            return null;
        }
        console.error("Error fetching products:", error);
        throw error;
    }
};

/**
 * Get stock data for products
 * @param {Array} productIds - Optional array of product IDs to filter
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal for request cancellation
 * @returns {Promise<Object>} - Map of product IDs to stock quantities
 */
export const getStockData = async (productIds = [], authToken, signal) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    // Object to store accumulated stock by product
    const stockMap = {};

    try {
        // Build initial URL, filtering by product IDs if provided
        let url = API_STOCK_URL;
        if (productIds.length > 0) {
            const params = new URLSearchParams();
            params.append("product__in", productIds.join(","));
            url = `${url}?${params.toString()}`;
        }

        // Get first page of results
        let stockData = await fetchStockPage(url, authToken, signal);

        if (!stockData) return {};

        // Process first page of results
        processStockData(stockData.results, stockMap);

        // Get additional pages if they exist
        while (stockData.next && !signal?.aborted) {
            stockData = await fetchStockPage(stockData.next, authToken, signal);
            if (!stockData) break;
            processStockData(stockData.results, stockMap);
        }

        return stockMap;
    } catch (error) {
        if (error.name === "AbortError") {
            console.log("Stock request was aborted");
            return {};
        }
        console.error("Error fetching stock data:", error);
        throw error;
    }
};

/**
 * Get filtered stock data with minimum quantity filter
 * @param {Object} params - Filter parameters including min_quantity
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal for request cancellation
 * @returns {Promise<Object>} - Stock data with pagination
 */
export const getFilteredStock = async (params = {}, authToken, signal) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    // Build URL with params
    const url = buildUrlWithParams(API_STOCK_URL, params);

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
            signal,
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        if (error.name === "AbortError") {
            console.log("Request was aborted");
            return null;
        }
        console.error("Error fetching filtered stock:", error);
        throw error;
    }
};

/**
 * Get all available categories
 * @param {string} authToken - Authentication token
 * @returns {Promise<Array>} - List of categories
 */
export const getCategories = async (authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const response = await fetch(API_CATEGORIES_URL, {
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data.results || data || [];
    } catch (error) {
        console.error("Error fetching categories:", error);
        throw error;
    }
};

/**
 * Get all available locations/sedes
 * @param {string} authToken - Authentication token
 * @returns {Promise<Array>} - List of locations
 */
export const getLocations = async (authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        console.log("Haciendo petición a:", API_LOCATIONS_URL);
        const response = await fetch(API_LOCATIONS_URL, {
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
        });

        console.log(
            "Respuesta del servidor:",
            response.status,
            response.statusText
        );

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Datos de ubicaciones:", data);
        return data.results || data || [];
    } catch (error) {
        console.error("Error fetching locations:", error);
        throw error;
    }
};

/**
 * Get stock summary data
 * @param {string} authToken - Authentication token
 * @returns {Promise<Object>} - Stock summary data
 */
export const getStockSummary = async (authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const response = await fetch(API_STOCK_SUMMARY_URL, {
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
        console.error("Error fetching stock summary:", error);
        throw error;
    }
};

/**
 * Get inventory movements with optional filtering parameters
 * @param {Object} params - Filter parameters (date_from, date_to, product, etc.)
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal for request cancellation
 * @returns {Promise<Object>} - Inventory movements data with pagination
 */
export const getInventoryMovements = async (params = {}, authToken, signal) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    // Build URL with params
    const url = buildUrlWithParams(API_INVENTORY_MOVEMENTS_URL, params);

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
            signal,
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        if (error.name === "AbortError") {
            console.log("Inventory movements request was aborted");
            return null;
        }
        console.error("Error fetching inventory movements:", error);
        throw error;
    }
};

/**
 * Get stock map for all products
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal for request cancellation
 * @returns {Promise<Object>} - Map of product IDs to stock quantities
 */
export const getStockMap = async (authToken, signal) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    // Object to store accumulated stock by product
    const stockMap = {};

    try {
        // Build initial URL without filtering
        let url = API_STOCK_URL;

        // Get first page of results
        let stockData = await fetchStockPage(url, authToken, signal);

        if (!stockData) return {};

        // Process first page of results
        processStockData(stockData.results, stockMap);

        // Get additional pages if they exist
        while (stockData.next && !signal?.aborted) {
            stockData = await fetchStockPage(stockData.next, authToken, signal);
            if (!stockData) break;
            processStockData(stockData.results, stockMap);
        }

        return stockMap;
    } catch (error) {
        if (error.name === "AbortError") {
            console.log("Stock request was aborted");
            return {};
        }
        console.error("Error fetching stock data:", error);
        throw error;
    }
};

// Helper functions

/**
 * Build URL with parameters
 * @param {string} baseUrl - Base API URL
 * @param {Object} params - URL parameters
 * @returns {string} - Complete URL with parameters
 */
const buildUrlWithParams = (baseUrl, params = {}) => {
    const urlParams = new URLSearchParams();

    // Añadir logs para depuración
    console.log("Construyendo URL con parámetros:", JSON.stringify(params));

    // Add all parameters to URL
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            // Verificar si es un array para categorías
            if (Array.isArray(value)) {
                console.log(
                    `Añadiendo múltiples valores para el parámetro: ${key}=${value.join(
                        ","
                    )}`
                );
                // Para categorías, crear un parámetro separado para cada valor (operación OR)
                value.forEach((val) => {
                    urlParams.append(key, val);
                });
            } else {
                urlParams.append(key, value);
                console.log(`Añadiendo parámetro: ${key}=${value}`);
            }
        }
    });

    const queryString = urlParams.toString();
    const finalUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;

    console.log("URL final construida:", finalUrl);

    return finalUrl;
};

/**
 * Process stock data and update the stock map
 * @param {Array} results - Stock data results
 * @param {Object} stockMap - Map to update with stock data
 */
const processStockData = (results, stockMap) => {
    if (Array.isArray(results)) {
        results.forEach((item) => {
            if (item.product) {
                // Convert quantity to a number, handle null, undefined, or string values
                const quantity =
                    typeof item.quantity === "number"
                        ? item.quantity
                        : parseInt(item.quantity, 10) || 0;

                // If an entry already exists for this product, add the quantity
                if (stockMap[item.product] !== undefined) {
                    stockMap[item.product] += quantity;
                    console.log(
                        `Added ${quantity} to product ${
                            item.product
                        }, new total: ${stockMap[item.product]}`
                    );
                } else {
                    // If this is the first time we see this product, initialize with its quantity
                    stockMap[item.product] = quantity;
                    console.log(
                        `Initialized product ${item.product} with quantity: ${quantity}`
                    );
                }
            } else {
                console.warn("Stock item missing product ID:", item);
            }
        });
    } else {
        console.warn("Stock results is not an array:", results);
    }
};

/**
 * Fetch a page of stock data
 * @param {string} url - URL to fetch
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal
 * @returns {Promise<Object>} - Page of stock data
 */
const fetchStockPage = async (url, authToken, signal) => {
    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
            signal,
        });

        if (signal?.aborted) return null;

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        if (error.name === "AbortError") return null;
        throw error;
    }
};

// Export as default
const inventoryService = {
    getProducts,
    getStockData,
    getFilteredStock,
    getCategories,
    getLocations,
    getStockSummary,
    getInventoryMovements,
    getStockMap,
};

export default inventoryService;
