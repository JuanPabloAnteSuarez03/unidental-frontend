import React from "react";

const OrderItemsList = ({
    searchMode,
    orderItems,
    handleRemoveProduct,
    handleChangeQuantity,
    handleChangePrice,
    handleChangeSubtotal,
    getPurchasePrice,
    selectedLocation,
    setSelectedLocation,
    locations,
    isLoadingLocations,
    handleCreateOrder,
    isCreatingOrder,
    selectedSupplier,
    notes,
    setNotes,
    shouldGenerateOrder,
    setShouldGenerateOrder,
}) => {
    const totalAmount = orderItems.reduce(
        (sum, item) => sum + getPurchasePrice(item) * item.quantity,
        0
    );

    return (
        <div className="order-card" style={{ flex: 1 }}>
            <h2
                style={{
                    fontSize: 22,
                    fontWeight: 700,
                    marginBottom: 24,
                    textAlign: "left",
                    color: "#2c3e50",
                    letterSpacing: "-0.5px",
                }}
            >
                Resumen de la Orden de Compra
            </h2>

            {/* Selector de sede destino */}
            <div style={{ marginBottom: "20px" }}>
                <label
                    style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: "600",
                        fontSize: "14px",
                        color: "#2c3e50",
                    }}
                >
                    Sede de Destino *
                </label>
                <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    disabled={isLoadingLocations}
                    style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "2px solid #e3eaf3",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#2c3e50",
                        backgroundColor: "white",
                        outline: "none",
                        transition: "all 0.2s ease",
                    }}
                >
                    <option value="">
                        {isLoadingLocations
                            ? "Cargando sedes..."
                            : "Seleccione una sede"}
                    </option>
                    {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                            {location.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Campo de notas */}
            <div style={{ marginBottom: "20px" }}>
                <label
                    style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: "600",
                        fontSize: "14px",
                        color: "#2c3e50",
                    }}
                >
                    Notas de la orden
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Agregar notas o comentarios sobre la orden..."
                    style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "2px solid #e3eaf3",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#2c3e50",
                        backgroundColor: "white",
                        outline: "none",
                        transition: "all 0.2s ease",
                        minHeight: "80px",
                        resize: "vertical",
                        fontFamily: "inherit",
                        boxSizing: "border-box",
                    }}
                />
            </div>

            {/* Opción de generar orden de compra */}
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
                    Documento de Orden
                </label>
                <label
                    style={{
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                        padding: "10px",
                        border: "1px solid #dee2e6",
                        borderRadius: "4px",
                        backgroundColor: shouldGenerateOrder
                            ? "#e8f4fd"
                            : "white",
                    }}
                >
                    <input
                        type="checkbox"
                        checked={shouldGenerateOrder}
                        onChange={(e) =>
                            setShouldGenerateOrder(e.target.checked)
                        }
                        style={{ marginRight: "8px" }}
                    />
                    <span
                        style={{
                            fontSize: "14px",
                            color: "#2c3e50",
                        }}
                    >
                        📋 Generar documento de orden de compra
                    </span>
                </label>
            </div>

            {/* Indicadores */}
            <div
                style={{
                    padding: "16px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "8px",
                    border: "1px solid #e9ecef",
                    marginBottom: "20px",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                    }}
                >
                    <div
                        style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#2c3e50",
                        }}
                    >
                        Productos:{" "}
                        <span style={{ color: "#27ae60" }}>
                            {orderItems.length} productos
                        </span>
                    </div>
                    <div
                        style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#2c3e50",
                        }}
                    >
                        Cantidad total:{" "}
                        <span style={{ color: "#27ae60" }}>
                            {orderItems.reduce(
                                (sum, item) => sum + item.quantity,
                                0
                            )}{" "}
                            unidades
                        </span>
                    </div>
                    <div
                        style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#2c3e50",
                        }}
                    >
                        Proveedor:{" "}
                        <span
                            style={{
                                color: selectedSupplier ? "#27ae60" : "#e74c3c",
                            }}
                        >
                            {selectedSupplier
                                ? `✅ ${selectedSupplier.name}`
                                : "❌ No seleccionado"}
                        </span>
                    </div>
                </div>
            </div>

            {orderItems.length === 0 ? (
                <div
                    style={{
                        color: "#888",
                        fontSize: 16,
                        textAlign: "center",
                        padding: "60px 20px",
                    }}
                >
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>
                        {searchMode === "direct_api" ? "⚡" : "📦"}
                    </div>
                    <div style={{ fontWeight: "600", marginBottom: "8px" }}>
                        {searchMode === "direct_api"
                            ? "Búsqueda API Directa Activada"
                            : "Selecciona un proveedor"}
                    </div>
                    <div>
                        {searchMode === "direct_api"
                            ? "Busca productos en el campo superior y se agregarán automáticamente aquí"
                            : "Una vez seleccionado un proveedor, podrás agregar productos aquí"}
                    </div>
                </div>
            ) : (
                <div
                    style={{
                        padding: "20px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                        border: "1px solid #e9ecef",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "16px",
                            color: "#2c3e50",
                            fontWeight: "600",
                        }}
                    >
                        <span style={{ color: "#9b59b6", fontSize: "18px" }}>
                            {searchMode === "direct_api" ? "⚡" : "📦"}
                        </span>
                        Productos agregados{" "}
                        {searchMode === "direct_api"
                            ? "mediante búsqueda API directa"
                            : "del proveedor"}
                    </div>

                    <div className="ordenes-table-container">
                        <table className="ordenes-table">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Precio Unitario</th>
                                    <th>Cantidad</th>
                                    <th>Subtotal</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orderItems.map((item) => (
                                    <tr key={item.purchase_option}>
                                        <td style={{ fontWeight: "500" }}>
                                            {item.product_name ||
                                                item.name ||
                                                "Sin nombre"}
                                        </td>
                                        <td>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "4px",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        color: "#27ae60",
                                                        fontWeight: "600",
                                                        fontSize: "14px",
                                                    }}
                                                >
                                                    $
                                                </span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={
                                                        item.purchase_price || 0
                                                    }
                                                    onChange={(e) =>
                                                        handleChangePrice(
                                                            item.purchase_option,
                                                            parseFloat(
                                                                e.target.value
                                                            ) || 0
                                                        )
                                                    }
                                                    style={{
                                                        width: "90px",
                                                        padding: "8px",
                                                        border: "1px solid #ddd",
                                                        borderRadius: "4px",
                                                        textAlign: "center",
                                                        color: "#27ae60",
                                                        fontWeight: "600",
                                                        fontSize: "14px",
                                                    }}
                                                    placeholder="0.00"
                                                    title="Editar precio unitario"
                                                />
                                            </div>
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) =>
                                                    handleChangeQuantity(
                                                        item.purchase_option,
                                                        parseInt(
                                                            e.target.value
                                                        ) || 1
                                                    )
                                                }
                                                style={{
                                                    width: "80px",
                                                    padding: "8px",
                                                    border: "1px solid #ddd",
                                                    borderRadius: "4px",
                                                    textAlign: "center",
                                                }}
                                            />
                                        </td>
                                        <td>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "4px",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        color: "#27ae60",
                                                        fontWeight: "700",
                                                        fontSize: "14px",
                                                    }}
                                                >
                                                    $
                                                </span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={(
                                                        getPurchasePrice(item) *
                                                        item.quantity
                                                    ).toFixed(2)}
                                                    onChange={(e) =>
                                                        handleChangeSubtotal(
                                                            item.purchase_option,
                                                            parseFloat(
                                                                e.target.value
                                                            ) || 0
                                                        )
                                                    }
                                                    style={{
                                                        width: "90px",
                                                        padding: "8px",
                                                        border: "1px solid #ddd",
                                                        borderRadius: "4px",
                                                        textAlign: "center",
                                                        color: "#27ae60",
                                                        fontWeight: "700",
                                                        fontSize: "14px",
                                                    }}
                                                    placeholder="0.00"
                                                    title="Editar subtotal (se calculará el precio unitario)"
                                                />
                                            </div>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() =>
                                                    handleRemoveProduct(
                                                        item.purchase_option
                                                    )
                                                }
                                                className="btn-small btn-danger"
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Total de la orden */}
                    <div
                        style={{
                            marginTop: "20px",
                            padding: "16px",
                            backgroundColor: "#e8f5e9",
                            borderRadius: "8px",
                            border: "1px solid #c8e6c9",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                fontSize: "18px",
                                fontWeight: "700",
                                color: "#2e7d32",
                            }}
                        >
                            <span>Total de la Orden:</span>
                            <span>${totalAmount.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Botón crear orden */}
                    <button
                        onClick={handleCreateOrder}
                        disabled={
                            orderItems.length === 0 ||
                            !selectedLocation ||
                            isCreatingOrder
                        }
                        style={{
                            width: "100%",
                            padding: "16px",
                            marginTop: "20px",
                            backgroundColor:
                                orderItems.length === 0 ||
                                !selectedLocation ||
                                isCreatingOrder
                                    ? "#6c757d"
                                    : "#28a745",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "16px",
                            fontWeight: "600",
                            cursor:
                                orderItems.length === 0 ||
                                !selectedLocation ||
                                isCreatingOrder
                                    ? "not-allowed"
                                    : "pointer",
                            transition: "all 0.2s ease",
                        }}
                    >
                        {isCreatingOrder ? (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px",
                                }}
                            >
                                <div
                                    className="custom-loader"
                                    style={{ width: "16px", height: "16px" }}
                                ></div>
                                Creando orden...
                            </div>
                        ) : (
                            "Crear Orden de Compra"
                        )}
                    </button>

                    {/* Información adicional */}
                    {orderItems.length > 0 && (
                        <div
                            style={{
                                marginTop: "16px",
                                padding: "12px",
                                backgroundColor: "#e7f3ff",
                                borderRadius: "6px",
                                border: "1px solid #b3d9ff",
                                color: "#0d6efd",
                                fontSize: "12px",
                                fontWeight: "500",
                                textAlign: "center",
                            }}
                        >
                            💰 Los precios unitarios y subtotales son editables.
                            Al modificar el subtotal se recalcula el precio
                            unitario automáticamente.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default OrderItemsList;
