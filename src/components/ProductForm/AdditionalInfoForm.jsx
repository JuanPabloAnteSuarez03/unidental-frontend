import React from "react";

const AdditionalInfoForm = ({
    formData,
    handleInputChange,
    calculateMargin,
}) => {
    return (
        <div style={{ marginBottom: "40px" }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "24px",
                    padding: "16px 20px",
                    background:
                        "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
                    borderRadius: "12px",
                    color: "white",
                }}
            >
                <div
                    style={{
                        background: "rgba(255, 255, 255, 0.2)",
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
                    <span
                        style={{
                            color: "white",
                            fontSize: "24px",
                        }}
                    >
                        📋
                    </span>
                </div>
                <div>
                    <h3
                        style={{
                            color: "white",
                            fontSize: "20px",
                            fontWeight: "600",
                            margin: 0,
                            letterSpacing: "-0.3px",
                        }}
                    >
                        Información Adicional
                    </h3>
                    <p
                        style={{
                            color: "rgba(255, 255, 255, 0.9)",
                            fontSize: "14px",
                            margin: "4px 0 0 0",
                        }}
                    >
                        Detalles opcionales y configuración de precios
                    </p>
                </div>
            </div>

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: "20px",
                }}
            >
                {/* Sección de Precios */}
                <div style={{ marginTop: "30px" }}>
                    <h4
                        style={{
                            color: "#2c3e50",
                            fontSize: "16px",
                            fontWeight: "600",
                            marginBottom: "15px",
                            display: "flex",
                            alignItems: "center",
                        }}
                    >
                        <span
                            style={{
                                display: "inline-block",
                                width: "3px",
                                height: "16px",
                                backgroundColor: "#10b981",
                                marginRight: "8px",
                                borderRadius: "2px",
                            }}
                        />
                        Configuración de Precios
                    </h4>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 150px",
                            gap: "20px",
                            alignItems: "end",
                        }}
                    >
                        {/* Precio de Compra */}
                        <div>
                            <label
                                htmlFor="purchase_price"
                                style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                    fontSize: "14px",
                                    letterSpacing: "0.3px",
                                    textTransform: "uppercase",
                                    position: "relative",
                                    paddingLeft: "12px",
                                }}
                            >
                                <span
                                    style={{
                                        position: "absolute",
                                        left: "0",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        width: "3px",
                                        height: "14px",
                                        backgroundColor: "#10b981",
                                        borderRadius: "2px",
                                    }}
                                ></span>
                                💰 Precio de Compra *
                            </label>
                            <input
                                type="number"
                                id="purchase_price"
                                name="purchase_price"
                                value={formData.purchase_price}
                                onChange={handleInputChange}
                                required
                                step="0.01"
                                min="0"
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "4px",
                                    border: "1px solid #ced4da",
                                    fontSize: "16px",
                                    boxSizing: "border-box",
                                }}
                                placeholder="0.00"
                            />
                        </div>

                        {/* Precio de Venta */}
                        <div>
                            <label
                                htmlFor="sale_price"
                                style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                    fontSize: "14px",
                                    letterSpacing: "0.3px",
                                    textTransform: "uppercase",
                                    position: "relative",
                                    paddingLeft: "12px",
                                }}
                            >
                                <span
                                    style={{
                                        position: "absolute",
                                        left: "0",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        width: "3px",
                                        height: "14px",
                                        backgroundColor: "#10b981",
                                        borderRadius: "2px",
                                    }}
                                ></span>
                                💵 Precio de Venta *
                            </label>
                            <input
                                type="number"
                                id="sale_price"
                                name="sale_price"
                                value={formData.sale_price}
                                onChange={handleInputChange}
                                required
                                step="0.01"
                                min="0"
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "4px",
                                    border: "1px solid #ced4da",
                                    fontSize: "16px",
                                    boxSizing: "border-box",
                                }}
                                placeholder="0.00"
                            />
                        </div>

                        {/* Margen */}
                        <div>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                    fontSize: "14px",
                                    letterSpacing: "0.3px",
                                    textTransform: "uppercase",
                                    position: "relative",
                                    paddingLeft: "12px",
                                }}
                            >
                                <span
                                    style={{
                                        position: "absolute",
                                        left: "0",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        width: "3px",
                                        height: "14px",
                                        backgroundColor: "#10b981",
                                        borderRadius: "2px",
                                    }}
                                ></span>
                                📈 Margen %
                            </label>
                            <input
                                type="text"
                                value={
                                    formData.margin ? `${formData.margin}%` : ""
                                }
                                readOnly
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "4px",
                                    border: "1px solid #e9ecef",
                                    fontSize: "16px",
                                    boxSizing: "border-box",
                                    backgroundColor: "#f8f9fa",
                                    color: formData.margin
                                        ? "#28a745"
                                        : "#6c757d",
                                    fontWeight: "600",
                                    textAlign: "center",
                                }}
                                placeholder="Auto"
                            />
                        </div>
                    </div>

                    {/* Información del margen */}
                    {formData.purchase_price && formData.sale_price && (
                        <div
                            style={{
                                marginTop: "10px",
                                padding: "8px 12px",
                                backgroundColor: "#e8f5e9",
                                borderRadius: "4px",
                                fontSize: "14px",
                                color: "#2e7d32",
                            }}
                        >
                            💡 Margen calculado automáticamente:{" "}
                            {calculateMargin()}%
                        </div>
                    )}
                </div>

                {/* Descripción */}
                <div style={{ marginTop: "30px" }}>
                    <label
                        htmlFor="description"
                        style={{
                            display: "block",
                            marginBottom: "8px",
                            fontWeight: "600",
                            color: "#2c3e50",
                            fontSize: "14px",
                            letterSpacing: "0.3px",
                            textTransform: "uppercase",
                            position: "relative",
                            paddingLeft: "12px",
                        }}
                    >
                        <span
                            style={{
                                position: "absolute",
                                left: "0",
                                top: "50%",
                                transform: "translateY(-50%)",
                                width: "3px",
                                height: "14px",
                                backgroundColor: "#10b981",
                                borderRadius: "2px",
                            }}
                        ></span>
                        📝 Descripción del Producto
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="4"
                        style={{
                            width: "100%",
                            padding: "10px",
                            borderRadius: "4px",
                            border: "1px solid #ced4da",
                            fontSize: "16px",
                            boxSizing: "border-box",
                            resize: "vertical",
                            transition:
                                "border-color 0.2s ease, box-shadow 0.2s ease",
                            outline: "none",
                            fontFamily: "inherit",
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = "#80bdff";
                            e.target.style.boxShadow =
                                "0 0 0 0.2rem rgba(0,123,255,.25)";
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = "#ced4da";
                            e.target.style.boxShadow = "none";
                        }}
                        placeholder="Ingrese una descripción detallada del producto, información adicional, etc."
                    />
                </div>
            </div>
        </div>
    );
};

export default AdditionalInfoForm;
