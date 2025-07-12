import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import ProductSearchSelector from "../Common/ProductSearchSelector";
import inventoryService from "../../services/inventoryService";
import transfersService from "../../services/transfersService";
import batchesService from "../../services/batchesService";

const SimpleTransferForm = ({ onTransferCreated, onNotification }) => {
    const { authToken } = useAuth();

    // Estado del formulario
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [formData, setFormData] = useState({
        sedeOrigen: "",
        sedeDestino: "",
        cantidad: "",
        notas: "",
    });

    // Estados para ubicaciones
    const [ubicaciones, setUbicaciones] = useState([]);
    const [isLoadingUbicaciones, setIsLoadingUbicaciones] = useState(false);

    // Estados de validación y carga
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Estados para stock y lotes
    const [stockInfo, setStockInfo] = useState(null);
    const [availableBatches, setAvailableBatches] = useState([]);
    const [isLoadingStock, setIsLoadingStock] = useState(false);
    const [productRequiresBatches, setProductRequiresBatches] = useState(false);
    const [selectedBatchQuantities, setSelectedBatchQuantities] = useState({});

    // Cargar ubicaciones
    const loadUbicaciones = useCallback(async () => {
        if (!authToken) return;

        setIsLoadingUbicaciones(true);
        try {
            const data = await inventoryService.getLocations(authToken);
            setUbicaciones(data || []);
        } catch (error) {
            console.error("Error al cargar ubicaciones:", error);
            setUbicaciones([]);
            onNotification?.({
                show: true,
                type: "error",
                message: "Error al cargar las ubicaciones",
            });
        } finally {
            setIsLoadingUbicaciones(false);
        }
    }, [authToken, onNotification]);

    // Cargar ubicaciones al montar el componente
    useEffect(() => {
        if (authToken) {
            loadUbicaciones();
        }
    }, [authToken, loadUbicaciones]);

    // Manejar selección de producto
    const handleProductSelected = (product) => {
        setSelectedProduct(product);
        setErrors({}); // Limpiar errores al seleccionar producto

        // Detectar inmediatamente si el producto requiere control de lotes
        const requiresBatches = batchesService.requiresBatchControl(product);
        setProductRequiresBatches(requiresBatches);

        // Limpiar información de stock y lotes anterior
        setStockInfo(null);
        setAvailableBatches([]);
        setSelectedBatchQuantities({});

        // Si ya hay una sede de origen seleccionada, cargar el stock
        if (formData.sedeOrigen) {
            loadProductStock(product.id, formData.sedeOrigen);
        }
    };

    // Manejar limpieza de selección de producto
    const handleProductSelectionCleared = () => {
        setSelectedProduct(null);
        setFormData({
            sedeOrigen: "",
            sedeDestino: "",
            cantidad: "",
            notas: "",
        });
        setErrors({});
        setStockInfo(null);
        setAvailableBatches([]);
        setProductRequiresBatches(false);
        setSelectedBatchQuantities({});
    };

    // Cargar stock del producto en la sede de origen
    const loadProductStock = useCallback(
        async (productId, locationName) => {
            if (!productId || !locationName || !authToken) return;

            setIsLoadingStock(true);
            try {
                // Buscar la ubicación por nombre para obtener su ID
                const location = ubicaciones.find(
                    (ub) => ub.name === locationName
                );
                if (!location) {
                    throw new Error(
                        `No se encontró la ubicación: ${locationName}`
                    );
                }

                // Obtener stock del producto en la ubicación
                const stock = await inventoryService.getProductStockAtLocation(
                    productId,
                    location.id,
                    authToken
                );

                setStockInfo({
                    totalStock: stock || 0,
                    locationName: locationName,
                    locationId: location.id,
                });

                // Si el producto requiere control de lotes, cargar la información de lotes
                if (productRequiresBatches) {
                    try {
                        const batchesResponse =
                            await inventoryService.getBatchesWithStockAtLocation(
                                productId,
                                location.id,
                                authToken
                            );

                        // Filtrar lotes con stock disponible
                        setAvailableBatches(
                            batchesResponse.filter(
                                (batch) => batch.quantity > 0
                            )
                        );
                    } catch (batchError) {
                        console.log("Error al cargar lotes:", batchError);
                        setAvailableBatches([]);
                    }
                } else {
                    // El producto no requiere control de lotes
                    setAvailableBatches([]);
                }
            } catch (error) {
                console.error("Error al cargar stock:", error);
                setStockInfo(null);
                setAvailableBatches([]);
                setProductRequiresBatches(false);
                onNotification?.({
                    show: true,
                    type: "error",
                    message: "Error al cargar información de stock",
                });
            } finally {
                setIsLoadingStock(false);
            }
        },
        [authToken, ubicaciones, onNotification, productRequiresBatches]
    );

    // Obtener ID único del lote (usar el campo 'batch' que es el ID real del lote)
    const getBatchId = (batch) => batch.batch || batch.batch_id || batch.id;

    // Manejar cambio de cantidad para un lote específico
    const handleBatchQuantityChange = (batchId, quantity) => {
        const batch = availableBatches.find((b) => getBatchId(b) === batchId);
        if (!batch) return;

        const newQuantity = Math.max(
            0,
            Math.min(parseInt(quantity) || 0, batch.quantity)
        );

        setSelectedBatchQuantities((prev) => ({
            ...prev,
            [batchId]: newQuantity,
        }));

        // Limpiar errores relacionados con lotes si existen
        if (errors.lotes) {
            setErrors((prev) => ({
                ...prev,
                lotes: "",
            }));
        }
    };

    // Función para seleccionar todo el lote
    const selectFullBatch = (batchId) => {
        const batch = availableBatches.find((b) => getBatchId(b) === batchId);
        if (!batch) return;

        setSelectedBatchQuantities((prev) => ({
            ...prev,
            [batchId]: batch.quantity,
        }));
    };

    // Función para limpiar la selección de un lote
    const clearBatchSelection = (batchId) => {
        setSelectedBatchQuantities((prev) => ({
            ...prev,
            [batchId]: 0,
        }));
    };

    // Calcular el total de unidades seleccionadas de lotes
    const getTotalSelectedBatchQuantity = () => {
        return Object.values(selectedBatchQuantities).reduce(
            (total, qty) => total + (qty || 0),
            0
        );
    };

    // Manejar cambios en los campos del formulario
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Validación especial para el campo de cantidad
        if (name === "cantidad") {
            const cantidad = parseInt(value) || 0;

            // Validación en tiempo real: no permitir cantidades mayores al stock disponible
            if (stockInfo && cantidad > stockInfo.totalStock) {
                // No actualizar el valor, mantener el anterior
                setErrors({
                    ...errors,
                    cantidad: `La cantidad no puede exceder el stock disponible (${stockInfo.totalStock})`,
                });
                return; // Salir sin actualizar el estado
            }

            // Si la cantidad es válida, limpiar error si existía
            if (errors.cantidad && cantidad <= (stockInfo?.totalStock || 0)) {
                setErrors({
                    ...errors,
                    cantidad: "",
                });
            }
        }

        setFormData({
            ...formData,
            [name]: value,
        });

        // Limpiar error del campo modificado (excepto cantidad que se maneja arriba)
        if (errors[name] && name !== "cantidad") {
            setErrors({
                ...errors,
                [name]: "",
            });
        }

        // Si cambió la sede de origen y hay producto seleccionado, cargar stock
        if (name === "sedeOrigen" && value && selectedProduct) {
            loadProductStock(selectedProduct.id, value);
        }

        // Si cambió la sede de origen, limpiar la sede de destino si es la misma
        if (name === "sedeOrigen" && value === formData.sedeDestino) {
            setFormData((prev) => ({
                ...prev,
                [name]: value,
                sedeDestino: "",
            }));
        }
    };

    // Validar formulario
    const validateForm = () => {
        const newErrors = {};

        if (!selectedProduct) {
            newErrors.producto = "Debe seleccionar un producto";
        }

        if (!formData.sedeOrigen) {
            newErrors.sedeOrigen = "Debe seleccionar la sede de origen";
        }

        if (!formData.sedeDestino) {
            newErrors.sedeDestino = "Debe seleccionar la sede de destino";
        }

        if (formData.sedeOrigen === formData.sedeDestino) {
            newErrors.sedeDestino =
                "La sede de destino debe ser diferente a la de origen";
        }

        // Validación de cantidad solo para productos SIN control de lotes
        if (!productRequiresBatches) {
            if (!formData.cantidad || parseInt(formData.cantidad) <= 0) {
                newErrors.cantidad =
                    "Debe ingresar una cantidad válida mayor a 0";
            }

            // Validar que no exceda el stock disponible
            if (
                stockInfo &&
                formData.cantidad &&
                parseInt(formData.cantidad) > stockInfo.totalStock
            ) {
                newErrors.cantidad = `La cantidad no puede exceder el stock disponible (${stockInfo.totalStock})`;
            }

            // Validar que haya stock disponible
            if (stockInfo && stockInfo.totalStock === 0) {
                newErrors.cantidad =
                    "No hay stock disponible en la sede de origen";
            }
        }

        // Validación para productos con control de lotes
        if (productRequiresBatches) {
            const totalSelected = getTotalSelectedBatchQuantity();

            if (totalSelected === 0) {
                newErrors.lotes =
                    "Debe seleccionar al menos una cantidad de algún lote";
            } else if (availableBatches.length === 0) {
                newErrors.lotes = "No hay lotes disponibles para transferir";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Manejar envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            const transferData = {
                selectedProduct,
                ...formData,
                cantidad: productRequiresBatches
                    ? getTotalSelectedBatchQuantity()
                    : parseInt(formData.cantidad),
                tipoTransferencia: "Transferencia Interna",
                requiresBatchControl: productRequiresBatches,
                selectedBatches: productRequiresBatches
                    ? Object.entries(selectedBatchQuantities)
                          .filter(([batchId, quantity]) => quantity > 0)
                          .map(([batchId, quantity]) => {
                              const batch = availableBatches.find(
                                  (b) => getBatchId(b) === parseInt(batchId)
                              );
                              return {
                                  batch_id: getBatchId(batch),
                                  batch_number: batch.batch_number,
                                  selectedQuantity: quantity,
                                  availableStock: batch.quantity,
                                  expiry_date: batch.expiry_date,
                              };
                          })
                    : [],
            };

            const result = await transfersService.createTransfer(
                transferData,
                authToken
            );

            onNotification?.({
                show: true,
                type: "success",
                message: "Transferencia creada exitosamente",
            });

            // Limpiar formulario
            setSelectedProduct(null);
            setFormData({
                sedeOrigen: "",
                sedeDestino: "",
                cantidad: "",
                notas: "",
            });
            setErrors({});
            setSelectedBatchQuantities({});

            // Notificar al componente padre
            onTransferCreated?.(result);
        } catch (error) {
            console.error("Error al crear transferencia:", error);
            onNotification?.({
                show: true,
                type: "error",
                message: "Error al crear la transferencia: " + error.message,
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            style={{
                backgroundColor: "#fff",
                borderRadius: "12px",
                padding: "24px",
                marginBottom: "24px",
                border: "1px solid #e9ecef",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
        >
            {/* Encabezado */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "24px",
                }}
            >
                <div
                    style={{
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                        padding: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <span style={{ fontSize: "20px" }}>➕</span>
                </div>
                <h3
                    style={{
                        fontSize: "20px",
                        fontWeight: "600",
                        margin: "0",
                        color: "#2c3e50",
                    }}
                >
                    Crear Nueva Transferencia
                </h3>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Búsqueda de Producto */}
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
                        Producto *
                    </label>
                    <ProductSearchSelector
                        onProductSelected={handleProductSelected}
                        onSelectionCleared={handleProductSelectionCleared}
                        placeholder="Buscar producto por nombre, SKU o código..."
                        showSelectedProduct={true}
                        allowClearSelection={true}
                        disabled={isSubmitting}
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

                {/* Campos de Sede - Solo se muestran cuando hay producto seleccionado */}
                {selectedProduct && (
                    <>
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "20px",
                                marginBottom: "24px",
                            }}
                        >
                            {/* Sede de Origen */}
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
                                    Sede de Origen *
                                </label>
                                <select
                                    name="sedeOrigen"
                                    value={formData.sedeOrigen}
                                    onChange={handleInputChange}
                                    disabled={
                                        isLoadingUbicaciones || isSubmitting
                                    }
                                    style={{
                                        width: "100%",
                                        padding: "10px 12px",
                                        border: errors.sedeOrigen
                                            ? "1px solid #e74c3c"
                                            : "1px solid #dee2e6",
                                        borderRadius: "4px",
                                        fontSize: "14px",
                                        backgroundColor:
                                            isLoadingUbicaciones || isSubmitting
                                                ? "#f8f9fa"
                                                : "white",
                                        color:
                                            isLoadingUbicaciones || isSubmitting
                                                ? "#6c757d"
                                                : "#2c3e50",
                                    }}
                                >
                                    <option value="">
                                        {isLoadingUbicaciones
                                            ? "Cargando..."
                                            : "Seleccionar sede de origen"}
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

                            {/* Sede de Destino */}
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
                                    Sede de Destino *
                                </label>
                                <select
                                    name="sedeDestino"
                                    value={formData.sedeDestino}
                                    onChange={handleInputChange}
                                    disabled={
                                        isLoadingUbicaciones || isSubmitting
                                    }
                                    style={{
                                        width: "100%",
                                        padding: "10px 12px",
                                        border: errors.sedeDestino
                                            ? "1px solid #e74c3c"
                                            : "1px solid #dee2e6",
                                        borderRadius: "4px",
                                        fontSize: "14px",
                                        backgroundColor:
                                            isLoadingUbicaciones || isSubmitting
                                                ? "#f8f9fa"
                                                : "white",
                                        color:
                                            isLoadingUbicaciones || isSubmitting
                                                ? "#6c757d"
                                                : "#2c3e50",
                                    }}
                                >
                                    <option value="">
                                        {isLoadingUbicaciones
                                            ? "Cargando..."
                                            : "Seleccionar sede de destino"}
                                    </option>
                                    {ubicaciones
                                        .filter(
                                            (ubicacion) =>
                                                ubicacion.name !==
                                                formData.sedeOrigen
                                        )
                                        .map((ubicacion) => (
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

                        {/* Información de Stock - Solo se muestra cuando hay sede de origen seleccionada */}
                        {formData.sedeOrigen && (
                            <div
                                style={{
                                    backgroundColor: "#f8f9fa",
                                    borderRadius: "8px",
                                    padding: "20px",
                                    marginBottom: "24px",
                                    border: "1px solid #e9ecef",
                                }}
                            >
                                <h4
                                    style={{
                                        fontSize: "16px",
                                        fontWeight: "600",
                                        color: "#2c3e50",
                                        margin: "0 0 16px 0",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    📊 Stock Disponible en {formData.sedeOrigen}
                                </h4>

                                {isLoadingStock ? (
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            color: "#6c757d",
                                        }}
                                    >
                                        <span style={{ fontSize: "16px" }}>
                                            ⏳
                                        </span>
                                        Cargando información de stock...
                                    </div>
                                ) : stockInfo ? (
                                    <div>
                                        {/* Stock Total */}
                                        <div
                                            style={{
                                                backgroundColor: "white",
                                                borderRadius: "6px",
                                                padding: "12px 16px",
                                                marginBottom: "16px",
                                                border: "1px solid #dee2e6",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontWeight: "500",
                                                    color: "#495057",
                                                }}
                                            >
                                                Stock Total:
                                            </span>
                                            <span
                                                style={{
                                                    fontWeight: "600",
                                                    fontSize: "16px",
                                                    color:
                                                        stockInfo.totalStock > 0
                                                            ? "#28a745"
                                                            : "#dc3545",
                                                }}
                                            >
                                                {stockInfo.totalStock} unidades
                                            </span>
                                        </div>

                                        {/* Información de Lotes */}
                                        {productRequiresBatches &&
                                            availableBatches.length > 0 && (
                                                <div>
                                                    <h5
                                                        style={{
                                                            fontSize: "14px",
                                                            fontWeight: "600",
                                                            color: "#2c3e50",
                                                            margin: "0 0 12px 0",
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            gap: "6px",
                                                        }}
                                                    >
                                                        📦 Seleccionar Lotes a
                                                        Transferir:
                                                    </h5>

                                                    <div
                                                        style={{
                                                            maxHeight: "300px",
                                                            overflowY: "auto",
                                                            backgroundColor:
                                                                "white",
                                                            borderRadius: "6px",
                                                            border: "1px solid #dee2e6",
                                                        }}
                                                    >
                                                        {availableBatches.map(
                                                            (batch, index) => (
                                                                <div
                                                                    key={
                                                                        batch.batch_id ||
                                                                        batch.id
                                                                    }
                                                                    style={{
                                                                        padding:
                                                                            "16px",
                                                                        borderBottom:
                                                                            index <
                                                                            availableBatches.length -
                                                                                1
                                                                                ? "1px solid #f1f3f4"
                                                                                : "none",
                                                                    }}
                                                                >
                                                                    <div
                                                                        style={{
                                                                            display:
                                                                                "flex",
                                                                            justifyContent:
                                                                                "space-between",
                                                                            alignItems:
                                                                                "flex-start",
                                                                            marginBottom:
                                                                                "12px",
                                                                        }}
                                                                    >
                                                                        <div
                                                                            style={{
                                                                                flex: 1,
                                                                            }}
                                                                        >
                                                                            <div
                                                                                style={{
                                                                                    fontWeight:
                                                                                        "500",
                                                                                    color: "#2c3e50",
                                                                                    marginBottom:
                                                                                        "4px",
                                                                                }}
                                                                            >
                                                                                Lote:{" "}
                                                                                {
                                                                                    batch.batch_number
                                                                                }
                                                                            </div>
                                                                            {batch.expiry_date && (
                                                                                <div
                                                                                    style={{
                                                                                        fontSize:
                                                                                            "12px",
                                                                                        color: "#6c757d",
                                                                                    }}
                                                                                >
                                                                                    Vencimiento:{" "}
                                                                                    {new Date(
                                                                                        batch.expiry_date
                                                                                    ).toLocaleDateString()}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div
                                                                            style={{
                                                                                fontWeight:
                                                                                    "600",
                                                                                color: "#28a745",
                                                                                fontSize:
                                                                                    "14px",
                                                                            }}
                                                                        >
                                                                            Disponible:{" "}
                                                                            {
                                                                                batch.quantity
                                                                            }
                                                                        </div>
                                                                    </div>

                                                                    {/* Controles de cantidad */}
                                                                    <div
                                                                        style={{
                                                                            display:
                                                                                "flex",
                                                                            alignItems:
                                                                                "center",
                                                                            gap: "12px",
                                                                            flexWrap:
                                                                                "wrap",
                                                                        }}
                                                                    >
                                                                        <div
                                                                            style={{
                                                                                display:
                                                                                    "flex",
                                                                                alignItems:
                                                                                    "center",
                                                                                gap: "8px",
                                                                            }}
                                                                        >
                                                                            <label
                                                                                style={{
                                                                                    fontSize:
                                                                                        "13px",
                                                                                    fontWeight:
                                                                                        "500",
                                                                                    color: "#495057",
                                                                                    minWidth:
                                                                                        "60px",
                                                                                }}
                                                                            >
                                                                                Cantidad:
                                                                            </label>
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                max={
                                                                                    batch.quantity
                                                                                }
                                                                                value={
                                                                                    selectedBatchQuantities[
                                                                                        getBatchId(
                                                                                            batch
                                                                                        )
                                                                                    ] ||
                                                                                    0
                                                                                }
                                                                                onChange={(
                                                                                    e
                                                                                ) =>
                                                                                    handleBatchQuantityChange(
                                                                                        getBatchId(
                                                                                            batch
                                                                                        ),
                                                                                        e
                                                                                            .target
                                                                                            .value
                                                                                    )
                                                                                }
                                                                                disabled={
                                                                                    isSubmitting
                                                                                }
                                                                                style={{
                                                                                    width: "80px",
                                                                                    padding:
                                                                                        "6px 8px",
                                                                                    border: "1px solid #dee2e6",
                                                                                    borderRadius:
                                                                                        "4px",
                                                                                    fontSize:
                                                                                        "13px",
                                                                                    textAlign:
                                                                                        "center",
                                                                                    backgroundColor:
                                                                                        isSubmitting
                                                                                            ? "#f8f9fa"
                                                                                            : "white",
                                                                                }}
                                                                            />
                                                                        </div>

                                                                        <div
                                                                            style={{
                                                                                display:
                                                                                    "flex",
                                                                                gap: "8px",
                                                                            }}
                                                                        >
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    selectFullBatch(
                                                                                        getBatchId(
                                                                                            batch
                                                                                        )
                                                                                    )
                                                                                }
                                                                                disabled={
                                                                                    isSubmitting
                                                                                }
                                                                                style={{
                                                                                    padding:
                                                                                        "4px 8px",
                                                                                    fontSize:
                                                                                        "11px",
                                                                                    fontWeight:
                                                                                        "500",
                                                                                    border: "1px solid #28a745",
                                                                                    borderRadius:
                                                                                        "4px",
                                                                                    backgroundColor:
                                                                                        "white",
                                                                                    color: "#28a745",
                                                                                    cursor: isSubmitting
                                                                                        ? "not-allowed"
                                                                                        : "pointer",
                                                                                    transition:
                                                                                        "all 0.2s",
                                                                                }}
                                                                                onMouseEnter={(
                                                                                    e
                                                                                ) => {
                                                                                    if (
                                                                                        !isSubmitting
                                                                                    ) {
                                                                                        e.target.style.backgroundColor =
                                                                                            "#28a745";
                                                                                        e.target.style.color =
                                                                                            "white";
                                                                                    }
                                                                                }}
                                                                                onMouseLeave={(
                                                                                    e
                                                                                ) => {
                                                                                    if (
                                                                                        !isSubmitting
                                                                                    ) {
                                                                                        e.target.style.backgroundColor =
                                                                                            "white";
                                                                                        e.target.style.color =
                                                                                            "#28a745";
                                                                                    }
                                                                                }}
                                                                            >
                                                                                Todo
                                                                                (
                                                                                {
                                                                                    batch.quantity
                                                                                }

                                                                                )
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    clearBatchSelection(
                                                                                        getBatchId(
                                                                                            batch
                                                                                        )
                                                                                    )
                                                                                }
                                                                                disabled={
                                                                                    isSubmitting
                                                                                }
                                                                                style={{
                                                                                    padding:
                                                                                        "4px 8px",
                                                                                    fontSize:
                                                                                        "11px",
                                                                                    fontWeight:
                                                                                        "500",
                                                                                    border: "1px solid #dc3545",
                                                                                    borderRadius:
                                                                                        "4px",
                                                                                    backgroundColor:
                                                                                        "white",
                                                                                    color: "#dc3545",
                                                                                    cursor: isSubmitting
                                                                                        ? "not-allowed"
                                                                                        : "pointer",
                                                                                    transition:
                                                                                        "all 0.2s",
                                                                                }}
                                                                                onMouseEnter={(
                                                                                    e
                                                                                ) => {
                                                                                    if (
                                                                                        !isSubmitting
                                                                                    ) {
                                                                                        e.target.style.backgroundColor =
                                                                                            "#dc3545";
                                                                                        e.target.style.color =
                                                                                            "white";
                                                                                    }
                                                                                }}
                                                                                onMouseLeave={(
                                                                                    e
                                                                                ) => {
                                                                                    if (
                                                                                        !isSubmitting
                                                                                    ) {
                                                                                        e.target.style.backgroundColor =
                                                                                            "white";
                                                                                        e.target.style.color =
                                                                                            "#dc3545";
                                                                                    }
                                                                                }}
                                                                            >
                                                                                Limpiar
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>

                                                    {/* Resumen de selección */}
                                                    <div
                                                        style={{
                                                            marginTop: "12px",
                                                            padding: "12px",
                                                            backgroundColor:
                                                                "#f8f9fa",
                                                            borderRadius: "6px",
                                                            border: "1px solid #e9ecef",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "14px",
                                                                fontWeight:
                                                                    "600",
                                                                color: "#2c3e50",
                                                                display: "flex",
                                                                justifyContent:
                                                                    "space-between",
                                                                alignItems:
                                                                    "center",
                                                            }}
                                                        >
                                                            <span>
                                                                Total a
                                                                transferir:
                                                            </span>
                                                            <span
                                                                style={{
                                                                    color: "#28a745",
                                                                }}
                                                            >
                                                                {getTotalSelectedBatchQuantity()}{" "}
                                                                unidades
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {errors.lotes && (
                                                        <div
                                                            style={{
                                                                marginTop:
                                                                    "8px",
                                                                padding:
                                                                    "8px 12px",
                                                                backgroundColor:
                                                                    "#f8d7da",
                                                                border: "1px solid #f5c6cb",
                                                                borderRadius:
                                                                    "4px",
                                                                color: "#721c24",
                                                                fontSize:
                                                                    "12px",
                                                            }}
                                                        >
                                                            {errors.lotes}
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                        {/* Mensaje cuando no hay lotes pero el producto soporta lotes */}
                                        {productRequiresBatches &&
                                            availableBatches.length === 0 && (
                                                <div
                                                    style={{
                                                        backgroundColor:
                                                            "#fff3cd",
                                                        border: "1px solid #ffeaa7",
                                                        borderRadius: "6px",
                                                        padding: "12px",
                                                        color: "#856404",
                                                        fontSize: "14px",
                                                    }}
                                                >
                                                    ⚠️ Este producto maneja
                                                    lotes pero no hay lotes
                                                    disponibles en esta sede.
                                                </div>
                                            )}
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            backgroundColor: "#f8d7da",
                                            border: "1px solid #f5c6cb",
                                            borderRadius: "6px",
                                            padding: "12px",
                                            color: "#721c24",
                                            fontSize: "14px",
                                        }}
                                    >
                                        ❌ No se pudo cargar la información de
                                        stock.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Campo de Cantidad - Layout condicional */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: !productRequiresBatches
                                    ? "1fr"
                                    : "1fr",
                                gap: "20px",
                                marginBottom: "24px",
                            }}
                        >
                            {/* Cantidad - Solo para productos SIN control de lotes */}
                            {!productRequiresBatches && (
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
                                        Cantidad *
                                        {stockInfo && (
                                            <span
                                                style={{
                                                    fontSize: "12px",
                                                    fontWeight: "400",
                                                    color: "#6c757d",
                                                    marginLeft: "8px",
                                                }}
                                            >
                                                (Máx: {stockInfo.totalStock})
                                            </span>
                                        )}
                                    </label>
                                    <input
                                        type="number"
                                        name="cantidad"
                                        value={formData.cantidad}
                                        onChange={handleInputChange}
                                        min="1"
                                        max={stockInfo?.totalStock || undefined}
                                        step="1"
                                        disabled={isSubmitting || !stockInfo}
                                        style={{
                                            width: "100%",
                                            padding: "10px 12px",
                                            border: errors.cantidad
                                                ? "1px solid #e74c3c"
                                                : "1px solid #dee2e6",
                                            borderRadius: "4px",
                                            fontSize: "14px",
                                            backgroundColor:
                                                isSubmitting || !stockInfo
                                                    ? "#f8f9fa"
                                                    : "white",
                                            color:
                                                isSubmitting || !stockInfo
                                                    ? "#6c757d"
                                                    : "#2c3e50",
                                        }}
                                        placeholder={
                                            stockInfo
                                                ? "Ingrese la cantidad"
                                                : "Seleccione sede origen primero"
                                        }
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
                                    {stockInfo &&
                                        stockInfo.totalStock === 0 && (
                                            <div
                                                style={{
                                                    marginTop: "8px",
                                                    padding: "8px 12px",
                                                    backgroundColor: "#fff3cd",
                                                    border: "1px solid #ffeaa7",
                                                    borderRadius: "4px",
                                                    color: "#856404",
                                                    fontSize: "12px",
                                                }}
                                            >
                                                ⚠️ No hay stock disponible en
                                                esta sede
                                            </div>
                                        )}
                                </div>
                            )}

                            {/* Información para productos CON lotes */}
                            {productRequiresBatches && (
                                <div
                                    style={{
                                        backgroundColor: "#e3f2fd",
                                        borderRadius: "6px",
                                        padding: "16px",
                                        border: "1px solid #bbdefb",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            color: "#1565c0",
                                            marginBottom: "8px",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                        }}
                                    >
                                        📦 Producto con Control de Lotes
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "13px",
                                            color: "#1976d2",
                                            lineHeight: "1.4",
                                        }}
                                    >
                                        Este producto maneja lotes. La cantidad
                                        se seleccionará automáticamente según
                                        los lotes disponibles mostrados arriba.
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Campo de Notas */}
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
                                Notas
                            </label>
                            <textarea
                                name="notas"
                                value={formData.notas}
                                onChange={handleInputChange}
                                disabled={isSubmitting}
                                rows="3"
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    border: "1px solid #dee2e6",
                                    borderRadius: "4px",
                                    fontSize: "14px",
                                    backgroundColor: isSubmitting
                                        ? "#f8f9fa"
                                        : "white",
                                    color: isSubmitting ? "#6c757d" : "#2c3e50",
                                    resize: "vertical",
                                    fontFamily: "inherit",
                                }}
                                placeholder="Notas adicionales sobre la transferencia (opcional)"
                            />
                        </div>

                        {/* Botón de envío */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                            }}
                        >
                            <button
                                type="submit"
                                disabled={
                                    isSubmitting ||
                                    (productRequiresBatches &&
                                        (availableBatches.length === 0 ||
                                            getTotalSelectedBatchQuantity() ===
                                                0)) ||
                                    (!productRequiresBatches &&
                                        (!stockInfo ||
                                            stockInfo.totalStock === 0))
                                }
                                style={{
                                    backgroundColor:
                                        isSubmitting ||
                                        (productRequiresBatches &&
                                            (availableBatches.length === 0 ||
                                                getTotalSelectedBatchQuantity() ===
                                                    0)) ||
                                        (!productRequiresBatches &&
                                            (!stockInfo ||
                                                stockInfo.totalStock === 0))
                                            ? "#6c757d"
                                            : "#28a745",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    padding: "12px 24px",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    cursor:
                                        isSubmitting ||
                                        (productRequiresBatches &&
                                            (availableBatches.length === 0 ||
                                                getTotalSelectedBatchQuantity() ===
                                                    0)) ||
                                        (!productRequiresBatches &&
                                            (!stockInfo ||
                                                stockInfo.totalStock === 0))
                                            ? "not-allowed"
                                            : "pointer",
                                    transition: "background-color 0.2s ease",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                }}
                            >
                                {isSubmitting ? (
                                    <>
                                        <span style={{ fontSize: "16px" }}>
                                            ⏳
                                        </span>
                                        Creando transferencia...
                                    </>
                                ) : (
                                    <>
                                        <span style={{ fontSize: "16px" }}>
                                            ✅
                                        </span>
                                        Crear Transferencia
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </form>
        </div>
    );
};

export default SimpleTransferForm;
