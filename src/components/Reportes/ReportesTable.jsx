import React from "react";

const ReportesTable = ({ filteredData, isLoading, error, onRefresh }) => {
    // Función para obtener el color del badge según el tipo
    const getTypeBadgeColor = (type) => {
        if (!type) return "#95a5a6"; // Gris para valores undefined

        switch (type) {
            case "movement":
                return "#3498db"; // Azul
            case "sale":
                return "#27ae60"; // Verde
            case "purchase":
                return "#e67e22"; // Naranja
            default:
                return "#95a5a6"; // Gris
        }
    };

    // Función para obtener el color del badge según el estado de compra
    const getPurchaseStatusBadgeColor = (status) => {
        if (!status) return "#95a5a6"; // Gris para valores undefined

        switch (status.toLowerCase()) {
            case "received":
            case "recibida":
                return "#27ae60"; // Verde
            case "pending":
            case "pendiente":
                return "#f39c12"; // Naranja
            case "approved":
            case "aprobada":
                return "#3498db"; // Azul
            case "cancelled":
            case "cancelada":
                return "#e74c3c"; // Rojo
            case "rejected":
            case "rechazada":
                return "#e74c3c"; // Rojo
            case "in_progress":
            case "en progreso":
                return "#9b59b6"; // Púrpura
            case "draft":
            case "borrador":
                return "#95a5a6"; // Gris
            default:
                return "#95a5a6"; // Gris
        }
    };

    // Función para obtener el color del badge según el tipo de venta
    const getSaleTypeBadgeColor = (saleType) => {
        if (!saleType) return "#95a5a6"; // Gris para valores undefined

        switch (saleType) {
            case "normal":
                return "#27ae60"; // Verde
            case "credit":
                return "#e67e22"; // Naranja
            case "wholesale":
                return "#9b59b6"; // Púrpura
            default:
                return "#95a5a6"; // Gris
        }
    };

    // Función para formatear el tipo de venta
    const formatSaleType = (saleType) => {
        if (!saleType) return "Sin tipo";

        switch (saleType) {
            case "normal":
                return "Normal";
            case "credit":
                return "Crédito";
            case "wholesale":
                return "Por Mayor";
            default:
                return saleType.charAt(0).toUpperCase() + saleType.slice(1);
        }
    };

    // Función para formatear fecha
    const formatDate = (dateString) => {
        if (!dateString) return "Sin fecha";
        return new Date(dateString).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Función para formatear cantidad de dinero
    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return "-";
        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
        }).format(amount);
    };

    // Función para formatear el estado de compra
    const formatPurchaseStatus = (status) => {
        if (!status) return "Sin estado";

        const statusMap = {
            received: "Recibida",
            pending: "Pendiente",
            approved: "Aprobada",
            cancelled: "Cancelada",
            rejected: "Rechazada",
            in_progress: "En progreso",
            draft: "Borrador",
        };

        return statusMap[status.toLowerCase()] || status;
    };

    // Verificar si todos los datos son de compras
    const isAllPurchases =
        filteredData.length > 0 &&
        filteredData.every((item) => item.type === "purchase");

    if (isLoading) {
        return (
            <div
                style={{
                    textAlign: "center",
                    padding: "60px 20px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "12px",
                    border: "1px solid #dee2e6",
                    marginBottom: "20px",
                }}
            >
                <div style={{ marginBottom: "16px" }}>
                    <div
                        style={{
                            display: "inline-block",
                            width: "40px",
                            height: "40px",
                            border: "4px solid #e9ecef",
                            borderTop: "4px solid #2c3e50",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                        }}
                    ></div>
                </div>
                <p
                    style={{
                        color: "#6c757d",
                        fontSize: "16px",
                        margin: 0,
                        fontWeight: "500",
                    }}
                >
                    Cargando datos...
                </p>
                <style>
                    {`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}
                </style>
            </div>
        );
    }

    if (error) {
        return (
            <div
                style={{
                    padding: "20px 24px",
                    marginBottom: "20px",
                    borderRadius: "12px",
                    backgroundColor: "#f8d7da",
                    color: "#721c24",
                    border: "2px solid #f5c6cb",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    boxShadow: "0 2px 8px rgba(220, 53, 69, 0.15)",
                }}
            >
                <span style={{ fontSize: "24px" }}>❌</span>
                <span style={{ fontWeight: "500", fontSize: "16px" }}>
                    {error}
                </span>
                <button
                    onClick={onRefresh}
                    style={{
                        marginLeft: "auto",
                        padding: "8px 16px",
                        backgroundColor: "#dc3545",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        transition: "background-color 0.2s",
                    }}
                    onMouseOver={(e) => {
                        e.target.style.backgroundColor = "#c82333";
                    }}
                    onMouseOut={(e) => {
                        e.target.style.backgroundColor = "#dc3545";
                    }}
                >
                    🔄 Reintentar
                </button>
            </div>
        );
    }

    if (filteredData.length === 0) {
        return (
            <div
                style={{
                    textAlign: "center",
                    padding: "60px 40px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "12px",
                    border: "2px dashed #dee2e6",
                    margin: "20px",
                }}
            >
                <div style={{ marginBottom: "16px" }}>
                    <span style={{ fontSize: "48px", opacity: 0.5 }}>📦</span>
                </div>
                <h3
                    style={{
                        color: "#6c757d",
                        fontSize: "18px",
                        fontWeight: "600",
                        margin: "0 0 8px 0",
                    }}
                >
                    No se encontraron compras
                </h3>
                <p
                    style={{
                        color: "#6c757d",
                        fontSize: "14px",
                        margin: "0 0 16px 0",
                        opacity: 0.8,
                    }}
                >
                    {isAllPurchases
                        ? "No hay órdenes de compra para el período seleccionado"
                        : "No hay datos para mostrar"}
                </p>
                {isAllPurchases && (
                    <div
                        style={{
                            backgroundColor: "#e3f2fd",
                            padding: "12px 16px",
                            borderRadius: "8px",
                            border: "1px solid #bbdefb",
                            maxWidth: "400px",
                            margin: "0 auto",
                        }}
                    >
                        <p
                            style={{
                                color: "#1976d2",
                                fontSize: "13px",
                                margin: "0",
                                fontWeight: "500",
                            }}
                        >
                            💡 <strong>Sugerencia:</strong> Prueba seleccionando
                            una fecha específica o un rango de fechas diferente
                            para ver las compras disponibles.
                        </p>
                    </div>
                )}
            </div>
        );
    }

    // Si todos los datos son de compras, mostrar tabla especializada
    if (isAllPurchases) {
        return (
            <div
                style={{
                    overflowX: "auto",
                    borderRadius: "12px",
                    border: "1px solid #e9ecef",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
            >
                <table
                    style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        minWidth: "1200px",
                        backgroundColor: "#fff",
                    }}
                >
                    <thead>
                        <tr
                            style={{
                                background:
                                    "linear-gradient(135deg, #e67e22 0%, #d35400 100%)",
                                color: "white",
                            }}
                        >
                            <th
                                style={{
                                    padding: "16px 12px",
                                    textAlign: "left",
                                    fontWeight: "600",
                                    fontSize: "14px",
                                    letterSpacing: "0.5px",
                                    textTransform: "uppercase",
                                }}
                            >
                                🆔 ID
                            </th>
                            <th
                                style={{
                                    padding: "16px 12px",
                                    textAlign: "left",
                                    fontWeight: "600",
                                    fontSize: "14px",
                                    letterSpacing: "0.5px",
                                    textTransform: "uppercase",
                                }}
                            >
                                🏢 Proveedor
                            </th>
                            <th
                                style={{
                                    padding: "16px 12px",
                                    textAlign: "left",
                                    fontWeight: "600",
                                    fontSize: "14px",
                                    letterSpacing: "0.5px",
                                    textTransform: "uppercase",
                                }}
                            >
                                📍 Destino
                            </th>
                            <th
                                style={{
                                    padding: "16px 12px",
                                    textAlign: "center",
                                    fontWeight: "600",
                                    fontSize: "14px",
                                    letterSpacing: "0.5px",
                                    textTransform: "uppercase",
                                }}
                            >
                                📅 Fecha de Orden
                            </th>
                            <th
                                style={{
                                    padding: "16px 12px",
                                    textAlign: "center",
                                    fontWeight: "600",
                                    fontSize: "14px",
                                    letterSpacing: "0.5px",
                                    textTransform: "uppercase",
                                }}
                            >
                                ✅ Estado
                            </th>
                            <th
                                style={{
                                    padding: "16px 12px",
                                    textAlign: "center",
                                    fontWeight: "600",
                                    fontSize: "14px",
                                    letterSpacing: "0.5px",
                                    textTransform: "uppercase",
                                }}
                            >
                                💰 Total
                            </th>
                            <th
                                style={{
                                    padding: "16px 12px",
                                    textAlign: "center",
                                    fontWeight: "600",
                                    fontSize: "14px",
                                    letterSpacing: "0.5px",
                                    textTransform: "uppercase",
                                }}
                            >
                                📦 Items
                            </th>
                            <th
                                style={{
                                    padding: "16px 12px",
                                    textAlign: "left",
                                    fontWeight: "600",
                                    fontSize: "14px",
                                    letterSpacing: "0.5px",
                                    textTransform: "uppercase",
                                }}
                            >
                                📝 Notas
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((item, index) => {
                            // Extraer datos del rawData si está disponible
                            const rawData = item.rawData || {};
                            const supplierDetails =
                                rawData.supplier_details || {};
                            const destinationDetails =
                                rawData.destination_details || {};

                            return (
                                <tr
                                    key={`purchase-${item.id}`}
                                    style={{
                                        backgroundColor:
                                            index % 2 === 0
                                                ? "#fff"
                                                : "#f8f9fa",
                                    }}
                                >
                                    <td
                                        style={{
                                            padding: "16px 12px",
                                            borderBottom: "1px solid #e9ecef",
                                            fontSize: "14px",
                                            fontWeight: "700",
                                            color: "#2c3e50",
                                        }}
                                    >
                                        #{item.id}
                                    </td>
                                    <td
                                        style={{
                                            padding: "16px 12px",
                                            borderBottom: "1px solid #e9ecef",
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            color: "#2c3e50",
                                        }}
                                    >
                                        <div>
                                            <div
                                                style={{
                                                    fontWeight: "600",
                                                    marginBottom: "4px",
                                                }}
                                            >
                                                {supplierDetails.name ||
                                                    item.supplier_name ||
                                                    "Sin proveedor"}
                                            </div>
                                            {supplierDetails.contact_name && (
                                                <div
                                                    style={{
                                                        fontSize: "12px",
                                                        color: "#6c757d",
                                                    }}
                                                >
                                                    📞{" "}
                                                    {
                                                        supplierDetails.contact_name
                                                    }
                                                </div>
                                            )}
                                            {supplierDetails.phone && (
                                                <div
                                                    style={{
                                                        fontSize: "12px",
                                                        color: "#6c757d",
                                                    }}
                                                >
                                                    📱 {supplierDetails.phone}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td
                                        style={{
                                            padding: "16px 12px",
                                            borderBottom: "1px solid #e9ecef",
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            color: "#2c3e50",
                                        }}
                                    >
                                        <div>
                                            <div
                                                style={{
                                                    fontWeight: "600",
                                                    marginBottom: "4px",
                                                }}
                                            >
                                                {destinationDetails.name ||
                                                    item.destination_name ||
                                                    "Sin destino"}
                                            </div>
                                            {destinationDetails.address && (
                                                <div
                                                    style={{
                                                        fontSize: "12px",
                                                        color: "#6c757d",
                                                    }}
                                                >
                                                    📍{" "}
                                                    {destinationDetails.address}
                                                </div>
                                            )}
                                            {destinationDetails.type && (
                                                <div
                                                    style={{
                                                        fontSize: "12px",
                                                        color: "#6c757d",
                                                    }}
                                                >
                                                    🏢 {destinationDetails.type}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td
                                        style={{
                                            padding: "16px 12px",
                                            borderBottom: "1px solid #e9ecef",
                                            textAlign: "center",
                                            fontSize: "14px",
                                            fontWeight: "500",
                                            color: "#495057",
                                        }}
                                    >
                                        {rawData.order_date
                                            ? formatDate(rawData.order_date)
                                            : formatDate(item.date)}
                                    </td>
                                    <td
                                        style={{
                                            padding: "16px 12px",
                                            borderBottom: "1px solid #e9ecef",
                                            textAlign: "center",
                                            fontSize: "14px",
                                            fontWeight: "500",
                                            color: "#495057",
                                        }}
                                    >
                                        <span
                                            style={{
                                                display: "inline-block",
                                                padding: "6px 12px",
                                                borderRadius: "20px",
                                                fontSize: "12px",
                                                fontWeight: "600",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.5px",
                                                backgroundColor:
                                                    getPurchaseStatusBadgeColor(
                                                        rawData.status ||
                                                            item.status
                                                    ) + "20",
                                                color: getPurchaseStatusBadgeColor(
                                                    rawData.status ||
                                                        item.status
                                                ),
                                                border: `2px solid ${getPurchaseStatusBadgeColor(
                                                    rawData.status ||
                                                        item.status
                                                )}40`,
                                            }}
                                        >
                                            {rawData.status_display ||
                                                formatPurchaseStatus(
                                                    rawData.status ||
                                                        item.status
                                                )}
                                        </span>
                                    </td>
                                    <td
                                        style={{
                                            padding: "16px 12px",
                                            borderBottom: "1px solid #e9ecef",
                                            textAlign: "center",
                                            fontSize: "16px",
                                            fontWeight: "700",
                                            color: "#27ae60",
                                        }}
                                    >
                                        {formatCurrency(
                                            rawData.total_amount || item.total
                                        )}
                                    </td>
                                    <td
                                        style={{
                                            padding: "16px 12px",
                                            borderBottom: "1px solid #e9ecef",
                                            textAlign: "center",
                                            fontSize: "16px",
                                            fontWeight: "700",
                                            color: "#2c3e50",
                                        }}
                                    >
                                        {rawData.total_items ||
                                            item.quantity ||
                                            "-"}
                                    </td>
                                    <td
                                        style={{
                                            padding: "16px 12px",
                                            borderBottom: "1px solid #e9ecef",
                                            fontSize: "14px",
                                            fontWeight: "500",
                                            color: "#495057",
                                            maxWidth: "200px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                                cursor: "pointer",
                                            }}
                                            title={rawData.notes || "Sin notas"}
                                        >
                                            {rawData.notes || "Sin notas"}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    }

    // Tabla genérica para otros tipos de datos
    return (
        <div
            style={{
                overflowX: "auto",
                borderRadius: "12px",
                border: "1px solid #e9ecef",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
        >
            <table
                style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: "900px",
                    backgroundColor: "#fff",
                }}
            >
                <thead>
                    <tr
                        style={{
                            background:
                                "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
                            color: "white",
                        }}
                    >
                        <th
                            style={{
                                padding: "16px 12px",
                                textAlign: "left",
                                fontWeight: "600",
                                fontSize: "14px",
                                letterSpacing: "0.5px",
                                textTransform: "uppercase",
                            }}
                        >
                            📊 Tipo
                        </th>
                        <th
                            style={{
                                padding: "16px 12px",
                                textAlign: "left",
                                fontWeight: "600",
                                fontSize: "14px",
                                letterSpacing: "0.5px",
                                textTransform: "uppercase",
                            }}
                        >
                            📅 Fecha
                        </th>
                        <th
                            style={{
                                padding: "16px 12px",
                                textAlign: "left",
                                fontWeight: "600",
                                fontSize: "14px",
                                letterSpacing: "0.5px",
                                textTransform: "uppercase",
                            }}
                        >
                            📝 Descripción
                        </th>
                        <th
                            style={{
                                padding: "16px 12px",
                                textAlign: "left",
                                fontWeight: "600",
                                fontSize: "14px",
                                letterSpacing: "0.5px",
                                textTransform: "uppercase",
                            }}
                        >
                            🏷️ Producto
                        </th>
                        <th
                            style={{
                                padding: "16px 12px",
                                textAlign: "center",
                                fontWeight: "600",
                                fontSize: "14px",
                                letterSpacing: "0.5px",
                                textTransform: "uppercase",
                            }}
                        >
                            🔢 Cantidad
                        </th>
                        <th
                            style={{
                                padding: "16px 12px",
                                textAlign: "left",
                                fontWeight: "600",
                                fontSize: "14px",
                                letterSpacing: "0.5px",
                                textTransform: "uppercase",
                            }}
                        >
                            📍 Ubicación
                        </th>
                        <th
                            style={{
                                padding: "16px 12px",
                                textAlign: "center",
                                fontWeight: "600",
                                fontSize: "14px",
                                letterSpacing: "0.5px",
                                textTransform: "uppercase",
                            }}
                        >
                            💰 Total
                        </th>
                        <th
                            style={{
                                padding: "16px 12px",
                                textAlign: "left",
                                fontWeight: "600",
                                fontSize: "14px",
                                letterSpacing: "0.5px",
                                textTransform: "uppercase",
                            }}
                        >
                            🏪 Tipo de Venta
                        </th>
                        <th
                            style={{
                                padding: "16px 12px",
                                textAlign: "left",
                                fontWeight: "600",
                                fontSize: "14px",
                                letterSpacing: "0.5px",
                                textTransform: "uppercase",
                            }}
                        >
                            ✅ Estado
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {filteredData.map((item, index) => (
                        <tr
                            key={`${item.type}-${item.id}`}
                            style={{
                                backgroundColor:
                                    index % 2 === 0 ? "#fff" : "#f8f9fa",
                            }}
                        >
                            <td
                                style={{
                                    padding: "16px 12px",
                                    borderBottom: "1px solid #e9ecef",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    color: "#495057",
                                }}
                            >
                                <span
                                    style={{
                                        display: "inline-block",
                                        padding: "6px 12px",
                                        borderRadius: "20px",
                                        fontSize: "12px",
                                        fontWeight: "600",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                        backgroundColor:
                                            getTypeBadgeColor(item.type) + "20",
                                        color: getTypeBadgeColor(item.type),
                                        border: `2px solid ${getTypeBadgeColor(
                                            item.type
                                        )}40`,
                                    }}
                                >
                                    {item.typeLabel}
                                </span>
                            </td>
                            <td
                                style={{
                                    padding: "16px 12px",
                                    borderBottom: "1px solid #e9ecef",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    color: "#495057",
                                }}
                            >
                                {formatDate(item.date)}
                            </td>
                            <td
                                style={{
                                    padding: "16px 12px",
                                    borderBottom: "1px solid #e9ecef",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    color: "#495057",
                                }}
                            >
                                {item.description || "-"}
                            </td>
                            <td
                                style={{
                                    padding: "16px 12px",
                                    borderBottom: "1px solid #e9ecef",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                }}
                            >
                                {item.product_name || item.product || "-"}
                            </td>
                            <td
                                style={{
                                    padding: "16px 12px",
                                    borderBottom: "1px solid #e9ecef",
                                    textAlign: "center",
                                    fontSize: "16px",
                                    fontWeight: "700",
                                    color: "#2c3e50",
                                }}
                            >
                                {item.quantity || "-"}
                            </td>
                            <td
                                style={{
                                    padding: "16px 12px",
                                    borderBottom: "1px solid #e9ecef",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    color: "#495057",
                                }}
                            >
                                {item.location_name ||
                                    item.location ||
                                    item.sede ||
                                    "-"}
                            </td>
                            <td
                                style={{
                                    padding: "16px 12px",
                                    borderBottom: "1px solid #e9ecef",
                                    textAlign: "center",
                                    fontSize: "16px",
                                    fontWeight: "700",
                                    color: "#27ae60",
                                }}
                            >
                                {formatCurrency(item.total)}
                            </td>
                            <td
                                style={{
                                    padding: "16px 12px",
                                    borderBottom: "1px solid #e9ecef",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    color: "#495057",
                                }}
                            >
                                {(() => {
                                    // Verificar múltiples propiedades posibles para el tipo de venta
                                    const saleType =
                                        item.sale_type ||
                                        item.saleType ||
                                        item.type ||
                                        null;

                                    // Debug log para ver qué datos llegan
                                    if (item.type === "sale") {
                                        console.log("🔍 Venta item:", {
                                            id: item.id,
                                            sale_type: item.sale_type,
                                            saleType: item.saleType,
                                            type: item.type,
                                            finalSaleType: saleType,
                                        });
                                    }

                                    if (saleType) {
                                        return (
                                            <span
                                                style={{
                                                    display: "inline-block",
                                                    padding: "4px 8px",
                                                    borderRadius: "12px",
                                                    fontSize: "11px",
                                                    fontWeight: "600",
                                                    backgroundColor:
                                                        getSaleTypeBadgeColor(
                                                            saleType
                                                        ) + "20",
                                                    color: getSaleTypeBadgeColor(
                                                        saleType
                                                    ),
                                                    border: `1px solid ${getSaleTypeBadgeColor(
                                                        saleType
                                                    )}40`,
                                                }}
                                            >
                                                {formatSaleType(saleType)}
                                            </span>
                                        );
                                    } else {
                                        // Si no hay tipo de venta pero es una venta, mostrar "Normal" por defecto
                                        if (item.type === "sale") {
                                            return (
                                                <span
                                                    style={{
                                                        display: "inline-block",
                                                        padding: "4px 8px",
                                                        borderRadius: "12px",
                                                        fontSize: "11px",
                                                        fontWeight: "600",
                                                        backgroundColor:
                                                            "#27ae6020",
                                                        color: "#27ae60",
                                                        border: "1px solid #27ae6040",
                                                    }}
                                                >
                                                    Normal
                                                </span>
                                            );
                                        }
                                        return "-";
                                    }
                                })()}
                            </td>
                            <td
                                style={{
                                    padding: "16px 12px",
                                    borderBottom: "1px solid #e9ecef",
                                    fontSize: "14px",
                                    fontWeight: "500",
                                    color: "#495057",
                                }}
                            >
                                {item.status || "Completado"}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ReportesTable;
