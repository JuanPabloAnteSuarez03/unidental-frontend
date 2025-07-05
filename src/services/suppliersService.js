import API_CONFIG from "../config/api.js";

// API URLs para proveedores
const API_SUPPLIERS_URL = `${API_CONFIG.BASE_URL}/suppliers/suppliers/`;
const API_PURCHASE_OPTIONS_URL = `${API_CONFIG.BASE_URL}/suppliers/purchase-options/`;

// Cache local para proveedores
let suppliersCache = {
    data: [],
    totalCount: 0,
    lastFetch: null,
    searchTerm: null,
};

// Tiempo de expiración del cache (5 minutos)
const CACHE_EXPIRY = 5 * 60 * 1000;

/**
 * Construir URL con parámetros de consulta
 */
const buildUrlWithParams = (baseUrl, params = {}) => {
    const url = new URL(baseUrl, window.location.origin);
    Object.keys(params).forEach((key) => {
        if (
            params[key] !== null &&
            params[key] !== undefined &&
            params[key] !== ""
        ) {
            url.searchParams.append(key, params[key]);
        }
    });
    return url.toString();
};

/**
 * Verificar si el cache es válido
 */
const isCacheValid = (searchTerm = "") => {
    if (!suppliersCache.lastFetch) return false;

    const now = Date.now();
    const isExpired = now - suppliersCache.lastFetch > CACHE_EXPIRY;
    const isSameSearch = suppliersCache.searchTerm === searchTerm;

    return !isExpired && isSameSearch;
};

/**
 * Obtener todos los proveedores con paginación y filtros (optimizado)
 * @param {Object} params - Parámetros de filtro y paginación
 * @param {string} authToken - Token de autenticación
 * @param {boolean} forceRefresh - Forzar actualización del cache
 * @returns {Promise<Object>} - Lista de proveedores paginada
 */
export const getSuppliers = async (
    params = {},
    authToken,
    forceRefresh = false
) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    const { page = 1, page_size = 25, search = "" } = params;

    // Si es la primera carga o búsqueda, cargar más datos para cache
    const isFirstLoad = !suppliersCache.data.length || forceRefresh;
    const isSearching = search && search.trim().length > 0;

    // Si no es búsqueda y el cache es válido, usar cache
    if (!isSearching && !forceRefresh && isCacheValid(search)) {
        const startIndex = (page - 1) * page_size;
        const endIndex = startIndex + page_size;
        const cachedResults = suppliersCache.data.slice(startIndex, endIndex);

        return {
            results: cachedResults,
            count: suppliersCache.totalCount,
            next:
                endIndex < suppliersCache.data.length
                    ? `page=${page + 1}`
                    : null,
            previous: page > 1 ? `page=${page - 1}` : null,
        };
    }

    // Si es primera carga y no hay búsqueda, cargar más datos
    let actualPageSize = page_size;
    if (isFirstLoad && !isSearching) {
        // Cargar más datos en la primera consulta para cache
        actualPageSize = Math.min(100, page_size * 4); // Cargar hasta 100 proveedores
    }

    const url = buildUrlWithParams(API_SUPPLIERS_URL, {
        ...params,
        page_size: actualPageSize,
    });

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

        const data = await response.json();

        // Si es primera carga sin búsqueda, guardar en cache
        if (isFirstLoad && !isSearching) {
            suppliersCache = {
                data: data.results || [],
                totalCount: data.count || 0,
                lastFetch: Date.now(),
                searchTerm: search,
            };
        }

        // Si es búsqueda, no cachear
        if (isSearching) {
            suppliersCache = {
                data: [],
                totalCount: 0,
                lastFetch: null,
                searchTerm: search,
            };
        }

        return data;
    } catch (error) {
        console.error("Error fetching suppliers:", error);
        throw error;
    }
};

/**
 * Obtener todos los proveedores sin paginación (para cache completo)
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Array>} - Lista completa de proveedores
 */
export const getAllSuppliers = async (authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        console.log("🔄 Cargando TODOS los proveedores...");
        const allSuppliers = [];
        let nextUrl = `${API_SUPPLIERS_URL}?page_size=100`; // Usar 100 por página para optimizar
        let pageCount = 0;
        const maxPages = 100; // Límite de seguridad

        while (nextUrl && pageCount < maxPages) {
            pageCount++;
            console.log(`📄 Cargando página ${pageCount} de proveedores...`);

            const response = await fetch(nextUrl, {
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
            const suppliers = data.results || [];

            // Agregar proveedores de esta página
            allSuppliers.push(...suppliers);
            console.log(
                `✅ Página ${pageCount}: ${suppliers.length} proveedores cargados`
            );

            // Verificar si hay más páginas
            nextUrl = data.next ? data.next : null;

            // Si no hay más páginas, terminar
            if (!nextUrl) {
                console.log(
                    `🏁 No hay más páginas. Total de proveedores cargados: ${allSuppliers.length}`
                );
                break;
            }
        }

        // Advertencia si llegamos al límite
        if (pageCount >= maxPages) {
            console.warn(
                `⚠️ Se alcanzó el límite de ${maxPages} páginas. Es posible que no se hayan cargado todos los proveedores.`
            );
        }

        // Actualizar cache con todos los datos
        suppliersCache = {
            data: allSuppliers,
            totalCount: allSuppliers.length,
            lastFetch: Date.now(),
            searchTerm: null,
        };

        console.log(
            `🎉 Carga completa finalizada: ${allSuppliers.length} proveedores cargados en ${pageCount} páginas`
        );

        return allSuppliers;
    } catch (error) {
        console.error("Error fetching all suppliers:", error);
        throw error;
    }
};

/**
 * Limpiar el cache de proveedores
 */
export const clearSuppliersCache = () => {
    suppliersCache = {
        data: [],
        totalCount: 0,
        lastFetch: null,
        searchTerm: null,
    };
};

/**
 * Obtener un proveedor específico por ID
 * @param {number} supplierId - ID del proveedor
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Datos del proveedor
 */
export const getSupplierById = async (supplierId, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const response = await fetch(`${API_SUPPLIERS_URL}${supplierId}/`, {
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
        console.error("Error fetching supplier by ID:", error);
        throw error;
    }
};

/**
 * Crear un nuevo proveedor
 * @param {Object} supplierData - Datos del proveedor a crear
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Proveedor creado
 */
export const createSupplier = async (supplierData, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const response = await fetch(API_SUPPLIERS_URL, {
            method: "POST",
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(supplierData),
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const newSupplier = await response.json();

        // Limpiar cache para forzar recarga
        clearSuppliersCache();

        return newSupplier;
    } catch (error) {
        console.error("Error creating supplier:", error);
        throw error;
    }
};

/**
 * Actualizar un proveedor existente
 * @param {number} supplierId - ID del proveedor a actualizar
 * @param {Object} supplierData - Datos actualizados del proveedor
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Proveedor actualizado
 */
export const updateSupplier = async (supplierId, supplierData, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const response = await fetch(`${API_SUPPLIERS_URL}${supplierId}/`, {
            method: "PATCH",
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(supplierData),
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const updatedSupplier = await response.json();

        // Limpiar cache para forzar recarga
        clearSuppliersCache();

        return updatedSupplier;
    } catch (error) {
        console.error("Error updating supplier:", error);
        throw error;
    }
};

/**
 * Eliminar un proveedor
 * @param {number} supplierId - ID del proveedor a eliminar
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<void>}
 */
export const deleteSupplier = async (supplierId, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const response = await fetch(`${API_SUPPLIERS_URL}${supplierId}/`, {
            method: "DELETE",
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        // Limpiar cache para forzar recarga
        clearSuppliersCache();
    } catch (error) {
        console.error("Error deleting supplier:", error);
        throw error;
    }
};

/**
 * Obtener opciones de compra con filtros
 * @param {Object} params - Parámetros de filtro
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Lista de opciones de compra
 */
export const getPurchaseOptions = async (params = {}, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    const url = buildUrlWithParams(API_PURCHASE_OPTIONS_URL, params);

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
        console.error("Error fetching purchase options:", error);
        throw error;
    }
};

// Obtener opciones de compra de proveedores
export async function getSupplierPurchaseOptions(authToken) {
    const response = await fetch(
        "https://unidental-backend.onrender.com/api/suppliers/purchase-options/",
        {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${authToken}`,
            },
        }
    );
    if (!response.ok) {
        throw new Error(
            "Error al obtener las opciones de compra de proveedores"
        );
    }
    return await response.json();
}

// Servicio por defecto
const suppliersService = {
    getSuppliers,
    getAllSuppliers,
    getSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    getPurchaseOptions,
    clearSuppliersCache,
    getSupplierPurchaseOptions,
};

export default suppliersService;
