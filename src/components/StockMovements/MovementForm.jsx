import React, { useState } from "react";
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
    batchesData,
    handleBatchesChange,
    handleAddBatch,
    handleRemoveBatch,
}) => {
    // Estado local para controlar la visibilidad del botón de agregar lote
    const [showAddBatchButton, setShowAddBatchButton] = useState(true);

    return (
        <div
            style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                padding: "32px",
                boxShadow:
                    "0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)",
                width: "100%",
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
                {/* Primera fila: Producto y Ubicación */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr",
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

                    {/* Selector de Ubicación */}
                    <div
                        style={{
                            backgroundColor: "#f8f9fa",
                            padding: "20px",
                            borderRadius: "8px",
                            border: "1px solid #e9ecef",
                        }}
                    >
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
                </div>

                {/* Segunda fila: Tipo de Movimiento y Cantidad */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "24px",
                    }}
                >
                    {/* Tipo de Movimiento */}
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
                            Tipo de Movimiento{" "}
                            <span style={{ color: "#dc3545" }}>*</span>
                        </label>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "row",
                                gap: "16px",
                                justifyContent: "space-around",
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
                                        flex: "1",
                                        justifyContent: "center",
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

                    {/* Cantidad */}
                    <div
                        style={{
                            backgroundColor: "#f8f9fa",
                            padding: "20px",
                            borderRadius: "8px",
                            border: "1px solid #e9ecef",
                        }}
                    >
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
                </div>

                {/* Tercera fila: Sección de Lotes (solo para movimientos de entrada) y Notas */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            formData.movementType === "in" ? "3fr 2fr" : "1fr",
                        gap: "24px",
                    }}
                >
                    {/* Sección de Lotes (solo para movimientos de entrada) */}
                    {formData.movementType === "in" && (
                        <div
                            style={{
                                backgroundColor: "#f0f9ff",
                                padding: "20px",
                                borderRadius: "8px",
                                border: "1px solid #90caf9",
                            }}
                        >
                            <div style={{ marginBottom: "16px" }}>
                                <h3
                                    style={{
                                        fontSize: "18px",
                                        fontWeight: "600",
                                        margin: "0 0 8px 0",
                                        color: "#0d47a1",
                                    }}
                                >
                                    Información de Lotes
                                </h3>
                                <p
                                    style={{
                                        fontSize: "14px",
                                        color: "#1565c0",
                                        margin: "0",
                                    }}
                                >
                                    Especifique los lotes y fechas de
                                    vencimiento para este movimiento de entrada
                                </p>
                            </div>

                            {/* Lista de lotes */}
                            <div
                                style={{
                                    maxHeight: "300px",
                                    overflowY: "auto",
                                }}
                            >
                                {batchesData.map((batch, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            backgroundColor: "#fff",
                                            padding: "16px",
                                            borderRadius: "8px",
                                            border: "1px solid #bbdefb",
                                            marginBottom: "16px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                marginBottom: "12px",
                                            }}
                                        >
                                            <h4
                                                style={{
                                                    fontSize: "16px",
                                                    fontWeight: "600",
                                                    margin: "0",
                                                    color: "#0d47a1",
                                                }}
                                            >
                                                Lote #{index + 1}
                                            </h4>
                                            {index > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleRemoveBatch(index)
                                                    }
                                                    style={{
                                                        background: "none",
                                                        border: "none",
                                                        color: "#dc3545",
                                                        cursor: "pointer",
                                                        fontSize: "14px",
                                                        fontWeight: "500",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "4px",
                                                    }}
                                                >
                                                    <span>❌</span> Eliminar
                                                </button>
                                            )}
                                        </div>

                                        <div
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns: "1fr 1fr",
                                                gap: "16px",
                                                marginBottom: "12px",
                                            }}
                                        >
                                            {/* Número de lote */}
                                            <div>
                                                <label
                                                    htmlFor={`batch_number_${index}`}
                                                    style={{
                                                        display: "block",
                                                        marginBottom: "6px",
                                                        fontWeight: "600",
                                                        color: "#2c3e50",
                                                        fontSize: "14px",
                                                    }}
                                                >
                                                    Número de Lote{" "}
                                                    <span
                                                        style={{
                                                            color: "#dc3545",
                                                        }}
                                                    >
                                                        *
                                                    </span>
                                                </label>
                                                <input
                                                    type="text"
                                                    id={`batch_number_${index}`}
                                                    value={batch.batch_number}
                                                    onChange={(e) =>
                                                        handleBatchesChange(
                                                            index,
                                                            "batch_number",
                                                            e.target.value
                                                        )
                                                    }
                                                    style={{
                                                        width: "100%",
                                                        padding: "12px 14px",
                                                        borderRadius: "8px",
                                                        border: "2px solid #e9ecef",
                                                        fontSize: "14px",
                                                        fontWeight: "500",
                                                        color: "#495057",
                                                        transition:
                                                            "all 0.2s ease",
                                                        outline: "none",
                                                        boxSizing: "border-box",
                                                    }}
                                                    placeholder="Ej: LOT2024001"
                                                    required
                                                />
                                            </div>

                                            {/* Fecha de vencimiento */}
                                            <div>
                                                <label
                                                    htmlFor={`expiry_date_${index}`}
                                                    style={{
                                                        display: "block",
                                                        marginBottom: "6px",
                                                        fontWeight: "600",
                                                        color: "#2c3e50",
                                                        fontSize: "14px",
                                                    }}
                                                >
                                                    Fecha de Vencimiento{" "}
                                                    <span
                                                        style={{
                                                            color: "#dc3545",
                                                        }}
                                                    >
                                                        *
                                                    </span>
                                                </label>
                                                <input
                                                    type="date"
                                                    id={`expiry_date_${index}`}
                                                    value={batch.expiry_date}
                                                    onChange={(e) =>
                                                        handleBatchesChange(
                                                            index,
                                                            "expiry_date",
                                                            e.target.value
                                                        )
                                                    }
                                                    style={{
                                                        width: "100%",
                                                        padding: "12px 14px",
                                                        borderRadius: "8px",
                                                        border: "2px solid #e9ecef",
                                                        fontSize: "14px",
                                                        fontWeight: "500",
                                                        color: "#495057",
                                                        transition:
                                                            "all 0.2s ease",
                                                        outline: "none",
                                                        boxSizing: "border-box",
                                                    }}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns: "1fr 1fr",
                                                gap: "16px",
                                            }}
                                        >
                                            {/* Fecha de fabricación (opcional) */}
                                            <div>
                                                <label
                                                    htmlFor={`manufacturing_date_${index}`}
                                                    style={{
                                                        display: "block",
                                                        marginBottom: "6px",
                                                        fontWeight: "600",
                                                        color: "#2c3e50",
                                                        fontSize: "14px",
                                                    }}
                                                >
                                                    Fecha de Fabricación{" "}
                                                    <span
                                                        style={{
                                                            color: "#6c757d",
                                                            fontWeight: "400",
                                                            fontSize: "12px",
                                                        }}
                                                    >
                                                        (opcional)
                                                    </span>
                                                </label>
                                                <input
                                                    type="date"
                                                    id={`manufacturing_date_${index}`}
                                                    value={
                                                        batch.manufacturing_date ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        handleBatchesChange(
                                                            index,
                                                            "manufacturing_date",
                                                            e.target.value
                                                        )
                                                    }
                                                    style={{
                                                        width: "100%",
                                                        padding: "12px 14px",
                                                        borderRadius: "8px",
                                                        border: "2px solid #e9ecef",
                                                        fontSize: "14px",
                                                        fontWeight: "500",
                                                        color: "#495057",
                                                        transition:
                                                            "all 0.2s ease",
                                                        outline: "none",
                                                        boxSizing: "border-box",
                                                    }}
                                                />
                                            </div>

                                            {/* Referencia del proveedor (opcional) */}
                                            <div>
                                                <label
                                                    htmlFor={`supplier_reference_${index}`}
                                                    style={{
                                                        display: "block",
                                                        marginBottom: "6px",
                                                        fontWeight: "600",
                                                        color: "#2c3e50",
                                                        fontSize: "14px",
                                                    }}
                                                >
                                                    Referencia del Proveedor{" "}
                                                    <span
                                                        style={{
                                                            color: "#6c757d",
                                                            fontWeight: "400",
                                                            fontSize: "12px",
                                                        }}
                                                    >
                                                        (opcional)
                                                    </span>
                                                </label>
                                                <input
                                                    type="text"
                                                    id={`supplier_reference_${index}`}
                                                    value={
                                                        batch.supplier_reference ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        handleBatchesChange(
                                                            index,
                                                            "supplier_reference",
                                                            e.target.value
                                                        )
                                                    }
                                                    style={{
                                                        width: "100%",
                                                        padding: "12px 14px",
                                                        borderRadius: "8px",
                                                        border: "2px solid #e9ecef",
                                                        fontSize: "14px",
                                                        fontWeight: "500",
                                                        color: "#495057",
                                                        transition:
                                                            "all 0.2s ease",
                                                        outline: "none",
                                                        boxSizing: "border-box",
                                                    }}
                                                    placeholder="Ej: PROV-REF-001"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Botón para agregar más lotes */}
                            {showAddBatchButton && (
                                <button
                                    type="button"
                                    onClick={handleAddBatch}
                                    style={{
                                        background: "none",
                                        border: "2px dashed #90caf9",
                                        borderRadius: "8px",
                                        padding: "12px 16px",
                                        width: "100%",
                                        color: "#1565c0",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        gap: "8px",
                                        transition: "all 0.2s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor =
                                            "#e3f2fd";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor =
                                            "transparent";
                                    }}
                                >
                                    <span style={{ fontSize: "18px" }}>+</span>{" "}
                                    Agregar Otro Lote
                                </button>
                            )}
                        </div>
                    )}

                    {/* Notas */}
                    <div
                        style={{
                            backgroundColor: "#f8f9fa",
                            padding: "20px",
                            borderRadius: "8px",
                            border: "1px solid #e9ecef",
                        }}
                    >
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
                                minHeight:
                                    formData.movementType === "in"
                                        ? "200px"
                                        : "100px",
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
