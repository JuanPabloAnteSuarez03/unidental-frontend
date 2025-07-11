import React, { useState, useEffect } from "react";

const PurchasesDataDisplay = ({ purchasesData: cachedData, onClose }) => {
    const [purchasesData, setPurchasesData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Función para formatear cantidad de dinero
    const formatCurrency = (amount) => {
        if (!amount) return "-";
        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
        }).format(amount);
    };

    // Función para formatear fecha
    const formatDate = (dateString) => {
        if (!dateString) return "Sin fecha";
        return new Date(dateString).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
    };

    // Función para obtener el color del badge según el estado
    const getStatusBadgeColor = (status) => {
        switch (status) {
            case "received":
                return "#27ae60"; // Verde
            case "pending":
                return "#f39c12"; // Naranja
            case "cancelled":
                return "#e74c3c"; // Rojo
            case "approved":
                return "#3498db"; // Azul
            default:
                return "#95a5a6"; // Gris
        }
    };

    // Función para formatear el estado
    const formatStatus = (status) => {
        switch (status) {
            case "received":
                return "Recibida";
            case "pending":
                return "Pendiente";
            case "cancelled":
                return "Cancelada";
            case "approved":
                return "Aprobada";
            default:
                return status.charAt(0).toUpperCase() + status.slice(1);
        }
    };

    // Procesar datos cacheados
    useEffect(() => {
        if (!cachedData || cachedData.length === 0) {
            setError("No hay datos de compras disponibles");
            return;
        }

        try {
            console.log(
                "📦 Procesando datos cacheados de compras:",
                cachedData
            );

            // Procesar datos de compras
            const processedData = {
                totalOrders: cachedData.length,
                totalAmount: cachedData.reduce(
                    (sum, order) => sum + (order.total || 0),
                    0
                ),
                totalItems: cachedData.length, // Asumiendo 1 item por orden

                // Contar por estado
                receivedOrders: cachedData.filter(
                    (order) => order.status === "Completada"
                ).length,
                pendingOrders: cachedData.filter(
                    (order) => order.status === "Pendiente"
                ).length,
                cancelledOrders: cachedData.filter(
                    (order) => order.status === "Cancelada"
                ).length,
                approvedOrders: cachedData.filter(
                    (order) => order.status === "Aprobada"
                ).length,

                // Contar por proveedor (top 5)
                topSuppliers: cachedData.reduce((acc, order) => {
                    const supplierName = order.supplier || "Sin proveedor";
                    acc[supplierName] = (acc[supplierName] || 0) + 1;
                    return acc;
                }, {}),

                // Contar por destino
                destinations: cachedData.reduce((acc, order) => {
                    const destinationName = order.destination || "Sin destino";
                    acc[destinationName] = (acc[destinationName] || 0) + 1;
                    return acc;
                }, {}),

                // Datos originales para la tabla
                orders: cachedData.map((order) => ({
                    id: order.id,
                    supplier: order.supplier,
                    destination: order.destination,
                    orderDate: order.created_at,
                    status: order.status,
                    statusDisplay: order.status,
                    totalAmount: order.total,
                    totalItems: 1, // Asumiendo 1 item por orden
                    notes: "",
                    createdAt: order.created_at,
                    canBeModified: false,
                    rawData: order.rawData,
                })),
            };

            console.log("✅ Datos de compras procesados:", processedData);
            setPurchasesData(processedData);
        } catch (error) {
            console.error("❌ Error al procesar datos de compras:", error);
            setError(
                "Error al procesar los datos de compras. Por favor, inténtalo de nuevo."
            );
        }
    }, [cachedData]);

    if (isLoading) {
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
                        borderRadius: "12px",
                        padding: "32px",
                        textAlign: "center",
                    }}
                >
                    <div className="custom-loader"></div>
                    <p style={{ marginTop: "16px" }}>
                        Cargando datos de compras...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
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
                        borderRadius: "12px",
                        padding: "32px",
                        textAlign: "center",
                        maxWidth: "400px",
                    }}
                >
                    <p style={{ color: "#e74c3c", marginBottom: "16px" }}>
                        {error}
                    </p>
                    <button
                        onClick={onClose}
                        style={{
                            padding: "8px 16px",
                            backgroundColor: "#95a5a6",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                        }}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        );
    }

    if (!purchasesData) return null;

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
                    borderRadius: "12px",
                    padding: "32px",
                    maxWidth: "90vw",
                    maxHeight: "90vh",
                    overflow: "auto",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "24px",
                        borderBottom: "2px solid #f0f0f0",
                        paddingBottom: "16px",
                    }}
                >
                    <h2
                        style={{
                            margin: 0,
                            color: "#2c3e50",
                            fontSize: "24px",
                            fontWeight: "bold",
                        }}
                    >
                        Datos de Compras
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            fontSize: "24px",
                            cursor: "pointer",
                            color: "#666",
                            padding: "4px",
                            borderRadius: "4px",
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "#f0f0f0";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "transparent";
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Estadísticas principales */}
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "16px",
                        marginBottom: "24px",
                    }}
                >
                    {/* Total Órdenes */}
                    <div
                        style={{
                            padding: "20px",
                            backgroundColor: "#e67e22",
                            color: "white",
                            borderRadius: "8px",
                            textAlign: "center",
                            boxShadow: "0 2px 8px rgba(230, 126, 34, 0.3)",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "32px",
                                fontWeight: "bold",
                                marginBottom: "8px",
                            }}
                        >
                            {purchasesData.totalOrders}
                        </div>
                        <div style={{ fontSize: "16px", opacity: 0.9 }}>
                            Total Órdenes
                        </div>
                    </div>

                    {/* Total Monto */}
                    <div
                        style={{
                            padding: "20px",
                            backgroundColor: "#3498db",
                            color: "white",
                            borderRadius: "8px",
                            textAlign: "center",
                            boxShadow: "0 2px 8px rgba(52, 152, 219, 0.3)",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "24px",
                                fontWeight: "bold",
                                marginBottom: "8px",
                            }}
                        >
                            {formatCurrency(purchasesData.totalAmount)}
                        </div>
                        <div style={{ fontSize: "16px", opacity: 0.9 }}>
                            Total Monto
                        </div>
                    </div>

                    {/* Total Items */}
                    <div
                        style={{
                            padding: "20px",
                            backgroundColor: "#9b59b6",
                            color: "white",
                            borderRadius: "8px",
                            textAlign: "center",
                            boxShadow: "0 2px 8px rgba(155, 89, 182, 0.3)",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "32px",
                                fontWeight: "bold",
                                marginBottom: "8px",
                            }}
                        >
                            {purchasesData.totalItems}
                        </div>
                        <div style={{ fontSize: "16px", opacity: 0.9 }}>
                            Total Items
                        </div>
                    </div>

                    {/* Órdenes Recibidas */}
                    <div
                        style={{
                            padding: "20px",
                            backgroundColor: "#27ae60",
                            color: "white",
                            borderRadius: "8px",
                            textAlign: "center",
                            boxShadow: "0 2px 8px rgba(39, 174, 96, 0.3)",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "32px",
                                fontWeight: "bold",
                                marginBottom: "8px",
                            }}
                        >
                            {purchasesData.receivedOrders}
                        </div>
                        <div style={{ fontSize: "16px", opacity: 0.9 }}>
                            Recibidas
                        </div>
                    </div>

                    {/* Órdenes Pendientes */}
                    <div
                        style={{
                            padding: "20px",
                            backgroundColor: "#f39c12",
                            color: "white",
                            borderRadius: "8px",
                            textAlign: "center",
                            boxShadow: "0 2px 8px rgba(243, 156, 18, 0.3)",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "32px",
                                fontWeight: "bold",
                                marginBottom: "8px",
                            }}
                        >
                            {purchasesData.pendingOrders}
                        </div>
                        <div style={{ fontSize: "16px", opacity: 0.9 }}>
                            Pendientes
                        </div>
                    </div>

                    {/* Órdenes Canceladas */}
                    <div
                        style={{
                            padding: "20px",
                            backgroundColor: "#e74c3c",
                            color: "white",
                            borderRadius: "8px",
                            textAlign: "center",
                            boxShadow: "0 2px 8px rgba(231, 76, 60, 0.3)",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "32px",
                                fontWeight: "bold",
                                marginBottom: "8px",
                            }}
                        >
                            {purchasesData.cancelledOrders}
                        </div>
                        <div style={{ fontSize: "16px", opacity: 0.9 }}>
                            Canceladas
                        </div>
                    </div>
                </div>

                {/* Tabla de órdenes */}
                <div style={{ marginBottom: "24px" }}>
                    <h3 style={{ margin: "0 0 16px 0", color: "#333" }}>
                        Órdenes de Compra ({purchasesData.orders.length})
                    </h3>
                    <div style={{ overflowX: "auto" }}>
                        <table
                            style={{
                                width: "100%",
                                borderCollapse: "collapse",
                                fontSize: "14px",
                                backgroundColor: "white",
                                borderRadius: "8px",
                                overflow: "hidden",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                            }}
                        >
                            <thead>
                                <tr style={{ backgroundColor: "#f8f9fa" }}>
                                    <th
                                        style={{
                                            padding: "12px",
                                            textAlign: "left",
                                            borderBottom: "1px solid #dee2e6",
                                        }}
                                    >
                                        ID
                                    </th>
                                    <th
                                        style={{
                                            padding: "12px",
                                            textAlign: "left",
                                            borderBottom: "1px solid #dee2e6",
                                        }}
                                    >
                                        Proveedor
                                    </th>
                                    <th
                                        style={{
                                            padding: "12px",
                                            textAlign: "left",
                                            borderBottom: "1px solid #dee2e6",
                                        }}
                                    >
                                        Destino
                                    </th>
                                    <th
                                        style={{
                                            padding: "12px",
                                            textAlign: "center",
                                            borderBottom: "1px solid #dee2e6",
                                        }}
                                    >
                                        Fecha
                                    </th>
                                    <th
                                        style={{
                                            padding: "12px",
                                            textAlign: "center",
                                            borderBottom: "1px solid #dee2e6",
                                        }}
                                    >
                                        Estado
                                    </th>
                                    <th
                                        style={{
                                            padding: "12px",
                                            textAlign: "center",
                                            borderBottom: "1px solid #dee2e6",
                                        }}
                                    >
                                        Total
                                    </th>
                                    <th
                                        style={{
                                            padding: "12px",
                                            textAlign: "center",
                                            borderBottom: "1px solid #dee2e6",
                                        }}
                                    >
                                        Items
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchasesData.orders.map((order, index) => (
                                    <tr
                                        key={order.id}
                                        style={{
                                            backgroundColor:
                                                index % 2 === 0
                                                    ? "#ffffff"
                                                    : "#f8f9fa",
                                            borderBottom: "1px solid #dee2e6",
                                        }}
                                    >
                                        <td
                                            style={{
                                                padding: "12px",
                                                fontWeight: "bold",
                                            }}
                                        >
                                            #{order.id}
                                        </td>
                                        <td style={{ padding: "12px" }}>
                                            {order.supplier}
                                        </td>
                                        <td style={{ padding: "12px" }}>
                                            {order.destination}
                                        </td>
                                        <td
                                            style={{
                                                padding: "12px",
                                                textAlign: "center",
                                            }}
                                        >
                                            {formatDate(order.orderDate)}
                                        </td>
                                        <td
                                            style={{
                                                padding: "12px",
                                                textAlign: "center",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    backgroundColor:
                                                        getStatusBadgeColor(
                                                            order.status
                                                        ),
                                                    color: "white",
                                                    padding: "4px 8px",
                                                    borderRadius: "12px",
                                                    fontSize: "12px",
                                                    fontWeight: "bold",
                                                }}
                                            >
                                                {formatStatus(order.status)}
                                            </span>
                                        </td>
                                        <td
                                            style={{
                                                padding: "12px",
                                                textAlign: "center",
                                                fontWeight: "bold",
                                            }}
                                        >
                                            {formatCurrency(order.totalAmount)}
                                        </td>
                                        <td
                                            style={{
                                                padding: "12px",
                                                textAlign: "center",
                                            }}
                                        >
                                            {order.totalItems}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Botón de cerrar */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        paddingTop: "16px",
                        borderTop: "1px solid #f0f0f0",
                    }}
                >
                    <button
                        onClick={onClose}
                        style={{
                            padding: "12px 24px",
                            backgroundColor: "#95a5a6",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "bold",
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "#7f8c8d";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "#95a5a6";
                        }}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PurchasesDataDisplay;
