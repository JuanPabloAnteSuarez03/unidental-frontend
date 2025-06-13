import React from "react";

const MovementsTable = ({
    realMovements,
    isLoadingMovements,
    movementsError,
    movementsTotalCount,
}) => {
    if (movementsError) {
        return (
            <div
                style={{
                    padding: "20px 24px",
                    marginBottom: "20px",
                    borderRadius: "12px",
                    backgroundColor: "#f8d7da",
                    color: "#721c24",
                    border: "2px solid #f5c6cb",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    boxShadow: "0 2px 8px rgba(220, 53, 69, 0.15)",
                }}
            >
                <span style={{ fontSize: "24px" }}>❌</span>
                <span style={{ fontWeight: "500", fontSize: "16px" }}>
                    {movementsError}
                </span>
            </div>
        );
    }

    if (isLoadingMovements) {
        return (
            <div
                style={{
                    textAlign: "center",
                    padding: "60px 20px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "12px",
                    border: "1px solid #dee2e6",
                    marginBottom: "20px",
                }}
            >
                <div style={{ marginBottom: "16px" }}>
                    <div
                        style={{
                            display: "inline-block",
                            width: "40px",
                            height: "40px",
                            border: "4px solid #e9ecef",
                            borderTop: "4px solid #2c3e50",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                        }}
                    ></div>
                </div>
                <p
                    style={{
                        color: "#6c757d",
                        fontSize: "16px",
                        margin: 0,
                        fontWeight: "500",
                    }}
                >
                    Cargando movimientos de inventario...
                </p>
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
    }

    return (
        <div
            style={{
                overflowX: "auto",
                borderRadius: "12px",
                border: "1px solid #e9ecef",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
        >
            <table
                style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: "900px",
                    backgroundColor: "#fff",
                }}
            >
                <thead>
                    <tr
                        style={{
                            background:
                                "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
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
                            📅 Fecha y Hora
                        </th>
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
                            📦 Producto
                        </th>
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
                            🏷️ SKU
                        </th>
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
                            📍 Ubicación
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
                            🔄 Tipo
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
                            📊 Cantidad
                        </th>
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
                            👤 Usuario
                        </th>
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
                            ⏰ F. Vencimiento
                        </th>
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
                            📝 Notas
                        </th>
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
                            🔗 Referencia
                        </th>
                    </tr>
                </thead>{" "}
                <tbody>
                    {!isLoadingMovements &&
                        realMovements.map((movement, index) => (
                            <tr
                                key={movement.id}
                                style={{
                                    backgroundColor:
                                        index % 2 === 0 ? "#fff" : "#f8f9fa",
                                }}
                            >
                                <td
                                    style={{
                                        padding: "16px 12px",
                                        borderBottom: "1px solid #e9ecef",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        color: "#495057",
                                    }}
                                >
                                    {new Date(
                                        movement.occurred_at ||
                                            movement.created_at ||
                                            movement.date
                                    ).toLocaleString("es")}
                                </td>
                                <td
                                    style={{
                                        padding: "16px 12px",
                                        borderBottom: "1px solid #e9ecef",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        color: "#2c3e50",
                                    }}
                                >
                                    {movement.product_name || movement.product}
                                </td>
                                <td
                                    style={{
                                        padding: "16px 12px",
                                        borderBottom: "1px solid #e9ecef",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        color: "#6c757d",
                                        fontFamily: "monospace",
                                    }}
                                >
                                    {movement.product_sku ||
                                        movement.sku ||
                                        "-"}
                                </td>
                                <td
                                    style={{
                                        padding: "16px 12px",
                                        borderBottom: "1px solid #e9ecef",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        color: "#495057",
                                    }}
                                >
                                    {movement.location_name ||
                                        movement.location ||
                                        "-"}
                                </td>
                                <td
                                    style={{
                                        padding: "16px 12px",
                                        borderBottom: "1px solid #e9ecef",
                                        textAlign: "center",
                                    }}
                                >
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
                                                movement.movement_type ===
                                                    "in" ||
                                                movement.movementType === "in"
                                                    ? "#d4edda"
                                                    : "#ffeaa7",
                                            color:
                                                movement.movement_type ===
                                                    "in" ||
                                                movement.movementType === "in"
                                                    ? "#155724"
                                                    : "#856404",
                                            border: `2px solid ${
                                                movement.movement_type ===
                                                    "in" ||
                                                movement.movementType === "in"
                                                    ? "#c3e6cb"
                                                    : "#ffeaa7"
                                            }`,
                                        }}
                                    >
                                        {movement.movement_type === "in" ||
                                        movement.movementType === "in"
                                            ? "📈 Entrada"
                                            : "📉 Salida"}
                                    </span>
                                </td>
                                <td
                                    style={{
                                        padding: "16px 12px",
                                        borderBottom: "1px solid #e9ecef",
                                        textAlign: "center",
                                        fontSize: "16px",
                                        fontWeight: "700",
                                        color: "#2c3e50",
                                    }}
                                >
                                    {movement.quantity}
                                </td>
                                <td
                                    style={{
                                        padding: "16px 12px",
                                        borderBottom: "1px solid #e9ecef",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        color: "#495057",
                                    }}
                                >
                                    {movement.user_name || movement.user || "-"}
                                </td>
                                <td
                                    style={{
                                        padding: "16px 12px",
                                        borderBottom: "1px solid #e9ecef",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        color: "#495057",
                                    }}
                                >
                                    {movement.expiry_date ||
                                        movement.expiryDate ||
                                        "-"}
                                </td>
                                <td
                                    style={{
                                        padding: "16px 12px",
                                        borderBottom: "1px solid #e9ecef",
                                        fontSize: "14px",
                                        fontWeight: "400",
                                        color: "#6c757d",
                                        maxWidth: "200px",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                    title={movement.notes || "-"}
                                >
                                    {movement.notes || "-"}
                                </td>
                                <td
                                    style={{
                                        padding: "16px 12px",
                                        borderBottom: "1px solid #e9ecef",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        color: "#495057",
                                        fontFamily: "monospace",
                                    }}
                                >
                                    {movement.reference || "-"}
                                </td>
                            </tr>
                        ))}
                </tbody>
            </table>{" "}
            {!isLoadingMovements &&
                realMovements.length === 0 &&
                !movementsError && (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "60px 40px",
                            backgroundColor: "#f8f9fa",
                            borderRadius: "12px",
                            border: "2px dashed #dee2e6",
                            margin: "20px",
                        }}
                    >
                        <div style={{ marginBottom: "16px" }}>
                            <span style={{ fontSize: "48px", opacity: 0.5 }}>
                                📋
                            </span>
                        </div>
                        <h3
                            style={{
                                color: "#6c757d",
                                fontSize: "18px",
                                fontWeight: "600",
                                margin: "0 0 8px 0",
                            }}
                        >
                            No hay movimientos registrados
                        </h3>
                        <p
                            style={{
                                color: "#6c757d",
                                fontSize: "14px",
                                margin: "0",
                                opacity: 0.8,
                            }}
                        >
                            Los movimientos de stock aparecerán aquí una vez que
                            se registren
                        </p>
                    </div>
                )}
        </div>
    );
};

export default MovementsTable;
