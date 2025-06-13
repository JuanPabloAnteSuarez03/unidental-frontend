import { useState, useCallback, useEffect, useRef } from "react";

/**
 * ✨ OPTIMIZADO: Hook para manejar la búsqueda por nombre con debouncing
 * @param {Function} resetPage - Función para resetear la página
 * @param {Function} clearCache - Función para limpiar la caché
 * @returns {Object} - Estados y funciones para la búsqueda por nombre
 */
const useNameSearch = (resetPage, clearCache) => {
    const [nameFilter, setNameFilter] = useState("");
    const [debouncedNameFilter, setDebouncedNameFilter] = useState("");
    const debounceTimeoutRef = useRef(null);

    // ✨ OPTIMIZACIÓN: Implementar debouncing para evitar llamadas excesivas
    useEffect(() => {
        // Limpiar timeout anterior si existe
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        // Configurar nuevo timeout
        debounceTimeoutRef.current = setTimeout(() => {
            setDebouncedNameFilter(nameFilter);
        }, 300); // 300ms de delay

        // Cleanup function
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [nameFilter]);

    /**
     * Actualiza el filtro de nombre con debouncing
     * @param {string} name - Nombre a buscar
     */
    const searchByName = useCallback(
        (name) => {
            const trimmedName = name ? name.trim() : "";
            console.log("Setting name filter:", trimmedName);

            setNameFilter(trimmedName);

            // Solo resetear página y caché si hay un cambio real
            if (trimmedName !== nameFilter) {
                resetPage();
                clearCache();
            }
        },
        [resetPage, clearCache, nameFilter]
    );

    /**
     * Resetea el filtro de nombre
     */
    const resetNameFilter = useCallback(() => {
        console.log("Resetting name filter");
        setNameFilter("");
        setDebouncedNameFilter("");

        // Limpiar timeout pendiente
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
            debounceTimeoutRef.current = null;
        }
    }, []);

    return {
        nameFilter: debouncedNameFilter, // Retornar el valor con debouncing
        searchByName,
        resetNameFilter,
    };
};

export default useNameSearch;
