import React, { useState, useCallback } from "react";

const SaleItemsList = ({ 
    items, 
    onRemoveItem, 
    onUpdateItem 
}) => {
    const [editingIndex, setEditingIndex] = useState(null);
    const [editingValues, setEditingValues] = useState({});

    // Handle editing start
    const handleStartEdit = useCallback((index, item) => {
        setEditingIndex(index);
        setEditingValues({
            quantity: item.quantity,
            unit_price: item.unit_price
        });
    }, []);

    // Handle editing cancel
    const handleCancelEdit = useCallback(() => {
        setEditingIndex(null);
        setEditingValues({});
    }, []);

    // Handle editing save
    const handleSaveEdit = useCallback(() => {
        if (editingIndex !== null) {
            const updates = {
                quantity: parseInt(editingValues.quantity) || 1,
                unit_price: parseFloat(editingValues.unit_price).toFixed(2)
            };
            onUpdateItem(editingIndex, updates);
            setEditingIndex(null);
            setEditingValues({});
        }
    }, [editingIndex, editingValues, onUpdateItem]);

    // Handle input change during editing
    const handleInputChange = useCallback((field, value) => {
        setEditingValues(prev => ({
            ...prev,
            [field]: value
        }));
    }, []);

    if (items.length === 0) {
        return (
            <div>
                <div
                    style={{
                        textAlign: "center",
                        padding: "40px 20px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                        border: "1px solid #dee2e6",
                        color: "#6c757d",
                    }}
                >
                    <div
                        style={{
                            fontSize: "32px",
                            marginBottom: "16px",
                            color: "#dee2e6",
                        }}
                    >
                        🛒
                    </div>
                    <p style={{ margin: "0 0 8px 0", fontSize: "16px" }}>
                        No hay productos agregados a la venta
                    </p>
                    <p style={{ margin: 0, fontSize: "14px" }}>
                        Utilice el selector de productos para agregar elementos
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div style={{ marginBottom: "15px" }}>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 15px",
                        backgroundColor: "#2c3e50",
                        color: "white",
                        borderRadius: "6px 6px 0 0",
                        fontSize: "14px",
                        fontWeight: "600",
                    }}
                >
                    <span>Productos ({items.length})</span>
                    <span>
                        Total: {items.reduce((total, item) => total + item.quantity, 0)} unidades
                    </span>
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {items.map((item, index) => {
                    const isEditing = editingIndex === index;
                    const quantity = isEditing ? editingValues.quantity : item.quantity;
                    const unitPrice = isEditing ? editingValues.unit_price : item.unit_price;
                    const subtotal = (parseFloat(unitPrice) * parseInt(quantity)).toFixed(2);

                    return (
                        <div 
                            key={index} 
                            style={{
                                border: "1px solid #dee2e6",
                                borderRadius: "6px",
                                padding: "15px",
                                backgroundColor: isEditing ? "#f8f9fa" : "white",
                                transition: "all 0.2s ease",
                                boxShadow: isEditing ? "0 2px 8px rgba(0,0,0,0.1)" : "0 1px 3px rgba(0,0,0,0.1)",
                            }}
                        >
                            <div style={{ display: "flex", justifyContent: "between", alignItems: "start", marginBottom: "12px" }}>
                                <div style={{ flex: "1" }}>
                                    <h4
                                        style={{
                                            margin: "0 0 4px 0",
                                            fontSize: "16px",
                                            fontWeight: "600",
                                            color: "#2c3e50",
                                        }}
                                    >
                                        {item.product_details?.name}
                                    </h4>
                                    <p
                                        style={{
                                            margin: "0 0 2px 0",
                                            fontSize: "13px",
                                            color: "#6c757d",
                                        }}
                                    >
                                        SKU: {item.product_details?.sku}
                                    </p>
                                    {item.product_details?.category_name && (
                                        <p
                                            style={{
                                                margin: 0,
                                                fontSize: "13px",
                                                color: "#6c757d",
                                            }}
                                        >
                                            Categoría: {item.product_details.category_name}
                                        </p>
                                    )}
                                </div>
                                
                                <div style={{ display: "flex", gap: "8px", marginLeft: "15px" }}>
                                    {!isEditing ? (
                                        <>
                                            <button
                                                onClick={() => handleStartEdit(index, item)}
                                                style={{
                                                    padding: "8px 10px",
                                                    border: "1px solid #3498db",
                                                    borderRadius: "4px",
                                                    backgroundColor: "#3498db",
                                                    color: "white",
                                                    cursor: "pointer",
                                                    fontSize: "12px",
                                                    fontWeight: "500",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                                title="Editar producto"
                                            >
                                                ✎
                                            </button>
                                            <button
                                                onClick={() => onRemoveItem(index)}
                                                style={{
                                                    padding: "8px 10px",
                                                    border: "1px solid #e74c3c",
                                                    borderRadius: "4px",
                                                    backgroundColor: "#e74c3c",
                                                    color: "white",
                                                    cursor: "pointer",
                                                    fontSize: "12px",
                                                    fontWeight: "500",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                                title="Eliminar producto"
                                            >
                                                ✕
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={handleSaveEdit}
                                                style={{
                                                    padding: "8px 10px",
                                                    border: "1px solid #27ae60",
                                                    borderRadius: "4px",
                                                    backgroundColor: "#27ae60",
                                                    color: "white",
                                                    cursor: "pointer",
                                                    fontSize: "12px",
                                                    fontWeight: "500",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                                title="Guardar cambios"
                                            >
                                                ✓
                                            </button>
                                            <button
                                                onClick={handleCancelEdit}
                                                style={{
                                                    padding: "8px 10px",
                                                    border: "1px solid #95a5a6",
                                                    borderRadius: "4px",
                                                    backgroundColor: "#95a5a6",
                                                    color: "white",
                                                    cursor: "pointer",
                                                    fontSize: "12px",
                                                    fontWeight: "500",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                }}
                                                title="Cancelar edición"
                                            >
                                                ✕
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Product Details Grid */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px" }}>
                                {/* Cantidad */}
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
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            min="1"
                                            value={quantity}
                                            onChange={(e) => handleInputChange("quantity", e.target.value)}
                                            style={{
                                                width: "100%",
                                                padding: "8px",
                                                fontSize: "14px",
                                                border: "1px solid #3498db",
                                                borderRadius: "4px",
                                                backgroundColor: "white",
                                            }}
                                        />
                                    ) : (
                                        <div
                                            style={{
                                                padding: "8px",
                                                fontSize: "14px",
                                                backgroundColor: "#f8f9fa",
                                                border: "1px solid #dee2e6",
                                                borderRadius: "4px",
                                                color: "#2c3e50",
                                            }}
                                        >
                                            {quantity}
                                        </div>
                                    )}
                                </div>

                                {/* Precio Unitario */}
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
                                    {isEditing ? (
                                        <div style={{ position: "relative" }}>
                                            <span
                                                style={{
                                                    position: "absolute",
                                                    left: "8px",
                                                    top: "8px",
                                                    color: "#6c757d",
                                                    fontSize: "14px",
                                                }}
                                            >
                                                $
                                            </span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={unitPrice}
                                                onChange={(e) => handleInputChange("unit_price", e.target.value)}
                                                style={{
                                                    width: "100%",
                                                    paddingLeft: "20px",
                                                    paddingRight: "8px",
                                                    paddingTop: "8px",
                                                    paddingBottom: "8px",
                                                    fontSize: "14px",
                                                    border: "1px solid #3498db",
                                                    borderRadius: "4px",
                                                    backgroundColor: "white",
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <div
                                            style={{
                                                padding: "8px",
                                                fontSize: "14px",
                                                backgroundColor: "#f8f9fa",
                                                border: "1px solid #dee2e6",
                                                borderRadius: "4px",
                                                color: "#2c3e50",
                                            }}
                                        >
                                            ${unitPrice}
                                        </div>
                                    )}
                                </div>

                                {/* Unidad */}
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
                                        Unidad
                                    </label>
                                    <div
                                        style={{
                                            padding: "8px",
                                            fontSize: "14px",
                                            backgroundColor: "#f8f9fa",
                                            border: "1px solid #dee2e6",
                                            borderRadius: "4px",
                                            color: "#2c3e50",
                                        }}
                                    >
                                        {item.product_details?.unit || "unidad"}
                                    </div>
                                </div>

                                {/* Subtotal */}
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
                                        Subtotal
                                    </label>
                                    <div
                                        style={{
                                            padding: "8px",
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            backgroundColor: "#e8f4fd",
                                            border: "1px solid #3498db",
                                            borderRadius: "4px",
                                            color: "#2c3e50",
                                        }}
                                    >
                                        ${subtotal}
                                    </div>
                                </div>
                            </div>

                            {/* Información de Lotes */}
                            {item.batches && item.batches.length > 0 && (
                                <div style={{ marginTop: "12px" }}>
                                    <div
                                        style={{
                                            padding: "8px 12px",
                                            backgroundColor: "#e8f4fd",
                                            border: "1px solid #3498db",
                                            borderRadius: "4px",
                                            marginBottom: "6px"
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                                            <span style={{ fontSize: "14px" }}>🏷️</span>
                                            <span style={{ fontSize: "12px", fontWeight: "600", color: "#3498db" }}>
                                                Lotes utilizados
                                            </span>
                                        </div>
                                        <div style={{ fontSize: "11px", color: "#6c757d" }}>
                                            {item.batches.map((batch, batchIndex) => {
                                                const expiryDate = batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString() : 'Sin fecha';
                                                return (
                                                    <div key={batchIndex} style={{ margin: "2px 0" }}>
                                                        <strong>Lote {batch.batch_number}:</strong> {batch.quantity} unidades
                                                        {batch.expiry_date && (
                                                            <span style={{ color: "#6c757d" }}> (Vence: {expiryDate})</span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Información de Componentes */}
                            {item.components && item.components.length > 0 && (
                                <div style={{ marginTop: "12px" }}>
                                    <div
                                        style={{
                                            padding: "8px 12px",
                                            backgroundColor: "#f8f9fa",
                                            border: "1px solid #6c757d",
                                            borderRadius: "4px",
                                            marginBottom: "6px"
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                                            <span style={{ fontSize: "14px" }}>📦</span>
                                            <span style={{ fontSize: "12px", fontWeight: "600", color: "#2c3e50" }}>
                                                Componentes incluidos
                                            </span>
                                        </div>
                                        <div style={{ fontSize: "11px", color: "#6c757d" }}>
                                            {item.components.map((component, componentIndex) => (
                                                <div key={componentIndex} style={{ margin: "2px 0" }}>
                                                    <strong>{component.component_name}</strong> ({component.component_sku}): {component.total_quantity} unidades
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Summary */}
            <div
                style={{
                    marginTop: "15px",
                    padding: "12px 15px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "6px",
                    border: "1px solid #dee2e6",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "14px" }}>
                    <span style={{ color: "#6c757d" }}>
                        Total de productos: {items.length}
                    </span>
                    <span style={{ color: "#6c757d" }}>
                        Cantidad total: {items.reduce((total, item) => total + item.quantity, 0)} unidades
                    </span>
                </div>
            </div>
        </div>
    );
};

export default SaleItemsList; 