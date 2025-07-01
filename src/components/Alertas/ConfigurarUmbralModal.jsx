import React, { useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import ProductSearchSelector from "../Common/ProductSearchSelector";
import {
    FaTimes,
    FaSave,
    FaClock,
    FaExclamationTriangle,
    FaCalendarAlt,
} from "react-icons/fa";

const ConfigurarUmbralModal = ({
    isOpen,
    onClose,
    onUmbralGuardado,
    productoPreSeleccionado,
}) => {
    const { authToken } = useAuth();
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [umbralValue, setUmbralValue] = useState("");
    const [umbralUnit, setUmbralUnit] = useState("days"); // 'days' o 'months'
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Resetear estado al abrir/cerrar modal
    React.useEffect(() => {
        if (isOpen) {
            // Si hay un producto pre-seleccionado, usarlo
            if (productoPreSeleccionado) {
                setSelectedProduct(productoPreSeleccionado);
                // Configurar el umbral actual si existe
                if (productoPreSeleccionado.min_expiry_days_threshold) {
                    const days =
                        productoPreSeleccionado.min_expiry_days_threshold;
                    if (days >= 60 && days % 30 === 0) {
                        setUmbralValue((days / 30).toString());
                        setUmbralUnit("months");
                    } else {
                        setUmbralValue(days.toString());
                        setUmbralUnit("days");
                    }
                } else {
                    setUmbralValue("");
                    setUmbralUnit("days");
                }
            } else {
                setSelectedProduct(null);
                setUmbralValue("");
                setUmbralUnit("days");
            }
            setError("");
            setSuccess("");
        }
    }, [isOpen, productoPreSeleccionado]);

    // Manejar selección de producto
    const handleProductSelected = useCallback((product) => {
        setSelectedProduct(product);
        setError("");

        // Si el producto ya tiene umbral, mostrar el valor actual
        if (product.min_expiry_days_threshold) {
            const days = product.min_expiry_days_threshold;

            // Convertir a meses si es divisible por 30 y mayor a 60 días
            if (days >= 60 && days % 30 === 0) {
                setUmbralValue((days / 30).toString());
                setUmbralUnit("months");
            } else {
                setUmbralValue(days.toString());
                setUmbralUnit("days");
            }
        } else {
            setUmbralValue("");
            setUmbralUnit("days");
        }
    }, []);

    // Limpiar selección
    const handleClearSelection = useCallback(() => {
        setSelectedProduct(null);
        setUmbralValue("");
        setUmbralUnit("days");
        setError("");
        setSuccess("");
    }, []);

    // Calcular días totales
    const getDaysFromUmbral = () => {
        const value = parseInt(umbralValue) || 0;
        return umbralUnit === "months" ? value * 30 : value;
    };

    // Guardar umbral
    const handleGuardarUmbral = async () => {
        if (!selectedProduct) {
            setError("Debe seleccionar un producto");
            return;
        }

        if (!umbralValue || parseInt(umbralValue) <= 0) {
            setError("Debe ingresar un valor de umbral válido");
            return;
        }

        setIsLoading(true);
        setError("");
        setSuccess("");

        try {
            const totalDays = getDaysFromUmbral();

            const response = await fetch(
                `https://unidental-backend.onrender.com/api/catalogs/products/${selectedProduct.id}/`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Token ${authToken}`,
                    },
                    body: JSON.stringify({
                        min_expiry_days_threshold: totalDays,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.detail || "Error al actualizar umbral"
                );
            }

            const updatedProduct = await response.json();

            setSuccess(
                `Umbral configurado: ${umbralValue} ${
                    umbralUnit === "days" ? "días" : "meses"
                } (${totalDays} días)`
            );

            // Notificar al componente padre
            if (onUmbralGuardado) {
                onUmbralGuardado(updatedProduct);
            }

            // Cerrar modal después de 2 segundos
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (error) {
            console.error("Error al guardar umbral:", error);
            setError(error.message || "Error al guardar el umbral");
        } finally {
            setIsLoading(false);
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
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
            }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: "12px",
                    padding: "0",
                    width: "90%",
                    maxWidth: "600px",
                    maxHeight: "90vh",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        background:
                            "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
                        color: "white",
                        padding: "20px 25px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexShrink: 0,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                        }}
                    >
                        <FaClock style={{ fontSize: "24px" }} />
                        <h2
                            style={{
                                margin: 0,
                                fontSize: "20px",
                                fontWeight: "600",
                            }}
                        >
                            Configurar Umbral de Vencimiento
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            color: "white",
                            fontSize: "20px",
                            cursor: "pointer",
                            padding: "5px",
                            borderRadius: "4px",
                            transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) =>
                            (e.target.style.backgroundColor =
                                "rgba(255,255,255,0.1)")
                        }
                        onMouseLeave={(e) =>
                            (e.target.style.backgroundColor = "transparent")
                        }
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Body - Scrollable */}
                <div
                    style={{
                        padding: "25px",
                        flex: 1,
                        overflowY: "auto",
                        minHeight: 0,
                    }}
                >
                    {/* Descripción */}
                    <div
                        style={{
                            padding: "15px",
                            backgroundColor: "#e8f4fd",
                            border: "1px solid #bee5eb",
                            borderRadius: "8px",
                            marginBottom: "25px",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                marginBottom: "8px",
                            }}
                        >
                            <FaExclamationTriangle
                                style={{ color: "#0ea5e9", fontSize: "16px" }}
                            />
                            <strong style={{ color: "#0369a1" }}>
                                ¿Qué es un umbral de vencimiento?
                            </strong>
                        </div>
                        <p
                            style={{
                                margin: 0,
                                color: "#0369a1",
                                fontSize: "14px",
                                lineHeight: "1.5",
                            }}
                        >
                            El umbral define cuántos días antes del vencimiento
                            se debe considerar un lote como "próximo a vencer".
                            Por ejemplo, si configuras 180 días, los lotes que
                            venzan en los próximos 6 meses aparecerán en las
                            alertas.
                        </p>
                    </div>

                    {/* Búsqueda de producto - solo mostrar si no hay producto pre-seleccionado */}
                    {!productoPreSeleccionado && (
                        <div style={{ marginBottom: "25px" }}>
                            <label
                                style={{
                                    display: "block",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                    marginBottom: "8px",
                                }}
                            >
                                Seleccionar Producto
                            </label>
                            <ProductSearchSelector
                                onProductSelected={handleProductSelected}
                                onSelectionCleared={handleClearSelection}
                                placeholder="Buscar producto por nombre, SKU o código..."
                                showSelectedProduct={true}
                                allowClearSelection={true}
                            />
                        </div>
                    )}

                    {/* Mostrar producto seleccionado cuando viene pre-seleccionado */}
                    {productoPreSeleccionado && selectedProduct && (
                        <div
                            style={{
                                padding: "15px",
                                backgroundColor: "#e8f5e9",
                                border: "1px solid #c3e6cb",
                                borderRadius: "8px",
                                marginBottom: "25px",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    marginBottom: "8px",
                                }}
                            >
                                <strong style={{ color: "#155724" }}>
                                    Producto Seleccionado:
                                </strong>
                            </div>
                            <p
                                style={{
                                    margin: "0 0 4px 0",
                                    color: "#155724",
                                    fontSize: "16px",
                                    fontWeight: "600",
                                }}
                            >
                                {selectedProduct.name}
                            </p>
                            <p
                                style={{
                                    margin: 0,
                                    color: "#155724",
                                    fontSize: "14px",
                                    fontFamily: "monospace",
                                }}
                            >
                                SKU: {selectedProduct.sku}
                            </p>
                        </div>
                    )}

                    {/* Configuración de umbral */}
                    {selectedProduct && (
                        <div
                            style={{
                                padding: "20px",
                                backgroundColor: "#f8f9fa",
                                border: "1px solid #e9ecef",
                                borderRadius: "8px",
                                marginBottom: "20px",
                            }}
                        >
                            <h4
                                style={{
                                    margin: "0 0 15px 0",
                                    color: "#2c3e50",
                                    fontSize: "16px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                }}
                            >
                                <FaCalendarAlt />
                                Configurar Umbral de Vencimiento
                            </h4>

                            {/* Valor actual si existe */}
                            {selectedProduct.min_expiry_days_threshold && (
                                <div
                                    style={{
                                        padding: "10px",
                                        backgroundColor: "#fff3cd",
                                        border: "1px solid #ffeaa7",
                                        borderRadius: "6px",
                                        marginBottom: "15px",
                                        fontSize: "14px",
                                        color: "#856404",
                                    }}
                                >
                                    <strong>Umbral actual:</strong>{" "}
                                    {selectedProduct.min_expiry_days_threshold}{" "}
                                    días
                                </div>
                            )}

                            <div
                                style={{
                                    display: "flex",
                                    gap: "15px",
                                    alignItems: "end",
                                }}
                            >
                                {/* Valor del umbral */}
                                <div style={{ flex: 1 }}>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "13px",
                                            fontWeight: "600",
                                            color: "#2c3e50",
                                            marginBottom: "5px",
                                        }}
                                    >
                                        Cantidad
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="3650"
                                        value={umbralValue}
                                        onChange={(e) =>
                                            setUmbralValue(e.target.value)
                                        }
                                        placeholder="Ej: 6"
                                        style={{
                                            width: "100%",
                                            padding: "10px",
                                            border: "1px solid #ced4da",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                            boxSizing: "border-box",
                                        }}
                                    />
                                </div>

                                {/* Unidad */}
                                <div style={{ flex: 1 }}>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "13px",
                                            fontWeight: "600",
                                            color: "#2c3e50",
                                            marginBottom: "5px",
                                        }}
                                    >
                                        Unidad
                                    </label>
                                    <select
                                        value={umbralUnit}
                                        onChange={(e) =>
                                            setUmbralUnit(e.target.value)
                                        }
                                        style={{
                                            width: "100%",
                                            padding: "10px",
                                            border: "1px solid #ced4da",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                            backgroundColor: "white",
                                            boxSizing: "border-box",
                                        }}
                                    >
                                        <option value="days">Días</option>
                                        <option value="months">Meses</option>
                                    </select>
                                </div>
                            </div>

                            {/* Previsualización */}
                            {umbralValue && (
                                <div
                                    style={{
                                        marginTop: "15px",
                                        padding: "10px",
                                        backgroundColor: "#e8f5e9",
                                        border: "1px solid #c3e6cb",
                                        borderRadius: "6px",
                                        fontSize: "14px",
                                        color: "#155724",
                                    }}
                                >
                                    <strong>Equivalencia:</strong>{" "}
                                    {getDaysFromUmbral()} días
                                    <br />
                                    <strong>Efecto:</strong> Los lotes que
                                    venzan en los próximos {getDaysFromUmbral()}{" "}
                                    días aparecerán como "próximos a vencer" en
                                    las alertas.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Mensajes de error y éxito */}
                    {error && (
                        <div
                            style={{
                                padding: "12px",
                                backgroundColor: "#f8d7da",
                                border: "1px solid #f5c6cb",
                                borderRadius: "6px",
                                color: "#721c24",
                                marginBottom: "15px",
                                fontSize: "14px",
                            }}
                        >
                            {error}
                        </div>
                    )}

                    {success && (
                        <div
                            style={{
                                padding: "12px",
                                backgroundColor: "#d4edda",
                                border: "1px solid #c3e6cb",
                                borderRadius: "6px",
                                color: "#155724",
                                marginBottom: "15px",
                                fontSize: "14px",
                            }}
                        >
                            ✅ {success}
                        </div>
                    )}
                </div>

                {/* Footer - Fixed */}
                <div
                    style={{
                        padding: "20px 25px",
                        borderTop: "1px solid #e9ecef",
                        backgroundColor: "#f8f9fa",
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "10px",
                        flexShrink: 0,
                    }}
                >
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        style={{
                            padding: "10px 20px",
                            border: "1px solid #6c757d",
                            backgroundColor: "white",
                            color: "#6c757d",
                            borderRadius: "6px",
                            cursor: isLoading ? "not-allowed" : "pointer",
                            fontSize: "14px",
                            fontWeight: "500",
                            opacity: isLoading ? 0.6 : 1,
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleGuardarUmbral}
                        disabled={!selectedProduct || !umbralValue || isLoading}
                        style={{
                            padding: "10px 20px",
                            border: "none",
                            backgroundColor:
                                !selectedProduct || !umbralValue || isLoading
                                    ? "#6c757d"
                                    : "#28a745",
                            color: "white",
                            borderRadius: "6px",
                            cursor:
                                !selectedProduct || !umbralValue || isLoading
                                    ? "not-allowed"
                                    : "pointer",
                            fontSize: "14px",
                            fontWeight: "500",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        <FaSave />
                        {isLoading ? "Guardando..." : "Guardar Umbral"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfigurarUmbralModal;
