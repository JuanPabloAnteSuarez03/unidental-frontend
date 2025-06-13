import React from "react";

const TransferDetailsModal = ({
    isOpen,
    onClose,
    transferencia,
    onCambiarEstado,
    changingStates = new Set(),
}) => {
    if (!isOpen || !transferencia) return null;

    const getEstadoBadge = (estado) => {
        const styles = {
            padding: "6px 12px",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: "600",
            textAlign: "center",
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

    const getUrgenciaIcon = (urgencia) => {
        switch (urgencia) {
            case "alta":
                return "🔴";
            case "media":
                return "🟡";
            case "baja":
                return "🟢";
            default:
                return "⚪";
        }
    };

    const getTipoTransferenciaInfo = (tipo) => {
        return tipo === "pull"
            ? { label: "Pull (Destino solicita a Origen)", icon: "⬅️" }
            : { label: "Push (Origen envía a Destino)", icon: "➡️" };
    };

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1000,
                backdropFilter: "blur(4px)",
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: "16px",
                    padding: "32px",
                    width: "90%",
                    maxWidth: "800px",
                    maxHeight: "90vh",
                    overflowY: "auto",
                    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
                    position: "relative",
                    margin: "20px",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header del modal */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "32px",
                        paddingBottom: "20px",
                        borderBottom: "2px solid #e9ecef",
                    }}
                >
                    <div>
                        <h2
                            style={{
                                fontSize: "28px",
                                fontWeight: "700",
                                margin: "0 0 8px 0",
                                color: "#2c3e50",
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                            }}
                        >
                            <span style={{ fontSize: "32px" }}>📦</span>
                            Transferencia #{transferencia.id}
                        </h2>
                        <p
                            style={{
                                fontSize: "16px",
                                color: "#6c757d",
                                margin: "0",
                                fontWeight: "500",
                            }}
                        >
                            Detalles completos de la transferencia
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            fontSize: "24px",
                            color: "#6c757d",
                            cursor: "pointer",
                            padding: "8px",
                            borderRadius: "8px",
                            transition: "all 0.2s ease",
                        }}
                        onMouseOver={(e) => {
                            e.target.style.backgroundColor = "#f8f9fa";
                            e.target.style.color = "#495057";
                        }}
                        onMouseOut={(e) => {
                            e.target.style.backgroundColor = "transparent";
                            e.target.style.color = "#6c757d";
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Estado y tipo de transferencia */}
                <div
                    style={{
                        display: "flex",
                        gap: "20px",
                        marginBottom: "32px",
                        flexWrap: "wrap",
                    }}
                >
                    <div style={{ flex: 1, minWidth: "200px" }}>
                        <p
                            style={{
                                margin: "0 0 8px 0",
                                fontWeight: "600",
                                color: "#495057",
                                fontSize: "14px",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                            }}
                        >
                            Estado Actual
                        </p>
                        <span style={getEstadoBadge(transferencia.estado)}>
                            {transferencia.estado}
                        </span>
                    </div>

                    <div style={{ flex: 1, minWidth: "200px" }}>
                        <p
                            style={{
                                margin: "0 0 8px 0",
                                fontWeight: "600",
                                color: "#495057",
                                fontSize: "14px",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                            }}
                        >
                            Tipo de Transferencia
                        </p>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "16px",
                                fontWeight: "500",
                                color: "#2c3e50",
                            }}
                        >
                            <span>
                                {
                                    getTipoTransferenciaInfo(
                                        transferencia.tipoTransferencia
                                    ).icon
                                }
                            </span>
                            {
                                getTipoTransferenciaInfo(
                                    transferencia.tipoTransferencia
                                ).label
                            }
                        </div>
                    </div>
                </div>

                {/* Información del producto */}
                <div
                    style={{
                        backgroundColor: "#f8f9fa",
                        borderRadius: "12px",
                        padding: "24px",
                        marginBottom: "24px",
                        border: "1px solid #e9ecef",
                    }}
                >
                    <h3
                        style={{
                            fontSize: "18px",
                            color: "#2c3e50",
                            margin: "0 0 16px 0",
                            fontWeight: "600",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        <span>📋</span>
                        Información del Producto
                    </h3>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(200px, 1fr))",
                            gap: "20px",
                        }}
                    >
                        <div>
                            <p
                                style={{
                                    margin: "0 0 5px 0",
                                    fontWeight: "600",
                                    color: "#495057",
                                    fontSize: "14px",
                                }}
                            >
                                Producto:
                            </p>
                            <p
                                style={{
                                    margin: 0,
                                    color: "#2c3e50",
                                    fontWeight: "700",
                                    fontSize: "16px",
                                }}
                            >
                                {transferencia.producto}
                            </p>
                        </div>
                        <div>
                            <p
                                style={{
                                    margin: "0 0 5px 0",
                                    fontWeight: "600",
                                    color: "#495057",
                                    fontSize: "14px",
                                }}
                            >
                                Cantidad:
                            </p>
                            <p
                                style={{
                                    margin: 0,
                                    color: "#2c3e50",
                                    fontWeight: "700",
                                    fontSize: "18px",
                                }}
                            >
                                {transferencia.cantidad} unidades
                            </p>
                        </div>
                        <div>
                            <p
                                style={{
                                    margin: "0 0 5px 0",
                                    fontWeight: "600",
                                    color: "#495057",
                                    fontSize: "14px",
                                }}
                            >
                                Urgencia:
                            </p>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    fontSize: "16px",
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                }}
                            >
                                <span>
                                    {getUrgenciaIcon(transferencia.urgencia)}
                                </span>
                                {transferencia.urgencia
                                    .charAt(0)
                                    .toUpperCase() +
                                    transferencia.urgencia.slice(1)}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Información de ubicaciones */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto 1fr",
                        gap: "20px",
                        alignItems: "center",
                        marginBottom: "24px",
                    }}
                >
                    <div
                        style={{
                            backgroundColor: "#e3f2fd",
                            borderRadius: "12px",
                            padding: "20px",
                            border: "1px solid #bbdefb",
                        }}
                    >
                        <p
                            style={{
                                margin: "0 0 8px 0",
                                fontWeight: "600",
                                color: "#1976d2",
                                fontSize: "14px",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                            }}
                        >
                            Sede Origen
                        </p>
                        <p
                            style={{
                                margin: 0,
                                color: "#1976d2",
                                fontWeight: "700",
                                fontSize: "18px",
                            }}
                        >
                            {transferencia.sedeOrigen}
                        </p>
                    </div>

                    <div
                        style={{
                            fontSize: "32px",
                            color: "#667eea",
                        }}
                    >
                        {transferencia.tipoTransferencia === "pull"
                            ? "⬅️"
                            : "➡️"}
                    </div>

                    <div
                        style={{
                            backgroundColor: "#e8f5e9",
                            borderRadius: "12px",
                            padding: "20px",
                            border: "1px solid #c8e6c9",
                        }}
                    >
                        <p
                            style={{
                                margin: "0 0 8px 0",
                                fontWeight: "600",
                                color: "#2e7d32",
                                fontSize: "14px",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                            }}
                        >
                            Sede Destino
                        </p>
                        <p
                            style={{
                                margin: 0,
                                color: "#2e7d32",
                                fontWeight: "700",
                                fontSize: "18px",
                            }}
                        >
                            {transferencia.sedeDestino}
                        </p>
                    </div>
                </div>

                {/* Información de Movimientos de Inventario */}
                {(transferencia.movementId ||
                    transferencia.inboundMovementId) && (
                    <div
                        style={{
                            backgroundColor: "#fff8e1",
                            borderRadius: "12px",
                            padding: "20px",
                            marginBottom: "24px",
                            border: "1px solid #ffcc02",
                        }}
                    >
                        <h3
                            style={{
                                fontSize: "18px",
                                color: "#2c3e50",
                                margin: "0 0 16px 0",
                                fontWeight: "600",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <span>🔄</span>
                            Movimientos de Inventario
                        </h3>

                        {transferencia.movementId && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    marginBottom: "12px",
                                    padding: "12px",
                                    backgroundColor: "#ffebee",
                                    borderRadius: "8px",
                                    border: "1px solid #ffcdd2",
                                }}
                            >
                                <span
                                    style={{
                                        backgroundColor: "#c62828",
                                        color: "white",
                                        borderRadius: "6px",
                                        padding: "4px 8px",
                                        fontSize: "12px",
                                        fontWeight: "600",
                                    }}
                                >
                                    📤 SALIDA
                                </span>
                                <div style={{ flex: 1 }}>
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            color: "#495057",
                                        }}
                                    >
                                        Origen:{" "}
                                        <strong>
                                            {transferencia.sedeOrigen}
                                        </strong>
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "12px",
                                            color: "#6c757d",
                                            fontFamily: "monospace",
                                        }}
                                    >
                                        Movement ID: {transferencia.movementId}
                                    </div>
                                </div>
                            </div>
                        )}

                        {transferencia.inboundMovementId && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    padding: "12px",
                                    backgroundColor: "#e8f5e9",
                                    borderRadius: "8px",
                                    border: "1px solid #c8e6c9",
                                }}
                            >
                                <span
                                    style={{
                                        backgroundColor: "#2e7d32",
                                        color: "white",
                                        borderRadius: "6px",
                                        padding: "4px 8px",
                                        fontSize: "12px",
                                        fontWeight: "600",
                                    }}
                                >
                                    📥 ENTRADA
                                </span>
                                <div style={{ flex: 1 }}>
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            color: "#495057",
                                        }}
                                    >
                                        Destino:{" "}
                                        <strong>
                                            {transferencia.sedeDestino}
                                        </strong>
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "12px",
                                            color: "#6c757d",
                                            fontFamily: "monospace",
                                        }}
                                    >
                                        Movement ID:{" "}
                                        {transferencia.inboundMovementId}
                                    </div>
                                </div>
                            </div>
                        )}

                        {!transferencia.inboundMovementId &&
                            transferencia.estado !== "Completada" &&
                            transferencia.movementId && (
                                <div
                                    style={{
                                        fontSize: "14px",
                                        color: "#856404",
                                        fontStyle: "italic",
                                        marginTop: "12px",
                                        padding: "12px",
                                        backgroundColor: "#fff3cd",
                                        borderRadius: "8px",
                                        border: "1px solid #ffeaa7",
                                    }}
                                >
                                    💡 <strong>Importante:</strong> La entrada
                                    se registrará automáticamente cuando se
                                    complete la transferencia. El stock
                                    aparecerá en la sede destino una vez marcada
                                    como "Completada".
                                </div>
                            )}
                    </div>
                )}

                {/* Información adicional */}
                <div
                    style={{
                        backgroundColor: "#f8f9fa",
                        borderRadius: "12px",
                        padding: "24px",
                        marginBottom: "24px",
                        border: "1px solid #e9ecef",
                    }}
                >
                    <h3
                        style={{
                            fontSize: "18px",
                            color: "#2c3e50",
                            margin: "0 0 16px 0",
                            fontWeight: "600",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        <span>ℹ️</span>
                        Información Adicional
                    </h3>
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(250px, 1fr))",
                            gap: "20px",
                        }}
                    >
                        <div>
                            <p
                                style={{
                                    margin: "0 0 5px 0",
                                    fontWeight: "600",
                                    color: "#495057",
                                    fontSize: "14px",
                                }}
                            >
                                Fecha de Solicitud:
                            </p>
                            <p
                                style={{
                                    margin: 0,
                                    color: "#2c3e50",
                                    fontSize: "16px",
                                }}
                            >
                                {transferencia.fechaSolicitud}
                            </p>
                        </div>
                        <div>
                            <p
                                style={{
                                    margin: "0 0 5px 0",
                                    fontWeight: "600",
                                    color: "#495057",
                                    fontSize: "14px",
                                }}
                            >
                                Solicitado por:
                            </p>
                            <p
                                style={{
                                    margin: 0,
                                    color: "#2c3e50",
                                    fontSize: "16px",
                                }}
                            >
                                {transferencia.solicitadoPor}
                            </p>
                        </div>
                        <div>
                            <p
                                style={{
                                    margin: "0 0 5px 0",
                                    fontWeight: "600",
                                    color: "#495057",
                                    fontSize: "14px",
                                }}
                            >
                                Última Actualización:
                            </p>
                            <p
                                style={{
                                    margin: 0,
                                    color: "#2c3e50",
                                    fontSize: "16px",
                                }}
                            >
                                {transferencia.ultimaActualizacion}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Motivo/Justificación */}
                {transferencia.motivo && (
                    <div style={{ marginBottom: "32px" }}>
                        <h3
                            style={{
                                fontSize: "18px",
                                color: "#2c3e50",
                                margin: "0 0 12px 0",
                                fontWeight: "600",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <span>💬</span>
                            Motivo/Justificación
                        </h3>
                        <div
                            style={{
                                backgroundColor: "#f8f9fa",
                                padding: "20px",
                                borderRadius: "12px",
                                color: "#2c3e50",
                                borderLeft: "4px solid #667eea",
                                fontSize: "16px",
                                lineHeight: "1.5",
                            }}
                        >
                            {transferencia.motivo}
                        </div>
                    </div>
                )}

                {/* Acciones según estado */}
                <div
                    style={{
                        marginTop: "32px",
                        display: "flex",
                        gap: "12px",
                        justifyContent: "flex-end",
                        flexWrap: "wrap",
                        paddingTop: "20px",
                        borderTop: "1px solid #e9ecef",
                    }}
                >
                    <button
                        onClick={onClose}
                        style={{
                            backgroundColor: "#6c757d",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            padding: "12px 20px",
                            fontSize: "16px",
                            cursor: "pointer",
                            fontWeight: "500",
                            transition: "all 0.2s ease",
                        }}
                        onMouseOver={(e) => {
                            e.target.style.backgroundColor = "#5a6268";
                            e.target.style.transform = "translateY(-1px)";
                        }}
                        onMouseOut={(e) => {
                            e.target.style.backgroundColor = "#6c757d";
                            e.target.style.transform = "translateY(0)";
                        }}
                    >
                        Cerrar
                    </button>

                    {transferencia.estado === "Pendiente" && (
                        <>
                            <button
                                onClick={() => {
                                    onCambiarEstado(
                                        transferencia.id,
                                        "Aprobada"
                                    );
                                    onClose();
                                }}
                                disabled={changingStates.has(transferencia.id)}
                                style={{
                                    backgroundColor: changingStates.has(
                                        transferencia.id
                                    )
                                        ? "#f5f5f5"
                                        : "#28a745",
                                    color: changingStates.has(transferencia.id)
                                        ? "#999"
                                        : "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    padding: "12px 20px",
                                    fontSize: "16px",
                                    cursor: changingStates.has(transferencia.id)
                                        ? "not-allowed"
                                        : "pointer",
                                    fontWeight: "600",
                                    transition: "all 0.2s ease",
                                    opacity: changingStates.has(
                                        transferencia.id
                                    )
                                        ? 0.6
                                        : 1,
                                }}
                                onMouseOver={(e) => {
                                    if (!changingStates.has(transferencia.id)) {
                                        e.target.style.backgroundColor =
                                            "#218838";
                                        e.target.style.transform =
                                            "translateY(-1px)";
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if (!changingStates.has(transferencia.id)) {
                                        e.target.style.backgroundColor =
                                            "#28a745";
                                        e.target.style.transform =
                                            "translateY(0)";
                                    }
                                }}
                            >
                                {changingStates.has(transferencia.id)
                                    ? "⏳ Aprobando..."
                                    : "✓ Aprobar"}
                            </button>
                            <button
                                onClick={() => {
                                    onCambiarEstado(
                                        transferencia.id,
                                        "Rechazada"
                                    );
                                    onClose();
                                }}
                                disabled={changingStates.has(transferencia.id)}
                                style={{
                                    backgroundColor: changingStates.has(
                                        transferencia.id
                                    )
                                        ? "#f5f5f5"
                                        : "#dc3545",
                                    color: changingStates.has(transferencia.id)
                                        ? "#999"
                                        : "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    padding: "12px 20px",
                                    fontSize: "16px",
                                    cursor: changingStates.has(transferencia.id)
                                        ? "not-allowed"
                                        : "pointer",
                                    fontWeight: "600",
                                    transition: "all 0.2s ease",
                                    opacity: changingStates.has(
                                        transferencia.id
                                    )
                                        ? 0.6
                                        : 1,
                                }}
                                onMouseOver={(e) => {
                                    if (!changingStates.has(transferencia.id)) {
                                        e.target.style.backgroundColor =
                                            "#c82333";
                                        e.target.style.transform =
                                            "translateY(-1px)";
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if (!changingStates.has(transferencia.id)) {
                                        e.target.style.backgroundColor =
                                            "#dc3545";
                                        e.target.style.transform =
                                            "translateY(0)";
                                    }
                                }}
                            >
                                {changingStates.has(transferencia.id)
                                    ? "⏳ Rechazando..."
                                    : "✗ Rechazar"}
                            </button>
                        </>
                    )}

                    {transferencia.estado === "Aprobada" && (
                        <button
                            onClick={() => {
                                onCambiarEstado(
                                    transferencia.id,
                                    "En Tránsito"
                                );
                                onClose();
                            }}
                            disabled={changingStates.has(transferencia.id)}
                            style={{
                                backgroundColor: changingStates.has(
                                    transferencia.id
                                )
                                    ? "#f5f5f5"
                                    : "#ffc107",
                                color: changingStates.has(transferencia.id)
                                    ? "#999"
                                    : "white",
                                border: "none",
                                borderRadius: "8px",
                                padding: "12px 20px",
                                fontSize: "16px",
                                cursor: changingStates.has(transferencia.id)
                                    ? "not-allowed"
                                    : "pointer",
                                fontWeight: "600",
                                transition: "all 0.2s ease",
                                opacity: changingStates.has(transferencia.id)
                                    ? 0.6
                                    : 1,
                            }}
                            onMouseOver={(e) => {
                                if (!changingStates.has(transferencia.id)) {
                                    e.target.style.backgroundColor = "#e0a800";
                                    e.target.style.transform =
                                        "translateY(-1px)";
                                }
                            }}
                            onMouseOut={(e) => {
                                if (!changingStates.has(transferencia.id)) {
                                    e.target.style.backgroundColor = "#ffc107";
                                    e.target.style.transform = "translateY(0)";
                                }
                            }}
                        >
                            {changingStates.has(transferencia.id)
                                ? "⏳ Enviando..."
                                : "🚚 Marcar Enviada"}
                        </button>
                    )}

                    {transferencia.estado === "En Tránsito" && (
                        <button
                            onClick={() => {
                                onCambiarEstado(transferencia.id, "Completada");
                                onClose();
                            }}
                            disabled={changingStates.has(transferencia.id)}
                            style={{
                                backgroundColor: changingStates.has(
                                    transferencia.id
                                )
                                    ? "#f5f5f5"
                                    : "#28a745",
                                color: changingStates.has(transferencia.id)
                                    ? "#999"
                                    : "white",
                                border: "none",
                                borderRadius: "8px",
                                padding: "12px 20px",
                                fontSize: "16px",
                                cursor: changingStates.has(transferencia.id)
                                    ? "not-allowed"
                                    : "pointer",
                                fontWeight: "600",
                                transition: "all 0.2s ease",
                                opacity: changingStates.has(transferencia.id)
                                    ? 0.6
                                    : 1,
                            }}
                            onMouseOver={(e) => {
                                if (!changingStates.has(transferencia.id)) {
                                    e.target.style.backgroundColor = "#218838";
                                    e.target.style.transform =
                                        "translateY(-1px)";
                                }
                            }}
                            onMouseOut={(e) => {
                                if (!changingStates.has(transferencia.id)) {
                                    e.target.style.backgroundColor = "#28a745";
                                    e.target.style.transform = "translateY(0)";
                                }
                            }}
                        >
                            {changingStates.has(transferencia.id)
                                ? "⏳ Completando..."
                                : "✅ Marcar Recibida"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TransferDetailsModal;
