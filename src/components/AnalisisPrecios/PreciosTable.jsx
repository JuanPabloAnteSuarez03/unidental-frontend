import React from "react";

const PreciosTable = ({
    data,
    loading,
    error,
    getFieldValue,
    sortByPurchasePrice,
}) => {
    if (loading) {
        return (
            <div
                style={{
                    background: "#fff",
                    padding: 40,
                    borderRadius: 12,
                    boxShadow: "0 2px 8px rgba(25, 118, 210, 0.08)",
                    textAlign: "center",
                }}
            >
                <div
                    style={{
                        width: 32,
                        height: 32,
                        border: "3px solid #e3e6ea",
                        borderTop: "3px solid #007bff",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                        margin: "0 auto 16px",
                    }}
                ></div>
                <p style={{ color: "#6c757d", margin: 0 }}>
                    Cargando datos de análisis de precios...
                </p>
                <style>{`@keyframes spin {0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}`}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div
                style={{
                    background: "#fff",
                    padding: 40,
                    borderRadius: 12,
                    boxShadow: "0 2px 8px rgba(25, 118, 210, 0.08)",
                    textAlign: "center",
                    color: "#dc3545",
                }}
            >
                <p style={{ margin: 0 }}>Error: {error}</p>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div
                style={{
                    background: "#fff",
                    padding: 40,
                    borderRadius: 12,
                    boxShadow: "0 2px 8px rgba(25, 118, 210, 0.08)",
                    textAlign: "center",
                    color: "#6c757d",
                }}
            >
                <p style={{ margin: 0 }}>No se encontraron datos de precios</p>
            </div>
        );
    }

    const sortedData = sortByPurchasePrice([...data]);

    return (
        <div
            style={{
                background: "#fff",
                borderRadius: 12,
                boxShadow: "0 2px 8px rgba(25, 118, 210, 0.08)",
                overflow: "hidden",
            }}
        >
            <div
                style={{
                    background:
                        "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
                    color: "white",
                    padding: "20px 24px",
                    borderBottom: "1px solid #e9ecef",
                }}
            >
                <h3
                    style={{
                        margin: 0,
                        fontSize: 20,
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                    }}
                >
                    Tabla de Análisis de Precios
                </h3>
                <p
                    style={{
                        margin: "8px 0 0 0",
                        opacity: 0.8,
                        fontSize: 14,
                    }}
                >
                    {data.length} productos encontrados
                </p>
            </div>

            <div style={{ overflowX: "auto" }}>
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        minWidth: 800,
                    }}
                >
                    <thead>
                        <tr
                            style={{
                                background: "#f8f9fa",
                                borderBottom: "2px solid #dee2e6",
                            }}
                        >
                            <th
                                style={{
                                    padding: "16px 12px",
                                    textAlign: "left",
                                    fontWeight: 700,
                                    fontSize: 14,
                                    color: "#495057",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                }}
                            >
                                Producto
                            </th>
                            <th
                                style={{
                                    padding: "16px 12px",
                                    textAlign: "left",
                                    fontWeight: 700,
                                    fontSize: 14,
                                    color: "#495057",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                }}
                            >
                                SKU
                            </th>
                            <th
                                style={{
                                    padding: "16px 12px",
                                    textAlign: "left",
                                    fontWeight: 700,
                                    fontSize: 14,
                                    color: "#495057",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                }}
                            >
                                Proveedor
                            </th>
                            <th
                                style={{
                                    padding: "16px 12px",
                                    textAlign: "right",
                                    fontWeight: 700,
                                    fontSize: 14,
                                    color: "#495057",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                }}
                            >
                                Precio de Compra
                            </th>
                            <th
                                style={{
                                    padding: "16px 12px",
                                    textAlign: "left",
                                    fontWeight: 700,
                                    fontSize: 14,
                                    color: "#495057",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                }}
                            >
                                Categoría
                            </th>
                            <th
                                style={{
                                    padding: "16px 12px",
                                    textAlign: "left",
                                    fontWeight: 700,
                                    fontSize: 14,
                                    color: "#495057",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.5px",
                                }}
                            >
                                Descripción
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map((row, index) => (
                            <tr
                                key={index}
                                style={{
                                    backgroundColor:
                                        index % 2 === 0 ? "#fff" : "#f8f9fa",
                                    borderBottom: "1px solid #e9ecef",
                                    transition: "background-color 0.2s",
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
                                        index % 2 === 0 ? "#fff" : "#f8f9fa";
                                }}
                            >
                                <td
                                    style={{
                                        padding: "16px 12px",
                                        fontSize: 14,
                                        fontWeight: 600,
                                        color: "#2c3e50",
                                    }}
                                >
                                    {getFieldValue(row, "product_name", [
                                        "name",
                                        "product_name",
                                    ])}
                                </td>
                                <td
                                    style={{
                                        padding: "16px 12px",
                                        fontSize: 14,
                                        color: "#6c757d",
                                        fontFamily: "monospace",
                                    }}
                                >
                                    {getFieldValue(row, "sku", ["product_sku"])}
                                </td>
                                <td
                                    style={{
                                        padding: "16px 12px",
                                        fontSize: 14,
                                        color: "#495057",
                                        fontWeight: 500,
                                    }}
                                >
                                    {getFieldValue(row, "supplier_name", [
                                        "supplier",
                                        "supplier_name",
                                    ])}
                                </td>
                                <td
                                    style={{
                                        padding: "16px 12px",
                                        fontSize: 14,
                                        textAlign: "right",
                                        fontWeight: 700,
                                        color: "#1976d2",
                                    }}
                                >
                                    $
                                    {parseFloat(
                                        getFieldValue(row, "purchase_price", [
                                            "price",
                                            "cost",
                                            "unit_price",
                                        ]) || 0
                                    ).toLocaleString()}
                                </td>
                                <td
                                    style={{
                                        padding: "16px 12px",
                                        fontSize: 14,
                                        color: "#6c757d",
                                    }}
                                >
                                    {getFieldValue(row, "category", [
                                        "category_name",
                                    ])}
                                </td>
                                <td
                                    style={{
                                        padding: "16px 12px",
                                        fontSize: 14,
                                        color: "#6c757d",
                                        maxWidth: 200,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                    title={getFieldValue(row, "description", [
                                        "product_description",
                                    ])}
                                >
                                    {getFieldValue(row, "description", [
                                        "product_description",
                                    ])}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PreciosTable;
