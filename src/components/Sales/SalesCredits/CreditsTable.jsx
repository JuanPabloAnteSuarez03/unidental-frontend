import React from "react";

const CreditsTable = ({
    credits,
    loading,
    error,
    onRowClick,
    selectedCredit,
    closeModal,
    showPaymentInput,
    setShowPaymentInput,
    paymentAmount,
    setPaymentAmount,
    paymentLoading,
    paymentError,
    paymentSuccess,
    handlePayment,
    formatCOP,
    renderSaleDetails,
}) => {
    return (
        <>
            {loading ? (
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
                        Cargando cuentas de crédito...
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
            ) : error ? (
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
                        {error}
                    </span>
                </div>
            ) : (
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
                            minWidth: "1200px",
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
                                    👤 Cliente
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
                                    📞 Teléfono
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
                                    📧 Email
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
                                    💰 Monto Original
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
                                    ⚖️ Saldo Pendiente
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
                                    💳 Pagado
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
                                    📅 Fecha de Inicio
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
                                    ⏰ Fecha de Vencimiento
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
                                    🏷️ Estado
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {credits.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={10}
                                        style={{
                                            textAlign: "center",
                                            padding: "60px 40px",
                                            color: "#6c757d",
                                            fontSize: "16px",
                                            fontWeight: "500",
                                        }}
                                    >
                                        <div style={{ marginBottom: "16px" }}>
                                            <span
                                                style={{
                                                    fontSize: "48px",
                                                    opacity: 0.5,
                                                }}
                                            >
                                                💳
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
                                            No hay cuentas de crédito
                                            registradas
                                        </h3>
                                        <p
                                            style={{
                                                color: "#6c757d",
                                                fontSize: "14px",
                                                margin: "0",
                                                opacity: 0.8,
                                            }}
                                        >
                                            Las cuentas de crédito aparecerán
                                            aquí una vez que se registren
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                credits.map((credit, index) => (
                                    <tr
                                        key={credit.id}
                                        style={{
                                            cursor: "pointer",
                                            backgroundColor:
                                                index % 2 === 0
                                                    ? "#fff"
                                                    : "#f8f9fa",
                                            transition:
                                                "background-color 0.2s ease",
                                        }}
                                        onClick={() => onRowClick(credit)}
                                        onMouseEnter={(e) => {
                                            e.target.closest(
                                                "tr"
                                            ).style.backgroundColor = "#e3f2fd";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.target.closest(
                                                "tr"
                                            ).style.backgroundColor =
                                                index % 2 === 0
                                                    ? "#fff"
                                                    : "#f8f9fa";
                                        }}
                                    >
                                        <td
                                            style={{
                                                padding: "16px 12px",
                                                borderBottom:
                                                    "1px solid #e9ecef",
                                                fontSize: "14px",
                                                fontWeight: "600",
                                                color: "#2c3e50",
                                                fontFamily: "monospace",
                                            }}
                                        >
                                            {credit.id}
                                        </td>
                                        <td
                                            style={{
                                                padding: "16px 12px",
                                                borderBottom:
                                                    "1px solid #e9ecef",
                                                fontSize: "14px",
                                                fontWeight: "600",
                                                color: "#2c3e50",
                                            }}
                                        >
                                            {credit.customer_name ||
                                                credit.customer_details?.name ||
                                                credit.sale_details
                                                    ?.customer_details?.name ||
                                                "-"}
                                        </td>
                                        <td
                                            style={{
                                                padding: "16px 12px",
                                                borderBottom:
                                                    "1px solid #e9ecef",
                                                fontSize: "14px",
                                                fontWeight: "500",
                                                color: "#495057",
                                                fontFamily: "monospace",
                                            }}
                                        >
                                            {credit.customer_phone ||
                                                credit.customer_details
                                                    ?.phone ||
                                                credit.sale_details
                                                    ?.customer_details?.phone ||
                                                "-"}
                                        </td>
                                        <td
                                            style={{
                                                padding: "16px 12px",
                                                borderBottom:
                                                    "1px solid #e9ecef",
                                                fontSize: "14px",
                                                fontWeight: "500",
                                                color: "#495057",
                                            }}
                                        >
                                            {credit.customer_email ||
                                                credit.customer_details
                                                    ?.email ||
                                                credit.sale_details
                                                    ?.customer_details?.email ||
                                                "-"}
                                        </td>
                                        <td
                                            style={{
                                                padding: "16px 12px",
                                                borderBottom:
                                                    "1px solid #e9ecef",
                                                textAlign: "center",
                                                fontSize: "16px",
                                                fontWeight: "700",
                                                color: "#2c3e50",
                                            }}
                                        >
                                            {formatCOP(credit.original_amount)}
                                        </td>
                                        <td
                                            style={{
                                                padding: "16px 12px",
                                                borderBottom:
                                                    "1px solid #e9ecef",
                                                textAlign: "center",
                                                fontSize: "16px",
                                                fontWeight: "700",
                                                color: "#e74c3c",
                                            }}
                                        >
                                            {formatCOP(credit.remaining_amount)}
                                        </td>
                                        <td
                                            style={{
                                                padding: "16px 12px",
                                                borderBottom:
                                                    "1px solid #e9ecef",
                                                textAlign: "center",
                                                fontSize: "16px",
                                                fontWeight: "700",
                                                color: "#27ae60",
                                            }}
                                        >
                                            {formatCOP(credit.total_paid)}
                                        </td>
                                        <td
                                            style={{
                                                padding: "16px 12px",
                                                borderBottom:
                                                    "1px solid #e9ecef",
                                                textAlign: "center",
                                                fontSize: "14px",
                                                fontWeight: "500",
                                                color: "#495057",
                                            }}
                                        >
                                            {credit.start_date
                                                ? new Date(
                                                      credit.start_date
                                                  ).toLocaleDateString()
                                                : "-"}
                                        </td>
                                        <td
                                            style={{
                                                padding: "16px 12px",
                                                borderBottom:
                                                    "1px solid #e9ecef",
                                                textAlign: "center",
                                                fontSize: "14px",
                                                fontWeight: "500",
                                                color: "#495057",
                                            }}
                                        >
                                            {credit.due_date
                                                ? new Date(
                                                      credit.due_date
                                                  ).toLocaleDateString()
                                                : "-"}
                                        </td>
                                        <td
                                            style={{
                                                padding: "16px 12px",
                                                borderBottom:
                                                    "1px solid #e9ecef",
                                                textAlign: "center",
                                            }}
                                        >
                                            {credit.is_fully_paid ? (
                                                <span
                                                    style={{
                                                        display: "inline-block",
                                                        padding: "6px 12px",
                                                        borderRadius: "20px",
                                                        fontSize: "12px",
                                                        fontWeight: "600",
                                                        textTransform:
                                                            "uppercase",
                                                        letterSpacing: "0.5px",
                                                        backgroundColor:
                                                            "#d4edda",
                                                        color: "#155724",
                                                        border: "2px solid #c3e6cb",
                                                    }}
                                                >
                                                    ✅ Pagado
                                                </span>
                                            ) : credit.is_overdue ? (
                                                <span
                                                    style={{
                                                        display: "inline-block",
                                                        padding: "6px 12px",
                                                        borderRadius: "20px",
                                                        fontSize: "12px",
                                                        fontWeight: "600",
                                                        textTransform:
                                                            "uppercase",
                                                        letterSpacing: "0.5px",
                                                        backgroundColor:
                                                            "#f8d7da",
                                                        color: "#721c24",
                                                        border: "2px solid #f5c6cb",
                                                    }}
                                                >
                                                    ⚠️ Vencido
                                                </span>
                                            ) : (
                                                <span
                                                    style={{
                                                        display: "inline-block",
                                                        padding: "6px 12px",
                                                        borderRadius: "20px",
                                                        fontSize: "12px",
                                                        fontWeight: "600",
                                                        textTransform:
                                                            "uppercase",
                                                        letterSpacing: "0.5px",
                                                        backgroundColor:
                                                            "#fff3cd",
                                                        color: "#856404",
                                                        border: "2px solid #ffeaa7",
                                                    }}
                                                >
                                                    ⏳ Pendiente
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
            {/* Modal de detalles de la venta */}
            {selectedCredit && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        background: "rgba(0,0,0,0.5)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 1000,
                        animation: "fadeIn 0.3s ease-out",
                    }}
                    onClick={closeModal}
                >
                    <div
                        style={{
                            background: "#fff",
                            borderRadius: "16px",
                            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                            minWidth: "600px",
                            maxWidth: "95vw",
                            maxHeight: "90vh",
                            overflowY: "auto",
                            position: "relative",
                            animation: "slideIn 0.3s ease-out",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header del modal */}
                        <div
                            style={{
                                background:
                                    "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
                                color: "white",
                                padding: "24px 32px 20px 32px",
                                borderRadius: "16px 16px 0 0",
                                position: "relative",
                            }}
                        >
                            <button
                                onClick={closeModal}
                                style={{
                                    position: "absolute",
                                    top: "16px",
                                    right: "16px",
                                    background: "rgba(255,255,255,0.2)",
                                    border: "none",
                                    borderRadius: "50%",
                                    width: "32px",
                                    height: "32px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.2s ease",
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background =
                                        "rgba(255,255,255,0.3)";
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background =
                                        "rgba(255,255,255,0.2)";
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: "18px",
                                        fontWeight: "bold",
                                    }}
                                >
                                    ×
                                </span>
                            </button>
                            <h2
                                style={{
                                    margin: 0,
                                    fontSize: "24px",
                                    fontWeight: "700",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                }}
                            >
                                💳 Detalles del Crédito #{selectedCredit.id}
                            </h2>
                            <p
                                style={{
                                    margin: "8px 0 0 0",
                                    fontSize: "16px",
                                    opacity: 0.9,
                                    fontWeight: "500",
                                }}
                            >
                                Información completa de la cuenta de crédito
                            </p>
                        </div>

                        {/* Contenido del modal */}
                        <div style={{ padding: "32px" }}>
                            {renderSaleDetails(selectedCredit)}
                        </div>

                        <style>
                            {`
                                @keyframes fadeIn {
                                    from { opacity: 0; }
                                    to { opacity: 1; }
                                }
                                @keyframes slideIn {
                                    from { 
                                        opacity: 0;
                                        transform: translateY(-20px) scale(0.95);
                                    }
                                    to { 
                                        opacity: 1;
                                        transform: translateY(0) scale(1);
                                    }
                                }
                            `}
                        </style>
                    </div>
                </div>
            )}
        </>
    );
};

export default CreditsTable;
