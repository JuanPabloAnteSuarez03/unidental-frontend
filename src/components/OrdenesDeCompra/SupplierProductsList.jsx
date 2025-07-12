import React from "react";

const SupplierProductsList = ({
    selectedSupplier,
    products,
    isLoading,
    handleAddProduct,
    searchMode,
    clearOrder,
}) => {
    if (!selectedSupplier) {
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
                            "linear-gradient(135deg, #27ae60 0%, #2c3e50 100%)",
                        borderRadius: "8px",
                        color: "white",
                    }}
                >
                    <span style={{ fontSize: "18px" }}>📦</span>
                    <h3
                        style={{
                            fontSize: "16px",
                            fontWeight: "700",
                            margin: 0,
                            color: "white",
                        }}
                    >
                        Productos del Proveedor
                    </h3>
                </div>

                <div
                    style={{
                        color: "#888",
                        fontSize: 16,
                        textAlign: "center",
                        padding: "60px 20px",
                    }}
                >
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>
                        🏢
                    </div>
                    <div style={{ fontWeight: "600", marginBottom: "8px" }}>
                        Selecciona un proveedor
                    </div>
                    <div>
                        Una vez seleccionado un proveedor, podrás ver todos sus
                        productos disponibles
                    </div>
                </div>
            </div>
        );
    }

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
                        "linear-gradient(135deg, #27ae60 0%, #2c3e50 100%)",
                    borderRadius: "8px",
                    color: "white",
                }}
            >
                <span style={{ fontSize: "18px" }}>📦</span>
                <h3
                    style={{
                        fontSize: "16px",
                        fontWeight: "700",
                        margin: 0,
                        color: "white",
                    }}
                >
                    Productos de {selectedSupplier.name}
                </h3>
                <span
                    style={{
                        marginLeft: "auto",
                        fontSize: "12px",
                        fontWeight: "600",
                        backgroundColor: "rgba(255,255,255,0.2)",
                        padding: "4px 8px",
                        borderRadius: "4px",
                    }}
                >
                    {products.length} productos
                </span>
            </div>

            {isLoading ? (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "12px",
                        padding: "40px 20px",
                    }}
                >
                    <div className="custom-loader"></div>
                    <p style={{ color: "#666", fontSize: "14px" }}>
                        Cargando TODOS los productos de {selectedSupplier.name}
                        ...
                    </p>
                    <p style={{ color: "#999", fontSize: "12px" }}>
                        Esto puede tomar unos segundos si hay muchos productos
                    </p>
                </div>
            ) : products.length === 0 ? (
                <div
                    style={{
                        color: "#888",
                        fontSize: 16,
                        textAlign: "center",
                        padding: "40px 20px",
                    }}
                >
                    <div style={{ fontSize: "48px", marginBottom: "16px" }}>
                        📦
                    </div>
                    <div style={{ fontWeight: "600", marginBottom: "8px" }}>
                        No hay productos disponibles
                    </div>
                    <div>
                        El proveedor {selectedSupplier.name} no tiene productos
                        registrados
                    </div>
                </div>
            ) : (
                <div className="ordenes-table-container">
                    <table className="ordenes-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Precio</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.purchase_option}>
                                    <td style={{ fontWeight: "500" }}>
                                        <div>
                                            <div
                                                style={{
                                                    fontSize: "14px",
                                                    fontWeight: "600",
                                                    color: "#2c3e50",
                                                }}
                                            >
                                                {product.product_name ||
                                                    "Sin nombre"}
                                            </div>
                                            {product.category_name && (
                                                <div
                                                    style={{
                                                        fontSize: "12px",
                                                        color: "#7f8c8d",
                                                        marginTop: "2px",
                                                    }}
                                                >
                                                    {product.category_name}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td
                                        style={{
                                            color: "#27ae60",
                                            fontWeight: "600",
                                        }}
                                    >
                                        $
                                        {product.purchase_price
                                            ? parseFloat(
                                                  product.purchase_price
                                              ).toLocaleString()
                                            : "0"}
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => {
                                                // Verificar si hay productos de otro proveedor en la orden
                                                // (Esta validación no debería activarse normalmente ya que los productos
                                                // de esta lista son del mismo proveedor, pero es una validación de seguridad)
                                                handleAddProduct(product);
                                            }}
                                            className="btn-small btn-success"
                                            style={{ marginRight: "4px" }}
                                        >
                                            Agregar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Información adicional */}
            {products.length > 0 && (
                <div
                    style={{
                        marginTop: "16px",
                        padding: "8px 12px",
                        backgroundColor: "#e8f5e9",
                        borderRadius: "6px",
                        border: "1px solid #c8e6c9",
                        color: "#2e7d32",
                        fontSize: "12px",
                        fontWeight: "500",
                        textAlign: "center",
                    }}
                >
                    💡 Haz click en "Agregar" para incluir productos en tu orden
                    de compra
                </div>
            )}
        </div>
    );
};

export default SupplierProductsList;
