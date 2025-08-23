import React, { useState } from "react";
import ProductSearchSelector from "../Common/ProductSearchSelector";
import { createPurchaseOption } from "../../services/suppliersService";
import { useAuth } from "../../context/AuthContext";

const AddPurchaseOptionModal = ({ isOpen, onClose, supplierId, onSave }) => {
    const { authToken } = useAuth();
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [purchasePrice, setPurchasePrice] = useState("");
    const [validToDate, setValidToDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleProductSelected = (product) => {
        setSelectedProduct(product);
    };

    const handleProductSelectionCleared = () => {
        setSelectedProduct(null);
    };

    const handleSave = async () => {
        if (!selectedProduct || !purchasePrice || !validToDate) {
            alert("Por favor completa todos los campos");
            return;
        }

        setIsSubmitting(true);
        try {
            // Obtener fecha actual para valid_from usando fecha local (no UTC)
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const day = String(now.getDate()).padStart(2, "0");
            const currentDate = `${year}-${month}-${day}`;

            const purchaseOptionData = {
                product: parseInt(selectedProduct.id),
                supplier: parseInt(supplierId),
                brand: "-", // Campo brand con valor por defecto
                purchase_price: parseFloat(purchasePrice).toFixed(2),
                valid_from: currentDate,
                valid_to: validToDate,
            };

            // Log adicional para verificar la estructura
            console.log(
                "🔍 Estructura de datos a enviar:",
                JSON.stringify(purchaseOptionData, null, 2)
            );

            console.log("🔄 Enviando datos a la API:", purchaseOptionData);
            console.log("📋 Detalles de los datos:", {
                productId: selectedProduct.id,
                productIdType: typeof selectedProduct.id,
                supplierId: supplierId,
                supplierIdType: typeof supplierId,
                purchasePrice: purchasePrice,
                purchasePriceType: typeof purchasePrice,
                validFrom: currentDate,
                validTo: validToDate,
            });

            // Llamar a la API para crear la opción de compra
            const createdOption = await createPurchaseOption(
                purchaseOptionData,
                authToken
            );

            console.log("✅ Opción de compra creada:", createdOption);

            // Llamar al callback de éxito
            onSave(createdOption);
            handleClose();
        } catch (error) {
            console.error("❌ Error al guardar opción de compra:", error);
            alert(`Error al guardar la opción de compra: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedProduct(null);
        setPurchasePrice("");
        setValidToDate("");
        setIsSubmitting(false);
        onClose();
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
                padding: "20px",
            }}
            onClick={handleClose}
        >
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: "16px",
                    padding: "32px",
                    maxWidth: "600px",
                    width: "100%",
                    maxHeight: "90vh",
                    overflowY: "auto",
                    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "24px",
                        paddingBottom: "16px",
                        borderBottom: "2px solid #e9ecef",
                    }}
                >
                    <h2
                        style={{
                            fontSize: "24px",
                            fontWeight: "700",
                            color: "#2c3e50",
                            margin: 0,
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                        }}
                    >
                        <svg
                            width="24"
                            height="24"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{ color: "#28a745" }}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                        </svg>
                        Agregar Opción de Compra
                    </h2>
                    <button
                        onClick={handleClose}
                        style={{
                            background: "none",
                            border: "none",
                            fontSize: "24px",
                            cursor: "pointer",
                            color: "#6c757d",
                            padding: "4px",
                            borderRadius: "4px",
                            transition: "all 0.2s ease",
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = "#f8f9fa";
                            e.currentTarget.style.color = "#dc3545";
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor =
                                "transparent";
                            e.currentTarget.style.color = "#6c757d";
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Contenido */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "24px",
                    }}
                >
                    {/* Buscador de productos */}
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
                        />
                    </div>

                    {/* Precio de compra */}
                    <div>
                        <label
                            htmlFor="purchase-price"
                            style={{
                                display: "block",
                                marginBottom: "8px",
                                fontWeight: "600",
                                fontSize: "14px",
                                color: "#2c3e50",
                            }}
                        >
                            Precio de Compra *
                        </label>
                        <div style={{ position: "relative" }}>
                            <span
                                style={{
                                    position: "absolute",
                                    left: "12px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "#6c757d",
                                    fontWeight: "600",
                                }}
                            >
                                $
                            </span>
                            <input
                                id="purchase-price"
                                type="number"
                                step="0.01"
                                min="0"
                                value={purchasePrice}
                                onChange={(e) =>
                                    setPurchasePrice(e.target.value)
                                }
                                placeholder="0.00"
                                style={{
                                    width: "100%",
                                    padding: "12px 12px 12px 32px",
                                    border: "2px solid #e9ecef",
                                    borderRadius: "8px",
                                    fontSize: "16px",
                                    fontWeight: "500",
                                    color: "#2c3e50",
                                    outline: "none",
                                    transition: "all 0.2s ease",
                                    boxSizing: "border-box",
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = "#28a745";
                                    e.target.style.boxShadow =
                                        "0 0 0 3px rgba(40,167,69,0.1)";
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = "#e9ecef";
                                    e.target.style.boxShadow = "none";
                                }}
                            />
                        </div>
                    </div>

                    {/* Fecha de fin de vigencia */}
                    <div>
                        <label
                            htmlFor="valid-to-date"
                            style={{
                                display: "block",
                                marginBottom: "8px",
                                fontWeight: "600",
                                fontSize: "14px",
                                color: "#2c3e50",
                            }}
                        >
                            Fecha de Fin de Vigencia *
                        </label>
                        <input
                            id="valid-to-date"
                            type="date"
                            value={validToDate}
                            onChange={(e) => setValidToDate(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "12px 16px",
                                border: "2px solid #e9ecef",
                                borderRadius: "8px",
                                fontSize: "16px",
                                fontWeight: "500",
                                color: "#2c3e50",
                                outline: "none",
                                transition: "all 0.2s ease",
                                boxSizing: "border-box",
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = "#28a745";
                                e.target.style.boxShadow =
                                    "0 0 0 3px rgba(40,167,69,0.1)";
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = "#e9ecef";
                                e.target.style.boxShadow = "none";
                            }}
                        />
                    </div>
                </div>

                {/* Botones de acción */}
                <div
                    style={{
                        display: "flex",
                        gap: "12px",
                        justifyContent: "flex-end",
                        marginTop: "32px",
                        paddingTop: "24px",
                        borderTop: "2px solid #e9ecef",
                    }}
                >
                    <button
                        onClick={handleClose}
                        disabled={isSubmitting}
                        style={{
                            padding: "12px 24px",
                            backgroundColor: "#6c757d",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: "600",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            opacity: isSubmitting ? 0.6 : 1,
                        }}
                        onMouseOver={(e) => {
                            if (!isSubmitting) {
                                e.currentTarget.style.backgroundColor =
                                    "#5a6268";
                            }
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = "#6c757d";
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={
                            isSubmitting ||
                            !selectedProduct ||
                            !purchasePrice ||
                            !validToDate
                        }
                        style={{
                            padding: "12px 24px",
                            backgroundColor:
                                isSubmitting ||
                                !selectedProduct ||
                                !purchasePrice ||
                                !validToDate
                                    ? "#adb5bd"
                                    : "#28a745",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: "600",
                            cursor:
                                isSubmitting ||
                                !selectedProduct ||
                                !purchasePrice ||
                                !validToDate
                                    ? "not-allowed"
                                    : "pointer",
                            transition: "all 0.2s ease",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                        onMouseOver={(e) => {
                            if (
                                !isSubmitting &&
                                selectedProduct &&
                                purchasePrice &&
                                validToDate
                            ) {
                                e.currentTarget.style.backgroundColor =
                                    "#218838";
                            }
                        }}
                        onMouseOut={(e) => {
                            if (
                                !isSubmitting &&
                                selectedProduct &&
                                purchasePrice &&
                                validToDate
                            ) {
                                e.currentTarget.style.backgroundColor =
                                    "#28a745";
                            }
                        }}
                    >
                        {isSubmitting ? (
                            <>
                                <div
                                    style={{
                                        width: "16px",
                                        height: "16px",
                                        border: "2px solid transparent",
                                        borderTop: "2px solid white",
                                        borderRadius: "50%",
                                        animation: "spin 1s linear infinite",
                                    }}
                                />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <svg
                                    width="16"
                                    height="16"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                                Guardar Opción
                            </>
                        )}
                    </button>
                </div>

                {/* Estilos CSS para la animación */}
                <style jsx>{`
                    @keyframes spin {
                        0% {
                            transform: rotate(0deg);
                        }
                        100% {
                            transform: rotate(360deg);
                        }
                    }
                `}</style>
            </div>
        </div>
    );
};

export default AddPurchaseOptionModal;
