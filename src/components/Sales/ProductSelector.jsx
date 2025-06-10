import React, { useState, useCallback, useRef, useImperativeHandle, forwardRef } from "react";
import ProductSearchSelector from "../Common/ProductSearchSelector";
import PriceSourceLegend from "./PriceSourceLegend";
import { useAuth } from "../../context/AuthContext";
import inventoryService from "../../services/inventoryService";

const ProductSelector = forwardRef(({ 
    onProductAdded 
}, ref) => {
    const { authToken } = useAuth();
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [unitPrice, setUnitPrice] = useState("");
    const [priceInfo, setPriceInfo] = useState(null);
    const [loadingPrice, setLoadingPrice] = useState(false);
    const [error, setError] = useState(null);
    const updateProductsStockRef = useRef(null);

    // Exponer la función updateProductsStock al componente padre
    useImperativeHandle(ref, () => ({
        updateProductsStock: (soldItems) => {
            if (updateProductsStockRef.current) {
                updateProductsStockRef.current(soldItems);
            }
        }
    }), []);

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
        setPriceInfo(null);

        try {
            // Obtener precio inteligente para el producto
            const intelligentPrice = await inventoryService.getIntelligentPrice(product.id, authToken);
            
            console.log("Precio inteligente recibido:", intelligentPrice);
            
            setUnitPrice(intelligentPrice.price.toString());
            setPriceInfo({
                source: intelligentPrice.source,
                source_label: intelligentPrice.source_label,
                price: intelligentPrice.price
            });
        } catch (error) {
            console.error("Error obteniendo precio inteligente:", error);
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
        } finally {
            setLoadingPrice(false);
        }
    }, [authToken]);

    // Handle clearing product selection
    const handleSelectionCleared = useCallback(() => {
        setSelectedProduct(null);
        setQuantity(1);
        setUnitPrice("");
        setPriceInfo(null);
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