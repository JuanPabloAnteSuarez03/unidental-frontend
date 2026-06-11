import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import inventoryService from "../../services/inventoryService";
import transfersService from "../../services/transfersService";
import batchesService from "../../services/batchesService";
import advancedInventoryService from "../../services/advancedInventoryService";
import ProductSearchSelector from "../Common/ProductSearchSelector";

const RequestTransferModalV2 = ({
    isOpen,
    onClose,
    formData,
    handleInputChange,
    handleSubmit,
    nivelesUrgencia = [],
    onTransferCreated,
}) => {
    const { authToken } = useAuth();
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [ubicaciones, setUbicaciones] = useState([]);
    const [isLoadingUbicaciones, setIsLoadingUbicaciones] = useState(false);

    // Estados para stock disponible en origen
    const [availableStock, setAvailableStock] = useState(null);
    const [isLoadingStock, setIsLoadingStock] = useState(false);
    const [stockError, setStockError] = useState(null);

    // 🆕 Estados para control de lotes
    const [availableBatches, setAvailableBatches] = useState([]);
    const [isLoadingBatches, setIsLoadingBatches] = useState(false);
    const [batchesError, setBatchesError] = useState(null);
    const [selectedBatches, setSelectedBatches] = useState([]);
    const [productRequiresBatches, setProductRequiresBatches] = useState(false);
    const [batchSelectionMode, setBatchSelectionMode] = useState("manual"); // 'manual' o 'automatic'

    // Estado para prevenir múltiples envíos
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Cargar ubicaciones reales desde la base de datos
    const loadUbicaciones = useCallback(async () => {
        if (!authToken) return;

        setIsLoadingUbicaciones(true);
        try {
            const data = await inventoryService.getLocations(authToken);
            setUbicaciones(data || []);

            if (!data || data.length === 0) {
                console.warn("No se encontraron ubicaciones disponibles");
                setUbicaciones([
                    { id: 1, name: "Sede Principal" },
                    { id: 2, name: "Sede Norte" },
                    { id: 3, name: "Sede Sur" },
                    { id: 4, name: "Almacén Central" },
                ]);
            }
        } catch (error) {
            console.error("Error al cargar ubicaciones:", error);
            setUbicaciones([
                { id: 1, name: "Sede Principal" },
                { id: 2, name: "Sede Norte" },
                { id: 3, name: "Sede Sur" },
                { id: 4, name: "Almacén Central" },
            ]);
        } finally {
            setIsLoadingUbicaciones(false);
        }
    }, [authToken]);

    // Cargar ubicaciones al abrir el modal y limpiar estado al cerrar
    useEffect(() => {
        if (isOpen && authToken) {
            loadUbicaciones();
        } else if (!isOpen) {
            // Limpiar estado cuando se cierre el modal
            setSelectedProduct(null);
            setAvailableStock(null);
            setStockError(null);
            // 🆕 Limpiar estado de lotes
            setAvailableBatches([]);
            setSelectedBatches([]);
            setBatchesError(null);
            setProductRequiresBatches(false);
        }
    }, [isOpen, authToken, loadUbicaciones]);

    // Función para cargar stock disponible en origen
    const loadAvailableStock = useCallback(async () => {
        if (!selectedProduct || !formData.sedeOrigen || !authToken) {
            setAvailableStock(null);
            return;
        }

        // Buscar la ubicación origen por nombre
        const ubicacionOrigen = ubicaciones.find(
            (ub) => ub.name === formData.sedeOrigen
        );

        if (!ubicacionOrigen) {
            setAvailableStock(null);
            return;
        }

        setIsLoadingStock(true);
        setStockError(null);

        try {
            const stock = await inventoryService.getProductStockAtLocation(
                selectedProduct.id,
                ubicacionOrigen.id,
                authToken
            );
            setAvailableStock(stock);
        } catch (error) {
            console.error("Error al cargar stock:", error);
            setStockError("Error al cargar stock disponible");
            setAvailableStock(null);
        } finally {
            setIsLoadingStock(false);
        }
    }, [selectedProduct, formData.sedeOrigen, ubicaciones, authToken]);

    // 🆕 Función para cargar lotes disponibles en origen
    const loadAvailableBatches = useCallback(async () => {
        if (!selectedProduct || !formData.sedeOrigen || !authToken) {
            setAvailableBatches([]);
            setSelectedBatches([]);
            return;
        }

        // Verificar si el producto requiere control de lotes
        const requiresBatches =
            batchesService.requiresBatchControl(selectedProduct);
        setProductRequiresBatches(requiresBatches);

        if (!requiresBatches) {
            setAvailableBatches([]);
            setSelectedBatches([]);
            return;
        }

        // Buscar la ubicación origen por nombre
        const ubicacionOrigen = ubicaciones.find(
            (ub) => ub.name === formData.sedeOrigen
        );

        if (!ubicacionOrigen) {
            setAvailableBatches([]);
            setSelectedBatches([]);
            return;
        }

        setIsLoadingBatches(true);
        setBatchesError(null);

        try {
            const batches =
                await advancedInventoryService.getAvailableBatchesFIFO(
                    selectedProduct.id,
                    ubicacionOrigen.id,
                    authToken
                );

            setAvailableBatches(batches);

            // Inicializar lotes seleccionados con cantidad 0 (igual que SendTransferModalV2)
            setSelectedBatches(
                batches.map((batch) => ({
                    ...batch,
                    selectedQuantity: 0,
                    isPartial: false, // Para indicar si se solicita completo o parcial
                }))
            );
        } catch (error) {
            console.error("Error al cargar lotes:", error);
            setBatchesError("Error al cargar lotes disponibles");
            setAvailableBatches([]);
            setSelectedBatches([]);
        } finally {
            setIsLoadingBatches(false);
        }
    }, [selectedProduct, formData.sedeOrigen, ubicaciones, authToken]);

    // 🆕 Función para manejar cambios en la cantidad de lotes seleccionados (como SendTransferModalV2)
    const handleBatchQuantityChange = (batchIndex, quantity) => {
        const updatedBatches = [...selectedBatches];
        const batch = updatedBatches[batchIndex];
        const newQuantity = parseInt(quantity) || 0;

        // No permitir cantidad mayor al stock disponible
        const finalQuantity = Math.min(newQuantity, batch.quantity);

        updatedBatches[batchIndex] = {
            ...batch,
            selectedQuantity: finalQuantity,
            isPartial: finalQuantity > 0 && finalQuantity < batch.quantity,
        };

        setSelectedBatches(updatedBatches);
    };

    // 🆕 Función para seleccionar lote completo (como SendTransferModalV2)
    const handleSelectCompleteBatch = (batchIndex) => {
        const updatedBatches = [...selectedBatches];
        const batch = updatedBatches[batchIndex];

        updatedBatches[batchIndex] = {
            ...batch,
            selectedQuantity: batch.quantity,
            isPartial: false,
        };

        setSelectedBatches(updatedBatches);
    };

    // 🆕 Calcular cantidad total seleccionada de lotes
    const getTotalSelectedQuantity = () => {
        return selectedBatches.reduce(
            (total, batch) => total + batch.selectedQuantity,
            0
        );
    };

    // Cargar stock y lotes cuando cambien las dependencias
    useEffect(() => {
        loadAvailableStock();
        loadAvailableBatches();
    }, [loadAvailableStock, loadAvailableBatches]);

    // 🆕 Sincronizar cantidad con lotes seleccionados
    useEffect(() => {
        if (productRequiresBatches && selectedBatches.length > 0) {
            const totalQuantity = getTotalSelectedQuantity();
            if (
                totalQuantity > 0 &&
                totalQuantity !== parseInt(formData.cantidad || 0)
            ) {
                // Actualizar la cantidad en el formulario automáticamente
                handleInputChange({
                    target: {
                        name: "cantidad",
                        value: totalQuantity.toString(),
                    },
                });
            }
        }
    }, [
        selectedBatches,
        productRequiresBatches,
        formData.cantidad,
        getTotalSelectedQuantity,
        handleInputChange,
    ]);

    // Manejar selección de producto
    const handleProductSelected = (product) => {
        setSelectedProduct(product);
        handleInputChange({
            target: { name: "producto", value: product.name },
        });
    };

    // Manejar limpieza de selección de producto
    const handleProductSelectionCleared = () => {
        setSelectedProduct(null);
        handleInputChange({
            target: { name: "producto", value: "" },
        });
    };

    // Función para manejar el envío del formulario de solicitud
    const handleRequestSubmit = async (e) => {
        e.preventDefault();

        // Prevenir múltiples envíos
        if (isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        try {
            // Validaciones básicas
            if (
                !selectedProduct ||
                !formData.sedeOrigen ||
                !formData.sedeDestino ||
                !formData.cantidad
            ) {
                alert("Por favor complete todos los campos obligatorios");
                setIsSubmitting(false);
                return;
            }

            if (formData.sedeOrigen === formData.sedeDestino) {
                alert("La sede de origen y destino no pueden ser iguales");
                setIsSubmitting(false);
                return;
            }

            if (parseInt(formData.cantidad) <= 0) {
                alert("La cantidad debe ser mayor a 0");
                setIsSubmitting(false);
                return;
            }

            // 🆕 Validaciones específicas para productos que requieren control de lotes
            if (productRequiresBatches) {
                // Filtrar lotes que tienen cantidad seleccionada > 0
                const batchesWithQuantity = selectedBatches.filter(
                    (batch) => batch.selectedQuantity > 0
                );

                if (batchesWithQuantity.length === 0) {
                    alert(
                        "Este producto requiere control de lotes. Por favor seleccione al menos un lote con cantidad mayor a 0."
                    );
                    setIsSubmitting(false);
                    return;
                }

                const totalBatchQuantity = getTotalSelectedQuantity();
                const requestedQuantity = parseInt(formData.cantidad);

                if (totalBatchQuantity !== requestedQuantity) {
                    alert(
                        `La cantidad total de lotes seleccionados (${totalBatchQuantity}) debe coincidir con la cantidad solicitada (${requestedQuantity})`
                    );
                    setIsSubmitting(false);
                    return;
                }
            }

            // Crear transferencia usando el nuevo servicio
            const transferData = {
                selectedProduct: selectedProduct,
                producto: selectedProduct.name,
                sedeOrigen: formData.sedeOrigen,
                sedeDestino: formData.sedeDestino,
                cantidad: formData.cantidad,
                motivo: formData.motivo,
                urgencia: formData.urgencia,
                tipoTransferencia: "pull",
                fechaEntrega: formData.fechaEntrega,
                // 🆕 Incluir información de lotes si aplica
                requiresBatchControl: productRequiresBatches,
                selectedBatches: productRequiresBatches
                    ? selectedBatches
                          .filter((batch) => batch.selectedQuantity > 0)
                          .map((batch) => ({
                              batch_id: batch.batch_id,
                              batch_number: batch.batch_number,
                              selectedQuantity: batch.selectedQuantity,
                              isPartial: batch.isPartial,
                              availableStock: batch.quantity,
                              expiry_date: batch.expiry_date,
                          }))
                    : [],
            };

            // Usar el servicio de transferencias (las solicitudes no crean movimientos de inventario inmediatamente)
            const nuevaTransferencia = await transfersService.createTransfer(
                transferData,
                authToken
            );

            // Mensaje de confirmación mejorado
            let confirmationMessage = `Solicitud de transferencia enviada exitosamente!\nID: ${nuevaTransferencia.id}\nProducto: ${selectedProduct.name}\nCantidad: ${formData.cantidad}\nDesde: ${formData.sedeOrigen} → Hacia: ${formData.sedeDestino}`;

            if (productRequiresBatches && selectedBatches.length > 0) {
                const batchesWithQuantity = selectedBatches.filter(
                    (batch) => batch.selectedQuantity > 0
                );

                if (batchesWithQuantity.length > 0) {
                    confirmationMessage += `\n\nLotes seleccionados:`;
                    batchesWithQuantity.forEach((batch) => {
                        confirmationMessage += `\n• ${batch.batch_number}: ${batch.selectedQuantity} unidades`;
                    });
                }
            }

            confirmationMessage += `\n\nLa solicitud se guardó correctamente y persistirá entre sesiones.`;

            alert(confirmationMessage);

            // Llamar callbacks para actualizar la UI
            if (onTransferCreated) onTransferCreated();

            // SOLO cerrar modal - NO llamar handleSubmit para evitar doble procesamiento
            onClose();
        } catch (error) {
            console.error("Error al crear solicitud:", error);
            alert(`Error al crear la solicitud: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.6)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1000,
                backdropFilter: "blur(4px)",
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "20px",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                    width: "95%",
                    maxWidth: "600px",
                    maxHeight: "90vh",
                    overflowY: "auto",
                    position: "relative",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header con gradiente */}
                <div
                    style={{
                        background:
                            "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
                        borderRadius: "20px 20px 0 0",
                        padding: "24px 32px",
                        color: "white",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            top: "-30px",
                            right: "-30px",
                            width: "100px",
                            height: "100px",
                            borderRadius: "50%",
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                        }}
                    ></div>

                    <div style={{ position: "relative", zIndex: 1 }}>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "16px",
                                }}
                            >
                                <div
                                    style={{
                                        backgroundColor:
                                            "rgba(255, 255, 255, 0.15)",
                                        borderRadius: "12px",
                                        padding: "12px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <span style={{ fontSize: "24px" }}>⬅️</span>
                                </div>
                                <div>
                                    <h2
                                        style={{
                                            fontSize: "24px",
                                            fontWeight: "700",
                                            margin: "0 0 4px 0",
                                            letterSpacing: "-0.5px",
                                        }}
                                    >
                                        Solicitar Transferencia
                                    </h2>
                                    <p
                                        style={{
                                            fontSize: "14px",
                                            margin: "0",
                                            opacity: 0.9,
                                            fontWeight: "400",
                                        }}
                                    >
                                        Solicita productos desde otra ubicación
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                style={{
                                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                                    border: "none",
                                    borderRadius: "8px",
                                    color: "white",
                                    width: "36px",
                                    height: "36px",
                                    cursor: "pointer",
                                    fontSize: "18px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.2s ease",
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.backgroundColor =
                                        "rgba(255, 255, 255, 0.2)";
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.backgroundColor =
                                        "rgba(255, 255, 255, 0.1)";
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div style={{ padding: "32px" }}>
                    <form onSubmit={handleRequestSubmit}>
                        {/* Product Search Section */}
                        <div style={{ marginBottom: "24px" }}>
                            <div
                                style={{
                                    backgroundColor: "#f8f9fa",
                                    borderRadius: "12px",
                                    padding: "20px",
                                    border: "2px solid #e9ecef",
                                }}
                            >
                                <h3
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
                                    🔍 Producto a Solicitar
                                </h3>

                                <ProductSearchSelector
                                    onProductSelected={handleProductSelected}
                                    onSelectionCleared={
                                        handleProductSelectionCleared
                                    }
                                    placeholder="Buscar producto por nombre, SKU o código..."
                                    initialProduct={selectedProduct}
                                    showSelectedProduct={true}
                                    allowClearSelection={true}
                                    maxResults={50}
                                />
                            </div>
                        </div>

                        {/* Transfer Details Grid */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
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
                                    value={formData.sedeOrigen || ""}
                                    onChange={handleInputChange}
                                    style={{
                                        width: "100%",
                                        padding: "12px 14px",
                                        borderRadius: "8px",
                                        border: "2px solid #e9ecef",
                                        fontSize: "14px",
                                        backgroundColor: isLoadingUbicaciones
                                            ? "#f8f9fa"
                                            : "#fff",
                                        transition: "border-color 0.2s ease",
                                        opacity: isLoadingUbicaciones ? 0.7 : 1,
                                        boxSizing: "border-box",
                                    }}
                                    onFocus={(e) =>
                                        (e.target.style.borderColor = "#2c3e50")
                                    }
                                    onBlur={(e) =>
                                        (e.target.style.borderColor = "#e9ecef")
                                    }
                                    required
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
                                    value={formData.sedeDestino || ""}
                                    onChange={handleInputChange}
                                    style={{
                                        width: "100%",
                                        padding: "12px 14px",
                                        borderRadius: "8px",
                                        border: "2px solid #e9ecef",
                                        fontSize: "14px",
                                        backgroundColor: isLoadingUbicaciones
                                            ? "#f8f9fa"
                                            : "#fff",
                                        transition: "border-color 0.2s ease",
                                        opacity: isLoadingUbicaciones ? 0.7 : 1,
                                        boxSizing: "border-box",
                                    }}
                                    onFocus={(e) =>
                                        (e.target.style.borderColor = "#2c3e50")
                                    }
                                    onBlur={(e) =>
                                        (e.target.style.borderColor = "#e9ecef")
                                    }
                                    required
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
                            </div>
                        </div>

                        {/* 🆕 Batch Selection Section - Solo si el producto requiere control de lotes */}
                        {selectedProduct &&
                            formData.sedeOrigen &&
                            productRequiresBatches && (
                                <div style={{ marginBottom: "24px" }}>
                                    <div
                                        style={{
                                            backgroundColor: "#fff8f0",
                                            borderRadius: "12px",
                                            padding: "20px",
                                            border: "2px solid #fed7aa",
                                        }}
                                    >
                                        <h3
                                            style={{
                                                fontSize: "16px",
                                                fontWeight: "600",
                                                color: "#c2410c",
                                                margin: "0 0 16px 0",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                            }}
                                        >
                                            📦 Selección de Lotes
                                        </h3>

                                        {isLoadingBatches ? (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "12px",
                                                    padding: "16px",
                                                    backgroundColor: "#f3f4f6",
                                                    borderRadius: "8px",
                                                    color: "#6b7280",
                                                }}
                                            >
                                                <span>⏳</span>
                                                <span>
                                                    Cargando lotes
                                                    disponibles...
                                                </span>
                                            </div>
                                        ) : batchesError ? (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "12px",
                                                    padding: "16px",
                                                    backgroundColor: "#fee2e2",
                                                    borderRadius: "8px",
                                                    color: "#dc2626",
                                                }}
                                            >
                                                <span>⚠️</span>
                                                <span>{batchesError}</span>
                                            </div>
                                        ) : availableBatches.length === 0 ? (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "12px",
                                                    padding: "16px",
                                                    backgroundColor: "#fef3c7",
                                                    borderRadius: "8px",
                                                    color: "#d97706",
                                                }}
                                            >
                                                <span>📦</span>
                                                <span>
                                                    No hay lotes disponibles en{" "}
                                                    {formData.sedeOrigen}
                                                </span>
                                            </div>
                                        ) : (
                                            <div>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent:
                                                            "space-between",
                                                        alignItems: "center",
                                                        marginBottom: "16px",
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontSize: "14px",
                                                            color: "#6b7280",
                                                        }}
                                                    >
                                                        {
                                                            availableBatches.length
                                                        }{" "}
                                                        lote(s) disponible(s)
                                                    </span>
                                                    {selectedBatches.length >
                                                        0 && (
                                                        <span
                                                            style={{
                                                                fontSize:
                                                                    "14px",
                                                                fontWeight:
                                                                    "600",
                                                                color: "#059669",
                                                                backgroundColor:
                                                                    "#d1fae5",
                                                                padding:
                                                                    "4px 8px",
                                                                borderRadius:
                                                                    "4px",
                                                            }}
                                                        >
                                                            Total seleccionado:{" "}
                                                            {getTotalSelectedQuantity()}{" "}
                                                            unidades
                                                        </span>
                                                    )}
                                                </div>

                                                <div
                                                    style={{
                                                        maxHeight: "300px",
                                                        overflowY: "auto",
                                                        border: "1px solid #e5e7eb",
                                                        borderRadius: "8px",
                                                    }}
                                                >
                                                    {availableBatches.map(
                                                        (batch, index) => {
                                                            const selectedBatch =
                                                                selectedBatches[
                                                                    index
                                                                ];
                                                            const expiryStatus =
                                                                batchesService.getBatchExpiryStatus(
                                                                    batch
                                                                );

                                                            return (
                                                                <div
                                                                    key={index}
                                                                    style={{
                                                                        padding:
                                                                            "16px",
                                                                        borderBottom:
                                                                            index <
                                                                            availableBatches.length -
                                                                                1
                                                                                ? "1px solid #e5e7eb"
                                                                                : "none",
                                                                        backgroundColor:
                                                                            selectedBatch?.selectedQuantity >
                                                                            0
                                                                                ? "#f0f9ff"
                                                                                : "#fff",
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
                                                                        <div>
                                                                            <div
                                                                                style={{
                                                                                    fontSize:
                                                                                        "14px",
                                                                                    fontWeight:
                                                                                        "600",
                                                                                    color: "#111827",
                                                                                    marginBottom:
                                                                                        "4px",
                                                                                }}
                                                                            >
                                                                                📦{" "}
                                                                                {
                                                                                    batch.batch_number
                                                                                }
                                                                            </div>
                                                                            <div
                                                                                style={{
                                                                                    fontSize:
                                                                                        "12px",
                                                                                    color: "#6b7280",
                                                                                    marginBottom:
                                                                                        "4px",
                                                                                }}
                                                                            >
                                                                                📅{" "}
                                                                                Vence:{" "}
                                                                                {batch.expiry_date
                                                                                    ? new Date(
                                                                                          batch.expiry_date
                                                                                      ).toLocaleDateString()
                                                                                    : "Sin fecha"}
                                                                            </div>
                                                                            <div
                                                                                style={{
                                                                                    fontSize:
                                                                                        "12px",
                                                                                    color: "#059669",
                                                                                    fontWeight:
                                                                                        "500",
                                                                                }}
                                                                            >
                                                                                📊{" "}
                                                                                Stock:{" "}
                                                                                {
                                                                                    batch.quantity
                                                                                }{" "}
                                                                                unidades
                                                                            </div>
                                                                        </div>

                                                                        <div
                                                                            style={{
                                                                                display:
                                                                                    "flex",
                                                                                alignItems:
                                                                                    "center",
                                                                                gap: "8px",
                                                                            }}
                                                                        >
                                                                            <span
                                                                                style={{
                                                                                    ...expiryStatus.style,
                                                                                    fontSize:
                                                                                        "11px",
                                                                                    padding:
                                                                                        "4px 6px",
                                                                                    borderRadius:
                                                                                        "4px",
                                                                                    fontWeight:
                                                                                        "600",
                                                                                }}
                                                                            >
                                                                                {
                                                                                    expiryStatus.label
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Controles de cantidad */}
                                                                    <div
                                                                        style={{
                                                                            display:
                                                                                "grid",
                                                                            gridTemplateColumns:
                                                                                "1fr auto auto",
                                                                            gap: "12px",
                                                                            alignItems:
                                                                                "center",
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
                                                                            <span
                                                                                style={{
                                                                                    fontSize:
                                                                                        "13px",
                                                                                    color: "#374151",
                                                                                    fontWeight:
                                                                                        "500",
                                                                                }}
                                                                            >
                                                                                Cantidad:
                                                                            </span>
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                max={
                                                                                    batch.quantity
                                                                                }
                                                                                value={
                                                                                    selectedBatch?.selectedQuantity ||
                                                                                    0
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
                                                                                style={{
                                                                                    width: "80px",
                                                                                    padding:
                                                                                        "6px 8px",
                                                                                    border: "1px solid #d1d5db",
                                                                                    borderRadius:
                                                                                        "4px",
                                                                                    fontSize:
                                                                                        "13px",
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
                                                                                    "6px 12px",
                                                                                backgroundColor:
                                                                                    "#3b82f6",
                                                                                color: "#ffffff",
                                                                                border: "none",
                                                                                borderRadius:
                                                                                    "4px",
                                                                                fontSize:
                                                                                    "12px",
                                                                                fontWeight:
                                                                                    "500",
                                                                                cursor: "pointer",
                                                                            }}
                                                                        >
                                                                            Todo
                                                                            el
                                                                            lote
                                                                        </button>

                                                                        <button
                                                                            type="button"
                                                                            onClick={() =>
                                                                                handleBatchQuantityChange(
                                                                                    index,
                                                                                    0
                                                                                )
                                                                            }
                                                                            style={{
                                                                                padding:
                                                                                    "6px 8px",
                                                                                backgroundColor:
                                                                                    "#ef4444",
                                                                                color: "#ffffff",
                                                                                border: "none",
                                                                                borderRadius:
                                                                                    "4px",
                                                                                fontSize:
                                                                                    "12px",
                                                                                cursor: "pointer",
                                                                            }}
                                                                        >
                                                                            ✕
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                        {/* Quantity and Priority Grid */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "20px",
                                marginBottom: "24px",
                            }}
                        >
                            {/* Cantidad Solicitada - REACTIVADO */}
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
                                    Cantidad Solicitada *
                                </label>
                                <input
                                    type="number"
                                    name="cantidad"
                                    value={formData.cantidad || ""}
                                    onChange={handleInputChange}
                                    min="1"
                                    step="1"
                                    style={{
                                        width: "100%",
                                        padding: "12px 14px",
                                        borderRadius: "8px",
                                        border: "2px solid #e9ecef",
                                        fontSize: "14px",
                                        backgroundColor: "#fff",
                                        transition: "border-color 0.2s ease",
                                        boxSizing: "border-box",
                                    }}
                                    onFocus={(e) =>
                                        (e.target.style.borderColor = "#2c3e50")
                                    }
                                    onBlur={(e) =>
                                        (e.target.style.borderColor = "#e9ecef")
                                    }
                                    placeholder="Ingrese la cantidad solicitada"
                                    required
                                />

                                {/* Información de stock disponible en origen */}
                                {selectedProduct && formData.sedeOrigen && (
                                    <div
                                        style={{
                                            marginTop: "8px",
                                            padding: "8px 12px",
                                            borderRadius: "6px",
                                            fontSize: "13px",
                                            fontWeight: "500",
                                            backgroundColor: isLoadingStock
                                                ? "#f8f9fa"
                                                : stockError
                                                ? "#fff5f5"
                                                : availableStock === null
                                                ? "#f8f9fa"
                                                : availableStock > 0
                                                ? "#f0f9ff"
                                                : "#fff5f5",
                                            color: isLoadingStock
                                                ? "#6c757d"
                                                : stockError
                                                ? "#dc3545"
                                                : availableStock === null
                                                ? "#6c757d"
                                                : availableStock > 0
                                                ? "#0369a1"
                                                : "#dc3545",
                                            border: `1px solid ${
                                                isLoadingStock
                                                    ? "#e9ecef"
                                                    : stockError
                                                    ? "#f5c6cb"
                                                    : availableStock === null
                                                    ? "#e9ecef"
                                                    : availableStock > 0
                                                    ? "#bfdbfe"
                                                    : "#f5c6cb"
                                            }`,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                        }}
                                    >
                                        <span>
                                            {isLoadingStock
                                                ? "⏳"
                                                : stockError
                                                ? "⚠️"
                                                : availableStock === null
                                                ? "📦"
                                                : availableStock > 0
                                                ? "✅"
                                                : "❌"}
                                        </span>
                                        <span>
                                            {isLoadingStock
                                                ? "Cargando stock..."
                                                : stockError
                                                ? stockError
                                                : availableStock === null
                                                ? "Seleccione origen para ver stock"
                                                : `Stock disponible en ${formData.sedeOrigen}: ${availableStock} unidades`}
                                        </span>
                                        {availableStock !== null &&
                                            formData.cantidad &&
                                            parseInt(formData.cantidad) >
                                                availableStock && (
                                                <span
                                                    style={{
                                                        color: "#dc3545",
                                                        fontWeight: "600",
                                                    }}
                                                >
                                                    (Solicitando más de lo
                                                    disponible)
                                                </span>
                                            )}
                                    </div>
                                )}
                            </div>

                            {/* Priority Level */}
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
                                    Prioridad
                                </label>
                                <select
                                    name="urgencia"
                                    value={formData.urgencia || "media"}
                                    onChange={handleInputChange}
                                    style={{
                                        width: "100%",
                                        padding: "12px 14px",
                                        borderRadius: "8px",
                                        border: "2px solid #e9ecef",
                                        fontSize: "14px",
                                        backgroundColor: "#fff",
                                        transition: "border-color 0.2s ease",
                                        boxSizing: "border-box",
                                    }}
                                    onFocus={(e) =>
                                        (e.target.style.borderColor = "#2c3e50")
                                    }
                                    onBlur={(e) =>
                                        (e.target.style.borderColor = "#e9ecef")
                                    }
                                >
                                    {nivelesUrgencia.map((nivel) => (
                                        <option
                                            key={nivel.value}
                                            value={nivel.value}
                                        >
                                            {nivel.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Motivo/Justificación */}
                        <div style={{ marginBottom: "32px" }}>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontWeight: "600",
                                    fontSize: "14px",
                                    color: "#2c3e50",
                                }}
                            >
                                Motivo de la Solicitud
                            </label>
                            <textarea
                                name="motivo"
                                value={formData.motivo || ""}
                                onChange={handleInputChange}
                                style={{
                                    width: "100%",
                                    padding: "14px 16px",
                                    borderRadius: "8px",
                                    border: "2px solid #e9ecef",
                                    fontSize: "14px",
                                    backgroundColor: "#fff",
                                    transition: "border-color 0.2s ease",
                                    minHeight: "80px",
                                    resize: "vertical",
                                    fontFamily: "inherit",
                                    boxSizing: "border-box",
                                }}
                                onFocus={(e) =>
                                    (e.target.style.borderColor = "#2c3e50")
                                }
                                onBlur={(e) =>
                                    (e.target.style.borderColor = "#e9ecef")
                                }
                                placeholder="Describe el motivo de esta solicitud de transferencia..."
                            />
                        </div>

                        {/* Action Buttons */}
                        <div
                            style={{
                                display: "flex",
                                gap: "12px",
                                justifyContent: "flex-end",
                                paddingTop: "20px",
                                borderTop: "2px solid #f1f3f4",
                            }}
                        >
                            <button
                                type="button"
                                onClick={onClose}
                                style={{
                                    padding: "12px 24px",
                                    borderRadius: "8px",
                                    border: "2px solid #e9ecef",
                                    backgroundColor: "#f8f9fa",
                                    color: "#6c757d",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                }}
                                onMouseOver={(e) => {
                                    e.target.style.backgroundColor = "#e9ecef";
                                    e.target.style.borderColor = "#ced4da";
                                }}
                                onMouseOut={(e) => {
                                    e.target.style.backgroundColor = "#f8f9fa";
                                    e.target.style.borderColor = "#e9ecef";
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
                                        ? "#6c757d"
                                        : "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
                                    color: "white",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    cursor: isSubmitting
                                        ? "not-allowed"
                                        : "pointer",
                                    transition: "all 0.2s ease",
                                    boxShadow:
                                        "0 4px 12px rgba(44, 62, 80, 0.3)",
                                    opacity: isSubmitting ? 0.7 : 1,
                                }}
                                onMouseOver={(e) => {
                                    if (!isSubmitting) {
                                        e.target.style.transform =
                                            "translateY(-1px)";
                                        e.target.style.boxShadow =
                                            "0 6px 16px rgba(44, 62, 80, 0.4)";
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if (!isSubmitting) {
                                        e.target.style.transform =
                                            "translateY(0)";
                                        e.target.style.boxShadow =
                                            "0 4px 12px rgba(44, 62, 80, 0.3)";
                                    }
                                }}
                            >
                                {isSubmitting
                                    ? "⏳ Procesando..."
                                    : "⬅️ Enviar Solicitud"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RequestTransferModalV2;
