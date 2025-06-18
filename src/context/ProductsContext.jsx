import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
} from "react";
import { inventoryService } from "../services/inventoryService";
import { useAuth } from "./AuthContext";

const ProductsContext = createContext();

export const useProducts = () => {
    const context = useContext(ProductsContext);
    if (!context) {
        throw new Error("useProducts must be used within a ProductsProvider");
    }
    return context;
};

export const ProductsProvider = ({ children }) => {
    const { authToken } = useAuth();
    const [productsCache, setProductsCache] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [lastFetch, setLastFetch] = useState(null);
    const [error, setError] = useState(null);

    // Cache duration in milliseconds (10 minutes for products as they change less frequently)
    const CACHE_DURATION = 10 * 60 * 1000;

    // Check if cache is still valid
    const isCacheValid = useCallback(() => {
        if (!lastFetch) return false;
        return Date.now() - lastFetch < CACHE_DURATION;
    }, [lastFetch, CACHE_DURATION]);

    // Load all products and cache them
    const loadAllProducts = useCallback(
        async (forceRefresh = false) => {
            if (!authToken) return;

            // If cache is valid and not forcing refresh, return cached data
            if (!forceRefresh && isCacheValid() && productsCache.length > 0) {
                return productsCache;
            }

            try {
                setIsLoading(true);
                setError(null);

                // Load products and stock data in parallel
                const [allProducts, stockMap] = await Promise.all([
                    inventoryService.getAllProducts({}, authToken),
                    inventoryService.getStockMap(authToken).catch(() => ({})), // Fallback to empty object on error
                ]);

                console.log(`Loaded ${allProducts.length} products`);
                console.log(
                    `Loaded stock data for ${
                        Object.keys(stockMap).length
                    } products`
                );

                // Enrich products with stock information
                const enrichedProducts = allProducts.map((product) => {
                    const totalStock = stockMap[product.id] || 0;
                    return {
                        ...product,
                        stock_quantity: totalStock,
                    };
                });

                setProductsCache(enrichedProducts);
                setLastFetch(Date.now());
                setIsInitialized(true);

                return enrichedProducts;
            } catch (error) {
                console.error("Error loading products:", error);
                setError(error.message || "Error al cargar productos");
                return productsCache; // Return cached data on error
            } finally {
                setIsLoading(false);
            }
        },
        [authToken, productsCache, isCacheValid]
    );

    // Search products in cache
    const searchProducts = useCallback(
        (searchTerm) => {
            if (!searchTerm || searchTerm.length < 2) {
                return [];
            }

            const term = searchTerm.toLowerCase().trim();

            // ✨ OPTIMIZACIÓN: Limitar la búsqueda a términos de al menos 3 caracteres
            // para búsquedas generales (excepto SKUs específicos que pueden ser cortos)
            if (term.length < 3 && !term.includes("-")) {
                console.log("Search term too short, returning limited results");
                return productsCache.slice(0, 20); // Mostrar solo primeros 20 como muestra
            }

            const results = productsCache.filter((product) => {
                // ✨ OPTIMIZACIÓN: Primero verificar el SKU que es más rápido
                const sku = (product.sku || "").toLowerCase();
                if (sku.includes(term)) return true;

                // Solo si no coincide con SKU, verificar otros campos
                const name = (product.name || "").toLowerCase();
                const barcode = (product.barcode || "").toLowerCase();

                // ✨ OPTIMIZACIÓN: Verificar campos más cortos primero
                return (
                    name.includes(term) ||
                    barcode.includes(term) ||
                    // Solo verificar estos campos si los anteriores no coinciden
                    (product.category_name || "")
                        .toLowerCase()
                        .includes(term) ||
                    (product.description || "").toLowerCase().includes(term)
                );
            });

            return results;
        },
        [productsCache]
    );

    // Get product by ID from cache
    const getProductById = useCallback(
        (productId) => {
            return (
                productsCache.find((product) => product.id === productId) ||
                null
            );
        },
        [productsCache]
    );

    // Add new product to cache
    const addProductToCache = useCallback((newProduct) => {
        setProductsCache((prev) => {
            // Check if product already exists
            const exists = prev.some((product) => product.id === newProduct.id);
            if (exists) {
                // Update existing product
                return prev.map((product) =>
                    product.id === newProduct.id ? newProduct : product
                );
            } else {
                // Add new product and sort by name
                const updated = [...prev, newProduct];
                return updated.sort((a, b) =>
                    (a.name || "").localeCompare(b.name || "")
                );
            }
        });
    }, []);

    // Update product in cache
    const updateProductInCache = useCallback((updatedProduct) => {
        setProductsCache((prev) =>
            prev
                .map((product) =>
                    product.id === updatedProduct.id ? updatedProduct : product
                )
                .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
        );
    }, []);

    // Remove product from cache
    const removeProductFromCache = useCallback((productId) => {
        setProductsCache((prev) =>
            prev.filter((product) => product.id !== productId)
        );
    }, []);

    // Get products by category from cache
    const getProductsByCategory = useCallback(
        (categoryId) => {
            return productsCache.filter(
                (product) => product.category === categoryId
            );
        },
        [productsCache]
    );

    // Get low stock products
    const getLowStockProducts = useCallback(
        (threshold = 10) => {
            return productsCache.filter(
                (product) =>
                    product.stock_quantity !== undefined &&
                    product.stock_quantity < threshold
            );
        },
        [productsCache]
    );

    // Update stock after sales
    const updateStockAfterSale = useCallback((soldItems) => {
        if (!Array.isArray(soldItems)) {
            console.warn("updateStockAfterSale: soldItems should be an array");
            return;
        }

        console.log("Updating stock in products cache after sale:", soldItems);

        setProductsCache((prev) =>
            prev.map((product) => {
                const soldItem = soldItems.find(
                    (item) => item.product_id === product.id
                );
                if (soldItem) {
                    const newStock = Math.max(
                        0,
                        (product.stock_quantity || 0) - soldItem.quantity
                    );
                    console.log(
                        `Updated stock for product ${product.id}: ${product.stock_quantity} -> ${newStock}`
                    );
                    return {
                        ...product,
                        stock_quantity: newStock,
                    };
                }
                return product;
            })
        );
    }, []);

    // Initialize cache when auth token is available
    useEffect(() => {
        if (authToken && !isInitialized) {
            loadAllProducts();
        }
    }, [authToken, isInitialized, loadAllProducts]);

    // Force refresh cache when products cache exists but doesn't have stock_quantity
    useEffect(() => {
        if (authToken && isInitialized && productsCache.length > 0) {
            // Check if products have stock_quantity field
            const hasStockInfo = productsCache.some(
                (product) => product.stock_quantity !== undefined
            );
            if (!hasStockInfo) {
                console.log(
                    "Products cache missing stock information, refreshing..."
                );
                loadAllProducts(true);
            }
        }
    }, [authToken, isInitialized, productsCache, loadAllProducts]);

    // Force refresh cache
    const refreshCache = useCallback(() => {
        return loadAllProducts(true);
    }, [loadAllProducts]);

    // Get cache status info
    const getCacheInfo = useCallback(() => {
        return {
            count: productsCache.length,
            isValid: isCacheValid(),
            lastFetch: lastFetch ? new Date(lastFetch).toLocaleString() : null,
            isLoading,
            isInitialized,
            error,
        };
    }, [
        productsCache.length,
        isCacheValid,
        lastFetch,
        isLoading,
        isInitialized,
        error,
    ]);

    const value = {
        // Data
        productsCache,
        isLoading,
        isInitialized,
        error,

        // Functions
        loadAllProducts,
        searchProducts,
        getProductById,
        addProductToCache,
        updateProductInCache,
        removeProductFromCache,
        getProductsByCategory,
        getLowStockProducts,
        updateStockAfterSale,
        refreshCache,
        getCacheInfo,

        // Utils
        isCacheValid,
    };

    return (
        <ProductsContext.Provider value={value}>
            {children}
        </ProductsContext.Provider>
    );
};
