import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useProducts } from "../../context/ProductsContext";
import inventoryService from "../../services/inventoryService";

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
        updateStockAfterSale 
    } = useProducts();
    
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [error, setError] = useState(null);

    // Referencia para el cache local de stock
    const localStockCacheRef = useRef(new Map());

    // Search products using cache when search term changes
    useEffect(() => {
        if (!searchTerm || searchTerm.length < 2) {
            setFilteredProducts([]);
            return;
        }

        // Use cached search from context
        const results = searchProducts(searchTerm);
        setFilteredProducts(results);
    }, [searchTerm, searchProducts]);

    // Función para actualizar el término de búsqueda
    const handleSearch = useCallback((term) => {
        setSearchTerm(term);
    }, []);

    // Función para resetear la búsqueda
    const resetSearch = useCallback(() => {
        setSearchTerm("");
        setFilteredProducts([]);
    }, []);

    // Función para actualizar stock local después de ventas
    const updateProductsStock = useCallback((soldItems) => {
        if (!Array.isArray(soldItems)) {
            console.warn("updateProductsStock: soldItems should be an array");
            return;
        }

        console.log("Updating stock after sale:", soldItems);
        
        // Update stock in the products context
        updateStockAfterSale(soldItems);
        
        // Also update local cache for consistency
        soldItems.forEach(item => {
            const productId = item.product_id;
            const quantitySold = item.quantity;
            
            if (productId && quantitySold > 0) {
                const currentStock = localStockCacheRef.current.get(productId) || 0;
                const newStock = Math.max(0, currentStock - quantitySold);
                localStockCacheRef.current.set(productId, newStock);
                
                console.log(`Updated local stock for product ${productId}: ${currentStock} -> ${newStock}`);
            }
        });
    }, [updateStockAfterSale]);

    // Determinar el estado de carga y mensaje
    const isLoading = productsLoading && !isInitialized;
    
    const loadingMessage = (() => {
        if (isLoading) {
            return "Cargando productos...";
        }
        return "";
    })();

    return {
        searchTerm,
        filteredProducts,
        isLoading,
        loadingMessage,
        error,
        handleSearch,
        resetSearch,
        updateProductsStock,
        // Additional cache info
        cacheInfo: getCacheInfo(),
        isInitialized
    };
};

export default useProductSearch;
