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

    // Cache duration in milliseconds (60 minutes for products as they change less frequently)
    const CACHE_DURATION = 60 * 60 * 1000;

    // 🚀 CACHE PERSISTENTE: Configuración para localStorage
    const PRODUCTS_CACHE_STORAGE_KEY = "products_cache_data";
    const PRODUCTS_CACHE_EXPIRY_TIME = 60 * 60 * 1000; // 60 minutos (1 hora)

    // 🚀 FUNCIÓN: Cargar cache de productos desde localStorage
    const cargarCacheProductosDesdeStorage = () => {
        try {
            const cacheGuardado = localStorage.getItem(PRODUCTS_CACHE_STORAGE_KEY);
            if (cacheGuardado) {
                const cache = JSON.parse(cacheGuardado);

                // Verificar si el cache no ha expirado
                const ahora = Date.now();
                const tiempoTranscurrido = ahora - (cache.lastFetch || 0);

                if (
                    tiempoTranscurrido < PRODUCTS_CACHE_EXPIRY_TIME &&
                    cache.products &&
                    cache.products.length > 0
                ) {
                    console.log(
                        "💾 Cache de productos cargado desde localStorage:",
                        {
                            productos: cache.products.length,
                            ultimaActualizacion: new Date(
                                cache.lastFetch
                            ).toLocaleString("es-ES"),
                        }
                    );
                    return {
                        products: cache.products || [],
                        lastFetch: cache.lastFetch,
                        isValid: true,
                    };
                }
            }
        } catch (error) {
            console.error("❌ Error al cargar cache de productos desde localStorage:", error);
        }
        return null;
    };

    // 🚀 FUNCIÓN: Guardar cache de productos en localStorage
    const guardarCacheProductosEnStorage = (nuevoCache) => {
        try {
            const cacheParaGuardar = {
                products: nuevoCache.products || [],
                lastFetch: nuevoCache.lastFetch || Date.now(),
                version: "1.0.0",
            };

            localStorage.setItem(
                PRODUCTS_CACHE_STORAGE_KEY,
                JSON.stringify(cacheParaGuardar)
            );

            console.log(
                "💾 Cache de productos guardado en localStorage:",
                {
                    productos: cacheParaGuardar.products.length,
                    timestamp: new Date(cacheParaGuardar.lastFetch).toLocaleString("es-ES"),
                }
            );
        } catch (error) {
            console.error("❌ Error al guardar cache de productos en localStorage:", error);
        }
    };

    // 🚀 FUNCIÓN: Limpiar cache de productos
    const limpiarCacheProductosStorage = () => {
        try {
            localStorage.removeItem(PRODUCTS_CACHE_STORAGE_KEY);
            console.log("🗑️ Cache de productos eliminado de localStorage");
        } catch (error) {
            console.error("❌ Error al limpiar cache de productos:", error);
        }
    };

    // Check if cache is still valid
    const isCacheValid = useCallback(() => {
        if (!lastFetch) return false;
        return Date.now() - lastFetch < CACHE_DURATION;
    }, [lastFetch, CACHE_DURATION]);

    // Load all products and cache them
    const loadAllProducts = useCallback(
        async (forceRefresh = false) => {
            if (!authToken) return;

            // 🚀 Si no es refresh forzado, verificar cache persistente primero
            if (!forceRefresh) {
                const cacheFromStorage = cargarCacheProductosDesdeStorage();
                if (cacheFromStorage && cacheFromStorage.isValid) {
                    console.log("📦 Usando productos desde cache persistente");
                    setProductsCache(cacheFromStorage.products);
                    setLastFetch(cacheFromStorage.lastFetch);
                    setIsInitialized(true);
                    return cacheFromStorage.products;
                }

                // If memory cache is valid and not forcing refresh, return cached data
                if (isCacheValid() && productsCache.length > 0) {
                    return productsCache;
                }
            }

            try {
                setIsLoading(true);
                setError(null);

                console.log("🔄 Cargando productos frescos desde la API...");

                // Load products and stock data in parallel
                const [allProducts, stockMap] = await Promise.all([
                    inventoryService.getAllProducts({}, authToken),
                    inventoryService.getStockMap(authToken).catch(() => ({})), // Fallback to empty object on error
                ]);

                console.log(`✅ Loaded ${allProducts.length} products from API`);
                console.log(
                    `✅ Loaded stock data for ${
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

                const currentTime = Date.now();

                // Update state
                setProductsCache(enrichedProducts);
                setLastFetch(currentTime);
                setIsInitialized(true);

                // 🚀 Guardar en localStorage
                guardarCacheProductosEnStorage({
                    products: enrichedProducts,
                    lastFetch: currentTime,
                });

                return enrichedProducts;
            } catch (error) {
                console.error("❌ Error loading products:", error);
                setError(error.message || "Error al cargar productos");
                
                // Try to return data from persistent cache on error
                const cacheFromStorage = cargarCacheProductosDesdeStorage();
                if (cacheFromStorage) {
                    console.log("⚠️ Error en API, usando cache persistente como fallback");
                    setProductsCache(cacheFromStorage.products);
                    setLastFetch(cacheFromStorage.lastFetch);
                    setIsInitialized(true);
                    return cacheFromStorage.products;
                }

                return productsCache; // Return memory cached data on error
            } finally {
                setIsLoading(false);
            }
        },
        [authToken, productsCache, isCacheValid, cargarCacheProductosDesdeStorage, guardarCacheProductosEnStorage]
    );

    // Search products in cache
    const searchProducts = useCallback(
        (searchTerm) => {
            if (!searchTerm || searchTerm.length < 2) {
                return [];
            }

            const term = searchTerm.toLowerCase().trim();

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
            let updated;
            if (exists) {
                // Update existing product
                updated = prev.map((product) =>
                    product.id === newProduct.id ? newProduct : product
                );
            } else {
                // Add new product and sort by name
                updated = [...prev, newProduct];
                updated = updated.sort((a, b) =>
                    (a.name || "").localeCompare(b.name || "")
                );
            }

            // 🚀 Actualizar cache persistente
            guardarCacheProductosEnStorage({
                products: updated,
                lastFetch: Date.now(),
            });

            return updated;
        });
    }, [guardarCacheProductosEnStorage]);

    // Update product in cache
    const updateProductInCache = useCallback((updatedProduct) => {
        setProductsCache((prev) => {
            const updated = prev
                .map((product) =>
                    product.id === updatedProduct.id ? updatedProduct : product
                )
                .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

            // 🚀 Actualizar cache persistente
            guardarCacheProductosEnStorage({
                products: updated,
                lastFetch: Date.now(),
            });

            return updated;
        });
    }, [guardarCacheProductosEnStorage]);

    // Remove product from cache
    const removeProductFromCache = useCallback((productId) => {
        setProductsCache((prev) => {
            const updated = prev.filter((product) => product.id !== productId);

            // 🚀 Actualizar cache persistente
            guardarCacheProductosEnStorage({
                products: updated,
                lastFetch: Date.now(),
            });

            return updated;
        });
    }, [guardarCacheProductosEnStorage]);

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

    // 🚀 Cargar cache persistente al inicializar
    useEffect(() => {
        if (!isInitialized) {
            const cacheFromStorage = cargarCacheProductosDesdeStorage();
            if (cacheFromStorage && cacheFromStorage.isValid) {
                console.log("🚀 Inicializando con cache persistente de productos");
                setProductsCache(cacheFromStorage.products);
                setLastFetch(cacheFromStorage.lastFetch);
                setIsInitialized(true);
            }
        }
    }, [isInitialized, cargarCacheProductosDesdeStorage]);

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

        // 🚀 Cache management functions
        clearCache: limpiarCacheProductosStorage,
        loadFromStorage: cargarCacheProductosDesdeStorage,
        saveToStorage: guardarCacheProductosEnStorage,

        // Utils
        isCacheValid,
    };

    return (
        <ProductsContext.Provider value={value}>
            {children}
        </ProductsContext.Provider>
    );
};
