import { useState, useCallback, useEffect, useRef } from "react";

/**
 * ✨ SUPER OPTIMIZADO: Hook para manejar la búsqueda por SKU con debouncing inteligente
 * Soporta búsquedas parciales por SKU (ej: ACE, DES, PLA, 004, etc.)
 * @param {Function} resetPage - Función para resetear la página
 * @param {Function} clearCache - Función para limpiar la caché
 * @returns {Object} - Estados y funciones para la búsqueda por SKU
 */
const useSkuSearch = (resetPage, clearCache) => {
    const [skuFilter, setSkuFilter] = useState("");
    const [debouncedSkuFilter, setDebouncedSkuFilter] = useState("");
    const debounceTimeoutRef = useRef(null);

    // ✨ SUPER OPTIMIZACIÓN: Debouncing más rápido y eficiente
    useEffect(() => {
        // Limpiar timeout anterior si existe
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        // ⚡ OPTIMIZACIÓN: Aumentado de 200ms a 500ms para mejor rendimiento
        // Configurar nuevo timeout
        debounceTimeoutRef.current = setTimeout(() => {
            setDebouncedSkuFilter(skuFilter);

            // ✨ NUEVO: Log para verificar búsquedas parciales por SKU
            if (skuFilter && skuFilter.length > 0) {
                console.log(
                    `🔍 SKU Search: Buscando productos con SKU que contenga "${skuFilter}"`
                );
                console.log(
                    `📝 Tipo de búsqueda: ${
                        skuFilter.length < 3
                            ? "Parcial (< 3 chars)"
                            : "Específica"
                    }`
                );
            }
        }, 500); // 500ms de delay para mejor performance

        // Cleanup function
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [skuFilter]);

    /**
     * ✨ OPTIMIZADO: Actualiza el filtro de SKU con mejor performance
     * Permite búsquedas parciales (ej: "ACE" encontrará "ACE-DES-PLA-004")
     * @param {string} sku - SKU a buscar (puede ser parcial)
     */
    const searchBySku = useCallback(
        (sku) => {
            const trimmedSku = sku ? sku.trim() : "";
            console.log("🚀 SKU SEARCH - Setting SKU filter:", trimmedSku);

            // ✨ NUEVO: Información adicional sobre la búsqueda
            if (trimmedSku) {
                console.log(`📊 SKU Search Details:
                    - Término: "${trimmedSku}"
                    - Longitud: ${trimmedSku.length} caracteres
                    - Tipo: ${
                        trimmedSku.includes("-")
                            ? "SKU completo"
                            : "Búsqueda parcial"
                    }
                    - Búsqueda en: Backend API + Cache local`);
            }

            setSkuFilter(trimmedSku);

            // ⚡ OPTIMIZACIÓN: Solo resetear si hay cambio real para evitar renders innecesarios
            if (trimmedSku !== skuFilter) {
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
        [resetPage, clearCache, skuFilter]
    );

    /**
     * ✨ OPTIMIZADO: Resetea el filtro de SKU más eficientemente
     */
    const resetSkuFilter = useCallback(() => {
        console.log("🔄 OPTIMIZADO - Resetting SKU filter");
        setSkuFilter("");
        setDebouncedSkuFilter("");

        // Limpiar timeout pendiente de forma más eficiente
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
            debounceTimeoutRef.current = null;
        }
    }, []);

    return {
        skuFilter: debouncedSkuFilter, // Retornar el valor con debouncing optimizado
        searchBySku,
        resetSkuFilter,
    };
};

export default useSkuSearch;
