import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import inventoryService from "../../services/inventoryService";

/**
 * Hook personalizado para el filtro de categorías
 * @param {function} resetPage - Función para resetear la paginación
 * @param {function} clearCache - Función para limpiar la caché
 * @returns {object} - Estado y funciones para el filtro de categorías
 */
const useCategoryFilter = (resetPage, clearCache) => {
    // Estado para el filtro de categorías
    const [selectedCategories, setSelectedCategories] = useState([]);
    // Estado para todas las categorías disponibles
    const [availableCategories, setAvailableCategories] = useState([]);
    // Estado de carga
    const [isLoading, setIsLoading] = useState(false);
    // Estado de error
    const [error, setError] = useState(null);

    // Obtener el token de autenticación
    const { authToken } = useAuth();

    // Cargar las categorías disponibles
    useEffect(() => {
        const loadCategories = async () => {
            if (!authToken) return;

            setIsLoading(true);
            setError(null);

            try {
                const categories = await inventoryService.getCategories(
                    authToken
                );
                setAvailableCategories(categories);
            } catch (err) {
                console.error("Error al cargar categorías:", err);
                setError("Error al cargar las categorías");
            } finally {
                setIsLoading(false);
            }
        };

        loadCategories();
    }, [authToken]);

    /**
     * Actualiza las categorías seleccionadas
     * @param {Array<string>} categories - IDs de las categorías seleccionadas
     */
    const updateSelectedCategories = useCallback(
        (categories) => {
            setSelectedCategories(categories);

            // Si se especifican las funciones de reseteo, las llamamos
            if (resetPage) {
                resetPage();
            }

            if (clearCache) {
                clearCache();
            }
        },
        [resetPage, clearCache]
    );

    /**
     * Limpia las categorías seleccionadas
     */
    const resetCategoryFilter = useCallback(() => {
        setSelectedCategories([]);
    }, []);

    /**
     * Comprueba si una categoría está seleccionada
     * @param {string} categoryId - ID de la categoría
     * @returns {boolean} - true si la categoría está seleccionada
     */
    const isCategorySelected = useCallback(
        (categoryId) => {
            return selectedCategories.includes(categoryId);
        },
        [selectedCategories]
    );

    /**
     * Alterna la selección de una categoría
     * @param {string} categoryId - ID de la categoría
     */
    const toggleCategory = useCallback((categoryId) => {
        setSelectedCategories((prev) => {
            if (prev.includes(categoryId)) {
                return prev.filter((id) => id !== categoryId);
            } else {
                return [...prev, categoryId];
            }
        });
    }, []);

    return {
        selectedCategories,
        availableCategories,
        isLoading,
        error,
        updateSelectedCategories,
        resetCategoryFilter,
        isCategorySelected,
        toggleCategory,
    };
};

export default useCategoryFilter;
