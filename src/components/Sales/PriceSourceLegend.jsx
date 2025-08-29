import React, { useState } from "react";

const PriceSourceLegend = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    const priceTypes = [
        {
            source: 'suggested',
            icon: '💡',
            label: 'Precio de venta sugerido',
            description: 'Precio recomendado configurado en el producto',
            priority: 1
        },
        {
            source: 'sale',
            icon: '💰',
            label: 'Último precio de venta',
            description: 'El precio al que se vendió este producto por última vez',
            priority: 2
        },
        {
            source: 'purchase',
            icon: '📦',
            label: 'Último precio de compra',
            description: 'El precio al que se compró este producto por última vez',
            priority: 3
        },
        {
            source: 'cost',
            icon: '🏷️',
            label: 'Precio de costo',
            description: 'Precio base de costo del producto',
            priority: 4
        },
        {
            source: 'manual',
            icon: '✏️',
            label: 'Precio personalizado',
            description: 'Precio modificado manualmente por el usuario',
            priority: 0
        },
        {
            source: 'none',
            icon: '⚠️',
            label: 'Sin precio disponible',
            description: 'No hay información de precios - debe ingresar manualmente',
            priority: 5
        }
    ];

    return (
        <div
            style={{
                marginBottom: "15px",
                border: "1px solid #dee2e6",
                borderRadius: "6px",
                backgroundColor: "white",
            }}
        >
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: "transparent",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#6c757d",
                }}
            >
                <span>ℹ️ Información sobre precios automáticos</span>
                <span style={{ fontSize: "12px" }}>
                    {isExpanded ? "▲" : "▼"}
                </span>
            </button>

            {isExpanded && (
                <div
                    style={{
                        padding: "12px",
                        borderTop: "1px solid #f8f9fa",
                        backgroundColor: "#f8f9fa",
                    }}
                >
                    <div style={{ marginBottom: "12px", fontSize: "13px", color: "#6c757d" }}>
                        El sistema busca automáticamente el mejor precio disponible en este orden:
                    </div>

                    {priceTypes
                        .filter(type => type.priority > 0)
                        .sort((a, b) => a.priority - b.priority)
                        .map((type, index) => (
                            <div
                                key={type.source}
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "8px",
                                    marginBottom: "8px",
                                    padding: "8px",
                                    backgroundColor: "white",
                                    borderRadius: "4px",
                                    border: "1px solid #e9ecef",
                                }}
                            >
                                <span style={{ fontSize: "16px", marginTop: "2px" }}>
                                    {index + 1}.
                                </span>
                                <span style={{ fontSize: "16px", marginTop: "2px" }}>
                                    {type.icon}
                                </span>
                                <div style={{ flex: 1 }}>
                                    <div
                                        style={{
                                            fontSize: "13px",
                                            fontWeight: "600",
                                            color: "#2c3e50",
                                            marginBottom: "2px",
                                        }}
                                    >
                                        {type.label}
                                    </div>
                                    <div style={{ fontSize: "12px", color: "#6c757d" }}>
                                        {type.description}
                                    </div>
                                </div>
                            </div>
                        ))}

                    <div style={{ marginTop: "12px", fontSize: "12px", color: "#6c757d" }}>
                        <strong>Nota:</strong> Si modificas el precio manualmente, se marcará como "Precio personalizado" ✏️
                    </div>
                </div>
            )}
        </div>
    );
};

export default PriceSourceLegend; 