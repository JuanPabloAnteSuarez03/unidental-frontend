// src/hooks/useInventory.js
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "../context/AuthContext";

// URL base de tu API para productos
const API_PRODUCTS_URL = import.meta.env.DEV
    ? "/api/catalogs/products/" // Usará el proxy de Vite en desarrollo
    : "https://unidental-backend-production.up.railway.app/api/catalogs/products/";

// URL base completa para cuando necesitemos analizar las URL
const FULL_BASE_URL = import.meta.env.DEV
    ? window.location.origin + "/api/catalogs/products/" // URL completa en desarrollo
    : "https://unidental-backend-production.up.railway.app/api/catalogs/products/";

// Dominio del API para reescribir URLs en desarrollo
const API_DOMAIN = "https://unidental-backend-production.up.railway.app";

// Configuración de caché
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en milisegundos

// Número de productos por página (debe coincidir con el backend)
const ITEMS_PER_PAGE = 10; // Ajusta este valor según la configuración de tu API

const useInventory = () => {
    // Estado para los productos de la página actual
    const [products, setProducts] = useState([]);
    // Estado para el término de búsqueda por texto (nombre/marca)
    const [searchText, setSearchText] = useState("");
    // Estado para el término de búsqueda por código/SKU
    const [searchCode, setSearchCode] = useState("");
    // Estado para el término de búsqueda por categoría
    const [searchCategory, setSearchCategory] = useState("");

    // Obtenemos el token de autenticación del contexto
    const { authToken } = useAuth();

    // Estado para la configuración de ordenamiento
    const [sortConfig, setSortConfig] = useState({
        key: null,
        direction: "ascending",
    });

    // Estados para la paginación
    const [count, setCount] = useState(0); // Total de productos en la BD
    const [nextPageUrl, setNextPageUrl] = useState(null); // URL para la siguiente página
    const [prevPageUrl, setPrevPageUrl] = useState(null); // URL para la página anterior
    const [currentPage, setCurrentPage] = useState(1); // Página actual (opcional, para UI)
    const [totalPages, setTotalPages] = useState(0); // Total de páginas disponibles

    // Estados de carga y error
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estado adicional para mantener el total general de productos (sin filtros)
    const [totalCount, setTotalCount] = useState(0);

    // Caché para evitar llamadas repetidas a la API
    const cache = useRef(new Map());
    // Tiempo de la última actualización del total de productos
    const lastTotalFetch = useRef(0);
    // AbortController para cancelar peticiones cuando cambian los filtros
    const abortControllerRef = useRef(null);

    // Función optimizada para convertir URLs absolutas a URLs relativas para el proxy
    const convertToProxyUrl = useCallback((url) => {
        if (!url) return null;

        // Solo necesitamos la conversión en desarrollo y si la URL es absoluta
        if (import.meta.env.DEV && url.startsWith(API_DOMAIN)) {
            return url.replace(API_DOMAIN, "");
        }

        return url;
    }, []);

    // Función para construir la URL con filtros (memoizada para evitar recálculos)
    const buildUrlWithFilters = useCallback(
        (baseUrl, page = null) => {
            const params = new URLSearchParams();
            if (searchText) params.append("name", searchText);
            if (searchCode) params.append("sku", searchCode);
            if (searchCategory) params.append("category_name", searchCategory);

            // Añadir soporte para ordenamiento en el backend
            if (sortConfig.key) {
                const orderParam =
                    sortConfig.direction === "descending" ? "-" : "";
                params.append("ordering", `${orderParam}${sortConfig.key}`);
            }

            // Añadir número de página si se especifica
            if (page !== null) {
                params.append("page", page.toString());
            }

            const queryString = params.toString();
            return queryString ? `${baseUrl}?${queryString}` : baseUrl;
        },
        [
            searchText,
            searchCode,
            searchCategory,
            sortConfig.key,
            sortConfig.direction,
        ]
    );

    // Función para obtener el total de productos (sin filtros) con caché
    const fetchTotalCount = useCallback(
        async (forceRefresh = false) => {
            if (!authToken) return;

            // Si ya tenemos datos recientes en caché y no se fuerza la actualización, usarlos
            const now = Date.now();
            if (
                !forceRefresh &&
                now - lastTotalFetch.current < CACHE_DURATION &&
                totalCount > 0
            ) {
                return;
            }

            try {
                const response = await fetch(API_PRODUCTS_URL, {
                    headers: {
                        Authorization: `Token ${authToken}`,
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    console.error(
                        `Error al obtener el total de productos: ${response.status}`
                    );
                    return;
                }

                const data = await response.json();
                setTotalCount(data.count || 0);
                lastTotalFetch.current = now;
            } catch (err) {
                console.error("Error al obtener el total de productos:", err);
            }
        },
        [authToken, totalCount]
    );

    // Función para obtener productos de la API con soporte para caché y cancelación
    const fetchProducts = useCallback(
        async (url) => {
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

            // Verificar si tenemos datos en caché y están frescos
            const cacheKey = url;
            const now = Date.now();
            const cachedData = cache.current.get(cacheKey);

            if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
                // Usar datos de caché
                setProducts(cachedData.data.results || []);
                setCount(cachedData.data.count || 0);
                setNextPageUrl(convertToProxyUrl(cachedData.data.next));
                setPrevPageUrl(convertToProxyUrl(cachedData.data.previous));

                // Calcular el total de páginas
                const apiCount = cachedData.data.count || 0;
                setTotalPages(Math.ceil(apiCount / ITEMS_PER_PAGE));

                // Extraer número de página
                try {
                    const fullUrl = url.startsWith("http")
                        ? url
                        : new URL(url, window.location.origin).href;
                    const urlParams = new URLSearchParams(
                        new URL(fullUrl).search
                    );
                    setCurrentPage(parseInt(urlParams.get("page") || "1", 10));
                } catch (e) {
                    // Ignorar errores de análisis de URL
                }

                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(url, {
                    headers: {
                        Authorization: `Token ${authToken}`,
                        "Content-Type": "application/json",
                    },
                    signal,
                });

                if (signal.aborted) return;

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(
                        errorData.detail ||
                            `Error ${response.status}: ${response.statusText}`
                    );
                }

                const data = await response.json();

                // Guardar en caché
                cache.current.set(cacheKey, {
                    data,
                    timestamp: now,
                });

                // Limitar el tamaño de la caché a 20 entradas
                if (cache.current.size > 20) {
                    const oldestKey = [...cache.current.keys()][0];
                    cache.current.delete(oldestKey);
                }

                setProducts(data.results || []);

                // Asegúrate de que count sea un número
                const apiCount =
                    typeof data.count === "number"
                        ? data.count
                        : parseInt(data.count, 10) || 0;

                setCount(apiCount);

                // Calcular el total de páginas
                setTotalPages(Math.ceil(apiCount / ITEMS_PER_PAGE));

                // Procesar URLs de paginación
                const nextUrl = convertToProxyUrl(data.next);
                const prevUrl = convertToProxyUrl(data.previous);

                setNextPageUrl(nextUrl);
                setPrevPageUrl(prevUrl);

                // Extraer el número de página de la URL actual
                try {
                    const fullUrl = url.startsWith("http")
                        ? url
                        : new URL(url, window.location.origin).href;
                    const urlParams = new URLSearchParams(
                        new URL(fullUrl).search
                    );
                    setCurrentPage(parseInt(urlParams.get("page") || "1", 10));
                } catch (urlError) {
                    // Ignorar errores de análisis de URL
                }
            } catch (err) {
                if (err.name === "AbortError") {
                    // Ignorar errores de cancelación
                    return;
                }

                console.error("Error fetching inventory:", err);
                setError(err.message);
                setProducts([]);
                setCount(0);
            } finally {
                if (!signal.aborted) {
                    setIsLoading(false);
                }
            }
        },
        [authToken, convertToProxyUrl]
    );

    // Limpiar caché cuando cambia el token de autenticación
    useEffect(() => {
        cache.current.clear();
        lastTotalFetch.current = 0;
    }, [authToken]);

    // Efecto para cargar los productos iniciales o cuando cambian los filtros
    useEffect(() => {
        if (authToken) {
            const initialUrl = buildUrlWithFilters(API_PRODUCTS_URL);
            fetchProducts(initialUrl);

            // Si no hay filtros activos, actualizamos también el conteo total
            if (!searchText && !searchCode && !searchCategory) {
                fetchTotalCount();
            }
        }

        // Limpiar al desmontar
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [
        fetchProducts,
        buildUrlWithFilters,
        searchText,
        searchCode,
        searchCategory,
        authToken,
        fetchTotalCount,
    ]);

    // Efecto para obtener el total de productos cuando se inicia el componente
    useEffect(() => {
        if (authToken) {
            fetchTotalCount();
        }
    }, [authToken, fetchTotalCount]);

    // Lógica de ordenamiento (SOLO PARA LA PÁGINA ACTUAL DE DATOS si el backend no lo soporta)
    const sortedProducts = useMemo(() => {
        // Si el ordenamiento se maneja en el backend, no es necesario ordenar localmente
        if (sortConfig.key && sortConfig.key.includes("ordering")) {
            return [...products];
        }

        // Ordenamiento local para la página actual
        let sortableProducts = [...products];
        if (sortConfig.key) {
            sortableProducts.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Manejar valores nulos o indefinidos
                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;

                if (typeof aValue === "string") aValue = aValue.toLowerCase();
                if (typeof bValue === "string") bValue = bValue.toLowerCase();

                if (aValue < bValue)
                    return sortConfig.direction === "ascending" ? -1 : 1;
                if (aValue > bValue)
                    return sortConfig.direction === "ascending" ? 1 : -1;
                return 0;
            });
        }
        return sortableProducts;
    }, [products, sortConfig]);

    // Función para cambiar el ordenamiento
    const handleSort = useCallback((key) => {
        setSortConfig((prevConfig) => {
            const newDirection =
                prevConfig.key === key && prevConfig.direction === "ascending"
                    ? "descending"
                    : "ascending";

            return { key, direction: newDirection };
        });
    }, []);

    // Funciones para actualizar los estados de búsqueda con debounce
    const updateSearchText = useCallback((text) => {
        setSearchText(text);
    }, []);

    const updateSearchCode = useCallback((code) => {
        setSearchCode(code);
    }, []);

    const updateSearchCategory = useCallback((category) => {
        setSearchCategory(category);
    }, []);

    const clearFilters = useCallback(() => {
        setSearchText("");
        setSearchCode("");
        setSearchCategory("");
        setSortConfig({ key: null, direction: "ascending" });
    }, []);

    // Funciones para paginación
    const goToNextPage = useCallback(() => {
        if (nextPageUrl) {
            fetchProducts(nextPageUrl);
        }
    }, [nextPageUrl, fetchProducts]);

    const goToPrevPage = useCallback(() => {
        if (prevPageUrl) {
            fetchProducts(prevPageUrl);
        }
    }, [prevPageUrl, fetchProducts]);

    // Nueva función para ir a una página específica
    const goToPage = useCallback(
        (pageNumber) => {
            if (
                pageNumber < 1 ||
                pageNumber > totalPages ||
                pageNumber === currentPage
            ) {
                return; // No hacer nada si la página no es válida o es la misma
            }

            const url = buildUrlWithFilters(API_PRODUCTS_URL, pageNumber);
            fetchProducts(url);
        },
        [buildUrlWithFilters, currentPage, fetchProducts, totalPages]
    );

    // Propiedades memoizadas
    const hasNextPage = !!nextPageUrl;
    const hasPrevPage = !!prevPageUrl;

    return {
        // Estados de búsqueda
        searchText,
        searchCode,
        searchCategory,

        // Estado de ordenamiento
        sortConfig,

        // Funciones para actualizar estados
        updateSearchText,
        updateSearchCode,
        updateSearchCategory,
        handleSort,
        clearFilters,

        // Datos procesados y de estado
        filteredProducts: sortedProducts,
        totalProducts: count,
        totalGeneralProducts: totalCount,
        filteredCount: sortedProducts.length,

        // Paginación
        isLoading,
        error,
        goToNextPage,
        goToPrevPage,
        goToPage, // Nueva función para ir a una página específica
        hasNextPage,
        hasPrevPage,
        currentPage,
        totalPages, // Total de páginas disponibles
        itemsPerPage: ITEMS_PER_PAGE, // Exportar el número de items por página
    };
};

export default useInventory;
