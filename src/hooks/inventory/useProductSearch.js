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
        updateStockAfterSale,
    } = useProducts();

    const [searchTerm, setSearchTerm] = useState("");
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [error, setError] = useState(null);
    const [allProducts, setAllProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState("");

    // Referencia para el cache local de stock
    const localStockCacheRef = useRef(new Map());
    const abortControllerRef = useRef(null);

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

    // Cargar todos los productos al montar el componente
    useEffect(() => {
        const fetchAllProducts = async () => {
            if (!authToken) return;

            // Cancelar cualquier solicitud previa
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            abortControllerRef.current = new AbortController();
            const { signal } = abortControllerRef.current;

            setIsLoading(true);
            setError(null);

            try {
                console.log("Cargando todos los productos...");

                setLoadingMessage("📦 Obteniendo catálogo de productos...");

                // Obtener productos y stock en paralelo
                const [products, stockMap] = await Promise.all([
                    inventoryService.getAllProducts({}, authToken, signal),
                    (async () => {
                        setLoadingMessage(
                            "📊 Calculando inventario disponible..."
                        );
                        return await inventoryService.getStockMap(
                            authToken,
                            signal
                        );
                    })(),
                ]);

                if (signal.aborted) return;

                setLoadingMessage("🔗 Combinando datos...");

                console.log("Productos recibidos en hook:", products);
                console.log("Stock map recibido:", stockMap);
                console.log("Tipo de productos:", typeof products);
                console.log("Es array:", Array.isArray(products));

                // Validación defensiva: asegurar que products sea un array
                const validProducts = Array.isArray(products) ? products : [];

                // Log para ver estructura de productos
                if (validProducts.length > 0) {
                    console.log(
                        "Estructura del primer producto:",
                        validProducts[0]
                    );
                    console.log(
                        "Campos disponibles:",
                        Object.keys(validProducts[0])
                    );
                    console.log(
                        "¿Tiene stock_quantity?",
                        "stock_quantity" in validProducts[0]
                    );
                    console.log("¿Tiene stock?", "stock" in validProducts[0]);
                    console.log(
                        "¿Tiene quantity?",
                        "quantity" in validProducts[0]
                    );
                }

                // Combinar productos con stock
                const productsWithStock = validProducts.map((product) => ({
                    ...product,
                    stock_quantity: stockMap[product.id] || 0,
                }));

                console.log(
                    "Productos válidos con stock:",
                    productsWithStock.length
                );
                console.log(
                    "Ejemplo producto con stock:",
                    productsWithStock[0]
                );

                // Mostrar productos inmediatamente
                setAllProducts(productsWithStock);
                setFilteredProducts(productsWithStock);

                // Mostrar mensaje de éxito brevemente y luego ocultar loading
                setLoadingMessage(
                    `✅ ${productsWithStock.length} productos listos`
                );

                setTimeout(() => {
                    setLoadingMessage("");
                    setIsLoading(false);
                }, 800);
            } catch (err) {
                if (err.name === "AbortError") {
                    return;
                }
                console.error("Error al cargar productos:", err);
                setError(
                    "No se pudieron cargar los productos. Por favor, intente nuevamente."
                );
                setAllProducts([]);
                setFilteredProducts([]);
                setLoadingMessage("");
                setIsLoading(false);
            }
        };

        fetchAllProducts();

        // Cleanup
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [authToken]);

    // Filtrar productos localmente cuando cambia el término de búsqueda
    useEffect(() => {
        // Validación defensiva: asegurar que allProducts sea un array
        const validAllProducts = Array.isArray(allProducts) ? allProducts : [];

        if (!searchTerm.trim()) {
            setFilteredProducts(validAllProducts);
            return;
        }

        const term = searchTerm.toLowerCase().trim();

        const filtered = validAllProducts.filter((product) => {
            // Validaciones defensivas para cada campo
            const name = product?.name || "";
            const sku = product?.sku || "";
            const barcode = product?.barcode || "";
            const description = product?.description || "";
            const categoryName = product?.category_name || "";

            // Buscar en campos
            const matchesName = name.toLowerCase().includes(term);
            const matchesSku = sku.toLowerCase().includes(term);
            const matchesBarcode = barcode.toLowerCase().includes(term);
            const matchesDescription = description.toLowerCase().includes(term);
            const matchesCategory = categoryName.toLowerCase().includes(term);

            return (
                matchesName ||
                matchesSku ||
                matchesBarcode ||
                matchesDescription ||
                matchesCategory
            );
        });

        console.log(
            `Filtrado: ${filtered.length} productos encontrados para "${term}"`
        );
        setFilteredProducts(filtered);
    }, [searchTerm, allProducts]);

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
    const updateProductsStock = useCallback(
        (soldItems) => {
            if (!Array.isArray(soldItems)) {
                console.warn(
                    "updateProductsStock: soldItems should be an array"
                );
                return;
            }

            console.log("Actualizando stock después de venta:", soldItems);

            // Update stock in the products context
            updateStockAfterSale(soldItems);

            // Also update local cache for consistency
            soldItems.forEach((item) => {
                const productId = item.product_id;
                const quantitySold = item.quantity;

                if (productId && quantitySold > 0) {
                    const currentStock =
                        localStockCacheRef.current.get(productId) || 0;
                    const newStock = Math.max(0, currentStock - quantitySold);
                    localStockCacheRef.current.set(productId, newStock);

                    console.log(
                        `Updated local stock for product ${productId}: ${currentStock} -> ${newStock}`
                    );
                }
            });

            // Update both allProducts and filteredProducts
            setAllProducts((prevProducts) => {
                const updatedProducts = prevProducts.map((product) => {
                    const soldItem = soldItems.find(
                        (item) => item.product_id === product.id
                    );
                    if (soldItem) {
                        const newStock = Math.max(
                            0,
                            (product.stock_quantity || 0) - soldItem.quantity
                        );
                        console.log(
                            `Producto ${product.name}: ${product.stock_quantity} → ${newStock}`
                        );
                        return {
                            ...product,
                            stock_quantity: newStock,
                        };
                    }
                    return product;
                });
                return updatedProducts;
            });

            setFilteredProducts((prevFiltered) => {
                const updatedFiltered = prevFiltered.map((product) => {
                    const soldItem = soldItems.find(
                        (item) => item.product_id === product.id
                    );
                    if (soldItem) {
                        const newStock = Math.max(
                            0,
                            (product.stock_quantity || 0) - soldItem.quantity
                        );
                        return {
                            ...product,
                            stock_quantity: newStock,
                        };
                    }
                    return product;
                });
                return updatedFiltered;
            });
        },
        [updateStockAfterSale]
    );

    // Función para recargar todos los productos
    const reloadProducts = useCallback(async () => {
        if (!authToken) return;

        setIsLoading(true);
        setError(null);

        try {
            // Obtener productos y stock en paralelo
            const [products, stockMap] = await Promise.all([
                inventoryService.getAllProducts({}, authToken),
                inventoryService.getStockMap(authToken),
            ]);

            // Validación defensiva
            const validProducts = Array.isArray(products) ? products : [];

            // Combinar productos con stock
            const productsWithStock = validProducts.map((product) => ({
                ...product,
                stock_quantity: stockMap[product.id] || 0,
            }));

            setAllProducts(productsWithStock);

            // Reapliar el filtro actual
            if (!searchTerm.trim()) {
                setFilteredProducts(productsWithStock);
            }
        } catch (err) {
            console.error("Error al recargar productos:", err);
            setError("No se pudieron recargar los productos.");
        } finally {
            setIsLoading(false);
        }
    }, [authToken, searchTerm]);

    return {
        searchTerm,
        filteredProducts,
        isLoading,
        loadingMessage,
        error,
        handleSearch,
        resetSearch,
        updateProductsStock,
        reloadProducts,
        // Additional cache info
        cacheInfo: getCacheInfo(),
        isInitialized,
    };
};

export default useProductSearch;
