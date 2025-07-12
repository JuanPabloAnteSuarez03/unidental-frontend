import React, { useState, useEffect } from "react";
import batchesService from "../../services/batchesService";

const ProductEntryCard = ({
    productEntry,
    onRemove,
    onQuantityChange,
    movementType,
    onBatchesChange,
}) => {
    const [requiresBatchControl, setRequiresBatchControl] = useState(
        productEntry.requiresBatchControl
    );
    const [batchesData, setBatchesData] = useState(
        productEntry.batchesData || []
    );

    // Detectar automáticamente si el producto requiere control de lotes
    useEffect(() => {
        if (productEntry.product) {
            const productRequiresBatches = batchesService.requiresBatchControl(
                productEntry.product
            );
            setRequiresBatchControl(productRequiresBatches);

            // Si requiere lotes y no hay lotes configurados, crear uno por defecto
            if (productRequiresBatches && batchesData.length === 0) {
                setBatchesData([
                    {
                        batch_number: "",
                        expiry_date: "",
                        manufacturing_date: "",
                        supplier_reference: "",
                        quantity: "",
                    },
                ]);
            }
        }
    }, [productEntry.product]);

    // Función para manejar cambios en los lotes
    const handleBatchChange = (index, field, value) => {
        const updatedBatches = [...batchesData];
        updatedBatches[index] = {
            ...updatedBatches[index],
            [field]: value,
        };
        setBatchesData(updatedBatches);

        // Notificar al componente padre
        if (onBatchesChange) {
            onBatchesChange(productEntry.id, updatedBatches);
        }
    };

    // Función para agregar un nuevo lote
    const handleAddBatch = () => {
        const newBatch = {
            batch_number: "",
            expiry_date: "",
            manufacturing_date: "",
            supplier_reference: "",
            quantity: "",
        };
        const updatedBatches = [...batchesData, newBatch];
        setBatchesData(updatedBatches);

        if (onBatchesChange) {
            onBatchesChange(productEntry.id, updatedBatches);
        }
    };

    // Función para eliminar un lote
    const handleRemoveBatch = (index) => {
        const updatedBatches = batchesData.filter((_, i) => i !== index);
        setBatchesData(updatedBatches);

        if (onBatchesChange) {
            onBatchesChange(productEntry.id, updatedBatches);
        }
    };

    const handleQuantityChange = (e) => {
        onQuantityChange(productEntry.id, e.target.value);
    };

    const getStatusColor = () => {
        if (!productEntry.isValid) return "#dc3545";
        if (requiresBatchControl && batchesData.length === 0) return "#ffc107";
        return "#28a745";
    };

    const getStatusText = () => {
        if (!productEntry.isValid) return "Incompleto";
        if (requiresBatchControl && batchesData.length === 0)
            return "Requiere lotes";
        return "Completo";
    };

    const getTotalBatchesQuantity = () => {
        return batchesData.reduce(
            (sum, batch) => sum + parseInt(batch.quantity || 0),
            0
        );
    };

    return (
        <div
            style={{
                backgroundColor: "#fff",
                borderRadius: "8px",
                border: `2px solid ${getStatusColor()}20`,
                padding: "16px",
                transition: "all 0.2s ease",
                position: "relative",
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
            }}
        >
            {/* Header con información del producto */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "12px",
                }}
            >
                <div style={{ flex: "1" }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "4px",
                        }}
                    >
                        <h4
                            style={{
                                fontSize: "16px",
                                fontWeight: "600",
                                margin: "0",
                                color: "#2c3e50",
                            }}
                        >
                            {productEntry.product.name}
                        </h4>
                        <span
                            style={{
                                backgroundColor: getStatusColor(),
                                color: "white",
                                padding: "2px 8px",
                                borderRadius: "12px",
                                fontSize: "11px",
                                fontWeight: "600",
                                textTransform: "uppercase",
                            }}
                        >
                            {getStatusText()}
                        </span>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            gap: "16px",
                            fontSize: "13px",
                            color: "#6c757d",
                        }}
                    >
                        <span>SKU: {productEntry.product.sku}</span>
                        <span>Categoría: {productEntry.product.category}</span>
                    </div>
                </div>

                {/* Botón de eliminar */}
                <button
                    type="button"
                    onClick={() => onRemove(productEntry.id)}
                    style={{
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        padding: "6px 10px",
                        fontSize: "12px",
                        cursor: "pointer",
                        fontWeight: "600",
                        transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#c82333";
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#dc3545";
                    }}
                >
                    ✗
                </button>
            </div>

            {/* Campos de configuración */}
            <div
                style={{
                    marginTop: "12px",
                    paddingTop: "12px",
                    borderTop: "1px solid #e9ecef",
                }}
            >
                {requiresBatchControl ? (
                    /* Sección de lotes con campos específicos */
                    <div
                        style={{
                            backgroundColor: "#f8f9fa",
                            padding: "16px",
                            borderRadius: "8px",
                            border: "1px solid #dee2e6",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "16px",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                }}
                            >
                                📦 Lotes ({batchesData.length})
                            </span>
                            <button
                                type="button"
                                onClick={handleAddBatch}
                                style={{
                                    backgroundColor: "#28a745",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    padding: "6px 12px",
                                    fontSize: "12px",
                                    cursor: "pointer",
                                    fontWeight: "600",
                                    transition: "all 0.2s ease",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                        "#218838";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                        "#28a745";
                                }}
                            >
                                + Agregar Lote
                            </button>
                        </div>

                        {batchesData.length === 0 ? (
                            <div
                                style={{
                                    textAlign: "center",
                                    padding: "20px",
                                    color: "#6c757d",
                                    fontSize: "13px",
                                    backgroundColor: "#fff",
                                    borderRadius: "6px",
                                    border: "1px dashed #dee2e6",
                                }}
                            >
                                No hay lotes configurados. Haga clic en "Agregar
                                Lote" para comenzar.
                            </div>
                        ) : (
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "16px",
                                }}
                            >
                                {batchesData.map((batch, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            backgroundColor: "#fff",
                                            padding: "16px",
                                            borderRadius: "8px",
                                            border: "1px solid #dee2e6",
                                            position: "relative",
                                        }}
                                    >
                                        {/* Header del lote */}
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                marginBottom: "12px",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontSize: "13px",
                                                    fontWeight: "600",
                                                    color: "#495057",
                                                }}
                                            >
                                                Lote #{index + 1}
                                            </span>
                                            {batchesData.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleRemoveBatch(index)
                                                    }
                                                    style={{
                                                        backgroundColor:
                                                            "#dc3545",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: "4px",
                                                        padding: "4px 8px",
                                                        fontSize: "11px",
                                                        cursor: "pointer",
                                                        fontWeight: "600",
                                                    }}
                                                >
                                                    ✗
                                                </button>
                                            )}
                                        </div>

                                        {/* Campos del lote en grid */}
                                        <div
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns:
                                                    "2fr 1fr 1fr",
                                                gap: "20px",
                                            }}
                                        >
                                            {/* Número de Lote */}
                                            <div>
                                                <label
                                                    style={{
                                                        display: "block",
                                                        marginBottom: "8px",
                                                        fontWeight: "600",
                                                        color: "#2c3e50",
                                                        fontSize: "12px",
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
                                                        handleBatchChange(
                                                            index,
                                                            "batch_number",
                                                            e.target.value
                                                        )
                                                    }
                                                    style={{
                                                        width: "100%",
                                                        padding: "10px 12px",
                                                        border: "1px solid #ced4da",
                                                        borderRadius: "6px",
                                                        fontSize: "13px",
                                                        transition:
                                                            "all 0.2s ease",
                                                        outline: "none",
                                                        boxSizing: "border-box",
                                                    }}
                                                    placeholder="Ej: LOT-2024-001"
                                                    onFocus={(e) => {
                                                        e.target.style.borderColor =
                                                            "#007bff";
                                                        e.target.style.boxShadow =
                                                            "0 0 0 3px rgba(0,123,255,0.1)";
                                                    }}
                                                    onBlur={(e) => {
                                                        e.target.style.borderColor =
                                                            "#ced4da";
                                                        e.target.style.boxShadow =
                                                            "none";
                                                    }}
                                                />
                                            </div>

                                            {/* Unidades */}
                                            <div>
                                                <label
                                                    style={{
                                                        display: "block",
                                                        marginBottom: "8px",
                                                        fontWeight: "600",
                                                        color: "#2c3e50",
                                                        fontSize: "12px",
                                                    }}
                                                >
                                                    Unidades{" "}
                                                    <span
                                                        style={{
                                                            color: "#dc3545",
                                                        }}
                                                    >
                                                        *
                                                    </span>
                                                </label>
                                                <input
                                                    type="number"
                                                    value={batch.quantity}
                                                    onChange={(e) =>
                                                        handleBatchChange(
                                                            index,
                                                            "quantity",
                                                            e.target.value
                                                        )
                                                    }
                                                    min="1"
                                                    style={{
                                                        width: "100%",
                                                        padding: "10px 12px",
                                                        border: "1px solid #ced4da",
                                                        borderRadius: "6px",
                                                        fontSize: "13px",
                                                        transition:
                                                            "all 0.2s ease",
                                                        outline: "none",
                                                        boxSizing: "border-box",
                                                    }}
                                                    placeholder="0"
                                                    onFocus={(e) => {
                                                        e.target.style.borderColor =
                                                            "#007bff";
                                                        e.target.style.boxShadow =
                                                            "0 0 0 3px rgba(0,123,255,0.1)";
                                                    }}
                                                    onBlur={(e) => {
                                                        e.target.style.borderColor =
                                                            "#ced4da";
                                                        e.target.style.boxShadow =
                                                            "none";
                                                    }}
                                                />
                                            </div>

                                            {/* Fecha de Vencimiento */}
                                            <div>
                                                <label
                                                    style={{
                                                        display: "block",
                                                        marginBottom: "8px",
                                                        fontWeight: "600",
                                                        color: "#2c3e50",
                                                        fontSize: "12px",
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
                                                        handleBatchChange(
                                                            index,
                                                            "expiry_date",
                                                            e.target.value
                                                        )
                                                    }
                                                    style={{
                                                        width: "100%",
                                                        padding: "10px 12px",
                                                        border: "1px solid #ced4da",
                                                        borderRadius: "6px",
                                                        fontSize: "13px",
                                                        transition:
                                                            "all 0.2s ease",
                                                        outline: "none",
                                                        boxSizing: "border-box",
                                                    }}
                                                    onFocus={(e) => {
                                                        e.target.style.borderColor =
                                                            "#007bff";
                                                        e.target.style.boxShadow =
                                                            "0 0 0 3px rgba(0,123,255,0.1)";
                                                    }}
                                                    onBlur={(e) => {
                                                        e.target.style.borderColor =
                                                            "#ced4da";
                                                        e.target.style.boxShadow =
                                                            "none";
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Resumen de lotes */}
                                <div
                                    style={{
                                        backgroundColor: "#e3f2fd",
                                        padding: "12px",
                                        borderRadius: "6px",
                                        textAlign: "center",
                                        fontSize: "13px",
                                        color: "#1976d2",
                                        fontWeight: "500",
                                        border: "1px solid #bbdefb",
                                    }}
                                >
                                    Total: {getTotalBatchesQuantity()} unidades
                                    en {batchesData.length} lote
                                    {batchesData.length !== 1 ? "s" : ""}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Campos para productos sin lotes */
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                        }}
                    >
                        {/* Cantidad */}
                        <div style={{ width: "300px" }}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                    fontSize: "14px",
                                    textAlign: "center",
                                }}
                            >
                                Cantidad{" "}
                                <span style={{ color: "#dc3545" }}>*</span>
                            </label>
                            <div style={{ position: "relative" }}>
                                <input
                                    type="number"
                                    value={productEntry.quantity}
                                    onChange={handleQuantityChange}
                                    min="1"
                                    style={{
                                        width: "100%",
                                        padding: "12px 16px",
                                        paddingRight: "50px",
                                        borderRadius: "8px",
                                        border: `2px solid ${
                                            productEntry.quantity
                                                ? "#28a745"
                                                : "#e9ecef"
                                        }`,
                                        fontSize: "16px",
                                        fontWeight: "500",
                                        color: "#495057",
                                        transition: "all 0.2s ease",
                                        outline: "none",
                                        textAlign: "center",
                                    }}
                                    placeholder="0"
                                    onFocus={(e) => {
                                        e.target.style.borderColor = "#007bff";
                                        e.target.style.boxShadow =
                                            "0 0 0 3px rgba(0,123,255,0.1)";
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor =
                                            productEntry.quantity
                                                ? "#28a745"
                                                : "#e9ecef";
                                        e.target.style.boxShadow = "none";
                                    }}
                                />
                                <span
                                    style={{
                                        position: "absolute",
                                        right: "16px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        color: "#6c757d",
                                        fontSize: "12px",
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
                )}
            </div>
        </div>
    );
};

export default ProductEntryCard;
