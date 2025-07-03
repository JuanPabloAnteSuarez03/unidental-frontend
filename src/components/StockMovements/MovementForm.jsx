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
    requiresBatchControl,
    // Nuevos props para lotes disponibles en movimientos de salida
    availableBatches = [],
    selectedBatches = [],
    isLoadingBatches = false,
    showBatchSection = false,
    handleBatchQuantityChange = () => {},
    handleSelectCompleteBatch = () => {},
    getTotalSelectedQuantity = () => 0,
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

                {/* Segunda fila: Tipo de Movimiento y Campos Condicionales */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: selectedProduct
                            ? "1fr 1fr"
                            : "1fr",
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
                                gap: "12px",
                                flexDirection: "column",
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

                    {/* Campos Condicionales: Solo aparecen cuando hay un producto seleccionado */}
                    {selectedProduct && (
                        <div
                            style={{
                                backgroundColor: "#f8f9fa",
                                padding: "20px",
                                borderRadius: "8px",
                                border: "1px solid #e9ecef",
                            }}
                        >
                            {!requiresBatchControl ? (
                                // Para productos SIN control de lotes
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
                                        Cantidad{" "}
                                        <span style={{ color: "#dc3545" }}>
                                            *
                                        </span>
                                    </label>
                                    <div
                                        style={{
                                            position: "relative",
                                            marginBottom: "16px",
                                        }}
                                    >
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
                                                e.currentTarget.style.boxShadow =
                                                    "none";
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

                                    {/* Campo de fecha de vencimiento opcional para productos sin lotes */}
                                    {formData.movementType === "in" && (
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
                                            <input
                                                type="date"
                                                id="expiryDate"
                                                name="expiryDate"
                                                value={formData.expiryDate}
                                                onChange={handleInputChange}
                                                style={{
                                                    width: "100%",
                                                    padding: "14px 16px",
                                                    boxSizing: "border-box",
                                                    borderRadius: "8px",
                                                    border: "2px solid #e9ecef",
                                                    fontSize: "16px",
                                                    fontWeight: "500",
                                                    color: "#495057",
                                                    transition: "all 0.2s ease",
                                                    outline: "none",
                                                }}
                                                onFocus={(e) => {
                                                    e.currentTarget.style.borderColor =
                                                        "#2c3e50";
                                                    e.currentTarget.style.boxShadow =
                                                        "0 0 0 3px rgba(44, 62, 80, 0.1)";
                                                }}
                                                onBlur={(e) => {
                                                    e.currentTarget.style.borderColor =
                                                        "#e9ecef";
                                                    e.currentTarget.style.boxShadow =
                                                        "none";
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // Para productos CON control de lotes
                                <div>
                                    <div
                                        style={{
                                            padding: "12px",
                                            backgroundColor: "#e8f5e8",
                                            border: "2px solid #28a745",
                                            borderRadius: "8px",
                                            textAlign: "center",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "16px",
                                                fontWeight: "600",
                                                color: "#28a745",
                                                marginBottom: "4px",
                                            }}
                                        >
                                            🏷️ Producto con Control de Lotes
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "14px",
                                                color: "#155724",
                                            }}
                                        >
                                            Configure los lotes y cantidades en
                                            la sección inferior
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Tercera fila: Sección de Lotes (solo para productos con control de lotes) y Notas */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            formData.movementType === "in" &&
                            requiresBatchControl
                                ? "3fr 2fr"
                                : "1fr",
                        gap: "24px",
                    }}
                >
                    {/* Sección de Lotes (solo para movimientos de entrada con control de lotes) */}
                    {formData.movementType === "in" && requiresBatchControl && (
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
                                    Especifique los lotes, fechas de vencimiento
                                    y cantidades para cada lote
                                </p>
                            </div>

                            {/* Lista de lotes */}
                            <div
                                style={{
                                    maxHeight: "400px",
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
                                                gridTemplateColumns:
                                                    "1fr 1fr 1fr",
                                                gap: "16px",
                                                marginBottom: "12px",
                                            }}
                                        >
                                            {/* Número de Lote */}
                                            <div>
                                                <label
                                                    style={{
                                                        display: "block",
                                                        marginBottom: "4px",
                                                        fontSize: "12px",
                                                        fontWeight: "600",
                                                        color: "#0d47a1",
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
                                                    value={batch.batch_number}
                                                    onChange={(e) =>
                                                        handleBatchesChange(
                                                            index,
                                                            "batch_number",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Ej: LT-001"
                                                    style={{
                                                        width: "100%",
                                                        padding: "8px 10px",
                                                        border: "1px solid #ccc",
                                                        borderRadius: "4px",
                                                        fontSize: "14px",
                                                        boxSizing: "border-box",
                                                    }}
                                                    required
                                                />
                                            </div>

                                            {/* Fecha de Vencimiento */}
                                            <div>
                                                <label
                                                    style={{
                                                        display: "block",
                                                        marginBottom: "4px",
                                                        fontSize: "12px",
                                                        fontWeight: "600",
                                                        color: "#0d47a1",
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
                                                        padding: "8px 10px",
                                                        border: "1px solid #ccc",
                                                        borderRadius: "4px",
                                                        fontSize: "14px",
                                                        boxSizing: "border-box",
                                                    }}
                                                    required
                                                />
                                            </div>

                                            {/* Cantidad del Lote */}
                                            <div>
                                                <label
                                                    style={{
                                                        display: "block",
                                                        marginBottom: "4px",
                                                        fontSize: "12px",
                                                        fontWeight: "600",
                                                        color: "#0d47a1",
                                                    }}
                                                >
                                                    Cantidad{" "}
                                                    <span
                                                        style={{
                                                            color: "#dc3545",
                                                        }}
                                                    >
                                                        *
                                                    </span>
                                                </label>
                                                <div
                                                    style={{
                                                        position: "relative",
                                                    }}
                                                >
                                                    <input
                                                        type="number"
                                                        value={batch.quantity}
                                                        onChange={(e) =>
                                                            handleBatchesChange(
                                                                index,
                                                                "quantity",
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="0"
                                                        min="1"
                                                        style={{
                                                            width: "100%",
                                                            padding:
                                                                "8px 30px 8px 10px",
                                                            border: "1px solid #ccc",
                                                            borderRadius: "4px",
                                                            fontSize: "14px",
                                                            boxSizing:
                                                                "border-box",
                                                        }}
                                                        required
                                                    />
                                                    <span
                                                        style={{
                                                            position:
                                                                "absolute",
                                                            right: "8px",
                                                            top: "50%",
                                                            transform:
                                                                "translateY(-50%)",
                                                            color: "#6c757d",
                                                            fontSize: "12px",
                                                            pointerEvents:
                                                                "none",
                                                        }}
                                                    >
                                                        und
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Campos opcionales */}
                                        <div
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns: "1fr 1fr",
                                                gap: "16px",
                                            }}
                                        >
                                            {/* Fecha de Fabricación */}
                                            <div>
                                                <label
                                                    style={{
                                                        display: "block",
                                                        marginBottom: "4px",
                                                        fontSize: "12px",
                                                        fontWeight: "600",
                                                        color: "#6c757d",
                                                    }}
                                                >
                                                    Fecha de Fabricación
                                                    (opcional)
                                                </label>
                                                <input
                                                    type="date"
                                                    value={
                                                        batch.manufacturing_date
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
                                                        padding: "8px 10px",
                                                        border: "1px solid #ccc",
                                                        borderRadius: "4px",
                                                        fontSize: "14px",
                                                        boxSizing: "border-box",
                                                    }}
                                                />
                                            </div>

                                            {/* Referencia del Proveedor */}
                                            <div>
                                                <label
                                                    style={{
                                                        display: "block",
                                                        marginBottom: "4px",
                                                        fontSize: "12px",
                                                        fontWeight: "600",
                                                        color: "#6c757d",
                                                    }}
                                                >
                                                    Referencia del Proveedor
                                                    (opcional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={
                                                        batch.supplier_reference
                                                    }
                                                    onChange={(e) =>
                                                        handleBatchesChange(
                                                            index,
                                                            "supplier_reference",
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="Ej: REF-12345"
                                                    style={{
                                                        width: "100%",
                                                        padding: "8px 10px",
                                                        border: "1px solid #ccc",
                                                        borderRadius: "4px",
                                                        fontSize: "14px",
                                                        boxSizing: "border-box",
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Botón para agregar nuevo lote */}
                            <button
                                type="button"
                                onClick={handleAddBatch}
                                style={{
                                    width: "100%",
                                    padding: "12px",
                                    backgroundColor: "#2196f3",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "6px",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                    transition: "background-color 0.2s ease",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                        "#1976d2";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                        "#2196f3";
                                }}
                            >
                                <span>➕</span> Agregar Nuevo Lote
                            </button>

                            {/* Resumen de cantidades */}
                            {batchesData.length > 0 && (
                                <div
                                    style={{
                                        marginTop: "16px",
                                        padding: "12px",
                                        backgroundColor: "#e8f5e8",
                                        border: "1px solid #4caf50",
                                        borderRadius: "6px",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            color: "#2e7d32",
                                            marginBottom: "4px",
                                        }}
                                    >
                                        📊 Resumen de Cantidades
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "13px",
                                            color: "#388e3c",
                                        }}
                                    >
                                        <strong>Total de unidades:</strong>{" "}
                                        {batchesData.reduce(
                                            (sum, batch) =>
                                                sum +
                                                parseInt(batch.quantity || 0),
                                            0
                                        )}{" "}
                                        unidades
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "12px",
                                            color: "#4caf50",
                                            marginTop: "4px",
                                        }}
                                    >
                                        {
                                            batchesData.filter(
                                                (batch) =>
                                                    batch.quantity &&
                                                    parseInt(batch.quantity) > 0
                                            ).length
                                        }{" "}
                                        lote(s) con cantidad válida
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Sección de Lotes Disponibles para Movimientos de Salida */}
                    {requiresBatchControl &&
                        formData.movementType === "out" &&
                        selectedProduct &&
                        formData.location && (
                            <div
                                style={{
                                    backgroundColor: "#fff3e0",
                                    padding: "20px",
                                    borderRadius: "8px",
                                    border: "1px solid #ffcc80",
                                }}
                            >
                                <div style={{ marginBottom: "16px" }}>
                                    <h3
                                        style={{
                                            fontSize: "18px",
                                            fontWeight: "600",
                                            margin: "0 0 8px 0",
                                            color: "#e65100",
                                        }}
                                    >
                                        Lotes Disponibles para Salida
                                    </h3>
                                    <p
                                        style={{
                                            fontSize: "14px",
                                            color: "#f57c00",
                                            margin: "0",
                                        }}
                                    >
                                        Seleccione los lotes y cantidades que
                                        desea sacar del inventario
                                    </p>
                                </div>

                                {isLoadingBatches ? (
                                    <div
                                        style={{
                                            textAlign: "center",
                                            padding: "20px",
                                            color: "#ff9800",
                                        }}
                                    >
                                        <span>⏳</span> Cargando lotes
                                        disponibles...
                                    </div>
                                ) : showBatchSection &&
                                  availableBatches.length > 0 ? (
                                    <>
                                        {/* Lista de lotes disponibles */}
                                        <div
                                            style={{
                                                maxHeight: "400px",
                                                overflowY: "auto",
                                            }}
                                        >
                                            {selectedBatches.map(
                                                (batch, index) => {
                                                    const isExpired =
                                                        new Date(
                                                            batch.expiry_date
                                                        ) < new Date();
                                                    const isNearExpiry =
                                                        new Date(
                                                            batch.expiry_date
                                                        ) <=
                                                        new Date(
                                                            Date.now() +
                                                                30 *
                                                                    24 *
                                                                    60 *
                                                                    60 *
                                                                    1000
                                                        );

                                                    return (
                                                        <div
                                                            key={batch.batch_id}
                                                            style={{
                                                                backgroundColor:
                                                                    "#fff",
                                                                padding: "16px",
                                                                borderRadius:
                                                                    "8px",
                                                                border: `2px solid ${
                                                                    isExpired
                                                                        ? "#f44336"
                                                                        : isNearExpiry
                                                                        ? "#ff9800"
                                                                        : "#4caf50"
                                                                }`,
                                                                marginBottom:
                                                                    "16px",
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    display:
                                                                        "flex",
                                                                    justifyContent:
                                                                        "space-between",
                                                                    alignItems:
                                                                        "center",
                                                                    marginBottom:
                                                                        "12px",
                                                                }}
                                                            >
                                                                <div>
                                                                    <h4
                                                                        style={{
                                                                            fontSize:
                                                                                "16px",
                                                                            fontWeight:
                                                                                "600",
                                                                            margin: "0 0 4px 0",
                                                                            color: "#e65100",
                                                                        }}
                                                                    >
                                                                        Lote:{" "}
                                                                        {
                                                                            batch.batch_number
                                                                        }
                                                                    </h4>
                                                                    <div
                                                                        style={{
                                                                            fontSize:
                                                                                "13px",
                                                                            color: "#666",
                                                                        }}
                                                                    >
                                                                        <div>
                                                                            <strong>
                                                                                Vencimiento:
                                                                            </strong>{" "}
                                                                            {new Date(
                                                                                batch.expiry_date
                                                                            ).toLocaleDateString()}
                                                                            {isExpired && (
                                                                                <span
                                                                                    style={{
                                                                                        color: "#f44336",
                                                                                        fontWeight:
                                                                                            "bold",
                                                                                    }}
                                                                                >
                                                                                    {" "}
                                                                                    (VENCIDO)
                                                                                </span>
                                                                            )}
                                                                            {!isExpired &&
                                                                                isNearExpiry && (
                                                                                    <span
                                                                                        style={{
                                                                                            color: "#ff9800",
                                                                                            fontWeight:
                                                                                                "bold",
                                                                                        }}
                                                                                    >
                                                                                        {" "}
                                                                                        (PRÓXIMO
                                                                                        A
                                                                                        VENCER)
                                                                                    </span>
                                                                                )}
                                                                        </div>
                                                                        <div>
                                                                            <strong>
                                                                                Stock
                                                                                disponible:
                                                                            </strong>{" "}
                                                                            {
                                                                                batch.quantity
                                                                            }{" "}
                                                                            unidades
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div
                                                                    style={{
                                                                        padding:
                                                                            "8px 12px",
                                                                        borderRadius:
                                                                            "20px",
                                                                        fontSize:
                                                                            "12px",
                                                                        fontWeight:
                                                                            "600",
                                                                        backgroundColor:
                                                                            isExpired
                                                                                ? "#ffebee"
                                                                                : isNearExpiry
                                                                                ? "#fff3e0"
                                                                                : "#e8f5e8",
                                                                        color: isExpired
                                                                            ? "#c62828"
                                                                            : isNearExpiry
                                                                            ? "#e65100"
                                                                            : "#2e7d32",
                                                                    }}
                                                                >
                                                                    {isExpired
                                                                        ? "VENCIDO"
                                                                        : isNearExpiry
                                                                        ? "PRÓXIMO"
                                                                        : "VÁLIDO"}
                                                                </div>
                                                            </div>

                                                            <div
                                                                style={{
                                                                    display:
                                                                        "flex",
                                                                    alignItems:
                                                                        "center",
                                                                    gap: "12px",
                                                                }}
                                                            >
                                                                <div
                                                                    style={{
                                                                        flex: 1,
                                                                    }}
                                                                >
                                                                    <label
                                                                        style={{
                                                                            display:
                                                                                "block",
                                                                            marginBottom:
                                                                                "4px",
                                                                            fontSize:
                                                                                "12px",
                                                                            fontWeight:
                                                                                "600",
                                                                            color: "#e65100",
                                                                        }}
                                                                    >
                                                                        Cantidad
                                                                        a sacar
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        max={
                                                                            batch.quantity
                                                                        }
                                                                        value={
                                                                            batch.selectedQuantity
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            handleBatchQuantityChange(
                                                                                index,
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        placeholder="0"
                                                                        style={{
                                                                            width: "100%",
                                                                            padding:
                                                                                "8px 10px",
                                                                            border: "1px solid #ccc",
                                                                            borderRadius:
                                                                                "4px",
                                                                            fontSize:
                                                                                "14px",
                                                                            boxSizing:
                                                                                "border-box",
                                                                        }}
                                                                    />
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleSelectCompleteBatch(
                                                                            index
                                                                        )
                                                                    }
                                                                    style={{
                                                                        padding:
                                                                            "8px 12px",
                                                                        backgroundColor:
                                                                            "#ff9800",
                                                                        color: "#fff",
                                                                        border: "none",
                                                                        borderRadius:
                                                                            "4px",
                                                                        fontSize:
                                                                            "12px",
                                                                        fontWeight:
                                                                            "600",
                                                                        cursor: "pointer",
                                                                        whiteSpace:
                                                                            "nowrap",
                                                                        transition:
                                                                            "background-color 0.2s ease",
                                                                    }}
                                                                    onMouseEnter={(
                                                                        e
                                                                    ) => {
                                                                        e.currentTarget.style.backgroundColor =
                                                                            "#f57c00";
                                                                    }}
                                                                    onMouseLeave={(
                                                                        e
                                                                    ) => {
                                                                        e.currentTarget.style.backgroundColor =
                                                                            "#ff9800";
                                                                    }}
                                                                >
                                                                    Todo el lote
                                                                </button>
                                                            </div>

                                                            {/* Indicador de transferencia parcial */}
                                                            {batch.isPartial &&
                                                                batch.selectedQuantity >
                                                                    0 && (
                                                                    <div
                                                                        style={{
                                                                            marginTop:
                                                                                "8px",
                                                                            padding:
                                                                                "6px 10px",
                                                                            backgroundColor:
                                                                                "#e3f2fd",
                                                                            border: "1px solid #2196f3",
                                                                            borderRadius:
                                                                                "4px",
                                                                            fontSize:
                                                                                "12px",
                                                                            color: "#1976d2",
                                                                            fontWeight:
                                                                                "500",
                                                                        }}
                                                                    >
                                                                        ⚠️
                                                                        Transferencia
                                                                        parcial:
                                                                        Se
                                                                        sacarán{" "}
                                                                        {
                                                                            batch.selectedQuantity
                                                                        }{" "}
                                                                        de{" "}
                                                                        {
                                                                            batch.quantity
                                                                        }{" "}
                                                                        unidades
                                                                    </div>
                                                                )}
                                                        </div>
                                                    );
                                                }
                                            )}
                                        </div>

                                        {/* Resumen de cantidades seleccionadas */}
                                        {getTotalSelectedQuantity() > 0 && (
                                            <div
                                                style={{
                                                    marginTop: "16px",
                                                    padding: "12px",
                                                    backgroundColor: "#fff3e0",
                                                    border: "1px solid #ff9800",
                                                    borderRadius: "6px",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        fontSize: "14px",
                                                        fontWeight: "600",
                                                        color: "#e65100",
                                                        marginBottom: "4px",
                                                    }}
                                                >
                                                    📊 Resumen de Salida
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "13px",
                                                        color: "#f57c00",
                                                    }}
                                                >
                                                    <strong>
                                                        Total a sacar:
                                                    </strong>{" "}
                                                    {getTotalSelectedQuantity()}{" "}
                                                    unidades
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "12px",
                                                        color: "#ff9800",
                                                        marginTop: "4px",
                                                    }}
                                                >
                                                    {
                                                        selectedBatches.filter(
                                                            (batch) =>
                                                                batch.selectedQuantity >
                                                                0
                                                        ).length
                                                    }{" "}
                                                    lote(s) seleccionado(s)
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div
                                        style={{
                                            textAlign: "center",
                                            padding: "20px",
                                            color: "#666",
                                            backgroundColor: "#f5f5f5",
                                            borderRadius: "8px",
                                        }}
                                    >
                                        <span>📦</span> No hay lotes disponibles
                                        en esta ubicación
                                    </div>
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
