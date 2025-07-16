import React from "react";

const PaymentDetailModal = ({ isOpen, onClose, paymentData }) => {
    // Cerrar modal al hacer clic fuera de él
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen || !paymentData) return null;

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
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: "20px",
            }}
            onClick={handleBackdropClick}
        >
            <div
                style={{
                    background: "#fff",
                    borderRadius: "18px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                    width: "100%",
                    maxWidth: 500,
                    minWidth: 320,
                    display: "flex",
                    flexDirection: "column",
                    maxHeight: "90vh",
                }}
            >
                {/* Cabecera */}
                <div
                    style={{
                        background: "linear-gradient(135deg, #00b894 0%, #55efc4 100%)",
                        color: "white",
                        borderTopLeftRadius: "18px",
                        borderTopRightRadius: "18px",
                        padding: "20px 32px 20px 24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <h2
                        style={{
                            margin: 0,
                            fontSize: "22px",
                            fontWeight: "700",
                        }}
                    >
                        💵 Detalle de Abono #{paymentData.id}
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            color: "white",
                            fontSize: "24px",
                            cursor: "pointer",
                            padding: "8px",
                            borderRadius: "50%",
                            transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor =
                                "rgba(255, 255, 255, 0.1)";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "transparent";
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Contenido del modal */}
                <div
                    style={{
                        flex: 1,
                        overflow: "auto",
                        padding: "24px",
                    }}
                >
                    <div
                        style={{
                            backgroundColor: "#f8f9fa",
                            padding: "20px",
                            borderRadius: "12px",
                            marginBottom: "24px",
                            border: "1px solid #e9ecef",
                        }}
                    >
                        <h3
                            style={{
                                margin: "0 0 16px 0",
                                color: "#00b894",
                                fontSize: "18px",
                                fontWeight: "600",
                            }}
                        >
                            📊 Información del Abono
                        </h3>
                        <div style={{ marginBottom: 12 }}>
                            <strong style={{ color: "#495057" }}>ID:</strong> #{paymentData.id}
                        </div>
                        <div style={{ marginBottom: 12 }}>
                            <strong style={{ color: "#495057" }}>Fecha/Hora:</strong> {paymentData.payment_date ? new Date(paymentData.payment_date).toLocaleString() : paymentData.created_at ? new Date(paymentData.created_at).toLocaleString() : "-"}
                        </div>
                        <div style={{ marginBottom: 12 }}>
                            <strong style={{ color: "#495057" }}>Monto:</strong> <span style={{ color: "#00b894", fontWeight: 700 }}>${parseFloat(paymentData.amount_paid).toLocaleString()}</span>
                        </div>
                        <div style={{ marginBottom: 12 }}>
                            <strong style={{ color: "#495057" }}>Notas:</strong> {paymentData.notes || "-"}
                        </div>
                        <div style={{ marginBottom: 12 }}>
                            <strong style={{ color: "#495057" }}>Cuenta de crédito:</strong> #{paymentData.credit_account}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentDetailModal; 