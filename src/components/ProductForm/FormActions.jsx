import React from "react";

const FormActions = ({ isSubmitting, navigate }) => {
    return (
        <div
            style={{
                marginTop: "40px",
                borderTop: "1px solid #e9ecef",
                paddingTop: "30px",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "20px",
                }}
            >
                <div
                    style={{
                        background:
                            "linear-gradient(135deg, #6c757d 0%, #495057 100%)",
                        width: "40px",
                        height: "40px",
                        borderRadius: "10px",
                        marginRight: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    }}
                >
                    <span style={{ color: "white", fontSize: "24px" }}>💾</span>
                </div>
                <div>
                    <h4
                        style={{
                            color: "#2c3e50",
                            fontSize: "18px",
                            fontWeight: "600",
                            margin: 0,
                            letterSpacing: "-0.3px",
                        }}
                    >
                        Finalizar Registro
                    </h4>
                    <p
                        style={{
                            color: "#6c757d",
                            fontSize: "14px",
                            margin: "4px 0 0 0",
                        }}
                    >
                        Revisa la información y guarda el producto
                    </p>
                </div>
            </div>

            <div
                style={{
                    display: "flex",
                    gap: "12px",
                    justifyContent: "flex-end",
                    flexWrap: "wrap",
                }}
            >
                <button
                    type="button"
                    onClick={() => navigate("/inventario")}
                    disabled={isSubmitting}
                    style={{
                        padding: "12px 24px",
                        borderRadius: "8px",
                        border: "2px solid #6c757d",
                        backgroundColor: "transparent",
                        color: "#6c757d",
                        fontSize: "16px",
                        fontWeight: "500",
                        cursor: isSubmitting ? "not-allowed" : "pointer",
                        transition: "all 0.2s ease",
                        minWidth: "120px",
                        opacity: isSubmitting ? 0.6 : 1,
                    }}
                    onMouseOver={(e) => {
                        if (!isSubmitting) {
                            e.target.style.backgroundColor = "#6c757d";
                            e.target.style.color = "white";
                        }
                    }}
                    onMouseOut={(e) => {
                        if (!isSubmitting) {
                            e.target.style.backgroundColor = "transparent";
                            e.target.style.color = "#6c757d";
                        }
                    }}
                >
                    Cancelar
                </button>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                        padding: "12px 24px",
                        borderRadius: "8px",
                        border: "none",
                        background: isSubmitting
                            ? "linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)"
                            : "linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)",
                        color: "white",
                        fontSize: "16px",
                        fontWeight: "600",
                        cursor: isSubmitting ? "not-allowed" : "pointer",
                        transition: "all 0.2s ease",
                        minWidth: "140px",
                        position: "relative",
                        boxShadow: isSubmitting
                            ? "none"
                            : "0 4px 12px rgba(39, 174, 96, 0.3)",
                    }}
                    onMouseOver={(e) => {
                        if (!isSubmitting) {
                            e.target.style.transform = "translateY(-1px)";
                            e.target.style.boxShadow =
                                "0 6px 16px rgba(39, 174, 96, 0.4)";
                        }
                    }}
                    onMouseOut={(e) => {
                        if (!isSubmitting) {
                            e.target.style.transform = "translateY(0)";
                            e.target.style.boxShadow =
                                "0 4px 12px rgba(39, 174, 96, 0.3)";
                        }
                    }}
                >
                    {isSubmitting ? (
                        <span
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <span
                                style={{
                                    display: "inline-block",
                                    width: "16px",
                                    height: "16px",
                                    border: "2px solid transparent",
                                    borderTop: "2px solid white",
                                    borderRadius: "50%",
                                    animation: "spin 1s linear infinite",
                                }}
                            ></span>
                            Creando...
                        </span>
                    ) : (
                        "Crear Producto"
                    )}
                </button>
            </div>

            {/* CSS para la animación del spinner */}
            <style>
                {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
            </style>
        </div>
    );
};

export default FormActions;
