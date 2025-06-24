import React from "react";
import {
    FaExclamationTriangle,
    FaArrowDown,
    FaExclamationCircle,
    FaInfoCircle,
    FaCheckCircle,
} from "react-icons/fa";

const ResumenAlertasStock = ({
    stockCritico = 0,
    stockBajo = 0,
    stockMedio = 0,
    stockOptimo = 0,
    stockExcesivo = 0,
}) => {
    // Calcular el total de productos con algún tipo de alerta
    const totalProductosConAlertas =
        stockCritico + stockBajo + stockMedio + stockOptimo + stockExcesivo;

    return (
        <div className="resumen-alertas">
            <div className="resumen-card total">
                <div className="icon">
                    <FaExclamationTriangle />
                </div>
                <div className="info">
                    <h3>{totalProductosConAlertas}</h3>
                    <p>Total de Productos</p>
                </div>
            </div>
            <div className="resumen-card expirados">
                <div className="icon">
                    <FaExclamationTriangle style={{ color: "#e53935" }} />
                </div>
                <div className="info">
                    <h3>{stockCritico}</h3>
                    <p>Stock Crítico (0-5 unidades)</p>
                </div>
            </div>
            <div className="resumen-card proximos">
                <div className="icon">
                    <FaArrowDown style={{ color: "#ff9800" }} />
                </div>
                <div className="info">
                    <h3>{stockBajo}</h3>
                    <p>Stock Bajo (6-15 unidades)</p>
                </div>
            </div>
            <div className="resumen-card seis-meses">
                <div className="icon">
                    <FaExclamationCircle style={{ color: "#2196f3" }} />
                </div>
                <div className="info">
                    <h3>{stockMedio}</h3>
                    <p>Stock Medio (16-30 unidades)</p>
                </div>
            </div>
            <div className="resumen-card un-anio">
                <div className="icon">
                    <FaInfoCircle style={{ color: "#4caf50" }} />
                </div>
                <div className="info">
                    <h3>{stockOptimo}</h3>
                    <p>Stock Óptimo (31-50 unidades)</p>
                </div>
            </div>
            <div className="resumen-card pre-anio">
                <div className="icon">
                    <FaCheckCircle style={{ color: "#757575" }} />
                </div>
                <div className="info">
                    <h3>{stockExcesivo}</h3>
                    <p>Stock Excesivo ({">"}50 unidades)</p>
                </div>
            </div>
        </div>
    );
};

export default ResumenAlertasStock;
