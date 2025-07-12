import React from "react";

const TransfersTable = ({
    transferencias,
    onCambiarEstado,
    onCompletarTransferencia,
    onCancelarTransferencia,
    changingStates = new Set(),
}) => {
    const getMovementTypeBadge = (movementType, movementTypeDisplay) => {
        const styles = {
            padding: "6px 12px",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: "600",
            textAlign: "center",
            minWidth: "90px",
            display: "inline-block",
        };

        switch (movementType) {
            case "out":
                return {
                    ...styles,
                    backgroundColor: "#ffebee",
                    color: "#c62828",
                    border: "1px solid #ffcdd2",
                };
            case "in":
                return {
                    ...styles,
                    backgroundColor: "#e8f5e8",
                    color: "#2e7d32",
                    border: "1px solid #c8e6c9",
                };
            case "transfer":
                return {
                    ...styles,
                    backgroundColor: "#e3f2fd",
                    color: "#1565c0",
                    border: "1px solid #bbdefb",
                };
            default:
                return {
                    ...styles,
                    backgroundColor: "#f5f5f5",
                    color: "#616161",
                    border: "1px solid #e0e0e0",
                };
        }
    };

    const getStatusBadge = (status, statusDisplay) => {
        const styles = {
            padding: "4px 10px",
            borderRadius: "10px",
            fontSize: "11px",
            fontWeight: "600",
            textAlign: "center",
            minWidth: "70px",
            display: "inline-block",
        };

        switch (status) {
            case "pending":
                return {
                    ...styles,
                    backgroundColor: "#fff3cd",
                    color: "#856404",
                    border: "1px solid #ffeaa7",
                };
            case "completed":
                return {
                    ...styles,
                    backgroundColor: "#d4edda",
                    color: "#155724",
                    border: "1px solid #c3e6cb",
                };
            case "cancelled":
                return {
                    ...styles,
                    backgroundColor: "#f8d7da",
                    color: "#721c24",
                    border: "1px solid #f5c6cb",
                };
            default:
                return {
                    ...styles,
                    backgroundColor: "#e2e3e5",
                    color: "#383d41",
                    border: "1px solid #d6d8db",
                };
        }
    };

    return (
        <div
            style={{
                backgroundColor: "#fff",
                borderRadius: "16px",
                padding: "32px",
                boxShadow:
                    "0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)",
                border: "1px solid #e9ecef",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    marginBottom: "32px",
                }}
            >
                <div
                    style={{
                        backgroundColor: "#f8f9fa",
                        borderRadius: "12px",
                        padding: "16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <span style={{ fontSize: "28px" }}>📋</span>
                </div>
                <div>
                    <h2
                        style={{
                            fontSize: "24px",
                            fontWeight: "600",
                            margin: "0 0 4px 0",
                            color: "#2c3e50",
                            letterSpacing: "-0.5px",
                        }}
                    >
                        Movimientos de Transferencias Internas
                    </h2>
                    {transferencias.length > 0 && (
                        <p
                            style={{
                                color: "#6c757d",
                                fontSize: "16px",
                                margin: "0",
                                fontWeight: "400",
                            }}
                        >
                            {transferencias.length} movimiento
                            {transferencias.length !== 1 ? "s" : ""} registrado
                            {transferencias.length !== 1 ? "s" : ""}
                        </p>
                    )}
                </div>
            </div>

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
                        minWidth: "1000px",
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
                                🆔 ID
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
                                📅 Fecha
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
                                📊 Estado
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
                                    textAlign: "center",
                                    fontWeight: "600",
                                    fontSize: "14px",
                                    letterSpacing: "0.5px",
                                    textTransform: "uppercase",
                                }}
                            >
                                ⚙️ Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {transferencias.length > 0 ? (
                            transferencias.map((t, index) => (
                                <tr
                                    key={t.id}
                                    style={{
                                        backgroundColor:
                                            index % 2 === 0
                                                ? "#fff"
                                                : "#f8f9fa",
                                    }}
                                >
                                    <td
                                        style={{
                                            padding: "16px 12px",
                                            borderBottom: "1px solid #e9ecef",
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            color: "#2c3e50",
                                        }}
                                    >
                                        #{t.id}
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
                                        {new Date(
                                            t.occurred_at
                                        ).toLocaleDateString("es-ES", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                        })}
                                        <br />
                                        <span
                                            style={{
                                                fontSize: "12px",
                                                color: "#6c757d",
                                            }}
                                        >
                                            {new Date(
                                                t.occurred_at
                                            ).toLocaleTimeString("es-ES", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
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
                                        <div>{t.product_name || "N/A"}</div>
                                        {t.product_sku && (
                                            <div
                                                style={{
                                                    fontSize: "12px",
                                                    color: "#6c757d",
                                                    fontWeight: "normal",
                                                    marginTop: "2px",
                                                }}
                                            >
                                                SKU: {t.product_sku}
                                            </div>
                                        )}
                                    </td>
                                    <td
                                        style={{
                                            padding: "16px 12px",
                                            borderBottom: "1px solid #e9ecef",
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            color: "#495057",
                                            textAlign: "center",
                                        }}
                                    >
                                        <span
                                            style={{
                                                backgroundColor: "#f8f9fa",
                                                padding: "4px 8px",
                                                borderRadius: "8px",
                                                fontSize: "13px",
                                            }}
                                        >
                                            {t.quantity}
                                        </span>
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
                                        <div>{t.location_name || "N/A"}</div>
                                        {t.location_type && (
                                            <div
                                                style={{
                                                    fontSize: "11px",
                                                    color: "#6c757d",
                                                    textTransform: "capitalize",
                                                    marginTop: "2px",
                                                }}
                                            >
                                                {t.location_type}
                                            </div>
                                        )}
                                    </td>
                                    <td
                                        style={{
                                            padding: "16px 12px",
                                            borderBottom: "1px solid #e9ecef",
                                            textAlign: "center",
                                        }}
                                    >
                                        <div style={{ marginBottom: "4px" }}>
                                            <span
                                                style={getMovementTypeBadge(
                                                    t.movement_type,
                                                    t.movement_type_display
                                                )}
                                            >
                                                {t.movement_type_display ||
                                                    t.movement_type}
                                            </span>
                                        </div>
                                    </td>
                                    <td
                                        style={{
                                            padding: "16px 12px",
                                            borderBottom: "1px solid #e9ecef",
                                            textAlign: "center",
                                        }}
                                    >
                                        <span
                                            style={getStatusBadge(
                                                t.status,
                                                t.status_display
                                            )}
                                        >
                                            {t.status_display || t.status}
                                        </span>
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
                                        {t.user_username || "N/A"}
                                    </td>
                                    <td
                                        style={{
                                            padding: "16px 12px",
                                            textAlign: "center",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: "8px",
                                                justifyContent: "center",
                                                flexWrap: "wrap",
                                            }}
                                        >
                                            {/* Botón Completar - solo mostrar si está pendiente */}
                                            {t.status === "pending" && (
                                                <button
                                                    onClick={() =>
                                                        onCompletarTransferencia(
                                                            t.id
                                                        )
                                                    }
                                                    disabled={changingStates.has(
                                                        t.id
                                                    )}
                                                    style={{
                                                        backgroundColor:
                                                            changingStates.has(
                                                                t.id
                                                            )
                                                                ? "#f5f5f5"
                                                                : "#e8f5e8",
                                                        color: changingStates.has(
                                                            t.id
                                                        )
                                                            ? "#999"
                                                            : "#2e7d32",
                                                        border: `1px solid ${
                                                            changingStates.has(
                                                                t.id
                                                            )
                                                                ? "#ddd"
                                                                : "#c8e6c9"
                                                        }`,
                                                        borderRadius: "6px",
                                                        padding: "6px 12px",
                                                        fontSize: "12px",
                                                        cursor: changingStates.has(
                                                            t.id
                                                        )
                                                            ? "not-allowed"
                                                            : "pointer",
                                                        fontWeight: "500",
                                                        transition:
                                                            "all 0.2s ease",
                                                        opacity:
                                                            changingStates.has(
                                                                t.id
                                                            )
                                                                ? 0.6
                                                                : 1,
                                                    }}
                                                    onMouseOver={(e) => {
                                                        if (
                                                            !changingStates.has(
                                                                t.id
                                                            )
                                                        ) {
                                                            e.target.style.backgroundColor =
                                                                "#2e7d32";
                                                            e.target.style.color =
                                                                "white";
                                                        }
                                                    }}
                                                    onMouseOut={(e) => {
                                                        if (
                                                            !changingStates.has(
                                                                t.id
                                                            )
                                                        ) {
                                                            e.target.style.backgroundColor =
                                                                "#e8f5e8";
                                                            e.target.style.color =
                                                                "#2e7d32";
                                                        }
                                                    }}
                                                >
                                                    {changingStates.has(t.id)
                                                        ? "⏳ Procesando..."
                                                        : "✅ Completar"}
                                                </button>
                                            )}

                                            {/* Botón Cancelar - solo mostrar si no está completada ni cancelada */}
                                            {t.status !== "completed" &&
                                                t.status !== "cancelled" && (
                                                    <button
                                                        onClick={() =>
                                                            onCancelarTransferencia(
                                                                t.id
                                                            )
                                                        }
                                                        disabled={changingStates.has(
                                                            t.id
                                                        )}
                                                        style={{
                                                            backgroundColor:
                                                                changingStates.has(
                                                                    t.id
                                                                )
                                                                    ? "#f5f5f5"
                                                                    : "#ffebee",
                                                            color: changingStates.has(
                                                                t.id
                                                            )
                                                                ? "#999"
                                                                : "#c62828",
                                                            border: `1px solid ${
                                                                changingStates.has(
                                                                    t.id
                                                                )
                                                                    ? "#ddd"
                                                                    : "#ffcdd2"
                                                            }`,
                                                            borderRadius: "6px",
                                                            padding: "6px 12px",
                                                            fontSize: "12px",
                                                            cursor: changingStates.has(
                                                                t.id
                                                            )
                                                                ? "not-allowed"
                                                                : "pointer",
                                                            fontWeight: "500",
                                                            transition:
                                                                "all 0.2s ease",
                                                            opacity:
                                                                changingStates.has(
                                                                    t.id
                                                                )
                                                                    ? 0.6
                                                                    : 1,
                                                        }}
                                                        onMouseOver={(e) => {
                                                            if (
                                                                !changingStates.has(
                                                                    t.id
                                                                )
                                                            ) {
                                                                e.target.style.backgroundColor =
                                                                    "#c62828";
                                                                e.target.style.color =
                                                                    "white";
                                                            }
                                                        }}
                                                        onMouseOut={(e) => {
                                                            if (
                                                                !changingStates.has(
                                                                    t.id
                                                                )
                                                            ) {
                                                                e.target.style.backgroundColor =
                                                                    "#ffebee";
                                                                e.target.style.color =
                                                                    "#c62828";
                                                            }
                                                        }}
                                                    >
                                                        {changingStates.has(
                                                            t.id
                                                        )
                                                            ? "⏳ Procesando..."
                                                            : "❌ Cancelar"}
                                                    </button>
                                                )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan="9"
                                    style={{
                                        padding: "60px 8px",
                                        textAlign: "center",
                                        color: "#6c757d",
                                        fontSize: "16px",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            gap: "16px",
                                        }}
                                    >
                                        <span style={{ fontSize: "48px" }}>
                                            🔄
                                        </span>
                                        <div>
                                            <div
                                                style={{
                                                    fontWeight: "600",
                                                    marginBottom: "8px",
                                                }}
                                            >
                                                No hay movimientos de
                                                transferencias internas
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "14px",
                                                    color: "#999",
                                                }}
                                            >
                                                Los movimientos de
                                                transferencias aparecerán aquí
                                                una vez que se creen
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TransfersTable;
