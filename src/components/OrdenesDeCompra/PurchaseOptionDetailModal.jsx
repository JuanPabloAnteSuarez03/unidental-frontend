import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { getPurchaseOptionDetail } from "../../services/suppliersService";

const PurchaseOptionDetailModal = ({ isOpen, onClose, purchaseOption }) => {
    const { authToken } = useAuth();
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showPriceInput, setShowPriceInput] = useState(false);
    const [newPrice, setNewPrice] = useState("");
    const [savingPrice, setSavingPrice] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [showDateInput, setShowDateInput] = useState(false);
    const [newDate, setNewDate] = useState("");
    const [savingDate, setSavingDate] = useState(false);
    const [saveDateError, setSaveDateError] = useState(null);
    const [saveDateSuccess, setSaveDateSuccess] = useState(false);

    useEffect(() => {
        if (isOpen && purchaseOption?.id) {
            setLoading(true);
            setError(null);
            setDetail(null);
            getPurchaseOptionDetail(purchaseOption.id, authToken)
                .then((data) => setDetail(data))
                .catch((err) => setError(err.message))
                .finally(() => setLoading(false));
        }
    }, [isOpen, purchaseOption, authToken]);

    const handleSavePrice = useCallback(async () => {
        if (!detail?.id || !newPrice) return;
        setSavingPrice(true);
        setSaveError(null);
        setSaveSuccess(false);
        try {
            const response = await fetch(
                `https://unidental-backend.onrender.com/api/suppliers/purchase-options/${detail.id}/`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Token ${authToken}`,
                    },
                    body: JSON.stringify({ purchase_price: newPrice }),
                }
            );
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || "Error al guardar el precio");
            }
            setSaveSuccess(true);
            setShowPriceInput(false);
            setNewPrice("");
            // Refrescar detalles
            const updated = await getPurchaseOptionDetail(detail.id, authToken);
            setDetail(updated);
        } catch (err) {
            setSaveError(err.message);
        } finally {
            setSavingPrice(false);
        }
    }, [detail, newPrice, authToken]);

    const handleSaveDate = useCallback(async () => {
        if (!detail?.id || !newDate) return;
        setSavingDate(true);
        setSaveDateError(null);
        setSaveDateSuccess(false);
        try {
            const response = await fetch(
                `https://unidental-backend.onrender.com/api/suppliers/purchase-options/${detail.id}/`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Token ${authToken}`,
                    },
                    body: JSON.stringify({ valid_to: newDate }),
                }
            );
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || "Error al guardar la fecha");
            }
            setSaveDateSuccess(true);
            setShowDateInput(false);
            setNewDate("");
            // Refrescar detalles
            const updated = await getPurchaseOptionDetail(detail.id, authToken);
            setDetail(updated);
        } catch (err) {
            setSaveDateError(err.message);
        } finally {
            setSavingDate(false);
        }
    }, [detail, newDate, authToken]);

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2000,
                padding: "20px",
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: "white",
                    borderRadius: "16px",
                    padding: "32px",
                    maxWidth: "600px",
                    width: "100%",
                    maxHeight: "90vh",
                    overflowY: "auto",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                    position: "relative",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    style={{
                        position: "absolute",
                        top: 16,
                        right: 16,
                        background: "none",
                        border: "none",
                        fontSize: 24,
                        color: "#888",
                        cursor: "pointer",
                    }}
                >
                    ×
                </button>

                <h2
                    style={{
                        marginTop: 0,
                        marginBottom: 24,
                        fontWeight: 700,
                        fontSize: 22,
                        color: "#2c3e50",
                    }}
                >
                    Detalle de Opción de Compra
                </h2>

                {loading && (
                    <div style={{ textAlign: "center", padding: "40px" }}>
                        <div
                            style={{
                                width: "40px",
                                height: "40px",
                                border: "4px solid #e3e6ea",
                                borderTop: "4px solid #007bff",
                                borderRadius: "50%",
                                animation: "spin 1s linear infinite",
                                margin: "0 auto 16px",
                            }}
                        ></div>
                        <p>Cargando detalles...</p>
                    </div>
                )}

                {error && (
                    <div
                        style={{
                            padding: "16px",
                            backgroundColor: "#fee2e2",
                            border: "1px solid #fecaca",
                            borderRadius: "8px",
                            color: "#dc2626",
                            marginBottom: "16px",
                        }}
                    >
                        <strong>Error:</strong> {error}
                    </div>
                )}

                {detail && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "24px",
                        }}
                    >
                        {/* Información del Producto */}
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
                                    margin: "0 0 16px 0",
                                    color: "#2c3e50",
                                    fontSize: "18px",
                                    fontWeight: "600",
                                }}
                            >
                                📦 Información del Producto
                            </h3>
                            <div style={{ display: "grid", gap: "12px" }}>
                                <div>
                                    <strong>Nombre:</strong>{" "}
                                    {detail.product?.name ||
                                        detail.product_name}
                                </div>
                                <div>
                                    <strong>SKU:</strong>{" "}
                                    {detail.product?.sku || "N/A"}
                                </div>
                                <div>
                                    <strong>Categoría:</strong>{" "}
                                    {detail.category_name ||
                                        detail.product?.category_name ||
                                        "N/A"}
                                </div>
                            </div>
                        </div>

                        {/* Información de la Opción de Compra */}
                        <div
                            style={{
                                backgroundColor: "#e8f5e9",
                                padding: "20px",
                                borderRadius: "12px",
                                border: "1px solid #c8e6c9",
                            }}
                        >
                            <h3
                                style={{
                                    margin: "0 0 16px 0",
                                    color: "#2e7d32",
                                    fontSize: "18px",
                                    fontWeight: "600",
                                }}
                            >
                                💰 Información de Compra
                            </h3>
                            <div style={{ display: "grid", gap: "12px" }}>
                                <div>
                                    <strong>Precio de Compra:</strong> $
                                    {parseFloat(
                                        detail.purchase_price
                                    ).toLocaleString()}
                                </div>
                                <div>
                                    <strong>Válido desde:</strong>{" "}
                                    {new Date(
                                        detail.valid_from
                                    ).toLocaleDateString()}
                                </div>
                                <div>
                                    <strong>Válido hasta:</strong>{" "}
                                    {new Date(
                                        detail.valid_to
                                    ).toLocaleDateString()}
                                </div>
                                <div>
                                    <strong>Estado:</strong>
                                    <span
                                        style={{
                                            padding: "4px 8px",
                                            borderRadius: "4px",
                                            fontSize: "12px",
                                            fontWeight: "600",
                                            marginLeft: "8px",
                                            backgroundColor:
                                                detail.is_currently_valid
                                                    ? "#d4edda"
                                                    : "#ffeaa7",
                                            color: detail.is_currently_valid
                                                ? "#155724"
                                                : "#856404",
                                        }}
                                    >
                                        {detail.is_currently_valid
                                            ? "VIGENTE"
                                            : "NO VIGENTE"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Información del Sistema */}
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
                                    margin: "0 0 16px 0",
                                    color: "#6c757d",
                                    fontSize: "18px",
                                    fontWeight: "600",
                                }}
                            >
                                ⚙️ Información del Sistema
                            </h3>
                            <div style={{ display: "grid", gap: "12px" }}>
                                <div>
                                    <strong>ID de la Opción:</strong>{" "}
                                    {detail.id}
                                </div>
                                <div>
                                    <strong>Creado:</strong>{" "}
                                    {new Date(
                                        detail.created_at
                                    ).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Botones para cambiar precio y fecha de vigencia */}
                {detail && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "16px",
                            marginTop: "32px",
                        }}
                    >
                        {/* Campo para cambiar precio */}
                        {showPriceInput && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                }}
                            >
                                <label
                                    htmlFor="new-price"
                                    style={{ fontWeight: 600 }}
                                >
                                    Nuevo precio:
                                </label>
                                <input
                                    id="new-price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={newPrice}
                                    onChange={(e) =>
                                        setNewPrice(e.target.value)
                                    }
                                    style={{
                                        padding: "8px 12px",
                                        border: "1px solid #bdbdbd",
                                        borderRadius: "6px",
                                        fontSize: "15px",
                                        width: "120px",
                                    }}
                                />
                                <button
                                    onClick={handleSavePrice}
                                    disabled={savingPrice || !newPrice}
                                    style={{
                                        padding: "8px 16px",
                                        backgroundColor: savingPrice
                                            ? "#bdbdbd"
                                            : "#1976d2",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "6px",
                                        fontWeight: 600,
                                        fontSize: "15px",
                                        cursor: savingPrice
                                            ? "not-allowed"
                                            : "pointer",
                                        opacity: savingPrice ? 0.7 : 1,
                                    }}
                                >
                                    {savingPrice ? "Guardando..." : "Guardar"}
                                </button>
                            </div>
                        )}
                        {saveError && (
                            <div
                                style={{
                                    color: "#c62828",
                                    fontWeight: 500,
                                    marginTop: 4,
                                }}
                            >
                                {saveError}
                            </div>
                        )}
                        {saveSuccess && (
                            <div
                                style={{
                                    color: "#388e3c",
                                    fontWeight: 500,
                                    marginTop: 4,
                                }}
                            >
                                ¡Precio actualizado!
                            </div>
                        )}
                        {/* Campo para cambiar fecha de vigencia */}
                        {showDateInput && (
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                }}
                            >
                                <label
                                    htmlFor="new-date"
                                    style={{ fontWeight: 600 }}
                                >
                                    Nueva fecha de vigencia:
                                </label>
                                <input
                                    id="new-date"
                                    type="date"
                                    value={newDate}
                                    onChange={(e) => setNewDate(e.target.value)}
                                    style={{
                                        padding: "8px 12px",
                                        border: "1px solid #bdbdbd",
                                        borderRadius: "6px",
                                        fontSize: "15px",
                                        width: "160px",
                                    }}
                                />
                                <button
                                    onClick={handleSaveDate}
                                    disabled={savingDate || !newDate}
                                    style={{
                                        padding: "8px 16px",
                                        backgroundColor: savingDate
                                            ? "#bdbdbd"
                                            : "#388e3c",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "6px",
                                        fontWeight: 600,
                                        fontSize: "15px",
                                        cursor: savingDate
                                            ? "not-allowed"
                                            : "pointer",
                                        opacity: savingDate ? 0.7 : 1,
                                    }}
                                >
                                    {savingDate ? "Guardando..." : "Guardar"}
                                </button>
                            </div>
                        )}
                        {saveDateError && (
                            <div
                                style={{
                                    color: "#c62828",
                                    fontWeight: 500,
                                    marginTop: 4,
                                }}
                            >
                                {saveDateError}
                            </div>
                        )}
                        {saveDateSuccess && (
                            <div
                                style={{
                                    color: "#388e3c",
                                    fontWeight: 500,
                                    marginTop: 4,
                                }}
                            >
                                ¡Fecha de vigencia actualizada!
                            </div>
                        )}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: "16px",
                            }}
                        >
                            <button
                                style={{
                                    padding: "10px 18px",
                                    backgroundColor: "#1976d2",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontSize: "15px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    boxShadow:
                                        "0 2px 8px rgba(25,118,210,0.15)",
                                    transition: "all 0.3s ease",
                                }}
                                onClick={() => setShowPriceInput((v) => !v)}
                            >
                                Cambiar precio
                            </button>
                            <button
                                style={{
                                    padding: "10px 18px",
                                    backgroundColor: "#388e3c",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontSize: "15px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    boxShadow: "0 2px 8px rgba(56,142,60,0.15)",
                                    transition: "all 0.3s ease",
                                }}
                                onClick={() => setShowDateInput((v) => !v)}
                            >
                                Cambiar fecha de vigencia
                            </button>
                        </div>
                    </div>
                )}

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

export default PurchaseOptionDetailModal;
