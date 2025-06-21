import React from "react";
import {
    FaExclamationTriangle,
    FaCalendarTimes,
    FaCalendarCheck,
    FaInfoCircle,
    FaCheckCircle,
    FaClock,
} from "react-icons/fa";

const ResumenAlertas = ({
    lotesExpirados,
    lotesProximosAVencer,
    lotes6Meses = 0,
    lotes1Anio = 0,
    lotesPreAnio = 0,
}) => {
    // Calcular el total de lotes con algún tipo de alerta
    const totalLotesConAlertas =
        lotesExpirados +
        lotesProximosAVencer +
        lotes6Meses +
        lotes1Anio +
        lotesPreAnio;

    return (
        <div className="resumen-alertas">
            <div className="resumen-card total">
                <div className="icon">
                    <FaExclamationTriangle />
                </div>
                <div className="info">
                    <h3>{totalLotesConAlertas}</h3>
                    <p>Total de Lotes con Alertas</p>
                </div>
            </div>
            <div className="resumen-card expirados">
                <div className="icon">
                    <FaCalendarTimes style={{ color: "#e53935" }} />
                </div>
                <div className="info">
                    <h3>{lotesExpirados}</h3>
                    <p>Lotes Expirados</p>
                </div>
            </div>
            <div className="resumen-card proximos">
                <div className="icon">
                    <FaCalendarCheck style={{ color: "#ff9800" }} />
                </div>
                <div className="info">
                    <h3>{lotesProximosAVencer}</h3>
                    <p>Vencen en 90 días</p>
                </div>
            </div>
            <div className="resumen-card seis-meses">
                <div className="icon">
                    <FaInfoCircle style={{ color: "#2196f3" }} />
                </div>
                <div className="info">
                    <h3>{lotes6Meses}</h3>
                    <p>Vencen en 6 meses</p>
                </div>
            </div>
            <div className="resumen-card un-anio">
                <div className="icon">
                    <FaCheckCircle style={{ color: "#4caf50" }} />
                </div>
                <div className="info">
                    <h3>{lotes1Anio}</h3>
                    <p>Vencen en 1 año</p>
                </div>
            </div>
            <div className="resumen-card pre-anio">
                <div className="icon">
                    <FaClock style={{ color: "#757575" }} />
                </div>
                <div className="info">
                    <h3>{lotesPreAnio}</h3>
                    <p>Poco más de un año</p>
                </div>
            </div>
        </div>
    );
};

export default ResumenAlertas;
