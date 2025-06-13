import React from "react";
import ProductSearchSelector from "../Common/ProductSearchSelector";

const MovementForm = ({
    formData,
    handleInputChange,
    handleSubmit,
    selectedProduct,
    handleProductSelected,
    handleProductSelectionCleared,
    locations,
    isLoadingLocations,
}) => {
    return (
        <div
            style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                padding: "32px",
                boxShadow:
                    "0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)",
                maxWidth: "900px",
                margin: "0 auto",
                border: "1px solid #e9ecef",
            }}
        >
            <div style={{ marginBottom: "32px", textAlign: "center" }}>
                <h2
                    style={{
                        fontSize: "24px",
                        fontWeight: "600",
                        margin: "0 0 8px 0",
                        color: "#2c3e50",
                        letterSpacing: "-0.5px",
                    }}
                >
                    Registrar Nuevo Movimiento
                </h2>
                <p
                    style={{
                        fontSize: "16px",
                        color: "#6c757d",
                        margin: "0",
                        fontWeight: "400",
                    }}
                >
                    Complete los campos para registrar un movimiento de
                    inventario
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                }}
            >
                {/* Selector de Producto */}
                <div
                    style={{
                        backgroundColor: "#f8f9fa",
                        padding: "20px",
                        borderRadius: "8px",
                        border: "1px solid #e9ecef",
                    }}
                >
                    <label
                        style={{
                            display: "block",
                            marginBottom: "8px",
                            fontWeight: "600",
                            color: "#2c3e50",
                            fontSize: "16px",
                        }}
                    >
                        Producto <span style={{ color: "#dc3545" }}>*</span>
                    </label>
                    <ProductSearchSelector
                        onProductSelected={handleProductSelected}
                        onSelectionCleared={handleProductSelectionCleared}
                        placeholder="Buscar producto por nombre, SKU o código..."
                        initialProduct={selectedProduct}
                    />
                </div>

                {/* Grid para Ubicación y Tipo de Movimiento */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "24px",
                    }}
                >
                    {/* Selector de Ubicación */}
                    <div>
                        <label
                            htmlFor="location"
                            style={{
                                display: "block",
                                marginBottom: "8px",
                                fontWeight: "600",
                                color: "#2c3e50",
                                fontSize: "16px",
                            }}
                        >
                            Ubicación{" "}
                            <span style={{ color: "#dc3545" }}>*</span>
                        </label>
                        <select
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            disabled={isLoadingLocations}
                            style={{
                                width: "100%",
                                padding: "14px 16px",
                                borderRadius: "8px",
                                border: "2px solid #e9ecef",
                                fontSize: "16px",
                                backgroundColor: isLoadingLocations
                                    ? "#f8f9fa"
                                    : "#fff",
                                color: "#495057",
                                transition: "all 0.2s ease",
                                outline: "none",
                                fontWeight: "500",
                                cursor: isLoadingLocations
                                    ? "not-allowed"
                                    : "pointer",
                                boxSizing: "border-box",
                            }}
                            required
                            onFocus={(e) => {
                                e.currentTarget.style.borderColor = "#2c3e50";
                                e.currentTarget.style.boxShadow =
                                    "0 0 0 3px rgba(44, 62, 80, 0.1)";
                            }}
                            onBlur={(e) => {
                                e.currentTarget.style.borderColor = "#e9ecef";
                                e.currentTarget.style.boxShadow = "none";
                            }}
                        >
                            <option value="">
                                {isLoadingLocations
                                    ? "Cargando ubicaciones..."
                                    : "Seleccionar ubicación"}
                            </option>
                            {locations.map((location) => (
                                <option
                                    key={location.id || location.name}
                                    value={location.id || location.name}
                                >
                                    {location.name || location}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Tipo de Movimiento */}
                    <div>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "8px",
                                fontWeight: "600",
                                color: "#2c3e50",
                                fontSize: "16px",
                            }}
                        >
                            Tipo de Movimiento{" "}
                            <span style={{ color: "#dc3545" }}>*</span>
                        </label>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "8px",
                            }}
                        >
                            {[
                                {
                                    value: "in",
                                    label: "Entrada",
                                    color: "#28a745",
                                    bgColor: "#d4edda",
                                },
                                {
                                    value: "out",
                                    label: "Salida",
                                    color: "#fd7e14",
                                    bgColor: "#ffeaa7",
                                },
                            ].map((type) => (
                                <label
                                    key={type.value}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        padding: "12px 16px",
                                        border: `2px solid ${
                                            formData.movementType === type.value
                                                ? type.color
                                                : "#e9ecef"
                                        }`,
                                        borderRadius: "8px",
                                        backgroundColor:
                                            formData.movementType === type.value
                                                ? type.bgColor
                                                : "#fff",
                                        cursor: "pointer",
                                        transition: "all 0.2s ease",
                                        fontWeight: "500",
                                        color:
                                            formData.movementType === type.value
                                                ? type.color
                                                : "#495057",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (
                                            formData.movementType !== type.value
                                        ) {
                                            e.currentTarget.style.borderColor =
                                                "#ced4da";
                                            e.currentTarget.style.backgroundColor =
                                                "#f8f9fa";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (
                                            formData.movementType !== type.value
                                        ) {
                                            e.currentTarget.style.borderColor =
                                                "#e9ecef";
                                            e.currentTarget.style.backgroundColor =
                                                "#fff";
                                        }
                                    }}
                                >
                                    <input
                                        type="radio"
                                        name="movementType"
                                        value={type.value}
                                        checked={
                                            formData.movementType === type.value
                                        }
                                        onChange={handleInputChange}
                                        style={{
                                            marginRight: "12px",
                                            transform: "scale(1.2)",
                                            accentColor: type.color,
                                        }}
                                        required
                                    />
                                    {type.label}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Cantidad y Fecha de Vencimiento */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            formData.movementType === "out"
                                ? "1fr 1fr"
                                : "1fr 1fr",
                        gap: "24px",
                        backgroundColor: "#f8f9fa",
                        padding: "20px",
                        borderRadius: "8px",
                        border: "1px solid #e9ecef",
                    }}
                >
                    <div>
                        <label
                            htmlFor="quantity"
                            style={{
                                display: "block",
                                marginBottom: "8px",
                                fontWeight: "600",
                                color: "#2c3e50",
                                fontSize: "16px",
                            }}
                        >
                            Cantidad <span style={{ color: "#dc3545" }}>*</span>
                        </label>
                        <div style={{ position: "relative" }}>
                            <input
                                type="number"
                                id="quantity"
                                name="quantity"
                                value={formData.quantity}
                                onChange={handleInputChange}
                                min="1"
                                style={{
                                    width: "100%",
                                    padding: "14px 16px",
                                    paddingRight: "60px",
                                    boxSizing: "border-box",
                                    borderRadius: "8px",
                                    border: "2px solid #e9ecef",
                                    fontSize: "16px",
                                    fontWeight: "500",
                                    color: "#495057",
                                    transition: "all 0.2s ease",
                                    outline: "none",
                                }}
                                placeholder="0"
                                required
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor =
                                        "#2c3e50";
                                    e.currentTarget.style.boxShadow =
                                        "0 0 0 3px rgba(44, 62, 80, 0.1)";
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor =
                                        "#e9ecef";
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            />
                            <span
                                style={{
                                    position: "absolute",
                                    right: "16px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "#6c757d",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    backgroundColor: "#e9ecef",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    pointerEvents: "none",
                                }}
                            >
                                und
                            </span>
                        </div>
                    </div>

                    {formData.movementType !== "out" ? (
                        <div>
                            <label
                                htmlFor="expiryDate"
                                style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                    fontSize: "16px",
                                }}
                            >
                                Fecha de Vencimiento{" "}
                                <span style={{ color: "#dc3545" }}>*</span>
                            </label>
                            <input
                                type="date"
                                id="expiryDate"
                                name="expiryDate"
                                value={formData.expiryDate}
                                onChange={handleInputChange}
                                style={{
                                    width: "100%",
                                    padding: "14px 16px",
                                    borderRadius: "8px",
                                    border: "2px solid #e9ecef",
                                    fontSize: "16px",
                                    fontWeight: "500",
                                    color: "#495057",
                                    transition: "all 0.2s ease",
                                    outline: "none",
                                    boxSizing: "border-box",
                                }}
                                required
                                onFocus={(e) => {
                                    e.currentTarget.style.borderColor =
                                        "#2c3e50";
                                    e.currentTarget.style.boxShadow =
                                        "0 0 0 3px rgba(44, 62, 80, 0.1)";
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.borderColor =
                                        "#e9ecef";
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            />
                        </div>
                    ) : (
                        <div>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontWeight: "600",
                                    color: "#6c757d",
                                    fontSize: "16px",
                                }}
                            >
                                Fecha de Vencimiento
                            </label>
                            <div
                                style={{
                                    padding: "14px 16px",
                                    borderRadius: "8px",
                                    backgroundColor: "#e3f2fd",
                                    border: "2px solid #90caf9",
                                    color: "#1565c0",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    boxSizing: "border-box",
                                    minHeight: "52px",
                                }}
                            >
                                <span style={{ fontSize: "18px" }}>ℹ️</span>
                                Los movimientos de salida no requieren fecha de
                                vencimiento
                            </div>
                        </div>
                    )}
                </div>

                {/* Notas */}
                <div>
                    <label
                        htmlFor="notes"
                        style={{
                            display: "block",
                            marginBottom: "8px",
                            fontWeight: "600",
                            color: "#2c3e50",
                            fontSize: "16px",
                        }}
                    >
                        Notas/Motivo{" "}
                        <span
                            style={{
                                color: "#6c757d",
                                fontWeight: "400",
                                fontSize: "14px",
                            }}
                        >
                            (opcional)
                        </span>
                    </label>
                    <textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows="4"
                        style={{
                            width: "100%",
                            padding: "14px 16px",
                            borderRadius: "8px",
                            border: "2px solid #e9ecef",
                            fontSize: "16px",
                            fontWeight: "400",
                            color: "#495057",
                            resize: "vertical",
                            minHeight: "100px",
                            transition: "all 0.2s ease",
                            outline: "none",
                            fontFamily: "inherit",
                            boxSizing: "border-box",
                        }}
                        placeholder="Ingrese notas adicionales o el motivo del movimiento..."
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = "#2c3e50";
                            e.currentTarget.style.boxShadow =
                                "0 0 0 3px rgba(44, 62, 80, 0.1)";
                        }}
                        onBlur={(e) => {
                            e.currentTarget.style.borderColor = "#e9ecef";
                            e.currentTarget.style.boxShadow = "none";
                        }}
                    />
                </div>

                {/* Botón de envío */}
                <div style={{ textAlign: "center", paddingTop: "8px" }}>
                    <button
                        type="submit"
                        style={{
                            background:
                                "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
                            color: "white",
                            border: "none",
                            borderRadius: "12px",
                            padding: "16px 48px",
                            fontSize: "16px",
                            cursor: "pointer",
                            fontWeight: "600",
                            minWidth: "240px",
                            boxShadow: "0 4px 12px rgba(44, 62, 80, 0.3)",
                            transition: "all 0.3s ease",
                            letterSpacing: "0.5px",
                            textTransform: "uppercase",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform =
                                "translateY(-2px)";
                            e.currentTarget.style.boxShadow =
                                "0 6px 20px rgba(44, 62, 80, 0.4)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow =
                                "0 4px 12px rgba(44, 62, 80, 0.3)";
                        }}
                        onMouseDown={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                        }}
                        onMouseUp={(e) => {
                            e.currentTarget.style.transform =
                                "translateY(-2px)";
                        }}
                    >
                        ✓ Registrar Movimiento
                    </button>
                </div>
            </form>
        </div>
    );
};

export default MovementForm;
