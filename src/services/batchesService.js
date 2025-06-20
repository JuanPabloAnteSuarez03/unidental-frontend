import API_CONFIG from "../config/api.js";

// API URLs para lotes
const API_BATCHES_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCT_BATCHES}`;
const API_BATCHES_EXPIRED_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCT_BATCHES_EXPIRED}`;
const API_BATCHES_EXPIRING_SOON_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCT_BATCHES_EXPIRING_SOON}`;

/**
 * Construir URL con parámetros de consulta
 */
const buildUrlWithParams = (baseUrl, params = {}) => {
    const url = new URL(baseUrl, window.location.origin);
    Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
            url.searchParams.append(key, params[key]);
        }
    });
    return url.toString();
};

/**
 * Obtener todos los lotes con filtros opcionales
 * @param {Object} params - Parámetros de filtro
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Lista paginada de lotes
 */
export const getBatches = async (params = {}, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    const url = buildUrlWithParams(API_BATCHES_URL, params);

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
        console.error("Error fetching batches:", error);
        throw error;
    }
};

/**
 * Crear un nuevo lote
 * @param {Object} batchData - Datos del lote
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Lote creado
 */
export const createBatch = async (batchData, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const response = await fetch(API_BATCHES_URL, {
            method: "POST",
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(batchData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error ${response.status}: ${JSON.stringify(errorData)}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error creating batch:", error);
        throw error;
    }
};

/**
 * Obtener un lote específico por ID
 * @param {number} batchId - ID del lote
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Datos del lote
 */
export const getBatchById = async (batchId, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const response = await fetch(`${API_BATCHES_URL}${batchId}/`, {
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
        console.error("Error fetching batch:", error);
        throw error;
    }
};

/**
 * Actualizar un lote
 * @param {number} batchId - ID del lote
 * @param {Object} batchData - Datos actualizados del lote
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Lote actualizado
 */
export const updateBatch = async (batchId, batchData, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const response = await fetch(`${API_BATCHES_URL}${batchId}/`, {
            method: "PUT",
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(batchData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error ${response.status}: ${JSON.stringify(errorData)}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error updating batch:", error);
        throw error;
    }
};

/**
 * Actualizar parcialmente un lote
 * @param {number} batchId - ID del lote
 * @param {Object} batchData - Datos parciales del lote
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Lote actualizado
 */
export const patchBatch = async (batchId, batchData, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const response = await fetch(`${API_BATCHES_URL}${batchId}/`, {
            method: "PATCH",
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(batchData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error ${response.status}: ${JSON.stringify(errorData)}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error patching batch:", error);
        throw error;
    }
};

/**
 * Eliminar un lote
 * @param {number} batchId - ID del lote
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<void>}
 */
export const deleteBatch = async (batchId, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const response = await fetch(`${API_BATCHES_URL}${batchId}/`, {
            method: "DELETE",
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error("Error deleting batch:", error);
        throw error;
    }
};

/**
 * Obtener lotes expirados
 * @param {Object} params - Parámetros de filtro
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Array>} - Lista de lotes expirados
 */
export const getExpiredBatches = async (params = {}, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    const url = buildUrlWithParams(API_BATCHES_EXPIRED_URL, params);

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
        console.error("Error fetching expired batches:", error);
        throw error;
    }
};

/**
 * Obtener lotes próximos a vencer
 * @param {Object} params - Parámetros de filtro (days, product)
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Array>} - Lista de lotes próximos a vencer
 */
export const getExpiringSoonBatches = async (params = {}, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    const url = buildUrlWithParams(API_BATCHES_EXPIRING_SOON_URL, params);

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
        console.error("Error fetching expiring soon batches:", error);
        throw error;
    }
};

/**
 * Obtener lotes de un producto específico
 * @param {number} productId - ID del producto
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Array>} - Lista de lotes del producto
 */
export const getBatchesByProduct = async (productId, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const params = { product: productId };
        return await getBatches(params, authToken);
    } catch (error) {
        console.error("Error fetching batches by product:", error);
        throw error;
    }
};

/**
 * Validar si un producto requiere control de lotes
 * @param {Object} product - Objeto del producto
 * @returns {boolean} - True si requiere control de lotes
 */
export const requiresBatchControl = (product) => {
    return product?.requires_batch_control === true;
};

/**
 * Obtener el estado de vencimiento de un lote
 * @param {Object} batch - Objeto del lote
 * @returns {Object} - Estado del lote con información de vencimiento
 */
export const getBatchExpiryStatus = (batch) => {
    if (!batch?.expiry_date) {
        return {
            status: 'no_expiry',
            message: 'Sin fecha de vencimiento',
            color: 'gray',
            daysToExpiry: null
        };
    }

    const daysToExpiry = parseInt(batch.days_to_expiry);
    const isExpired = batch.is_expired === 'True' || batch.is_expired === true;

    if (isExpired) {
        return {
            status: 'expired',
            message: 'Vencido',
            color: 'red',
            daysToExpiry: daysToExpiry
        };
    } else if (daysToExpiry <= 7) {
        return {
            status: 'critical',
            message: `Vence en ${daysToExpiry} días`,
            color: 'red',
            daysToExpiry: daysToExpiry
        };
    } else if (daysToExpiry <= 30) {
        return {
            status: 'warning',
            message: `Vence en ${daysToExpiry} días`,
            color: 'orange',
            daysToExpiry: daysToExpiry
        };
    } else {
        return {
            status: 'good',
            message: `Vence en ${daysToExpiry} días`,
            color: 'green',
            daysToExpiry: daysToExpiry
        };
    }
};

// Servicio por defecto
const batchesService = {
    getBatches,
    createBatch,
    getBatchById,
    updateBatch,
    patchBatch,
    deleteBatch,
    getExpiredBatches,
    getExpiringSoonBatches,
    getBatchesByProduct,
    requiresBatchControl,
    getBatchExpiryStatus,
};

export default batchesService; 