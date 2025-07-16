import React, { useState, useEffect } from "react";
import batchesService from "../../services/batchesService";
import inventoryService from "../../services/inventoryService";
import advancedInventoryService from "../../services/advancedInventoryService";

const ProductEntryCard = ({
    productEntry,
    onRemove,
    onQuantityChange,
    movementType,
    onBatchesChange,
    locationId, // sede seleccionada
    authToken, // token para la consulta
}) => {
    const [requiresBatchControl, setRequiresBatchControl] = useState(
        productEntry.requiresBatchControl
    );
    const [batchesData, setBatchesData] = useState(
        productEntry.batchesData || []
    );
    const [availableBatches, setAvailableBatches] = useState([]); // Para salida
    const [isLoadingBatches, setIsLoadingBatches] = useState(false);

    // NUEVO: Estados para productos sin lotes
    const [productStock, setProductStock] = useState(0);
    const [isLoadingStock, setIsLoadingStock] = useState(false);

    // Detectar automáticamente si el producto requiere control de lotes
    useEffect(() => {
        if (productEntry.product) {
            const productRequiresBatches = batchesService.requiresBatchControl(
                productEntry.product
            );
            setRequiresBatchControl(productRequiresBatches);

            // Si requiere lotes y no hay lotes configurados, crear uno por defecto SOLO si es entrada
            if (
                productRequiresBatches &&
                batchesData.length === 0 &&
                movementType !== "out"
            ) {
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
    }, [productEntry.product, movementType]);

    // NUEVO: Cargar lotes disponibles para salida usando el endpoint correcto y filtrando por sede
    useEffect(() => {
        const fetchBatches = async () => {
            if (
                requiresBatchControl &&
                movementType === "out" &&
                productEntry.product?.id &&
                locationId &&
                authToken
            ) {
                setIsLoadingBatches(true);
                try {
                    // Consultar todos los lotes del producto
                    const url = `/api/inventory/stock/product_batches_stock/?product=${productEntry.product.id}`;
                    const response = await fetch(url, {
                        headers: {
                            Authorization: `Token ${authToken}`,
                            "Content-Type": "application/json",
                        },
                    });
                    const data = await response.json();
                    // Filtrar lotes que tienen stock en la sede seleccionada
                    const batches = (data.batches || [])
                        .map((batch) => {
                            const locationStock = (batch.locations || []).find(
                                (loc) =>
                                    String(loc.location_id) ===
                                    String(locationId)
                            );
                            if (locationStock && locationStock.quantity > 0) {
                                return {
                                    ...batch,
                                    quantity: locationStock.quantity,
                                    location_id: locationStock.location_id,
                                    location_name: locationStock.location_name,
                                };
                            }
                            return null;
                        })
                        .filter(Boolean);
                    console.log("DEBUG batches response:", batches);
                    setAvailableBatches(batches);
                    setBatchesData(
                        batches.map((batch) => ({
                            batch_id: batch.batch_id || batch.id,
                            batch_number: batch.batch_number || batch.id,
                            expiry_date: batch.expiry_date,
                            quantity: "", // cantidad a sacar
                            stock: batch.quantity,
                        }))
                    );
                } catch (error) {
                    setAvailableBatches([]);
                } finally {
                    setIsLoadingBatches(false);
                }
            }
        };
        fetchBatches();
        // eslint-disable-next-line
    }, [
        requiresBatchControl,
        movementType,
        productEntry.product,
        locationId,
        authToken,
    ]);

    // NUEVO: Cargar stock del producto en la sede seleccionada (para productos sin lotes)
    useEffect(() => {
        const fetchProductStock = async () => {
            if (
                !requiresBatchControl &&
                productEntry.product?.id &&
                locationId &&
                authToken
            ) {
                setIsLoadingStock(true);
                try {
                    const stock =
                        await inventoryService.getProductStockAtLocation(
                            productEntry.product.id,
                            locationId,
                            authToken
                        );
                    setProductStock(stock);
                    console.log(
                        `📦 Stock cargado para producto ${productEntry.product.name}: ${stock} unidades`
                    );
                } catch (error) {
                    console.error("Error al cargar stock del producto:", error);
                    setProductStock(0);
                } finally {
                    setIsLoadingStock(false);
                }
            } else {
                setProductStock(0);
            }
        };
        fetchProductStock();
    }, [
        requiresBatchControl,
        movementType,
        productEntry.product,
        locationId,
        authToken,
    ]);

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

    // Manejar cambios en cantidades de lotes para salida
    const handleBatchQuantityChange = (index, value) => {
        const updated = [...batchesData];
        updated[index].quantity = value;
        setBatchesData(updated);
        if (onBatchesChange) {
            onBatchesChange(productEntry.id, updated);
        }
    };

    const handleQuantityChange = (e) => {
        let value = e.target.value;

        // Para productos sin lotes en movimientos de salida, limitar al stock disponible
        if (
            !requiresBatchControl &&
            movementType === "out" &&
            productStock > 0
        ) {
            if (value === "") {
                onQuantityChange(productEntry.id, "");
            } else {
                const numValue = Math.max(
                    0,
                    Math.min(Number(value), productStock)
                );
                onQuantityChange(productEntry.id, numValue);
            }
        } else {
            onQuantityChange(productEntry.id, value);
        }
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

    // NUEVO: Función para verificar si el campo de cantidad debe estar habilitado
    const isQuantityFieldEnabled = () => {
        if (requiresBatchControl) return true; // Productos con lotes siempre habilitados

        // Para productos sin lotes:
        if (movementType === "in") {
            // En entradas: requiere producto Y sede seleccionados
            return productEntry.product?.id && locationId;
        } else {
            // En salidas: requiere sede seleccionada y no estar cargando stock
            return locationId && !isLoadingStock;
        }
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

                {/* NUEVO: Indicadores de stock en el header */}
                {!requiresBatchControl && locationId && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-end",
                            gap: "4px",
                            minWidth: "120px",
                        }}
                    >
                        {movementType === "out" ? (
                            <div
                                style={{
                                    padding: "6px 10px",
                                    borderRadius: "6px",
                                    backgroundColor: isLoadingStock
                                        ? "#f8f9fa"
                                        : "#e8f5e8",
                                    border: "1px solid",
                                    borderColor: isLoadingStock
                                        ? "#dee2e6"
                                        : "#28a745",
                                    fontSize: "12px",
                                    color: isLoadingStock
                                        ? "#6c757d"
                                        : "#155724",
                                    fontWeight: "600",
                                    textAlign: "center",
                                }}
                            >
                                {isLoadingStock ? (
                                    <span>⏳ Cargando stock...</span>
                                ) : (
                                    <span>📦 {productStock} disponibles</span>
                                )}
                            </div>
                        ) : (
                            movementType === "in" &&
                            isQuantityFieldEnabled() && (
                                <div
                                    style={{
                                        padding: "6px 10px",
                                        borderRadius: "6px",
                                        backgroundColor: isLoadingStock
                                            ? "#f8f9fa"
                                            : "#e3f2fd",
                                        border: "1px solid",
                                        borderColor: isLoadingStock
                                            ? "#dee2e6"
                                            : "#1976d2",
                                        fontSize: "12px",
                                        color: isLoadingStock
                                            ? "#6c757d"
                                            : "#1565c0",
                                        fontWeight: "600",
                                        textAlign: "center",
                                    }}
                                >
                                    {isLoadingStock ? (
                                        <span>⏳ Cargando stock...</span>
                                    ) : (
                                        <span>
                                            📊 Stock: {productStock} unidades
                                        </span>
                                    )}
                                </div>
                            )
                        )}
                    </div>
                )}

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
                        marginLeft: "8px",
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
                {requiresBatchControl && movementType === "out" ? (
                    // Mostrar lotes existentes para salida
                    <div
                        style={{
                            background: "#fffbe6",
                            padding: 16,
                            borderRadius: 12,
                            border: "1.5px solid #ffe58f",
                            boxShadow: "0 2px 12px rgba(255, 193, 7, 0.08)",
                        }}
                    >
                        <div
                            style={{
                                fontWeight: 700,
                                color: "#b26a00",
                                fontSize: 16,
                                marginBottom: 10,
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            <span style={{ fontSize: 20 }}>🏷️</span> Lotes
                            disponibles en esta sede
                        </div>
                        {isLoadingBatches ? (
                            <div
                                style={{
                                    color: "#faad14",
                                    marginTop: 12,
                                    fontWeight: 500,
                                    fontSize: 15,
                                }}
                            >
                                <span style={{ fontSize: 18 }}>⏳</span>{" "}
                                Cargando lotes...
                            </div>
                        ) : availableBatches.length === 0 ? (
                            <div
                                style={{
                                    color: "#888",
                                    marginTop: 12,
                                    fontWeight: 500,
                                    fontSize: 15,
                                }}
                            >
                                <span style={{ fontSize: 18 }}>📦</span> No hay
                                lotes disponibles en esta sede.
                            </div>
                        ) : (
                            <div
                                style={{
                                    marginTop: 8,
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 12,
                                }}
                            >
                                {batchesData.map((batch, idx) => (
                                    <div
                                        key={batch.batch_id}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 20,
                                            marginBottom: 0,
                                            background: "#fff",
                                            border: "1.5px solid #ffe082",
                                            borderRadius: 10,
                                            padding: 14,
                                            boxShadow:
                                                "0 1px 6px rgba(255, 193, 7, 0.06)",
                                            transition: "box-shadow 0.2s",
                                        }}
                                        onMouseEnter={(e) =>
                                            (e.currentTarget.style.boxShadow =
                                                "0 4px 16px rgba(255,193,7,0.13)")
                                        }
                                        onMouseLeave={(e) =>
                                            (e.currentTarget.style.boxShadow =
                                                "0 1px 6px rgba(255,193,7,0.06)")
                                        }
                                    >
                                        <div
                                            style={{
                                                flex: 2,
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 2,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontWeight: 600,
                                                    color: "#e65100",
                                                    fontSize: 15,
                                                }}
                                            >
                                                Lote:{" "}
                                                <span style={{ color: "#333" }}>
                                                    {batch.batch_number}
                                                </span>
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 13,
                                                    color: "#666",
                                                    marginTop: 2,
                                                }}
                                            >
                                                <b>Vence:</b>{" "}
                                                {batch.expiry_date || "-"}
                                            </div>
                                            <div style={{ marginTop: 2 }}>
                                                <span
                                                    style={{
                                                        display: "inline-block",
                                                        background:
                                                            batch.stock > 10
                                                                ? "#28a745"
                                                                : batch.stock >
                                                                  0
                                                                ? "#ffc107"
                                                                : "#dc3545",
                                                        color: "#fff",
                                                        borderRadius: 12,
                                                        padding: "2px 12px",
                                                        fontWeight: 700,
                                                        fontSize: 13,
                                                        letterSpacing: 0.5,
                                                        marginRight: 6,
                                                    }}
                                                >
                                                    Stock: {batch.stock}
                                                </span>
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                flex: 1,
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "flex-end",
                                                gap: 4,
                                            }}
                                        >
                                            <input
                                                type="number"
                                                min={0}
                                                max={batch.stock}
                                                value={batch.quantity}
                                                onChange={(e) => {
                                                    let value = e.target.value;
                                                    if (value === "") {
                                                        handleBatchQuantityChange(
                                                            idx,
                                                            ""
                                                        );
                                                    } else {
                                                        value = Math.max(
                                                            0,
                                                            Math.min(
                                                                Number(value),
                                                                batch.stock
                                                            )
                                                        );
                                                        handleBatchQuantityChange(
                                                            idx,
                                                            value
                                                        );
                                                    }
                                                }}
                                                /* Sin placeholder */
                                                style={{
                                                    width: 120,
                                                    padding: "10px 14px",
                                                    borderRadius: 6,
                                                    border: "1.5px solid #ffd54f",
                                                    fontSize: 17,
                                                    fontWeight: 600,
                                                    color: "#e65100",
                                                    background: "#fffde7",
                                                    outline: "none",
                                                    boxShadow:
                                                        "0 1px 2px rgba(255,193,7,0.04)",
                                                    transition: "border 0.2s",
                                                    textAlign: "center",
                                                    MozAppearance: "textfield",
                                                }}
                                                onFocus={(e) =>
                                                    (e.target.style.border =
                                                        "1.5px solid #e65100")
                                                }
                                                onBlur={(e) =>
                                                    (e.target.style.border =
                                                        "1.5px solid #ffd54f")
                                                }
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                className="no-spinner"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : requiresBatchControl ? (
                    // Flujo actual SOLO para entrada
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
                        <div style={{ width: "100%", maxWidth: "280px" }}>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "6px",
                                }}
                            >
                                <label
                                    style={{
                                        fontWeight: "600",
                                        color: "#2c3e50",
                                        fontSize: "13px",
                                    }}
                                >
                                    Cantidad{" "}
                                    <span style={{ color: "#dc3545" }}>*</span>
                                </label>
                            </div>

                            <div style={{ position: "relative" }}>
                                <input
                                    type="number"
                                    value={productEntry.quantity}
                                    onChange={handleQuantityChange}
                                    min="1"
                                    max={
                                        !requiresBatchControl &&
                                        movementType === "out"
                                            ? productStock
                                            : undefined
                                    }
                                    disabled={!isQuantityFieldEnabled()}
                                    style={{
                                        width: "100%",
                                        padding: "10px 12px",
                                        borderRadius: "6px",
                                        border: `1.5px solid ${
                                            productEntry.quantity
                                                ? "#28a745"
                                                : "#e9ecef"
                                        }`,
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        color: "#495057",
                                        transition: "all 0.2s ease",
                                        outline: "none",
                                        textAlign: "center",
                                        backgroundColor:
                                            isQuantityFieldEnabled()
                                                ? "#fff"
                                                : "#f8f9fa",
                                        opacity: isQuantityFieldEnabled()
                                            ? 1
                                            : 0.6,
                                        cursor: isQuantityFieldEnabled()
                                            ? "text"
                                            : "not-allowed",
                                        boxSizing: "border-box",
                                    }}
                                    placeholder={
                                        isQuantityFieldEnabled()
                                            ? "0"
                                            : "Seleccione sede"
                                    }
                                    onFocus={(e) => {
                                        if (isQuantityFieldEnabled()) {
                                            e.target.style.borderColor =
                                                "#007bff";
                                            e.target.style.boxShadow =
                                                "0 0 0 2px rgba(0,123,255,0.1)";
                                        }
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = `1.5px solid ${
                                            productEntry.quantity
                                                ? "#28a745"
                                                : "#e9ecef"
                                        }`;
                                        e.target.style.boxShadow = "none";
                                    }}
                                />

                                {/* NUEVO: Indicador de estado del campo más compacto */}
                                {!isQuantityFieldEnabled() && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: "50%",
                                            right: "10px",
                                            transform: "translateY(-50%)",
                                            fontSize: "12px",
                                            color: "#6c757d",
                                        }}
                                    >
                                        🔒
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductEntryCard;
