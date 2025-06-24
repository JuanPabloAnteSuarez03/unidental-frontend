import React from "react";
import {
    FaExclamationTriangle,
    FaArrowDown,
    FaExclamationCircle,
    FaInfoCircle,
    FaCheckCircle,
} from "react-icons/fa";

const ProductosTable = ({
    productos,
    title,
    alertType = "default",
    umbrales = null,
}) => {
    // Usar umbrales predeterminados si no se proporcionan
    const defaultUmbrales = {
        CRITICO: 5,
        BAJO: 15,
        MEDIO: 30,
        OPTIMO: 50,
    };

    // Usar los umbrales proporcionados o los predeterminados
    const umbralesToUse = umbrales || defaultUmbrales;

    // Función para determinar el color según el tipo de alerta
    const getStatusColor = (categoria) => {
        switch (categoria) {
            case "critico":
                return "#ffebee"; // Rojo claro para stock crítico
            case "bajo":
                return "#fff8e1"; // Amarillo claro para stock bajo
            case "medio":
                return "#e3f2fd"; // Azul claro para stock medio
            case "optimo":
                return "#e8f5e9"; // Verde claro para stock óptimo
            case "excesivo":
                return "#f5f5f5"; // Gris claro para stock excesivo
            default:
                return "inherit"; // Color normal
        }
    };

    // Función para obtener el ícono según el tipo de alerta
    const getStatusIcon = (categoria) => {
        switch (categoria) {
            case "critico":
                return (
                    <FaExclamationTriangle
                        style={{ color: "#e53935", marginRight: "5px" }}
                    />
                );
            case "bajo":
                return (
                    <FaArrowDown
                        style={{ color: "#ff9800", marginRight: "5px" }}
                    />
                );
            case "medio":
                return (
                    <FaExclamationCircle
                        style={{ color: "#2196f3", marginRight: "5px" }}
                    />
                );
            case "optimo":
                return (
                    <FaInfoCircle
                        style={{ color: "#4caf50", marginRight: "5px" }}
                    />
                );
            case "excesivo":
                return (
                    <FaCheckCircle
                        style={{ color: "#757575", marginRight: "5px" }}
                    />
                );
            default:
                return null;
        }
    };

    // Función para obtener el texto de estado según el tipo de alerta y los umbrales
    const getStatusText = (categoria) => {
        switch (categoria) {
            case "critico":
                return `Stock Crítico (0-${umbralesToUse.CRITICO} unidades)`;
            case "bajo":
                return `Stock Bajo (${umbralesToUse.CRITICO + 1}-${
                    umbralesToUse.BAJO
                } unidades)`;
            case "medio":
                return `Stock Medio (${umbralesToUse.BAJO + 1}-${
                    umbralesToUse.MEDIO
                } unidades)`;
            case "optimo":
                return `Stock Óptimo (${umbralesToUse.MEDIO + 1}-${
                    umbralesToUse.OPTIMO
                } unidades)`;
            case "excesivo":
                return `Stock Excesivo (>${umbralesToUse.OPTIMO} unidades)`;
            default:
                return "Stock Normal";
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
            {productos && productos.length > 0 ? (
                <table className="alertas-table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Categoría</th>
                            <th>Stock Actual</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productos.map((producto) => (
                            <tr
                                key={producto.id}
                                style={{
                                    backgroundColor: getStatusColor(
                                        producto.categoria
                                    ),
                                }}
                            >
                                <td style={{ minWidth: "150px" }}>
                                    {producto.name}
                                </td>
                                <td>{producto.category}</td>
                                <td style={{ textAlign: "center" }}>
                                    {producto.current_stock}
                                </td>
                                <td>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            fontSize: "13px",
                                        }}
                                    >
                                        {getStatusIcon(producto.categoria)}
                                        {getStatusText(producto.categoria)}
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

export default ProductosTable;
