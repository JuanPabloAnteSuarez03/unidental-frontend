import API_CONFIG from "../config/api.js";

// API URLs
const API_PRODUCTS_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVENTORY}`;
const API_PRODUCTS_ALL_URL = `${API_CONFIG.BASE_URL}/catalogs/products/all/`;
const API_STOCK_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STOCK}`;
const API_STOCK_ALL_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STOCK_ALL}`;
const API_STOCK_SUMMARY_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STOCK_SUMMARY}`;
const API_CATEGORIES_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CATEGORIES}`;
const API_INVENTORY_MOVEMENTS_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVENTORY_MOVEMENTS}`;
const API_LOCATIONS_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOCATIONS}`;
// API_PURCHASE_ITEMS_URL removido - ahora usamos API_CONFIG.ENDPOINTS.PURCHASE_OPTIONS para obtener precios desde opciones de compra
const API_SKU_GENERATE_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SKU_GENERATE}`;
const API_SKU_VALIDATE_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SKU_VALIDATE}`;
const API_SKU_SYSTEM_INFO_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SKU_SYSTEM_INFO}`;

/**
 * Convert absolute backend URLs to relative URLs for proxy in development
 * @param {string} url - Absolute or relative URL
 * @returns {string} - Relative URL that works with Vite proxy
 */
const convertToProxyUrl = (url) => {
    if (!url) return url;

    // If already a relative URL, return as is
    if (url.startsWith("/")) return url;

    // If it's an absolute URL from our backend, return as is (no conversion needed)
    const backendBaseUrl = "https://unidental-backend.onrender.com";
    if (url.startsWith(backendBaseUrl)) {
        // Return the absolute URL as is since we're now pointing directly to the backend
        return url;
    }

    // For any other absolute URL, return as is (shouldn't happen in our case)
    return url;
};

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
 * ✨ OPTIMIZADO: Get stock data for products with better batch handling
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
        // ✨ OPTIMIZACIÓN: Usar múltiples filtros por lotes para mejorar rendimiento
        if (productIds.length > 0) {
            // Para listas específicas de productos, usar filtrado por lotes
            const BATCH_SIZE = 50; // Procesar en lotes de 50 productos
            const batches = [];

            for (let i = 0; i < productIds.length; i += BATCH_SIZE) {
                const batch = productIds.slice(i, i + BATCH_SIZE);
                batches.push(batch);
            }

            console.log(`Processing ${batches.length} batches of stock data`);

            // Procesar lotes en paralelo (máximo 3 a la vez para no sobrecargar)
            const MAX_CONCURRENT = 3;
            for (let i = 0; i < batches.length; i += MAX_CONCURRENT) {
                const currentBatches = batches.slice(i, i + MAX_CONCURRENT);

                const batchPromises = currentBatches.map(async (batch) => {
                    const params = new URLSearchParams();
                    params.append("product__in", batch.join(","));
                    const url = `${API_STOCK_URL}?${params.toString()}`;

                    return await fetchAllStockPages(url, authToken, signal);
                });

                const results = await Promise.all(batchPromises);

                // Combinar resultados de todos los lotes
                results.forEach((batchStockMap) => {
                    Object.assign(stockMap, batchStockMap);
                });

                if (signal?.aborted) break;
            }
        } else {
            // Para obtener todo el stock, usar la función original pero optimizada
            const allStock = await fetchAllStockPages(
                API_STOCK_URL,
                authToken,
                signal
            );
            Object.assign(stockMap, allStock);
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
 * ✨ OPTIMIZADA: Fetch all stock pages with PARALLELIZATION
 * @param {string} url - Base URL for stock API
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal
 * @returns {Promise<Object>} - Complete stock map
 */
const fetchAllStockPages = async (url, authToken, signal) => {
    const stockMap = {};

    // ✨ OPTIMIZACIÓN 1: Obtener primera página para conocer el total
    console.log("🚀 Starting optimized stock loading...");
    const startTime = performance.now();

    const firstPage = await fetchStockPage(url, authToken, signal);
    if (!firstPage || signal?.aborted) return stockMap;

    // Procesar primera página
    processStockData(firstPage.results, stockMap);

    // ✨ OPTIMIZACIÓN 2: Si hay más páginas, cargar en paralelo
    if (firstPage.next) {
        const totalCount = firstPage.count || 0;
        const pageSize = firstPage.results?.length || 25;
        const totalPages = Math.ceil(totalCount / pageSize);

        console.log(
            `📊 Loading ${totalPages} pages in parallel (${totalCount} items)`
        );

        // Crear URLs para todas las páginas restantes
        const pageUrls = [];
        for (let page = 2; page <= totalPages; page++) {
            const pageUrl = url.includes("?")
                ? `${url}&page=${page}`
                : `${url}?page=${page}`;
            pageUrls.push(pageUrl);
        }

        // ✨ OPTIMIZACIÓN 3: Cargar páginas en paralelo (batches de 10)
        const PARALLEL_BATCH_SIZE = 10;
        for (let i = 0; i < pageUrls.length; i += PARALLEL_BATCH_SIZE) {
            if (signal?.aborted) break;

            const batch = pageUrls.slice(i, i + PARALLEL_BATCH_SIZE);
            const batchPromises = batch.map((pageUrl) =>
                fetchStockPage(pageUrl, authToken, signal)
            );

            try {
                const batchResults = await Promise.all(batchPromises);

                // Procesar resultados del batch
                batchResults.forEach((pageData) => {
                    if (pageData?.results) {
                        processStockData(pageData.results, stockMap);
                    }
                });

                console.log(
                    `✅ Processed batch ${
                        Math.floor(i / PARALLEL_BATCH_SIZE) + 1
                    }/${Math.ceil(pageUrls.length / PARALLEL_BATCH_SIZE)}`
                );
            } catch (error) {
                console.warn("⚠️ Error in batch, continuing...", error);
            }
        }
    }

    const endTime = performance.now();
    console.log(
        `🏁 Stock loading completed in ${Math.round(endTime - startTime)}ms`
    );

    return stockMap;
};

/**
 * ✨ SUPER-OPTIMIZADA: Get ALL stock data with multiple acceleration strategies
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal for request cancellation
 * @returns {Promise<Object>} - Complete map of product IDs to stock quantities
 */
export const getAllStock = async (authToken, signal) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    console.log("🚀 Loading complete stock data with optimizations...");
    const overallStart = performance.now();

    try {
        // ✨ ESTRATEGIA 1: Intentar con page_size grande primero
        const optimizedUrl = `${API_STOCK_URL}?page_size=1000`; // Intentar páginas más grandes

        try {
            const completeStockMap = await fetchAllStockPages(
                optimizedUrl,
                authToken,
                signal
            );

            const overallEnd = performance.now();
            console.log(
                `🎉 ULTRA-FAST stock loading completed! ${
                    Object.keys(completeStockMap).length
                } products in ${Math.round(overallEnd - overallStart)}ms`
            );

            return completeStockMap;
        } catch (error) {
            console.warn(
                "⚠️ Large page size failed, falling back to standard method"
            );

            // ✨ ESTRATEGIA 2: Fallback a método estándar optimizado
            const completeStockMap = await getStockData([], authToken, signal);

            const overallEnd = performance.now();
            console.log(
                `✅ Standard stock loading completed: ${
                    Object.keys(completeStockMap).length
                } products in ${Math.round(overallEnd - overallStart)}ms`
            );

            return completeStockMap;
        }
    } catch (error) {
        console.error("🚨 Error loading complete stock:", error);
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
        const response = await fetch(API_LOCATIONS_URL, {
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const status = response.status;
            if (status === 401 || status === 403) {
                throw new Error(
                    "No tiene permisos para acceder a las ubicaciones"
                );
            } else if (status === 404) {
                throw new Error(
                    "El recurso de ubicaciones no fue encontrado en el servidor"
                );
            } else if (status >= 500) {
                throw new Error("Error del servidor al obtener ubicaciones");
            } else {
                throw new Error(
                    `Error ${response.status}: ${response.statusText}`
                );
            }
        }

        const data = await response.json();
        return data.results || data || [];
    } catch (error) {
        console.error("Error fetching locations:", error);

        // Mejora manejo de errores de red
        if (
            error.name === "TypeError" &&
            error.message.includes("Failed to fetch")
        ) {
            throw new Error(
                "Error de conexión: No se pudo conectar al servidor. Verifique su conexión a internet."
            );
        }

        throw error;
    }
};

/**
 * Get stock data by location for a specific product
 * Consulta la tabla InventoryStock para obtener stock por ubicación
 * @param {number} productId - Product ID to get stock for
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal for request cancellation
 * @returns {Promise<Object>} - Map of location IDs to stock quantities for the product
 */
/**
 * NUEVA VERSIÓN RÁPIDA: Get stock for a specific product using the optimized /all/ endpoint
 * @param {number} productId - Product ID
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal for request cancellation
 * @returns {Promise<Object>} - Map of location IDs to stock quantities
 */
export const getStockByLocationFast = async (productId, authToken, signal) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        // Iniciar timer para medir performance
        const timerLabel = `getStockByLocationFast-${productId}`;
        console.time(timerLabel);

        // Usar el filtro optimizado ?product=ID que ahora está disponible
        const params = new URLSearchParams();
        params.append("product", productId); // ⭐ NUEVO filtro que funciona correctamente

        const url = `${API_STOCK_ALL_URL}?${params.toString()}`;

        console.log("⚡ Fast stock search for product:", productId);
        console.log("URL:", url);

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

        const data = await response.json();

        console.log("Raw stock data from fast endpoint:", data);
        console.log("Data type:", typeof data);
        console.log("Is array:", Array.isArray(data));
        console.log("Has results:", data && data.results);
        console.log("Data keys:", data ? Object.keys(data) : "No data");
        console.log(
            "Results length:",
            data && data.results ? data.results.length : "No results"
        );

        // Construir mapa de ubicaciones
        const locationStockMap = {};

        // Si es un array directo, usarlo; si no, usar data.results
        const stockData = Array.isArray(data) ? data : data.results;
        console.log("Stock data to process:", stockData);
        console.log("Stock data length:", stockData ? stockData.length : 0);

        if (Array.isArray(stockData)) {
            console.log("Processing stock entries...");
            stockData.forEach((stockEntry, index) => {
                console.log(`Processing entry ${index}:`, stockEntry);
                console.log(
                    `Entry ${index} - location:`,
                    stockEntry.location,
                    "quantity:",
                    stockEntry.quantity
                );
                if (
                    stockEntry.location !== undefined &&
                    stockEntry.quantity !== undefined
                ) {
                    const locationId = stockEntry.location;
                    const quantity =
                        typeof stockEntry.quantity === "number"
                            ? stockEntry.quantity
                            : parseInt(stockEntry.quantity, 10) || 0;

                    // Incluir tanto stock positivo como cero para mostrar información completa
                    locationStockMap[locationId] = quantity;
                    console.log(
                        `⚡ Found stock for product ${productId}: Location ${locationId} = ${quantity} units`
                    );
                }
            });
        }

        // Finalizar timer y mostrar resultados
        console.timeEnd(timerLabel);
        console.log(`✅ FAST stock search completed for product ${productId}:`);
        console.log(
            `   📦 Stock entries found: ${Object.keys(locationStockMap).length}`
        );
        console.log(
            `   🏪 Locations with stock: ${
                Object.keys(locationStockMap).filter(
                    (loc) => locationStockMap[loc] > 0
                ).length
            }`
        );
        console.log(
            "Final location stock map for product",
            productId,
            ":",
            locationStockMap
        );

        return locationStockMap;
    } catch (error) {
        // Finalizar timer incluso en caso de error
        const timerLabel = `getStockByLocationFast-${productId}`;
        console.timeEnd(timerLabel);

        if (error.name === "AbortError") {
            console.log("Fast stock request was aborted");
            return {};
        }
        console.error("Error fetching fast stock by location:", error);
        throw error;
    }
};

/**
 * VERSIÓN ANTERIOR (FALLBACK): Get stock for a specific product by location using pagination
 * @param {number} productId - Product ID
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal for request cancellation
 * @returns {Promise<Object>} - Map of location IDs to stock quantities
 */
export const getStockByLocation = async (productId, authToken, signal) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        // Iniciar timer para medir performance
        const timerLabel = `getStockByLocation-${productId}`;
        console.time(timerLabel);

        // Nota: El backend NO soporta filtro por producto, así que tenemos que buscar en todos los registros
        // Para optimizar, usamos page_size para reducir tráfico de red
        const params = new URLSearchParams();
        params.append("page_size", "100"); // Obtener más registros por página para ser más eficiente

        const url = `${API_STOCK_URL}?${params.toString()}`;

        console.log("Fetching stock by location for product:", productId);
        console.log("URL:", url);

        const locationStockMap = {};
        let foundEntries = false;
        let currentUrl = url;
        let pageCount = 0;
        const maxPages = 50; // Límite de seguridad más alto para evitar bucles infinitos

        // Buscar a través de TODAS las páginas hasta encontrar todo el stock del producto
        while (currentUrl && pageCount < maxPages && !signal?.aborted) {
            pageCount++;
            console.log(`Searching page ${pageCount} for product ${productId}`);

            const response = await fetch(currentUrl, {
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

            // Buscar el producto en esta página
            const results = data.results || data;
            if (Array.isArray(results)) {
                for (const stockEntry of results) {
                    // Solo procesar entradas para el producto que buscamos
                    if (stockEntry.product == productId) {
                        foundEntries = true;

                        if (
                            stockEntry.location !== undefined &&
                            stockEntry.quantity !== undefined
                        ) {
                            const locationId = stockEntry.location;
                            const quantity =
                                typeof stockEntry.quantity === "number"
                                    ? stockEntry.quantity
                                    : parseInt(stockEntry.quantity, 10) || 0;

                            // Incluir tanto stock positivo como cero para mostrar información completa
                            locationStockMap[locationId] = quantity;
                            console.log(
                                `Found stock for product ${productId}: Location ${locationId} = ${quantity} units`
                            );
                        }
                    }
                }
            }

            // Continuar a la siguiente página si existe
            currentUrl = data.next ? convertToProxyUrl(data.next) : null;

            // Si llegamos al final de las páginas disponibles, terminamos
            if (!currentUrl) {
                console.log(
                    `Finished searching all pages for product ${productId}. Found entries: ${foundEntries}`
                );
                break;
            }
        }

        // Advertencia si llegamos al límite de páginas sin terminar
        if (pageCount >= maxPages) {
            console.warn(
                `Reached maximum page limit (${maxPages}) while searching for product ${productId}. Some stock data might be missing.`
            );
        }

        // Finalizar timer y mostrar resultados
        console.timeEnd(timerLabel);
        console.log(`✅ Stock search completed for product ${productId}:`);
        console.log(`   📄 Pages searched: ${pageCount}`);
        console.log(
            `   📦 Stock entries found: ${
                foundEntries ? Object.keys(locationStockMap).length : 0
            }`
        );
        console.log(
            `   🏪 Locations with stock: ${
                Object.keys(locationStockMap).filter(
                    (loc) => locationStockMap[loc] > 0
                ).length
            }`
        );
        console.log(
            "Final location stock map for product",
            productId,
            ":",
            locationStockMap
        );

        return locationStockMap;
    } catch (error) {
        // Finalizar timer incluso en caso de error
        const timerLabel = `getStockByLocation-${productId}`;
        console.timeEnd(timerLabel);

        if (error.name === "AbortError") {
            console.log("Stock by location request was aborted");
            return {};
        }
        console.error("Error fetching stock by location:", error);
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
            const status = response.status;

            // Mejorar mensajes de error según el código
            if (status === 401 || status === 403) {
                throw new Error(
                    "No tiene permisos para acceder a los movimientos de inventario"
                );
            } else if (status === 404) {
                throw new Error(
                    "El recurso de movimientos no fue encontrado en el servidor"
                );
            } else if (status >= 500) {
                throw new Error(
                    "Error del servidor al obtener movimientos de inventario"
                );
            } else {
                throw new Error(
                    `Error ${response.status}: ${response.statusText}`
                );
            }
        }

        const data = await response.json();

        // Asegurar que la estructura de respuesta sea consistente
        return {
            results: data.results || [],
            count: data.count || 0,
            next: data.next || null,
            previous: data.previous || null,
        };
    } catch (error) {
        if (error.name === "AbortError") {
            console.log("Inventory movements request was aborted");
            return null;
        }

        // Mejorar manejo de errores de red
        if (
            error.name === "TypeError" &&
            error.message.includes("Failed to fetch")
        ) {
            throw new Error(
                "Error de conexión: No se pudo conectar al servidor. Verifique su conexión a internet."
            );
        }

        console.error("Error fetching inventory movements:", error);
        throw error;
    }
};

/**
 * Create a new inventory movement
 * @param {Object} movementData - Movement data to create
 * @param {string} authToken - Authentication token
 * @returns {Promise<Object>} - Created movement data
 */
export const createInventoryMovement = async (movementData, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    console.log("🚀 createInventoryMovement called with:");
    console.log("📍 URL:", API_INVENTORY_MOVEMENTS_URL);
    console.log("📋 Movement Data:", JSON.stringify(movementData, null, 2));
    console.log("🔑 Auth Token present:", !!authToken);

    try {
        const response = await fetch(API_INVENTORY_MOVEMENTS_URL, {
            method: "POST",
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(movementData),
        });

        console.log("📡 Response status:", response.status);
        console.log("📡 Response ok:", response.ok);

        if (!response.ok) {
            // Try to get error details from response
            let errorMessage = `Error ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.json();
                if (errorData.detail) {
                    errorMessage = errorData.detail;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (typeof errorData === "object") {
                    // Handle field-specific errors
                    const fieldErrors = Object.entries(errorData)
                        .map(
                            ([field, errors]) =>
                                `${field}: ${
                                    Array.isArray(errors)
                                        ? errors.join(", ")
                                        : errors
                                }`
                        )
                        .join("; ");
                    if (fieldErrors) {
                        errorMessage = fieldErrors;
                    }
                }
            } catch (e) {
                // If we can't parse the error response, use the default message
                console.warn("No se pudo parsear el mensaje de error", e);
            }
            throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log("✅ Movement created successfully:", result);
        return result;
    } catch (error) {
        console.error("❌ Error creating inventory movement:", error);

        // Mejorar manejo de errores de red
        if (
            error.name === "TypeError" &&
            error.message.includes("Failed to fetch")
        ) {
            throw new Error(
                "Error de conexión: No se pudo conectar al servidor. Verifique su conexión a internet."
            );
        }

        throw error;
    }
};

/**
 * Update movement status
 * @param {number} movementId - Movement ID to update
 * @param {string} newStatus - New status (pending, completed, cancelled)
 * @param {string} authToken - Authentication token
 * @returns {Promise<Object>} - Updated movement data
 */
export const updateMovementStatus = async (
    movementId,
    newStatus,
    authToken
) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    console.log("🚀 updateMovementStatus called with:");
    console.log("📍 Movement ID:", movementId);
    console.log("📊 New Status:", newStatus);
    console.log("🔑 Auth Token present:", !!authToken);

    try {
        const response = await fetch(
            `${API_INVENTORY_MOVEMENTS_URL}${movementId}/`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Token ${authToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status: newStatus }),
            }
        );

        console.log("📡 Response status:", response.status);
        console.log("📡 Response ok:", response.ok);

        if (!response.ok) {
            // Try to get error details from response
            let errorMessage = `Error ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.json();
                if (errorData.detail) {
                    errorMessage = errorData.detail;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (typeof errorData === "object") {
                    // Handle field-specific errors
                    const fieldErrors = Object.entries(errorData)
                        .map(
                            ([field, errors]) =>
                                `${field}: ${
                                    Array.isArray(errors)
                                        ? errors.join(", ")
                                        : errors
                                }`
                        )
                        .join("; ");
                    if (fieldErrors) {
                        errorMessage = fieldErrors;
                    }
                }
            } catch (e) {
                console.warn("No se pudo parsear el mensaje de error", e);
            }
            throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log("✅ Movement status updated successfully:", result);
        return result;
    } catch (error) {
        console.error("❌ Error updating movement status:", error);

        // Mejorar manejo de errores de red
        if (
            error.name === "TypeError" &&
            error.message.includes("Failed to fetch")
        ) {
            throw new Error(
                "Error de conexión: No se pudo conectar al servidor. Verifique su conexión a internet."
            );
        }

        throw error;
    }
};

/**
 * ✨ OPTIMIZADO: Get comprehensive stock map with better error handling
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal
 * @returns {Promise<Object>} - Complete stock map
 */
export const getStockMap = async (authToken, signal) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        console.log("Fetching comprehensive stock map");

        // ✨ OPTIMIZACIÓN: Usar la nueva función optimizada
        const stockMap = await fetchAllStockPages(
            API_STOCK_URL,
            authToken,
            signal
        );

        if (signal?.aborted) {
            console.log("Stock map request was aborted");
            return {};
        }

        console.log(
            `Stock map created with ${Object.keys(stockMap).length} products`
        );

        return stockMap;
    } catch (error) {
        if (error.name === "AbortError") {
            console.log("Stock map request was aborted");
            return {};
        }
        console.error("Error creating stock map:", error);
        throw error;
    }
};

/**
 * Generate next SKU
 * @param {string} authToken - Authentication token
 * @param {Object} generateData - Data for SKU generation with IDs (category_id, subcategory_id, type_id)
 * @returns {Promise<Object>} - Generated SKU data
 */
export const generateNextSku = async (authToken, generateData = {}) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        // Validar que se proporcionen los IDs requeridos
        if (
            !generateData.category_id ||
            !generateData.subcategory_id ||
            !generateData.type_id
        ) {
            throw new Error(
                "Se requieren category_id, subcategory_id y type_id para generar el SKU"
            );
        }

        const requestBody = {
            category_id: parseInt(generateData.category_id),
            subcategory_id: parseInt(generateData.subcategory_id),
            type_id: parseInt(generateData.type_id),
        };

        console.log("🔍 Generating SKU with payload:", requestBody);

        const response = await fetch(API_SKU_GENERATE_URL, {
            method: "POST",
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            let errorMessage = `Error ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.json();
                if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (errorData.detail) {
                    errorMessage = errorData.detail;
                }
            } catch (parseError) {
                // Keep the original error message if we can't parse the response
            }
            throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log("🟢 SKU generation result:", result);

        // Adaptar la respuesta al formato esperado por el frontend
        return {
            next_sku: result.sku_sugerido || result.next_sku,
            categoria_nombre: result.categoria_nombre,
            subcategoria_nombre: result.subcategoria_nombre,
            tipo_nombre: result.tipo_nombre,
            ...result,
        };
    } catch (error) {
        console.error("Error generating SKU:", error);
        throw error;
    }
};

/**
 * Validate SKU
 * @param {string} sku - SKU to validate
 * @param {string} authToken - Authentication token
 * @returns {Promise<Object>} - Validation result
 */
export const validateSku = async (sku, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const response = await fetch(API_SKU_VALIDATE_URL, {
            method: "POST",
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ sku }),
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error validating SKU:", error);
        throw error;
    }
};

/**
 * Get SKU system information
 * @param {string} authToken - Authentication token
 * @returns {Promise<Object>} - SKU system information
 */
export const getSkuSystemInfo = async (authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const response = await fetch(API_SKU_SYSTEM_INFO_URL, {
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
        console.error("Error fetching SKU system info:", error);
        throw error;
    }
};

/**
 * Create a new product
 * @param {Object} productData - Product data to create
 * @param {string} authToken - Authentication token
 * @returns {Promise<Object>} - Created product data
 */
export const createProduct = async (productData, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    // 🔍 DEBUG: Agregar logs para verificar los datos que se envían al backend
    console.log("🔍 DEBUG - Datos recibidos en createProduct:", productData);
    console.log(
        "🔍 DEBUG - Campo requires_batch_control en createProduct:",
        productData.requires_batch_control
    );
    console.log(
        "🔍 DEBUG - Tipo de requires_batch_control en createProduct:",
        typeof productData.requires_batch_control
    );
    console.log(
        "🔍 DEBUG - JSON que se enviará al backend:",
        JSON.stringify(productData, null, 2)
    );

    try {
        const response = await fetch(API_PRODUCTS_URL, {
            method: "POST",
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(productData),
        });

        // 🔍 DEBUG: Agregar logs para verificar la respuesta del backend
        console.log("🔍 DEBUG - Status de la respuesta:", response.status);
        console.log(
            "🔍 DEBUG - Headers de la respuesta:",
            Object.fromEntries(response.headers.entries())
        );

        if (!response.ok) {
            // Try to get error details from response
            let errorMessage = `Error ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.json();
                console.log("🔍 DEBUG - Error data del backend:", errorData);
                if (errorData.detail) {
                    errorMessage = errorData.detail;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (typeof errorData === "object") {
                    // Handle field-specific errors
                    const fieldErrors = Object.entries(errorData)
                        .map(
                            ([field, errors]) =>
                                `${field}: ${
                                    Array.isArray(errors)
                                        ? errors.join(", ")
                                        : errors
                                }`
                        )
                        .join("; ");
                    if (fieldErrors) {
                        errorMessage = fieldErrors;
                    }
                }
            } catch (e) {
                // If we can't parse the error response, use the default message
                console.log(
                    "🔍 DEBUG - No se pudo parsear el error del backend"
                );
            }
            throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log("🔍 DEBUG - Respuesta exitosa del backend:", result);
        return result;
    } catch (error) {
        console.error("Error creating product:", error);
        throw error;
    }
};

/**
 * Get all products without pagination (for search and filters)
 * @param {Object} params - Optional filter parameters (name, sku, barcode, category, category_name)
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal for request cancellation
 * @returns {Promise<Array>} - Array of all products
 */
export const getAllProducts = async (params = {}, authToken, signal) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    // Build URL with params
    const url = buildUrlWithParams(API_PRODUCTS_ALL_URL, params);

    try {
        console.log("Requesting all products from:", url);

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

        const data = await response.json();
        console.log("Raw response from getAllProducts:", data);
        console.log("Type of response:", typeof data);
        console.log("Is array:", Array.isArray(data));

        // Ensure we always return an array
        if (Array.isArray(data)) {
            console.log("Returning array with", data.length, "products");
            return data;
        } else if (data && Array.isArray(data.results)) {
            console.log(
                "Returning results array with",
                data.results.length,
                "products"
            );
            return data.results;
        } else {
            console.log("No valid array found, returning empty array");
            return [];
        }
    } catch (error) {
        if (error.name === "AbortError") {
            console.log("Request was aborted");
            return [];
        }
        console.error("Error fetching all products:", error);
        throw error;
    }
};

/**
 * Get price information for products (last sale and purchase prices)
 * @param {Array} productIds - Array of product IDs
 * @param {string} authToken - Authentication token
 * @param {AbortSignal} signal - AbortController signal for request cancellation
 * @returns {Promise<Object>} - Map of product IDs to price information
 */
export const getProductPrices = async (productIds = [], authToken, signal) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const pricesMap = {};

        // Para cada producto, obtener sus precios históricos
        for (const productId of productIds) {
            try {
                const priceInfo = await getIntelligentPrice(
                    productId,
                    authToken
                );
                pricesMap[productId] = priceInfo;
            } catch (error) {
                console.error(
                    `Error obteniendo precios para producto ${productId}:`,
                    error
                );
                pricesMap[productId] = {
                    price: 0,
                    source: "none",
                    source_label: "Error al obtener precio",
                };
            }
        }

        return pricesMap;
    } catch (error) {
        if (error.name === "AbortError") {
            console.log("Prices request was aborted");
            return {};
        }
        console.error("Error fetching product prices:", error);
        return {};
    }
};

/**
 * Get suggested sale price for a product from catalog
 * @param {number} productId - Product ID
 * @param {string} authToken - Authentication token
 * @returns {Promise<Object>} - Price information
 */
const getProductSuggestedPrice = async (productId, authToken) => {
    try {
        const response = await fetch(
            `${API_CONFIG.BASE_URL}/catalogs/products/${productId}/`,
            {
                headers: {
                    Authorization: `Token ${authToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            return { price: 0, source: "none" };
        }

        const product = await response.json();
        const suggestedPrice = parseFloat(product.suggested_sale_price) || 0;

        if (suggestedPrice > 0) {
            return {
                price: suggestedPrice,
                source: "suggested",
                source_label: "Precio de venta sugerido",
            };
        }

        return { price: 0, source: "none" };
    } catch (error) {
        console.error("Error fetching suggested price:", error);
        return { price: 0, source: "none" };
    }
};

/**
 * Get intelligent price for a specific product
 * @param {number} productId - Product ID
 * @param {string} authToken - Authentication token
 * @returns {Promise<Object>} - Price information with source
 */
export const getIntelligentPrice = async (productId, authToken) => {
    if (!authToken || !productId) {
        return {
            price: 0,
            source: "none",
            source_label: "Sin precio disponible",
        };
    }

    try {
        // 1. NUEVO: Intentar obtener precio de venta sugerido (PRIORIDAD 1)
        const suggestedPrice = await getProductSuggestedPrice(productId, authToken);
        if (suggestedPrice.price > 0) {
            return {
                price: suggestedPrice.price,
                source: "suggested",
                source_label: "Precio de venta sugerido",
            };
        }

        // 2. Intentar obtener último precio de venta (PRIORIDAD 2)
        const lastSalePrice = await getLastSalePrice(productId, authToken);
        if (lastSalePrice.price > 0) {
            return {
                price: lastSalePrice.price,
                source: "sale",
                source_label: "Último precio de venta",
            };
        }

        // 3. Intentar obtener último precio de compra (PRIORIDAD 3)
        const lastPurchasePrice = await getLastPurchasePrice(
            productId,
            authToken
        );
        if (lastPurchasePrice > 0) {
            return {
                price: lastPurchasePrice,
                source: "purchase",
                source_label: "Último precio de compra",
            };
        }

        // 4. Usar precios del producto (fallback)
        return await getProductIntelligentPriceFallback(productId, authToken);
    } catch (error) {
        console.error("Error fetching intelligent price:", error);
        return await getProductIntelligentPriceFallback(productId, authToken);
    }
};

/**
 * Get last sale price for a product
 * @param {number} productId - Product ID
 * @param {string} authToken - Authentication token
 * @returns {Promise<Object>} - Price information
 */
const getLastSalePrice = async (productId, authToken) => {
    try {
        const salesUrl = `${API_CONFIG.BASE_URL}/sales/sale-items/?product=${productId}&ordering=-id&limit=1`;

        const response = await fetch(salesUrl, {
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            return { price: 0, source: "none" };
        }

        const data = await response.json();

        if (data.results && data.results.length > 0) {
            const lastSale = data.results[0];
            return {
                price: parseFloat(lastSale.unit_price) || 0,
                source: "sale",
                item_id: lastSale.id,
                date: lastSale.created_at || null,
            };
        }

        return { price: 0, source: "none" };
    } catch (error) {
        console.error("Error fetching last sale price:", error);
        return { price: 0, source: "none" };
    }
};

/**
 * 🚀 CORREGIDA: Obtener precios de compra desde las opciones de compra vigentes
 * CAMBIO IMPORTANTE: Ahora usa /suppliers/purchase-options/ en lugar de /purchases/items/
 * para obtener precios directamente de las opciones de compra de cada producto
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Mapa de product_id -> precio de su opción de compra más reciente
 */
export const getAllPurchasePricesOptimized = async (authToken) => {
    if (!authToken) {
        return {};
    }

    const pricesMap = {};
    let currentPage = 1;
    let hasMorePages = true;
    let totalItemsProcessed = 0;

    try {
        console.log(
            "🚀 Cargando TODAS las opciones de compra vigentes de forma paginada..."
        );

        while (hasMorePages) {
            // CORREGIDO: Usar el endpoint de opciones de compra, no items de órdenes
            const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PURCHASE_OPTIONS}?is_currently_valid=true&ordering=-valid_from&page=${currentPage}&page_size=500`;

            const response = await fetch(url, {
                headers: {
                    Authorization: `Token ${authToken}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(
                    `Error ${response.status}: ${response.statusText}`
                );
            }

            const data = await response.json();
            const purchaseOptions = data.results || [];

            // Si no hay más resultados, terminar
            if (purchaseOptions.length === 0) {
                hasMorePages = false;
                break;
            }

            console.log(
                `📦 Procesando página ${currentPage}: ${purchaseOptions.length} opciones de compra...`
            );

            // Procesar opciones de esta página
            for (const option of purchaseOptions) {
                const productId = option.product;

                // Solo tomar el primer precio por producto (el más reciente y válido)
                if (productId && !pricesMap.hasOwnProperty(productId)) {
                    pricesMap[productId] =
                        parseFloat(option.purchase_price) || 0;
                }
            }

            totalItemsProcessed += purchaseOptions.length;

            // Verificar si hay más páginas
            hasMorePages = !!data.next;
            currentPage++;

            // Log de progreso cada 5 páginas
            if (currentPage % 5 === 0) {
                console.log(
                    `📊 Progreso: ${
                        Object.keys(pricesMap).length
                    } productos únicos de ${totalItemsProcessed} opciones procesadas`
                );
            }
        }

        console.log(
            `✅ Precios de compra obtenidos para ${
                Object.keys(pricesMap).length
            } productos únicos`
        );
        console.log(
            `📊 Total procesado: ${totalItemsProcessed} opciones de compra en ${
                currentPage - 1
            } páginas`
        );

        return pricesMap;
    } catch (error) {
        console.error(
            "❌ Error cargando precios de compra optimizados:",
            error
        );
        return {};
    }
};

/**
 * CORREGIDA: Obtiene el precio de compra desde las opciones de compra válidas para un producto.
 * CAMBIO IMPORTANTE: Ahora usa /suppliers/purchase-options/ en lugar de /purchases/items/
 * @param {number} productId - ID del producto.
 * @param {string} authToken - Token de autenticación.
 * @returns {Promise<number|null>} - El precio de compra de la opción válida más reciente o null si no hay registros.
 */
export const getLastPurchasePrice = async (productId, authToken) => {
    if (!productId || !authToken) {
        return null;
    }

    // CORREGIDO: Usar endpoint de opciones de compra válidas para este producto
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PURCHASE_OPTIONS}?product=${productId}&is_currently_valid=true&ordering=-valid_from`;

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            console.warn(
                `Could not fetch last purchase price for product ${productId}. Status: ${response.status}`
            );
            return null;
        }

        const purchaseOptions = await response.json();

        // Si hay resultados, el primero es el más reciente
        if (purchaseOptions.results && purchaseOptions.results.length > 0) {
            return parseFloat(purchaseOptions.results[0].purchase_price);
        }

        return null;
    } catch (error) {
        console.error(
            `Error fetching last purchase price for product ${productId}:`,
            error
        );
        return null;
    }
};

/**
 * Fallback to get a product's price using a series of fallbacks.
 * This is useful when the primary price source might be missing.
 * @param {number} productId - Product ID
 * @param {string} authToken - Authentication token
 * @returns {Promise<Object>} - Price information
 */
const getProductIntelligentPriceFallback = async (productId, authToken) => {
    // 1. Try cost price if available (PRIORIDAD 4)
    try {
        const response = await fetch(
            `${API_CONFIG.BASE_URL}/catalogs/products/${productId}/`,
            {
                headers: {
                    Authorization: `Token ${authToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (response.ok) {
            const product = await response.json();
            const costPrice = parseFloat(product.cost_price) || 0;
            
            if (costPrice > 0) {
                return {
                    price: costPrice,
                    source: "cost",
                    source_label: "Precio de costo",
                };
            }
        }
    } catch (error) {
        console.error("Error fetching cost price:", error);
    }

    return {
        price: 0,
        source: "none",
        source_label: "Sin precio disponible",
    };
};

/**
 * Get stock for a specific product at a specific location
 * @param {number} productId - Product ID
 * @param {number} locationId - Location ID
 * @param {string} authToken - Authentication token
 * @returns {Promise<number>} - Available stock quantity
 */
export const getProductStockAtLocation = async (
    productId,
    locationId,
    authToken
) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const params = {
            product: productId,
            location: locationId,
        };

        const response = await getFilteredStock(params, authToken);

        if (response && response.results && response.results.length > 0) {
            // Sumar todas las cantidades para este producto en esta ubicación
            const totalStock = response.results.reduce((total, item) => {
                return total + (parseInt(item.quantity, 10) || 0);
            }, 0);

            return totalStock;
        }

        return 0; // No stock found
    } catch (error) {
        console.error("Error fetching product stock at location:", error);
        throw error;
    }
};

/**
 * Get stock breakdown by location for a specific product
 * @param {number} productId - Product ID
 * @param {string} authToken - Authentication token
 * @returns {Promise<Array>} - Array of stock by location with location details
 */
export const getProductStockByLocations = async (productId, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        // Get all locations and stock data for this product in parallel
        const [locations, stockResponse] = await Promise.all([
            getLocations(authToken),
            getFilteredStock({ product: productId }, authToken),
        ]);

        // Create a map of location ID to location details
        const locationMap = {};
        locations.forEach((location) => {
            locationMap[location.id] = {
                id: location.id,
                name: location.name,
                stock: 0,
            };
        });

        // Process stock data and accumulate by location
        if (stockResponse && stockResponse.results) {
            stockResponse.results.forEach((stockItem) => {
                if (
                    stockItem.location &&
                    locationMap[Number(stockItem.location)]
                ) {
                    locationMap[Number(stockItem.location)].stock +=
                        parseInt(stockItem.quantity, 10) || 0;
                }
            });
        }

        // Convert to array and sort by stock descending
        const stockByLocation = Object.values(locationMap).sort(
            (a, b) => b.stock - a.stock
        );

        return stockByLocation;
    } catch (error) {
        console.error("Error fetching product stock by locations:", error);
        throw error;
    }
};

/**
 * Validate if there's enough stock for a transfer
 * @param {number} productId - Product ID
 * @param {number} locationId - Origin location ID
 * @param {number} requestedQuantity - Requested quantity
 * @param {string} authToken - Authentication token
 * @returns {Promise<Object>} - Validation result with available stock
 */
export const validateStockForTransfer = async (
    productId,
    locationId,
    requestedQuantity,
    authToken
) => {
    try {
        const availableStock = await getProductStockAtLocation(
            productId,
            locationId,
            authToken
        );

        const isValid = availableStock >= requestedQuantity;

        return {
            isValid,
            availableStock,
            requestedQuantity,
            shortfall: isValid ? 0 : requestedQuantity - availableStock,
        };
    } catch (error) {
        console.error("Error validating stock for transfer:", error);
        throw error;
    }
};

/**
 * Get batches with stock for a specific product at a specific location
 * @param {number} productId - Product ID
 * @param {number} locationId - Location ID
 * @param {string} authToken - Authentication token
 * @returns {Promise<Array>} - Array of batches with stock information
 */
export const getBatchesWithStockAtLocation = async (
    productId,
    locationId,
    authToken
) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    if (!productId || !locationId) {
        throw new Error("Product ID and Location ID are required");
    }

    try {
        // Build URL with product and location filters using the correct endpoint
        const params = new URLSearchParams();
        params.append("product", productId);
        params.append("location", locationId);

        const url = `${API_STOCK_URL}?${params.toString()}`;

        const response = await fetch(url, {
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Handle pagination if needed
        let allBatches = data.results || data;

        // If there are more pages, fetch them all
        if (data.next) {
            let nextUrl = data.next;
            while (nextUrl) {
                const nextResponse = await fetch(nextUrl, {
                    headers: {
                        Authorization: `Token ${authToken}`,
                        "Content-Type": "application/json",
                    },
                });

                if (nextResponse.ok) {
                    const nextData = await nextResponse.json();
                    allBatches = allBatches.concat(nextData.results || []);
                    nextUrl = nextData.next;
                } else {
                    break;
                }
            }
        }

        // Filter out batches with zero stock and add additional properties
        const batchesWithStock = allBatches
            .filter((batch) => batch.quantity > 0)
            .map((batch) => ({
                ...batch,
                availableStock: batch.quantity,
                selectedQuantity: 0,
                useFullBatch: false,
                batch_id: batch.batch || batch.batch_id || batch.id,
            }));

        return batchesWithStock;
    } catch (error) {
        console.error("Error fetching batches with stock at location:", error);
        throw error;
    }
};

/**
 * Get SKU categories
 * @param {string} authToken - Authentication token
 * @returns {Promise<Array>} - Array of SKU categories
 */
export const getSkuCategories = async (authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const response = await fetch(
            `${API_CONFIG.BASE_URL}/catalogs/sku-categories/`,
            {
                headers: {
                    Authorization: `Token ${authToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching SKU categories:", error);
        throw error;
    }
};

/**
 * Get SKU subcategories filtered by category
 * @param {string} categoryId - Category ID to filter by
 * @param {string} authToken - Authentication token
 * @returns {Promise<Array>} - Array of SKU subcategories
 */
export const getSkuSubcategories = async (categoryId, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const url = `${API_CONFIG.BASE_URL}/catalogs/sku-subcategories/${
            categoryId ? `?category=${categoryId}` : ""
        }`;
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
        console.error("Error fetching SKU subcategories:", error);
        throw error;
    }
};

/**
 * Get SKU types filtered by subcategory
 * @param {string} subcategoryId - Subcategory ID to filter by
 * @param {string} authToken - Authentication token
 * @returns {Promise<Array>} - Array of SKU types
 */
export const getSkuTypes = async (subcategoryId, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const url = `${API_CONFIG.BASE_URL}/catalogs/sku-types/${
            subcategoryId ? `?subcategory=${subcategoryId}` : ""
        }`;
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
        console.error("Error fetching SKU types:", error);
        throw error;
    }
};

/**
 * Create a new SKU category
 * @param {Object} categoryData - Category data to create
 * @param {string} authToken - Authentication token
 * @returns {Promise<Object>} - Created category data
 */
export const createSkuCategory = async (categoryData, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const response = await fetch(
            `${API_CONFIG.BASE_URL}/catalogs/sku-categories/`,
            {
                method: "POST",
                headers: {
                    Authorization: `Token ${authToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(categoryData),
            }
        );

        if (!response.ok) {
            let errorMessage = `Error ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.json();
                if (errorData.detail) {
                    errorMessage = errorData.detail;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (typeof errorData === "object") {
                    const fieldErrors = Object.entries(errorData)
                        .map(([field, errors]) => {
                            const errorText = Array.isArray(errors)
                                ? errors.join(", ")
                                : errors;
                            // Traducir errores comunes para categorías SKU
                            if (errorText.includes("already exists")) {
                                return `El código "${categoryData.code}" ya existe`;
                            } else if (errorText.includes("required")) {
                                return `${field} es requerido`;
                            } else if (errorText.includes("invalid")) {
                                return `${field} no es válido`;
                            }
                            return `${field}: ${errorText}`;
                        })
                        .join("; ");
                    if (fieldErrors) {
                        errorMessage = fieldErrors;
                    }
                }
            } catch (parseError) {
                // Keep the original error message if we can't parse the response
            }
            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (error) {
        console.error("Error creating SKU category:", error);
        throw error;
    }
};

/**
 * Create a new SKU subcategory
 * @param {Object} subcategoryData - Subcategory data to create
 * @param {string} authToken - Authentication token
 * @returns {Promise<Object>} - Created subcategory data
 */
export const createSkuSubcategory = async (subcategoryData, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const response = await fetch(
            `${API_CONFIG.BASE_URL}/catalogs/sku-subcategories/`,
            {
                method: "POST",
                headers: {
                    Authorization: `Token ${authToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(subcategoryData),
            }
        );

        if (!response.ok) {
            let errorMessage = `Error ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.json();
                if (errorData.detail) {
                    errorMessage = errorData.detail;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (typeof errorData === "object") {
                    const fieldErrors = Object.entries(errorData)
                        .map(([field, errors]) => {
                            const errorText = Array.isArray(errors)
                                ? errors.join(", ")
                                : errors;
                            // Traducir errores comunes para subcategorías SKU
                            if (errorText.includes("already exists")) {
                                return `El código "${subcategoryData.code}" ya existe`;
                            } else if (errorText.includes("required")) {
                                return `${field} es requerido`;
                            } else if (errorText.includes("invalid")) {
                                return `${field} no es válido`;
                            }
                            return `${field}: ${errorText}`;
                        })
                        .join("; ");
                    if (fieldErrors) {
                        errorMessage = fieldErrors;
                    }
                }
            } catch (parseError) {
                // Keep the original error message if we can't parse the response
            }
            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (error) {
        console.error("Error creating SKU subcategory:", error);
        throw error;
    }
};

/**
 * Create a new SKU type
 * @param {Object} typeData - Type data to create
 * @param {string} authToken - Authentication token
 * @returns {Promise<Object>} - Created type data
 */
export const createSkuType = async (typeData, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const response = await fetch(
            `${API_CONFIG.BASE_URL}/catalogs/sku-types/`,
            {
                method: "POST",
                headers: {
                    Authorization: `Token ${authToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(typeData),
            }
        );

        if (!response.ok) {
            let errorMessage = `Error ${response.status}: ${response.statusText}`;
            try {
                const errorData = await response.json();
                if (errorData.detail) {
                    errorMessage = errorData.detail;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                } else if (typeof errorData === "object") {
                    const fieldErrors = Object.entries(errorData)
                        .map(([field, errors]) => {
                            const errorText = Array.isArray(errors)
                                ? errors.join(", ")
                                : errors;
                            // Traducir errores comunes para tipos SKU
                            if (errorText.includes("already exists")) {
                                return `El código "${typeData.code}" ya existe`;
                            } else if (errorText.includes("required")) {
                                return `${field} es requerido`;
                            } else if (errorText.includes("invalid")) {
                                return `${field} no es válido`;
                            }
                            return `${field}: ${errorText}`;
                        })
                        .join("; ");
                    if (fieldErrors) {
                        errorMessage = fieldErrors;
                    }
                }
            } catch (parseError) {
                // Keep the original error message if we can't parse the response
            }
            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (error) {
        console.error("Error creating SKU type:", error);
        throw error;
    }
};

// Export as default
const inventoryService = {
    getProducts,
    getStockData,
    getAllStock,
    getFilteredStock,
    getCategories,
    getLocations,
    getStockByLocationFast,
    getStockByLocation,
    getStockSummary,
    getInventoryMovements,
    createInventoryMovement,
    updateMovementStatus,
    getStockMap,
    generateNextSku,
    validateSku,
    getSkuSystemInfo,
    createProduct,
    getAllProducts,
    getProductPrices,
    getIntelligentPrice,
    getProductStockAtLocation,
    getProductStockByLocations,
    validateStockForTransfer,
    getBatchesWithStockAtLocation,
};

// Export default service
export default inventoryService;
export { inventoryService };

/**
 * Build URL with parameters
 * @param {string} baseUrl - Base API URL
 * @param {Object} params - URL parameters
 * @returns {string} - Complete URL with parameters
 */
const buildUrlWithParams = (baseUrl, params = {}) => {
    const urlParams = new URLSearchParams();

    // Añadir logs para depuración
    console.log(
        "🔍 BUILDING URL - Construyendo URL con parámetros:",
        JSON.stringify(params)
    );

    // Add all parameters to URL
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            // ✨ NUEVA OPTIMIZACIÓN: Estrategia inteligente para SKU basada en longitud
            if (key === "sku" && value.length > 0) {
                const isPartialSku = value.length < 10; // Típicamente los SKUs completos son más largos

                if (isPartialSku) {
                    console.log(
                        `🎯 PARTIAL SKU DETECTED: "${value}" (length: ${value.length})`
                    );
                    console.log(
                        `📡 Strategy: Using ONLY 'search' parameter for better partial matching`
                    );

                    // Para SKUs parciales, usar SOLO 'search' que funciona mejor con SearchFilter
                    urlParams.append("search", value);
                    console.log(
                        `✅ Added search="${value}" (optimized for partial matching)`
                    );
                } else {
                    console.log(
                        `🎯 FULL SKU DETECTED: "${value}" (length: ${value.length})`
                    );
                    console.log(
                        `📡 Strategy: Using 'sku' parameter for exact matching`
                    );

                    // Para SKUs completos o largos, usar 'sku' para filtros específicos
                    urlParams.append("sku", value);
                    console.log(`✅ Added sku="${value}" (exact match)`);
                }
                return; // Salir temprano para evitar procesamiento adicional
            }

            // Verificar si es un array para categorías
            if (Array.isArray(value)) {
                console.log(`📊 Array parameter: ${key}=${value.join(",")}`);
                // Para categorías, crear un parámetro separado para cada valor (operación OR)
                value.forEach((val) => {
                    urlParams.append(key, val);
                });
            } else {
                urlParams.append(key, value);
                console.log(`📝 Standard parameter: ${key}=${value}`);
            }
        }
    });

    const queryString = urlParams.toString();
    const finalUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;

    console.log("🎯 FINAL URL:", finalUrl);

    return finalUrl;
};

/**
 * ✨ ULTRA-OPTIMIZADO: Process stock data without performance-killing logs
 * @param {Array} results - Stock data results
 * @param {Object} stockMap - Map to update with stock data
 */
const processStockData = (results, stockMap) => {
    if (!Array.isArray(results)) {
        console.warn("Stock results is not an array:", results);
        return;
    }

    results.forEach((item) => {
        if (!item.product) return;

        // Convert quantity to a number, handle null, undefined, or string values
        const quantity =
            typeof item.quantity === "number"
                ? item.quantity
                : parseInt(item.quantity, 10) || 0;

        // If an entry already exists for this product, add the quantity
        if (stockMap[item.product] !== undefined) {
            stockMap[item.product] += quantity;
        } else {
            // If this is the first time we see this product, initialize with its quantity
            stockMap[item.product] = quantity;
        }
    });
};

/**
 * ✨ OPTIMIZADO: Fetch a page of stock data with better error handling
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
        console.error("Error fetching stock page:", error);
        throw error;
    }
};
