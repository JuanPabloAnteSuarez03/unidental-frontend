import React from "react";
import { companyConfig } from "../../config/company";

const PurchaseOrderModal = ({
    isOpen,
    onClose,
    orderData,
    supplierData,
    locationData,
    orderItems,
    totals,
    notes,
}) => {
    if (!isOpen) return null;

    // Función para generar número de orden formateado
    const getOrderNumber = (orderId) => {
        const paddedId = String(orderId).padStart(6, "0");
        return `${companyConfig.orderPrefix || "OC"}-${paddedId}`;
    };

    const handlePrint = () => {
        // Crear una nueva ventana con solo el contenido de la orden
        const printWindow = window.open("", "_blank");
        const orderContent = document.getElementById(
            "purchase-order-content"
        ).innerHTML;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Orden de Compra ${getOrderNumber(orderData.id)} - ${
            companyConfig.name
        }</title>
                <style>
                    * {
                        box-sizing: border-box;
                        margin: 0;
                        padding: 0;
                    }
                    
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        font-size: 14px;
                        line-height: 1.4;
                        color: #2c3e50;
                        background: white;
                        padding: 20px;
                    }
                    
                    .order-header-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 30px;
                        margin-bottom: 30px;
                        padding-bottom: 20px;
                        border-bottom: 2px solid #2c3e50;
                    }
                    
                    .order-totals-grid {
                        display: grid;
                        grid-template-columns: 1fr 300px;
                        gap: 30px;
                        margin-bottom: 30px;
                    }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                    }
                    
                    th, td {
                        padding: 12px;
                        text-align: left;
                        border-bottom: 1px solid #dee2e6;
                    }
                    
                    th {
                        background-color: #2c3e50;
                        color: white;
                        font-weight: 600;
                    }
                    
                    tr:nth-child(even) {
                        background-color: #f8f9fa;
                    }
                    
                    .text-right {
                        text-align: right;
                    }
                    
                    .text-center {
                        text-align: center;
                    }
                    
                    .font-bold {
                        font-weight: 600;
                    }
                    
                    .text-lg {
                        font-size: 18px;
                    }
                    
                    .text-xl {
                        font-size: 24px;
                    }
                    
                    .text-2xl {
                        font-size: 28px;
                    }
                    
                    .mb-2 {
                        margin-bottom: 8px;
                    }
                    
                    .mb-4 {
                        margin-bottom: 16px;
                    }
                    
                    .mb-6 {
                        margin-bottom: 24px;
                    }
                    
                    .p-4 {
                        padding: 16px;
                    }
                    
                    .p-5 {
                        padding: 20px;
                    }
                    
                    .bg-gray {
                        background-color: #f8f9fa;
                    }
                    
                    .bg-dark {
                        background-color: #2c3e50;
                        color: white;
                    }
                    
                    .border {
                        border: 1px solid #dee2e6;
                    }
                    
                    .border-radius {
                        border-radius: 6px;
                    }
                    
                    .text-gray {
                        color: #6c757d;
                    }
                    
                    .text-blue {
                        color: #3498db;
                    }
                    
                    @media print {
                        body {
                            padding: 0;
                        }
                        
                        .order-header-grid {
                            break-inside: avoid;
                        }
                        
                        .order-totals-grid {
                            grid-template-columns: 1fr;
                        }
                        
                        table {
                            break-inside: avoid;
                        }
                        
                        tr {
                            break-inside: avoid;
                        }
                    }
                </style>
            </head>
            <body>
                ${orderContent}
            </body>
            </html>
        `);

        printWindow.document.close();

        // Esperar a que la ventana cargue y luego imprimir
        printWindow.onload = function () {
            printWindow.focus();
            printWindow.print();

            // Cerrar la ventana después de imprimir (opcional)
            setTimeout(() => {
                printWindow.close();
            }, 1000);
        };
    };

    const currentDate = new Date().toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <>
            {/* Overlay */}
            <div
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    zIndex: 1000,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "20px",
                }}
                onClick={onClose}
            >
                {/* Modal Content */}
                <div
                    style={{
                        backgroundColor: "white",
                        borderRadius: "8px",
                        padding: "0",
                        maxWidth: "800px",
                        width: "100%",
                        maxHeight: "90vh",
                        overflow: "hidden",
                        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
                        position: "relative",
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header del Modal */}
                    <div
                        style={{
                            padding: "20px",
                            borderBottom: "1px solid #dee2e6",
                            backgroundColor: "#f8f9fa",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                        className="no-print"
                    >
                        <h2
                            style={{
                                margin: 0,
                                fontSize: "20px",
                                fontWeight: "600",
                                color: "#2c3e50",
                            }}
                        >
                            📋 Orden de Compra
                        </h2>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <button
                                onClick={handlePrint}
                                style={{
                                    padding: "8px 16px",
                                    backgroundColor: "#3498db",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                }}
                                title="Imprimir orden de compra"
                            >
                                🖨️ Imprimir
                            </button>
                            <button
                                onClick={onClose}
                                style={{
                                    padding: "8px 12px",
                                    backgroundColor: "#e74c3c",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                }}
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Content - Purchase Order */}
                    <div
                        style={{
                            padding: "40px",
                            overflow: "auto",
                            maxHeight: "calc(90vh - 80px)",
                        }}
                        id="purchase-order-content"
                    >
                        {/* Header de la Orden */}
                        <div
                            className="order-header-grid"
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 1fr",
                                gap: "30px",
                                marginBottom: "30px",
                                paddingBottom: "20px",
                                borderBottom: "2px solid #2c3e50",
                            }}
                        >
                            {/* Datos de la empresa */}
                            <div>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        marginBottom: "10px",
                                    }}
                                >
                                    <img
                                        src="/img/favicon.png"
                                        alt="Logo"
                                        style={{
                                            width: "50px",
                                            height: "50px",
                                            marginRight: "15px",
                                            objectFit: "contain",
                                        }}
                                    />
                                    <h1
                                        style={{
                                            margin: "0",
                                            fontSize: "28px",
                                            fontWeight: "700",
                                            color: "#2c3e50",
                                        }}
                                    >
                                        {companyConfig.name}
                                    </h1>
                                </div>
                                <div
                                    style={{
                                        fontSize: "14px",
                                        color: "#6c757d",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    {companyConfig.slogan && (
                                        <div
                                            style={{
                                                marginTop: "8px",
                                                fontStyle: "italic",
                                                fontSize: "12px",
                                                color: "#3498db",
                                            }}
                                        >
                                            "{companyConfig.slogan}"
                                        </div>
                                    )}
                                    {locationData && (
                                        <div
                                            style={{
                                                marginTop: "10px",
                                                padding: "8px",
                                                backgroundColor: "#e8f4fd",
                                                borderRadius: "4px",
                                                fontSize: "12px",
                                                color: "#2c3e50",
                                            }}
                                        >
                                            <strong>🏢 Sede de Destino:</strong>{" "}
                                            {locationData.name}
                                            {locationData.address && (
                                                <div
                                                    style={{ marginTop: "2px" }}
                                                >
                                                    📍 {locationData.address}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Datos de la orden */}
                            <div style={{ textAlign: "right" }}>
                                <div
                                    style={{
                                        padding: "15px",
                                        backgroundColor: "#f8f9fa",
                                        borderRadius: "6px",
                                        border: "1px solid #dee2e6",
                                    }}
                                >
                                    <h2
                                        style={{
                                            margin: "0 0 10px 0",
                                            fontSize: "24px",
                                            fontWeight: "600",
                                            color: "#2c3e50",
                                        }}
                                    >
                                        ORDEN DE COMPRA
                                    </h2>
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            color: "#6c757d",
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        <div>
                                            <strong>Número:</strong>{" "}
                                            {getOrderNumber(orderData.id)}
                                        </div>
                                        <div>
                                            <strong>Fecha:</strong>{" "}
                                            {currentDate}
                                        </div>
                                        <div>
                                            <strong>Estado:</strong>{" "}
                                            {orderData.status_display ||
                                                "Pendiente"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Datos del proveedor */}
                        <div
                            style={{
                                marginBottom: "30px",
                                padding: "20px",
                                backgroundColor: "#f8f9fa",
                                borderRadius: "6px",
                                border: "1px solid #dee2e6",
                            }}
                        >
                            <h3
                                style={{
                                    margin: "0 0 15px 0",
                                    fontSize: "18px",
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                }}
                            >
                                DATOS DEL PROVEEDOR
                            </h3>
                            <div
                                style={{
                                    fontSize: "14px",
                                    color: "#2c3e50",
                                    lineHeight: 1.6,
                                }}
                            >
                                <div style={{ marginBottom: "5px" }}>
                                    <strong>Nombre:</strong> {supplierData.name}
                                </div>
                                {supplierData.phone && (
                                    <div style={{ marginBottom: "5px" }}>
                                        <strong>Teléfono:</strong>{" "}
                                        {supplierData.phone}
                                    </div>
                                )}
                                {supplierData.email && (
                                    <div style={{ marginBottom: "5px" }}>
                                        <strong>Email:</strong>{" "}
                                        {supplierData.email}
                                    </div>
                                )}
                                {supplierData.address && (
                                    <div style={{ marginBottom: "5px" }}>
                                        <strong>Dirección:</strong>{" "}
                                        {supplierData.address}
                                    </div>
                                )}
                                {supplierData.notes && (
                                    <div style={{ marginBottom: "5px" }}>
                                        <strong>Notas:</strong>{" "}
                                        {supplierData.notes}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tabla de productos */}
                        <div style={{ marginBottom: "30px" }}>
                            <h3
                                style={{
                                    margin: "0 0 15px 0",
                                    fontSize: "18px",
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                }}
                            >
                                DETALLE DE PRODUCTOS
                            </h3>
                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                    fontSize: "14px",
                                }}
                            >
                                <thead>
                                    <tr
                                        style={{
                                            backgroundColor: "#2c3e50",
                                            color: "white",
                                        }}
                                    >
                                        <th
                                            style={{
                                                padding: "12px",
                                                textAlign: "left",
                                                borderBottom:
                                                    "1px solid #dee2e6",
                                            }}
                                        >
                                            Producto
                                        </th>
                                        <th
                                            style={{
                                                padding: "12px",
                                                textAlign: "center",
                                                borderBottom:
                                                    "1px solid #dee2e6",
                                            }}
                                        >
                                            Cantidad
                                        </th>
                                        <th
                                            style={{
                                                padding: "12px",
                                                textAlign: "right",
                                                borderBottom:
                                                    "1px solid #dee2e6",
                                            }}
                                        >
                                            Precio Unit.
                                        </th>
                                        <th
                                            style={{
                                                padding: "12px",
                                                textAlign: "right",
                                                borderBottom:
                                                    "1px solid #dee2e6",
                                            }}
                                        >
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orderItems.map((item, index) => {
                                        // Usar los campos correctos de la API
                                        const quantity =
                                            item.quantity_requested ||
                                            item.quantity ||
                                            0;
                                        const unitPrice =
                                            item.unit_price ||
                                            item.purchase_price ||
                                            0;
                                        const itemTotal =
                                            parseFloat(unitPrice) *
                                            parseFloat(quantity);

                                        return (
                                            <tr
                                                key={index}
                                                style={{
                                                    backgroundColor:
                                                        index % 2 === 0
                                                            ? "white"
                                                            : "#f8f9fa",
                                                }}
                                            >
                                                <td
                                                    style={{
                                                        padding: "12px",
                                                        borderBottom:
                                                            "1px solid #dee2e6",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            fontWeight: "600",
                                                            color: "#2c3e50",
                                                        }}
                                                    >
                                                        {item
                                                            .purchase_option_details
                                                            ?.product_name ||
                                                            item.product_name ||
                                                            item.name}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: "12px",
                                                            color: "#6c757d",
                                                        }}
                                                    >
                                                        SKU:{" "}
                                                        {item
                                                            .purchase_option_details
                                                            ?.product_sku ||
                                                            item.sku ||
                                                            item.product_sku}
                                                    </div>
                                                    {item.category_name && (
                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "12px",
                                                                color: "#6c757d",
                                                            }}
                                                        >
                                                            Categoría:{" "}
                                                            {item.category_name}
                                                        </div>
                                                    )}
                                                    {item.brand && (
                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "12px",
                                                                color: "#6c757d",
                                                            }}
                                                        >
                                                            Marca: {item.brand}
                                                        </div>
                                                    )}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "12px",
                                                        textAlign: "center",
                                                        borderBottom:
                                                            "1px solid #dee2e6",
                                                    }}
                                                >
                                                    {quantity}{" "}
                                                    {item.unit || "unidades"}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "12px",
                                                        textAlign: "right",
                                                        borderBottom:
                                                            "1px solid #dee2e6",
                                                    }}
                                                >
                                                    $
                                                    {Number(
                                                        unitPrice
                                                    ).toLocaleString()}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "12px",
                                                        textAlign: "right",
                                                        borderBottom:
                                                            "1px solid #dee2e6",
                                                        fontWeight: "600",
                                                    }}
                                                >
                                                    $
                                                    {itemTotal.toLocaleString()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Totales */}
                        <div
                            className="order-totals-grid"
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    window.innerWidth > 768
                                        ? "1fr 300px"
                                        : "1fr",
                                gap: "30px",
                                marginBottom: "30px",
                            }}
                        >
                            <div>
                                {/* Información adicional */}
                                <div
                                    style={{
                                        padding: "20px",
                                        backgroundColor: "#f8f9fa",
                                        borderRadius: "6px",
                                        border: "1px solid #dee2e6",
                                    }}
                                >
                                    <h4
                                        style={{
                                            margin: "0 0 10px 0",
                                            fontSize: "16px",
                                            fontWeight: "600",
                                            color: "#2c3e50",
                                        }}
                                    >
                                        INFORMACIÓN ADICIONAL
                                    </h4>
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            color: "#6c757d",
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        <div>
                                            • Total de productos:{" "}
                                            {orderItems.length}
                                        </div>
                                        <div>
                                            • Cantidad total:{" "}
                                            {orderItems.reduce(
                                                (sum, item) =>
                                                    sum +
                                                    (item.quantity_requested ||
                                                        item.quantity ||
                                                        0),
                                                0
                                            )}{" "}
                                            unidades
                                        </div>
                                        <div>• Tipo: Orden de compra</div>
                                        <div>
                                            • Estado:{" "}
                                            {orderData.status_display ||
                                                "Pendiente"}
                                        </div>
                                        {notes && (
                                            <div
                                                style={{
                                                    marginTop: "10px",
                                                    padding: "10px",
                                                    backgroundColor: "white",
                                                    borderRadius: "4px",
                                                }}
                                            >
                                                <strong>Notas:</strong> {notes}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                {/* Resumen de totales */}
                                <div
                                    style={{
                                        padding: "20px",
                                        backgroundColor: "#2c3e50",
                                        color: "white",
                                        borderRadius: "6px",
                                    }}
                                >
                                    <h4
                                        style={{
                                            margin: "0 0 15px 0",
                                            fontSize: "16px",
                                            fontWeight: "600",
                                        }}
                                    >
                                        RESUMEN
                                    </h4>
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                marginBottom: "8px",
                                            }}
                                        >
                                            <span>Subtotal:</span>
                                            <span>
                                                $
                                                {Number(
                                                    totals.subtotal ||
                                                        totals.total
                                                ).toLocaleString()}
                                            </span>
                                        </div>
                                        {parseFloat(totals.tax || 0) > 0 && (
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    marginBottom: "8px",
                                                }}
                                            >
                                                <span>Impuestos:</span>
                                                <span>
                                                    $
                                                    {Number(
                                                        totals.tax
                                                    ).toLocaleString()}
                                                </span>
                                            </div>
                                        )}
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                paddingTop: "10px",
                                                borderTop:
                                                    "1px solid rgba(255, 255, 255, 0.3)",
                                                fontSize: "18px",
                                                fontWeight: "700",
                                            }}
                                        >
                                            <span>TOTAL:</span>
                                            <span>
                                                $
                                                {Number(
                                                    totals.total
                                                ).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div
                            style={{
                                textAlign: "center",
                                padding: "20px 0",
                                borderTop: "1px solid #dee2e6",
                                fontSize: "12px",
                                color: "#6c757d",
                            }}
                        >
                            <div style={{ marginBottom: "10px" }}>
                                <strong>¡Gracias por su servicio!</strong>
                            </div>
                            <div>
                                Esta orden de compra fue generada
                                electrónicamente el {currentDate}
                            </div>
                            <div style={{ marginTop: "10px" }}>
                                Para cualquier consulta contacte a:{" "}
                                {companyConfig.email} | {companyConfig.phone}
                            </div>
                            {companyConfig.website && (
                                <div style={{ marginTop: "5px" }}>
                                    🌐 {companyConfig.website}
                                </div>
                            )}

                            {/* Términos y condiciones */}
                            {companyConfig.terms &&
                                companyConfig.terms.length > 0 && (
                                    <div
                                        style={{
                                            marginTop: "15px",
                                            fontSize: "10px",
                                            color: "#95a5a6",
                                            textAlign: "left",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontWeight: "600",
                                                marginBottom: "5px",
                                            }}
                                        >
                                            Términos y Condiciones:
                                        </div>
                                        {companyConfig.terms.map(
                                            (term, index) => (
                                                <div
                                                    key={index}
                                                    style={{
                                                        marginBottom: "2px",
                                                    }}
                                                >
                                                    • {term}
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}
                        </div>
                    </div>
                </div>
            </div>

            {/* CSS para responsividad */}
            <style>
                {`
                    @media (max-width: 768px) {
                        .order-header-grid {
                            grid-template-columns: 1fr !important;
                            gap: 20px !important;
                        }
                        
                        .order-totals-grid {
                            grid-template-columns: 1fr !important;
                        }
                    }
                `}
            </style>
        </>
    );
};

export default PurchaseOrderModal;
