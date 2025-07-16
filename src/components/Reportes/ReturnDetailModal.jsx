import React from "react";

const ReturnDetailModal = ({ isOpen, onClose, returnData }) => {
    // Cerrar modal al hacer clic fuera de él
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen || !returnData) return null;

    // Calcular totales
    const totalItems =
        returnData.items?.reduce(
            (total, item) => total + (item.quantity_returned || 0),
            0
        ) || 0;
    const totalAmount = parseFloat(returnData.total_amount || 0);

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
                    background: "#fff",
                    borderRadius: "18px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                    width: "100%",
                    maxWidth: 700,
                    minWidth: 340,
                    display: "flex",
                    flexDirection: "column",
                    maxHeight: "90vh",
                }}
            >
                {/* Cabecera */}
                <div
                    style={{
                        background: "linear-gradient(135deg, #dc3545 0%, #ff7675 100%)",
                        color: "white",
                        borderTopLeftRadius: "18px",
                        borderTopRightRadius: "18px",
                        padding: "20px 32px 20px 24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <h2
                        style={{
                            margin: 0,
                            fontSize: "24px",
                            fontWeight: "700",
                        }}
                    >
                        🧾 Detalle de Devolución #{returnData.id}
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
                    {/* Información general de la devolución */}
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
                                color: "#dc3545",
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
                                    🗓️ Fecha:
                                </strong>
                                <br />
                                <span
                                    style={{
                                        color: "#2c3e50",
                                        fontWeight: "500",
                                    }}
                                >
                                    {returnData.return_date
                                        ? new Date(returnData.return_date).toLocaleString()
                                        : returnData.created_at
                                        ? new Date(returnData.created_at).toLocaleString()
                                        : "-"}
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
                                    {returnData.original_sale_details?.location_details?.name || "Sin especificar"}
                                </span>
                                {returnData.original_sale_details?.location_details?.address && (
                                    <div
                                        style={{
                                            fontSize: "13px",
                                            color: "#6c757d",
                                            marginTop: "2px",
                                        }}
                                    >
                                        📍 {returnData.original_sale_details.location_details.address}
                                    </div>
                                )}
                            </div>
                            <div>
                                <strong style={{ color: "#495057" }}>
                                    💵 Monto devuelto:
                                </strong>
                                <br />
                                <span
                                    style={{
                                        color: "#dc3545",
                                        fontWeight: "700",
                                        fontSize: "18px",
                                    }}
                                >
                                    ${totalAmount.toLocaleString()}
                                </span>
                            </div>
                            <div>
                                <strong style={{ color: "#495057" }}>
                                    📝 Motivo:
                                </strong>
                                <br />
                                <span
                                    style={{
                                        color: "#2c3e50",
                                        fontWeight: "500",
                                    }}
                                >
                                    {returnData.reason_display
                                        ? returnData.reason_display
                                        : returnData.reason
                                        ? returnData.reason.charAt(0).toUpperCase() + returnData.reason.slice(1)
                                        : "-"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Productos devueltos */}
                    {returnData.items && returnData.items.length > 0 && (
                        <div style={{ overflowX: "auto", marginBottom: 24 }}>
                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                    minWidth: "600px",
                                }}
                            >
                                <thead>
                                    <tr
                                        style={{
                                            background:
                                                "linear-gradient(135deg, #dc3545 0%, #ff7675 100%)",
                                            color: "white",
                                        }}
                                    >
                                        <th style={{ padding: "16px 12px", textAlign: "left" }}>Producto</th>
                                        <th style={{ padding: "16px 12px", textAlign: "center" }}>Cantidad</th>
                                        <th style={{ padding: "16px 12px", textAlign: "center" }}>Precio Unitario</th>
                                        <th style={{ padding: "16px 12px", textAlign: "right" }}>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {returnData.items.map((item, index) => (
                                        <tr
                                            key={item.id || index}
                                            style={{
                                                borderBottom:
                                                    "1px solid #f1f3f4",
                                                backgroundColor:
                                                    index % 2 === 0
                                                        ? "#fff"
                                                        : "#fff6f7",
                                            }}
                                        >
                                            <td style={{ padding: "16px 12px" }}>
                                                <div>
                                                    <div
                                                        style={{
                                                            fontWeight: "600",
                                                            color: "#dc3545",
                                                            marginBottom: "4px",
                                                            fontSize: "15px",
                                                        }}
                                                    >
                                                        {item.product_details?.name || "Producto sin nombre"}
                                                    </div>
                                                </div>
                                            </td>
                                            <td
                                                style={{
                                                    padding: "16px 12px",
                                                    textAlign: "center",
                                                    fontWeight: "700",
                                                    color: "#dc3545",
                                                    fontSize: "16px",
                                                }}
                                            >
                                                {item.quantity_returned}
                                            </td>
                                            <td
                                                style={{
                                                    padding: "16px 12px",
                                                    textAlign: "center",
                                                    color: "#dc3545",
                                                    fontFamily: "monospace",
                                                    fontSize: "14px",
                                                    fontWeight: "600",
                                                }}
                                            >
                                                ${parseFloat(item.unit_price || 0).toLocaleString()}
                                            </td>
                                            <td
                                                style={{
                                                    padding: "16px 12px",
                                                    textAlign: "right",
                                                    fontWeight: "700",
                                                    color: "#dc3545",
                                                    fontSize: "16px",
                                                }}
                                            >
                                                ${(
                                                    (item.unit_price || 0) * (item.quantity_returned || 0)
                                                ).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Resumen de totales */}
                    <div
                        style={{
                            backgroundColor: "#fff",
                            border: "1px solid #e9ecef",
                            borderRadius: "12px",
                            padding: "20px 0 0 0",
                            display: "flex",
                            gap: 24,
                            justifyContent: "center",
                        }}
                    >
                        <div style={{ flex: 1, textAlign: "center" }}>
                            <div
                                style={{
                                    fontSize: "14px",
                                    color: "#6c757d",
                                    marginBottom: "8px",
                                }}
                            >
                                🔢 Total de Items
                            </div>
                            <div
                                style={{
                                    fontSize: "32px",
                                    fontWeight: "700",
                                    color: "#dc3545",
                                }}
                            >
                                {totalItems}
                            </div>
                        </div>
                        <div style={{ flex: 1, textAlign: "center" }}>
                            <div
                                style={{
                                    fontSize: "14px",
                                    color: "#6c757d",
                                    marginBottom: "8px",
                                }}
                            >
                                💰 Total Devuelto
                            </div>
                            <div
                                style={{
                                    fontSize: "32px",
                                    fontWeight: "700",
                                    color: "#dc3545",
                                }}
                            >
                                ${totalAmount.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReturnDetailModal; 