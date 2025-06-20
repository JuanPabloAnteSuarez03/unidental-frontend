import API_CONFIG from "../config/api.js";
import batchesService from "./batchesService.js";
import compositeProductsService from "./compositeProductsService.js";

// API URLs para inventario avanzado
const API_INVENTORY_BY_BATCHES_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVENTORY_BY_BATCHES}`;
const API_INVENTORY_EXPIRING_STOCK_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVENTORY_EXPIRING_STOCK}`;
const API_INVENTORY_EXPIRY_ALERTS_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVENTORY_EXPIRY_ALERTS}`;

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
 * Obtener stock agrupado por lotes (FIFO)
 * @param {Object} params - Parámetros de filtro
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Array>} - Lista de stock por lotes
 */
export const getStockByBatches = async (params = {}, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    const url = buildUrlWithParams(API_INVENTORY_BY_BATCHES_URL, params);

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
        console.error("Error fetching stock by batches:", error);
        throw error;
    }
};

/**
 * Obtener stock de productos próximos a vencer
 * @param {Object} params - Parámetros de filtro
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Array>} - Lista de stock próximo a vencer
 */
export const getExpiringStock = async (params = {}, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    const url = buildUrlWithParams(API_INVENTORY_EXPIRING_STOCK_URL, params);

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
        console.error("Error fetching expiring stock:", error);
        throw error;
    }
};

/**
 * Obtener alertas de vencimiento
 * @param {Object} params - Parámetros de filtro
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Array>} - Lista de alertas de vencimiento
 */
export const getExpiryAlerts = async (params = {}, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    const url = buildUrlWithParams(API_INVENTORY_EXPIRY_ALERTS_URL, params);

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
        console.error("Error fetching expiry alerts:", error);
        throw error;
    }
};

/**
 * Obtener lotes disponibles para un producto usando FIFO
 * @param {number} productId - ID del producto
 * @param {number} locationId - ID de la ubicación
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Array>} - Lista de lotes ordenados por FIFO con cantidades de stock
 */
export const getAvailableBatchesFIFO = async (productId, locationId, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        // Usar el nuevo endpoint optimizado que devuelve lotes con stock
        const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STOCK_PRODUCT_BATCHES}?product=${productId}&only_available=true`;
        
        console.log("Fetching product batches with stock from:", url);
        
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
        console.log("Product batches stock data received:", data);
        
        // La estructura es diferente: los lotes están en data.batches (no data.results)
        const batches = data.batches || [];
        
        // Filtrar lotes que tienen stock en la ubicación específica
        console.log("Processing batches for location:", locationId);
        console.log("Number of batches to process:", batches.length);
        
        const batchesInLocation = batches.map((batch, index) => {
            console.log(`Processing batch ${index} (${batch.batch_number}):`, batch);
            
            // Buscar stock en la ubicación específica - está en batch.locations
            const locationStock = batch.locations?.find(location => 
                location.location_id === locationId
            );
            
            console.log(`Location stock found for batch ${batch.batch_number}:`, locationStock);
            
            if (!locationStock || locationStock.quantity <= 0) {
                console.log(`No stock in location for batch ${batch.batch_number}`);
                return null; // No hay stock en esta ubicación
            }
            
            return {
                id: batch.batch_id,
                batch_id: batch.batch_id,
                batch_number: batch.batch_number,
                expiry_date: batch.expiry_date,
                manufacturing_date: batch.manufacturing_date,
                supplier_reference: batch.supplier_reference,
                notes: batch.notes,
                is_expired: batch.is_expired,
                days_to_expiry: batch.days_to_expiry,
                product: data.product_id,
                product_name: data.product_name,
                quantity: locationStock.quantity,
                stock_id: locationStock.id || null,
                location_id: locationId,
                location_name: locationStock.location_name
            };
        }).filter(batch => batch !== null); // Remover lotes sin stock en la ubicación
        
        console.log("Final batches with stock in location:", batchesInLocation);
        
        // Los lotes ya vienen ordenados por FIFO desde el backend
        return batchesInLocation;
        
    } catch (error) {
        console.error("Error getting available batches FIFO:", error);
        throw error;
    }
};

/**
 * Seleccionar lotes automáticamente usando FIFO para una cantidad específica
 * @param {number} productId - ID del producto
 * @param {number} locationId - ID de la ubicación
 * @param {number} requestedQuantity - Cantidad solicitada
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Resultado con lotes seleccionados y información
 */
export const selectBatchesFIFO = async (productId, locationId, requestedQuantity, authToken) => {
    try {
        const availableBatches = await getAvailableBatchesFIFO(productId, locationId, authToken);
        
        if (availableBatches.length === 0) {
            return {
                success: false,
                message: 'No hay lotes disponibles para este producto',
                selectedBatches: [],
                totalAvailable: 0,
                totalSelected: 0
            };
        }

        const totalAvailable = availableBatches.reduce((sum, batch) => sum + batch.quantity, 0);
        
        if (totalAvailable < requestedQuantity) {
            return {
                success: false,
                message: `Stock insuficiente. Disponible: ${totalAvailable}, Solicitado: ${requestedQuantity}`,
                selectedBatches: availableBatches,
                totalAvailable: totalAvailable,
                totalSelected: totalAvailable
            };
        }

        // Seleccionar lotes usando FIFO
        const selectedBatches = [];
        let remainingQuantity = requestedQuantity;

        for (const batch of availableBatches) {
            if (remainingQuantity <= 0) break;

            const quantityFromThisBatch = Math.min(batch.quantity, remainingQuantity);
            
            selectedBatches.push({
                ...batch,
                selectedQuantity: quantityFromThisBatch
            });

            remainingQuantity -= quantityFromThisBatch;
        }

        return {
            success: true,
            message: 'Lotes seleccionados correctamente usando FIFO',
            selectedBatches: selectedBatches,
            totalAvailable: totalAvailable,
            totalSelected: requestedQuantity
        };

    } catch (error) {
        console.error("Error selecting batches FIFO:", error);
        throw error;
    }
};

/**
 * Validar disponibilidad de stock considerando lotes
 * @param {number} productId - ID del producto
 * @param {number} locationId - ID de la ubicación
 * @param {number} requestedQuantity - Cantidad solicitada
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Resultado de la validación
 */
export const validateBatchStock = async (productId, locationId, requestedQuantity, authToken) => {
    try {
        const result = await selectBatchesFIFO(productId, locationId, requestedQuantity, authToken);
        
        return {
            isValid: result.success,
            availableQuantity: result.totalAvailable,
            requestedQuantity: requestedQuantity,
            message: result.message,
            batchInfo: result.selectedBatches
        };
    } catch (error) {
        console.error("Error validating batch stock:", error);
        return {
            isValid: false,
            availableQuantity: 0,
            requestedQuantity: requestedQuantity,
            message: 'Error al validar stock por lotes',
            batchInfo: []
        };
    }
};

/**
 * Obtener información completa de un producto para ventas (incluyendo lotes y componentes)
 * @param {Object} product - Objeto del producto
 * @param {number} locationId - ID de la ubicación
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Información completa del producto
 */
export const getProductSalesInfo = async (product, locationId, authToken) => {
    try {
        const productInfo = {
            ...product,
            requiresBatchControl: batchesService.requiresBatchControl(product),
            productType: compositeProductsService.getProductType(product),
            isComposite: compositeProductsService.isCompositeProduct(product),
            isComponent: compositeProductsService.isComponentProduct(product),
            isSimple: compositeProductsService.isSimpleProduct(product),
            batches: [],
            components: [],
            stockInfo: null
        };

        // Si requiere control de lotes, obtener lotes disponibles
        if (productInfo.requiresBatchControl) {
            try {
                productInfo.batches = await getAvailableBatchesFIFO(product.id, locationId, authToken);
                productInfo.stockInfo = {
                    totalStock: productInfo.batches.reduce((sum, batch) => sum + batch.quantity, 0),
                    batchCount: productInfo.batches.length,
                    hasExpiredBatches: productInfo.batches.some(batch => batch.is_expired),
                    hasExpiringSoonBatches: productInfo.batches.some(batch => 
                        !batch.is_expired && batch.days_to_expiry !== null && parseInt(batch.days_to_expiry) <= 30
                    )
                };
            } catch (error) {
                console.warn("Error getting batch info for product:", product.id, error);
                productInfo.batches = [];
                productInfo.stockInfo = { totalStock: 0, batchCount: 0 };
            }
        }

        // Si es un producto compuesto, obtener sus componentes
        if (productInfo.isComposite) {
            try {
                console.log("Product is composite, fetching components for product:", product.id);
                const componentsResponse = await compositeProductsService.getComponentsByComposite(product.id, authToken);
                console.log("Components response:", componentsResponse);
                console.log("Response type:", typeof componentsResponse);
                console.log("Is array:", Array.isArray(componentsResponse));
                console.log("Has results property:", 'results' in componentsResponse);
                
                // Manejar tanto respuesta paginada como array directo
                if (Array.isArray(componentsResponse)) {
                    productInfo.components = componentsResponse;
                } else if (componentsResponse && componentsResponse.results) {
                    productInfo.components = componentsResponse.results;
                } else {
                    productInfo.components = [];
                }
                
                console.log("Components found:", productInfo.components);
            } catch (error) {
                console.warn("Error getting components for composite product:", product.id, error);
                productInfo.components = [];
            }
        }

        // Si es un componente, obtener en qué kits está incluido
        if (productInfo.isComponent) {
            try {
                console.log("Product is component, fetching parent composites for product:", product.id);
                const compositesResponse = await compositeProductsService.getCompositesByComponent(product.id, authToken);
                console.log("Parent composites response:", compositesResponse);
                console.log("Response type:", typeof compositesResponse);
                console.log("Is array:", Array.isArray(compositesResponse));
                console.log("Has results property:", 'results' in compositesResponse);
                
                // Manejar tanto respuesta paginada como array directo
                if (Array.isArray(compositesResponse)) {
                    productInfo.parentComposites = compositesResponse;
                } else if (compositesResponse && compositesResponse.results) {
                    productInfo.parentComposites = compositesResponse.results;
                } else {
                    productInfo.parentComposites = [];
                }
                
                console.log("Parent composites found:", productInfo.parentComposites);
            } catch (error) {
                console.warn("Error getting parent composites for component:", product.id, error);
                productInfo.parentComposites = [];
            }
        }

        return productInfo;
    } catch (error) {
        console.error("Error getting product sales info:", error);
        throw error;
    }
};

/**
 * Preparar datos de venta para productos con lotes y componentes
 * @param {Object} product - Producto seleccionado
 * @param {number} quantity - Cantidad a vender
 * @param {number} locationId - ID de la ubicación
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Datos preparados para la venta
 */
export const prepareSaleData = async (product, quantity, locationId, authToken) => {
    try {
        const productInfo = await getProductSalesInfo(product, locationId, authToken);
        
        const saleData = {
            product_id: product.id,
            quantity: quantity,
            product_details: {
                name: product.name,
                sku: product.sku,
                barcode: product.barcode || "",
                description: product.description || "",
                category_name: product.category_name,
                category: product.category || 0,
                unit: product.unit,
                product_type: productInfo.productType,
                requires_batch_control: productInfo.requiresBatchControl
            },
            batches: [],
            components: []
        };

        // Si requiere control de lotes, seleccionar lotes usando FIFO
        if (productInfo.requiresBatchControl) {
            const batchSelection = await selectBatchesFIFO(product.id, locationId, quantity, authToken);
            
            if (!batchSelection.success) {
                throw new Error(batchSelection.message);
            }

            saleData.batches = batchSelection.selectedBatches.map(batch => ({
                batch_id: batch.batch_id,
                batch_number: batch.batch_number,
                quantity: batch.selectedQuantity,
                expiry_date: batch.expiry_date
            }));
        }

        // Si es un producto compuesto, incluir información de componentes
        if (productInfo.isComposite) {
            saleData.components = compositeProductsService.calculateComponentsNeeded(
                productInfo.components, 
                quantity
            ).map(component => ({
                component_product_id: component.component_product,
                component_name: component.component_product_name,
                component_sku: component.component_product_sku,
                quantity_per_unit: component.quantity,
                total_quantity: component.totalQuantityNeeded
            }));
        }

        return saleData;
    } catch (error) {
        console.error("Error preparing sale data:", error);
        throw error;
    }
};

/**
 * Validar si una venta es posible considerando lotes y componentes
 * @param {Array} saleItems - Items de la venta
 * @param {number} locationId - ID de la ubicación
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Resultado de la validación
 */
export const validateSale = async (saleItems, locationId, authToken) => {
    try {
        const validationResults = [];
        let canProceed = true;

        for (const item of saleItems) {
            const product = item.product_details;
            const quantity = item.quantity;

            // Validar si requiere control de lotes
            if (product.requires_batch_control) {
                const batchValidation = await validateBatchStock(
                    item.product_id, 
                    locationId, 
                    quantity, 
                    authToken
                );
                
                if (!batchValidation.isValid) {
                    canProceed = false;
                    validationResults.push({
                        product_name: product.name,
                        issue: 'batch_stock',
                        message: batchValidation.message
                    });
                }
            }

            // Validar si es producto compuesto
            if (product.product_type === 'composite') {
                try {
                    const componentsResponse = await compositeProductsService.getComponentsByComposite(
                        item.product_id, 
                        authToken
                    );
                    const components = componentsResponse.results || [];
                    
                    const componentValidation = compositeProductsService.validateComponentsStock(
                        components, 
                        quantity
                    );
                    
                    if (!componentValidation.canAssemble) {
                        canProceed = false;
                        validationResults.push({
                            product_name: product.name,
                            issue: 'component_stock',
                            message: componentValidation.message
                        });
                    }
                } catch (error) {
                    console.warn("Error validating composite product:", error);
                }
            }
        }

        return {
            canProceed,
            validationResults,
            message: canProceed 
                ? 'Todos los productos pueden venderse' 
                : 'Algunos productos tienen problemas de stock'
        };
    } catch (error) {
        console.error("Error validating sale:", error);
        return {
            canProceed: false,
            validationResults: [],
            message: 'Error al validar la venta'
        };
    }
};

// Servicio por defecto
const advancedInventoryService = {
    getStockByBatches,
    getExpiringStock,
    getExpiryAlerts,
    getAvailableBatchesFIFO,
    selectBatchesFIFO,
    validateBatchStock,
    getProductSalesInfo,
    prepareSaleData,
    validateSale,
};

export default advancedInventoryService; 