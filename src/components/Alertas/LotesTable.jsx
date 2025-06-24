import React from "react";
import {
    FaExclamationTriangle,
    FaCalendarAlt,
    FaCheckCircle,
    FaInfoCircle,
    FaClock,
    FaBatteryEmpty,
    FaBatteryQuarter,
    FaBatteryHalf,
    FaBatteryThreeQuarters,
    FaBatteryFull,
} from "react-icons/fa";

const LotesTable = ({
    lotes,
    title,
    alertType = "default",
    // Configuración de columnas personalizada
    columnConfig = {
        hideManufacturingDate: false,
        hideExpiryDate: false,
        daysToExpiryLabel: "Días Restantes",
    },
}) => {
    // Función para formatear fechas
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";

        const date = new Date(dateString);
        return date.toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    // Función para determinar el color según el tipo de alerta
    const getStatusColor = () => {
        switch (alertType) {
            case "danger":
                return "#ffebee"; // Rojo claro para vencidos o stock crítico
            case "warning":
                return "#fff8e1"; // Amarillo claro para próximos a vencer o stock bajo
            case "info":
                return "#e3f2fd"; // Azul claro para vencen en 6 meses o stock normal
            case "success":
                return "#e8f5e9"; // Verde claro para vencen en 1 año o stock alto
            case "secondary":
                return "#f5f5f5"; // Gris claro para los que están a 2 meses de cumplir 1 año o stock excesivo
            default:
                return "inherit"; // Color normal
        }
    };

    // Función para obtener el ícono según el tipo de alerta
    const getStatusIcon = () => {
        switch (alertType) {
            case "danger":
                return (
                    <FaExclamationTriangle
                        style={{ color: "#e53935", marginRight: "5px" }}
                    />
                );
            case "warning":
                return (
                    <FaCalendarAlt
                        style={{ color: "#ff9800", marginRight: "5px" }}
                    />
                );
            case "info":
                return (
                    <FaInfoCircle
                        style={{ color: "#2196f3", marginRight: "5px" }}
                    />
                );
            case "success":
                return (
                    <FaCheckCircle
                        style={{ color: "#4caf50", marginRight: "5px" }}
                    />
                );
            case "secondary":
                return (
                    <FaClock style={{ color: "#757575", marginRight: "5px" }} />
                );
            default:
                return (
                    <FaCheckCircle
                        style={{ color: "#4caf50", marginRight: "5px" }}
                    />
                );
        }
    };

    // Función para obtener el texto de estado según el tipo de alerta
    const getStatusText = () => {
        switch (alertType) {
            case "danger":
                return "Vencido";
            case "warning":
                return "Próximo a vencer (90 días o menos)";
            case "info":
                return "Vence en 6 meses o menos";
            case "success":
                return "Vence en 1 año o menos";
            case "secondary":
                return "A 2 meses de cumplir 1 año para vencer";
            default:
                return "En buen estado";
        }
    };

    // Estilo para el título según el tipo de alerta
    const getTitleStyle = () => {
        switch (alertType) {
            case "danger":
                return { borderLeft: "5px solid #e53935", paddingLeft: "10px" };
            case "warning":
                return { borderLeft: "5px solid #ff9800", paddingLeft: "10px" };
            case "info":
                return { borderLeft: "5px solid #2196f3", paddingLeft: "10px" };
            case "success":
                return { borderLeft: "5px solid #4caf50", paddingLeft: "10px" };
            case "secondary":
                return { borderLeft: "5px solid #757575", paddingLeft: "10px" };
            default:
                return {};
        }
    };

    return (
        <div className="lotes-table-container">
            <h3 className="lotes-table-title" style={getTitleStyle()}>
                {title}
            </h3>
            {lotes && lotes.length > 0 ? (
                <table className="alertas-table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Lote/SKU</th>
                            {!columnConfig.hideManufacturingDate && (
                                <th>Fecha Fabricación</th>
                            )}
                            {!columnConfig.hideExpiryDate && (
                                <th>Fecha Vencimiento</th>
                            )}
                            <th>{columnConfig.daysToExpiryLabel}</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {lotes.map((lote) => (
                            <tr
                                key={lote.id}
                                style={{
                                    backgroundColor: getStatusColor(),
                                }}
                            >
                                <td style={{ minWidth: "150px" }}>
                                    {lote.product_name}
                                </td>
                                <td>{lote.batch_number}</td>
                                {!columnConfig.hideManufacturingDate && (
                                    <td>
                                        {lote.manufacturing_date
                                            ? formatDate(
                                                  lote.manufacturing_date
                                              )
                                            : "N/A"}
                                    </td>
                                )}
                                {!columnConfig.hideExpiryDate && (
                                    <td>{formatDate(lote.expiry_date)}</td>
                                )}
                                <td style={{ textAlign: "center" }}>
                                    {columnConfig.daysToExpiryLabel ===
                                    "Stock Actual"
                                        ? lote.days_to_expiry // En este caso, days_to_expiry contiene el valor del stock
                                        : lote.days_to_expiry < 0
                                        ? `${Math.abs(
                                              lote.days_to_expiry
                                          )} días vencido`
                                        : `${lote.days_to_expiry} días`}
                                </td>
                                <td>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            fontSize: "13px",
                                        }}
                                    >
                                        {getStatusIcon()}
                                        {getStatusText()}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <div className="no-lotes-message">
                    No hay productos disponibles en esta categoría
                </div>
            )}
        </div>
    );
};

export default LotesTable;
