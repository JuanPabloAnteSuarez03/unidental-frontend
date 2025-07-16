/**
 * Servicio para manejar conversiones de productos
 */

const API_BASE_URL = "https://unidental-backend.onrender.com/api";

/**
 * Obtener lotes de un producto usando el endpoint correcto
 * @param {number} productId - ID del producto
 * @param {number} locationId - ID de la ubicación (opcional, para filtrar)
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Información de lotes del producto
 */
export const getProductBatches = async (productId, locationId = null, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        let url = `/inventory/stock/product_batches_stock/?product=${productId}&only_available=true`;
        if (locationId) {
            url += `&location=${locationId}`;
        }

        const response = await fetch(`${API_BASE_URL}${url}`, {
            method: "GET",
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`Lotes para producto ${productId}:`, data);
        return data;
    } catch (error) {
        console.error("Error getting product batches:", error);
        throw error;
    }
};

/**
 * Ejecutar una conversión manual
 * @param {Object} conversionData - Datos de la conversión
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Resultado de la conversión
 */
export const executeConversion = async (conversionData, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        console.log("Executing conversion:", conversionData);
        
        const response = await fetch(`${API_BASE_URL}/catalogs/conversions/execute/`, {
            method: "POST",
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(conversionData),
        });

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (parseError) {
                errorData = { message: `Error ${response.status}: ${response.statusText}` };
            }
            
            // Manejo específico de errores de lotes (400)
            if (response.status === 400 && errorData.batch) {
                const error = new Error(errorData.batch[0] || "Error de validación de lotes");
                error.status = response.status;
                error.raw = errorData;
                throw error;
            }
            
            const error = new Error(errorData.message || "Error al ejecutar conversión");
            error.status = response.status;
            error.raw = errorData;
            throw error;
        }

        const result = await response.json();
        console.log("Conversion executed successfully:", result);
        
        // La respuesta incluye información detallada sobre lotes utilizados y creados
        // Ejemplo de respuesta exitosa con nuevo sistema:
        // {
        //   "success": true,
        //   "conversion": {
        //     "from_product": "Caja Ibuprofeno",
        //     "to_product": "Blisters Ibuprofeno",
        //     "quantity_converted": 1,
        //     "units_generated": 5
        //   },
        //   "batch_info": {
        //     "from_batch": "IBU-001-2024A",
        //     "to_batch": "IBU-001-2024A-CONV",
        //     "batch_inherited": true,
        //     "expiry_date": "2026-07-15"
        //   },
        //   "message": "Conversión ejecutada exitosamente"
        // }
        
        return result;
    } catch (error) {
        console.error("Error executing conversion:", error);
        throw error;
    }
};

/**
 * Obtener conversiones disponibles para un producto
 * @param {number} productId - ID del producto
 * @param {number} locationId - ID de la ubicación
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Array>} - Lista de conversiones disponibles
 */
export const getAvailableConversions = async (productId, locationId, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/catalogs/product-conversions/possible-from/?product=${productId}&location=${locationId}`,
            {
                method: "GET",
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
        console.error("Error getting available conversions:", error);
        throw error;
    }
};

/**
 * Obtener sugerencias de conversión para un producto, cantidad y sede
 * @param {number} productId
 * @param {number} requiredQuantity
 * @param {number} locationId
 * @param {string} authToken
 * @returns {Promise<Object>} - Respuesta con sugerencias
 */
export const getConversionSuggestions = async (productId, requiredQuantity, locationId, authToken) => {
    if (!authToken) throw new Error("No authentication token provided");
    try {
        const response = await fetch(`${API_BASE_URL}/catalogs/conversions/suggest/`, {
            method: "POST",
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                product_id: productId,
                required_quantity: requiredQuantity,
                location_id: locationId
            })
        });
        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error("Error getting conversion suggestions:", error);
        throw error;
    }
}; 

/**
 * Obtener todas las conversiones disponibles desde un producto específico
 * @param {number} productId - ID del producto origen
 * @param {number} locationId - ID de la ubicación
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Array>} - Lista de conversiones disponibles desde este producto
 */
export const getConversionsFromProduct = async (productId, locationId, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/catalogs/product-conversions/possible-from/?product=${productId}&location=${locationId}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Token ${authToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const conversions = await response.json();
        console.log(`Conversiones disponibles desde producto ${productId}:`, conversions);
        return conversions;
    } catch (error) {
        console.error("Error getting conversions from product:", error);
        throw error;
    }
};

/**
 * Obtener todas las conversiones disponibles hacia un producto específico
 * @param {number} productId - ID del producto destino
 * @param {number} locationId - ID de la ubicación
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Array>} - Lista de conversiones disponibles hacia este producto
 */
export const getConversionsToProduct = async (productId, locationId, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const response = await fetch(
            `${API_BASE_URL}/catalogs/product-conversions/possible-to/?product=${productId}&location=${locationId}`,
            {
                method: "GET",
                headers: {
                    Authorization: `Token ${authToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const conversions = await response.json();
        console.log(`Conversiones disponibles hacia producto ${productId}:`, conversions);
        return conversions;
    } catch (error) {
        console.error("Error getting conversions to product:", error);
        throw error;
    }
};

/**
 * Verificar si un producto puede convertirse en otro
 * @param {number} fromProductId - ID del producto origen
 * @param {number} toProductId - ID del producto destino
 * @param {number} locationId - ID de la ubicación
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object|null>} - Información de conversión o null si no existe
 */
export const checkConversionPossible = async (fromProductId, toProductId, locationId, authToken) => {
    try {
        const conversions = await getConversionsFromProduct(fromProductId, locationId, authToken);
        
        // Buscar conversión específica
        const conversion = conversions.find(conv => 
            conv.to_product.id === toProductId || conv.to_product === toProductId
        );
        
        return conversion || null;
    } catch (error) {
        console.error("Error checking conversion possibility:", error);
        return null;
    }
}; 