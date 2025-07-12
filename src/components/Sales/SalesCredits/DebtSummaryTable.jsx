import React from "react";

const DebtSummaryTable = ({
    data,
    loading,
    error,
    formatCOP,
    onClientClick,
}) => {
    if (loading)
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
                    Cargando resumen de deuda...
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
    if (error)
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
                    {error}
                </span>
            </div>
        );
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
                    minWidth: "800px",
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
                            👤 Cliente
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
                            💰 Total Deuda
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
                            ✅ Créditos Activos
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
                            ⚠️ Créditos Vencidos
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td
                                colSpan={4}
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
                                        💰
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
                                    No hay deudas registradas
                                </h3>
                                <p
                                    style={{
                                        color: "#6c757d",
                                        fontSize: "14px",
                                        margin: "0",
                                        opacity: 0.8,
                                    }}
                                >
                                    Las deudas por cliente aparecerán aquí una
                                    vez que se registren
                                </p>
                            </td>
                        </tr>
                    ) : (
                        data.map((row, index) => (
                            <tr
                                key={row.customer_id || row.customer_name}
                                style={{
                                    cursor: onClientClick
                                        ? "pointer"
                                        : "default",
                                    backgroundColor:
                                        index % 2 === 0 ? "#fff" : "#f8f9fa",
                                    transition: "background-color 0.2s ease",
                                }}
                                onClick={() =>
                                    onClientClick && onClientClick(row)
                                }
                                onMouseEnter={(e) => {
                                    if (onClientClick) {
                                        e.target.closest(
                                            "tr"
                                        ).style.backgroundColor = "#e3f2fd";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (onClientClick) {
                                        e.target.closest(
                                            "tr"
                                        ).style.backgroundColor =
                                            index % 2 === 0
                                                ? "#fff"
                                                : "#f8f9fa";
                                    }
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
                                    {row.customer_name || "-"}
                                </td>
                                <td
                                    style={{
                                        padding: "16px 12px",
                                        borderBottom: "1px solid #e9ecef",
                                        textAlign: "center",
                                        fontSize: "16px",
                                        fontWeight: "700",
                                        color: "#e74c3c",
                                    }}
                                >
                                    {formatCOP(row.total_debt)}
                                </td>
                                <td
                                    style={{
                                        padding: "16px 12px",
                                        borderBottom: "1px solid #e9ecef",
                                        textAlign: "center",
                                        fontSize: "16px",
                                        fontWeight: "700",
                                        color: "#27ae60",
                                    }}
                                >
                                    {row.active_credits_count ?? "-"}
                                </td>
                                <td
                                    style={{
                                        padding: "16px 12px",
                                        borderBottom: "1px solid #e9ecef",
                                        textAlign: "center",
                                        fontSize: "16px",
                                        fontWeight: "700",
                                        color: "#f39c12",
                                    }}
                                >
                                    {row.overdue_credits_count ?? "-"}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default DebtSummaryTable;
