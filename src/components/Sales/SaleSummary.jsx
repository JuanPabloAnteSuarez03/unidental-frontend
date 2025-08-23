import React from "react";

const SaleSummary = ({
    totals,
    shouldInvoice,
    selectedLocation,
    paymentMethod,
    onSubmit,
    isLoading,
    disabled,
    onGenerateQuote,
}) => {
    return (
        <div
            style={{
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "20px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                border: "1px solid #dee2e6",
                position: "sticky",
                top: "20px",
            }}
        >
            <h3
                style={{
                    color: "#2c3e50",
                    fontSize: "18px",
                    fontWeight: "600",
                    margin: "0 0 20px 0",
                    textAlign: "center",
                }}
            >
                Resumen de la Venta
            </h3>

            {/* Sale Details */}
            <div style={{ marginBottom: "20px" }}>
                {/* Items Count */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 0",
                        borderBottom: "1px solid #f8f9fa",
                    }}
                >
                    <span style={{ fontSize: "14px", color: "#6c757d" }}>
                        Productos:
                    </span>
                    <span
                        style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#2c3e50",
                        }}
                    >
                        {totals.itemCount}{" "}
                        {totals.itemCount === 1 ? "producto" : "productos"}
                    </span>
                </div>

                {/* Total Quantity */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 0",
                        borderBottom: "1px solid #f8f9fa",
                    }}
                >
                    <span style={{ fontSize: "14px", color: "#6c757d" }}>
                        Cantidad total:
                    </span>
                    <span
                        style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#2c3e50",
                        }}
                    >
                        {totals.totalQuantity}{" "}
                        {totals.totalQuantity === 1 ? "unidad" : "unidades"}
                    </span>
                </div>

                {/* Payment Method */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 0",
                        borderBottom: "1px solid #f8f9fa",
                    }}
                >
                    <span style={{ fontSize: "14px", color: "#6c757d" }}>
                        Método de pago:
                    </span>
                    <span
                        style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#2c3e50",
                        }}
                    >
                        {paymentMethod === "cash" && "💵 Efectivo"}
                        {paymentMethod === "card" && "💳 Tarjeta"}
                        {paymentMethod === "credit" && "📝 Crédito"}
                    </span>
                </div>

                {/* Location */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 0",
                        borderBottom: "1px solid #f8f9fa",
                    }}
                >
                    <span style={{ fontSize: "14px", color: "#6c757d" }}>
                        Sede:
                    </span>
                    <span
                        style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#2c3e50",
                        }}
                    >
                        {selectedLocation
                            ? `🏢 ${selectedLocation.name}`
                            : "❌ No seleccionada"}
                    </span>
                </div>

                {/* Invoice Required */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 0",
                    }}
                >
                    <span style={{ fontSize: "14px", color: "#6c757d" }}>
                        Factura:
                    </span>
                    <span
                        style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#2c3e50",
                        }}
                    >
                        {shouldInvoice ? "✅ Requerida" : "❌ No requerida"}
                    </span>
                </div>
            </div>

            {/* Price Breakdown */}
            <div
                style={{
                    borderTop: "2px solid #2c3e50",
                    paddingTop: "15px",
                    marginBottom: "20px",
                }}
            >
                {/* Subtotal */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 0",
                    }}
                >
                    <span style={{ fontSize: "14px", color: "#6c757d" }}>
                        Subtotal:
                    </span>
                    <span
                        style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#2c3e50",
                        }}
                    >
                        ${totals.subtotal}
                    </span>
                </div>

                {/* Tax (if applicable) */}
                {parseFloat(totals.tax) > 0 && (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "8px 0",
                        }}
                    >
                        <span style={{ fontSize: "14px", color: "#6c757d" }}>
                            Impuestos:
                        </span>
                        <span
                            style={{
                                fontSize: "14px",
                                fontWeight: "600",
                                color: "#2c3e50",
                            }}
                        >
                            ${totals.tax}
                        </span>
                    </div>
                )}

                {/* Total */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 0",
                        borderTop: "1px solid #dee2e6",
                        marginTop: "8px",
                    }}
                >
                    <span
                        style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#2c3e50",
                        }}
                    >
                        Total:
                    </span>
                    <span
                        style={{
                            fontSize: "20px",
                            fontWeight: "700",
                            color: "#3498db",
                        }}
                    >
                        ${totals.total}
                    </span>
                </div>
            </div>

            {/* Payment Method Badge */}
            <div
                style={{
                    padding: "15px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "6px",
                    marginBottom: "20px",
                    textAlign: "center",
                }}
            >
                <div style={{ fontSize: "24px", marginBottom: "8px" }}>
                    {paymentMethod === "cash"
                        ? "💵"
                        : paymentMethod === "card"
                        ? "💳"
                        : "📝"}
                </div>
                <div
                    style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#2c3e50",
                        marginBottom: "4px",
                    }}
                >
                    {paymentMethod === "cash"
                        ? "Pago en Efectivo"
                        : paymentMethod === "card"
                        ? "Pago con Tarjeta"
                        : "Pago con Crédito"}
                </div>
                {shouldInvoice && (
                    <div style={{ fontSize: "12px", color: "#3498db" }}>
                        📄 Se generará factura después del registro
                    </div>
                )}
            </div>

            {/* Quick Stats */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    marginBottom: "20px",
                }}
            >
                <div
                    style={{
                        backgroundColor: "#e8f4fd",
                        borderRadius: "6px",
                        padding: "12px",
                        textAlign: "center",
                        border: "1px solid #3498db",
                    }}
                >
                    <div
                        style={{
                            fontSize: "18px",
                            fontWeight: "700",
                            color: "#3498db",
                        }}
                    >
                        {totals.itemCount}
                    </div>
                    <div style={{ fontSize: "12px", color: "#2c3e50" }}>
                        Productos
                    </div>
                </div>
                <div
                    style={{
                        backgroundColor: "#d5edda",
                        borderRadius: "6px",
                        padding: "12px",
                        textAlign: "center",
                        border: "1px solid #27ae60",
                    }}
                >
                    <div
                        style={{
                            fontSize: "18px",
                            fontWeight: "700",
                            color: "#27ae60",
                        }}
                    >
                        {totals.totalQuantity}
                    </div>
                    <div style={{ fontSize: "12px", color: "#2c3e50" }}>
                        Unidades
                    </div>
                </div>
            </div>

            {/* Total Display - Large */}
            <div
                style={{
                    background:
                        "linear-gradient(135deg, #3498db 0%, #2c3e50 100%)",
                    borderRadius: "8px",
                    padding: "20px",
                    color: "white",
                    textAlign: "center",
                    marginBottom: "20px",
                }}
            >
                <div
                    style={{
                        fontSize: "14px",
                        opacity: "0.9",
                        marginBottom: "4px",
                    }}
                >
                    Total a Pagar
                </div>
                <div style={{ fontSize: "28px", fontWeight: "700" }}>
                    ${totals.total}
                </div>
                <div
                    style={{
                        fontSize: "12px",
                        opacity: "0.8",
                        marginTop: "4px",
                    }}
                >
                    {paymentMethod === "cash"
                        ? "Pago en efectivo"
                        : paymentMethod === "card"
                        ? "Pago con tarjeta"
                        : "Pago con crédito"}
                </div>
            </div>

            {/* Submit Button */}
            <button
                onClick={onSubmit}
                disabled={disabled || isLoading}
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "15px",
                    fontSize: "16px",
                    fontWeight: "600",
                    borderRadius: "6px",
                    border: "none",
                    cursor: disabled || isLoading ? "not-allowed" : "pointer",
                    transition: "all 0.2s ease",
                    backgroundColor:
                        disabled || isLoading ? "#95a5a6" : "#27ae60",
                    color: "white",
                    opacity: disabled || isLoading ? 0.7 : 1,
                    marginBottom: "10px",
                }}
            >
                {isLoading ? (
                    <>
                        <div
                            style={{
                                width: "20px",
                                height: "20px",
                                border: "2px solid transparent",
                                borderTop: "2px solid white",
                                borderRadius: "50%",
                                animation: "spin 1s linear infinite",
                                marginRight: "8px",
                            }}
                        ></div>
                        Procesando...
                    </>
                ) : (
                    <>✅ Registrar Venta</>
                )}
            </button>

            {/* Generate Quote Button */}
            <button
                onClick={onGenerateQuote}
                disabled={totals.itemCount === 0 || isLoading}
                style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "12px",
                    fontSize: "14px",
                    fontWeight: "600",
                    borderRadius: "6px",
                    border: "2px solid #3498db",
                    cursor:
                        totals.itemCount === 0 || isLoading
                            ? "not-allowed"
                            : "pointer",
                    transition: "all 0.2s ease",
                    backgroundColor: "white",
                    color: "#3498db",
                    opacity: totals.itemCount === 0 || isLoading ? 0.7 : 1,
                }}
            >
                📋 Generar Cotización
            </button>

            {/* Help Text */}
            <div
                style={{
                    fontSize: "12px",
                    color: "#6c757d",
                    textAlign: "center",
                    marginTop: "12px",
                }}
            >
                {totals.itemCount === 0
                    ? "Agregue productos para generar cotización"
                    : disabled
                    ? !selectedLocation
                        ? "Seleccione una sede y complete los datos para registrar la venta"
                        : "Complete todos los datos para registrar la venta"
                    : "Verifique todos los datos antes de registrar la venta"}
            </div>

            {/* CSS for spinner animation */}
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default SaleSummary;
