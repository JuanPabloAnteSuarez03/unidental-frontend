import React from "react";
import AlertasHeader from "../components/Alertas/AlertasHeader";
import AlertasStyles from "../components/Alertas/AlertasStyles";

const AlertasBajoStockPage = () => {
    return (
        <div className="alertas-page">
            <AlertasStyles />
            <AlertasHeader title="Alertas por Bajo Stock" />

            <div
                className="content-container"
                style={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    padding: "20px",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                    marginTop: "20px",
                }}
            >
                <h1
                    style={{
                        fontSize: "1.8rem",
                        color: "#333",
                        marginBottom: "20px",
                        borderBottom: "1px solid #eee",
                        paddingBottom: "10px",
                    }}
                >
                    Alertas por Bajo Stock
                </h1>

                <p
                    style={{
                        fontSize: "1.1rem",
                        color: "#666",
                        marginBottom: "20px",
                    }}
                >
                    Esta sección mostrará productos que están por debajo del
                    nivel mínimo de inventario.
                </p>

                <div
                    style={{
                        backgroundColor: "#f9f9f9",
                        padding: "15px",
                        borderRadius: "4px",
                        border: "1px dashed #ccc",
                        marginTop: "20px",
                    }}
                >
                    <p style={{ fontStyle: "italic", color: "#888" }}>
                        Próximamente: Monitoreo de niveles de inventario y
                        alertas automáticas cuando los productos alcancen su
                        nivel mínimo definido.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AlertasBajoStockPage;
