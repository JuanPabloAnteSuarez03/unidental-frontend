import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import inventoryService from "../../services/inventoryService";
import transfersService from "../../services/transfersService";
import ProductSearchSelector from "../Common/ProductSearchSelector";

const SendTransferModalV2 = ({
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

    // Estados para stock disponible
    const [availableStock, setAvailableStock] = useState(null);
    const [isLoadingStock, setIsLoadingStock] = useState(false);
    const [stockError, setStockError] = useState(null);

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
        }
    }, [isOpen, authToken, loadUbicaciones]);

    // Función para cargar stock disponible
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

    // Cargar stock cuando cambien las dependencias
    useEffect(() => {
        loadAvailableStock();
    }, [loadAvailableStock]);

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

    // Función especial para manejar el envío usando inventory movements
    const handleTransferSubmit = async (e) => {
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

            // Validar stock disponible
            if (
                availableStock !== null &&
                parseInt(formData.cantidad) > availableStock
            ) {
                alert(
                    `Stock insuficiente en ${formData.sedeOrigen}.\n` +
                        `Disponible: ${availableStock}\n` +
                        `Solicitado: ${formData.cantidad}\n` +
                        `Faltante: ${
                            parseInt(formData.cantidad) - availableStock
                        }`
                );
                setIsSubmitting(false);
                return;
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
                tipoTransferencia: "push",
                fechaEntrega: formData.fechaEntrega,
            };

            // Usar el servicio de transferencias que maneja tanto el localStorage como el inventory movement
            const nuevaTransferencia = await transfersService.createTransfer(
                transferData,
                authToken
            );

            // Mostrar éxito y cerrar modal
            alert(
                `Envío registrado exitosamente!\nID: ${
                    nuevaTransferencia.id
                }\n${
                    nuevaTransferencia.movementId
                        ? `Movimiento de inventario: ${nuevaTransferencia.movementId}`
                        : ""
                }\nLa transferencia se guardó correctamente y persistirá entre sesiones.`
            );

            // Llamar callbacks para actualizar la UI
            if (onTransferCreated) onTransferCreated();

            // SOLO cerrar modal - NO llamar handleSubmit para evitar doble procesamiento
            onClose();
        } catch (error) {
            console.error("Error al registrar envío:", error);
            alert(`Error al registrar el envío: ${error.message}`);
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
                                    <span style={{ fontSize: "24px" }}>➡️</span>
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
                                        Registrar Envío
                                    </h2>
                                    <p
                                        style={{
                                            fontSize: "14px",
                                            margin: "0",
                                            opacity: 0.9,
                                            fontWeight: "400",
                                        }}
                                    >
                                        Envía productos a otra ubicación
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
                    <form onSubmit={handleTransferSubmit}>
                        {/* Información del Flujo de Trabajo */}
                        <div
                            style={{
                                backgroundColor: "#e3f2fd",
                                borderRadius: "12px",
                                padding: "16px",
                                marginBottom: "24px",
                                border: "2px solid #90caf9",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    marginBottom: "8px",
                                }}
                            >
                                <span style={{ fontSize: "20px" }}>ℹ️</span>
                                <h4
                                    style={{
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        color: "#1565c0",
                                        margin: 0,
                                    }}
                                >
                                    Formulario para Envíos sin Solicitud Previa
                                </h4>
                            </div>
                            <div
                                style={{
                                    fontSize: "13px",
                                    color: "#1976d2",
                                    lineHeight: "1.5",
                                }}
                            >
                                Este formulario permite realizar envíos directos
                                entre ubicaciones sin necesidad de una solicitud
                                previa. El sistema registrará automáticamente el
                                movimiento en el inventario cuando se complete
                                la transferencia.
                            </div>
                        </div>

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
                                    📦 Producto a Enviar
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
                                    maxResults={10}
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

                        {/* Quantity and Priority Grid */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "20px",
                                marginBottom: "24px",
                            }}
                        >
                            {/* Cantidad a Enviar - REACTIVADO */}
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
                                    Cantidad a Enviar *
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
                                    placeholder="Ingrese la cantidad a enviar"
                                    required
                                />

                                {/* Información de stock disponible */}
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
                                                : `Stock disponible: ${availableStock} unidades`}
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
                                                    (Insuficiente: faltan{" "}
                                                    {parseInt(
                                                        formData.cantidad
                                                    ) - availableStock}
                                                    )
                                                </span>
                                            )}
                                    </div>
                                )}
                                {selectedProduct &&
                                    selectedProduct.stock_quantity && (
                                        <div
                                            style={{
                                                fontSize: "12px",
                                                color: "#6c757d",
                                                marginTop: "4px",
                                                fontStyle: "italic",
                                            }}
                                        >
                                            Stock disponible:{" "}
                                            {selectedProduct.stock_quantity}{" "}
                                            unidades
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

                        {/* Expected Delivery Date */}
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
                                Fecha Estimada de Entrega
                            </label>
                            <input
                                type="date"
                                name="fechaEntrega"
                                value={formData.fechaEntrega || ""}
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
                                min={new Date().toISOString().split("T")[0]}
                            />
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
                                Motivo del Envío
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
                                placeholder="Describe el motivo de este envío..."
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
                                    : "➡️ Registrar Envío"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SendTransferModalV2;
