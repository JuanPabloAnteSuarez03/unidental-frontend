import React, { useState } from "react";
import ProductSearchSelector from "../Common/ProductSearchSelector";

const ComponentSearch = ({
    onSelectComponent,
    selectedComponents,
    onRemoveComponent,
}) => {
    const [isSearchActive, setIsSearchActive] = useState(false);

    const handleProductSelected = (product) => {
        // Verificar si el producto ya está seleccionado
        const isAlreadySelected = selectedComponents.find(
            (c) => c.id === product.id
        );
        if (isAlreadySelected) {
            return; // No agregar duplicados
        }

        // Agregar el producto con cantidad por defecto
        onSelectComponent({
            ...product,
            quantity: 1,
            unit: product.unit || "unidad",
        });
    };

    const handleQuantityChange = (componentId, newQuantity) => {
        const updatedComponents = selectedComponents.map((comp) =>
            comp.id === componentId
                ? { ...comp, quantity: Math.max(1, parseInt(newQuantity) || 1) }
                : comp
        );
        // Notificar al componente padre del cambio
        updatedComponents.forEach((comp) => {
            if (comp.id === componentId) {
                onSelectComponent(comp);
            }
        });
    };

    const handleSearchFocus = () => {
        setIsSearchActive(true);
    };

    return (
        <div style={{ marginBottom: "20px" }}>
            {/* Barra de búsqueda */}
            <div style={{ marginBottom: "15px" }}>
                <label
                    style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: "600",
                        color: "#2c3e50",
                        fontSize: "14px",
                        letterSpacing: "0.3px",
                        textTransform: "uppercase",
                        position: "relative",
                        paddingLeft: "12px",
                    }}
                >
                    <span
                        style={{
                            position: "absolute",
                            left: "0",
                            top: "50%",
                            transform: "translateY(-50%)",
                            width: "3px",
                            height: "14px",
                            backgroundColor: "#9b59b6",
                            borderRadius: "2px",
                        }}
                    ></span>
                    🔍 Buscar Componentes
                </label>

                {!isSearchActive ? (
                    <div
                        onClick={handleSearchFocus}
                        style={{
                            padding: "12px 15px",
                            border: "2px solid #e9ecef",
                            borderRadius: "8px",
                            backgroundColor: "#f8f9fa",
                            cursor: "pointer",
                            color: "#6c757d",
                            fontSize: "16px",
                            transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.borderColor = "#9b59b6";
                            e.target.style.backgroundColor = "#ffffff";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.borderColor = "#e9ecef";
                            e.target.style.backgroundColor = "#f8f9fa";
                        }}
                    >
                        Haz clic aquí para buscar productos...
                    </div>
                ) : (
                    <ProductSearchSelector
                        onProductSelected={handleProductSelected}
                        placeholder="Buscar producto por nombre, SKU o código..."
                        showSelectedProduct={false}
                        allowClearSelection={false}
                        maxResults={15}
                        minSearchLength={2}
                        debounceMs={300}
                        style={{
                            border: "2px solid #9b59b6",
                            borderRadius: "8px",
                            padding: "12px 15px",
                            fontSize: "16px",
                            transition: "all 0.2s ease",
                        }}
                    />
                )}
            </div>

            {/* Componentes seleccionados */}
            {selectedComponents.length > 0 && (
                <div
                    style={{
                        border: "1px solid #e0e0e0",
                        borderRadius: "8px",
                        padding: "15px",
                        backgroundColor: "#f8f9fa",
                    }}
                >
                    <h4 style={{ margin: "0 0 15px 0", color: "#2c3e50" }}>
                        Componentes Seleccionados ({selectedComponents.length})
                    </h4>
                    {selectedComponents.map((component) => (
                        <div
                            key={component.id}
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "10px",
                                backgroundColor: "#fff",
                                borderRadius: "6px",
                                marginBottom: "8px",
                                border: "1px solid #e0e0e0",
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <div
                                    style={{
                                        fontWeight: "600",
                                        color: "#2c3e50",
                                    }}
                                >
                                    {component.name}
                                </div>
                                <div
                                    style={{
                                        fontSize: "12px",
                                        color: "#6c757d",
                                    }}
                                >
                                    SKU: {component.sku} | Stock:{" "}
                                    {component.stock || 0}
                                </div>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                }}
                            >
                                <div style={{ textAlign: "center" }}>
                                    <label
                                        style={{
                                            fontSize: "12px",
                                            color: "#6c757d",
                                        }}
                                    >
                                        Cantidad:
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={component.quantity}
                                        onChange={(e) =>
                                            handleQuantityChange(
                                                component.id,
                                                e.target.value
                                            )
                                        }
                                        style={{
                                            width: "60px",
                                            padding: "4px 8px",
                                            border: "1px solid #ced4da",
                                            borderRadius: "4px",
                                            marginLeft: "5px",
                                        }}
                                    />
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div
                                        style={{
                                            fontWeight: "600",
                                            color: "#27ae60",
                                        }}
                                    >
                                        $
                                        {parseFloat(
                                            component.sale_price || 0
                                        ).toLocaleString()}
                                    </div>
                                </div>
                                <button
                                    onClick={() =>
                                        onRemoveComponent(component.id)
                                    }
                                    style={{
                                        background: "#e74c3c",
                                        color: "white",
                                        border: "none",
                                        padding: "6px 10px",
                                        borderRadius: "4px",
                                        fontSize: "12px",
                                        cursor: "pointer",
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Resumen */}
                    <div
                        style={{
                            borderTop: "1px solid #e0e0e0",
                            paddingTop: "10px",
                            marginTop: "10px",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontWeight: "600",
                            }}
                        >
                            <span>Total estimado:</span>
                            <span style={{ color: "#27ae60" }}>
                                $
                                {selectedComponents
                                    .reduce(
                                        (total, comp) =>
                                            total +
                                            parseFloat(comp.sale_price || 0) *
                                                comp.quantity,
                                        0
                                    )
                                    .toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ComponentSearch;
