import React from "react";

const ViewModeSelector = ({ viewMode, onViewModeChange }) => {
    return (
        <div style={{ marginBottom: 24, display: "flex", gap: 12 }}>
            <button
                onClick={() => onViewModeChange("tabla")}
                style={{
                    padding: "10px 20px",
                    borderRadius: 6,
                    border: "1px solid #1976d2",
                    background: viewMode === "tabla" ? "#1976d2" : "#f5f5f5",
                    color: viewMode === "tabla" ? "white" : "#1976d2",
                    fontWeight: "bold",
                    cursor: viewMode === "tabla" ? "default" : "pointer",
                    boxShadow:
                        viewMode === "tabla" ? "0 2px 8px #1976d233" : "none",
                    transition: "all 0.2s ease",
                }}
            >
                Ver tabla de precios
            </button>
            <button
                onClick={() => onViewModeChange("otros")}
                style={{
                    padding: "10px 20px",
                    borderRadius: 6,
                    border: "1px solid #1976d2",
                    background: viewMode === "otros" ? "#1976d2" : "#f5f5f5",
                    color: viewMode === "otros" ? "white" : "#1976d2",
                    fontWeight: "bold",
                    cursor: viewMode === "otros" ? "default" : "pointer",
                    boxShadow:
                        viewMode === "otros" ? "0 2px 8px #1976d233" : "none",
                    transition: "all 0.2s ease",
                }}
            >
                Comparar Proveedores
            </button>
        </div>
    );
};

export default ViewModeSelector;
