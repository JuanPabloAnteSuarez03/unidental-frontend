import React from "react";

const SalesDataDisplay = ({ onClose }) => {
    // Función para formatear cantidad de dinero
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
        }).format(amount);
    };

    // Datos específicos proporcionados
    const salesData = {
        totalSales: 34,
        totalNet: 33369349.4,
        totalGross: 33369349.4,
        invoicedSales: 23,
        normalSales: 17,
        creditSales: 0,
        wholesaleSales: 17,
        nonInvoicedSales: 11,
    };

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
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1000,
            }}
        >
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: "12px",
                    padding: "32px",
                    maxWidth: "600px",
                    width: "90%",
                    maxHeight: "80vh",
                    overflow: "auto",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "24px",
                        borderBottom: "2px solid #f0f0f0",
                        paddingBottom: "16px",
                    }}
                >
                    <h2
                        style={{
                            margin: 0,
                            color: "#2c3e50",
                            fontSize: "24px",
                            fontWeight: "bold",
                        }}
                    >
                        Datos de Ventas
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            fontSize: "24px",
                            cursor: "pointer",
                            color: "#666",
                            padding: "4px",
                            borderRadius: "4px",
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "#f0f0f0";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "transparent";
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Datos de ventas */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(250px, 1fr))",
                        gap: "20px",
                    }}
                >
                    {/* Total Ventas */}
                    <div
                        style={{
                            padding: "20px",
                            backgroundColor: "#27ae60",
                            color: "white",
                            borderRadius: "8px",
                            textAlign: "center",
                            boxShadow: "0 2px 8px rgba(39, 174, 96, 0.3)",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "32px",
                                fontWeight: "bold",
                                marginBottom: "8px",
                            }}
                        >
                            {salesData.totalSales}
                        </div>
                        <div style={{ fontSize: "16px", opacity: 0.9 }}>
                            Total Ventas
                        </div>
                    </div>

                    {/* Total Neto */}
                    <div
                        style={{
                            padding: "20px",
                            backgroundColor: "#3498db",
                            color: "white",
                            borderRadius: "8px",
                            textAlign: "center",
                            boxShadow: "0 2px 8px rgba(52, 152, 219, 0.3)",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "24px",
                                fontWeight: "bold",
                                marginBottom: "8px",
                            }}
                        >
                            {formatCurrency(salesData.totalNet)}
                        </div>
                        <div style={{ fontSize: "16px", opacity: 0.9 }}>
                            Total Neto
                        </div>
                    </div>

                    {/* Total Bruto */}
                    <div
                        style={{
                            padding: "20px",
                            backgroundColor: "#e67e22",
                            color: "white",
                            borderRadius: "8px",
                            textAlign: "center",
                            boxShadow: "0 2px 8px rgba(230, 126, 34, 0.3)",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "24px",
                                fontWeight: "bold",
                                marginBottom: "8px",
                            }}
                        >
                            {formatCurrency(salesData.totalGross)}
                        </div>
                        <div style={{ fontSize: "16px", opacity: 0.9 }}>
                            Total Bruto
                        </div>
                    </div>

                    {/* Ventas Facturadas */}
                    <div
                        style={{
                            padding: "20px",
                            backgroundColor: "#9b59b6",
                            color: "white",
                            borderRadius: "8px",
                            textAlign: "center",
                            boxShadow: "0 2px 8px rgba(155, 89, 182, 0.3)",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "32px",
                                fontWeight: "bold",
                                marginBottom: "8px",
                            }}
                        >
                            {salesData.invoicedSales}
                        </div>
                        <div style={{ fontSize: "16px", opacity: 0.9 }}>
                            Ventas Facturadas
                        </div>
                    </div>

                    {/* Ventas Normales */}
                    <div
                        style={{
                            padding: "20px",
                            backgroundColor: "#f39c12",
                            color: "white",
                            borderRadius: "8px",
                            textAlign: "center",
                            boxShadow: "0 2px 8px rgba(243, 156, 18, 0.3)",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "32px",
                                fontWeight: "bold",
                                marginBottom: "8px",
                            }}
                        >
                            {salesData.normalSales}
                        </div>
                        <div style={{ fontSize: "16px", opacity: 0.9 }}>
                            Ventas Normales
                        </div>
                    </div>

                    {/* Ventas a Crédito */}
                    <div
                        style={{
                            padding: "20px",
                            backgroundColor: "#e74c3c",
                            color: "white",
                            borderRadius: "8px",
                            textAlign: "center",
                            boxShadow: "0 2px 8px rgba(231, 76, 60, 0.3)",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "32px",
                                fontWeight: "bold",
                                marginBottom: "8px",
                            }}
                        >
                            {salesData.creditSales}
                        </div>
                        <div style={{ fontSize: "16px", opacity: 0.9 }}>
                            Ventas a Crédito
                        </div>
                    </div>

                    {/* Ventas al Por Mayor */}
                    <div
                        style={{
                            padding: "20px",
                            backgroundColor: "#1abc9c",
                            color: "white",
                            borderRadius: "8px",
                            textAlign: "center",
                            boxShadow: "0 2px 8px rgba(26, 188, 156, 0.3)",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "32px",
                                fontWeight: "bold",
                                marginBottom: "8px",
                            }}
                        >
                            {salesData.wholesaleSales}
                        </div>
                        <div style={{ fontSize: "16px", opacity: 0.9 }}>
                            Ventas al Por Mayor
                        </div>
                    </div>

                    {/* Sin Facturar */}
                    <div
                        style={{
                            padding: "20px",
                            backgroundColor: "#34495e",
                            color: "white",
                            borderRadius: "8px",
                            textAlign: "center",
                            boxShadow: "0 2px 8px rgba(52, 73, 94, 0.3)",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "32px",
                                fontWeight: "bold",
                                marginBottom: "8px",
                            }}
                        >
                            {salesData.nonInvoicedSales}
                        </div>
                        <div style={{ fontSize: "16px", opacity: 0.9 }}>
                            Sin Facturar
                        </div>
                    </div>
                </div>

                {/* Botón de cerrar */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        marginTop: "24px",
                        paddingTop: "16px",
                        borderTop: "1px solid #f0f0f0",
                    }}
                >
                    <button
                        onClick={onClose}
                        style={{
                            padding: "12px 24px",
                            backgroundColor: "#95a5a6",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "bold",
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "#7f8c8d";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "#95a5a6";
                        }}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SalesDataDisplay;
