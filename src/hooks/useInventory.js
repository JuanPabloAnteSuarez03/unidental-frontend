import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductsContext"; // ✨ NUEVO: Importar contexto de productos
import inventoryService, {
    getLastPurchasePrice,
    getAllPurchasePricesOptimized,
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

// 🚀 NUEVO: Cache persistente para precios de compra
const PURCHASE_PRICES_CACHE_STORAGE_KEY =
    "inventory_purchase_prices_cache_data";
const PURCHASE_PRICES_CACHE_EXPIRY_TIME = 30 * 60 * 1000; // 30 minutos

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

// 🚀 NUEVA FUNCIÓN: Cargar cache de precios de compra desde localStorage
const cargarCachePreciosCompraDesdeStorage = () => {
    try {
        const cacheGuardado = localStorage.getItem(
            PURCHASE_PRICES_CACHE_STORAGE_KEY
        );
        if (cacheGuardado) {
            const cache = JSON.parse(cacheGuardado);

            // Verificar si el cache no ha expirado
            const ahora = Date.now();
            const tiempoTranscurrido = ahora - (cache.lastFetch || 0);

            console.log("🔍 Verificando caché de precios:", {
                tieneDatos: !!cache.pricesData,
                cantidadPrecios: Object.keys(cache.pricesData || {}).length,
                tiempoTranscurrido:
                    Math.round(tiempoTranscurrido / 1000 / 60) + " minutos",
                expirado:
                    tiempoTranscurrido >= PURCHASE_PRICES_CACHE_EXPIRY_TIME,
            });

            if (
                tiempoTranscurrido < PURCHASE_PRICES_CACHE_EXPIRY_TIME &&
                cache.pricesData &&
                Object.keys(cache.pricesData).length > 0
            ) {
                console.log(
                    "💾 Cache de precios de compra cargado desde localStorage:",
                    {
                        productos: Object.keys(cache.pricesData).length,
                        ultimaActualizacion: new Date(
                            cache.lastFetch
                        ).toLocaleString("es-ES"),
                    }
                );
                return {
                    pricesData: cache.pricesData || {},
                    isLoaded: true,
                    lastFetch: cache.lastFetch,
                };
            } else {
                console.log(
                    "⏰ Cache de precios de compra expirado o vacío, se eliminará"
                );
                localStorage.removeItem(PURCHASE_PRICES_CACHE_STORAGE_KEY);
            }
        } else {
            console.log("📭 No hay caché de precios guardado en localStorage");
        }
    } catch (error) {
        console.error(
            "❌ Error al cargar cache de precios de compra desde localStorage:",
            error
        );
        localStorage.removeItem(PURCHASE_PRICES_CACHE_STORAGE_KEY);
    }

    console.log("🆕 Inicializando caché de precios vacío");
    return {
        pricesData: {},
        isLoaded: false,
        lastFetch: null,
    };
};

// 🚀 FUNCIÓN: Guardar cache de precios de compra en localStorage
const guardarCachePreciosCompraEnStorage = (nuevoCache) => {
    try {
        const cacheParaGuardar = {
            pricesData: nuevoCache.pricesData,
            lastFetch: nuevoCache.lastFetch,
        };
        localStorage.setItem(
            PURCHASE_PRICES_CACHE_STORAGE_KEY,
            JSON.stringify(cacheParaGuardar)
        );
        console.log("💾 Cache de precios de compra guardado en localStorage:", {
            productos: Object.keys(nuevoCache.pricesData).length,
            timestamp: new Date(nuevoCache.lastFetch).toLocaleString("es-ES"),
        });
    } catch (error) {
        console.error(
            "❌ Error al guardar cache de precios de compra en localStorage:",
            error
        );
    }
};

// 🚀 FUNCIÓN: Limpiar cache de precios de compra del localStorage
const limpiarCachePreciosCompraStorage = () => {
    try {
        localStorage.removeItem(PURCHASE_PRICES_CACHE_STORAGE_KEY);
        console.log("🗑️ Cache de precios de compra eliminado del localStorage");
    } catch (error) {
        console.error("❌ Error al limpiar cache de precios de compra:", error);
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
    const [isPurchasePricesLoading, setIsPurchasePricesLoading] =
        useState(false);
    const [pricesUpdateTrigger, setPricesUpdateTrigger] = useState(0);
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

    // 🚀 NUEVO: Estado para cache persistente de precios de compra
    const [cachePreciosCompraData, setCachePreciosCompraData] = useState(() => {
        return cargarCachePreciosCompraDesdeStorage();
    });

    // Caché para evitar llamadas repetidas a la API
    const cache = useRef(new Map());
    const stockCache = useRef(new Map());
    // Tiempo de la última actualización del total de productos
    const lastTotalFetch = useRef(0);
    // ✨ NUEVO: Tiempo de la última carga completa de stock
    const lastStockFetch = useRef(0);
    // 🚀 NUEVO: Ref para controlar si ya se intentó cargar precios de compra
    const purchasePricesLoadAttempted = useRef(false);
    // AbortController para cancelar peticiones cuando cambian los filtros
    const abortControllerRef = useRef(null);
    // Ref para guardar el último abortController de stock
    const stockAbortControllerRef = useRef(null);
    // 🚀 NUEVO: Ref para detectar si es la primera carga del componente
    const isFirstLoad = useRef(true);

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

    // 🚀 OPTIMIZADA: Cargar precios de compra con UNA SOLA petición
    const loadAllPurchasePrices = useCallback(
        async (forceRefresh = false) => {
            console.log(
                "💰 Loading purchase prices with optimized single request..."
            );

            // Si ya se intentó cargar y no es un refresh forzado, no volver a intentar
            if (!forceRefresh && purchasePricesLoadAttempted.current) {
                console.log(
                    "💾 Precios de compra ya se intentaron cargar anteriormente, saltando..."
                );
                return cachePreciosCompraData.pricesData || {};
            }

            // Si ya tenemos datos en cache persistente y no es un refresh forzado, usar cache
            if (
                !forceRefresh &&
                cachePreciosCompraData.isLoaded &&
                Object.keys(cachePreciosCompraData.pricesData).length > 0
            ) {
                console.log(
                    "💾 Usando precios de compra desde cache persistente, no es necesario recargar"
                );
                purchasePricesLoadAttempted.current = true;
                return cachePreciosCompraData.pricesData;
            }

            try {
                setIsPurchasePricesLoading(true);
                // Marcar que se está intentando cargar
                purchasePricesLoadAttempted.current = true;

                // 🚀 NUEVA ESTRATEGIA: Obtener TODAS las opciones de compra vigentes
                console.log("🚀 Llamando a getAllPurchasePricesOptimized...");
                const pricesMap = await getAllPurchasePricesOptimized(
                    authToken
                ); // Sin límites, obtiene todo

                console.log(
                    `💰 Precios de compra cargados: ${
                        Object.keys(pricesMap).length
                    } productos con precios (optimizado)`
                );

                if (Object.keys(pricesMap).length === 0) {
                    console.warn(
                        "⚠️ No se obtuvieron precios de compra. Marcando como sin precios disponibles."
                    );

                    // Marcar que se intentó cargar pero no hay precios disponibles
                    const nuevoCache = {
                        pricesData: {},
                        isLoaded: true,
                        lastFetch: now,
                        isPartial: false,
                        noPricesAvailable: true, // Marcar que no hay precios disponibles
                    };

                    setCachePreciosCompraData(nuevoCache);
                    guardarCachePreciosCompraEnStorage(nuevoCache);

                    console.log(
                        "🛑 Carga de precios completada - no hay precios disponibles"
                    );
                    return {};
                } else {
                    console.log(
                        "✅ Precios obtenidos correctamente. Primeros 3:",
                        Object.entries(pricesMap).slice(0, 3)
                    );
                }

                // Guardar en cache persistente
                const now = Date.now();
                const nuevoCache = {
                    pricesData: pricesMap,
                    isLoaded: true,
                    lastFetch: now,
                    isPartial: false, // Carga completa de una vez
                    noPricesAvailable: false, // Hay precios disponibles
                };

                setCachePreciosCompraData(nuevoCache);
                guardarCachePreciosCompraEnStorage(nuevoCache);

                console.log(
                    "💾 Precios de compra guardados en cache persistente (carga optimizada)"
                );

                // Asegurar que el flag se actualice después de que los datos estén disponibles
                purchasePricesLoadAttempted.current = true;
                console.log(
                    "✅ Flag purchasePricesLoadAttempted actualizado a true"
                );

                // Disparar actualización de la UI
                setPricesUpdateTrigger((prev) => prev + 1);
                console.log("🔄 Trigger de actualización de precios disparado");

                return pricesMap;
            } catch (error) {
                console.error("🚨 Error loading purchase prices:", error);
                // Marcar como cargado aunque haya error para no volver a intentar
                const nuevoCache = {
                    pricesData: {},
                    isLoaded: true,
                    lastFetch: Date.now(),
                };
                setCachePreciosCompraData(nuevoCache);
                guardarCachePreciosCompraEnStorage(nuevoCache);
                return {};
            } finally {
                setIsPurchasePricesLoading(false);
            }
        },
        [
            authToken,
            cachePreciosCompraData.isLoaded,
            cachePreciosCompraData.pricesData,
        ]
    );

    // 🚀 NUEVA FUNCIÓN: Cargar precios de compra para productos específicos de la página actual
    const loadPurchasePricesForProducts = useCallback(
        async (productIds) => {
            if (!productIds || productIds.length === 0) {
                return {};
            }

            // Filtrar productos que ya tienen precios en caché
            const productosSinPrecio = productIds.filter(
                (id) => !cachePreciosCompraData.pricesData[id]
            );

            if (productosSinPrecio.length === 0) {
                console.log(
                    "✅ Todos los productos ya tienen precios en caché"
                );
                return cachePreciosCompraData.pricesData;
            }

            console.log(
                `💰 Cargando precios de compra para ${productosSinPrecio.length} productos sin precio...`
            );

            try {
                setIsPurchasePricesLoading(true);
                const pricesMap = {};
                let productosSinPrecioEncontrado = 0;
                let productosConPrecioEncontrado = 0;

                // Cargar precios en paralelo (batches para no sobrecargar)
                const BATCH_SIZE = 10; // Procesar 10 productos a la vez
                const batches = [];

                for (
                    let i = 0;
                    i < productosSinPrecio.length;
                    i += BATCH_SIZE
                ) {
                    const batch = productosSinPrecio.slice(i, i + BATCH_SIZE);
                    batches.push(batch);
                }

                // Procesar lotes en paralelo
                for (let i = 0; i < batches.length; i++) {
                    const batch = batches[i];
                    console.log(
                        `📦 Procesando lote ${i + 1}/${batches.length} con ${
                            batch.length
                        } productos`
                    );

                    const batchPromises = batch.map(async (productId) => {
                        try {
                            const price = await getLastPurchasePrice(
                                productId,
                                authToken
                            );
                            return { productId, price };
                        } catch (error) {
                            console.warn(
                                `⚠️ Error obteniendo precio para producto ${productId}:`,
                                error
                            );
                            return { productId, price: null };
                        }
                    });

                    const batchResults = await Promise.all(batchPromises);

                    // Agregar resultados al mapa y contar estadísticas
                    batchResults.forEach(({ productId, price }) => {
                        if (price !== null && price !== undefined) {
                            pricesMap[productId] = price;
                            productosConPrecioEncontrado++;
                        } else {
                            productosSinPrecioEncontrado++;
                        }
                    });

                    // 🚀 NUEVO: Detectar si no hay precios disponibles y detener la carga
                    if (
                        i === 0 &&
                        productosConPrecioEncontrado === 0 &&
                        productosSinPrecioEncontrado > 0
                    ) {
                        console.warn(
                            `⚠️ Primer lote sin precios encontrados (${productosSinPrecioEncontrado} productos sin precio). Deteniendo carga de precios.`
                        );

                        // Marcar que se intentó cargar pero no hay precios disponibles
                        const nuevoCache = {
                            pricesData: cachePreciosCompraData.pricesData,
                            isLoaded: true,
                            lastFetch: Date.now(),
                            noPricesAvailable: true, // Marcar que no hay precios disponibles
                        };

                        setCachePreciosCompraData(nuevoCache);
                        guardarCachePreciosCompraEnStorage(nuevoCache);

                        console.log(
                            "🛑 Carga de precios detenida - no hay precios disponibles"
                        );
                        return cachePreciosCompraData.pricesData;
                    }
                }

                console.log(
                    `✅ Precios de compra cargados: ${productosConPrecioEncontrado} con precio, ${productosSinPrecioEncontrado} sin precio`
                );

                // Si no se encontraron precios, marcar como cargado pero sin precios disponibles
                if (productosConPrecioEncontrado === 0) {
                    console.warn(
                        "⚠️ No se encontraron precios de compra para ningún producto. Marcando como sin precios disponibles."
                    );

                    const nuevoCache = {
                        pricesData: cachePreciosCompraData.pricesData,
                        isLoaded: true,
                        lastFetch: Date.now(),
                        noPricesAvailable: true, // Marcar que no hay precios disponibles
                    };

                    setCachePreciosCompraData(nuevoCache);
                    guardarCachePreciosCompraEnStorage(nuevoCache);

                    return cachePreciosCompraData.pricesData;
                }

                // Actualizar el cache persistente con los nuevos precios
                const updatedPricesData = {
                    ...cachePreciosCompraData.pricesData,
                    ...pricesMap,
                };

                const nuevoCache = {
                    pricesData: updatedPricesData,
                    isLoaded: true,
                    lastFetch: Date.now(),
                    noPricesAvailable: false, // Hay precios disponibles
                };

                console.log("💾 Guardando precios en caché:", {
                    preciosExistentes: Object.keys(
                        cachePreciosCompraData.pricesData
                    ).length,
                    preciosNuevos: Object.keys(pricesMap).length,
                    preciosTotales: Object.keys(updatedPricesData).length,
                    timestamp: new Date().toLocaleString("es-ES"),
                });

                setCachePreciosCompraData(nuevoCache);
                guardarCachePreciosCompraEnStorage(nuevoCache);

                // Verificar que se guardó correctamente
                setTimeout(() => {
                    const cacheVerificado = localStorage.getItem(
                        "inventory_purchase_prices_cache_data"
                    );
                    if (cacheVerificado) {
                        const parsed = JSON.parse(cacheVerificado);
                        console.log("✅ Verificación de caché guardado:", {
                            preciosEnStorage: Object.keys(
                                parsed.pricesData || {}
                            ).length,
                            coincideConEstado:
                                Object.keys(parsed.pricesData || {}).length ===
                                Object.keys(updatedPricesData).length,
                        });
                    } else {
                        console.error(
                            "❌ Error: El caché no se guardó en localStorage"
                        );
                    }
                }, 100);

                // Disparar actualización de la UI para productos de búsqueda
                setPricesUpdateTrigger((prev) => prev + 1);
                console.log(
                    "🔄 Trigger de actualización disparado para productos de búsqueda"
                );

                // Forzar una actualización inmediata de la UI
                setTimeout(() => {
                    console.log(
                        "⚡ Forzando actualización inmediata de la UI..."
                    );
                    setPricesUpdateTrigger((prev) => prev + 1);
                }, 100);

                return updatedPricesData; // Retornar todos los precios, no solo los nuevos
            } catch (error) {
                console.error(
                    "🚨 Error loading purchase prices for current page:",
                    error
                );
                return cachePreciosCompraData.pricesData; // Retornar caché existente en caso de error
            } finally {
                setIsPurchasePricesLoading(false);
            }
        },
        [authToken, cachePreciosCompraData.pricesData]
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
        (products, globalStockMap = {}, purchasePricesMap = {}) => {
            if (!products || !Array.isArray(products)) {
                console.warn("Products is not a valid array:", products);
                return [];
            }

            console.log(
                "🔍 Merging products with global stock and purchase prices data",
                {
                    productos: products.length,
                    preciosDisponibles: Object.keys(purchasePricesMap).length,
                    preciosCargados: purchasePricesLoadAttempted.current,
                }
            );

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
                    // 🔧 MEJORADO: Solo mostrar loading si realmente se está cargando
                    // No mostrar loading si ya se intentó cargar y simplemente no hay stock para este producto
                    enrichedProduct.stock = 0;
                    enrichedProduct.stockLoading =
                        !isStockFullyLoaded && isStockLoading;
                }

                // 🚀 NUEVO: Agregar precio de compra desde el caché
                const purchasePrice = purchasePricesMap[product.id];
                if (purchasePrice !== undefined && purchasePrice !== null) {
                    enrichedProduct.latest_purchase_price = purchasePrice;
                    enrichedProduct.purchasePriceLoading = false;
                } else {
                    // Si no hay precio en cache, verificar si ya se cargaron los precios
                    enrichedProduct.latest_purchase_price = null;

                    // 🔧 SIMPLIFICADO: Lógica más directa para evitar "Cargando..." falso
                    const preciosCargados = purchasePricesLoadAttempted.current;
                    const noHayPreciosDisponibles =
                        cachePreciosCompraData.noPricesAvailable;
                    const cargandoActualmente = isPurchasePricesLoading;

                    // Solo mostrar loading si:
                    // 1. Se están cargando precios AHORA, Y
                    // 2. No se han intentado cargar antes, Y
                    // 3. No se ha determinado que no hay precios
                    enrichedProduct.purchasePriceLoading =
                        cargandoActualmente &&
                        !preciosCargados &&
                        !noHayPreciosDisponibles;
                }

                return enrichedProduct;
            });
        },
        [isStockFullyLoaded, cachePreciosCompraData.noPricesAvailable]
    );

    // Función para obtener productos de la API con soporte para caché y cancelación
    const fetchProducts = useCallback(
        async (url = null, params = {}, forceRefresh = false) => {
            console.log(`🚀 fetchProducts llamado con:`, {
                url,
                params,
                forceRefresh,
                hasAuthToken: !!authToken,
            });

            if (!authToken) {
                setError(
                    "No hay token de autenticación. Inicie sesión nuevamente."
                );
                setProducts([]);
                setIsLoadingProducts(false);
                return;
            }

            // 🚀 MODIFICADO: Solo usar cache persistente si NO hay parámetros de página específica
            // Si se solicita una página específica, siempre hacer llamada al servidor
            const hasPageParam = params.page && parseInt(params.page, 10) > 1;
            const hasFilters =
                params.name ||
                params.sku ||
                (params.categories && params.categories.length > 0);

            if (
                !forceRefresh &&
                !hasPageParam && // NO usar cache si se solicita una página específica
                !hasFilters && // NO usar cache si hay filtros activos
                cacheProductosData.isLoaded &&
                cacheProductosData.products.length > 0
            ) {
                console.log(
                    "💾 Usando cache persistente de productos para página 1 (sin filtros)"
                );

                // Solo usar cache para la primera página sin filtros
                const cachedProducts = cacheProductosData.products;
                const ITEMS_PER_PAGE = 25;
                const startIndex = 0;
                const endIndex = ITEMS_PER_PAGE;
                const pageProducts = cachedProducts.slice(startIndex, endIndex);

                // Establecer solo los productos de la página actual
                setProducts(pageProducts);
                setCount(cacheProductosData.count);
                setTotalCount(cacheProductosData.count);

                // Crear productos con placeholder para la página actual
                setProductsWithPlaceholder(pageProducts);

                // Actualizar el estado de paginación
                const pageCount = calculateRealisticPageCount(
                    cacheProductosData.count
                );

                // Calcular si hay siguiente página
                const hasNext = endIndex < cachedProducts.length;

                pagination.updatePaginationState(1, pageCount);

                console.log(
                    `📄 Mostrando página 1 de ${pageCount} (${pageProducts.length} productos) desde cache`
                );
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

            // NO usar cache temporal si se solicita una página específica
            if (
                cachedData &&
                now - cachedData.timestamp < CACHE_DURATION &&
                !hasPageParam
            ) {
                console.log("💾 Usando datos en caché temporal para", params);
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
                pagination.updatePaginationState(currentPageValue, pageCount);

                // ✨ YA NO cargar stock aquí - usamos el stock global

                return;
            }

            setIsLoadingProducts(true);
            setError(null);

            // Log para indicar que se está haciendo llamada al servidor
            if (hasPageParam) {
                console.log(`🌐 Solicitando página ${params.page} al servidor`);
                console.log(
                    `📡 URL que se construirá: /api/catalogs/products/?page=${params.page}`
                );
            } else if (hasFilters) {
                console.log(`🔍 Solicitando productos filtrados al servidor`);
                console.log(`📡 Parámetros de filtro:`, params);
            } else {
                console.log(`🌐 Solicitando productos al servidor`);
                console.log(
                    `📡 URL que se construirá: /api/catalogs/products/`
                );
            }

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

                console.log(`✅ Datos recibidos del servidor:`, {
                    page: params.page || 1,
                    totalCount: data.count,
                    resultsCount: data.results?.length || 0,
                    next: data.next,
                    previous: data.previous,
                });

                const products = data.results || [];

                // Actualizar el estado con los datos recibidos
                setProducts(products);
                setCount(
                    typeof data.count === "number"
                        ? data.count
                        : parseInt(data.count, 10) || 0
                );

                // ✨ OPTIMIZACIÓN: Mostrar productos inmediatamente
                const productsWithPlaceholder =
                    createProductsWithPlaceholder(products);
                setProductsWithPlaceholder(productsWithPlaceholder);

                // 🚀 NUEVO: Cargar precios de compra para los productos de esta página
                const productIds = products.map((product) => product.id);

                // Verificar si hay filtros activos (búsqueda)
                const hayFiltrosActivos =
                    params.name ||
                    params.sku ||
                    (params.categories && params.categories.length > 0);

                // 🚀 MEJORADO: Cargar precios de forma más sincronizada
                const cargarPreciosParaProductos = async () => {
                    // 🚀 NUEVO: Verificar si ya se determinó que no hay precios disponibles
                    if (cachePreciosCompraData.noPricesAvailable) {
                        console.log(
                            "🛑 No se cargan precios - ya se determinó que no hay precios disponibles"
                        );
                        return;
                    }

                    if (hayFiltrosActivos) {
                        console.log(
                            "🔍 Búsqueda detectada, cargando precios específicos..."
                        );
                        // Para búsquedas, cargar precios inmediatamente
                        await loadPurchasePricesForProducts(productIds);
                    } else {
                        // Para navegación normal, verificar si faltan precios
                        console.log(
                            "📄 Navegación normal, verificando precios en caché..."
                        );
                        const productosSinPrecio = productIds.filter(
                            (id) => !cachePreciosCompraData.pricesData[id]
                        );

                        if (productosSinPrecio.length > 0) {
                            console.log(
                                `⚠️ ${productosSinPrecio.length} productos sin precio, cargando...`
                            );
                            await loadPurchasePricesForProducts(productIds);
                        } else {
                            console.log(
                                "✅ Todos los productos tienen precios en caché"
                            );
                        }
                    }
                };

                // Ejecutar carga de precios y esperar a que termine
                await cargarPreciosParaProductos();

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
                pagination.updatePaginationState(currentPageValue, pageCount);

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
        [
            authToken,
            convertToProxyUrl,
            createProductsWithPlaceholder,
            loadPurchasePricesForProducts,
        ]
    );

    // Función para resetear la página actual a la primera página
    const resetPage = useCallback(() => {
        pagination.updatePaginationState(1, pagination.totalPages);
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

    // Efecto para manejar cambios de página específicamente
    // REMOVIDO: Este efecto estaba interfiriendo con la paginación correcta
    // La paginación ahora se maneja directamente en el hook usePagination

    // Efecto para manejar paginación en búsquedas por SKU
    useEffect(() => {
        if (skuFilter && skuFilter.length > 0 && skuFilter.length < 16) {
            // La lógica de paginación para SKU ya está en el useEffect principal
            // Solo necesitamos disparar el efecto principal
        }
    }, [pagination.currentPage, skuFilter]);

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
                // ✨ IMPLEMENTAR BÚSQUEDA EN CACHE LOCAL
                setIsLoadingProducts(true);

                try {
                    // Asegurar que el cache esté cargado
                    if (!isCacheInitialized || productsCache.length === 0) {
                        await loadAllProducts();
                    }

                    // ✨ OPTIMIZACIÓN: No buscar si el SKU tiene menos de 3 caracteres y no hay categorías
                    if (skuFilter.length < 3 && !hasCategories) {
                        // Mostrar solo los primeros 20 productos como muestra
                        const limitedResults = productsCache.slice(0, 20);
                        setProducts(limitedResults);
                        setProductsWithPlaceholder(limitedResults);
                        setCombinedProducts(limitedResults);

                        // Actualizar paginación para resultados limitados
                        pagination.updatePaginationState(1, 1);
                        setCount(limitedResults.length);
                        setIsLoadingProducts(false);
                        return;
                    }

                    // Buscar en el cache local usando el SKU y categoría combinados

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
                        pageCount
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
                params.sku = skuFilter;
            }

            // Añadir filtro de categorías si hay seleccionadas
            if (selectedCategories && selectedCategories.length > 0) {
                params.category = selectedCategories;
            }

            // 🚀 NUEVO: Log para verificar paginación con filtros
            console.log("🔍 Paginación con filtros:", {
                pagina: pagination.currentPage,
                filtros: {
                    nombre: nameFilter,
                    sku: skuFilter,
                    categorias: selectedCategories,
                },
                parametros: params,
            });

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

                    // Actualizar el estado con los datos recibidos
                    setProducts(products);
                    setCount(
                        typeof data.count === "number"
                            ? data.count
                            : parseInt(data.count, 10) || 0
                    );

                    // ✨ OPTIMIZACIÓN: Mostrar productos inmediatamente
                    const productsWithPlaceholder =
                        createProductsWithPlaceholder(products);
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
                        pageCount
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
                        products: products,
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
        nameFilter,
        skuFilter, // ✨ Agregar skuFilter como dependencia
        selectedCategories,
        pagination.currentPage, // 🚀 NUEVO: Agregar currentPage como dependencia para que la paginación funcione con filtros
        authToken,
        convertToProxyUrl,
        createProductsWithPlaceholder,
        isCacheInitialized, // ✨ NUEVO: Dependencia del cache
        productsCache, // ✨ NUEVO: Dependencia del cache
        loadAllProducts, // ✨ NUEVO: Dependencia de la función de carga
    ]);

    // Efecto para combinar productos con datos de stock de forma optimizada
    useEffect(() => {
        console.log("🔄 useEffect de combinación ejecutado", {
            productos: productsWithPlaceholder.length,
            preciosDisponibles: Object.keys(cachePreciosCompraData.pricesData)
                .length,
            trigger: pricesUpdateTrigger,
        });

        if (productsWithPlaceholder.length > 0) {
            // 🔧 MEJORADO: Siempre actualizar cuando cambien los datos
            const enriched = mergeProductsWithStock(
                productsWithPlaceholder,
                allStockData,
                cachePreciosCompraData.pricesData
            );
            setCombinedProducts(enriched);
            console.log(
                "✅ Productos combinados actualizados:",
                enriched.length
            );

            // 🔧 NUEVO: Verificar si hay inconsistencias y corregirlas
            const productosConLoadingFalso = enriched.filter((p) => {
                const tieneStock = allStockData[p.id] !== undefined;
                const tienePrecio =
                    cachePreciosCompraData.pricesData[p.id] !== undefined;
                const stockCompleto = isStockFullyLoaded;
                const preciosCompletos =
                    purchasePricesLoadAttempted.current ||
                    cachePreciosCompraData.noPricesAvailable;

                return (
                    (tieneStock && p.stockLoading) ||
                    (tienePrecio && p.purchasePriceLoading) ||
                    (stockCompleto && !tieneStock && p.stockLoading) ||
                    (preciosCompletos && !tienePrecio && p.purchasePriceLoading)
                );
            });

            if (productosConLoadingFalso.length > 0) {
                console.log(
                    "🔧 Detectadas inconsistencias, re-procesando automáticamente..."
                );
                setTimeout(() => {
                    const reEnriched = mergeProductsWithStock(
                        productsWithPlaceholder,
                        allStockData,
                        cachePreciosCompraData.pricesData
                    );
                    setCombinedProducts(reEnriched);
                }, 100);
            }
        } else {
            // Si no hay productos, limpiar también los combinados
            setCombinedProducts([]);
        }
    }, [
        productsWithPlaceholder,
        allStockData,
        mergeProductsWithStock,
        cachePreciosCompraData.pricesData,
        purchasePricesLoadAttempted.current,
        pricesUpdateTrigger,
        isStockFullyLoaded, // 🔧 NUEVO: También reaccionar a cambios de stock completado
        isPurchasePricesLoading, // 🔧 NUEVO: Y a cambios en carga de precios
    ]);

    // 🚀 NUEVO: Efecto para cargar precios cuando cambian los productos
    useEffect(() => {
        if (productsWithPlaceholder.length > 0 && authToken) {
            const productIds = productsWithPlaceholder.map(
                (product) => product.id
            );

            // Verificar si hay productos sin precios
            const productosSinPrecio = productIds.filter(
                (id) => !cachePreciosCompraData.pricesData[id]
            );

            console.log("🔍 Verificando productos de la página actual:", {
                totalProductos: productIds.length,
                productosConPrecio:
                    productIds.length - productosSinPrecio.length,
                productosSinPrecio: productosSinPrecio.length,
                preciosEnCache: Object.keys(cachePreciosCompraData.pricesData)
                    .length,
            });

            if (productosSinPrecio.length > 0) {
                // 🚀 NUEVO: Verificar si ya se determinó que no hay precios disponibles
                if (cachePreciosCompraData.noPricesAvailable) {
                    console.log(
                        "🛑 No se cargan precios - ya se determinó que no hay precios disponibles"
                    );
                    return;
                }

                console.log(
                    `🔄 Detectados ${productosSinPrecio.length} productos sin precio, cargando...`
                );

                // Cargar precios de forma asíncrona pero sin bloquear la UI
                const cargarPrecios = async () => {
                    try {
                        await loadPurchasePricesForProducts(productIds);
                        console.log(
                            "✅ Precios cargados para productos de la página actual"
                        );
                    } catch (error) {
                        console.error(
                            "❌ Error cargando precios para productos actuales:",
                            error
                        );
                    }
                };

                cargarPrecios();
            } else {
                console.log(
                    "✅ Todos los productos de la página actual tienen precios"
                );
            }
        }
    }, [
        productsWithPlaceholder,
        authToken,
        cachePreciosCompraData.pricesData,
        loadPurchasePricesForProducts,
    ]);

    // 🚀 NUEVO: Efecto para verificar el estado del caché periódicamente
    useEffect(() => {
        const verificarCache = () => {
            const cacheGuardado = localStorage.getItem(
                "inventory_purchase_prices_cache_data"
            );
            if (cacheGuardado) {
                try {
                    const parsed = JSON.parse(cacheGuardado);
                    const preciosEnStorage = Object.keys(
                        parsed.pricesData || {}
                    ).length;
                    const preciosEnEstado = Object.keys(
                        cachePreciosCompraData.pricesData
                    ).length;

                    if (preciosEnStorage !== preciosEnEstado) {
                        console.warn(
                            "⚠️ Desincronización detectada en caché de precios:",
                            {
                                preciosEnStorage,
                                preciosEnEstado,
                                diferencia: preciosEnStorage - preciosEnEstado,
                            }
                        );

                        // Recargar desde localStorage si hay desincronización
                        const cacheRecargado =
                            cargarCachePreciosCompraDesdeStorage();
                        setCachePreciosCompraData(cacheRecargado);
                    }
                } catch (error) {
                    console.error("❌ Error verificando caché:", error);
                }
            }
        };

        // Verificar cada 30 segundos
        const interval = setInterval(verificarCache, 30000);

        return () => clearInterval(interval);
    }, [cachePreciosCompraData.pricesData]);

    // ✨ NUEVO: Efecto para cargar TODO el stock una sola vez al inicio
    useEffect(() => {
        if (authToken) {
            // Si no hay datos en cache persistente, cargar datos
            if (
                !cacheInventarioData.isLoaded ||
                Object.keys(cacheInventarioData.stockData).length === 0
            ) {
                loadAllStock();
            } else {
                // Los datos ya están cargados desde el localStorage en el estado inicial
            }
        }
    }, [
        authToken,
        cacheInventarioData.isLoaded,
        cacheInventarioData.stockData,
        loadAllStock,
    ]);

    // 🚀 NUEVO: Efecto para cargar precios de compra una sola vez al inicio
    useEffect(() => {
        if (authToken) {
            // 🚀 NUEVO: Verificar si ya se determinó que no hay precios disponibles
            if (cachePreciosCompraData.noPricesAvailable) {
                console.log(
                    "🛑 No se cargan precios al inicio - ya se determinó que no hay precios disponibles"
                );
                purchasePricesLoadAttempted.current = true;
                return;
            }

            // Solo cargar si no se ha intentado antes y no hay datos en cache
            if (
                !purchasePricesLoadAttempted.current &&
                !cachePreciosCompraData.isLoaded
            ) {
                loadAllPurchasePrices();
            } else if (cachePreciosCompraData.isLoaded) {
                // Si ya está cargado, marcar como intentado
                purchasePricesLoadAttempted.current = true;
            }
        }
    }, [
        authToken,
        cachePreciosCompraData.isLoaded,
        cachePreciosCompraData.noPricesAvailable,
        loadAllPurchasePrices,
    ]);

    // 🚀 NUEVO: Ref para detectar si el usuario regresa a la página
    const hasReturnedToPage = useRef(false);

    // 🚀 NUEVO: Función para guardar el estado de los filtros en localStorage
    const saveFiltersState = useCallback(() => {
        const filtersState = {
            nameFilter,
            skuFilter,
            selectedCategories,
            timestamp: Date.now(),
        };
        localStorage.setItem(
            "inventory_filters_state",
            JSON.stringify(filtersState)
        );
    }, [nameFilter, skuFilter, selectedCategories]);

    // 🚀 NUEVO: Función para cargar el estado de los filtros desde localStorage
    const loadFiltersState = useCallback(() => {
        try {
            const savedState = localStorage.getItem("inventory_filters_state");
            if (savedState) {
                const filtersState = JSON.parse(savedState);
                const now = Date.now();
                const timeDiff = now - filtersState.timestamp;

                // Si han pasado menos de 5 minutos, considerar que el usuario regresó
                if (timeDiff < 5 * 60 * 1000) {
                    hasReturnedToPage.current = true;
                    console.log(
                        "🔄 Detectado regreso a la página con filtros activos"
                    );
                }
            }
        } catch (error) {
            console.error("Error al cargar estado de filtros:", error);
        }
    }, []);

    // 🚀 NUEVO: Efecto para manejar el evento beforeunload
    useEffect(() => {
        const handleBeforeUnload = () => {
            const hayFiltrosActivos =
                !!nameFilter ||
                !!skuFilter ||
                (selectedCategories && selectedCategories.length > 0);

            if (hayFiltrosActivos) {
                saveFiltersState();
            }
        };

        window.addEventListener("beforeunload", handleBeforeUnload);

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [saveFiltersState]);

    // 🚀 NUEVO: Efecto para cargar el estado de filtros al montar el componente
    useEffect(() => {
        loadFiltersState();
    }, [loadFiltersState]);

    // Efecto para cargar datos iniciales cuando cambia el token
    useEffect(() => {
        if (authToken) {
            // Verificar si hay parámetros en la URL que debamos procesar
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const pageParam = urlParams.get("page");

                // Si hay un parámetro de página, actualizamos el estado de paginación
                if (pageParam) {
                    const pageNumber = parseInt(pageParam, 10);
                    if (!isNaN(pageNumber) && pageNumber > 0) {
                        pagination.updatePaginationState(
                            pageNumber,
                            pagination.totalPages
                        );
                    }
                }
            } catch (error) {
                console.error("Error al procesar parámetros de URL:", error);
            }

            // 🚀 NUEVO: Detectar si el usuario regresa a la página con filtros activos
            const hayFiltrosActivos =
                !!nameFilter ||
                !!skuFilter ||
                (selectedCategories && selectedCategories.length > 0);

            // Verificar si el usuario regresa a la página con filtros activos
            if (
                hasReturnedToPage.current &&
                hayFiltrosActivos &&
                cacheProductosData.isLoaded &&
                cacheProductosData.products.length > 0
            ) {
                console.log(
                    "🔄 Usuario regresó a la página con filtros activos, reseteando filtros..."
                );

                // Resetear filtros individualmente
                resetNameFilter();
                resetSkuFilter();
                resetCategoryFilter();

                // Limpiar el flag de regreso
                hasReturnedToPage.current = false;

                // Limpiar el estado guardado en localStorage
                localStorage.removeItem("inventory_filters_state");

                // Cargar productos sin filtros desde cache
                const cachedProducts = cacheProductosData.products;
                const ITEMS_PER_PAGE = 25;
                const startIndex = 0;
                const endIndex = ITEMS_PER_PAGE;
                const pageProducts = cachedProducts.slice(startIndex, endIndex);

                // Establecer solo los productos de la página actual
                setProducts(pageProducts);
                setCount(cacheProductosData.count);
                setTotalCount(cacheProductosData.count);

                // Crear productos con placeholder para la página actual
                setProductsWithPlaceholder(pageProducts);

                // Actualizar el estado de paginación
                const pageCount = calculateRealisticPageCount(
                    cacheProductosData.count
                );

                pagination.updatePaginationState(1, pageCount);

                console.log(
                    `📄 Mostrando página 1 de ${pageCount} (${pageProducts.length} productos) desde cache sin filtros`
                );
                return;
            }

            // 🚀 MODIFICADO: Solo cargar productos generales si NO hay filtros activos
            if (
                !hayFiltrosActivos &&
                (!cacheProductosData.isLoaded ||
                    cacheProductosData.products.length === 0)
            ) {
                fetchProducts();
            } else {
                // Los productos ya están cargados desde el localStorage en el estado inicial o hay filtros activos
            }
        }
    }, [
        authToken,
        cacheProductosData.isLoaded,
        cacheProductosData.products.length,
        nameFilter,
        skuFilter,
        selectedCategories,
    ]);

    // 🚀 NUEVA FUNCIÓN: Refrescar cache de inventario manualmente
    const refrescarCacheInventario = useCallback(() => {
        console.log("🔄 Iniciando refrescarCacheInventario...");

        limpiarCacheInventarioStorage(); // Limpiar cache del localStorage
        limpiarCacheProductosStorage(); // Limpiar cache de productos
        limpiarCachePreciosCompraStorage(); // Limpiar cache de precios de compra

        // Resetear el flag de intentos de carga de precios
        purchasePricesLoadAttempted.current = false;
        console.log("🔄 Flags reseteados, iniciando recargas...");

        loadAllStock(true); // Forzar recarga de stock
        loadAllPurchasePrices(true); // Forzar recarga de precios de compra
        fetchProducts(null, {}, true); // Forzar recarga de productos

        console.log("✅ refrescarCacheInventario completado");
    }, [loadAllStock, loadAllPurchasePrices, fetchProducts]);

    // 🚀 NUEVA FUNCIÓN: Solo eliminar cache sin recargar
    const eliminarCacheInventario = useCallback(() => {
        console.log("🗑️ Eliminando cache de inventario...");
        limpiarCacheInventarioStorage(); // Limpiar cache del localStorage
        limpiarCacheProductosStorage(); // Limpiar cache de productos
        limpiarCachePreciosCompraStorage(); // Limpiar cache de precios de compra

        // Resetear estados de cache
        setCacheInventarioData({
            stockData: {},
            isLoaded: false,
            lastFetch: null,
        });
        setCacheProductosData({
            products: [],
            count: 0,
            isLoaded: false,
            lastFetch: null,
        });
        setCachePreciosCompraData({
            pricesData: {},
            isLoaded: false,
            lastFetch: null,
        });

        // Resetear estados de carga
        setAllStockData({});
        setIsStockFullyLoaded(false);

        // Resetear el flag de intentos de carga de precios
        purchasePricesLoadAttempted.current = false;

        console.log("✅ Cache de inventario eliminado exitosamente");
    }, []);

    // 🚀 NUEVA FUNCIÓN: Obtener información del cache de inventario
    const obtenerInfoCacheInventario = useCallback(() => {
        const stockInfo = (() => {
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
            const tiempoTranscurrido =
                ahora - (cacheInventarioData.lastFetch || 0);
            const tiempoRestante =
                INVENTORY_CACHE_EXPIRY_TIME - tiempoTranscurrido;
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
        })();

        const pricesInfo = (() => {
            if (!cachePreciosCompraData.isLoaded) {
                return {
                    estado: "No cargado",
                    cantidad: 0,
                    ultimaActualizacion: "Nunca",
                    tiempoRestante: "N/A",
                    expiraSoon: false,
                };
            }

            const ahora = Date.now();
            const tiempoTranscurrido =
                ahora - (cachePreciosCompraData.lastFetch || 0);
            const tiempoRestante =
                PURCHASE_PRICES_CACHE_EXPIRY_TIME - tiempoTranscurrido;
            const minutosRestantes = Math.max(
                0,
                Math.floor(tiempoRestante / (1000 * 60))
            );
            const expiraSoon = minutosRestantes < 5; // Alerta si faltan menos de 5 minutos

            return {
                estado: "Cargado (Persistente)",
                cantidad: Object.keys(cachePreciosCompraData.pricesData).length,
                ultimaActualizacion: cachePreciosCompraData.lastFetch
                    ? new Date(cachePreciosCompraData.lastFetch).toLocaleString(
                          "es-ES"
                      )
                    : "Desconocida",
                tiempoRestante: `${minutosRestantes} min`,
                expiraSoon: expiraSoon,
            };
        })();

        return {
            stock: stockInfo,
            purchasePrices: pricesInfo,
        };
    }, [cacheInventarioData, cachePreciosCompraData]);

    // Al inicio del hook, después de obtener useProducts():
    // ✨ MODIFICADO: Solo usar productsCache para la carga inicial, NO para sobrescribir paginación
    useEffect(() => {
        if (
            Array.isArray(productsCache) &&
            productsCache.length > 0 &&
            products.length === 0 && // Solo si no hay productos cargados aún
            !isLoadingProducts && // Solo si no está cargando
            pagination.currentPage === 1 && // Solo en la primera página
            !nameFilter && // Solo sin filtros activos
            !skuFilter &&
            (!selectedCategories || selectedCategories.length === 0)
        ) {
            console.log(
                "🏁 Carga inicial desde productsCache para primera página sin filtros"
            );
            setProducts(productsCache.slice(0, 25)); // Solo los primeros 25 productos
            setProductsWithPlaceholder(productsCache.slice(0, 25));
            // El merge con stock se hará automáticamente por el otro useEffect
        }
    }, [
        productsCache,
        products.length,
        isLoadingProducts,
        pagination.currentPage,
        nameFilter,
        skuFilter,
        selectedCategories,
    ]);

    // 🚀 NUEVA FUNCIÓN: Limpiar flag de no precios disponibles para permitir nueva carga
    const clearNoPricesAvailableFlag = useCallback(() => {
        console.log("🔄 Limpiando flag de no precios disponibles...");

        const nuevoCache = {
            ...cachePreciosCompraData,
            noPricesAvailable: false,
            isLoaded: false, // Permitir nueva carga
        };

        setCachePreciosCompraData(nuevoCache);
        guardarCachePreciosCompraEnStorage(nuevoCache);

        // Resetear el flag de intento
        purchasePricesLoadAttempted.current = false;

        console.log("✅ Flag de no precios disponibles limpiado");
    }, [cachePreciosCompraData]);

    // 🚀 NUEVA FUNCIÓN: Forzar recarga de precios de compra
    const forceReloadPurchasePrices = useCallback(async () => {
        console.log("🔄 Forzando recarga de precios de compra...");

        // Limpiar flag de no precios disponibles
        clearNoPricesAvailableFlag();

        // Forzar recarga
        await loadAllPurchasePrices(true);
    }, [clearNoPricesAvailableFlag, loadAllPurchasePrices]);

    return {
        // Datos procesados y estados
        filteredProducts: combinedProducts,
        totalGeneralProducts: totalCount,

        // Estado de carga y errores
        isLoading: isLoadingProducts || isStockLoading || isCategoriesLoading,
        isStockLoading,
        isPurchasePricesLoading,
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
        eliminarCacheInventario,
        obtenerInfoCacheInventario,
        cacheInventarioData,

        // 🚀 NUEVO: Funciones para manejo de precios de compra
        clearNoPricesAvailableFlag,
        forceReloadPurchasePrices,
        cachePreciosCompraData,
    };
};

export default useInventory;
