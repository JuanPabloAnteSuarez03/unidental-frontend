import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import inventoryService from "../../services/inventoryService";

/**
 * Hook personalizado para la búsqueda de productos en el inventario
 * @returns {object} - Estado y funciones para la búsqueda de productos
 */
const useProductSearch = () => {
    const { authToken } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Referencia para controlar las solicitudes en curso
    const abortControllerRef = useRef(null);

    // Cargar productos iniciales
    useEffect(() => {
        const fetchInitialProducts = async () => {
            if (!authToken) return;

            setIsLoading(true);
            setError(null);

            try {
                const data = await inventoryService.getProducts({}, authToken);
                setProducts(data.results || []);
                setFilteredProducts(data.results || []);
            } catch (err) {
                console.error("Error al cargar productos iniciales:", err);
                setError(
                    "No se pudieron cargar los productos. Por favor, intente nuevamente."
                );
                setProducts([]);
                setFilteredProducts([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInitialProducts();
    }, [authToken]);

    // Realizar búsqueda en toda la base de datos cuando cambia el término de búsqueda
    useEffect(() => {
        const searchProducts = async () => {
            if (!authToken) return;

            // Si el término de búsqueda está vacío, mostramos los productos iniciales
            if (!searchTerm.trim()) {
                // Si ya tenemos productos cargados, los mantenemos
                if (products.length > 0) {
                    setFilteredProducts(products);
                }
                return;
            }

            // Cancelar cualquier solicitud previa
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            // Crear un nuevo controlador para esta solicitud
            abortControllerRef.current = new AbortController();
            const { signal } = abortControllerRef.current;

            setIsLoading(true);
            setError(null);

            try {
                // Usamos el parámetro search para buscar en toda la base de datos
                const data = await inventoryService.getProducts(
                    { search: searchTerm, page_size: 100 }, // Aumentamos el tamaño de página para obtener más resultados
                    authToken,
                    signal
                );

                if (signal.aborted) return;

                setFilteredProducts(data.results || []);
            } catch (err) {
                if (err.name === "AbortError") {
                    console.log("Búsqueda abortada");
                    return;
                }

                console.error("Error al buscar productos:", err);
                setError(
                    "Error al buscar productos. Por favor, intente nuevamente."
                );
            } finally {
                setIsLoading(false);
            }
        };

        // Debounce para evitar demasiadas solicitudes mientras el usuario escribe
        const timeoutId = setTimeout(searchProducts, 300);

        return () => {
            clearTimeout(timeoutId);
            // Cancelar la solicitud si el componente se desmonta o el término cambia
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [searchTerm, authToken]);

    // Función para actualizar el término de búsqueda
    const handleSearch = useCallback((term) => {
        setSearchTerm(term);
    }, []);

    // Función para resetear la búsqueda
    const resetSearch = useCallback(() => {
        setSearchTerm("");
    }, []);

    return {
        searchTerm,
        products,
        filteredProducts,
        isLoading,
        error,
        handleSearch,
        resetSearch,
    };
};

export default useProductSearch;
