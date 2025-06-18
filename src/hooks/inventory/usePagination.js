import { useState, useCallback } from "react";

/**
 * Convert absolute backend URLs to relative URLs for proxy in development
 * @param {string} url - Absolute or relative URL
 * @returns {string} - Relative URL that works with Vite proxy
 */
const convertToProxyUrl = (url) => {
    if (!url) return url;

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
};

/**
 * Hook para manejar la paginación de productos
 * @param {Function} fetchProducts - Función para obtener productos
 * @returns {Object} - Estados y funciones para la paginación
 */
const usePagination = (fetchProducts) => {
    // Estados para la paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [nextPageUrl, setNextPageUrl] = useState(null);
    const [prevPageUrl, setPrevPageUrl] = useState(null);

    /**
     * Actualiza el estado de paginación con nueva información
     * @param {number} page - Número de página actual
     * @param {number} pages - Total de páginas
     * @param {string} nextUrl - URL para la siguiente página
     * @param {string} prevUrl - URL para la página anterior
     */
    const updatePaginationState = useCallback(
        (page, pages, nextUrl, prevUrl) => {
            setCurrentPage(page);
            setTotalPages(pages);
            setNextPageUrl(nextUrl);
            setPrevPageUrl(prevUrl);
        },
        []
    );

    /**
     * Navega a la siguiente página
     */
    const goToNextPage = useCallback(() => {
        if (nextPageUrl) {
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);

            // Verificar si estamos en una búsqueda por SKU
            // Comprobar si hay resultados en caché
            const skuSearchResults = window.skuSearchCache || {};
            const hasSkuCache =
                skuSearchResults &&
                skuSearchResults.data &&
                skuSearchResults.data.length > 0;

            // Comprobar si hay un filtro de SKU activo
            const urlParams = new URLSearchParams(window.location.search);
            const skuParam = urlParams.get("skuFilter");

            if (hasSkuCache || skuParam) {
                console.log(
                    `🔍 Navegando a la página siguiente (${nextPage}) en búsqueda por SKU (filtro: ${
                        skuParam || "desde caché"
                    })`
                );
                // No hacer nada más, la lógica de paginación por SKU está en useInventory.js
                return;
            }

            // Para búsquedas normales, extraer parámetros de la URL
            try {
                // Convert absolute URL to relative URL for proxy first
                const proxyUrl = convertToProxyUrl(nextPageUrl);
                const url = new URL(proxyUrl, window.location.origin);
                const params = {};

                // Convertir los parámetros de búsqueda a un objeto
                for (const [key, value] of url.searchParams.entries()) {
                    params[key] = value;
                }

                // Llamar a fetchProducts con los parámetros extraídos
                fetchProducts(null, params);
            } catch (error) {
                console.error("Error parsing next page URL:", error);
                // Si hay un error, simplemente avanzar a la siguiente página
                fetchProducts(null, { page: nextPage });
            }
        }
    }, [nextPageUrl, currentPage, fetchProducts]);

    /**
     * Navega a la página anterior
     */
    const goToPrevPage = useCallback(() => {
        if (prevPageUrl) {
            const prevPage = currentPage - 1;
            setCurrentPage(prevPage);

            // Verificar si estamos en una búsqueda por SKU
            // Comprobar si hay resultados en caché
            const skuSearchResults = window.skuSearchCache || {};
            const hasSkuCache =
                skuSearchResults &&
                skuSearchResults.data &&
                skuSearchResults.data.length > 0;

            // Comprobar si hay un filtro de SKU activo
            const urlParams = new URLSearchParams(window.location.search);
            const skuParam = urlParams.get("skuFilter");

            if (hasSkuCache || skuParam) {
                console.log(
                    `🔍 Navegando a la página anterior (${prevPage}) en búsqueda por SKU (filtro: ${
                        skuParam || "desde caché"
                    })`
                );
                // No hacer nada más, la lógica de paginación por SKU está en useInventory.js
                return;
            }

            // Para búsquedas normales, extraer parámetros de la URL
            try {
                // Convert absolute URL to relative URL for proxy first
                const proxyUrl = convertToProxyUrl(prevPageUrl);
                const url = new URL(proxyUrl, window.location.origin);
                const params = {};

                // Convertir los parámetros de búsqueda a un objeto
                for (const [key, value] of url.searchParams.entries()) {
                    params[key] = value;
                }

                // Llamar a fetchProducts con los parámetros extraídos
                fetchProducts(null, params);
            } catch (error) {
                console.error("Error parsing previous page URL:", error);
                // Si hay un error, simplemente retroceder a la página anterior
                fetchProducts(null, { page: prevPage });
            }
        }
    }, [prevPageUrl, currentPage, fetchProducts]);

    /**
     * Navega a una página específica
     * @param {number} page - Número de página a la que navegar
     */
    const goToPage = useCallback(
        (page) => {
            if (page >= 1 && page <= totalPages) {
                setCurrentPage(page);

                // Verificar si estamos en una búsqueda por SKU
                // Esta verificación se hace indirectamente a través de la URL y del cache
                const skuSearchResults = window.skuSearchCache || {};
                const hasSkuCache =
                    skuSearchResults &&
                    skuSearchResults.data &&
                    skuSearchResults.data.length > 0;

                // Comprobar si hay un filtro de SKU activo
                const urlParams = new URLSearchParams(window.location.search);
                const skuParam = urlParams.get("skuFilter");

                if (hasSkuCache || skuParam) {
                    console.log(
                        `🔍 Navegando a página ${page} en búsqueda por SKU (filtro: ${
                            skuParam || "desde caché"
                        })`
                    );
                    // No hacer nada más, la lógica de paginación por SKU está en useInventory.js
                    // La actualización de setCurrentPage es suficiente para que el efecto se dispare
                    return;
                }

                // Para búsquedas normales, hacer la llamada al API
                fetchProducts(null, { page });
            }
        },
        [totalPages, fetchProducts]
    );

    return {
        currentPage,
        totalPages,
        hasNextPage: !!nextPageUrl,
        hasPrevPage: !!prevPageUrl,
        goToNextPage,
        goToPrevPage,
        goToPage,
        updatePaginationState,
    };
};

export default usePagination;
