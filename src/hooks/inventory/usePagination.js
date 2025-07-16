import { useState, useCallback } from "react";

/**
 * Hook simple para manejar la paginación
 * @param {Function} fetchProducts - Función para obtener productos
 * @returns {Object} - Estados y funciones para la paginación
 */
const usePagination = (fetchProducts) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    /**
     * Actualiza el estado de paginación
     * @param {number} page - Número de página actual
     * @param {number} pages - Total de páginas
     */
    const updatePaginationState = useCallback((page, pages) => {
        console.log(`📄 Actualizando paginación: página ${page} de ${pages}`);
        setCurrentPage(page);
        setTotalPages(pages);
    }, []);

    /**
     * Navega a una página específica
     * @param {number} page - Número de página a la que navegar
     */
    const goToPage = useCallback(
        (page) => {
            if (page < 1 || page > totalPages) {
                console.warn(
                    `⚠️ Página ${page} fuera de rango (1-${totalPages})`
                );
                return;
            }

            if (page === currentPage) {
                console.log(`ℹ️ Ya estamos en la página ${page}`);
                return;
            }

            console.log(`🔄 Navegando a página ${page}`);
            setCurrentPage(page);

            // Llamar a fetchProducts con la nueva página
            if (typeof fetchProducts === "function") {
                console.log(`📞 Llamando a fetchProducts con parámetros:`, {
                    page,
                });
                fetchProducts(null, { page });
            } else {
                console.error(`❌ fetchProducts no es una función válida`);
            }
        },
        [currentPage, totalPages, fetchProducts]
    );

    /**
     * Navega a la siguiente página
     */
    const goToNextPage = useCallback(() => {
        if (currentPage < totalPages) {
            goToPage(currentPage + 1);
        } else {
            console.warn("⚠️ Ya estamos en la última página");
        }
    }, [currentPage, totalPages, goToPage]);

    /**
     * Navega a la página anterior
     */
    const goToPrevPage = useCallback(() => {
        if (currentPage > 1) {
            goToPage(currentPage - 1);
        } else {
            console.warn("⚠️ Ya estamos en la primera página");
        }
    }, [currentPage, goToPage]);

    // Calcular si hay siguiente/anterior página
    const hasNextPage = currentPage < totalPages;
    const hasPrevPage = currentPage > 1;

    return {
        currentPage,
        totalPages,
        hasNextPage,
        hasPrevPage,
        goToNextPage,
        goToPrevPage,
        goToPage,
        updatePaginationState,
    };
};

export default usePagination;
