import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import inventoryService from "../../services/inventoryService";
import advancedInventoryService from "../../services/advancedInventoryService";
import batchesService from "../../services/batchesService";
import ProductSearchSelector from "../Common/ProductSearchSelector";

const CreateTransferForm = ({ onSubmit, onCancel, isLoading = false }) => {
    const { authToken } = useAuth();

    // Estados del formulario
    const [formData, setFormData] = useState({
        sedeOrigen: "",
        sedeDestino: "",
        cantidad: "",
        motivo: "Transferencia interna",
    });

    // Estados para ubicaciones y producto
    const [ubicaciones, setUbicaciones] = useState([]);
    const [isLoadingUbicaciones, setIsLoadingUbicaciones] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [stockInfo, setStockInfo] = useState(null);
    const [stockError, setStockError] = useState(null);

    // Estados para lotes
    const [availableBatches, setAvailableBatches] = useState([]);
    const [isLoadingBatches, setIsLoadingBatches] = useState(false);
    const [batchesError, setBatchesError] = useState(null);
    const [productRequiresBatches, setProductRequiresBatches] = useState(false);
    const [selectedBatches, setSelectedBatches] = useState({});

    // Estados de validación
    const [errors, setErrors] = useState({});

    // Cargar ubicaciones
    const loadUbicaciones = useCallback(async () => {
        if (!authToken) return;

        setIsLoadingUbicaciones(true);
        try {
            const data = await inventoryService.getLocations(authToken);
            setUbicaciones(data || []);

            if (!data || data.length === 0) {
                console.warn("No se encontraron ubicaciones disponibles");
            }
        } catch (error) {
            console.error("Error al cargar ubicaciones:", error);
            setUbicaciones([]);
        } finally {
            setIsLoadingUbicaciones(false);
        }
    }, [authToken]);

    // Cargar ubicaciones al montar el componente
    useEffect(() => {
        loadUbicaciones();
    }, [loadUbicaciones]);

    // Cargar información de stock y lotes cuando se selecciona producto y sede origen
    const loadStockInfo = useCallback(async () => {
        if (!selectedProduct || !formData.sedeOrigen || !authToken) {
            setStockInfo(null);
            setStockError(null);
            setAvailableBatches([]);
            setBatchesError(null);
            return;
        }

        try {
            setStockError(null);
            setBatchesError(null);

            // Verificar si el producto requiere control de lotes
            const requiresBatches =
                batchesService.requiresBatchControl(selectedProduct);
            setProductRequiresBatches(requiresBatches);

            // Buscar la ubicación origen por nombre
            const ubicacionOrigen = ubicaciones.find(
                (ub) => ub.name === formData.sedeOrigen
            );

            if (!ubicacionOrigen) {
                setStockError(
                    "No se encontró la ubicación origen seleccionada"
                );
                return;
            }

            if (requiresBatches) {
                // Para productos con control de lotes, cargar información de lotes
                setIsLoadingBatches(true);
                try {
                    const batches =
                        await advancedInventoryService.getAvailableBatchesFIFO(
                            selectedProduct.id,
                            ubicacionOrigen.id,
                            authToken
                        );

                    setAvailableBatches(batches);

                    // Calcular stock total de todos los lotes
                    const totalStock = batches.reduce(
                        (sum, batch) => sum + batch.quantity,
                        0
                    );

                    setStockInfo({
                        location: ubicacionOrigen.name,
                        availableStock: totalStock,
                        productName: selectedProduct.name,
                        batchCount: batches.length,
                        hasExpiredBatches: batches.some(
                            (batch) => batch.is_expired
                        ),
                        hasExpiringSoonBatches: batches.some(
                            (batch) =>
                                !batch.is_expired &&
                                batch.days_to_expiry !== null &&
                                parseInt(batch.days_to_expiry) <= 30
                        ),
                    });
                } catch (error) {
                    console.error("Error al cargar lotes:", error);
                    setBatchesError("Error al cargar información de lotes");
                    setAvailableBatches([]);
                } finally {
                    setIsLoadingBatches(false);
                }
            } else {
                // Para productos sin control de lotes, usar el método tradicional
                const stockResponse =
                    await inventoryService.getProductStockByLocations(
                        selectedProduct.id,
                        authToken
                    );

                const stockInOrigin = stockResponse.find(
                    (item) => item.id === ubicacionOrigen.id
                );

                if (stockInOrigin) {
                    setStockInfo({
                        location: ubicacionOrigen.name,
                        availableStock: stockInOrigin.stock,
                        productName: selectedProduct.name,
                    });
                } else {
                    setStockInfo({
                        location: ubicacionOrigen.name,
                        availableStock: 0,
                        productName: selectedProduct.name,
                    });
                }
            }
        } catch (error) {
            console.error("Error al cargar información de stock:", error);
            setStockError("Error al cargar información de stock");
        }
    }, [selectedProduct, formData.sedeOrigen, ubicaciones, authToken]);

    // Cargar stock cuando cambien las dependencias
    useEffect(() => {
        loadStockInfo();
    }, [loadStockInfo]);

    // Manejar selección de producto
    const handleProductSelected = (product) => {
        setSelectedProduct(product);
        setErrors((prev) => ({ ...prev, producto: null }));
    };

    // Manejar limpieza de selección de producto
    const handleProductSelectionCleared = () => {
        setSelectedProduct(null);
        setStockInfo(null);
        setStockError(null);
        setSelectedBatches({});
        setErrors((prev) => ({ ...prev, producto: null }));
    };

    // Manejar selección de lotes
    const handleBatchSelection = (batchId, isSelected) => {
        setSelectedBatches((prev) => ({
            ...prev,
            [batchId]: isSelected,
        }));
    };

    // Manejar cambio de cantidad por lote
    const handleBatchQuantityChange = (batchId, quantity) => {
        const batch = availableBatches.find((b) => b.batch_id === batchId);
        if (!batch) return;

        const maxQuantity = batch.quantity;
        const validQuantity = Math.min(
            Math.max(0, parseInt(quantity) || 0),
            maxQuantity
        );

        setSelectedBatches((prev) => ({
            ...prev,
            [batchId]: {
                ...prev[batchId],
                quantity: validQuantity,
            },
        }));
    };

    // Calcular cantidad total seleccionada
    const getTotalSelectedQuantity = () => {
        return Object.values(selectedBatches).reduce((total, batch) => {
            return total + (batch.quantity || 0);
        }, 0);
    };

    // Manejar cambios en los campos del formulario
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        if (name === "motivo") {
            // Para el campo motivo, no permitir borrar "Transferencia interna"
            const prefix = "Transferencia interna";

            if (value.length < prefix.length) {
                // Si el usuario intenta borrar más allá del prefijo, mantener el prefijo
                setFormData((prev) => ({
                    ...prev,
                    [name]: prefix,
                }));
            } else {
                setFormData((prev) => ({
                    ...prev,
                    [name]: value,
                }));
            }
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }

        // Limpiar error del campo cuando el usuario empiece a escribir
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: null }));
        }
    };

    // Validar formulario
    const validateForm = () => {
        const newErrors = {};

        if (!selectedProduct) {
            newErrors.producto = "Debe seleccionar un producto";
        }

        if (!formData.sedeOrigen) {
            newErrors.sedeOrigen = "Debe seleccionar una sede origen";
        }

        if (!formData.sedeDestino) {
            newErrors.sedeDestino = "Debe seleccionar una sede destino";
        }

        if (
            formData.sedeOrigen &&
            formData.sedeDestino &&
            formData.sedeOrigen === formData.sedeDestino
        ) {
            newErrors.sedeDestino =
                "La sede destino no puede ser igual a la sede origen";
        }

        if (productRequiresBatches) {
            // Para productos con control de lotes, validar que se hayan seleccionado lotes
            const totalSelected = getTotalSelectedQuantity();
            if (totalSelected <= 0) {
                newErrors.lotes =
                    "Debe seleccionar al menos un lote y especificar cantidades";
            } else if (totalSelected > stockInfo?.availableStock) {
                newErrors.lotes = `La cantidad total seleccionada (${totalSelected}) excede el stock disponible (${stockInfo.availableStock})`;
            }
        } else {
            // Para productos sin control de lotes, validar cantidad general
            if (!formData.cantidad || parseInt(formData.cantidad) <= 0) {
                newErrors.cantidad = "Debe ingresar una cantidad válida";
            } else if (
                stockInfo &&
                parseInt(formData.cantidad) > stockInfo.availableStock
            ) {
                newErrors.cantidad = `La cantidad excede el stock disponible (${stockInfo.availableStock})`;
            }
        }

        if (formData.motivo.trim() === "Transferencia interna") {
            newErrors.motivo =
                "Debe ingresar un motivo adicional para la transferencia";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Manejar envío del formulario
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const transferData = {
            selectedProduct,
            ...formData,
            cantidad: productRequiresBatches
                ? getTotalSelectedQuantity()
                : parseInt(formData.cantidad),
            selectedBatches: productRequiresBatches ? selectedBatches : null,
        };

        if (onSubmit) {
            onSubmit(transferData);
        }
    };

    return (
        <div
            style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                padding: "24px",
                boxShadow:
                    "0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)",
                border: "1px solid #e9ecef",
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "24px",
                }}
            >
                <span style={{ fontSize: "24px" }}>🔄</span>
                <div>
                    <h3
                        style={{
                            fontSize: "20px",
                            fontWeight: "600",
                            margin: "0",
                            color: "#2c3e50",
                        }}
                    >
                        Crear Transferencia Interna
                    </h3>
                    <p
                        style={{
                            fontSize: "14px",
                            color: "#6c757d",
                            margin: "4px 0 0 0",
                        }}
                    >
                        Complete los datos para crear una nueva transferencia
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: "24px" }}>
                    {/* Búsqueda de Producto */}
                    <div>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "8px",
                                fontWeight: "600",
                                fontSize: "14px",
                                color: "#2c3e50",
                            }}
                        >
                            Producto *
                        </label>
                        <ProductSearchSelector
                            onProductSelected={handleProductSelected}
                            onSelectionCleared={handleProductSelectionCleared}
                            placeholder="Buscar producto por nombre, SKU o código..."
                            showSelectedProduct={true}
                            allowClearSelection={true}
                            disabled={isLoading}
                        />
                        {errors.producto && (
                            <div
                                style={{
                                    marginTop: "8px",
                                    padding: "8px 12px",
                                    backgroundColor: "#f8d7da",
                                    border: "1px solid #f5c6cb",
                                    borderRadius: "4px",
                                    color: "#721c24",
                                    fontSize: "12px",
                                }}
                            >
                                {errors.producto}
                            </div>
                        )}
                    </div>
                </div>

                {/* Campos de Sede - Solo se muestran cuando hay producto seleccionado */}
                {selectedProduct && (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(250px, 1fr))",
                            gap: "20px",
                            marginBottom: "24px",
                        }}
                    >
                        {/* Sede Origen */}
                        <div>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontWeight: "600",
                                    fontSize: "14px",
                                    color: "#2c3e50",
                                }}
                            >
                                Sede Origen *
                            </label>
                            <select
                                name="sedeOrigen"
                                value={formData.sedeOrigen}
                                onChange={handleInputChange}
                                disabled={isLoadingUbicaciones || isLoading}
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    border: errors.sedeOrigen
                                        ? "2px solid #e74c3c"
                                        : "2px solid #e3eaf3",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    color: "#2c3e50",
                                    backgroundColor: "white",
                                    outline: "none",
                                    transition: "all 0.2s ease",
                                }}
                                onFocus={(e) =>
                                    (e.target.style.borderColor = "#3498db")
                                }
                                onBlur={(e) =>
                                    (e.target.style.borderColor =
                                        errors.sedeOrigen
                                            ? "#e74c3c"
                                            : "#e3eaf3")
                                }
                            >
                                <option value="">
                                    {isLoadingUbicaciones
                                        ? "Cargando..."
                                        : "Seleccionar sede origen"}
                                </option>
                                {ubicaciones.map((ubicacion) => (
                                    <option
                                        key={ubicacion.id}
                                        value={ubicacion.name}
                                    >
                                        {ubicacion.name}
                                    </option>
                                ))}
                            </select>
                            {errors.sedeOrigen && (
                                <div
                                    style={{
                                        marginTop: "8px",
                                        padding: "8px 12px",
                                        backgroundColor: "#f8d7da",
                                        border: "1px solid #f5c6cb",
                                        borderRadius: "4px",
                                        color: "#721c24",
                                        fontSize: "12px",
                                    }}
                                >
                                    {errors.sedeOrigen}
                                </div>
                            )}
                        </div>

                        {/* Sede Destino */}
                        <div>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontWeight: "600",
                                    fontSize: "14px",
                                    color: "#2c3e50",
                                }}
                            >
                                Sede Destino *
                            </label>
                            <select
                                name="sedeDestino"
                                value={formData.sedeDestino}
                                onChange={handleInputChange}
                                disabled={isLoadingUbicaciones || isLoading}
                                style={{
                                    width: "100%",
                                    padding: "12px 16px",
                                    border: errors.sedeDestino
                                        ? "2px solid #e74c3c"
                                        : "2px solid #e3eaf3",
                                    borderRadius: "8px",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    color: "#2c3e50",
                                    backgroundColor: "white",
                                    outline: "none",
                                    transition: "all 0.2s ease",
                                }}
                                onFocus={(e) =>
                                    (e.target.style.borderColor = "#3498db")
                                }
                                onBlur={(e) =>
                                    (e.target.style.borderColor =
                                        errors.sedeDestino
                                            ? "#e74c3c"
                                            : "#e3eaf3")
                                }
                            >
                                <option value="">
                                    {isLoadingUbicaciones
                                        ? "Cargando..."
                                        : "Seleccionar sede destino"}
                                </option>
                                {ubicaciones.map((ubicacion) => (
                                    <option
                                        key={ubicacion.id}
                                        value={ubicacion.name}
                                    >
                                        {ubicacion.name}
                                    </option>
                                ))}
                            </select>
                            {errors.sedeDestino && (
                                <div
                                    style={{
                                        marginTop: "8px",
                                        padding: "8px 12px",
                                        backgroundColor: "#f8d7da",
                                        border: "1px solid #f5c6cb",
                                        borderRadius: "4px",
                                        color: "#721c24",
                                        fontSize: "12px",
                                    }}
                                >
                                    {errors.sedeDestino}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Información de Stock - Solo se muestra cuando hay producto y sede origen seleccionados */}
                {selectedProduct && formData.sedeOrigen && (
                    <div style={{ marginBottom: "24px" }}>
                        {/* Información de Stock */}
                        {stockInfo && (
                            <div
                                style={{
                                    backgroundColor: "#e8f4fd",
                                    border: "1px solid #b8daff",
                                    borderRadius: "8px",
                                    padding: "16px",
                                    marginBottom: "16px",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        color: "#004085",
                                        marginBottom: "8px",
                                    }}
                                >
                                    📦 Stock Disponible
                                </div>
                                <div
                                    style={{
                                        fontSize: "13px",
                                        color: "#004085",
                                    }}
                                >
                                    <strong>Ubicación:</strong>{" "}
                                    {stockInfo.location}
                                </div>
                                <div
                                    style={{
                                        fontSize: "13px",
                                        color: "#004085",
                                    }}
                                >
                                    <strong>Stock Total:</strong>{" "}
                                    {stockInfo.availableStock} unidades
                                </div>

                                {/* Información específica de lotes */}
                                {productRequiresBatches && (
                                    <>
                                        <div
                                            style={{
                                                fontSize: "13px",
                                                color: "#004085",
                                            }}
                                        >
                                            <strong>Lotes Disponibles:</strong>{" "}
                                            {stockInfo.batchCount}
                                        </div>
                                        {stockInfo.hasExpiredBatches && (
                                            <div
                                                style={{
                                                    fontSize: "12px",
                                                    color: "#dc3545",
                                                    marginTop: "4px",
                                                }}
                                            >
                                                ⚠️ Incluye lotes vencidos
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}

                        {/* Selección de Lotes */}
                        {productRequiresBatches &&
                            availableBatches.length > 0 && (
                                <div
                                    style={{
                                        backgroundColor: "#fff3cd",
                                        border: "1px solid #ffeaa7",
                                        borderRadius: "8px",
                                        padding: "16px",
                                        marginBottom: "16px",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            color: "#856404",
                                            marginBottom: "12px",
                                        }}
                                    >
                                        📋 Seleccionar Lotes y Cantidades
                                    </div>
                                    <div
                                        style={{
                                            maxHeight: "300px",
                                            overflowY: "auto",
                                            border: "1px solid #ffeaa7",
                                            borderRadius: "4px",
                                            backgroundColor: "white",
                                        }}
                                    >
                                        {availableBatches.map(
                                            (batch, index) => (
                                                <div
                                                    key={
                                                        batch.batch_id || index
                                                    }
                                                    style={{
                                                        padding: "12px",
                                                        borderBottom:
                                                            index <
                                                            availableBatches.length -
                                                                1
                                                                ? "1px solid #f8f9fa"
                                                                : "none",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "12px",
                                                    }}
                                                >
                                                    {/* Checkbox para seleccionar lote */}
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            !!selectedBatches[
                                                                batch.batch_id
                                                            ]
                                                        }
                                                        onChange={(e) =>
                                                            handleBatchSelection(
                                                                batch.batch_id,
                                                                e.target.checked
                                                            )
                                                        }
                                                        style={{
                                                            width: "16px",
                                                            height: "16px",
                                                            cursor: "pointer",
                                                        }}
                                                    />

                                                    {/* Información del lote */}
                                                    <div style={{ flex: 1 }}>
                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "12px",
                                                                fontWeight:
                                                                    "600",
                                                                color: "#2c3e50",
                                                            }}
                                                        >
                                                            Lote:{" "}
                                                            {batch.batch_number}
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "11px",
                                                                color: "#6c757d",
                                                            }}
                                                        >
                                                            Disponible:{" "}
                                                            {batch.quantity}{" "}
                                                            unidades
                                                        </div>
                                                        {batch.expiry_date && (
                                                            <div
                                                                style={{
                                                                    fontSize:
                                                                        "11px",
                                                                    color: batch.is_expired
                                                                        ? "#dc3545"
                                                                        : batch.days_to_expiry <=
                                                                          30
                                                                        ? "#ffc107"
                                                                        : "#28a745",
                                                                    fontWeight:
                                                                        "500",
                                                                }}
                                                            >
                                                                Vence:{" "}
                                                                {new Date(
                                                                    batch.expiry_date
                                                                ).toLocaleDateString()}
                                                                {batch.days_to_expiry !==
                                                                    null && (
                                                                    <span>
                                                                        {" "}
                                                                        (
                                                                        {
                                                                            batch.days_to_expiry
                                                                        }{" "}
                                                                        días)
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Campo de cantidad */}
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            gap: "8px",
                                                        }}
                                                    >
                                                        <label
                                                            style={{
                                                                fontSize:
                                                                    "11px",
                                                                color: "#6c757d",
                                                                whiteSpace:
                                                                    "nowrap",
                                                            }}
                                                        >
                                                            Cantidad:
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max={batch.quantity}
                                                            value={
                                                                selectedBatches[
                                                                    batch
                                                                        .batch_id
                                                                ]?.quantity || 0
                                                            }
                                                            onChange={(e) =>
                                                                handleBatchQuantityChange(
                                                                    batch.batch_id,
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            disabled={
                                                                !selectedBatches[
                                                                    batch
                                                                        .batch_id
                                                                ]
                                                            }
                                                            style={{
                                                                width: "60px",
                                                                padding:
                                                                    "4px 8px",
                                                                border: "1px solid #ddd",
                                                                borderRadius:
                                                                    "4px",
                                                                fontSize:
                                                                    "12px",
                                                                textAlign:
                                                                    "center",
                                                            }}
                                                        />
                                                    </div>

                                                    {/* Indicadores de estado */}
                                                    <div
                                                        style={{
                                                            marginLeft: "8px",
                                                        }}
                                                    >
                                                        {batch.is_expired && (
                                                            <span
                                                                style={{
                                                                    fontSize:
                                                                        "10px",
                                                                    color: "#dc3545",
                                                                    fontWeight:
                                                                        "600",
                                                                }}
                                                            >
                                                                VENCIDO
                                                            </span>
                                                        )}
                                                        {!batch.is_expired &&
                                                            batch.days_to_expiry <=
                                                                30 && (
                                                                <span
                                                                    style={{
                                                                        fontSize:
                                                                            "10px",
                                                                        color: "#ffc107",
                                                                        fontWeight:
                                                                            "600",
                                                                    }}
                                                                >
                                                                    PRÓXIMO
                                                                </span>
                                                            )}
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>

                                    {/* Resumen de cantidad total */}
                                    <div
                                        style={{
                                            marginTop: "12px",
                                            padding: "8px 12px",
                                            backgroundColor: "#e8f4fd",
                                            border: "1px solid #b8daff",
                                            borderRadius: "4px",
                                            fontSize: "13px",
                                            color: "#004085",
                                            fontWeight: "500",
                                        }}
                                    >
                                        Cantidad total seleccionada:{" "}
                                        <strong>
                                            {getTotalSelectedQuantity()}
                                        </strong>{" "}
                                        unidades
                                    </div>

                                    {errors.lotes && (
                                        <div
                                            style={{
                                                marginTop: "8px",
                                                padding: "8px 12px",
                                                backgroundColor: "#f8d7da",
                                                border: "1px solid #f5c6cb",
                                                borderRadius: "4px",
                                                color: "#721c24",
                                                fontSize: "12px",
                                            }}
                                        >
                                            {errors.lotes}
                                        </div>
                                    )}
                                </div>
                            )}

                        {/* Loading de lotes */}
                        {productRequiresBatches && isLoadingBatches && (
                            <div
                                style={{
                                    backgroundColor: "#e8f4fd",
                                    border: "1px solid #b8daff",
                                    borderRadius: "8px",
                                    padding: "12px",
                                    marginBottom: "16px",
                                    textAlign: "center",
                                    color: "#004085",
                                    fontSize: "14px",
                                }}
                            >
                                ⏳ Cargando información de lotes...
                            </div>
                        )}

                        {stockError && (
                            <div
                                style={{
                                    marginBottom: "16px",
                                    padding: "8px 12px",
                                    backgroundColor: "#f8d7da",
                                    border: "1px solid #f5c6cb",
                                    borderRadius: "4px",
                                    color: "#721c24",
                                    fontSize: "12px",
                                }}
                            >
                                {stockError}
                            </div>
                        )}

                        {batchesError && (
                            <div
                                style={{
                                    marginBottom: "16px",
                                    padding: "8px 12px",
                                    backgroundColor: "#f8d7da",
                                    border: "1px solid #f5c6cb",
                                    borderRadius: "4px",
                                    color: "#721c24",
                                    fontSize: "12px",
                                }}
                            >
                                {batchesError}
                            </div>
                        )}
                    </div>
                )}

                {/* Campo de Cantidad - Solo se muestra cuando hay producto seleccionado y NO requiere control de lotes */}
                {selectedProduct && !productRequiresBatches && (
                    <div style={{ marginBottom: "24px" }}>
                        <label
                            style={{
                                display: "block",
                                marginBottom: "8px",
                                fontWeight: "600",
                                fontSize: "14px",
                                color: "#2c3e50",
                            }}
                        >
                            Cantidad *
                        </label>
                        <input
                            type="number"
                            name="cantidad"
                            value={formData.cantidad}
                            onChange={handleInputChange}
                            disabled={isLoading}
                            min="1"
                            style={{
                                width: "100%",
                                maxWidth: "300px",
                                padding: "12px 16px",
                                border: errors.cantidad
                                    ? "2px solid #e74c3c"
                                    : "2px solid #e3eaf3",
                                borderRadius: "8px",
                                fontSize: "14px",
                                fontWeight: "500",
                                color: "#2c3e50",
                                backgroundColor: "white",
                                outline: "none",
                                transition: "all 0.2s ease",
                            }}
                            onFocus={(e) =>
                                (e.target.style.borderColor = "#3498db")
                            }
                            onBlur={(e) =>
                                (e.target.style.borderColor = errors.cantidad
                                    ? "#e74c3c"
                                    : "#e3eaf3")
                            }
                            placeholder="Ingrese la cantidad"
                        />
                        {errors.cantidad && (
                            <div
                                style={{
                                    marginTop: "8px",
                                    padding: "8px 12px",
                                    backgroundColor: "#f8d7da",
                                    border: "1px solid #f5c6cb",
                                    borderRadius: "4px",
                                    color: "#721c24",
                                    fontSize: "12px",
                                }}
                            >
                                {errors.cantidad}
                            </div>
                        )}
                    </div>
                )}

                {/* Motivo */}
                <div style={{ marginBottom: "24px" }}>
                    <label
                        style={{
                            display: "block",
                            marginBottom: "8px",
                            fontWeight: "600",
                            fontSize: "14px",
                            color: "#2c3e50",
                        }}
                    >
                        Motivo de la Transferencia *
                    </label>
                    <textarea
                        name="motivo"
                        value={formData.motivo}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        rows="3"
                        style={{
                            width: "100%",
                            padding: "12px 16px",
                            border: errors.motivo
                                ? "2px solid #e74c3c"
                                : "2px solid #e3eaf3",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: "500",
                            color: "#2c3e50",
                            backgroundColor: "white",
                            outline: "none",
                            transition: "all 0.2s ease",
                            resize: "vertical",
                        }}
                        onFocus={(e) =>
                            (e.target.style.borderColor = "#3498db")
                        }
                        onBlur={(e) =>
                            (e.target.style.borderColor = errors.motivo
                                ? "#e74c3c"
                                : "#e3eaf3")
                        }
                        placeholder="Transferencia interna - Describa el motivo adicional..."
                    />
                    {errors.motivo && (
                        <div
                            style={{
                                marginTop: "8px",
                                padding: "8px 12px",
                                backgroundColor: "#f8d7da",
                                border: "1px solid #f5c6cb",
                                borderRadius: "4px",
                                color: "#721c24",
                                fontSize: "12px",
                            }}
                        >
                            {errors.motivo}
                        </div>
                    )}
                </div>

                {/* Botones de Acción */}
                <div
                    style={{
                        display: "flex",
                        gap: "12px",
                        justifyContent: "flex-end",
                    }}
                >
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                        style={{
                            padding: "12px 24px",
                            border: "2px solid #6c757d",
                            borderRadius: "8px",
                            backgroundColor: "transparent",
                            color: "#6c757d",
                            fontSize: "14px",
                            fontWeight: "600",
                            cursor: isLoading ? "not-allowed" : "pointer",
                            transition: "all 0.2s ease",
                            opacity: isLoading ? 0.6 : 1,
                        }}
                        onMouseOver={(e) => {
                            if (!isLoading) {
                                e.target.style.backgroundColor = "#6c757d";
                                e.target.style.color = "white";
                            }
                        }}
                        onMouseOut={(e) => {
                            if (!isLoading) {
                                e.target.style.backgroundColor = "transparent";
                                e.target.style.color = "#6c757d";
                            }
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        style={{
                            padding: "12px 24px",
                            border: "none",
                            borderRadius: "8px",
                            backgroundColor: isLoading ? "#6c757d" : "#3498db",
                            color: "white",
                            fontSize: "14px",
                            fontWeight: "600",
                            cursor: isLoading ? "not-allowed" : "pointer",
                            transition: "all 0.2s ease",
                            opacity: isLoading ? 0.6 : 1,
                        }}
                        onMouseOver={(e) => {
                            if (!isLoading) {
                                e.target.style.backgroundColor = "#2980b9";
                            }
                        }}
                        onMouseOut={(e) => {
                            if (!isLoading) {
                                e.target.style.backgroundColor = "#3498db";
                            }
                        }}
                    >
                        {isLoading ? "Creando..." : "Crear Transferencia"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateTransferForm;
