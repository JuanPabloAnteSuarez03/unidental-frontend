import React from "react";

const ReportesHeader = ({ activeSection, setActiveSection }) => {
    return (
        <>
            {/* Header Banner */}
            <div
                style={{
                    background:
                        "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
                    borderRadius: "12px",
                    padding: "32px",
                    marginBottom: "32px",
                    boxShadow: "0 4px 16px rgba(44,62,80,0.15)",
                    border: "1px solid #2c3e50",
                    color: "white",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                    }}
                >
                    <div
                        style={{
                            width: "56px",
                            height: "56px",
                            backgroundColor: "rgba(255,255,255,0.2)",
                            borderRadius: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backdropFilter: "blur(10px)",
                        }}
                    >
                        <svg
                            width="28"
                            height="28"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{ color: "white" }}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                            />
                        </svg>
                    </div>
                    <div>
                        <h1
                            style={{
                                fontSize: "32px",
                                fontWeight: "800",
                                color: "white",
                                margin: "0",
                                letterSpacing: "-0.5px",
                            }}
                        >
                            Reportes
                        </h1>
                        <p
                            style={{
                                color: "rgba(255,255,255,0.8)",
                                margin: "8px 0 0 0",
                                fontSize: "16px",
                                fontWeight: "500",
                            }}
                        >
                            Análisis detallado de ventas y compras
                        </p>
                    </div>
                </div>
            </div>

            {/* Barra de navegación de secciones */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "16px",
                    marginBottom: "32px",
                }}
            >
                <button
                    onClick={() => setActiveSection("ventas")}
                    style={{
                        padding: "12px 32px",
                        borderRadius: "8px",
                        border:
                            activeSection === "ventas"
                                ? "2px solid #2c3e50"
                                : "2px solid #e3eaf3",
                        background:
                            activeSection === "ventas" ? "#2c3e50" : "#fff",
                        color: activeSection === "ventas" ? "#fff" : "#2c3e50",
                        fontWeight: 700,
                        fontSize: "16px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        boxShadow:
                            activeSection === "ventas"
                                ? "0 2px 8px rgba(44,62,80,0.15)"
                                : "none",
                    }}
                >
                    Reporte de Ventas
                </button>
                <button
                    onClick={() => setActiveSection("compras")}
                    style={{
                        padding: "12px 32px",
                        borderRadius: "8px",
                        border:
                            activeSection === "compras"
                                ? "2px solid #2c3e50"
                                : "2px solid #e3eaf3",
                        background:
                            activeSection === "compras" ? "#2c3e50" : "#fff",
                        color: activeSection === "compras" ? "#fff" : "#2c3e50",
                        fontWeight: 700,
                        fontSize: "16px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        boxShadow:
                            activeSection === "compras"
                                ? "0 2px 8px rgba(44,62,80,0.15)"
                                : "none",
                    }}
                >
                    Reporte de Compras
                </button>
            </div>
        </>
    );
};

export default ReportesHeader;
