import React, { useState } from "react";

const QuoteModal = ({
    isOpen,
    onClose,
    saleItems,
    totals,
    selectedLocation,
}) => {
    const handlePrint = () => {
        // Crear un iframe oculto para el contenido del PDF
        const iframe = document.createElement("iframe");
        iframe.style.position = "absolute";
        iframe.style.left = "-9999px";
        iframe.style.top = "-9999px";
        iframe.style.width = "800px";
        iframe.style.height = "600px";

        document.body.appendChild(iframe);

        const iframeDoc =
            iframe.contentDocument || iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Cotización - UniDental</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                    
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        line-height: 1.6;
                        color: #2d3748;
                        background: #ffffff;
                        padding: 20px;
                        width: 100%;
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    
                    .container {
                        background: white;
                        border-radius: 12px;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                        overflow: hidden;
                        border: 1px solid #e2e8f0;
                        width: 100%;
                    }
                    
                    .header {
                        background: #f0f9ff;
                        color: #1f2937;
                        padding: 30px;
                        text-align: center;
                        border-bottom: 3px solid #0ea5e9;
                    }
                    
                    .header h1 {
                        font-size: 2.2rem;
                        font-weight: 700;
                        margin-bottom: 8px;
                        color: #0c4a6e;
                        letter-spacing: -0.02em;
                    }
                    
                    .content {
                        padding: 30px;
                    }
                    
                    .items-section {
                        margin-bottom: 30px;
                    }
                    
                    .section-title {
                        font-size: 1.3rem;
                        font-weight: 600;
                        color: #0c4a6e;
                        margin-bottom: 18px;
                        padding-bottom: 8px;
                        border-bottom: 2px solid #0ea5e9;
                        letter-spacing: -0.01em;
                    }
                    
                    .items-table {
                        width: 100%;
                        border-collapse: collapse;
                        background: white;
                        border: 1px solid #e5e7eb;
                        border-radius: 8px;
                        overflow: hidden;
                    }
                    
                    .items-table th {
                        background: #f0f9ff;
                        color: #0c4a6e;
                        font-weight: 600;
                        padding: 14px 12px;
                        text-align: left;
                        font-size: 0.85rem;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        border-bottom: 2px solid #0ea5e9;
                    }
                    
                    .items-table td {
                        padding: 14px 12px;
                        border-bottom: 1px solid #f3f4f6;
                        vertical-align: middle;
                    }
                    
                    .items-table tr:nth-child(even) {
                        background: #f9fafb;
                    }
                    
                    .items-table tr:last-child td {
                        border-bottom: none;
                    }
                    
                    .product-name {
                        font-weight: 500;
                        color: #374151;
                        font-size: 0.95rem;
                        line-height: 1.4;
                    }
                    
                    .quantity {
                        text-align: center;
                        font-weight: 600;
                        color: #065f46;
                        background: #d1fae5;
                        padding: 4px 8px;
                        border-radius: 6px;
                        display: inline-block;
                        min-width: 30px;
                        font-size: 0.85rem;
                        border: 1px solid #10b981;
                    }
                    
                    .price {
                        text-align: right;
                        font-weight: 500;
                        color: #374151;
                        font-size: 0.85rem;
                        font-family: 'Courier New', monospace;
                    }
                    
                    .total {
                        text-align: right;
                        font-weight: 600;
                        color: #374151;
                        font-size: 0.85rem;
                        font-family: 'Courier New', monospace;
                    }
                    
                    .totals-section {
                        background: #f0f9ff;
                        border-radius: 12px;
                        padding: 20px;
                        margin-top: 20px;
                        border: 2px solid #0ea5e9;
                    }
                    
                    .totals-grid {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                    }
                    
                    .total-item {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 10px 0;
                        border-bottom: 1px solid #e5e7eb;
                    }
                    
                    .total-item {
                        border-bottom: none;
                        border-top: 2px solid #0ea5e9;
                        margin-top: 8px;
                        padding-top: 14px;
                        font-weight: 600;
                        font-size: 1rem;
                        background: #0ea5e9;
                        color: white;
                        border-radius: 8px;
                        padding: 14px 12px;
                        margin: 8px -12px -12px -12px;
                    }
                    
                    .total-label {
                        font-weight: 500;
                        color: #374151;
                        font-size: 0.95rem;
                    }
                    
                    .total-value {
                        font-weight: 600;
                        font-size: 0.95rem;
                        font-family: 'Courier New', monospace;
                        color: #374151;
                    }
                    
                    .final-total-value {
                        font-weight: 700;
                        font-size: 1.1rem;
                        color: white;
                    }
                    
                    @media print {
                        body {
                            padding: 15px;
                            background: white;
                            width: 100%;
                            max-width: none;
                        }
                        
                        .container {
                            box-shadow: none;
                            border: none;
                            width: 100%;
                        }
                        
                        .header {
                            background: #f0f9ff !important;
                            border-bottom: 3px solid #0ea5e9 !important;
                        }
                        
                        .items-table th {
                            background: #f0f9ff !important;
                            color: #0c4a6e !important;
                            border-bottom: 2px solid #0ea5e9 !important;
                        }
                        
                        .quantity {
                            background: #d1fae5 !important;
                            color: #065f46 !important;
                            border: 1px solid #10b981 !important;
                        }
                        
                        .totals-section {
                            background: #f0f9ff !important;
                            border: 2px solid #0ea5e9 !important;
                        }
                        
                        .total-item:last-child {
                            background: #0ea5e9 !important;
                            color: white !important;
                        }
                        
                        .section-title {
                            color: #0c4a6e !important;
                            border-bottom: 2px solid #0ea5e9 !important;
                        }
                        
                        @page {
                            margin: 1cm;
                            size: A4;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>📋 COTIZACIÓN</h1>
                    </div>
                    
                    <div class="content">
                        <div class="items-section">
                            <h2 class="section-title">Productos Cotizados</h2>
                            <table class="items-table">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th style="text-align: center;">Cantidad</th>
                                        <th style="text-align: right;">Precio Unit.</th>
                                        <th style="text-align: right;">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${saleItems
                                        .map((item) => {
                                            const itemTotal =
                                                parseFloat(item.unit_price) *
                                                item.quantity;
                                            return `
                                        <tr>
                                            <td class="product-name">${
                                                item.product_details?.name ||
                                                item.product_name ||
                                                "Producto sin nombre"
                                            }</td>
                                            <td style="text-align: center;">
                                                <span class="quantity">${
                                                    item.quantity
                                                }</span>
                                            </td>
                                            <td class="price">$${Number(
                                                item.unit_price
                                            ).toLocaleString()}</td>
                                            <td style="text-align: right;">
                                                <span class="total">$${itemTotal.toLocaleString()}</span>
                                            </td>
                                        </tr>
                                    `;
                                        })
                                        .join("")}
                                </tbody>
                            </table>
                        </div>

                        <div class="totals-section">
                            <div class="totals-grid">
                                <div class="total-item">
                                    <span class="total-label">TOTAL:</span>
                                    <span class="final-total-value">$${Number(
                                        totals.total
                                    ).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `);
        iframeDoc.close();

        // Esperar a que el iframe cargue y luego imprimir
        iframe.onload = function () {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();

            // Remover el iframe después de imprimir
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);
        };
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
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1000,
            }}
        >
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    padding: "20px",
                    maxWidth: "800px",
                    width: "90%",
                    maxHeight: "90vh",
                    overflow: "auto",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "20px",
                        borderBottom: "2px solid #3498db",
                        paddingBottom: "10px",
                    }}
                >
                    <h2 style={{ margin: 0, color: "#2c3e50" }}>
                        📋 Generar Cotización
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            fontSize: "24px",
                            cursor: "pointer",
                            color: "#6c757d",
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Información básica */}
                <div style={{ marginBottom: "20px" }}>
                    <div
                        style={{
                            backgroundColor: "#f8f9fa",
                            padding: "15px",
                            borderRadius: "4px",
                            marginBottom: "15px",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <div>
                                <strong>Fecha:</strong>{" "}
                                {new Date().toLocaleDateString("es-ES")}
                            </div>
                            <div>
                                <strong>Hora:</strong>{" "}
                                {new Date().toLocaleTimeString("es-ES")}
                            </div>
                        </div>
                        {selectedLocation && (
                            <div style={{ marginTop: "8px" }}>
                                <strong>Sede:</strong> {selectedLocation.name}
                            </div>
                        )}
                    </div>
                </div>

                {/* Products Table */}
                <div style={{ marginBottom: "20px" }}>
                    <h3 style={{ marginBottom: "10px", color: "#2c3e50" }}>
                        Productos en la Cotización
                    </h3>
                    <div
                        style={{
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                            overflow: "hidden",
                        }}
                    >
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                            }}
                        >
                            <thead>
                                <tr style={{ backgroundColor: "#f8f9fa" }}>
                                    <th
                                        style={{
                                            padding: "10px",
                                            textAlign: "left",
                                            borderBottom: "1px solid #ddd",
                                            fontWeight: "600",
                                        }}
                                    >
                                        Producto
                                    </th>
                                    <th
                                        style={{
                                            padding: "10px",
                                            textAlign: "center",
                                            borderBottom: "1px solid #ddd",
                                            fontWeight: "600",
                                        }}
                                    >
                                        Cantidad
                                    </th>
                                    <th
                                        style={{
                                            padding: "10px",
                                            textAlign: "right",
                                            borderBottom: "1px solid #ddd",
                                            fontWeight: "600",
                                        }}
                                    >
                                        Precio Unit.
                                    </th>
                                    <th
                                        style={{
                                            padding: "10px",
                                            textAlign: "right",
                                            borderBottom: "1px solid #ddd",
                                            fontWeight: "600",
                                        }}
                                    >
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {saleItems.map((item, index) => {
                                    const itemTotal =
                                        parseFloat(item.unit_price) *
                                        item.quantity;
                                    return (
                                        <tr key={index}>
                                            <td
                                                style={{
                                                    padding: "10px",
                                                    borderBottom:
                                                        "1px solid #eee",
                                                }}
                                            >
                                                {item.product_details?.name ||
                                                    item.product_name ||
                                                    "Producto sin nombre"}
                                            </td>
                                            <td
                                                style={{
                                                    padding: "10px",
                                                    textAlign: "center",
                                                    borderBottom:
                                                        "1px solid #eee",
                                                }}
                                            >
                                                {item.quantity}
                                            </td>
                                            <td
                                                style={{
                                                    padding: "10px",
                                                    textAlign: "right",
                                                    borderBottom:
                                                        "1px solid #eee",
                                                }}
                                            >
                                                $
                                                {Number(
                                                    item.unit_price
                                                ).toLocaleString()}
                                            </td>
                                            <td
                                                style={{
                                                    padding: "10px",
                                                    textAlign: "right",
                                                    borderBottom:
                                                        "1px solid #eee",
                                                    fontWeight: "600",
                                                }}
                                            >
                                                ${itemTotal.toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Totals */}
                <div
                    style={{
                        backgroundColor: "#f8f9fa",
                        padding: "15px",
                        borderRadius: "4px",
                        marginBottom: "20px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontWeight: "600",
                            fontSize: "18px",
                        }}
                    >
                        <span>TOTAL:</span>
                        <span>${Number(totals.total).toLocaleString()}</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div
                    style={{
                        display: "flex",
                        gap: "10px",
                        justifyContent: "flex-end",
                    }}
                >
                    <button
                        onClick={onClose}
                        style={{
                            padding: "10px 20px",
                            border: "1px solid #6c757d",
                            backgroundColor: "white",
                            color: "#6c757d",
                            borderRadius: "4px",
                            cursor: "pointer",
                        }}
                    >
                        Cerrar
                    </button>
                    <button
                        onClick={handlePrint}
                        style={{
                            padding: "10px 20px",
                            border: "1px solid #17a2b8",
                            backgroundColor: "white",
                            color: "#17a2b8",
                            borderRadius: "4px",
                            cursor: "pointer",
                        }}
                    >
                        🖨️ Imprimir
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuoteModal;
