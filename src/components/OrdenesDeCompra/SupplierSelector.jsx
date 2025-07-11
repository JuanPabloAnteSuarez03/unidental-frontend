import React from "react";

const SupplierSelector = ({
    suppliers,
    selectedSupplier,
    setSelectedSupplier,
    isLoadingSuppliers,
    setSearchMode,
    setSearchTerm,
    setSearchResults,
    orderItems,
    clearOrder,
}) => {
    return (
        <div className="order-card">
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "16px",
                    padding: "12px 16px",
                    background:
                        "linear-gradient(135deg, #3498db 0%, #2980b9 100%)",
                    borderRadius: "8px",
                    color: "white",
                }}
            >
                <span style={{ fontSize: "18px" }}>🏢</span>
                <h3
                    style={{
                        fontSize: "16px",
                        fontWeight: "700",
                        margin: 0,
                        color: "white",
                    }}
                >
                    Seleccionar Proveedor
                </h3>
            </div>

            <div className="supplier-selector">
                <label
                    htmlFor="proveedor-select"
                    style={{
                        display: "block",
                        marginBottom: "8px",
                        fontWeight: "600",
                        fontSize: "14px",
                        color: "#2c3e50",
                    }}
                >
                    Proveedor *
                </label>
                <select
                    id="proveedor-select"
                    value={selectedSupplier ? selectedSupplier.id : ""}
                    onChange={(e) => {
                        const id = e.target.value;
                        const supplier = suppliers.find(
                            (s) => String(s.id) === id
                        );

                        // Verificar si hay productos en la orden y se está cambiando de proveedor
                        if (
                            orderItems.length > 0 &&
                            selectedSupplier &&
                            supplier &&
                            selectedSupplier.id !== supplier.id
                        ) {
                            const confirmMessage = `⚠️ CAMBIO DE PROVEEDOR\n\nYa tienes ${orderItems.length} producto(s) del proveedor "${selectedSupplier.name}" en tu orden de compra.\n\nSi cambias al proveedor "${supplier.name}":\n• Se eliminarán todos los productos del proveedor "${selectedSupplier.name}"\n• Se seleccionará el proveedor "${supplier.name}"\n\n¿Deseas continuar con el cambio de proveedor?`;

                            if (window.confirm(confirmMessage)) {
                                const eliminatedProducts = clearOrder(); // Limpiar productos del proveedor anterior
                                setSelectedSupplier(supplier);
                                setSearchMode("supplier");
                                setSearchTerm("");
                                setSearchResults([]);

                                // Mostrar notificación
                                const notification = {
                                    type: "warning",
                                    message: `🔄 Proveedor cambiado a "${supplier.name}".\n\n❌ Se eliminaron ${eliminatedProducts} producto(s) del proveedor "${selectedSupplier.name}".\n\n📍 Deberás seleccionar nuevamente la sede de destino.`,
                                    duration: 5000,
                                };

                                if (window.showNotification) {
                                    window.showNotification(notification);
                                }
                            } else {
                                // Revertir la selección
                                e.target.value = selectedSupplier.id;
                            }
                        } else {
                            setSelectedSupplier(supplier || null);
                            setSearchMode("supplier");
                            setSearchTerm("");
                            setSearchResults([]);
                        }
                    }}
                    disabled={isLoadingSuppliers}
                >
                    <option value="">
                        {isLoadingSuppliers
                            ? "Cargando los proveedores..."
                            : "Seleccione un proveedor"}
                    </option>
                    {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                        </option>
                    ))}
                </select>
            </div>

            {selectedSupplier && (
                <div
                    style={{
                        marginTop: "12px",
                        padding: "8px 12px",
                        backgroundColor: "#d4edda",
                        borderRadius: "6px",
                        border: "1px solid #c3e6cb",
                        color: "#155724",
                        fontSize: "14px",
                        fontWeight: "500",
                    }}
                >
                    ✅ Proveedor seleccionado:{" "}
                    <strong>{selectedSupplier.name}</strong>
                </div>
            )}

            {/* Información del total de proveedores */}
            {!isLoadingSuppliers && suppliers.length > 0 && (
                <div
                    style={{
                        marginTop: "8px",
                        padding: "6px 10px",
                        backgroundColor: "#e3f2fd",
                        borderRadius: "4px",
                        border: "1px solid #bbdefb",
                        color: "#1565c0",
                        fontSize: "12px",
                        fontWeight: "500",
                        textAlign: "center",
                    }}
                >
                    📊 {suppliers.length} proveedores disponibles
                </div>
            )}

            {isLoadingSuppliers && (
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "#6c757d",
                        fontSize: "14px",
                        marginTop: "12px",
                        padding: "8px 12px",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "6px",
                        border: "1px solid #e9ecef",
                    }}
                >
                    <div
                        className="custom-loader"
                        style={{ width: "16px", height: "16px" }}
                    ></div>
                    Cargando los proveedores...
                </div>
            )}
        </div>
    );
};

export default SupplierSelector;
