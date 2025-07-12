import React from "react";

const ReportesStats = ({ onViewSalesData, onViewPurchasesData, isLoading }) => {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "20px",
                padding: "40px 20px",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
                marginBottom: "20px",
                flexWrap: "wrap",
            }}
        >
            <button
                onClick={onViewSalesData}
                disabled={isLoading}
                style={{
                    padding: "16px 32px",
                    backgroundColor: "#27ae60",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    opacity: isLoading ? 0.6 : 1,
                    fontSize: "16px",
                    fontWeight: "bold",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                    if (!isLoading) {
                        e.target.style.backgroundColor = "#219a52";
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isLoading) {
                        e.target.style.backgroundColor = "#27ae60";
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                    }
                }}
            >
                {isLoading ? "Cargando..." : "Ver Datos de Ventas"}
            </button>

            <button
                onClick={onViewPurchasesData}
                disabled={isLoading}
                style={{
                    padding: "16px 32px",
                    backgroundColor: "#e67e22",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    opacity: isLoading ? 0.6 : 1,
                    fontSize: "16px",
                    fontWeight: "bold",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                    if (!isLoading) {
                        e.target.style.backgroundColor = "#d35400";
                        e.target.style.transform = "translateY(-2px)";
                        e.target.style.boxShadow = "0 4px 8px rgba(0,0,0,0.2)";
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isLoading) {
                        e.target.style.backgroundColor = "#e67e22";
                        e.target.style.transform = "translateY(0)";
                        e.target.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
                    }
                }}
            >
                {isLoading ? "Cargando..." : "Ver Datos de Compras"}
            </button>
        </div>
    );
};

export default ReportesStats;
