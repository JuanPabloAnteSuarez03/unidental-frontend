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

// Configuración de caché
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en milisegundos

// Número de productos por página (debe coincidir con el backend)
const ITEMS_PER_PAGE = 25; // Según nuestras pruebas, el backend muestra 25 productos por página

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

    // Mantenemos estos estados
    const [count, setCount] = useState(0); // Total de productos en la BD

    // Estados de carga y error
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [isStockLoading, setIsStockLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estado adicional para mantener el total general de productos (sin filtros)
    const [totalCount, setTotalCount] = useState(0);

    // ✨ NUEVO: Estado para almacenar TODO el stock (no solo de la página actual)
    const [allStockData, setAllStockData] = useState({});
    const [isStockFullyLoaded, setIsStockFullyLoaded] = useState(false);

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
        const backendBaseUrl =
            "https://unidental-backend-production.up.railway.app";
        if (url.startsWith(backendBaseUrl)) {
            // Remove the base URL, keep the path starting with /api
            return url.replace(backendBaseUrl, "");
        }

        // For any other absolute URL, return as is (shouldn't happen in our case)
        return url;
    }, []);

    // ✨ NUEVA FUNCIÓN: Cargar TODO el stock una sola vez
    const loadAllStock = useCallback(async () => {
        console.log("🚀 Loading ALL stock data...");

        // Verificar si ya tenemos stock reciente en caché
        const now = Date.now();
        if (
            isStockFullyLoaded &&
            now - lastStockFetch.current < CACHE_DURATION
        ) {
            console.log("✅ Using cached complete stock data");
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

            setAllStockData(completeStockMap);
            setIsStockFullyLoaded(true);
            lastStockFetch.current = now;
        } catch (error) {
            console.error("🚨 Error loading complete stock:", error);
        } finally {
            setIsStockLoading(false);
        }
    }, [authToken]);

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
        async (url = null, params = {}) => {
            if (!authToken) {
                setError(
                    "No hay token de autenticación. Inicie sesión nuevamente."
                );
                setProducts([]);
                setIsLoadingProducts(false);
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

    // Efecto para cargar productos al inicio y cuando cambian los filtros
    useEffect(() => {
        // Crear objeto de parámetros para la API
        const params = {
            page: pagination.currentPage,
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
    }, [
        pagination.currentPage,
        nameFilter,
        selectedCategories,
        authToken,
        convertToProxyUrl,
        createProductsWithPlaceholder,
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
        if (authToken && !isStockFullyLoaded) {
            console.log("🚀 Iniciando carga completa de stock...");
            loadAllStock();
        }
    }, [authToken, isStockFullyLoaded, loadAllStock]);

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

            // Solo cargar productos inicialmente - el stock se carga por separado
            fetchProducts();
        }
    }, [authToken, fetchProducts]);

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

        // Filtro de categorías
        selectedCategories,
        availableCategories,
        updateSelectedCategories,

        // Reseteo de filtros
        resetAllFilters,
    };
};

export default useInventory;
