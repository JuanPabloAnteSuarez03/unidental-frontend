import API_CONFIG from "../config/api.js";

// API URLs para productos compuestos
const API_COMPONENTS_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCT_COMPONENTS}`;
const API_COMPONENTS_BY_COMPOSITE_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCT_COMPONENTS_BY_COMPOSITE}`;
const API_COMPONENTS_BY_COMPONENT_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCT_COMPONENTS_BY_COMPONENT}`;
const API_BREAKDOWN_COMPOSITE_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVENTORY_BREAKDOWN_COMPOSITE}`;

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
 * Obtener todos los componentes de productos
 * @param {Object} params - Parámetros de filtro
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Lista paginada de componentes
 */
export const getProductComponents = async (params = {}, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    const url = buildUrlWithParams(API_COMPONENTS_URL, params);

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
        console.error("Error fetching product components:", error);
        throw error;
    }
};

/**
 * Crear una nueva relación producto-componente
 * @param {Object} componentData - Datos del componente
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Componente creado
 */
export const createProductComponent = async (componentData, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const response = await fetch(API_COMPONENTS_URL, {
            method: "POST",
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(componentData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                `Error ${response.status}: ${JSON.stringify(errorData)}`
            );
        }

        return await response.json();
    } catch (error) {
        console.error("Error creating product component:", error);
        throw error;
    }
};

/**
 * Obtener componentes de un producto compuesto específico
 * @param {number} compositeId - ID del producto compuesto
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Lista de componentes del producto compuesto
 */
export const getComponentsByComposite = async (compositeId, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    const params = { composite_id: compositeId };
    const url = buildUrlWithParams(API_COMPONENTS_BY_COMPOSITE_URL, params);

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
        console.error("Error fetching components by composite:", error);
        throw error;
    }
};

/**
 * Obtener productos compuestos que contienen un componente específico
 * @param {number} componentId - ID del producto componente
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Lista de productos compuestos que contienen el componente
 */
export const getCompositesByComponent = async (componentId, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    const params = { component_id: componentId };
    const url = buildUrlWithParams(API_COMPONENTS_BY_COMPONENT_URL, params);

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
        console.error("Error fetching composites by component:", error);
        throw error;
    }
};

/**
 * Obtener un componente específico por ID
 * @param {number} componentId - ID del componente
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Datos del componente
 */
export const getProductComponentById = async (componentId, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const response = await fetch(`${API_COMPONENTS_URL}${componentId}/`, {
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
        console.error("Error fetching product component:", error);
        throw error;
    }
};

/**
 * Actualizar un componente de producto
 * @param {number} componentId - ID del componente
 * @param {Object} componentData - Datos actualizados del componente
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Componente actualizado
 */
export const updateProductComponent = async (
    componentId,
    componentData,
    authToken
) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const response = await fetch(`${API_COMPONENTS_URL}${componentId}/`, {
            method: "PUT",
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(componentData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                `Error ${response.status}: ${JSON.stringify(errorData)}`
            );
        }

        return await response.json();
    } catch (error) {
        console.error("Error updating product component:", error);
        throw error;
    }
};

/**
 * Eliminar un componente de producto
 * @param {number} componentId - ID del componente
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<void>}
 */
export const deleteProductComponent = async (componentId, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const response = await fetch(`${API_COMPONENTS_URL}${componentId}/`, {
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
        console.error("Error deleting product component:", error);
        throw error;
    }
};

/**
 * Desarmar un producto compuesto en sus componentes
 * @param {Object} breakdownData - Datos del desarmado
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Resultado del desarmado
 */
export const breakdownCompositeProduct = async (breakdownData, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const response = await fetch(API_BREAKDOWN_COMPOSITE_URL, {
            method: "POST",
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(breakdownData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
                `Error ${response.status}: ${JSON.stringify(errorData)}`
            );
        }

        return await response.json();
    } catch (error) {
        console.error("Error breaking down composite product:", error);
        throw error;
    }
};

/**
 * Validar el tipo de producto
 * @param {Object} product - Objeto del producto
 * @returns {string} - Tipo de producto: 'simple', 'component', 'composite'
 */
export const getProductType = (product) => {
    return product?.product_type || "simple";
};

/**
 * Verificar si un producto es compuesto
 * @param {Object} product - Objeto del producto
 * @returns {boolean} - True si es un producto compuesto
 */
export const isCompositeProduct = (product) => {
    return getProductType(product) === "composite";
};

/**
 * Verificar si un producto es componente
 * @param {Object} product - Objeto del producto
 * @returns {boolean} - True si es un producto componente
 */
export const isComponentProduct = (product) => {
    return getProductType(product) === "component";
};

/**
 * Verificar si un producto es simple
 * @param {Object} product - Objeto del producto
 * @returns {boolean} - True si es un producto simple
 */
export const isSimpleProduct = (product) => {
    return getProductType(product) === "simple";
};

/**
 * Calcular el total de componentes necesarios para una cantidad de productos compuestos
 * @param {Array} components - Lista de componentes del producto compuesto
 * @param {number} compositeQuantity - Cantidad de productos compuestos
 * @returns {Array} - Lista de componentes con cantidades calculadas
 */
export const calculateComponentsNeeded = (components, compositeQuantity) => {
    return components.map((component) => ({
        ...component,
        totalQuantityNeeded: component.quantity * compositeQuantity,
    }));
};

/**
 * Validar si hay suficiente stock de componentes para armar productos compuestos
 * @param {Array} components - Lista de componentes con stock
 * @param {number} compositeQuantity - Cantidad de productos compuestos a armar
 * @returns {Object} - Resultado de la validación
 */
export const validateComponentsStock = (components, compositeQuantity) => {
    const insufficientStock = [];
    let canAssemble = true;

    components.forEach((component) => {
        const neededQuantity = component.quantity * compositeQuantity;
        const availableStock = component.available_stock || 0;

        if (availableStock < neededQuantity) {
            canAssemble = false;
            insufficientStock.push({
                component_name: component.component_product_name,
                needed: neededQuantity,
                available: availableStock,
                missing: neededQuantity - availableStock,
            });
        }
    });

    return {
        canAssemble,
        insufficientStock,
        message: canAssemble
            ? "Stock suficiente para armar los productos compuestos"
            : `Stock insuficiente para los siguientes componentes: ${insufficientStock
                  .map((c) => c.component_name)
                  .join(", ")}`,
    };
};

// Servicio por defecto
const compositeProductsService = {
    getProductComponents,
    createProductComponent,
    getComponentsByComposite,
    getCompositesByComponent,
    getProductComponentById,
    updateProductComponent,
    deleteProductComponent,
    breakdownCompositeProduct,
    getProductType,
    isCompositeProduct,
    isComponentProduct,
    isSimpleProduct,
    calculateComponentsNeeded,
    validateComponentsStock,
};

export default compositeProductsService;
