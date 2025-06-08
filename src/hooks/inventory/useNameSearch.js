import { useState, useCallback } from "react";

/**
 * Hook personalizado para la funcionalidad de búsqueda por nombre en el inventario
 * @param {function} resetPage - Función para resetear la paginación a la primera página
 * @param {function} clearCache - Función para limpiar la caché y forzar nueva búsqueda
 * @returns {object} - Estado y funciones para la búsqueda por nombre
 */
const useNameSearch = (resetPage, clearCache) => {
    // Estado para almacenar el término de búsqueda actual
    const [nameFilter, setNameFilter] = useState("");

    /**
     * Función para buscar productos por nombre
     * @param {string} name - Nombre o término a buscar
     */
    const searchByName = useCallback(
        (name) => {
            // Actualizamos el filtro de nombre
            setNameFilter(name);

            // Reiniciamos a la primera página
            if (resetPage) {
                resetPage();
            }

            // Limpiamos la caché para forzar una nueva búsqueda
            if (clearCache) {
                clearCache();
            }
        },
        [resetPage, clearCache]
    );

    /**
     * Función para limpiar el filtro de nombre
     */
    const resetNameFilter = useCallback(() => {
        setNameFilter("");
    }, []);

    return {
        nameFilter,
        searchByName,
        resetNameFilter,
    };
};

export default useNameSearch;
