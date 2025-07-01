import React, { useState, useCallback, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import ProductSearchSelector from "../Common/ProductSearchSelector";
import {
    FaTimes,
    FaSave,
    FaBoxes,
    FaExclamationTriangle,
} from "react-icons/fa";
import API_CONFIG from "../../config/api";

const ConfigurarUmbralStockModal = ({ isOpen, onClose }) => {
    const { authToken } = useAuth();
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [umbralValue, setUmbralValue] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        if (isOpen) {
            setSelectedProduct(null);
            setUmbralValue("");
            setError("");
            setSuccess("");
        }
    }, [isOpen]);

    const handleProductSelected = useCallback((product) => {
        setSelectedProduct(product);
        setError("");
        setSuccess("");
        if (
            product.min_stock_threshold !== undefined &&
            product.min_stock_threshold !== null
        ) {
            setUmbralValue(product.min_stock_threshold.toString());
        } else {
            setUmbralValue("");
        }
    }, []);

    const handleClearSelection = useCallback(() => {
        setSelectedProduct(null);
        setUmbralValue("");
        setError("");
        setSuccess("");
    }, []);

    const handleGuardarUmbral = async () => {
        if (!selectedProduct) {
            setError("Debe seleccionar un producto");
            return;
        }
        if (!umbralValue || parseInt(umbralValue) < 0) {
            setError("Debe ingresar un valor de umbral válido");
            return;
        }
        setIsUpdating(true);
        setError("");
        setSuccess("");
        try {
            const response = await fetch(
                `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.INVENTORY}${selectedProduct.id}/`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Token ${authToken}`,
                    },
                    body: JSON.stringify({
                        min_stock_threshold: parseInt(umbralValue),
                    }),
                }
            );
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.detail ||
                        errorData.error ||
                        `Error ${response.status}: ${response.statusText}`
                );
            }
            setSuccess(
                `✅ Umbral de stock configurado: ${umbralValue} unidades`
            );
            setTimeout(() => {
                setSelectedProduct(null);
                setUmbralValue("");
                setSuccess("");
                onClose();
            }, 2000);
        } catch (error) {
            setError(`Error al guardar umbral: ${error.message}`);
        } finally {
            setIsUpdating(false);
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
                        <FaBoxes style={{ fontSize: "24px" }} />
                        <h2
                            style={{
                                margin: 0,
                                fontSize: "20px",
                                fontWeight: "600",
                            }}
                        >
                            Configurar Umbral de Stock
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
                                ¿Qué es un umbral de stock?
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
                            El umbral de stock mínimo determina cuándo un
                            producto se considera en "stock bajo" y genera
                            alertas automáticas. Por ejemplo, si configuras 10
                            unidades, el producto aparecerá en las alertas
                            cuando tenga menos de 10 unidades en stock.
                        </p>
                    </div>

                    {/* Búsqueda de producto */}
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
                            maxResults={10}
                        />
                    </div>
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
                                <FaBoxes />
                                Configurar Umbral de Stock
                            </h4>

                            {/* Información del producto */}
                            <div
                                style={{
                                    padding: "10px",
                                    backgroundColor: "#e8f5e9",
                                    border: "1px solid #c3e6cb",
                                    borderRadius: "6px",
                                    marginBottom: "15px",
                                    fontSize: "14px",
                                    color: "#155724",
                                }}
                            >
                                <strong>Producto:</strong>{" "}
                                {selectedProduct.name}
                                <br />
                                <strong>SKU:</strong> {selectedProduct.sku}
                            </div>

                            {/* Valor actual si existe */}
                            {selectedProduct.min_stock_threshold !==
                                undefined && (
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
                                    {selectedProduct.min_stock_threshold}{" "}
                                    unidades
                                </div>
                            )}

                            {/* Configuración del umbral */}
                            <div
                                style={{
                                    display: "flex",
                                    gap: "15px",
                                    alignItems: "end",
                                }}
                            >
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
                                        Cantidad mínima
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={umbralValue}
                                        onChange={(e) =>
                                            setUmbralValue(e.target.value)
                                        }
                                        disabled={isUpdating}
                                        placeholder="Ej: 10"
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
                                    <div
                                        style={{
                                            padding: "10px",
                                            border: "1px solid #ced4da",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                            backgroundColor: "#f8f9fa",
                                            color: "#6c757d",
                                        }}
                                    >
                                        Unidades
                                    </div>
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
                                    <strong>Efecto:</strong> El producto
                                    aparecerá en las alertas de "stock bajo"
                                    cuando tenga menos de {umbralValue} unidades
                                    en inventario.
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
                        flexShrink: 0,
                    }}
                >
                    {/* Información de ayuda */}
                    <div
                        style={{
                            marginBottom: "15px",
                            background: "#e3f2fd",
                            border: "1px solid #bbdefb",
                            borderRadius: 8,
                            padding: 12,
                            fontSize: 13,
                            color: "#1565c0",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                        }}
                    >
                        <FaExclamationTriangle />
                        El umbral de stock mínimo determina cuándo un producto
                        se considera en "stock bajo" y genera alertas
                        automáticas.
                    </div>

                    {/* Botones */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: "10px",
                        }}
                    >
                        <button
                            onClick={onClose}
                            disabled={isUpdating}
                            style={{
                                padding: "10px 20px",
                                border: "1px solid #6c757d",
                                backgroundColor: "white",
                                color: "#6c757d",
                                borderRadius: "6px",
                                cursor: isUpdating ? "not-allowed" : "pointer",
                                fontSize: "14px",
                                fontWeight: "500",
                                opacity: isUpdating ? 0.6 : 1,
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleGuardarUmbral}
                            disabled={
                                !selectedProduct ||
                                isUpdating ||
                                umbralValue === ""
                            }
                            style={{
                                padding: "10px 20px",
                                border: "none",
                                backgroundColor:
                                    !selectedProduct ||
                                    isUpdating ||
                                    umbralValue === ""
                                        ? "#6c757d"
                                        : "#28a745",
                                color: "white",
                                borderRadius: "6px",
                                cursor:
                                    !selectedProduct ||
                                    isUpdating ||
                                    umbralValue === ""
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
                            {isUpdating ? "Guardando..." : "Guardar Umbral"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfigurarUmbralStockModal;
