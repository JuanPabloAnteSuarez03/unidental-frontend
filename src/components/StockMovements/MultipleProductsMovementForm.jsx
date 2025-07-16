import React, { useState, useEffect } from "react";
import ProductSearchSelector from "../Common/ProductSearchSelector";
import ProductEntryCard from "./ProductEntryCard";
import ProductsSummary from "./ProductsSummary";
import batchesService from "../../services/batchesService";
import { useAuth } from "../../context/AuthContext";

const MultipleProductsMovementForm = ({
    formData,
    handleInputChange,
    handleSubmit,
    locations,
    isLoadingLocations,
    isSubmitting = false,
    prefilledProducts = [],
}) => {
    // Estado simulado para múltiples productos
    const [multipleProducts, setMultipleProducts] = useState(prefilledProducts);
    const [previousLocation, setPreviousLocation] = useState(formData.location);
    const [wasSubmitting, setWasSubmitting] = useState(false); // NUEVO: Para detectar envíos exitosos
    const { authToken } = useAuth();

    // Efecto para cargar productos pre-llenados
    useEffect(() => {
        if (prefilledProducts.length > 0) {
            setMultipleProducts(prefilledProducts);
        }
    }, [prefilledProducts]);

    // Efecto para detectar envíos exitosos y limpiar productos
    useEffect(() => {
        // Si estaba enviando y ahora no, y la ubicación se vació, fue un envío exitoso
        if (wasSubmitting && !isSubmitting && !formData.location) {
            // Limpiar la lista de productos solo después de un envío exitoso
            setMultipleProducts([]);
        }

        // Actualizar el estado de envío
        setWasSubmitting(isSubmitting);
        setPreviousLocation(formData.location);
    }, [isSubmitting, formData.location, wasSubmitting]);

    const handleRemoveProduct = (productId) => {
        setMultipleProducts(multipleProducts.filter((p) => p.id !== productId));
    };

    const handleProductQuantityChange = (productId, quantity) => {
        setMultipleProducts(
            multipleProducts.map((p) =>
                p.id === productId
                    ? { ...p, quantity, isValid: quantity > 0 }
                    : p
            )
        );
    };

    const handleProductBatchesChange = (productId, batchesData) => {
        setMultipleProducts(
            multipleProducts.map((p) =>
                p.id === productId ? { ...p, batchesData } : p
            )
        );
    };

    const getTotalProducts = () => multipleProducts.length;

    const getTotalUnits = () => {
        return multipleProducts.reduce((sum, p) => {
            if (p.requiresBatchControl && p.batchesData.length > 0) {
                // Para productos con lotes, sumar las cantidades de todos los lotes
                const batchesTotal = p.batchesData.reduce((batchSum, batch) => {
                    const quantity = parseInt(batch.quantity || 0);
                    return batchSum + quantity;
                }, 0);
                return sum + batchesTotal;
            } else {
                // Para productos sin lotes, usar la cantidad principal
                const quantity = parseInt(p.quantity || 0);
                return sum + quantity;
            }
        }, 0);
    };

    const getTotalBatches = () =>
        multipleProducts.reduce((sum, p) => sum + p.batchesData.length, 0);

    return (
        <div
            style={{
                backgroundColor: "#fff",
                borderRadius: "16px",
                padding: "24px",
                boxShadow:
                    "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
                maxWidth: "1400px",
                margin: "0 auto",
                border: "1px solid #e9ecef",
            }}
        >
            <div style={{ marginBottom: "24px", textAlign: "center" }}>
                <h2
                    style={{
                        fontSize: "24px",
                        fontWeight: "700",
                        margin: "0 0 8px 0",
                        color: "#2c3e50",
                        letterSpacing: "-0.5px",
                    }}
                >
                    Registrar Múltiples Productos
                </h2>
                <p
                    style={{
                        fontSize: "14px",
                        color: "#6c757d",
                        margin: "0",
                        fontWeight: "400",
                        lineHeight: "1.5",
                    }}
                >
                    Agregue varios productos para registrar movimientos en lote
                </p>

                {/* Notificación de datos pre-llenados desde orden de compra */}
                {prefilledProducts.length > 0 && (
                    <div
                        style={{
                            marginTop: "16px",
                            padding: "12px 16px",
                            backgroundColor: "#e8f5e8",
                            border: "1px solid #4caf50",
                            borderRadius: "8px",
                            display: "inline-block",
                            maxWidth: "600px",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                fontSize: "14px",
                                color: "#2e7d32",
                                fontWeight: "600",
                            }}
                        >
                            <span style={{ fontSize: "16px" }}>✅</span>
                            Datos cargados desde orden de compra
                        </div>
                        <p
                            style={{
                                margin: "4px 0 0 0",
                                fontSize: "12px",
                                color: "#4caf50",
                                fontWeight: "400",
                            }}
                        >
                            Se han pre-llenado {prefilledProducts.length}{" "}
                            producto{prefilledProducts.length !== 1 ? "s" : ""}.
                            Para productos con lotes, especifique los datos de
                            lote requeridos.
                        </p>
                    </div>
                )}
            </div>

            <form
                onSubmit={(e) => handleSubmit(e, multipleProducts)}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                }}
            >
                {/* Configuración General */}
                <div
                    style={{
                        backgroundColor: "#f8f9fa",
                        padding: "20px",
                        borderRadius: "12px",
                        border: "1px solid #e9ecef",
                    }}
                >
                    <h3
                        style={{
                            fontSize: "18px",
                            fontWeight: "600",
                            margin: "0 0 16px 0",
                            color: "#2c3e50",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        <span style={{ fontSize: "20px" }}>⚙️</span>
                        Configuración General
                    </h3>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr 2fr",
                            gap: "20px",
                        }}
                    >
                        {/* Tipo de Movimiento */}
                        <div>
                            <label
                                style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                    fontSize: "14px",
                                }}
                            >
                                Tipo de Movimiento{" "}
                                <span style={{ color: "#dc3545" }}>*</span>
                            </label>
                            <div
                                style={{
                                    display: "flex",
                                    gap: "8px",
                                }}
                            >
                                {[
                                    {
                                        value: "in",
                                        label: "Entrada",
                                        color: "#28a745",
                                    },
                                    {
                                        value: "out",
                                        label: "Salida",
                                        color: "#fd7e14",
                                    },
                                ].map((type) => (
                                    <label
                                        key={type.value}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            padding: "10px 12px",
                                            border: `2px solid ${
                                                formData.movementType ===
                                                type.value
                                                    ? type.color
                                                    : "#e9ecef"
                                            }`,
                                            borderRadius: "8px",
                                            backgroundColor:
                                                formData.movementType ===
                                                type.value
                                                    ? `${type.color}15`
                                                    : "#fff",
                                            cursor: "pointer",
                                            transition: "all 0.2s ease",
                                            fontWeight: "600",
                                            color:
                                                formData.movementType ===
                                                type.value
                                                    ? type.color
                                                    : "#495057",
                                            fontSize: "14px",
                                            flex: "1",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="movementType"
                                            value={type.value}
                                            checked={
                                                formData.movementType ===
                                                type.value
                                            }
                                            onChange={handleInputChange}
                                            style={{
                                                marginRight: "6px",
                                                transform: "scale(1.1)",
                                                accentColor: type.color,
                                            }}
                                            required
                                        />
                                        {type.label}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Ubicación */}
                        <div>
                            <label
                                htmlFor="location"
                                style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                    fontSize: "14px",
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
                                    padding: "10px 12px",
                                    borderRadius: "8px",
                                    border: "2px solid #e9ecef",
                                    fontSize: "14px",
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
                                }}
                                required
                            >
                                <option value="">
                                    {isLoadingLocations
                                        ? "Cargando..."
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

                        {/* Notas Globales */}
                        <div style={{ maxWidth: "540px" }}>
                            <label
                                htmlFor="notes"
                                style={{
                                    display: "block",
                                    marginBottom: "8px",
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                    fontSize: "14px",
                                }}
                            >
                                Notas Globales
                                <span
                                    style={{
                                        color: "#6c757d",
                                        fontWeight: "400",
                                        fontSize: "12px",
                                    }}
                                >
                                    {" "}
                                    (opcional)
                                </span>
                            </label>
                            <textarea
                                id="notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                rows="2"
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    borderRadius: "8px",
                                    border: "2px solid #e9ecef",
                                    fontSize: "14px",
                                    fontWeight: "400",
                                    color: "#495057",
                                    resize: "vertical",
                                    transition: "all 0.2s ease",
                                    outline: "none",
                                    fontFamily: "inherit",
                                    minHeight: "60px",
                                }}
                                placeholder="Notas aplicables a todos los productos..."
                            />
                        </div>
                    </div>
                </div>

                {/* Buscador de Productos */}
                <div
                    style={{
                        backgroundColor: "#f8f9fa",
                        padding: "20px",
                        borderRadius: "12px",
                        border: "1px solid #e9ecef",
                    }}
                >
                    <h3
                        style={{
                            fontSize: "18px",
                            fontWeight: "600",
                            margin: "0 0 16px 0",
                            color: "#2c3e50",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        <span style={{ fontSize: "20px" }}>🔍</span>
                        Buscar y Agregar Productos
                    </h3>

                    <div
                        style={{
                            backgroundColor: "#fff",
                            padding: "16px",
                            borderRadius: "12px",
                            border: "1px solid #dee2e6",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                        }}
                    >
                        <label
                            style={{
                                display: "block",
                                marginBottom: "8px",
                                fontWeight: "600",
                                color: "#2c3e50",
                                fontSize: "14px",
                            }}
                        >
                            Buscar Producto
                        </label>
                        <ProductSearchSelector
                            onProductSelected={(product) => {
                                // Verificar si el producto ya está agregado
                                const isAlreadyAdded = multipleProducts.some(
                                    (p) => p.product.id === product.id
                                );
                                if (!isAlreadyAdded) {
                                    // Detectar si el producto requiere control de lotes
                                    const requiresBatchControl =
                                        batchesService.requiresBatchControl(
                                            product
                                        );

                                    const newEntry = {
                                        id: Date.now(),
                                        product: product,
                                        quantity: "",
                                        expiryDate: "",
                                        batchesData: requiresBatchControl
                                            ? [
                                                  {
                                                      batch_number: "",
                                                      expiry_date: "",
                                                      manufacturing_date: "",
                                                      supplier_reference: "",
                                                      quantity: "",
                                                  },
                                              ]
                                            : [],
                                        requiresBatchControl:
                                            requiresBatchControl,
                                        isValid: false,
                                    };
                                    setMultipleProducts([
                                        ...multipleProducts,
                                        newEntry,
                                    ]);
                                } else {
                                    // Mostrar notificación de que ya está agregado
                                    alert(
                                        `El producto "${product.name}" ya está en la lista`
                                    );
                                }
                            }}
                            onSelectionCleared={() => {}}
                            placeholder="Buscar producto por nombre, SKU o código... (se agregará automáticamente)"
                        />
                    </div>
                </div>

                {/* Lista de Productos */}
                <div
                    style={{
                        backgroundColor: "#f8f9fa",
                        padding: "20px",
                        borderRadius: "12px",
                        border: "1px solid #e9ecef",
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
                        <h3
                            style={{
                                fontSize: "18px",
                                fontWeight: "600",
                                margin: "0",
                                color: "#2c3e50",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <span style={{ fontSize: "20px" }}>📦</span>
                            Productos Agregados ({getTotalProducts()})
                        </h3>

                        {multipleProducts.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setMultipleProducts([])}
                                style={{
                                    backgroundColor: "#dc3545",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    padding: "8px 16px",
                                    fontSize: "13px",
                                    cursor: "pointer",
                                    fontWeight: "600",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    transition: "all 0.2s ease",
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                        "#c82333";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor =
                                        "#dc3545";
                                }}
                            >
                                <span>🗑️</span> Limpiar Todo
                            </button>
                        )}
                    </div>

                    {/* Lista de Productos Agregados */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                        }}
                    >
                        {multipleProducts.map((productEntry) => (
                            <ProductEntryCard
                                key={productEntry.id}
                                productEntry={productEntry}
                                onRemove={handleRemoveProduct}
                                onQuantityChange={handleProductQuantityChange}
                                onBatchesChange={handleProductBatchesChange}
                                movementType={formData.movementType}
                                locationId={formData.location}
                                authToken={authToken}
                            />
                        ))}
                    </div>

                    {multipleProducts.length === 0 && (
                        <div
                            style={{
                                textAlign: "center",
                                padding: "32px 20px",
                                backgroundColor: "#fff",
                                borderRadius: "12px",
                                border: "2px dashed #dee2e6",
                                color: "#6c757d",
                                fontSize: "14px",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "40px",
                                    marginBottom: "12px",
                                }}
                            >
                                📦
                            </div>
                            <p
                                style={{
                                    margin: "0 0 6px 0",
                                    fontWeight: "500",
                                }}
                            >
                                No hay productos agregados
                            </p>
                            <p style={{ margin: "0", fontSize: "13px" }}>
                                Usa el buscador de arriba para agregar productos
                            </p>
                        </div>
                    )}
                </div>

                {/* Resumen */}
                {multipleProducts.length > 0 && (
                    <div
                        style={{
                            backgroundColor: "#e3f2fd",
                            padding: "16px",
                            borderRadius: "12px",
                            border: "1px solid #bbdefb",
                        }}
                    >
                        <ProductsSummary
                            totalProducts={getTotalProducts()}
                            totalUnits={getTotalUnits()}
                            totalBatches={getTotalBatches()}
                            movementType={formData.movementType}
                        />
                    </div>
                )}

                {/* Botón de envío */}
                <div style={{ textAlign: "center", paddingTop: "8px" }}>
                    <button
                        type="submit"
                        disabled={multipleProducts.length === 0 || isSubmitting}
                        style={{
                            background:
                                multipleProducts.length > 0 && !isSubmitting
                                    ? "linear-gradient(135deg, #28a745 0%, #20c997 100%)"
                                    : "#6c757d",
                            color: "white",
                            border: "none",
                            borderRadius: "12px",
                            padding: "16px 40px",
                            fontSize: "16px",
                            cursor:
                                multipleProducts.length > 0 && !isSubmitting
                                    ? "pointer"
                                    : "not-allowed",
                            fontWeight: "700",
                            minWidth: "240px",
                            boxShadow:
                                multipleProducts.length > 0 && !isSubmitting
                                    ? "0 6px 20px rgba(40, 167, 69, 0.3)"
                                    : "none",
                            transition: "all 0.3s ease",
                            letterSpacing: "0.5px",
                            textTransform: "uppercase",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "10px",
                            opacity: isSubmitting ? 0.7 : 1,
                        }}
                        onMouseEnter={(e) => {
                            if (multipleProducts.length > 0 && !isSubmitting) {
                                e.currentTarget.style.transform =
                                    "translateY(-2px)";
                                e.currentTarget.style.boxShadow =
                                    "0 8px 24px rgba(40, 167, 69, 0.4)";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (multipleProducts.length > 0 && !isSubmitting) {
                                e.currentTarget.style.transform =
                                    "translateY(0)";
                                e.currentTarget.style.boxShadow =
                                    "0 6px 20px rgba(40, 167, 69, 0.3)";
                            }
                        }}
                    >
                        {isSubmitting ? (
                            <>
                                <div
                                    style={{
                                        width: "18px",
                                        height: "18px",
                                        border: "2px solid transparent",
                                        borderTop: "2px solid white",
                                        borderRadius: "50%",
                                        animation: "spin 1s linear infinite",
                                    }}
                                ></div>
                                Procesando...
                            </>
                        ) : (
                            <>
                                <span style={{ fontSize: "18px" }}>✓</span>
                                Registrar {getTotalProducts()} Producto
                                {getTotalProducts() !== 1 ? "s" : ""}
                            </>
                        )}
                    </button>

                    {multipleProducts.length === 0 && !isSubmitting && (
                        <p
                            style={{
                                marginTop: "8px",
                                fontSize: "13px",
                                color: "#6c757d",
                                fontStyle: "italic",
                            }}
                        >
                            Agrega al menos un producto para continuar
                        </p>
                    )}

                    {isSubmitting && (
                        <p
                            style={{
                                marginTop: "8px",
                                fontSize: "13px",
                                color: "#28a745",
                                fontStyle: "italic",
                                fontWeight: "600",
                            }}
                        >
                            Registrando movimientos de inventario...
                        </p>
                    )}
                </div>

                {/* CSS para la animación del spinner */}
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </form>
        </div>
    );
};

export default MultipleProductsMovementForm;
