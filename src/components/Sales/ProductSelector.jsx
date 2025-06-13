import React, { useState, useCallback, useRef, useImperativeHandle, forwardRef, useMemo, useEffect } from "react";
import ProductSearchSelector from "../Common/ProductSearchSelector";
import PriceSourceLegend from "./PriceSourceLegend";
import { useAuth } from "../../context/AuthContext";
import inventoryService from "../../services/inventoryService";

const ProductSelector = forwardRef(({ 
    onProductAdded,
    selectedLocation,
    availableLocations = []
}, ref) => {
    const { authToken } = useAuth();
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [unitPrice, setUnitPrice] = useState("");
    const [priceInfo, setPriceInfo] = useState(null);
    const [loadingPrice, setLoadingPrice] = useState(false);
    const [error, setError] = useState(null);
    const [stockInfo, setStockInfo] = useState(null);
    const [loadingStock, setLoadingStock] = useState(false);
    const updateProductsStockRef = useRef(null);

    // Exponer la función updateProductsStock al componente padre
    useImperativeHandle(ref, () => ({
        updateProductsStock: (soldItems) => {
            if (updateProductsStockRef.current) {
                updateProductsStockRef.current(soldItems);
            }
        }
    }), []);

    // Crear un mapa de ubicaciones para acceso rápido por ID
    const locationMap = useMemo(() => {
        return availableLocations.reduce((map, location) => {
            map[location.id] = location;
            return map;
        }, {});
    }, [availableLocations]);

    // Función para obtener nombre de ubicación por ID
    const getLocationName = useCallback((locationId) => {
        const location = locationMap[locationId];
        return location ? location.name : `Ubicación ${locationId}`;
    }, [locationMap]);

        // Efecto para actualizar información de stock cuando cambia la ubicación seleccionada
    useEffect(() => {
        if (selectedProduct && stockInfo && stockInfo.allLocations) {
            console.log("Location changed, updating stock info for product:", selectedProduct.id);
            
            // Recalcular información de stock para la nueva ubicación
            const totalStock = Object.values(stockInfo.allLocations).reduce((sum, qty) => sum + qty, 0);
            
            let availableInLocation = null;
            if (selectedLocation && stockInfo.allLocations[selectedLocation.id] !== undefined) {
                availableInLocation = stockInfo.allLocations[selectedLocation.id];
            } else if (selectedLocation) {
                availableInLocation = 0;
            }
            
            setStockInfo(prevInfo => ({
                ...prevInfo,
                availableInLocation: availableInLocation,
                locationName: selectedLocation?.name || null
            }));
        }
    }, [selectedLocation?.id, selectedProduct?.id, stockInfo?.allLocations]);

    // Efecto adicional para reaccionar inmediatamente a cambios de ubicación
    useEffect(() => {
        // Si hay un producto seleccionado y información de stock, actualizar inmediatamente
        if (selectedProduct && stockInfo?.allLocations) {
            const newAvailableInLocation = selectedLocation && stockInfo.allLocations[selectedLocation.id] !== undefined 
                ? stockInfo.allLocations[selectedLocation.id] 
                : 0;
            
            setStockInfo(prevInfo => ({
                ...prevInfo,
                availableInLocation: newAvailableInLocation,
                locationName: selectedLocation?.name || null
            }));
        }
    }, [selectedLocation]);

    // Capturar la función del hook
    const handleUpdateProductsStock = useCallback((updateFn) => {
        updateProductsStockRef.current = updateFn;
    }, []);

    // Handle product selection from search
    const handleProductSelected = useCallback(async (product) => {
        setSelectedProduct(product);
        setQuantity(1);
        setError(null);
        setLoadingPrice(true);
        setLoadingStock(true);
        setPriceInfo(null);
        setStockInfo(null);

        try {
            // Ejecutar ambas operaciones en paralelo
            // Obtener precio inteligente
            const intelligentPrice = await inventoryService.getIntelligentPrice(product.id, authToken);
            
            // Usar solo la función rápida de stock
            console.log("Getting stock for product:", product.id);
            const locationStockMap = await inventoryService.getStockByLocationFast(product.id, authToken);
            console.log("Stock search result:", locationStockMap);
            
            console.log("Location stock map:", locationStockMap);
            
            console.log("Precio inteligente recibido:", intelligentPrice);
            console.log("Selected location:", selectedLocation);
            
            setUnitPrice(intelligentPrice.price.toString());
            setPriceInfo({
                source: intelligentPrice.source,
                source_label: intelligentPrice.source_label,
                price: intelligentPrice.price
            });

            // Procesar información de stock por ubicación
            console.log("Processing stock for product:", product.id);
            console.log("Location stock map exists:", !!locationStockMap);
            console.log("Location stock data:", locationStockMap);
            console.log("Selected location ID:", selectedLocation?.id);
            
            if (locationStockMap && Object.keys(locationStockMap).length > 0) {
                // El producto tiene stock en una o más ubicaciones
                const totalStock = Object.values(locationStockMap).reduce((sum, qty) => sum + (qty > 0 ? qty : 0), 0);
                console.log("Total stock calculated:", totalStock);
                
                let availableInLocation = null;
                if (selectedLocation && locationStockMap[selectedLocation.id] !== undefined) {
                    availableInLocation = locationStockMap[selectedLocation.id];
                    console.log("Stock in selected location:", availableInLocation);
                } else if (selectedLocation) {
                    // La sede seleccionada no tiene stock de este producto
                    availableInLocation = 0;
                    console.log("Selected location has no stock for this product");
                }
                
                setStockInfo({
                    availableInLocation: availableInLocation,
                    locationName: selectedLocation?.name || null,
                    totalStock: totalStock,
                    allLocations: locationStockMap,
                    hasStockData: true
                });
                
                console.log("Stock info set:", {
                    availableInLocation,
                    locationName: selectedLocation?.name,
                    totalStock,
                    allLocations: locationStockMap
                });
            } else {
                // El producto no tiene stock en ninguna ubicación
                console.log("No stock found for product in any location");
                setStockInfo({
                    availableInLocation: 0,
                    locationName: selectedLocation?.name || null,
                    totalStock: 0,
                    allLocations: {},
                    hasStockData: true,
                    noStockRegistered: true
                });
            }
            
        } catch (error) {
            console.error("Error obteniendo precio inteligente o stock:", error);
            // Fallback: usar selling_price del producto si está disponible
            const fallbackPrice = product.selling_price || product.cost_price || "";
            setUnitPrice(fallbackPrice.toString());
            
            if (product.selling_price) {
                setPriceInfo({
                    source: 'suggested',
                    source_label: 'Precio de venta sugerido',
                    price: product.selling_price
                });
            } else if (product.cost_price) {
                setPriceInfo({
                    source: 'cost',
                    source_label: 'Precio de costo',
                    price: product.cost_price
                });
            } else {
                setPriceInfo({
                    source: 'none',
                    source_label: 'Sin precio disponible - Ingrese manualmente',
                    price: 0
                });
            }

            // Establecer stock como no disponible en caso de error
            setStockInfo({
                availableInLocation: 0,
                locationName: selectedLocation?.name || null,
                totalStock: 0,
                allLocations: {},
                error: true
            });
        } finally {
            setLoadingPrice(false);
            setLoadingStock(false);
        }
    }, [authToken]);

    // Handle clearing product selection
    const handleSelectionCleared = useCallback(() => {
        setSelectedProduct(null);
        setQuantity(1);
        setUnitPrice("");
        setPriceInfo(null);
        setStockInfo(null);
        setError(null);
    }, []);

    // Handle manual price change
    const handlePriceChange = useCallback((newPrice) => {
        setUnitPrice(newPrice);
        
        // Si el usuario cambia el precio manualmente, actualizar el indicador
        if (priceInfo && newPrice !== priceInfo.price.toString()) {
            setPriceInfo({
                source: 'manual',
                source_label: 'Precio personalizado',
                price: parseFloat(newPrice) || 0
            });
        }
    }, [priceInfo]);

    // Get price info icon and color based on source
    const getPriceSourceIcon = (source) => {
        switch (source) {
            case 'sale':
                return { icon: '💰', color: '#27ae60', bgColor: '#d5edda' };
            case 'purchase':
                return { icon: '📦', color: '#3498db', bgColor: '#e8f4fd' };
            case 'suggested':
                return { icon: '💡', color: '#f39c12', bgColor: '#fef9e7' };
            case 'cost':
                return { icon: '🏷️', color: '#9b59b6', bgColor: '#f4ecf7' };
            case 'manual':
                return { icon: '✏️', color: '#17a2b8', bgColor: '#e6f9fc' };
            case 'none':
                return { icon: '⚠️', color: '#e74c3c', bgColor: '#fdedec' };
            default:
                return { icon: '❓', color: '#95a5a6', bgColor: '#f8f9fa' };
        }
    };

    // Handle adding product to sale
    const handleAddToSale = useCallback(() => {
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

        // Validar stock disponible si hay información de stock
        if (stockInfo && selectedLocation) {
            const availableStock = stockInfo.availableInLocation !== null ? stockInfo.availableInLocation : 0;
            if (quantity > availableStock) {
                setError(`Stock insuficiente. Disponible en ${selectedLocation.name}: ${availableStock} unidades`);
                return;
            }
        }

        console.log("ProductSelector - handleAddToSale - Valores antes de enviar:", {
            selectedProduct: selectedProduct.name,
            quantity: quantity,
            quantityType: typeof quantity,
            unitPrice: unitPrice,
            unitPriceType: typeof unitPrice,
            parsedUnitPrice: parseFloat(unitPrice),
            parsedUnitPriceType: typeof parseFloat(unitPrice)
        });

        try {
            onProductAdded(selectedProduct, quantity, parseFloat(unitPrice));
            
            // Reset form
            setSelectedProduct(null);
            setQuantity(1);
            setUnitPrice("");
            setStockInfo(null);
            setError(null);
            
        } catch (error) {
            console.error("Error adding product:", error);
            setError("Error al agregar el producto");
        }
    }, [selectedProduct, quantity, unitPrice, onProductAdded]);

    return (
        <div>
            {error && (
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
                                backgroundColor: getPriceSourceIcon(priceInfo.source).bgColor,
                                border: `1px solid ${getPriceSourceIcon(priceInfo.source).color}`,
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
                                        color: getPriceSourceIcon(priceInfo.source).color,
                                        marginBottom: "2px",
                                    }}
                                >
                                    {priceInfo.source_label}
                                </div>
                                {priceInfo.price > 0 && (
                                    <div style={{ fontSize: "12px", color: "#6c757d" }}>
                                        Precio sugerido: ${Number(priceInfo.price).toLocaleString()}
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
                                    animation: "spin 1s linear infinite"
                                }}
                            />
                            <span style={{ fontSize: "14px", color: "#3498db" }}>
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
                                    animation: "spin 1s linear infinite"
                                }}
                            />
                            <span style={{ fontSize: "14px", color: "#f39c12" }}>
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
                                backgroundColor: stockInfo.availableInLocation > 0 || stockInfo.totalStock > 0 ? "#d4edda" : "#f8d7da",
                                border: `1px solid ${stockInfo.availableInLocation > 0 || stockInfo.totalStock > 0 ? "#c3e6cb" : "#f5c6cb"}`,
                                borderRadius: "6px",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                                <span style={{ fontSize: "16px" }}>
                                    {stockInfo.availableInLocation > 0 || stockInfo.totalStock > 0 ? "📦" : "⚠️"}
                                </span>
                                <div style={{ flex: 1 }}>
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            color: stockInfo.availableInLocation > 0 || stockInfo.totalStock > 0 ? "#155724" : "#721c24",
                                            marginBottom: "2px",
                                        }}
                                    >
                                        Stock Disponible
                                    </div>
                                    
                                    {/* Stock en la sede seleccionada */}
                                    {selectedLocation && stockInfo.availableInLocation !== null && (
                                        <div style={{ fontSize: "13px", color: "#155724", marginBottom: "4px" }}>
                                            <strong>{selectedLocation.name}:</strong> {stockInfo.availableInLocation} unidades
                                        </div>
                                    )}
                                    
                                    {/* Stock total */}
                                    <div style={{ fontSize: "12px", color: "#6c757d" }}>
                                        Stock total: {stockInfo.totalStock} unidades
                                    </div>
                                    
                                    {/* Desglose por ubicaciones si hay múltiples */}
                                    {Object.keys(stockInfo.allLocations).length > 1 && (
                                        <div style={{ fontSize: "11px", color: "#6c757d", marginTop: "4px" }}>
                                            <details>
                                                <summary style={{ cursor: "pointer", fontWeight: "500" }}>
                                                    Ver stock en todas las sedes ({Object.keys(stockInfo.allLocations).length})
                                                </summary>
                                                <div style={{ marginTop: "8px", paddingLeft: "12px" }}>
                                                    {Object.entries(stockInfo.allLocations).map(([locationId, quantity]) => (
                                                        <div 
                                                            key={locationId} 
                                                            style={{ 
                                                                margin: "4px 0", 
                                                                padding: "4px 8px",
                                                                backgroundColor: selectedLocation?.id == locationId ? "#e8f4fd" : "#f8f9fa",
                                                                borderRadius: "4px",
                                                                border: selectedLocation?.id == locationId ? "1px solid #3498db" : "1px solid #dee2e6"
                                                            }}
                                                        >
                                                            <strong>{getLocationName(locationId)}:</strong> {quantity} unidades
                                                            {selectedLocation?.id == locationId && (
                                                                <span style={{ color: "#3498db", fontSize: "10px", marginLeft: "8px" }}>
                                                                    (sede actual)
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </details>
                                        </div>
                                    )}
                                    
                                    {/* Advertencia de stock bajo */}
                                    {selectedLocation && stockInfo.availableInLocation !== null && stockInfo.availableInLocation < 5 && stockInfo.availableInLocation > 0 && (
                                        <div style={{ fontSize: "11px", color: "#dc3545", marginTop: "4px" }}>
                                            ⚠️ Stock bajo en esta sede
                                        </div>
                                    )}
                                    
                                    {/* Sin stock */}
                                    {stockInfo.availableInLocation === 0 && selectedLocation && (
                                        <div style={{ fontSize: "11px", color: "#dc3545", marginTop: "4px" }}>
                                            ❌ Sin stock en {selectedLocation.name}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div 
                        className="sales-product-grid"
                        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "15px" }}
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
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
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
                                onChange={(e) => handlePriceChange(e.target.value)}
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
                                ${(quantity * (parseFloat(unitPrice) || 0)).toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {/* Product info display */}
                    <div 
                        className="sales-product-info-grid"
                        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}
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
                                    ${Number(selectedProduct.cost_price).toLocaleString()}
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
                                    ${Number(selectedProduct.selling_price).toLocaleString()}
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
                            ⚠️ <strong>Sin stock disponible:</strong> Este producto no tiene stock. La venta podría ser rechazada.
                        </div>
                    )}

                    {selectedProduct.stock_quantity > 0 && quantity > selectedProduct.stock_quantity && (
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
                            ⚠️ <strong>Cantidad excede stock:</strong> Solo hay {selectedProduct.stock_quantity} {selectedProduct.unit || 'unidades'} disponibles.
                        </div>
                    )}

                    {/* Add to Sale Button */}
                    <div style={{ textAlign: "right" }}>
                        <button
                            onClick={handleAddToSale}
                            disabled={!unitPrice || parseFloat(unitPrice) <= 0 || !quantity || quantity < 1}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "12px 20px",
                                fontSize: "14px",
                                fontWeight: "600",
                                color: "white",
                                backgroundColor: (!unitPrice || parseFloat(unitPrice) <= 0 || !quantity || quantity < 1) ? "#95a5a6" : "#3498db",
                                border: "none",
                                borderRadius: "6px",
                                cursor: (!unitPrice || parseFloat(unitPrice) <= 0 || !quantity || quantity < 1) ? "not-allowed" : "pointer",
                                transition: "background-color 0.2s ease",
                            }}
                        >
                            <span style={{ marginRight: "8px", fontSize: "14px" }}>+</span>
                            Agregar a la Venta
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
});

export default ProductSelector; 