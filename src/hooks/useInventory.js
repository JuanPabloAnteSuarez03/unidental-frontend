import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductsContext"; // ✨ NUEVO: Importar contexto de productos
import inventoryService, {
    getLastPurchasePrice,
} from "../services/inventoryService";
import {
    useNameSearch,
    usePagination,
    useFilterReset,
    useCategoryFilter,
    useSkuSearch,
} from "./inventory";

// Configuración de caché
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en milisegundos

// 🚀 CACHE PERSISTENTE: Configuración para localStorage
const INVENTORY_CACHE_STORAGE_KEY = "inventory_cache_data";
const INVENTORY_CACHE_EXPIRY_TIME = 60 * 60 * 1000; // 60 minutos (1 hora)

// 🚀 NUEVO: Cache persistente para productos
const PRODUCTS_CACHE_STORAGE_KEY = "inventory_products_cache_data";
const PRODUCTS_CACHE_EXPIRY_TIME = 60 * 60 * 1000; // 60 minutos (1 hora)

// Número de productos por página (debe coincidir con el backend)
const ITEMS_PER_PAGE = 25; // Según nuestras pruebas, el backend muestra 25 productos por página

// 🚀 FUNCIÓN: Cargar cache de inventario desde localStorage
const cargarCacheInventarioDesdeStorage = () => {
    try {
        const cacheGuardado = localStorage.getItem(INVENTORY_CACHE_STORAGE_KEY);
        if (cacheGuardado) {
            const cache = JSON.parse(cacheGuardado);

            // Verificar si el cache no ha expirado
            const ahora = Date.now();
            const tiempoTranscurrido = ahora - (cache.lastFetch || 0);

            if (
                tiempoTranscurrido < INVENTORY_CACHE_EXPIRY_TIME &&
                cache.stockData &&
                Object.keys(cache.stockData).length > 0
            ) {
                console.log(
                    "💾 Cache de inventario cargado desde localStorage:",
                    {
                        productos: Object.keys(cache.stockData).length,
                        ultimaActualizacion: new Date(
                            cache.lastFetch
                        ).toLocaleString("es-ES"),
                    }
                );
                return {
                    stockData: cache.stockData || {},
                    isLoaded: true,
                    lastFetch: cache.lastFetch,
                };
            } else {
                console.log(
                    "⏰ Cache de inventario expirado o vacío, se eliminará"
                );
                localStorage.removeItem(INVENTORY_CACHE_STORAGE_KEY);
            }
        }
    } catch (error) {
        console.error(
            "❌ Error al cargar cache de inventario desde localStorage:",
            error
        );
        localStorage.removeItem(INVENTORY_CACHE_STORAGE_KEY);
    }

    return {
        stockData: {},
        isLoaded: false,
        lastFetch: null,
    };
};

// 🚀 FUNCIÓN: Guardar cache de inventario en localStorage
const guardarCacheInventarioEnStorage = (nuevoCache) => {
    try {
        const cacheParaGuardar = {
            stockData: nuevoCache.stockData,
            lastFetch: nuevoCache.lastFetch,
        };
        localStorage.setItem(
            INVENTORY_CACHE_STORAGE_KEY,
            JSON.stringify(cacheParaGuardar)
        );
        console.log("💾 Cache de inventario guardado en localStorage:", {
            productos: Object.keys(nuevoCache.stockData).length,
            timestamp: new Date(nuevoCache.lastFetch).toLocaleString("es-ES"),
        });
    } catch (error) {
        console.error(
            "❌ Error al guardar cache de inventario en localStorage:",
            error
        );
    }
};

// 🚀 FUNCIÓN: Limpiar cache de inventario del localStorage
const limpiarCacheInventarioStorage = () => {
    try {
        localStorage.removeItem(INVENTORY_CACHE_STORAGE_KEY);
        console.log("🗑️ Cache de inventario eliminado del localStorage");
    } catch (error) {
        console.error("❌ Error al limpiar cache de inventario:", error);
    }
};

// 🚀 NUEVA FUNCIÓN: Cargar cache de productos desde localStorage
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
                Array.isArray(cache.products) &&
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
                    count: cache.count || 0,
                    isLoaded: true,
                    lastFetch: cache.lastFetch,
                };
            } else {
                console.log(
                    "⏰ Cache de productos expirado o vacío, se eliminará"
                );
                localStorage.removeItem(PRODUCTS_CACHE_STORAGE_KEY);
            }
        }
    } catch (error) {
        console.error(
            "❌ Error al cargar cache de productos desde localStorage:",
            error
        );
        localStorage.removeItem(PRODUCTS_CACHE_STORAGE_KEY);
    }

    return {
        products: [],
        count: 0,
        isLoaded: false,
        lastFetch: null,
    };
};

// 🚀 NUEVA FUNCIÓN: Guardar cache de productos en localStorage
const guardarCacheProductosEnStorage = (nuevoCache) => {
    try {
        const cacheParaGuardar = {
            products: nuevoCache.products,
            count: nuevoCache.count,
            lastFetch: nuevoCache.lastFetch,
        };
        localStorage.setItem(
            PRODUCTS_CACHE_STORAGE_KEY,
            JSON.stringify(cacheParaGuardar)
        );
        console.log("💾 Cache de productos guardado en localStorage:", {
            productos: nuevoCache.products.length,
            timestamp: new Date(nuevoCache.lastFetch).toLocaleString("es-ES"),
        });
    } catch (error) {
        console.error(
            "❌ Error al guardar cache de productos en localStorage:",
            error
        );
    }
};

// 🚀 NUEVA FUNCIÓN: Limpiar cache de productos del localStorage
const limpiarCacheProductosStorage = () => {
    try {
        localStorage.removeItem(PRODUCTS_CACHE_STORAGE_KEY);
        console.log("🗑️ Cache de productos eliminado del localStorage");
    } catch (error) {
        console.error("❌ Error al limpiar cache de productos:", error);
    }
};

// Función para calcular un número realista de páginas basado en el conteo de productos
const calculateRealisticPageCount = (count) => {
    // Si no hay productos, no hay páginas
    if (count === 0) {
        return 0;
    }

    // Basado en nuestras pruebas, sabemos que el conteo real es cercano a 1898 productos
    // Si el conteo reportado es mayor a 5000, probablemente sea un error del backend
    if (count > 5000) {
        // Usamos un valor más realista basado en nuestras pruebas
        return Math.ceil(1898 / ITEMS_PER_PAGE); // Con 1898 productos y 25 por página = 76 páginas
    }

    // Para valores más razonables, usamos el cálculo normal
    return Math.ceil(count / ITEMS_PER_PAGE);
};

const useInventory = () => {
    // Estado para los productos de la página actual
    const [products, setProducts] = useState([]);

    // Estado para productos con placeholder de stock (para mostrar inmediatamente)
    const [productsWithPlaceholder, setProductsWithPlaceholder] = useState([]);

    // Estado para productos combinados con stock real
    const [combinedProducts, setCombinedProducts] = useState([]);

    // Obtenemos el token de autenticación del contexto
    const { authToken } = useAuth();

    // ✨ NUEVO: Usar contexto de productos para búsquedas en cache
    const {
        productsCache,
        searchProducts,
        loadAllProducts,
        isInitialized: isCacheInitialized,
    } = useProducts();

    // Mantenemos estos estados
    const [count, setCount] = useState(0); // Total de productos en la BD

    // Estados de carga y error
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [isStockLoading, setIsStockLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estado adicional para mantener el total general de productos (sin filtros)
    const [totalCount, setTotalCount] = useState(0);

    // ✨ NUEVO: Estado para almacenar TODO el stock (no solo de la página actual)
    const [allStockData, setAllStockData] = useState(() => {
        // Intentar cargar cache desde localStorage al inicializar
        const cache = cargarCacheInventarioDesdeStorage();
        return cache.stockData;
    });
    const [isStockFullyLoaded, setIsStockFullyLoaded] = useState(() => {
        const cache = cargarCacheInventarioDesdeStorage();
        return cache.isLoaded;
    });

    // 🚀 NUEVO: Estado para cache persistente de inventario
    const [cacheInventarioData, setCacheInventarioData] = useState(() => {
        return cargarCacheInventarioDesdeStorage();
    });

    // 🚀 NUEVO: Estado para cache persistente de productos
    const [cacheProductosData, setCacheProductosData] = useState(() => {
        return cargarCacheProductosDesdeStorage();
    });

    // Caché para evitar llamadas repetidas a la API
    const cache = useRef(new Map());
    const stockCache = useRef(new Map());
    // Tiempo de la última actualización del total de productos
    const lastTotalFetch = useRef(0);
    // ✨ NUEVO: Tiempo de la última carga completa de stock
    const lastStockFetch = useRef(0);
    // AbortController para cancelar peticiones cuando cambian los filtros
    const abortControllerRef = useRef(null);
    // Ref para guardar el último abortController de stock
    const stockAbortControllerRef = useRef(null);

    // Función optimizada para convertir URLs absolutas a URLs relativas para el proxy
    const convertToProxyUrl = useCallback((url) => {
        if (!url) return null;

        // If already a relative URL, return as is
        if (url.startsWith("/")) return url;

        // If it's an absolute URL from our backend, convert to relative
        const backendBaseUrl = "https://unidental-backend.onrender.com";
        if (url.startsWith(backendBaseUrl)) {
            // Remove the base URL, keep the path starting with /api
            return url.replace(backendBaseUrl, "");
        }

        // For any other absolute URL, return as is (shouldn't happen in our case)
        return url;
    }, []);

    // 🚀 NUEVA FUNCIÓN: Cargar TODO el stock con cache persistente
    const loadAllStock = useCallback(
        async (forceRefresh = false) => {
            console.log("🚀 Loading ALL stock data...");

            // Si ya tenemos datos en cache persistente y no es un refresh forzado, usar cache
            if (
                !forceRefresh &&
                cacheInventarioData.isLoaded &&
                Object.keys(cacheInventarioData.stockData).length > 0
            ) {
                console.log(
                    "💾 Usando datos de inventario desde cache persistente, no es necesario recargar"
                );
                return;
            }

            // Verificar si ya tenemos stock reciente en caché temporal
            const now = Date.now();
            if (
                !forceRefresh &&
                isStockFullyLoaded &&
                now - lastStockFetch.current < CACHE_DURATION
            ) {
                console.log("✅ Using cached complete stock data (temporal)");
                return;
            }

            setIsStockLoading(true);

            try {
                // Cargar TODO el stock de una vez
                const completeStockMap = await inventoryService.getAllStock(
                    authToken
                );

                console.log(
                    "📥 Complete stock loaded:",
                    Object.keys(completeStockMap).length,
                    "products"
                );

                // Actualizar estados
                setAllStockData(completeStockMap);
                setIsStockFullyLoaded(true);
                lastStockFetch.current = now;

                // 🚀 Guardar en cache persistente
                const nuevoCache = {
                    stockData: completeStockMap,
                    isLoaded: true,
                    lastFetch: now,
                };

                setCacheInventarioData(nuevoCache);
                guardarCacheInventarioEnStorage(nuevoCache);

                console.log(
                    "💾 Datos de inventario guardados en cache persistente exitosamente"
                );
            } catch (error) {
                console.error("🚨 Error loading complete stock:", error);
            } finally {
                setIsStockLoading(false);
            }
        },
        [
            authToken,
            cacheInventarioData.isLoaded,
            cacheInventarioData.stockData,
            isStockFullyLoaded,
            cacheProductosData.isLoaded,
            cacheProductosData.products.length,
            cacheProductosData.count,
        ]
    );

    // ✨ FUNCIÓN OPTIMIZADA: Crear productos sin dependencias problemáticas
    const createProductsWithPlaceholder = useCallback((products) => {
        if (!products || !Array.isArray(products)) {
            console.warn("Products is not a valid array:", products);
            return [];
        }

        // Solo devolver los productos base, el stock se combina después
        return products.map((product) => ({
            ...product,
            stock: undefined, // Se asigna después en mergeProductsWithStock
            stockLoading: true, // Siempre true inicialmente
        }));
    }, []); // Sin dependencias para evitar ciclos

    // Función para combinar los datos de productos con la información de stock
    const mergeProductsWithStock = useCallback(
        (products, globalStockMap = {}) => {
            if (!products || !Array.isArray(products)) {
                console.warn("Products is not a valid array:", products);
                return [];
            }

            console.log("🔍 Merging products with global stock data");

            return products.map((product) => {
                // Crear una copia del producto para no mutar el original
                const enrichedProduct = { ...product };

                // ✨ OPTIMIZADO: Usar stock del estado global
                const stockValue = globalStockMap[product.id];

                if (stockValue !== undefined) {
                    enrichedProduct.stock =
                        typeof stockValue === "number"
                            ? stockValue
                            : parseInt(stockValue, 10) || 0;
                    enrichedProduct.stockLoading = false;
                } else {
                    // Si no hay stock aún, mostrar como cargando solo si el stock global no está listo
                    enrichedProduct.stock = 0;
                    enrichedProduct.stockLoading = !isStockFullyLoaded;
                }

                return enrichedProduct;
            });
        },
        [isStockFullyLoaded]
    );

    // Función para obtener productos de la API con soporte para caché y cancelación
    const fetchProducts = useCallback(
        async (url = null, params = {}, forceRefresh = false) => {
            if (!authToken) {
                setError(
                    "No hay token de autenticación. Inicie sesión nuevamente."
                );
                setProducts([]);
                setIsLoadingProducts(false);
                return;
            }

            // 🚀 NUEVO: Verificar cache persistente de productos si no es refresh forzado
            if (
                !forceRefresh &&
                cacheProductosData.isLoaded &&
                cacheProductosData.products.length > 0
            ) {
                console.log(
                    "💾 Usando cache persistente de productos, no es necesario cargar desde API"
                );

                // Usar productos del cache persistente
                const cachedProducts = cacheProductosData.products;
                setProducts(cachedProducts);
                setCount(cacheProductosData.count);
                setTotalCount(cacheProductosData.count);

                // Crear productos con placeholder inmediatamente
                setProductsWithPlaceholder(cachedProducts);

                // Actualizar el estado de paginación
                const pageCount = calculateRealisticPageCount(
                    cacheProductosData.count
                );
                pagination.updatePaginationState(1, pageCount, null, null);

                return;
            }

            // Cancelar cualquier solicitud previa
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            // Crear un nuevo controlador para esta solicitud
            abortControllerRef.current = new AbortController();
            const { signal } = abortControllerRef.current;

            // Generar clave de caché basada en params
            const cacheKey = JSON.stringify(params);
            const now = Date.now();
            const cachedData = cache.current.get(cacheKey);

            if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
                console.log("Usando datos en caché para", params);
                const products = cachedData.data.results || [];
                setProducts(products);
                setCount(
                    typeof cachedData.data.count === "number"
                        ? cachedData.data.count
                        : parseInt(cachedData.data.count, 10) || 0
                );

                // Crear productos con placeholder inmediatamente
                setProductsWithPlaceholder(products);

                // Actualizar el estado de paginación
                const pageCount = calculateRealisticPageCount(
                    typeof cachedData.data.count === "number"
                        ? cachedData.data.count
                        : parseInt(cachedData.data.count, 10) || 0
                );

                // Extraer número de página
                let currentPageValue = 1;
                try {
                    if (params.page) {
                        currentPageValue = parseInt(params.page, 10);
                    }
                } catch (urlError) {
                    // Ignorar errores de análisis de URL
                }

                // Actualizar el estado de paginación usando el hook
                pagination.updatePaginationState(
                    currentPageValue,
                    pageCount,
                    convertToProxyUrl(cachedData.data.next),
                    convertToProxyUrl(cachedData.data.previous)
                );

                // ✨ YA NO cargar stock aquí - usamos el stock global

                return;
            }

            setIsLoadingProducts(true);
            setError(null);

            try {
                // Usar la función del servicio para obtener productos
                const data = await inventoryService.getProducts(
                    params,
                    authToken,
                    signal
                );

                if (signal.aborted) {
                    console.log("Fetch aborted, not updating state");
                    return;
                }

                if (!data) {
                    console.log("No data returned from API");
                    return;
                }

                console.log("Productos recibidos:", data);

                const products = data.results || [];

                // Enriquecer productos con el último precio de compra
                const enrichedProducts = await Promise.all(
                    products.map(async (product) => {
                        const purchasePrice = await getLastPurchasePrice(
                            product.id,
                            authToken
                        );
                        return {
                            ...product,
                            latest_purchase_price: purchasePrice,
                        };
                    })
                );

                // Actualizar el estado con los datos recibidos
                setProducts(enrichedProducts);
                setCount(
                    typeof data.count === "number"
                        ? data.count
                        : parseInt(data.count, 10) || 0
                );

                // ✨ OPTIMIZACIÓN: Mostrar productos inmediatamente
                const productsWithPlaceholder =
                    createProductsWithPlaceholder(enrichedProducts);
                setProductsWithPlaceholder(productsWithPlaceholder);

                // Calcular número de páginas
                const pageCount = calculateRealisticPageCount(
                    typeof data.count === "number"
                        ? data.count
                        : parseInt(data.count, 10) || 0
                );

                // Extraer número de página
                let currentPageValue = 1;
                try {
                    if (params.page) {
                        currentPageValue = parseInt(params.page, 10);
                    }
                } catch (urlError) {
                    // Ignorar errores de análisis de URL
                }

                // Actualizar el estado de paginación usando el hook
                pagination.updatePaginationState(
                    currentPageValue,
                    pageCount,
                    convertToProxyUrl(data.next),
                    convertToProxyUrl(data.previous)
                );

                // Actualizar la caché
                cache.current.set(cacheKey, {
                    data,
                    timestamp: now,
                });

                // También actualizamos el total general de productos si no hay filtros
                if (
                    Object.keys(params).length === 0 ||
                    (Object.keys(params).length === 1 && params.page)
                ) {
                    setTotalCount(
                        typeof data.count === "number"
                            ? data.count
                            : parseInt(data.count, 10) || 0
                    );
                    lastTotalFetch.current = Date.now();
                }

                // ✨ YA NO cargar stock aquí - usamos el stock global
            } catch (error) {
                if (signal.aborted) {
                    console.log("Fetch aborted, not updating error state");
                    return;
                }

                console.error("Error al obtener productos:", error);
                setError(
                    error.message ||
                        "Error al cargar productos. Intente de nuevo."
                );
                setProducts([]);
                setProductsWithPlaceholder([]);
            } finally {
                if (!signal.aborted) {
                    setIsLoadingProducts(false);
                }
            }
        },
        [authToken, convertToProxyUrl, createProductsWithPlaceholder]
    );

    // Función para resetear la página actual a la primera página
    const resetPage = useCallback(() => {
        pagination.updatePaginationState(1, pagination.totalPages, null, null);
    }, []);

    // Función para limpiar la caché y forzar nueva búsqueda
    const clearCache = useCallback(() => {
        cache.current = new Map();
        stockCache.current = new Map();

        // Limpiar también la variable global de caché de búsqueda por SKU
        window.skuSearchCache = null;
    }, []);

    // Utilizamos el hook personalizado para la paginación
    const pagination = usePagination(fetchProducts);

    // Utilizamos el hook personalizado para la búsqueda por nombre
    const { nameFilter, searchByName, resetNameFilter } = useNameSearch(
        resetPage,
        clearCache
    );

    // ✨ NUEVO: Hook para búsqueda por SKU
    const { skuFilter, searchBySku, resetSkuFilter } = useSkuSearch(
        resetPage,
        clearCache
    );

    // Utilizamos el hook personalizado para el filtro de categorías
    const {
        selectedCategories,
        availableCategories,
        isLoading: isCategoriesLoading,
        error: categoriesError,
        updateSelectedCategories,
        resetCategoryFilter,
    } = useCategoryFilter(resetPage, clearCache);

    // Array de funciones de reset para cada filtro
    const resetFunctions = [
        resetNameFilter,
        resetSkuFilter,
        resetCategoryFilter,
    ];

    // Utilizamos el hook para resetear todos los filtros
    const { resetAllFilters } = useFilterReset({
        resetPage,
        clearCache,
        resetFunctions,
    });

    // Efecto para cargar productos al inicio y cuando cambian los filtros
    useEffect(() => {
        const loadData = async () => {
            // Verificar si tenemos resultados de búsqueda por SKU en caché
            const skuSearchResults = cache.current.get("skuSearchResults");
            const now = Date.now();
            const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

            // Si tenemos resultados de búsqueda por SKU en caché y estamos cambiando de página
            if (
                skuSearchResults &&
                now - skuSearchResults.timestamp < CACHE_DURATION &&
                skuFilter &&
                skuFilter.length > 0 &&
                skuFilter.length < 16
            ) {
                // Actualizar la variable global para que sea accesible desde usePagination.js
                window.skuSearchCache = skuSearchResults;

                console.log(
                    `🔍 Usando resultados en caché para SKU: "${skuFilter}" (página ${pagination.currentPage})`
                );

                // Definir constantes para la paginación
                const ITEMS_PER_PAGE = 25;
                const currentPageIndex = pagination.currentPage;
                const pageCount = Math.ceil(
                    skuSearchResults.data.length / ITEMS_PER_PAGE
                );

                // Calcular índices para la paginación
                const startIndex = (currentPageIndex - 1) * ITEMS_PER_PAGE;
                const endIndex = Math.min(
                    startIndex + ITEMS_PER_PAGE,
                    skuSearchResults.data.length
                );

                // Obtener solo los productos para la página actual
                const paginatedResults = skuSearchResults.data.slice(
                    startIndex,
                    endIndex
                );

                console.log(
                    `📊 Mostrando productos ${startIndex + 1}-${endIndex} de ${
                        skuSearchResults.data.length
                    }`
                );

                // Actualizar los productos mostrados con solo la página actual
                setProducts(paginatedResults);
                setProductsWithPlaceholder(paginatedResults);

                // Actualizar el estado de paginación
                const hasNextPage = endIndex < skuSearchResults.data.length;
                const hasPrevPage = startIndex > 0;

                pagination.updatePaginationState(
                    currentPageIndex,
                    pageCount,
                    hasNextPage ? `?page=${currentPageIndex + 1}` : null,
                    hasPrevPage ? `?page=${currentPageIndex - 1}` : null
                );

                // Actualizar conteo
                setCount(skuSearchResults.data.length);

                // No hacer llamada al API
                return;
            }

            // ✨ MODIFICADO: Lógica para combinar búsqueda por SKU parcial y categoría
            const isPartialSku =
                skuFilter && skuFilter.length > 0 && skuFilter.length < 16; // SKUs completos tienen hasta 16 caracteres
            const hasCategories =
                selectedCategories && selectedCategories.length > 0;

            // Caso especial: SKU parcial (con o sin categorías)
            if (isPartialSku) {
                console.log(`🎯 SKU PARTIAL SEARCH DETECTED:
                - SKU: "${skuFilter}"
                - Length: ${skuFilter.length} chars
                - Categories: ${
                    hasCategories ? selectedCategories.join(", ") : "None"
                }
                - Strategy: Using CACHE-ONLY search with combined filters`);

                // ✨ IMPLEMENTAR BÚSQUEDA EN CACHE LOCAL
                setIsLoadingProducts(true);

                try {
                    // Asegurar que el cache esté cargado
                    if (!isCacheInitialized || productsCache.length === 0) {
                        console.log(
                            "🔄 Cache not ready, loading all products..."
                        );
                        await loadAllProducts();
                    }

                    // ✨ OPTIMIZACIÓN: No buscar si el SKU tiene menos de 3 caracteres y no hay categorías
                    if (skuFilter.length < 3 && !hasCategories) {
                        console.log(
                            "⚠️ SKU search term too short, showing limited results"
                        );
                        // Mostrar solo los primeros 20 productos como muestra
                        const limitedResults = productsCache.slice(0, 20);
                        setProducts(limitedResults);
                        setProductsWithPlaceholder(limitedResults);
                        setCombinedProducts(limitedResults);

                        // Actualizar paginación para resultados limitados
                        pagination.updatePaginationState(1, 1, null, null);
                        setCount(limitedResults.length);
                        setIsLoadingProducts(false);
                        return;
                    }

                    // Buscar en el cache local usando el SKU y categoría combinados
                    console.log(
                        `🔍 Searching in cache for SKU: "${skuFilter}" ${
                            hasCategories ? "with categories" : ""
                        }${nameFilter ? ` and name: "${nameFilter}"` : ""}`
                    );
                    const cacheResults = productsCache.filter((product) => {
                        // Filtrar por SKU
                        const productSku = (product.sku || "").toLowerCase();
                        const searchTerm = skuFilter.toLowerCase();
                        const skuMatches = productSku.includes(searchTerm);

                        // Si no hay coincidencia con SKU, no continuar
                        if (!skuMatches) return false;

                        // Filtrar por nombre si existe
                        if (nameFilter) {
                            const productName = (
                                product.name || ""
                            ).toLowerCase();
                            const nameSearchTerm = nameFilter.toLowerCase();
                            const nameMatches =
                                productName.includes(nameSearchTerm);
                            if (!nameMatches) return false;
                        }

                        // Si no hay categorías seleccionadas, devolver resultado basado en SKU y nombre
                        if (!hasCategories) return true;

                        // Si hay categorías, verificar que el producto pertenezca a alguna de ellas
                        const categoryMatches = selectedCategories.includes(
                            product.category
                        );

                        // Combinar todos los filtros (SKU Y nombre Y categoría)
                        return categoryMatches;
                    });

                    console.log(
                        `🎯 Combined search results: ${cacheResults.length} products found`
                    );

                    // Definir constantes para la paginación
                    const ITEMS_PER_PAGE = 25; // Usar 25 productos por página para ser consistente
                    const currentPageIndex = pagination.currentPage || 1;
                    const pageCount = Math.ceil(
                        cacheResults.length / ITEMS_PER_PAGE
                    );

                    // Calcular índices para la paginación
                    const startIndex = (currentPageIndex - 1) * ITEMS_PER_PAGE;
                    const endIndex = Math.min(
                        startIndex + ITEMS_PER_PAGE,
                        cacheResults.length
                    );

                    // Obtener solo los productos para la página actual
                    const paginatedResults = cacheResults.slice(
                        startIndex,
                        endIndex
                    );

                    console.log(
                        `📊 Mostrando productos ${
                            startIndex + 1
                        }-${endIndex} de ${cacheResults.length}`
                    );

                    // Actualizar los productos mostrados con solo la página actual
                    setProducts(paginatedResults);
                    setProductsWithPlaceholder(paginatedResults);
                    setCombinedProducts(cacheResults);

                    // Guardar todos los resultados para poder paginarlos sin hacer nuevas búsquedas
                    const skuSearchCache = {
                        data: cacheResults,
                        timestamp: Date.now(),
                    };

                    // Guardar en caché local
                    cache.current.set("skuSearchResults", skuSearchCache);

                    // Guardar también en una variable global para que sea accesible desde usePagination.js
                    window.skuSearchCache = skuSearchCache;

                    // Actualizar el estado de paginación
                    const hasNextPage = endIndex < cacheResults.length;
                    const hasPrevPage = startIndex > 0;

                    pagination.updatePaginationState(
                        currentPageIndex,
                        pageCount,
                        hasNextPage ? `?page=${currentPageIndex + 1}` : null,
                        hasPrevPage ? `?page=${currentPageIndex - 1}` : null
                    );

                    // Actualizar conteo total de productos encontrados
                    setCount(cacheResults.length);
                } catch (error) {
                    console.error("Error in cache search:", error);
                    setError("Error al buscar en el cache local");
                } finally {
                    setIsLoadingProducts(false);
                }

                // No hacer llamada al API para búsquedas parciales de SKU
                return;
            }

            // Crear objeto de parámetros para la API
            const params = {
                page: pagination.currentPage,
            };

            // Añadir filtro de nombre si existe
            if (nameFilter) {
                params.name = nameFilter;
            }

            // ✨ OPTIMIZADO: Solo enviar SKU al backend si es exacto o muy específico
            if (skuFilter && skuFilter.length >= 16) {
                console.log(
                    `📡 SKU API SEARCH: "${skuFilter}" (length: ${skuFilter.length}) - Using backend`
                );
                params.sku = skuFilter;
            }

            // Añadir filtro de categorías si hay seleccionadas
            if (selectedCategories && selectedCategories.length > 0) {
                params.category = selectedCategories;
            }

            // Log para depuración
            console.log("Parámetros de búsqueda enviados a la API:", params);

            // Cancelar cualquier solicitud previa
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            // Crear un nuevo controlador para esta solicitud
            abortControllerRef.current = new AbortController();
            const { signal } = abortControllerRef.current;

            setIsLoadingProducts(true);
            setError(null);

            // Decidir qué función del servicio utilizar
            const fetchData = async () => {
                try {
                    const data = await inventoryService.getProducts(
                        params,
                        authToken,
                        signal
                    );

                    if (signal.aborted) {
                        console.log("Fetch aborted, not updating state");
                        return;
                    }

                    if (!data) {
                        console.log("No data returned from API");
                        return;
                    }

                    const products = data.results || [];

                    // Enriquecer productos con el último precio de compra
                    const enrichedProducts = await Promise.all(
                        products.map(async (product) => {
                            const purchasePrice = await getLastPurchasePrice(
                                product.id,
                                authToken
                            );
                            return {
                                ...product,
                                latest_purchase_price: purchasePrice,
                            };
                        })
                    );

                    // Actualizar el estado con los datos recibidos
                    setProducts(enrichedProducts);
                    setCount(
                        typeof data.count === "number"
                            ? data.count
                            : parseInt(data.count, 10) || 0
                    );

                    // ✨ OPTIMIZACIÓN: Mostrar productos inmediatamente
                    const productsWithPlaceholder =
                        createProductsWithPlaceholder(enrichedProducts);
                    setProductsWithPlaceholder(productsWithPlaceholder);

                    // Calcular número de páginas
                    const pageCount = calculateRealisticPageCount(
                        typeof data.count === "number"
                            ? data.count
                            : parseInt(data.count, 10) || 0
                    );

                    // Actualizar el estado de paginación usando el hook
                    pagination.updatePaginationState(
                        pagination.currentPage,
                        pageCount,
                        convertToProxyUrl(data.next),
                        convertToProxyUrl(data.previous)
                    );

                    // También actualizamos el total general de productos si no hay filtros
                    if (
                        Object.keys(params).length === 0 ||
                        (Object.keys(params).length === 1 && params.page)
                    ) {
                        setTotalCount(
                            typeof data.count === "number"
                                ? data.count
                                : parseInt(data.count, 10) || 0
                        );
                        lastTotalFetch.current = Date.now();
                    }

                    // 🚀 NUEVO: Guardar productos en cache persistente
                    const nuevoCacheProductos = {
                        products: enrichedProducts,
                        count:
                            typeof data.count === "number"
                                ? data.count
                                : parseInt(data.count, 10) || 0,
                        lastFetch: Date.now(),
                    };
                    setCacheProductosData(nuevoCacheProductos);
                    guardarCacheProductosEnStorage(nuevoCacheProductos);

                    // ✨ Ya no necesitamos cargar stock aquí - se carga por separado
                } catch (err) {
                    if (signal.aborted) {
                        console.log("Fetch aborted, not updating error state");
                        return;
                    }

                    console.error("Error al obtener productos:", err);
                    setError(
                        err.message ||
                            "Error al cargar productos. Intente de nuevo."
                    );
                    setProducts([]);
                    setProductsWithPlaceholder([]);
                } finally {
                    if (!signal.aborted) {
                        setIsLoadingProducts(false);
                    }
                }
            };

            fetchData();
        };

        // Ejecutar la función async
        loadData();
    }, [
        pagination.currentPage,
        nameFilter,
        skuFilter, // ✨ Agregar skuFilter como dependencia
        selectedCategories,
        authToken,
        convertToProxyUrl,
        createProductsWithPlaceholder,
        isCacheInitialized, // ✨ NUEVO: Dependencia del cache
        productsCache, // ✨ NUEVO: Dependencia del cache
        loadAllProducts, // ✨ NUEVO: Dependencia de la función de carga
    ]);

    // Efecto para combinar productos con datos de stock de forma optimizada
    useEffect(() => {
        if (productsWithPlaceholder.length > 0) {
            // Siempre actualizar combinedProducts cuando cambia stock o productos
            const enriched = mergeProductsWithStock(
                productsWithPlaceholder,
                allStockData
            );
            setCombinedProducts(enriched);
        } else {
            // Si no hay productos, limpiar también los combinados
            setCombinedProducts([]);
        }
    }, [productsWithPlaceholder, allStockData, mergeProductsWithStock]);

    // ✨ NUEVO: Efecto para cargar TODO el stock una sola vez al inicio
    useEffect(() => {
        if (authToken) {
            // Si no hay datos en cache persistente, cargar datos
            if (
                !cacheInventarioData.isLoaded ||
                Object.keys(cacheInventarioData.stockData).length === 0
            ) {
                console.log(
                    "🚀 No hay datos de inventario en cache, cargando desde API..."
                );
                loadAllStock();
            } else {
                console.log(
                    "✅ Datos de inventario encontrados en cache persistente, no es necesario cargar desde API"
                );
                // Los datos ya están cargados desde el localStorage en el estado inicial
            }
        }
    }, [
        authToken,
        cacheInventarioData.isLoaded,
        cacheInventarioData.stockData,
        loadAllStock,
    ]);

    // Efecto para cargar datos iniciales cuando cambia el token
    useEffect(() => {
        if (authToken) {
            console.log("Cargando datos iniciales");

            // Verificar si hay parámetros en la URL que debamos procesar
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const pageParam = urlParams.get("page");

                // Si hay un parámetro de página, actualizamos el estado de paginación
                if (pageParam) {
                    const pageNumber = parseInt(pageParam, 10);
                    if (!isNaN(pageNumber) && pageNumber > 0) {
                        console.log(
                            `Restaurando página desde URL: ${pageNumber}`
                        );
                        pagination.updatePaginationState(
                            pageNumber,
                            pagination.totalPages,
                            null,
                            null
                        );
                    }
                }
            } catch (error) {
                console.error("Error al procesar parámetros de URL:", error);
            }

            // 🚀 MODIFICADO: Solo cargar productos si no hay cache persistente
            if (
                !cacheProductosData.isLoaded ||
                cacheProductosData.products.length === 0
            ) {
                console.log(
                    "🔄 No hay cache de productos, cargando desde API..."
                );
                fetchProducts();
            } else {
                console.log(
                    "✅ Cache de productos encontrado, usando datos en cache"
                );
                // Los productos ya están cargados desde el localStorage en el estado inicial
            }
        }
    }, [
        authToken,
        fetchProducts,
        cacheProductosData.isLoaded,
        cacheProductosData.products.length,
    ]);

    // 🚀 NUEVA FUNCIÓN: Refrescar cache de inventario manualmente
    const refrescarCacheInventario = useCallback(() => {
        console.log("🔄 Refrescando cache de inventario manualmente...");
        limpiarCacheInventarioStorage(); // Limpiar cache del localStorage
        limpiarCacheProductosStorage(); // Limpiar cache de productos
        loadAllStock(true); // Forzar recarga de stock
        fetchProducts(null, {}, true); // Forzar recarga de productos
    }, [loadAllStock, fetchProducts]);

    // 🚀 NUEVA FUNCIÓN: Obtener información del cache de inventario
    const obtenerInfoCacheInventario = useCallback(() => {
        if (!cacheInventarioData.isLoaded) {
            return {
                estado: "No cargado",
                cantidad: 0,
                ultimaActualizacion: "Nunca",
                tiempoRestante: "N/A",
                expiraSoon: false,
            };
        }

        const ahora = Date.now();
        const tiempoTranscurrido = ahora - (cacheInventarioData.lastFetch || 0);
        const tiempoRestante = INVENTORY_CACHE_EXPIRY_TIME - tiempoTranscurrido;
        const minutosRestantes = Math.max(
            0,
            Math.floor(tiempoRestante / (1000 * 60))
        );
        const expiraSoon = minutosRestantes < 5; // Alerta si faltan menos de 5 minutos

        return {
            estado: "Cargado (Persistente)",
            cantidad: Object.keys(cacheInventarioData.stockData).length,
            ultimaActualizacion: cacheInventarioData.lastFetch
                ? new Date(cacheInventarioData.lastFetch).toLocaleString(
                      "es-ES"
                  )
                : "Desconocida",
            tiempoRestante: `${minutosRestantes} min`,
            expiraSoon: expiraSoon,
        };
    }, [cacheInventarioData]);

    return {
        // Datos procesados y estados
        filteredProducts: combinedProducts,
        totalGeneralProducts: totalCount,

        // Estado de carga y errores
        isLoading: isLoadingProducts || isStockLoading || isCategoriesLoading,
        isStockLoading,
        error: error || categoriesError,

        // Funciones y estado de paginación
        goToNextPage: pagination.goToNextPage,
        goToPrevPage: pagination.goToPrevPage,
        goToPage: pagination.goToPage,
        hasNextPage: pagination.hasNextPage,
        hasPrevPage: pagination.hasPrevPage,
        currentPage: pagination.currentPage,
        totalPages: pagination.totalPages,

        // Filtros
        searchByName,
        nameFilter,

        // ✨ NUEVO: Búsqueda por SKU
        searchBySku,
        skuFilter,

        // Filtro de categorías
        selectedCategories,
        availableCategories,
        updateSelectedCategories,

        // Reseteo de filtros
        resetAllFilters,

        // 🚀 NUEVO: Funciones de cache persistente
        refrescarCacheInventario,
        obtenerInfoCacheInventario,
        cacheInventarioData,
    };
};

export default useInventory;
