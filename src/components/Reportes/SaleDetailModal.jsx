import React from "react";

const SaleDetailModal = ({ isOpen, onClose, saleData }) => {
    // Cerrar modal al hacer clic fuera de él
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen || !saleData) return null;

    // Calcular totales
    const totalItems =
        saleData.items?.reduce(
            (total, item) => total + (item.quantity || 0),
            0
        ) || 0;
    const totalAmount = parseFloat(
        saleData.total_net || saleData.total_gross || 0
    );

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: "20px",
            }}
            onClick={handleBackdropClick}
        >
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: "16px",
                    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
                    maxWidth: "1000px",
                    width: "100%",
                    maxHeight: "90vh",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* Header del modal */}
                <div
                    style={{
                        padding: "24px",
                        borderBottom: "1px solid #e9ecef",
                        background:
                            "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
                        color: "white",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <h2
                        style={{
                            margin: 0,
                            fontSize: "24px",
                            fontWeight: "700",
                        }}
                    >
                        📋 Detalle de Venta #{saleData.id}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            color: "white",
                            fontSize: "24px",
                            cursor: "pointer",
                            padding: "8px",
                            borderRadius: "50%",
                            transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor =
                                "rgba(255, 255, 255, 0.1)";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "transparent";
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Contenido del modal */}
                <div
                    style={{
                        flex: 1,
                        overflow: "auto",
                        padding: "24px",
                    }}
                >
                    {/* Información general de la venta */}
                    <div
                        style={{
                            backgroundColor: "#f8f9fa",
                            padding: "20px",
                            borderRadius: "12px",
                            marginBottom: "24px",
                            border: "1px solid #e9ecef",
                        }}
                    >
                        <h3
                            style={{
                                margin: "0 0 16px 0",
                                color: "#2c3e50",
                                fontSize: "18px",
                                fontWeight: "600",
                            }}
                        >
                            📊 Información General
                        </h3>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(250px, 1fr))",
                                gap: "16px",
                            }}
                        >
                            <div>
                                <strong style={{ color: "#495057" }}>
                                    👤 Cliente:
                                </strong>
                                <br />
                                <span
                                    style={{
                                        color: "#2c3e50",
                                        fontWeight: "500",
                                    }}
                                >
                                    {saleData.customer_details?.name ||
                                        "Cliente sin nombre"}
                                </span>
                                {saleData.customer_details?.phone && (
                                    <div
                                        style={{
                                            fontSize: "13px",
                                            color: "#6c757d",
                                            marginTop: "2px",
                                        }}
                                    >
                                        📞 {saleData.customer_details.phone}
                                    </div>
                                )}
                                {saleData.customer_details?.email && (
                                    <div
                                        style={{
                                            fontSize: "13px",
                                            color: "#6c757d",
                                            marginTop: "2px",
                                        }}
                                    >
                                        ✉️ {saleData.customer_details.email}
                                    </div>
                                )}
                            </div>
                            <div>
                                <strong style={{ color: "#495057" }}>
                                    📅 Fecha:
                                </strong>
                                <br />
                                <span
                                    style={{
                                        color: "#2c3e50",
                                        fontWeight: "500",
                                    }}
                                >
                                    {new Date(
                                        saleData.sale_date
                                    ).toLocaleDateString("es-ES", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </span>
                            </div>
                            <div>
                                <strong style={{ color: "#495057" }}>
                                    🏢 Sede:
                                </strong>
                                <br />
                                <span
                                    style={{
                                        color: "#2c3e50",
                                        fontWeight: "500",
                                    }}
                                >
                                    {saleData.location_details?.name ||
                                        "Sin especificar"}
                                </span>
                                {saleData.location_details?.address && (
                                    <div
                                        style={{
                                            fontSize: "13px",
                                            color: "#6c757d",
                                            marginTop: "2px",
                                        }}
                                    >
                                        📍 {saleData.location_details.address}
                                    </div>
                                )}
                            </div>
                            <div>
                                <strong style={{ color: "#495057" }}>
                                    🏪 Tipo de Venta:
                                </strong>
                                <br />
                                <span
                                    style={{
                                        display: "inline-block",
                                        padding: "6px 12px",
                                        borderRadius: "20px",
                                        fontSize: "12px",
                                        fontWeight: "600",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                        backgroundColor:
                                            saleData.sale_type === "credit"
                                                ? "#f39c12" + "20"
                                                : "#27ae60" + "20",
                                        color:
                                            saleData.sale_type === "credit"
                                                ? "#f39c12"
                                                : "#27ae60",
                                        border: `2px solid ${
                                            saleData.sale_type === "credit"
                                                ? "#f39c12" + "40"
                                                : "#27ae60" + "40"
                                        }`,
                                        marginTop: "4px",
                                    }}
                                >
                                    {saleData.sale_type === "credit"
                                        ? "Crédito"
                                        : "Normal"}
                                </span>
                                {saleData.should_invoice && (
                                    <div
                                        style={{
                                            fontSize: "13px",
                                            color: "#6c757d",
                                            marginTop: "4px",
                                        }}
                                    >
                                        📄 Requiere factura
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Productos vendidos */}
                    <div
                        style={{
                            backgroundColor: "white",
                            borderRadius: "12px",
                            border: "1px solid #e9ecef",
                            overflow: "hidden",
                            marginBottom: "24px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        }}
                    >
                        <div
                            style={{
                                padding: "20px",
                                backgroundColor: "#f8f9fa",
                                borderBottom: "1px solid #e9ecef",
                            }}
                        >
                            <h3
                                style={{
                                    margin: 0,
                                    color: "#2c3e50",
                                    fontSize: "18px",
                                    fontWeight: "600",
                                }}
                            >
                                📦 Productos Vendidos (
                                {saleData.items?.length || 0} productos)
                            </h3>
                        </div>

                        {saleData.items && saleData.items.length > 0 ? (
                            <div style={{ overflowX: "auto" }}>
                                <table
                                    style={{
                                        width: "100%",
                                        borderCollapse: "collapse",
                                        minWidth: "800px",
                                    }}
                                >
                                    <thead>
                                        <tr
                                            style={{
                                                background:
                                                    "linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)",
                                                color: "white",
                                            }}
                                        >
                                            <th
                                                style={{
                                                    padding: "16px 12px",
                                                    textAlign: "left",
                                                    fontWeight: "600",
                                                    fontSize: "14px",
                                                    letterSpacing: "0.5px",
                                                    textTransform: "uppercase",
                                                }}
                                            >
                                                🛍️ Producto
                                            </th>
                                            <th
                                                style={{
                                                    padding: "16px 12px",
                                                    textAlign: "center",
                                                    fontWeight: "600",
                                                    fontSize: "14px",
                                                    letterSpacing: "0.5px",
                                                    textTransform: "uppercase",
                                                }}
                                            >
                                                🏷️ SKU
                                            </th>
                                            <th
                                                style={{
                                                    padding: "16px 12px",
                                                    textAlign: "center",
                                                    fontWeight: "600",
                                                    fontSize: "14px",
                                                    letterSpacing: "0.5px",
                                                    textTransform: "uppercase",
                                                }}
                                            >
                                                🔢 Cantidad
                                            </th>
                                            <th
                                                style={{
                                                    padding: "16px 12px",
                                                    textAlign: "right",
                                                    fontWeight: "600",
                                                    fontSize: "14px",
                                                    letterSpacing: "0.5px",
                                                    textTransform: "uppercase",
                                                }}
                                            >
                                                💵 Precio Unit.
                                            </th>
                                            <th
                                                style={{
                                                    padding: "16px 12px",
                                                    textAlign: "right",
                                                    fontWeight: "600",
                                                    fontSize: "14px",
                                                    letterSpacing: "0.5px",
                                                    textTransform: "uppercase",
                                                }}
                                            >
                                                💰 Subtotal
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {saleData.items.map((item, index) => (
                                            <tr
                                                key={item.id || index}
                                                style={{
                                                    borderBottom:
                                                        "1px solid #f1f3f4",
                                                    backgroundColor:
                                                        index % 2 === 0
                                                            ? "#fff"
                                                            : "#f8f9fa",
                                                }}
                                            >
                                                <td
                                                    style={{
                                                        padding: "16px 12px",
                                                    }}
                                                >
                                                    <div>
                                                        <div
                                                            style={{
                                                                fontWeight:
                                                                    "600",
                                                                color: "#2c3e50",
                                                                marginBottom:
                                                                    "4px",
                                                                fontSize:
                                                                    "15px",
                                                            }}
                                                        >
                                                            {item
                                                                .product_details
                                                                ?.name ||
                                                                "Producto sin nombre"}
                                                        </div>
                                                        {item.product_details
                                                            ?.description && (
                                                            <div
                                                                style={{
                                                                    fontSize:
                                                                        "13px",
                                                                    color: "#6c757d",
                                                                    marginBottom:
                                                                        "4px",
                                                                }}
                                                            >
                                                                {
                                                                    item
                                                                        .product_details
                                                                        .description
                                                                }
                                                            </div>
                                                        )}
                                                        {item.product_details
                                                            ?.category_name && (
                                                            <div
                                                                style={{
                                                                    fontSize:
                                                                        "12px",
                                                                    color: "#6c757d",
                                                                    backgroundColor:
                                                                        "#e9ecef",
                                                                    padding:
                                                                        "2px 8px",
                                                                    borderRadius:
                                                                        "12px",
                                                                    display:
                                                                        "inline-block",
                                                                }}
                                                            >
                                                                📂{" "}
                                                                {
                                                                    item
                                                                        .product_details
                                                                        .category_name
                                                                }
                                                            </div>
                                                        )}
                                                        {item.batch_details && (
                                                            <div
                                                                style={{
                                                                    fontSize:
                                                                        "12px",
                                                                    color: "#f39c12",
                                                                    marginTop:
                                                                        "4px",
                                                                    fontWeight:
                                                                        "500",
                                                                }}
                                                            >
                                                                🏷️ Lote:{" "}
                                                                {
                                                                    item
                                                                        .batch_details
                                                                        .batch_number
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "16px 12px",
                                                        textAlign: "center",
                                                        color: "#495057",
                                                        fontFamily: "monospace",
                                                        fontSize: "14px",
                                                        fontWeight: "600",
                                                    }}
                                                >
                                                    {item.product_details
                                                        ?.sku || "N/A"}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "16px 12px",
                                                        textAlign: "center",
                                                        fontWeight: "700",
                                                        color: "#2c3e50",
                                                        fontSize: "16px",
                                                    }}
                                                >
                                                    {item.quantity || 0}
                                                    {item.product_details
                                                        ?.unit && (
                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "12px",
                                                                color: "#6c757d",
                                                                fontWeight:
                                                                    "400",
                                                            }}
                                                        >
                                                            {
                                                                item
                                                                    .product_details
                                                                    .unit
                                                            }
                                                        </div>
                                                    )}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "16px 12px",
                                                        textAlign: "right",
                                                        color: "#495057",
                                                        fontSize: "15px",
                                                        fontWeight: "600",
                                                    }}
                                                >
                                                    $
                                                    {parseFloat(
                                                        item.unit_price || 0
                                                    ).toLocaleString()}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "16px 12px",
                                                        textAlign: "right",
                                                        fontWeight: "700",
                                                        color: "#27ae60",
                                                        fontSize: "16px",
                                                    }}
                                                >
                                                    $
                                                    {(
                                                        item.subtotal || 0
                                                    ).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div
                                style={{
                                    padding: "40px",
                                    textAlign: "center",
                                    color: "#6c757d",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "48px",
                                        marginBottom: "16px",
                                    }}
                                >
                                    📦
                                </div>
                                <p>No se encontraron productos en esta venta</p>
                            </div>
                        )}
                    </div>

                    {/* Resumen de totales */}
                    <div
                        style={{
                            backgroundColor: "#f8f9fa",
                            padding: "24px",
                            borderRadius: "12px",
                            border: "1px solid #e9ecef",
                        }}
                    >
                        <h3
                            style={{
                                margin: "0 0 20px 0",
                                color: "#2c3e50",
                                fontSize: "18px",
                                fontWeight: "600",
                            }}
                        >
                            💰 Resumen de Totales
                        </h3>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(200px, 1fr))",
                                gap: "20px",
                            }}
                        >
                            <div
                                style={{
                                    textAlign: "center",
                                    padding: "16px",
                                    backgroundColor: "white",
                                    borderRadius: "8px",
                                    border: "1px solid #e9ecef",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "14px",
                                        color: "#6c757d",
                                        marginBottom: "8px",
                                    }}
                                >
                                    📦 Total de Items
                                </div>
                                <div
                                    style={{
                                        fontSize: "28px",
                                        fontWeight: "700",
                                        color: "#2c3e50",
                                    }}
                                >
                                    {totalItems}
                                </div>
                            </div>
                            <div
                                style={{
                                    textAlign: "center",
                                    padding: "16px",
                                    backgroundColor: "white",
                                    borderRadius: "8px",
                                    border: "1px solid #e9ecef",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "14px",
                                        color: "#6c757d",
                                        marginBottom: "8px",
                                    }}
                                >
                                    💰 Total de la Venta
                                </div>
                                <div
                                    style={{
                                        fontSize: "32px",
                                        fontWeight: "700",
                                        color: "#27ae60",
                                    }}
                                >
                                    ${totalAmount.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
        </div>
    );
};

export default SaleDetailModal;
