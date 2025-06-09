import React, { useState, useCallback } from "react";
import ProductSearchSelector from "../Common/ProductSearchSelector";

const ProductSelector = ({ 
    onProductAdded 
}) => {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [unitPrice, setUnitPrice] = useState("");
    const [error, setError] = useState(null);

    // Handle product selection from search
    const handleProductSelected = useCallback((product) => {
        setSelectedProduct(product);
        setUnitPrice(product.selling_price || ""); // Pre-fill with selling price if available
        setQuantity(1);
        setError(null);
    }, []);

    // Handle clearing product selection
    const handleSelectionCleared = useCallback(() => {
        setSelectedProduct(null);
        setQuantity(1);
        setUnitPrice("");
        setError(null);
    }, []);

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
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "15px" }}>
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
                                onChange={(e) => setUnitPrice(e.target.value)}
                                placeholder="0.00"
                                style={{
                                    width: "100%",
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
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "15px" }}>
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
};

export default ProductSelector; 