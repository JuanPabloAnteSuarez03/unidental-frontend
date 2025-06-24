import API_CONFIG from "../config/api";

/**
 * Obtiene todos los lotes de productos
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Array>} - Lista de lotes de productos
 */
export const getAllProductBatches = async (authToken) => {
    try {
        const response = await fetch(
            `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCT_BATCHES}`,
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

        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error("Error al obtener lotes de productos:", error);
        throw error;
    }
};

/**
 * Obtiene los lotes próximos a vencer
 * @param {string} authToken - Token de autenticación
 * @param {number} days - Días hacia adelante para considerar como próximos a vencer
 * @returns {Promise<Array>} - Lista de lotes próximos a vencer
 */
export const getExpiringSoonBatches = async (authToken, days = 90) => {
    try {
        const response = await fetch(
            `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCT_BATCHES_EXPIRING_SOON}?days=${days}`,
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

        const data = await response.json();
        return data || [];
    } catch (error) {
        console.error("Error al obtener lotes próximos a vencer:", error);
        throw error;
    }
};

/**
 * Obtiene los lotes que vencen en un rango específico de días
 * @param {string} authToken - Token de autenticación
 * @param {number} minDays - Mínimo de días para el rango
 * @param {number} maxDays - Máximo de días para el rango
 * @returns {Promise<Array>} - Lista de lotes en el rango especificado
 */
export const getBatchesByExpiryRange = async (authToken, minDays, maxDays) => {
    try {
        console.log(`Buscando lotes entre ${minDays} y ${maxDays} días`);

        // Primero obtenemos todos los lotes (esto podría optimizarse con un endpoint específico en el backend)
        const allBatches = await getAllProductBatches(authToken);
        console.log(`Total de lotes obtenidos: ${allBatches.length}`);

        // Filtramos por el rango de días
        const today = new Date();
        const filteredBatches = allBatches.filter((batch) => {
            if (!batch.expiry_date) {
                console.log(
                    `Lote ${batch.id || "sin ID"} no tiene fecha de vencimiento`
                );
                return false;
            }

            const expiryDate = new Date(batch.expiry_date);
            const daysToExpiry = Math.ceil(
                (expiryDate - today) / (1000 * 60 * 60 * 24)
            );

            // Verificar si está en el rango
            const isInRange =
                daysToExpiry >= minDays && daysToExpiry <= maxDays;

            if (isInRange) {
                console.log(
                    `Lote ${
                        batch.batch_number || batch.id
                    } vence en ${daysToExpiry} días (dentro del rango)`
                );
            }

            return isInRange;
        });

        console.log(
            `Lotes filtrados en el rango ${minDays}-${maxDays}: ${filteredBatches.length}`
        );

        // Si no hay lotes en el rango exacto, intentar con un rango más amplio para depuración
        if (filteredBatches.length === 0) {
            console.log(
                "No se encontraron lotes en el rango exacto, verificando rangos cercanos..."
            );

            // Verificar cuántos lotes hay en rangos cercanos
            const nearRangeBatches = allBatches.filter((batch) => {
                if (!batch.expiry_date) return false;

                const expiryDate = new Date(batch.expiry_date);
                const daysToExpiry = Math.ceil(
                    (expiryDate - today) / (1000 * 60 * 60 * 24)
                );

                // Ampliar un poco el rango para depuración
                const isNearRange =
                    daysToExpiry >= minDays - 15 &&
                    daysToExpiry <= maxDays + 15;

                if (isNearRange) {
                    console.log(
                        `Lote ${
                            batch.batch_number || batch.id
                        } vence en ${daysToExpiry} días (rango cercano)`
                    );
                }

                return isNearRange;
            });

            console.log(
                `Lotes en rango cercano ${minDays - 15}-${maxDays + 15}: ${
                    nearRangeBatches.length
                }`
            );
        }

        return filteredBatches;
    } catch (error) {
        console.error(
            `Error al obtener lotes en rango ${minDays}-${maxDays} días:`,
            error
        );
        throw error;
    }
};

/**
 * Obtiene los lotes expirados
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Array>} - Lista de lotes expirados
 */
export const getExpiredBatches = async (authToken) => {
    try {
        const response = await fetch(
            `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCT_BATCHES_EXPIRED}`,
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

        const data = await response.json();
        return data || [];
    } catch (error) {
        console.error("Error al obtener lotes expirados:", error);
        throw error;
    }
};

/**
 * Crea un nuevo lote de producto
 * @param {Object} batchData - Datos del lote a crear
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Lote creado
 */
export const createProductBatch = async (batchData, authToken) => {
    try {
        const response = await fetch(
            `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCT_BATCHES}`,
            {
                method: "POST",
                headers: {
                    Authorization: `Token ${authToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(batchData),
            }
        );

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error al crear lote de producto:", error);
        throw error;
    }
};

/**
 * Actualiza un lote de producto existente
 * @param {number} batchId - ID del lote a actualizar
 * @param {Object} batchData - Datos actualizados del lote
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Lote actualizado
 */
export const updateProductBatch = async (batchId, batchData, authToken) => {
    try {
        const response = await fetch(
            `${API_CONFIG.BASE_URL}/catalogs/product-batches/${batchId}/`,
            {
                method: "PATCH",
                headers: {
                    Authorization: `Token ${authToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(batchData),
            }
        );

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error al actualizar lote de producto:", error);
        throw error;
    }
};
