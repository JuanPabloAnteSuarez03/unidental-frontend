import { useState, useCallback } from "react";

/**
 * Convert absolute backend URLs to relative URLs for proxy in development
 * @param {string} url - Absolute or relative URL
 * @returns {string} - Relative URL that works with Vite proxy
 */
const convertToProxyUrl = (url) => {
    if (!url) return url;
    
    // If already a relative URL, return as is
    if (url.startsWith('/')) return url;
    
    // If it's an absolute URL from our backend, convert to relative
    const backendBaseUrl = 'https://unidental-backend-production.up.railway.app';
    if (url.startsWith(backendBaseUrl)) {
        // Remove the base URL, keep the path starting with /api
        return url.replace(backendBaseUrl, '');
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
            setCurrentPage((prev) => prev + 1);

            // Extraer parámetros de la URL
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
                fetchProducts(null, { page: currentPage + 1 });
            }
        }
    }, [nextPageUrl, currentPage, fetchProducts]);

    /**
     * Navega a la página anterior
     */
    const goToPrevPage = useCallback(() => {
        if (prevPageUrl) {
            setCurrentPage((prev) => prev - 1);

            // Extraer parámetros de la URL
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
                fetchProducts(null, { page: currentPage - 1 });
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
