import { useCallback } from "react";

/**
 * Hook personalizado para manejar la limpieza global de filtros
 * @param {Object} options - Opciones para la limpieza de filtros
 * @param {Function} options.resetPage - Función para resetear la paginación
 * @param {Function} options.clearCache - Función para limpiar la caché
 * @param {Array} options.resetFunctions - Array de funciones de reset adicionales
 * @returns {Object} - Funciones para el reseteo de filtros
 */
const useFilterReset = ({ resetPage, clearCache, resetFunctions = [] }) => {
    /**
     * Limpia todos los filtros aplicados y reinicia la búsqueda
     */
    const resetAllFilters = useCallback(() => {
        // Resetear la página a la primera
        if (resetPage) {
            resetPage();
        }

        // Limpiar la caché para forzar una nueva búsqueda
        if (clearCache) {
            clearCache();
        }

        // Ejecutar todas las funciones de reset adicionales
        resetFunctions.forEach((resetFn) => {
            if (typeof resetFn === "function") {
                resetFn();
            }
        });
    }, [resetPage, clearCache, resetFunctions]);

    return {
        resetAllFilters,
    };
};

export default useFilterReset;
