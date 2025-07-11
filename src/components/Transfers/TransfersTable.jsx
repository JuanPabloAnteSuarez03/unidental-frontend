import React from "react";

const TransfersTable = ({
    transferencias,
    onVerDetalles,
    onCambiarEstado,
    changingStates = new Set(),
}) => {
    const getEstadoBadge = (estado) => {
        const styles = {
            padding: "4px 8px",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: "600",
            textAlign: "center",
            minWidth: "80px",
            display: "inline-block",
        };

        switch (estado) {
            case "Pendiente":
                return {
                    ...styles,
                    backgroundColor: "#fff3cd",
                    color: "#856404",
                    border: "1px solid #ffeaa7",
                };
            case "Aprobada":
                return {
                    ...styles,
                    backgroundColor: "#d1ecf1",
                    color: "#0c5460",
                    border: "1px solid #bee5eb",
                };
            case "En Tránsito":
                return {
                    ...styles,
                    backgroundColor: "#ffe8d1",
                    color: "#8b4000",
                    border: "1px solid #ffcc9a",
                };
            case "Completada":
                return {
                    ...styles,
                    backgroundColor: "#d4edda",
                    color: "#155724",
                    border: "1px solid #c3e6cb",
                };
            case "Rechazada":
                return {
                    ...styles,
                    backgroundColor: "#f8d7da",
                    color: "#721c24",
                    border: "1px solid #f5c6cb",
                };
            case "Cancelada":
                return {
                    ...styles,
                    backgroundColor: "#e2e3e5",
                    color: "#383d41",
                    border: "1px solid #d6d8db",
                };
            default:
                return styles;
        }
    };

    const getUrgenciaBadge = (urgencia) => {
        const baseStyles = {
            padding: "2px 6px",
            borderRadius: "8px",
            fontSize: "11px",
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
        };

        switch (urgencia) {
            case "alta":
                return {
                    ...baseStyles,
                    backgroundColor: "#ffebee",
                    color: "#c62828",
                };
            case "media":
                return {
                    ...baseStyles,
                    backgroundColor: "#fff3e0",
                    color: "#f57c00",
                };
            case "baja":
                return {
                    ...baseStyles,
                    backgroundColor: "#e8f5e8",
                    color: "#2e7d32",
                };
            default:
                return baseStyles;
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
                        Historial de Transferencias
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
                            {transferencias.length} transferencia
                            {transferencias.length !== 1 ? "s" : ""} registrada
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
                                📍 Origen
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
                                📍 Destino
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
                                🔄 Estado
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
                                📊 Status Display
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
                                🔥 Urgencia
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
                                👤 Solicitado por
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
                                        {t.fechaSolicitud}
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
                                        {t.producto}
                                    </td>
                                    <td
                                        style={{
                                            padding: "16px 12px",
                                            borderBottom: "1px solid #e9ecef",
                                            fontSize: "14px",
                                            fontWeight: "500",
                                            color: "#495057",
                                            textAlign: "center",
                                        }}
                                    >
                                        {t.cantidad}
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
                                        {t.sedeOrigen}
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
                                        {t.sedeDestino}
                                    </td>
                                    <td
                                        style={{
                                            padding: "16px 12px",
                                            borderBottom: "1px solid #e9ecef",
                                            textAlign: "center",
                                        }}
                                    >
                                        <span style={getEstadoBadge(t.estado)}>
                                            {t.estado}
                                        </span>
                                    </td>
                                    <td
                                        style={{
                                            padding: "16px 12px",
                                            borderBottom: "1px solid #e9ecef",
                                            textAlign: "center",
                                            fontSize: "14px",
                                            fontWeight: "500",
                                            color: "#495057",
                                        }}
                                    >
                                        {t.status_display || t.estado}
                                    </td>
                                    <td
                                        style={{
                                            padding: "16px 12px",
                                            textAlign: "center",
                                        }}
                                    >
                                        <span
                                            style={getUrgenciaBadge(t.urgencia)}
                                        >
                                            {t.urgencia}
                                        </span>
                                    </td>
                                    <td
                                        style={{
                                            padding: "16px 12px",
                                            fontSize: "14px",
                                            color: "#495057",
                                        }}
                                    >
                                        {t.solicitadoPor}
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
                                            <button
                                                onClick={() => onVerDetalles(t)}
                                                style={{
                                                    backgroundColor: "#e3f2fd",
                                                    color: "#1976d2",
                                                    border: "1px solid #bbdefb",
                                                    borderRadius: "6px",
                                                    padding: "6px 12px",
                                                    fontSize: "12px",
                                                    cursor: "pointer",
                                                    fontWeight: "500",
                                                    transition: "all 0.2s ease",
                                                }}
                                                onMouseOver={(e) => {
                                                    e.target.style.backgroundColor =
                                                        "#1976d2";
                                                    e.target.style.color =
                                                        "white";
                                                }}
                                                onMouseOut={(e) => {
                                                    e.target.style.backgroundColor =
                                                        "#e3f2fd";
                                                    e.target.style.color =
                                                        "#1976d2";
                                                }}
                                            >
                                                Ver Detalles
                                            </button>

                                            {t.estado === "Pendiente" && (
                                                <>
                                                    <button
                                                        onClick={() =>
                                                            onCambiarEstado(
                                                                t.id,
                                                                "Aprobada"
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
                                                                    : "#e8f5e9",
                                                            color: changingStates.has(
                                                                t.id
                                                            )
                                                                ? "#999"
                                                                : "#2e7d32",
                                                            border: changingStates.has(
                                                                t.id
                                                            )
                                                                ? "1px solid #ddd"
                                                                : "1px solid #c8e6c9",
                                                            borderRadius: "6px",
                                                            padding: "6px 12px",
                                                            fontSize: "12px",
                                                            cursor: changingStates.has(
                                                                t.id
                                                            )
                                                                ? "not-allowed"
                                                                : "pointer",
                                                            fontWeight: "500",
                                                            opacity:
                                                                changingStates.has(
                                                                    t.id
                                                                )
                                                                    ? 0.6
                                                                    : 1,
                                                        }}
                                                    >
                                                        {changingStates.has(
                                                            t.id
                                                        )
                                                            ? "⏳ Aprobando..."
                                                            : "Aprobar"}
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            onCambiarEstado(
                                                                t.id,
                                                                "Rechazada"
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
                                                            border: changingStates.has(
                                                                t.id
                                                            )
                                                                ? "1px solid #ddd"
                                                                : "1px solid #ffcdd2",
                                                            borderRadius: "6px",
                                                            padding: "6px 12px",
                                                            fontSize: "12px",
                                                            cursor: changingStates.has(
                                                                t.id
                                                            )
                                                                ? "not-allowed"
                                                                : "pointer",
                                                            fontWeight: "500",
                                                            opacity:
                                                                changingStates.has(
                                                                    t.id
                                                                )
                                                                    ? 0.6
                                                                    : 1,
                                                        }}
                                                    >
                                                        {changingStates.has(
                                                            t.id
                                                        )
                                                            ? "⏳ Rechazando..."
                                                            : "Rechazar"}
                                                    </button>
                                                </>
                                            )}

                                            {t.estado === "Aprobada" && (
                                                <button
                                                    onClick={() =>
                                                        onCambiarEstado(
                                                            t.id,
                                                            "En Tránsito"
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
                                                                : "#fff3e0",
                                                        color: changingStates.has(
                                                            t.id
                                                        )
                                                            ? "#999"
                                                            : "#f57c00",
                                                        border: changingStates.has(
                                                            t.id
                                                        )
                                                            ? "1px solid #ddd"
                                                            : "1px solid #ffcc9a",
                                                        borderRadius: "6px",
                                                        padding: "6px 12px",
                                                        fontSize: "12px",
                                                        cursor: changingStates.has(
                                                            t.id
                                                        )
                                                            ? "not-allowed"
                                                            : "pointer",
                                                        fontWeight: "500",
                                                        opacity:
                                                            changingStates.has(
                                                                t.id
                                                            )
                                                                ? 0.6
                                                                : 1,
                                                    }}
                                                >
                                                    {changingStates.has(t.id)
                                                        ? "⏳ Enviando..."
                                                        : "Marcar Enviada"}
                                                </button>
                                            )}

                                            {t.estado === "En Tránsito" && (
                                                <button
                                                    onClick={() =>
                                                        onCambiarEstado(
                                                            t.id,
                                                            "Completada"
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
                                                                : "#e8f5e9",
                                                        color: changingStates.has(
                                                            t.id
                                                        )
                                                            ? "#999"
                                                            : "#2e7d32",
                                                        border: changingStates.has(
                                                            t.id
                                                        )
                                                            ? "1px solid #ddd"
                                                            : "1px solid #c8e6c9",
                                                        borderRadius: "6px",
                                                        padding: "6px 12px",
                                                        fontSize: "12px",
                                                        cursor: changingStates.has(
                                                            t.id
                                                        )
                                                            ? "not-allowed"
                                                            : "pointer",
                                                        fontWeight: "500",
                                                        opacity:
                                                            changingStates.has(
                                                                t.id
                                                            )
                                                                ? 0.6
                                                                : 1,
                                                    }}
                                                >
                                                    {changingStates.has(t.id)
                                                        ? "⏳ Completando..."
                                                        : "Marcar Recibida"}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan="10"
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
                                            📋
                                        </span>
                                        <div>
                                            <div
                                                style={{
                                                    fontWeight: "600",
                                                    marginBottom: "8px",
                                                }}
                                            >
                                                No hay transferencias
                                                registradas
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "14px",
                                                    color: "#999",
                                                }}
                                            >
                                                Haz clic en "Nueva
                                                Transferencia" para crear tu
                                                primera transferencia
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
