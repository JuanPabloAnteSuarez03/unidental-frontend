import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useProducts } from "../../context/ProductsContext";

/**
 * Hook personalizado para la búsqueda de productos en el inventario
 * Usa el contexto de productos con caché para mejor rendimiento
 * @returns {object} - Estado y funciones para la búsqueda de productos
 */
const useProductSearch = () => {
    const { authToken } = useAuth();
    const {
        productsCache,
        searchProducts,
        isLoading: productsLoading,
        isInitialized,
        getCacheInfo,
        updateStockAfterSale,
        loadAllProducts,
    } = useProducts();

    const [searchTerm, setSearchTerm] = useState("");
    const [error, setError] = useState(null);
    const [loadingMessage, setLoadingMessage] = useState("");

    // 🚀 OPTIMIZACIÓN: Usar directamente la búsqueda del contexto
    const filteredProducts = searchProducts(searchTerm);

    // 🚀 OPTIMIZACIÓN: Cargar productos del contexto al inicializar
    useEffect(() => {
        if (!authToken) return;

        // Si el contexto no está inicializado, iniciarlo
        if (!isInitialized && !productsLoading) {
            console.log("🔄 Inicializando contexto de productos...");
            setLoadingMessage("📦 Cargando productos...");
            loadAllProducts().finally(() => {
                setLoadingMessage("");
            });
        } else if (isInitialized && productsCache.length > 0) {
            console.log("✅ Productos ya disponibles en contexto:", productsCache.length);
            setLoadingMessage("");
        }
    }, [authToken, isInitialized, productsLoading, loadAllProducts, productsCache.length]);

    // Función para actualizar el término de búsqueda
    const handleSearch = useCallback((term) => {
        setSearchTerm(term || "");
    }, []);

    // Función para resetear la búsqueda
    const resetSearch = useCallback(() => {
        setSearchTerm("");
    }, []);

    // Función para actualizar stock después de venta (delegada al contexto)
    const updateProductsStock = useCallback((soldItems) => {
        updateStockAfterSale(soldItems);
    }, [updateStockAfterSale]);

    return {
        // Estado de búsqueda
        searchTerm,
        filteredProducts, // Viene directamente del contexto
        isLoading: productsLoading, // Usar el loading del contexto
        loadingMessage,
        error,

        // Funciones
        handleSearch,
        resetSearch,
        updateProductsStock,

        // Info del cache del contexto
        getCacheInfo,
        
        // Acceso directo al cache
        productsCache,
        isInitialized,
    };
};

export default useProductSearch;
