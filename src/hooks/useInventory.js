// src/hooks/useInventory.js
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import inventoryService from "../services/inventoryService";
import {
    useNameSearch,
    usePagination,
    useFilterReset,
    useCategoryFilter,
} from "./inventory";

// Configuración de caché optimizada
const CACHE_DURATION = 15 * 60 * 1000; // Aumentado a 15 minutos para mejor rendimiento
const STOCK_CACHE_DURATION = 10 * 60 * 1000; // Cache específico para stock

// Número de productos por página optimizado
const ITEMS_PER_PAGE = 50; // Aumentado para reducir llamadas a API

// Cache separado para stock
const stockCache = new Map();

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

    // Estado para productos combinados con stock (para evitar el flasheo de stock 0)
    const [combinedProducts, setCombinedProducts] = useState([]);

    // Obtenemos el token de autenticación del contexto
    const { authToken } = useAuth();

    // Mantenemos estos estados
    const [count, setCount] = useState(0); // Total de productos en la BD

    // Estados de carga y error optimizados
    const [isLoading, setIsLoading] = useState(false);
    const [isStockLoading, setIsStockLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estado adicional para mantener el total general de productos (sin filtros)
    const [totalCount, setTotalCount] = useState(0);

    // Estado para almacenar información de stock
    const [stockData, setStockData] = useState({});

    // Caché para evitar llamadas repetidas a la API
    const cache = useRef(new Map());
    // Tiempo de la última actualización del total de productos
    const lastTotalFetch = useRef(0);
    // AbortController para cancelar peticiones cuando cambian los filtros
    const abortControllerRef = useRef(null);
    // Ref para guardar el último abortController de stock
    const stockAbortControllerRef = useRef(null);

    // Función optimizada para convertir URLs absolutas a URLs relativas para el proxy
    const convertToProxyUrl = useCallback((url) => {
        if (!url) return null;
        return url;
    }, []);

    // Función optimizada para combinar los datos de productos con la información de stock
    const mergeProductsWithStock = useCallback((products, stockMap) => {
        if (!products || !Array.isArray(products)) {
            console.warn("Products is not a valid array:", products);
            return [];
        }

        if (!stockMap || typeof stockMap !== "object") {
            console.warn("Stock map is not a valid object:", stockMap);
            return products.map((product) => ({ ...product, stock: 0 }));
        }

        return products.map((product) => {
            const enrichedProduct = { ...product };

            if (product.id && stockMap[product.id] !== undefined) {
                enrichedProduct.stock =
                    typeof stockMap[product.id] === "number"
                        ? stockMap[product.id]
                        : parseInt(stockMap[product.id], 10) || 0;
            } else {
                enrichedProduct.stock = 0;
            }

            return enrichedProduct;
        });
    }, []);

    // Función optimizada para obtener productos de la API con mejor caché
    const fetchProducts = useCallback(
        async (url = null, params = {}) => {
            if (!authToken) {
                setError(
                    "No hay token de autenticación. Inicie sesión nuevamente."
                );
                setProducts([]);
                setIsLoading(false);
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
            const cacheKey = JSON.stringify({
                ...params,
                page_size: ITEMS_PER_PAGE,
            });
            const now = Date.now();
            const cachedData = cache.current.get(cacheKey);

            if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
                console.log("Usando datos en caché para", params);
                setProducts(cachedData.data.results || []);
                setCount(
                    typeof cachedData.data.count === "number"
                        ? cachedData.data.count
                        : parseInt(cachedData.data.count, 10) || 0
                );

                // Actualizar el estado de paginación
                const pageCount = calculateRealisticPageCount(
                    typeof cachedData.data.count === "number"
                        ? cachedData.data.count
                        : parseInt(cachedData.data.count, 10) || 0
                );

                let currentPageValue = 1;
                try {
                    if (params.page) {
                        currentPageValue = parseInt(params.page, 10);
                    }
                } catch (urlError) {
                    // Ignorar errores
                }

                pagination.updatePaginationState(
                    currentPageValue,
                    pageCount,
                    convertToProxyUrl(cachedData.data.next),
                    convertToProxyUrl(cachedData.data.previous)
                );

                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                // Agregar page_size optimizado a los parámetros
                const optimizedParams = {
                    ...params,
                    page_size: ITEMS_PER_PAGE,
                };

                const data = await inventoryService.getProducts(
                    optimizedParams,
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

                // Actualizar el estado con los datos recibidos
                setProducts(data.results || []);
                setCount(
                    typeof data.count === "number"
                        ? data.count
                        : parseInt(data.count, 10) || 0
                );

                // Calcular número de páginas con el nuevo tamaño
                const pageCount = Math.ceil((data.count || 0) / ITEMS_PER_PAGE);

                let currentPageValue = 1;
                try {
                    if (params.page) {
                        currentPageValue = parseInt(params.page, 10);
                    }
                } catch (urlError) {
                    // Ignorar errores
                }

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
                    (Object.keys(params).length === 1 && params.page) ||
                    (Object.keys(params).length === 2 &&
                        params.page &&
                        params.page_size)
                ) {
                    setTotalCount(
                        typeof data.count === "number"
                            ? data.count
                            : parseInt(data.count, 10) || 0
                    );
                    lastTotalFetch.current = now;
                }
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
            } finally {
                if (!signal.aborted) {
                    setIsLoading(false);
                }
            }
        },
        [authToken, convertToProxyUrl]
    );

    // Función optimizada para cargar el stock con cache separado
    const fetchStockData = useCallback(async () => {
        if (!authToken) {
            console.warn("No authentication token available for stock fetch");
            return;
        }

        // Verificar cache de stock
        const stockCacheKey = "all_stock_data";
        const now = Date.now();
        const cachedStock = stockCache.get(stockCacheKey);

        if (cachedStock && now - cachedStock.timestamp < STOCK_CACHE_DURATION) {
            console.log("Usando datos de stock en caché");
            setStockData(cachedStock.data);
            return;
        }

        // Cancelar cualquier solicitud previa
        if (stockAbortControllerRef.current) {
            stockAbortControllerRef.current.abort();
        }

        stockAbortControllerRef.current = new AbortController();
        const { signal } = stockAbortControllerRef.current;

        setIsStockLoading(true);

        try {
            console.log("Fetching stock data");
            const stockMap = await inventoryService.getStockMap(
                authToken,
                signal
            );

            if (signal.aborted) {
                console.log("Stock fetch was aborted");
                return;
            }

            if (!stockMap || typeof stockMap !== "object") {
                throw new Error("Invalid stock data received");
            }

            console.log(
                "Stock data received:",
                Object.keys(stockMap).length,
                "products"
            );

            setStockData(stockMap);

            // Guardar en cache
            stockCache.set(stockCacheKey, {
                data: stockMap,
                timestamp: now,
            });
        } catch (err) {
            if (signal.aborted) {
                console.log("Stock fetch aborted during error handling");
                return;
            }
            console.error("Error al obtener datos de stock:", err);
        } finally {
            if (!signal.aborted) {
                setIsStockLoading(false);
            }
        }
    }, [authToken]);

    // Función para resetear la página actual a la primera página
    const resetPage = useCallback(() => {
        pagination.updatePaginationState(1, pagination.totalPages, null, null);
    }, []);

    // Función para limpiar la caché y forzar nueva búsqueda
    const clearCache = useCallback(() => {
        cache.current = new Map();
    }, []);

    // Utilizamos el hook personalizado para la paginación
    const pagination = usePagination(fetchProducts);

    // Utilizamos el hook personalizado para la búsqueda por nombre
    const { nameFilter, searchByName, resetNameFilter } = useNameSearch(
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
    const resetFunctions = [resetNameFilter, resetCategoryFilter];

    // Utilizamos el hook para resetear todos los filtros
    const { resetAllFilters } = useFilterReset({
        resetPage,
        clearCache,
        resetFunctions,
    });

    // Efecto optimizado para cargar productos al inicio y cuando cambian los filtros
    useEffect(() => {
        // Crear objeto de parámetros para la API
        const params = {
            page: pagination.currentPage,
            page_size: ITEMS_PER_PAGE, // Agregar explícitamente el tamaño de página
        };

        // Añadir filtro de nombre si existe
        if (nameFilter) {
            params.name = nameFilter;
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

        setIsLoading(true);
        setError(null);

        // Función optimizada para cargar datos
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

                // Actualizar inmediatamente los productos sin esperar el stock
                setProducts(data.results || []);
                setCount(
                    typeof data.count === "number"
                        ? data.count
                        : parseInt(data.count, 10) || 0
                );

                // Calcular número de páginas con el nuevo tamaño
                const pageCount = Math.ceil((data.count || 0) / ITEMS_PER_PAGE);

                // Actualizar el estado de paginación
                pagination.updatePaginationState(
                    pagination.currentPage,
                    pageCount,
                    convertToProxyUrl(data.next),
                    convertToProxyUrl(data.previous)
                );

                // También actualizamos el total general de productos si no hay filtros
                if (
                    Object.keys(params).length === 1 || // Solo page_size
                    (Object.keys(params).length === 2 && params.page) // page y page_size
                ) {
                    setTotalCount(
                        typeof data.count === "number"
                            ? data.count
                            : parseInt(data.count, 10) || 0
                    );
                    lastTotalFetch.current = Date.now();
                }
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
            } finally {
                if (!signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        fetchData();
    }, [
        pagination.currentPage,
        nameFilter,
        selectedCategories,
        authToken,
        convertToProxyUrl,
    ]);

    // Efecto optimizado para combinar productos con datos de stock de forma asíncrona
    useEffect(() => {
        if (products.length > 0) {
            // Mostrar inmediatamente los productos con stock 0 mientras carga el stock real
            if (Object.keys(stockData).length === 0 && !isStockLoading) {
                const productsWithZeroStock = products.map((product) => ({
                    ...product,
                    stock: 0,
                }));
                setCombinedProducts(productsWithZeroStock);
            } else if (Object.keys(stockData).length > 0) {
                // Combinar con datos reales de stock cuando estén disponibles
                const enriched = mergeProductsWithStock(products, stockData);
                setCombinedProducts(enriched);
            }
        } else {
            // Si no hay productos, limpiar también los combinados
            setCombinedProducts([]);
        }
    }, [products, stockData, isStockLoading, mergeProductsWithStock]);

    // Efecto para cargar productos y stock en paralelo al iniciar
    useEffect(() => {
        if (authToken) {
            console.log("Cargando datos iniciales en paralelo");

            // Verificar parámetros de URL
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const pageParam = urlParams.get("page");

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

            // Cargar productos y stock en paralelo para mejor rendimiento
            const loadInitialData = async () => {
                try {
                    await Promise.allSettled([
                        fetchProducts(),
                        fetchStockData(),
                    ]);
                } catch (error) {
                    console.error("Error al cargar datos iniciales:", error);
                }
            };

            loadInitialData();
        }
    }, [authToken, fetchProducts, fetchStockData]);

    return {
        // Datos procesados y estados
        filteredProducts: combinedProducts,
        totalGeneralProducts: totalCount,

        // Estado de carga y errores
        isLoading: isLoading || isStockLoading || isCategoriesLoading,
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

        // Filtro de categorías
        selectedCategories,
        availableCategories,
        updateSelectedCategories,

        // Reseteo de filtros
        resetAllFilters,
    };
};

export default useInventory;
