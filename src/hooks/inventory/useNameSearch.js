import { useState, useCallback, useEffect, useRef } from "react";

/**
 * ✨ SUPER OPTIMIZADO: Hook para manejar la búsqueda por nombre con debouncing inteligente
 * @param {Function} resetPage - Función para resetear la página
 * @param {Function} clearCache - Función para limpiar la caché
 * @returns {Object} - Estados y funciones para la búsqueda por nombre
 */
const useNameSearch = (resetPage, clearCache) => {
    const [nameFilter, setNameFilter] = useState("");
    const [debouncedNameFilter, setDebouncedNameFilter] = useState("");
    const debounceTimeoutRef = useRef(null);

    // ✨ SUPER OPTIMIZACIÓN: Debouncing más rápido y eficiente
    useEffect(() => {
        // Limpiar timeout anterior si existe
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        // ⚡ OPTIMIZACIÓN: Reducido de 300ms a 200ms para respuesta más rápida
        // Configurar nuevo timeout
        debounceTimeoutRef.current = setTimeout(() => {
            setDebouncedNameFilter(nameFilter);
        }, 200); // 200ms de delay optimizado

        // Cleanup function
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [nameFilter]);

    /**
     * ✨ OPTIMIZADO: Actualiza el filtro de nombre con mejor performance
     * @param {string} name - Nombre a buscar
     */
    const searchByName = useCallback(
        (name) => {
            const trimmedName = name ? name.trim() : "";
            console.log("🚀 OPTIMIZADO - Setting name filter:", trimmedName);

            setNameFilter(trimmedName);

            // ⚡ OPTIMIZACIÓN: Solo resetear si hay cambio real para evitar renders innecesarios
            if (trimmedName !== nameFilter) {
                // Resetear página de forma más eficiente
                if (resetPage) {
                    resetPage();
                }

                // Limpiar caché de forma optimizada
                if (clearCache) {
                    clearCache();
                }
            }
        },
        [resetPage, clearCache, nameFilter]
    );

    /**
     * ✨ OPTIMIZADO: Resetea el filtro de nombre más eficientemente
     */
    const resetNameFilter = useCallback(() => {
        console.log("🔄 OPTIMIZADO - Resetting name filter");
        setNameFilter("");
        setDebouncedNameFilter("");

        // Limpiar timeout pendiente de forma más eficiente
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
            debounceTimeoutRef.current = null;
        }
    }, []);

    return {
        nameFilter: debouncedNameFilter, // Retornar el valor con debouncing optimizado
        searchByName,
        resetNameFilter,
    };
};

export default useNameSearch;
