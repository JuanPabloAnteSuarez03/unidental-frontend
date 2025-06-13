import React from "react";

const TransferHeader = ({ totalCount }) => {
    return (
        <div
            style={{
                backgroundColor: "#fff",
                borderRadius: "16px",
                padding: "32px",
                marginBottom: "32px",
                boxShadow:
                    "0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)",
                border: "1px solid #e9ecef",
                background: "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
                color: "white",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Elementos decorativos de fondo */}
            <div
                style={{
                    position: "absolute",
                    top: "-50px",
                    right: "-50px",
                    width: "150px",
                    height: "150px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                }}
            ></div>
            <div
                style={{
                    position: "absolute",
                    bottom: "-30px",
                    left: "-30px",
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                }}
            ></div>

            <div style={{ position: "relative", zIndex: 1 }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        marginBottom: "16px",
                    }}
                >
                    <div
                        style={{
                            backgroundColor: "rgba(255, 255, 255, 0.15)",
                            borderRadius: "12px",
                            padding: "16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <span style={{ fontSize: "32px" }}>🔄</span>
                    </div>
                    <div>
                        <h1
                            style={{
                                fontSize: "32px",
                                fontWeight: "700",
                                margin: "0 0 8px 0",
                                color: "white",
                                letterSpacing: "-0.5px",
                                textShadow: "0 2px 4px rgba(0,0,0,0.2)",
                            }}
                        >
                            Gestión de Transferencias Internas
                        </h1>
                        <p
                            style={{
                                fontSize: "18px",
                                margin: "0",
                                color: "rgba(255, 255, 255, 0.9)",
                                fontWeight: "400",
                            }}
                        >
                            Administra las transferencias de stock entre
                            ubicaciones
                        </p>
                    </div>
                </div>

                {/* Estadística de transferencias */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                    }}
                >
                    <div
                        style={{
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                            borderRadius: "8px",
                            padding: "12px 16px",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        <span style={{ fontSize: "16px" }}>📊</span>
                        <span
                            style={{
                                color: "white",
                                fontSize: "14px",
                                fontWeight: "500",
                            }}
                        >
                            Total: {totalCount || 0} transferencias
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TransferHeader;
