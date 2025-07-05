import React from "react";

const SalesCreditsHeader = ({ section, setSection }) => (
    <>
        <div style={{ marginBottom: 24, display: "flex", gap: 12 }}>
            <button
                onClick={() => setSection("creditos")}
                style={{
                    padding: "12px 24px",
                    borderRadius: 8,
                    border: "1px solid #1976d2",
                    background: section === "creditos" ? "#1976d2" : "#f5f5f5",
                    color: section === "creditos" ? "white" : "#1976d2",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: section === "creditos" ? "default" : "pointer",
                    boxShadow:
                        section === "creditos" ? "0 2px 8px #1976d233" : "none",
                    transition: "all 0.2s ease",
                    minWidth: "120px",
                }}
                onMouseEnter={(e) => {
                    if (section !== "creditos") {
                        e.target.style.background = "#e3f2fd";
                        e.target.style.borderColor = "#1976d2";
                    }
                }}
                onMouseLeave={(e) => {
                    if (section !== "creditos") {
                        e.target.style.background = "#f5f5f5";
                        e.target.style.borderColor = "#1976d2";
                    }
                }}
            >
                💳 Créditos
            </button>
            <button
                onClick={() => setSection("otra")}
                style={{
                    padding: "12px 24px",
                    borderRadius: 8,
                    border: "1px solid #1976d2",
                    background: section === "otra" ? "#1976d2" : "#f5f5f5",
                    color: section === "otra" ? "white" : "#1976d2",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: section === "otra" ? "default" : "pointer",
                    boxShadow:
                        section === "otra" ? "0 2px 8px #1976d233" : "none",
                    transition: "all 0.2s ease",
                    minWidth: "120px",
                }}
                onMouseEnter={(e) => {
                    if (section !== "otra") {
                        e.target.style.background = "#e3f2fd";
                        e.target.style.borderColor = "#1976d2";
                    }
                }}
                onMouseLeave={(e) => {
                    if (section !== "otra") {
                        e.target.style.background = "#f5f5f5";
                        e.target.style.borderColor = "#1976d2";
                    }
                }}
            >
                📊 Resumen de Deuda
            </button>
        </div>
    </>
);

export default SalesCreditsHeader;
