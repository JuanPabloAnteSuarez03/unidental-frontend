import React, {
    useState,
    useCallback,
    useRef,
    useImperativeHandle,
    forwardRef,
    useMemo,
    useEffect,
} from "react";
import ProductSearchSelector from "../Common/ProductSearchSelector";
import PriceSourceLegend from "./PriceSourceLegend";
import { useAuth } from "../../context/AuthContext";
import inventoryService from "../../services/inventoryService";
import batchesService from "../../services/batchesService";
// ❌ REMOVIDO: import compositeProductsService from "../../services/compositeProductsService";
import advancedInventoryService from "../../services/advancedInventoryService";
import { getAvailableConversions } from "../../services/conversionService";
import ConversionSuggestionsModal from "./ConversionSuggestionsModal";
import { getConversionSuggestions } from "../../services/conversionService";
import { useProducts } from "../../context/ProductsContext";

const ProductSelector = forwardRef(
    ({ onProductAdded, selectedLocation, availableLocations = [] }, ref) => {
        const { authToken } = useAuth();
        const [selectedProduct, setSelectedProduct] = useState(null);
        const [quantity, setQuantity] = useState(1);
        const [unitPrice, setUnitPrice] = useState("");
        const [priceInfo, setPriceInfo] = useState(null);
        const [loadingPrice, setLoadingPrice] = useState(false);
        const [error, setError] = useState(null);
        const [stockInfo, setStockInfo] = useState(null);
        const [loadingStock, setLoadingStock] = useState(false);

        // Nuevos estados para lotes y productos compuestos
        const [productSalesInfo, setProductSalesInfo] = useState(null);
        const [selectedBatches, setSelectedBatches] = useState([]);
        const [loadingAdvancedInfo, setLoadingAdvancedInfo] = useState(false);
        const [stockByLocation, setStockByLocation] = useState([]);
        const [conversionSuggestions, setConversionSuggestions] =
            useState(null);
        const [showConversionModal, setShowConversionModal] = useState(false);
        const [conversionError, setConversionError] = useState(null);

        // Cambia el estado de error a errorStock para distinguirlo
        const [errorStock, setErrorStock] = useState(null);
        const [isRefreshingAfterConversion, setIsRefreshingAfterConversion] =
            useState(false);

        const updateProductsStockRef = useRef(null);

        // Exponer la función updateProductsStock al componente padre
        useImperativeHandle(
            ref,
            () => ({
                updateProductsStock: (soldItems) => {
                    if (updateProductsStockRef.current) {
                        updateProductsStockRef.current(soldItems);
                    }
                },
            }),
            []
        );

        // Crear un mapa de ubicaciones para acceso rápido por ID
        const locationMap = useMemo(() => {
            return availableLocations.reduce((map, location) => {
                map[location.id] = location;
                return map;
            }, {});
        }, [availableLocations]);

        // Función para obtener nombre de ubicación por ID
        const getLocationName = useCallback(
            (locationId) => {
                const location = locationMap[locationId];
                return location ? location.name : `Ubicación ${locationId}`;
            },
            [locationMap]
        );

        // Efecto para actualizar información de stock cuando cambia la ubicación seleccionada
        useEffect(() => {
            if (selectedProduct && stockInfo && stockInfo.allLocations) {
                console.log(
                    "Location changed, updating stock info for product:",
                    selectedProduct.id
                );

                // Recalcular información de stock para la nueva ubicación
                const totalStock = Object.values(stockInfo.allLocations).reduce(
                    (sum, qty) => sum + qty,
                    0
                );

                let availableInLocation = null;
                if (
                    selectedLocation &&
                    stockInfo.allLocations[selectedLocation.id] !== undefined
                ) {
                    availableInLocation =
                        stockInfo.allLocations[selectedLocation.id];
                } else if (selectedLocation) {
                    availableInLocation = 0;
                }

                setStockInfo((prevInfo) => ({
                    ...prevInfo,
                    availableInLocation: availableInLocation,
                    locationName: selectedLocation?.name || null,
                }));

                // Recargar información avanzada si es necesario
                if (
                    productSalesInfo?.requiresBatchControl &&
                    selectedLocation
                ) {
                    loadAdvancedProductInfo(
                        selectedProduct,
                        selectedLocation.id
                    );
                }
            }
        }, [
            selectedLocation?.id,
            selectedProduct?.id,
            stockInfo?.allLocations,
        ]);

        // Efecto adicional para reaccionar inmediatamente a cambios de ubicación
        useEffect(() => {
            // Si hay un producto seleccionado y información de stock, actualizar inmediatamente
            if (selectedProduct && stockInfo?.allLocations) {
                const newAvailableInLocation =
                    selectedLocation &&
                    stockInfo.allLocations[selectedLocation.id] !== undefined
                        ? stockInfo.allLocations[selectedLocation.id]
                        : 0;

                setStockInfo((prevInfo) => ({
                    ...prevInfo,
                    availableInLocation: newAvailableInLocation,
                    locationName: selectedLocation?.name || null,
                }));
            }
        }, [selectedLocation]);

        // Función para cargar información avanzada del producto
        const loadAdvancedProductInfo = useCallback(
            async (product, locationId) => {
                if (!authToken || !locationId || !product) return;

                setLoadingAdvancedInfo(true);
                try {
                    const salesInfo =
                        await advancedInventoryService.getProductSalesInfo(
                            product,
                            locationId,
                            authToken
                        );

                    setProductSalesInfo(salesInfo);

                    // Si requiere control de lotes, limpiar selección anterior
                    if (salesInfo.requiresBatchControl) {
                        setSelectedBatches([]);
                    }
                } catch (error) {
                    console.error(
                        "Error loading advanced product info:",
                        error
                    );
                    // Fallback: crear información básica (todos los productos son simples ahora)
                    const basicProductInfo = {
                        ...product,
                        requiresBatchControl:
                            product.requires_batch_control === true,
                        productType: "simple", // Todos los productos son simples ahora
                        batches: [],
                        stockInfo: null,
                    };
                    setProductSalesInfo(basicProductInfo);
                } finally {
                    setLoadingAdvancedInfo(false);
                }
            },
            [authToken]
        );

        // Capturar la función del hook
        const handleUpdateProductsStock = useCallback((updateFn) => {
            updateProductsStockRef.current = updateFn;
        }, []);

        // Handle product selection from search
        const handleProductSelected = useCallback(
            async (product) => {
                setSelectedProduct(product);
                setQuantity(1);
                setError(null);
                setLoadingPrice(true);
                setLoadingStock(true);
                setPriceInfo(null);
                setStockInfo(null);
                setProductSalesInfo(null);
                setSelectedBatches([]);
                setStockByLocation([]); // Resetear el stock por sede

                try {
                    // Ejecutar ambas operaciones en paralelo
                    // Obtener precio inteligente
                    console.log("🔍 DEBUG PRECIO - Producto seleccionado:", product);
                    console.log("🔍 DEBUG PRECIO - Product ID:", product.id);
                    
                    const intelligentPrice =
                        await inventoryService.getIntelligentPrice(
                            product.id,
                            authToken
                        );
                    
                    console.log("🔍 DEBUG PRECIO - Resultado completo:", intelligentPrice);
                    console.log("🔍 DEBUG PRECIO - Source:", intelligentPrice.source);
                    console.log("🔍 DEBUG PRECIO - Price:", intelligentPrice.price);
                    console.log("🔍 DEBUG PRECIO - Label:", intelligentPrice.source_label);

                    // Usar solo la función rápida de stock
                    console.log(
                        "🔍 DEBUG: Getting stock for product:",
                        product.id
                    );
                    console.log(
                        "🔍 DEBUG: Auth token:",
                        authToken ? "Present" : "Missing"
                    );
                    console.log(
                        "🔍 DEBUG: This is the FIXED version with Number() conversion"
                    );
                    const locationStockMap =
                        await inventoryService.getStockByLocationFast(
                            product.id,
                            authToken
                        );
                    console.log("Stock search result:", locationStockMap);
                    console.log(
                        "Location stock map keys:",
                        Object.keys(locationStockMap)
                    );
                    console.log(
                        "Location stock map values:",
                        Object.values(locationStockMap)
                    );
                    console.log("Selected location:", selectedLocation);
                    console.log("Selected location ID:", selectedLocation?.id);
                    console.log(
                        "Selected location ID type:",
                        typeof selectedLocation?.id
                    );

                    console.log("Location stock map:", locationStockMap);

                    console.log(
                        "Precio inteligente recibido:",
                        intelligentPrice
                    );
                    console.log("Selected location:", selectedLocation);

                    setUnitPrice(intelligentPrice.price.toString());
                    setPriceInfo({
                        source: intelligentPrice.source,
                        source_label: intelligentPrice.source_label,
                        price: intelligentPrice.price,
                    });

                    // Procesar información de stock por ubicación
                    console.log("Processing stock for product:", product.id);
                    console.log(
                        "Location stock map exists:",
                        !!locationStockMap
                    );
                    console.log("Location stock data:", locationStockMap);
                    console.log("Selected location ID:", selectedLocation?.id);

                    if (
                        locationStockMap &&
                        Object.keys(locationStockMap).length > 0
                    ) {
                        // El producto tiene stock en una o más ubicaciones
                        const totalStock = Object.values(
                            locationStockMap
                        ).reduce((sum, qty) => sum + (qty > 0 ? qty : 0), 0);
                        console.log("Total stock calculated:", totalStock);

                        let availableInLocation = null;
                        if (
                            selectedLocation &&
                            locationStockMap[Number(selectedLocation.id)] !==
                                undefined
                        ) {
                            availableInLocation =
                                locationStockMap[Number(selectedLocation.id)];
                            console.log(
                                "✅ FIXED: Stock in selected location:",
                                availableInLocation
                            );
                        } else if (selectedLocation) {
                            // La sede seleccionada no tiene stock de este producto
                            availableInLocation = 0;
                            console.log(
                                "❌ FIXED: Selected location has no stock for this product"
                            );
                        }

                        setStockInfo({
                            availableInLocation: availableInLocation,
                            locationName: selectedLocation?.name || null,
                            totalStock: totalStock,
                            allLocations: locationStockMap,
                            hasStockData: true,
                        });

                        console.log("Stock info set:", {
                            availableInLocation,
                            locationName: selectedLocation?.name,
                            totalStock,
                            allLocations: locationStockMap,
                        });
                    } else {
                        // El producto no tiene stock en ninguna ubicación
                        console.log(
                            "No stock found for product in any location"
                        );
                        setStockInfo({
                            availableInLocation: 0,
                            locationName: selectedLocation?.name || null,
                            totalStock: 0,
                            allLocations: {},
                            hasStockData: true,
                            noStockRegistered: true,
                        });
                    }

                    // Obtener stock por sede igual que la tabla principal
                    const stockLocations =
                        await inventoryService.getProductStockByLocations(
                            product.id,
                            authToken
                        );
                    setStockByLocation(stockLocations);

                    // Cargar información avanzada si hay ubicación seleccionada
                    if (selectedLocation) {
                        await loadAdvancedProductInfo(
                            product,
                            selectedLocation.id
                        );
                    }
                } catch (error) {
                    console.error(
                        "Error obteniendo precio inteligente o stock:",
                        error
                    );
                    // Fallback: usar selling_price del producto si está disponible
                    const fallbackPrice =
                        product.selling_price || product.cost_price || "";
                    setUnitPrice(fallbackPrice.toString());

                    if (product.selling_price) {
                        setPriceInfo({
                            source: "suggested",
                            source_label: "Precio de venta sugerido",
                            price: product.selling_price,
                        });
                    } else if (product.cost_price) {
                        setPriceInfo({
                            source: "cost",
                            source_label: "Precio de costo",
                            price: product.cost_price,
                        });
                    } else {
                        setPriceInfo({
                            source: "none",
                            source_label:
                                "Sin precio disponible - Ingrese manualmente",
                            price: 0,
                        });
                    }

                    // Establecer stock como no disponible en caso de error
                    setStockInfo({
                        availableInLocation: 0,
                        locationName: selectedLocation?.name || null,
                        totalStock: 0,
                        allLocations: {},
                        hasStockData: true,
                        error: true,
                    });

                    setError("Error al obtener información del producto");
                } finally {
                    setLoadingPrice(false);
                    setLoadingStock(false);
                }
            },
            [authToken, selectedLocation, loadAdvancedProductInfo]
        );

        // Función para seleccionar lotes automáticamente usando FIFO
        const selectBatchesAutomatically = useCallback(
            async (requestedQuantity) => {
                if (
                    !selectedProduct ||
                    !selectedLocation ||
                    !productSalesInfo?.requiresBatchControl
                ) {
                    return;
                }

                try {
                    const batchSelection =
                        await advancedInventoryService.selectBatchesFIFO(
                            selectedProduct.id,
                            selectedLocation.id,
                            requestedQuantity,
                            authToken
                        );

                    if (batchSelection.success) {
                        setSelectedBatches(batchSelection.selectedBatches);
                        setError(null);
                    } else {
                        setError(batchSelection.message);
                        setSelectedBatches([]);
                    }
                } catch (error) {
                    console.error("Error selecting batches:", error);
                    setError("Error al seleccionar lotes automáticamente");
                    setSelectedBatches([]);
                }
            },
            [selectedProduct, selectedLocation, productSalesInfo, authToken]
        );

        // Efecto para seleccionar lotes automáticamente cuando cambia la cantidad
        useEffect(() => {
            if (productSalesInfo?.requiresBatchControl && quantity > 0) {
                selectBatchesAutomatically(quantity);
            }
        }, [
            quantity,
            productSalesInfo?.requiresBatchControl,
            selectBatchesAutomatically,
        ]);

        // Handle clearing product selection
        const handleSelectionCleared = useCallback(() => {
            setSelectedProduct(null);
            setQuantity(1);
            setUnitPrice("");
            setPriceInfo(null);
            setStockInfo(null);
            setProductSalesInfo(null);
            setSelectedBatches([]);
            setStockByLocation([]); // Resetear el stock por sede
            setError(null);
        }, []);

        // Handle manual price change
        const handlePriceChange = useCallback(
            (newPrice) => {
                setUnitPrice(newPrice);

                // Si el usuario cambia el precio manualmente, actualizar el indicador
                if (priceInfo && newPrice !== priceInfo.price.toString()) {
                    setPriceInfo({
                        source: "manual",
                        source_label: "Precio personalizado",
                        price: parseFloat(newPrice) || 0,
                    });
                }
            },
            [priceInfo]
        );

        // Get price info icon and color based on source
        const getPriceSourceIcon = (source) => {
            switch (source) {
                case "sale":
                    return { icon: "💰", color: "#27ae60", bgColor: "#d5edda" };
                case "purchase":
                    return { icon: "📦", color: "#3498db", bgColor: "#e8f4fd" };
                case "suggested":
                    return { icon: "💡", color: "#f39c12", bgColor: "#fef9e7" };
                case "cost":
                    return { icon: "🏷️", color: "#9b59b6", bgColor: "#f4ecf7" };
                case "manual":
                    return { icon: "✏️", color: "#17a2b8", bgColor: "#e6f9fc" };
                case "none":
                    return { icon: "⚠️", color: "#e74c3c", bgColor: "#fdedec" };
                default:
                    return { icon: "❓", color: "#95a5a6", bgColor: "#f8f9fa" };
            }
        };

        // Handle adding product to sale
        const handleAddToSale = useCallback(async () => {
            if (!selectedProduct) {
                setError("Debe seleccionar un producto");
                return;
            }

            if (!unitPrice || parseFloat(unitPrice) <= 0) {
                setError("Debe ingresar un precio válido");
                return;
            }

            if (!quantity || quantity < 1) {
                setError("La cantidad debe ser mayor a 0");
                return;
            }

            if (!selectedLocation) {
                setError("Debe seleccionar una ubicación");
                return;
            }

            // Validar stock disponible si hay información de stock
            if (stockInfo && selectedLocation) {
                const availableStock =
                    stockInfo.availableInLocation !== null
                        ? stockInfo.availableInLocation
                        : 0;
                if (quantity > availableStock) {
                    setError(
                        `Stock insuficiente. Disponible en ${selectedLocation.name}: ${availableStock} unidades`
                    );
                    return;
                }
            }

            // Validar lotes si el producto requiere control de lotes
            if (productSalesInfo?.requiresBatchControl) {
                if (selectedBatches.length === 0) {
                    setError("No hay lotes disponibles para este producto");
                    return;
                }

                const totalSelectedFromBatches = selectedBatches.reduce(
                    (sum, batch) => sum + (batch.selectedQuantity || 0),
                    0
                );

                if (totalSelectedFromBatches < quantity) {
                    setError(
                        `Lotes seleccionados insuficientes. Necesario: ${quantity}, Disponible en lotes: ${totalSelectedFromBatches}`
                    );
                    return;
                }
            }

            console.log(
                "ProductSelector - handleAddToSale - Valores antes de enviar:",
                {
                    selectedProduct: selectedProduct.name,
                    quantity: quantity,
                    quantityType: typeof quantity,
                    unitPrice: unitPrice,
                    unitPriceType: typeof unitPrice,
                    parsedUnitPrice: parseFloat(unitPrice),
                    parsedUnitPriceType: typeof parseFloat(unitPrice),
                    requiresBatchControl:
                        productSalesInfo?.requiresBatchControl,
                    selectedBatches: selectedBatches,
                }
            );

            try {
                // Preparar datos adicionales para la venta
                const additionalData = {};

                // Agregar información de lotes si es necesario
                if (
                    productSalesInfo?.requiresBatchControl &&
                    selectedBatches.length > 0
                ) {
                    additionalData.batches = selectedBatches.map((batch) => ({
                        batch_id: batch.batch_id || batch.id,
                        batch_number: batch.batch_number,
                        quantity: batch.selectedQuantity,
                        expiry_date: batch.expiry_date,
                        stock_id: batch.stock_id,
                        location_id: selectedLocation.id,
                    }));
                }

                // Para productos compuestos, NO enviamos información adicional
                // El backend maneja automáticamente el desarmado según la documentación
                // Solo se envía como un producto normal y el backend hace el resto

                // Llamar a la función del padre con datos adicionales
                onProductAdded(
                    selectedProduct,
                    quantity,
                    parseFloat(unitPrice),
                    additionalData
                );

                // Reset form
                setSelectedProduct(null);
                setQuantity(1);
                setUnitPrice("");
                setStockInfo(null);
                setProductSalesInfo(null);
                setSelectedBatches([]);
                setStockByLocation([]); // Resetear el stock por sede
                setError(null);
            } catch (error) {
                console.error("Error adding product:", error);
                setError("Error al agregar el producto");
            }
        }, [
            selectedProduct,
            quantity,
            unitPrice,
            selectedLocation,
            stockInfo,
            productSalesInfo,
            selectedBatches,
            onProductAdded,
        ]);

        const handleQuantityChange = (newQuantity) => {
            setQuantity(newQuantity);
            setErrorStock(null);
            setConversionSuggestions(null);
            setShowConversionModal(false);
            setConversionError(null);

            // Solo para productos con lotes y sede seleccionada
            if (
                productSalesInfo?.requiresBatchControl &&
                selectedLocation &&
                productSalesInfo.batches
            ) {
                const stockEnSede = productSalesInfo.batches.reduce(
                    (sum, batch) => sum + (batch.quantity || 0),
                    0
                );
                if (parseInt(newQuantity) > stockEnSede) {
                    // Consultar sugerencias de conversión
                    (async () => {
                        console.log(
                            "Intentando consultar sugerencias de conversión..."
                        );
                        try {
                            const suggestions = await getAvailableConversions(
                                selectedProduct.id,
                                selectedLocation.id,
                                authToken
                            );
                            console.log(
                                "Sugerencias de conversión:",
                                suggestions
                            );
                            if (suggestions && suggestions.length > 0) {
                                setConversionSuggestions(suggestions);
                                setShowConversionModal(true);
                                setErrorStock(null);
                            } else {
                                setConversionSuggestions(null);
                                setShowConversionModal(false);
                                setErrorStock(
                                    `Stock insuficiente. Disponible en ${selectedLocation.name}: ${stockEnSede} unidades (sin sugerencias de conversión)`
                                );
                            }
                        } catch (err) {
                            setConversionSuggestions(null);
                            setShowConversionModal(false);
                            setErrorStock(
                                "Error consultando sugerencias de conversión"
                            );
                        }
                    })();
                } else {
                    setErrorStock(null);
                }
            } else {
                setErrorStock(null);
            }
        };

        // useEffect para forzar la consulta si el usuario cambia de producto o sede y la cantidad es mayor al stock
        useEffect(() => {
            // Solo para productos con lotes y sede seleccionada
            if (
                productSalesInfo?.requiresBatchControl &&
                selectedLocation &&
                productSalesInfo.batches
            ) {
                const stockEnSede = productSalesInfo.batches.reduce(
                    (sum, batch) => sum + (batch.quantity || 0),
                    0
                );
                if (parseInt(quantity) > stockEnSede) {
                    // Consultar sugerencias de conversión (POST)
                    (async () => {
                        console.log(
                            "Intentando consultar sugerencias de conversión..."
                        );
                        try {
                            const resp = await getConversionSuggestions(
                                selectedProduct.id,
                                parseInt(quantity),
                                selectedLocation.id,
                                authToken
                            );
                            console.log("Respuesta sugerencias:", resp);
                            if (
                                resp &&
                                resp.suggestions &&
                                resp.suggestions.length > 0
                            ) {
                                setConversionSuggestions(resp.suggestions);
                                setShowConversionModal(true);
                                setErrorStock(null);
                            } else {
                                setConversionSuggestions(null);
                                setShowConversionModal(false);
                                setErrorStock(
                                    `Stock insuficiente. Disponible en ${selectedLocation.name}: ${stockEnSede} unidades (sin sugerencias de conversión)`
                                );
                            }
                        } catch (err) {
                            setConversionSuggestions(null);
                            setShowConversionModal(false);
                            setErrorStock(
                                "Error consultando sugerencias de conversión"
                            );
                        }
                    })();
                } else {
                    setConversionSuggestions(null);
                    setShowConversionModal(false);
                    setErrorStock(null);
                }
            } else {
                setConversionSuggestions(null);
                setShowConversionModal(false);
                setErrorStock(null);
            }
            // eslint-disable-next-line
        }, [quantity, selectedProduct, selectedLocation, productSalesInfo]);

        const { refreshCache } = useProducts();

        // Handler para conversión exitosa
        const handleConversionSuccess = useCallback(
            async (suggestion, batch, result) => {
                setIsRefreshingAfterConversion(true);
                await refreshCache();
                // Volver a cargar el producto seleccionado y su stock/lotes
                if (selectedProduct) {
                    await handleProductSelected(selectedProduct);
                }
                setShowConversionModal(false);
                setConversionSuggestions(null);
                setErrorStock(null);
                // Volver a intentar agregar la cantidad original automáticamente
                setTimeout(async () => {
                    await handleAddToSale();
                    setIsRefreshingAfterConversion(false);
                }, 500); // Pequeño delay para asegurar que el stock se refresque
                // Mensaje de éxito
                // (alert eliminado)
            },
            [
                refreshCache,
                selectedProduct,
                handleProductSelected,
                handleAddToSale,
            ]
        );

        return (
            <div style={{ position: "relative" }}>
                {isRefreshingAfterConversion && (
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            background: "rgba(255,255,255,0.7)",
                            zIndex: 100,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 12,
                        }}
                    >
                        <div className="spinner" style={{ marginBottom: 12 }}>
                            <svg
                                width="40"
                                height="40"
                                viewBox="0 0 40 40"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <circle
                                    cx="20"
                                    cy="20"
                                    r="18"
                                    stroke="#007bff"
                                    strokeWidth="4"
                                    strokeDasharray="90 60"
                                    strokeLinecap="round"
                                >
                                    <animateTransform
                                        attributeName="transform"
                                        type="rotate"
                                        repeatCount="indefinite"
                                        dur="1s"
                                        from="0 20 20"
                                        to="360 20 20"
                                    />
                                </circle>
                            </svg>
                        </div>
                        <div
                            style={{
                                color: "#007bff",
                                fontWeight: 600,
                                fontSize: 16,
                            }}
                        >
                            Actualizando stock y agregando producto a la
                            venta...
                        </div>
                    </div>
                )}
                {error && !showConversionModal && (
                    <div
                        style={{
                            marginBottom: "15px",
                            padding: "12px",
                            backgroundColor: "#f8d7da",
                            border: "1px solid #f5c6cb",
                            borderRadius: "4px",
                            color: "#721c24",
                            fontSize: "14px",
                        }}
                    >
                        {error}
                    </div>
                )}
                {errorStock && !showConversionModal && (
                    <div style={{ color: "red", marginBottom: 8 }}>
                        {errorStock}
                    </div>
                )}

                {/* Price Source Legend */}
                <PriceSourceLegend />

                {/* Product Search */}
                <div style={{ marginBottom: "20px" }}>
                    <label
                        style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#2c3e50",
                            marginBottom: "8px",
                        }}
                    >
                        Buscar Producto
                    </label>

                    <ProductSearchSelector
                        onProductSelected={handleProductSelected}
                        onSelectionCleared={handleSelectionCleared}
                        onUpdateProductsStock={handleUpdateProductsStock}
                        placeholder="Buscar producto por nombre, SKU o código..."
                        maxResults={20}
                        initialProduct={selectedProduct}
                        showSelectedProduct={true}
                        allowClearSelection={true}
                    />
                </div>

                {/* Quantity and Price Inputs - Only show when product is selected */}
                {selectedProduct && (
                    <div>
                        {/* Price Source Indicator */}
                        {priceInfo && (
                            <div
                                style={{
                                    marginBottom: "15px",
                                    padding: "12px",
                                    backgroundColor: getPriceSourceIcon(
                                        priceInfo.source
                                    ).bgColor,
                                    border: `1px solid ${
                                        getPriceSourceIcon(priceInfo.source)
                                            .color
                                    }`,
                                    borderRadius: "6px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                }}
                            >
                                <span style={{ fontSize: "16px" }}>
                                    {getPriceSourceIcon(priceInfo.source).icon}
                                </span>
                                <div style={{ flex: 1 }}>
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            color: getPriceSourceIcon(
                                                priceInfo.source
                                            ).color,
                                            marginBottom: "2px",
                                        }}
                                    >
                                        {priceInfo.source_label}
                                    </div>
                                    {priceInfo.price > 0 && (
                                        <div
                                            style={{
                                                fontSize: "12px",
                                                color: "#6c757d",
                                            }}
                                        >
                                            Precio sugerido: $
                                            {Number(
                                                priceInfo.price
                                            ).toLocaleString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Loading indicator */}
                        {loadingPrice && (
                            <div
                                style={{
                                    marginBottom: "15px",
                                    padding: "12px",
                                    backgroundColor: "#e8f4fd",
                                    border: "1px solid #3498db",
                                    borderRadius: "6px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                }}
                            >
                                <div
                                    style={{
                                        width: "16px",
                                        height: "16px",
                                        border: "2px solid #b8daff",
                                        borderTop: "2px solid #3498db",
                                        borderRadius: "50%",
                                        animation: "spin 1s linear infinite",
                                    }}
                                />
                                <span
                                    style={{
                                        fontSize: "14px",
                                        color: "#3498db",
                                    }}
                                >
                                    Obteniendo mejor precio disponible...
                                </span>
                                <style>
                                    {`
                                    @keyframes spin {
                                        0% { transform: rotate(0deg); }
                                        100% { transform: rotate(360deg); }
                                    }
                                `}
                                </style>
                            </div>
                        )}

                        {/* Stock Information */}
                        {loadingStock && (
                            <div
                                style={{
                                    marginBottom: "15px",
                                    padding: "12px",
                                    backgroundColor: "#fff3cd",
                                    border: "1px solid #ffeaa7",
                                    borderRadius: "6px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                }}
                            >
                                <div
                                    style={{
                                        width: "16px",
                                        height: "16px",
                                        border: "2px solid #fdcb6e",
                                        borderTop: "2px solid #f39c12",
                                        borderRadius: "50%",
                                        animation: "spin 1s linear infinite",
                                    }}
                                />
                                <span
                                    style={{
                                        fontSize: "14px",
                                        color: "#f39c12",
                                    }}
                                >
                                    Verificando stock disponible...
                                </span>
                            </div>
                        )}

                        {/* Stock Display */}
                        {stockInfo && !loadingStock && (
                            <div
                                style={{
                                    marginBottom: "15px",
                                    padding: "12px",
                                    backgroundColor:
                                        stockInfo.availableInLocation > 0 ||
                                        stockInfo.totalStock > 0
                                            ? "#d4edda"
                                            : "#f8d7da",
                                    border: `1px solid ${
                                        stockInfo.availableInLocation > 0 ||
                                        stockInfo.totalStock > 0
                                            ? "#c3e6cb"
                                            : "#f5c6cb"
                                    }`,
                                    borderRadius: "6px",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        marginBottom: "8px",
                                    }}
                                >
                                    <span style={{ fontSize: "16px" }}>
                                        {stockInfo.availableInLocation > 0 ||
                                        stockInfo.totalStock > 0
                                            ? "📦"
                                            : "⚠️"}
                                    </span>
                                    <div style={{ flex: 1 }}>
                                        <div
                                            style={{
                                                fontSize: "14px",
                                                fontWeight: "600",
                                                color:
                                                    stockInfo.availableInLocation >
                                                        0 ||
                                                    stockInfo.totalStock > 0
                                                        ? "#155724"
                                                        : "#721c24",
                                                marginBottom: "2px",
                                            }}
                                        >
                                            Stock Disponible
                                        </div>

                                        {/* Stock en la sede seleccionada */}
                                        {selectedLocation && (
                                            <div
                                                style={{
                                                    fontSize: "13px",
                                                    color: "#155724",
                                                    marginBottom: "4px",
                                                }}
                                            >
                                                <strong>
                                                    {selectedLocation.name}:
                                                </strong>{" "}
                                                {
                                                    // Siempre usar la suma de los lotes activos en la sede seleccionada si existen
                                                    productSalesInfo?.requiresBatchControl &&
                                                    productSalesInfo?.batches &&
                                                    productSalesInfo.batches
                                                        .length > 0
                                                        ? productSalesInfo.batches.reduce(
                                                              (sum, batch) =>
                                                                  sum +
                                                                  (batch.quantity ||
                                                                      0),
                                                              0
                                                          )
                                                        : stockInfo?.availableInLocation ??
                                                          0
                                                }{" "}
                                                unidades
                                            </div>
                                        )}

                                        {/* Stock total */}
                                        <div
                                            style={{
                                                fontSize: "12px",
                                                color: "#6c757d",
                                            }}
                                        >
                                            Stock total:{" "}
                                            {stockByLocation.reduce(
                                                (sum, loc) =>
                                                    sum + (loc.stock || 0),
                                                0
                                            )}{" "}
                                            unidades
                                        </div>

                                        {/* Desglose por ubicaciones si hay múltiples */}
                                        {stockByLocation.length > 1 && (
                                            <div
                                                style={{
                                                    fontSize: "11px",
                                                    color: "#6c757d",
                                                    marginTop: "4px",
                                                }}
                                            >
                                                <details>
                                                    <summary
                                                        style={{
                                                            cursor: "pointer",
                                                            fontWeight: "500",
                                                        }}
                                                    >
                                                        Ver stock en todas las
                                                        sedes (
                                                        {stockByLocation.length}
                                                        )
                                                    </summary>
                                                    <div
                                                        style={{
                                                            marginTop: "8px",
                                                            paddingLeft: "12px",
                                                        }}
                                                    >
                                                        {stockByLocation.map(
                                                            (loc) => (
                                                                <div
                                                                    key={loc.id}
                                                                    style={{
                                                                        margin: "4px 0",
                                                                        padding:
                                                                            "4px 8px",
                                                                        backgroundColor:
                                                                            selectedLocation?.id ==
                                                                            loc.id
                                                                                ? "#e8f4fd"
                                                                                : "#f8f9fa",
                                                                        borderRadius:
                                                                            "4px",
                                                                        border:
                                                                            selectedLocation?.id ==
                                                                            loc.id
                                                                                ? "1px solid #3498db"
                                                                                : "1px solid #dee2e6",
                                                                    }}
                                                                >
                                                                    <strong>
                                                                        {
                                                                            loc.name
                                                                        }
                                                                    </strong>
                                                                    :{" "}
                                                                    {loc.stock}{" "}
                                                                    unidades
                                                                    {selectedLocation?.id ==
                                                                        loc.id &&
                                                                        " (sede actual)"}
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </details>
                                            </div>
                                        )}

                                        {/* Advertencia de stock bajo */}
                                        {selectedLocation &&
                                            stockInfo.availableInLocation !==
                                                null &&
                                            stockInfo.availableInLocation < 5 &&
                                            stockInfo.availableInLocation >
                                                0 && (
                                                <div
                                                    style={{
                                                        fontSize: "11px",
                                                        color: "#dc3545",
                                                        marginTop: "4px",
                                                    }}
                                                >
                                                    ⚠️ Stock bajo en esta sede
                                                </div>
                                            )}

                                        {/* Sin stock */}
                                        {stockInfo.availableInLocation === 0 &&
                                            selectedLocation && (
                                                <div
                                                    style={{
                                                        fontSize: "11px",
                                                        color: "#dc3545",
                                                        marginTop: "4px",
                                                    }}
                                                >
                                                    ❌ Sin stock en{" "}
                                                    {selectedLocation.name}
                                                </div>
                                            )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div
                            className="sales-product-grid"
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr 1fr",
                                gap: "15px",
                                marginBottom: "15px",
                            }}
                        >
                            <div>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "12px",
                                        fontWeight: "600",
                                        color: "#2c3e50",
                                        marginBottom: "4px",
                                    }}
                                >
                                    Cantidad
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) =>
                                        handleQuantityChange(e.target.value)
                                    }
                                    style={{
                                        width: "100%",
                                        boxSizing: "border-box",
                                        padding: "8px",
                                        fontSize: "14px",
                                        border: "1px solid #dee2e6",
                                        borderRadius: "4px",
                                        backgroundColor: "white",
                                    }}
                                />
                            </div>

                            <div>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "12px",
                                        fontWeight: "600",
                                        color: "#2c3e50",
                                        marginBottom: "4px",
                                    }}
                                >
                                    Precio Unitario
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={unitPrice}
                                    onChange={(e) =>
                                        handlePriceChange(e.target.value)
                                    }
                                    placeholder="0.00"
                                    style={{
                                        width: "100%",
                                        boxSizing: "border-box",
                                        padding: "8px",
                                        fontSize: "14px",
                                        border: "1px solid #dee2e6",
                                        borderRadius: "4px",
                                        backgroundColor: "white",
                                    }}
                                />
                            </div>

                            <div>
                                <label
                                    style={{
                                        display: "block",
                                        fontSize: "12px",
                                        fontWeight: "600",
                                        color: "#2c3e50",
                                        marginBottom: "4px",
                                    }}
                                >
                                    Total
                                </label>
                                <div
                                    style={{
                                        boxSizing: "border-box",
                                        padding: "8px",
                                        fontSize: "14px",
                                        border: "1px solid #dee2e6",
                                        borderRadius: "4px",
                                        backgroundColor: "#f8f9fa",
                                        fontWeight: "600",
                                        color: "#2c3e50",
                                        textAlign: "right",
                                    }}
                                >
                                    $
                                    {(
                                        quantity * (parseFloat(unitPrice) || 0)
                                    ).toLocaleString()}
                                </div>
                            </div>
                        </div>

                        {/* Información de Lotes */}
                        {productSalesInfo?.requiresBatchControl && (
                            <div style={{ marginBottom: "15px" }}>
                                <div
                                    style={{
                                        padding: "12px",
                                        backgroundColor: "#e8f4fd",
                                        border: "1px solid #3498db",
                                        borderRadius: "6px",
                                        marginBottom: "10px",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            marginBottom: "8px",
                                        }}
                                    >
                                        <span style={{ fontSize: "16px" }}>
                                            🏷️
                                        </span>
                                        <div>
                                            <div
                                                style={{
                                                    fontSize: "14px",
                                                    fontWeight: "600",
                                                    color: "#3498db",
                                                }}
                                            >
                                                Control de Lotes Activo
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "12px",
                                                    color: "#6c757d",
                                                }}
                                            >
                                                Este producto requiere selección
                                                de lotes específicos
                                            </div>
                                        </div>
                                    </div>

                                    {loadingAdvancedInfo && (
                                        <div
                                            style={{
                                                fontSize: "12px",
                                                color: "#3498db",
                                                fontStyle: "italic",
                                            }}
                                        >
                                            Cargando información de lotes...
                                        </div>
                                    )}

                                    {productSalesInfo?.batches &&
                                        productSalesInfo.batches.length > 0 && (
                                            <div style={{ marginTop: "8px" }}>
                                                <div
                                                    style={{
                                                        fontSize: "12px",
                                                        fontWeight: "600",
                                                        color: "#2c3e50",
                                                        marginBottom: "6px",
                                                    }}
                                                >
                                                    Lotes disponibles (ordenados
                                                    por FIFO):
                                                </div>
                                                {productSalesInfo.batches.map(
                                                    (batch, index) => {
                                                        const expiryStatus =
                                                            batchesService.getBatchExpiryStatus(
                                                                batch
                                                            );
                                                        const isSelected =
                                                            selectedBatches.some(
                                                                (selected) =>
                                                                    selected.batch_id ===
                                                                    batch.batch_id
                                                            );
                                                        const selectedBatch =
                                                            selectedBatches.find(
                                                                (selected) =>
                                                                    selected.batch_id ===
                                                                    batch.batch_id
                                                            );

                                                        return (
                                                            <div
                                                                key={index}
                                                                style={{
                                                                    padding:
                                                                        "8px 10px",
                                                                    margin: "4px 0",
                                                                    backgroundColor:
                                                                        isSelected
                                                                            ? "#e8f5e8"
                                                                            : "white",
                                                                    border: `2px solid ${
                                                                        isSelected
                                                                            ? "#27ae60"
                                                                            : expiryStatus.color ===
                                                                              "red"
                                                                            ? "#e74c3c"
                                                                            : expiryStatus.color ===
                                                                              "orange"
                                                                            ? "#f39c12"
                                                                            : "#27ae60"
                                                                    }`,
                                                                    borderRadius:
                                                                        "4px",
                                                                    fontSize:
                                                                        "11px",
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        display:
                                                                            "flex",
                                                                        justifyContent:
                                                                            "space-between",
                                                                        alignItems:
                                                                            "center",
                                                                        marginBottom:
                                                                            "4px",
                                                                    }}
                                                                >
                                                                    <div>
                                                                        <strong>
                                                                            Lote:
                                                                        </strong>{" "}
                                                                        {
                                                                            batch.batch_number
                                                                        }
                                                                        {isSelected && (
                                                                            <span
                                                                                style={{
                                                                                    color: "#27ae60",
                                                                                    fontWeight:
                                                                                        "bold",
                                                                                    marginLeft:
                                                                                        "8px",
                                                                                }}
                                                                            >
                                                                                ✓
                                                                                SELECCIONADO
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <div
                                                                        style={{
                                                                            color:
                                                                                expiryStatus.color ===
                                                                                "red"
                                                                                    ? "#e74c3c"
                                                                                    : expiryStatus.color ===
                                                                                      "orange"
                                                                                    ? "#f39c12"
                                                                                    : "#27ae60",
                                                                            fontWeight:
                                                                                "600",
                                                                            fontSize:
                                                                                "10px",
                                                                        }}
                                                                    >
                                                                        {
                                                                            expiryStatus.message
                                                                        }
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    style={{
                                                                        display:
                                                                            "flex",
                                                                        justifyContent:
                                                                            "space-between",
                                                                        alignItems:
                                                                            "center",
                                                                    }}
                                                                >
                                                                    <div>
                                                                        <strong>
                                                                            Stock
                                                                            total:
                                                                        </strong>{" "}
                                                                        {
                                                                            batch.quantity
                                                                        }{" "}
                                                                        unidades
                                                                    </div>
                                                                    {isSelected &&
                                                                        selectedBatch && (
                                                                            <div
                                                                                style={{
                                                                                    color: "#27ae60",
                                                                                    fontWeight:
                                                                                        "600",
                                                                                }}
                                                                            >
                                                                                Usando:{" "}
                                                                                {
                                                                                    selectedBatch.selectedQuantity
                                                                                }{" "}
                                                                                unidades
                                                                            </div>
                                                                        )}
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                )}
                                                <div
                                                    style={{
                                                        fontSize: "11px",
                                                        color: "#6c757d",
                                                        marginTop: "8px",
                                                        padding: "6px",
                                                        backgroundColor:
                                                            "#f8f9fa",
                                                        borderRadius: "4px",
                                                    }}
                                                >
                                                    <strong>
                                                        Total en ubicación:
                                                    </strong>{" "}
                                                    {productSalesInfo.batches.reduce(
                                                        (sum, batch) =>
                                                            sum +
                                                            (batch.quantity ||
                                                                0),
                                                        0
                                                    )}{" "}
                                                    unidades |
                                                    <strong>
                                                        {" "}
                                                        Seleccionado para venta:
                                                    </strong>{" "}
                                                    {selectedBatches.reduce(
                                                        (sum, batch) =>
                                                            sum +
                                                            (batch.selectedQuantity ||
                                                                0),
                                                        0
                                                    )}{" "}
                                                    unidades
                                                </div>
                                            </div>
                                        )}

                                    {!loadingAdvancedInfo &&
                                        productSalesInfo?.batches &&
                                        productSalesInfo.batches.length ===
                                            0 && (
                                            <div
                                                style={{
                                                    fontSize: "12px",
                                                    color: "#e74c3c",
                                                    marginTop: "8px",
                                                }}
                                            >
                                                ⚠️ No hay lotes disponibles para
                                                este producto en esta ubicación
                                            </div>
                                        )}

                                    {!loadingAdvancedInfo &&
                                        !productSalesInfo?.batches && (
                                            <div
                                                style={{
                                                    fontSize: "12px",
                                                    color: "#e74c3c",
                                                    marginTop: "8px",
                                                }}
                                            >
                                                ⚠️ No se pudo cargar información
                                                de lotes
                                            </div>
                                        )}
                                </div>
                            </div>
                        )}

                        {/* ❌ REMOVIDO: Información de Tipo de Producto (productos compuestos y componentes) */}

                        {/* Product info display */}
                        <div
                            className="sales-product-info-grid"
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "15px",
                                marginBottom: "15px",
                            }}
                        >
                            {selectedProduct.cost_price && (
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "12px",
                                            fontWeight: "600",
                                            color: "#2c3e50",
                                            marginBottom: "4px",
                                        }}
                                    >
                                        Precio de Costo
                                    </label>
                                    <div
                                        style={{
                                            boxSizing: "border-box",
                                            padding: "8px",
                                            fontSize: "14px",
                                            backgroundColor: "#f8f9fa",
                                            border: "1px solid #dee2e6",
                                            borderRadius: "4px",
                                            color: "#6c757d",
                                        }}
                                    >
                                        $
                                        {Number(
                                            selectedProduct.cost_price
                                        ).toLocaleString()}
                                    </div>
                                </div>
                            )}

                            {selectedProduct.selling_price && (
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "12px",
                                            fontWeight: "600",
                                            color: "#2c3e50",
                                            marginBottom: "4px",
                                        }}
                                    >
                                        Precio de Venta Sugerido
                                    </label>
                                    <div
                                        style={{
                                            boxSizing: "border-box",
                                            padding: "8px",
                                            fontSize: "14px",
                                            backgroundColor: "#f8f9fa",
                                            border: "1px solid #dee2e6",
                                            borderRadius: "4px",
                                            color: "#27ae60",
                                            fontWeight: "600",
                                        }}
                                    >
                                        $
                                        {Number(
                                            selectedProduct.selling_price
                                        ).toLocaleString()}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Advertencia de stock bajo */}
                        {selectedProduct.stock_quantity <= 0 && (
                            <div
                                style={{
                                    marginBottom: "15px",
                                    padding: "12px",
                                    backgroundColor: "#f8d7da",
                                    border: "1px solid #f5c6cb",
                                    borderRadius: "4px",
                                    color: "#721c24",
                                    fontSize: "14px",
                                }}
                            >
                                ⚠️ <strong>Sin stock disponible:</strong> Este
                                producto no tiene stock. La venta podría ser
                                rechazada.
                            </div>
                        )}

                        {selectedProduct.stock_quantity > 0 &&
                            quantity > selectedProduct.stock_quantity && (
                                <div
                                    style={{
                                        marginBottom: "15px",
                                        padding: "12px",
                                        backgroundColor: "#fff3cd",
                                        border: "1px solid #ffeaa7",
                                        borderRadius: "4px",
                                        color: "#856404",
                                        fontSize: "14px",
                                    }}
                                >
                                    ⚠️ <strong>Cantidad excede stock:</strong>{" "}
                                    Solo hay {selectedProduct.stock_quantity}{" "}
                                    {selectedProduct.unit || "unidades"}{" "}
                                    disponibles.
                                </div>
                            )}

                        {/* Add to Sale Button */}
                        <div style={{ textAlign: "right" }}>
                            <button
                                onClick={handleAddToSale}
                                disabled={
                                    !unitPrice ||
                                    parseFloat(unitPrice) <= 0 ||
                                    !quantity ||
                                    quantity < 1
                                }
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    padding: "12px 20px",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: "white",
                                    backgroundColor:
                                        !unitPrice ||
                                        parseFloat(unitPrice) <= 0 ||
                                        !quantity ||
                                        quantity < 1
                                            ? "#95a5a6"
                                            : "#3498db",
                                    border: "none",
                                    borderRadius: "6px",
                                    cursor:
                                        !unitPrice ||
                                        parseFloat(unitPrice) <= 0 ||
                                        !quantity ||
                                        quantity < 1
                                            ? "not-allowed"
                                            : "pointer",
                                    transition: "background-color 0.2s ease",
                                }}
                            >
                                <span
                                    style={{
                                        marginRight: "8px",
                                        fontSize: "14px",
                                    }}
                                >
                                    +
                                </span>
                                Agregar a la Venta
                            </button>
                        </div>
                    </div>
                )}
                {showConversionModal && conversionSuggestions && (
                    <ConversionSuggestionsModal
                        isOpen={showConversionModal}
                        error={{
                            suggestions: conversionSuggestions,
                            product: selectedProduct?.name,
                            required: quantity,
                            available:
                                productSalesInfo?.batches?.reduce(
                                    (sum, batch) => sum + (batch.quantity || 0),
                                    0
                                ) || 0,
                            deficit: Math.max(
                                0,
                                quantity -
                                    (productSalesInfo?.batches?.reduce(
                                        (sum, batch) =>
                                            sum + (batch.quantity || 0),
                                        0
                                    ) || 0)
                            ),
                        }}
                        locationId={selectedLocation?.id}
                        onCancel={() => setShowConversionModal(false)}
                        onConfirm={handleConversionSuccess}
                    />
                )}
            </div>
        );
    }
);

export default ProductSelector;
