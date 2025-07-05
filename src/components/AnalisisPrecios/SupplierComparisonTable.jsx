import React from "react";

const SupplierComparisonTable = ({
    data,
    loading,
    supplierName,
    side = "left",
    getFieldValue,
}) => {
    const getSideColor = () => {
        return side === "left" ? "#1976d2" : "#388e3c";
    };

    const getSideGradient = () => {
        return side === "left"
            ? "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)"
            : "linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)";
    };

    if (loading) {
        return (
            <div
                style={{
                    background: "#fff",
                    borderRadius: 16,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    border: "1px solid #e9ecef",
                    minHeight: 400,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 40,
                }}
            >
                <div
                    style={{
                        width: 48,
                        height: 48,
                        border: "4px solid #f3f4f6",
                        borderTop: `4px solid ${getSideColor()}`,
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                        marginBottom: 16,
                    }}
                ></div>
                <div
                    style={{
                        color: getSideColor(),
                        fontWeight: 600,
                        fontSize: 16,
                        marginBottom: 8,
                    }}
                >
                    Cargando catálogo...
                </div>
                <div
                    style={{
                        color: "#6c757d",
                        fontSize: 14,
                        textAlign: "center",
                    }}
                >
                    Obteniendo productos de {supplierName}
                </div>
                <style>{`@keyframes spin {0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}`}</style>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div
                style={{
                    background: "#fff",
                    borderRadius: 16,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    border: "1px solid #e9ecef",
                    minHeight: 400,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 40,
                }}
            >
                <div
                    style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        background: "#f8f9fa",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 16,
                        border: `2px solid ${getSideColor()}`,
                    }}
                >
                    <span style={{ fontSize: 24, color: getSideColor() }}>
                        📦
                    </span>
                </div>
                <div
                    style={{
                        color: "#495057",
                        fontWeight: 600,
                        fontSize: 18,
                        marginBottom: 8,
                        textAlign: "center",
                    }}
                >
                    {supplierName
                        ? "No hay productos disponibles"
                        : "Selecciona un proveedor"}
                </div>
                <div
                    style={{
                        color: "#6c757d",
                        fontSize: 14,
                        textAlign: "center",
                        maxWidth: 280,
                    }}
                >
                    {supplierName
                        ? "Este proveedor no tiene productos en su catálogo o no coinciden con los filtros aplicados."
                        : "Elige un proveedor del menú desplegable para ver su catálogo de productos."}
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                background: "#fff",
                borderRadius: 16,
                boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                border: "1px solid #e9ecef",
                overflow: "hidden",
            }}
        >
            {/* Header de la tabla */}
            <div
                style={{
                    background: getSideGradient(),
                    color: "white",
                    padding: "20px 24px",
                    borderBottom: "1px solid #e9ecef",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <div>
                        <h3
                            style={{
                                margin: 0,
                                fontSize: 20,
                                fontWeight: 700,
                                letterSpacing: "0.5px",
                            }}
                        >
                            {supplierName}
                        </h3>
                        <p
                            style={{
                                margin: "4px 0 0 0",
                                opacity: 0.9,
                                fontSize: 14,
                                fontWeight: 500,
                            }}
                        >
                            {data.length} productos en catálogo
                        </p>
                    </div>
                    <div
                        style={{
                            background: "rgba(255,255,255,0.2)",
                            borderRadius: "50%",
                            width: 48,
                            height: 48,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backdropFilter: "blur(10px)",
                        }}
                    >
                        <span style={{ fontSize: 20 }}>
                            {side === "left" ? "🏢" : "🏭"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tabla de productos */}
            <div style={{ overflowX: "auto" }}>
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        minWidth: 500,
                    }}
                >
                    <thead>
                        <tr
                            style={{
                                background: "#f8f9fa",
                                borderBottom: "2px solid #e9ecef",
                            }}
                        >
                            <th
                                style={{
                                    padding: "16px 20px",
                                    textAlign: "left",
                                    fontWeight: 700,
                                    fontSize: 13,
                                    color: "#495057",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                    borderBottom: `3px solid ${getSideColor()}`,
                                }}
                            >
                                Producto
                            </th>
                            <th
                                style={{
                                    padding: "16px 20px",
                                    textAlign: "right",
                                    fontWeight: 700,
                                    fontSize: 13,
                                    color: "#495057",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                    borderBottom: `3px solid ${getSideColor()}`,
                                }}
                            >
                                Precio
                            </th>
                            <th
                                style={{
                                    padding: "16px 20px",
                                    textAlign: "left",
                                    fontWeight: 700,
                                    fontSize: 13,
                                    color: "#495057",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                    borderBottom: `3px solid ${getSideColor()}`,
                                }}
                            >
                                Categoría
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, idx) => {
                            const productName = getFieldValue(
                                row,
                                "product_name",
                                ["name", "product_name"]
                            );
                            const price = getFieldValue(row, "purchase_price", [
                                "price",
                                "cost",
                                "unit_price",
                            ]);
                            const category = getFieldValue(row, "category", [
                                "category_name",
                                "product_category",
                            ]);

                            return (
                                <tr
                                    key={idx}
                                    style={{
                                        backgroundColor:
                                            idx % 2 === 0 ? "#fff" : "#f8f9fa",
                                        borderBottom: "1px solid #e9ecef",
                                        transition:
                                            "background-color 0.2s ease",
                                        cursor: "pointer",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.closest(
                                            "tr"
                                        ).style.backgroundColor = "#e3f2fd";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.closest(
                                            "tr"
                                        ).style.backgroundColor =
                                            idx % 2 === 0 ? "#fff" : "#f8f9fa";
                                    }}
                                >
                                    <td
                                        style={{
                                            padding: "16px 20px",
                                            fontSize: 14,
                                            fontWeight: 600,
                                            color: "#2c3e50",
                                            maxWidth: 200,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        }}
                                        title={productName}
                                    >
                                        {productName || "N/A"}
                                    </td>
                                    <td
                                        style={{
                                            padding: "16px 20px",
                                            fontSize: 16,
                                            textAlign: "right",
                                            fontWeight: 700,
                                            color: getSideColor(),
                                        }}
                                    >
                                        $
                                        {parseFloat(
                                            price || 0
                                        ).toLocaleString()}
                                    </td>
                                    <td
                                        style={{
                                            padding: "16px 20px",
                                            fontSize: 13,
                                            color: "#6c757d",
                                        }}
                                    >
                                        <span
                                            style={{
                                                background: "#f8f9fa",
                                                color: "#495057",
                                                borderRadius: 12,
                                                padding: "4px 12px",
                                                fontWeight: 500,
                                                fontSize: 12,
                                                letterSpacing: 0.2,
                                                border: "1px solid #e9ecef",
                                            }}
                                        >
                                            {category || "Sin categoría"}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer con estadísticas */}
            <div
                style={{
                    background: "#f8f9fa",
                    padding: "16px 24px",
                    borderTop: "1px solid #e9ecef",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <div
                    style={{
                        fontSize: 13,
                        color: "#6c757d",
                        fontWeight: 500,
                    }}
                >
                    Mostrando {data.length} productos
                </div>
                <div
                    style={{
                        fontSize: 13,
                        color: getSideColor(),
                        fontWeight: 600,
                    }}
                >
                    Precio promedio: $
                    {data.length > 0
                        ? (
                              data.reduce((sum, item) => {
                                  const price = parseFloat(
                                      getFieldValue(item, "purchase_price", [
                                          "price",
                                          "cost",
                                          "unit_price",
                                      ]) || 0
                                  );
                                  return sum + price;
                              }, 0) / data.length
                          ).toFixed(0)
                        : "0"}
                </div>
            </div>
        </div>
    );
};

export default SupplierComparisonTable;
