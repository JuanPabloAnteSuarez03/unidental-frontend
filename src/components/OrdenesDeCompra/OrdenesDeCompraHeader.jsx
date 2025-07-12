import React from "react";

const OrdenesDeCompraHeader = ({ activeSection, setActiveSection }) => {
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
                                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
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
                            Órdenes de Compra
                        </h1>
                        <p
                            style={{
                                color: "rgba(255,255,255,0.8)",
                                margin: "8px 0 0 0",
                                fontSize: "16px",
                                fontWeight: "500",
                            }}
                        >
                            Gestiona las órdenes de compra de tu empresa
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
                    onClick={() => setActiveSection("registro")}
                    style={{
                        padding: "12px 32px",
                        borderRadius: "8px",
                        border:
                            activeSection === "registro"
                                ? "2px solid #2c3e50"
                                : "2px solid #e3eaf3",
                        background:
                            activeSection === "registro" ? "#2c3e50" : "#fff",
                        color:
                            activeSection === "registro" ? "#fff" : "#2c3e50",
                        fontWeight: 700,
                        fontSize: "16px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        boxShadow:
                            activeSection === "registro"
                                ? "0 2px 8px rgba(44,62,80,0.15)"
                                : "none",
                    }}
                >
                    Registrar Orden de Compra
                </button>
                <button
                    onClick={() => setActiveSection("otra")}
                    style={{
                        padding: "12px 32px",
                        borderRadius: "8px",
                        border:
                            activeSection === "otra"
                                ? "2px solid #2c3e50"
                                : "2px solid #e3eaf3",
                        background:
                            activeSection === "otra" ? "#2c3e50" : "#fff",
                        color: activeSection === "otra" ? "#fff" : "#2c3e50",
                        fontWeight: 700,
                        fontSize: "16px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        boxShadow:
                            activeSection === "otra"
                                ? "0 2px 8px rgba(44,62,80,0.15)"
                                : "none",
                    }}
                >
                    Órdenes de Compra Registradas
                </button>
            </div>
        </>
    );
};

export default OrdenesDeCompraHeader;
