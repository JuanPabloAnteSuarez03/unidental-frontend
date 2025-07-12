import React from "react";

const ProductsSummary = ({
    totalProducts,
    totalUnits,
    totalBatches,
    movementType,
}) => {
    const getMovementTypeColor = () => {
        return movementType === "in" ? "#28a745" : "#fd7e14";
    };

    const getMovementTypeIcon = () => {
        return movementType === "in" ? "📥" : "📤";
    };

    const getMovementTypeText = () => {
        return movementType === "in" ? "Entrada" : "Salida";
    };

    return (
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
                    fontSize: "18px",
                    fontWeight: "600",
                    margin: "0 0 16px 0",
                    color: "#2c3e50",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                }}
            >
                📊 Resumen del Movimiento
            </h3>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "16px",
                }}
            >
                {/* Tipo de Movimiento */}
                <div
                    style={{
                        backgroundColor: "#fff",
                        padding: "16px",
                        borderRadius: "8px",
                        border: `2px solid ${getMovementTypeColor()}20`,
                        textAlign: "center",
                    }}
                >
                    <div
                        style={{
                            fontSize: "24px",
                            marginBottom: "8px",
                        }}
                    >
                        {getMovementTypeIcon()}
                    </div>
                    <div
                        style={{
                            fontSize: "14px",
                            color: "#6c757d",
                            marginBottom: "4px",
                        }}
                    >
                        Tipo de Movimiento
                    </div>
                    <div
                        style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            color: getMovementTypeColor(),
                        }}
                    >
                        {getMovementTypeText()}
                    </div>
                </div>

                {/* Total de Productos */}
                <div
                    style={{
                        backgroundColor: "#fff",
                        padding: "16px",
                        borderRadius: "8px",
                        border: "2px solid #007bff20",
                        textAlign: "center",
                    }}
                >
                    <div
                        style={{
                            fontSize: "24px",
                            marginBottom: "8px",
                        }}
                    >
                        📦
                    </div>
                    <div
                        style={{
                            fontSize: "14px",
                            color: "#6c757d",
                            marginBottom: "4px",
                        }}
                    >
                        Productos
                    </div>
                    <div
                        style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#007bff",
                        }}
                    >
                        {totalProducts}
                    </div>
                </div>

                {/* Total de Unidades */}
                <div
                    style={{
                        backgroundColor: "#fff",
                        padding: "16px",
                        borderRadius: "8px",
                        border: "2px solid #28a74520",
                        textAlign: "center",
                    }}
                >
                    <div
                        style={{
                            fontSize: "24px",
                            marginBottom: "8px",
                        }}
                    >
                        🔢
                    </div>
                    <div
                        style={{
                            fontSize: "14px",
                            color: "#6c757d",
                            marginBottom: "4px",
                        }}
                    >
                        Unidades Totales
                    </div>
                    <div
                        style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#28a745",
                        }}
                    >
                        {totalUnits.toLocaleString()}
                    </div>
                </div>

                {/* Total de Lotes (solo si hay lotes) */}
                {totalBatches > 0 && (
                    <div
                        style={{
                            backgroundColor: "#fff",
                            padding: "16px",
                            borderRadius: "8px",
                            border: "2px solid #ffc10720",
                            textAlign: "center",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "24px",
                                marginBottom: "8px",
                            }}
                        >
                            🏷️
                        </div>
                        <div
                            style={{
                                fontSize: "14px",
                                color: "#6c757d",
                                marginBottom: "4px",
                            }}
                        >
                            Lotes a Crear
                        </div>
                        <div
                            style={{
                                fontSize: "16px",
                                fontWeight: "600",
                                color: "#ffc107",
                            }}
                        >
                            {totalBatches}
                        </div>
                    </div>
                )}
            </div>

            {/* Información adicional */}
            <div
                style={{
                    marginTop: "16px",
                    padding: "12px",
                    backgroundColor: "#e3f2fd",
                    borderRadius: "8px",
                    border: "1px solid #bbdefb",
                }}
            >
                <div
                    style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#1976d2",
                        marginBottom: "4px",
                    }}
                >
                    ℹ️ Información del Movimiento
                </div>
                <div
                    style={{
                        fontSize: "13px",
                        color: "#1565c0",
                        lineHeight: "1.4",
                    }}
                >
                    {movementType === "in" ? (
                        <>
                            • Se registrarán {totalProducts} producto
                            {totalProducts !== 1 ? "s" : ""} con un total de{" "}
                            {totalUnits.toLocaleString()} unidades
                            {totalBatches > 0 &&
                                ` • Se crearán ${totalBatches} lote${
                                    totalBatches !== 1 ? "s" : ""
                                } nuevos`}
                            • Todos los productos se registrarán en la misma
                            ubicación • Las notas globales se aplicarán a todos
                            los movimientos
                        </>
                    ) : (
                        <>
                            • Se procesarán {totalProducts} producto
                            {totalProducts !== 1 ? "s" : ""} con un total de{" "}
                            {totalUnits.toLocaleString()} unidades
                            {totalBatches > 0 &&
                                ` • Se utilizarán ${totalBatches} lote${
                                    totalBatches !== 1 ? "s" : ""
                                } existentes`}
                            • Todos los productos se retirarán de la misma
                            ubicación • Las notas globales se aplicarán a todos
                            los movimientos
                        </>
                    )}
                </div>
            </div>

            {/* Advertencia si hay muchos productos */}
            {totalProducts > 10 && (
                <div
                    style={{
                        marginTop: "12px",
                        padding: "12px",
                        backgroundColor: "#fff3cd",
                        borderRadius: "8px",
                        border: "1px solid #ffeaa7",
                    }}
                >
                    <div
                        style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#856404",
                            marginBottom: "4px",
                        }}
                    >
                        ⚠️ Movimiento de Gran Volumen
                    </div>
                    <div
                        style={{
                            fontSize: "13px",
                            color: "#856404",
                        }}
                    >
                        Este movimiento incluye {totalProducts} productos. El
                        procesamiento puede tomar más tiempo del habitual.
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductsSummary;
