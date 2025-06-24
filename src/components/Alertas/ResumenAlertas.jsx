import React from "react";
import {
    FaBoxes,
    FaBatteryEmpty,
    FaBatteryQuarter,
    FaBatteryHalf,
    FaBatteryThreeQuarters,
    FaBatteryFull,
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
                    <FaBoxes />
                </div>
                <div className="info">
                    <h3>{totalLotesConAlertas}</h3>
                    <p>Total de Lotes con Alertas</p>
                </div>
            </div>
            <div
                className={`resumen-card expirados ${
                    lotesExpirados > 0 ? "active" : ""
                }`}
            >
                <div className="icon">
                    <FaBatteryEmpty style={{ color: "#e53935" }} />
                </div>
                <div className="info">
                    <h3>{lotesExpirados}</h3>
                    <p>Lotes Expirados</p>
                    <small
                        style={{
                            fontSize: "11px",
                            color: "#6c757d",
                            fontStyle: "italic",
                        }}
                    >
                        (productos ya vencidos)
                    </small>
                </div>
            </div>
            <div
                className={`resumen-card proximos ${
                    lotesProximosAVencer > 0 ? "active" : ""
                }`}
            >
                <div className="icon">
                    <FaBatteryQuarter style={{ color: "#ff9800" }} />
                </div>
                <div className="info">
                    <h3>{lotesProximosAVencer}</h3>
                    <p>Vencen en 90 días</p>
                    <small
                        style={{
                            fontSize: "11px",
                            color: "#6c757d",
                            fontStyle: "italic",
                        }}
                    >
                        (0-90 días para vencer)
                    </small>
                </div>
            </div>
            <div
                className={`resumen-card seis-meses ${
                    lotes6Meses > 0 ? "active" : ""
                }`}
            >
                <div className="icon">
                    <FaBatteryHalf style={{ color: "#2196f3" }} />
                </div>
                <div className="info">
                    <h3>{lotes6Meses}</h3>
                    <p>Vencen en 6 meses</p>
                    <small
                        style={{
                            fontSize: "11px",
                            color: "#6c757d",
                            fontStyle: "italic",
                        }}
                    >
                        (91-180 días para vencer)
                    </small>
                </div>
            </div>
            <div
                className={`resumen-card un-anio ${
                    lotes1Anio > 0 ? "active" : ""
                }`}
            >
                <div className="icon">
                    <FaBatteryThreeQuarters style={{ color: "#4caf50" }} />
                </div>
                <div className="info">
                    <h3>{lotes1Anio}</h3>
                    <p>Vencen en 1 año</p>
                    <small
                        style={{
                            fontSize: "11px",
                            color: "#6c757d",
                            fontStyle: "italic",
                        }}
                    >
                        (181-365 días para vencer)
                    </small>
                </div>
            </div>
            <div
                className={`resumen-card pre-anio ${
                    lotesPreAnio > 0 ? "active" : ""
                }`}
            >
                <div className="icon">
                    <FaBatteryFull style={{ color: "#757575" }} />
                </div>
                <div className="info">
                    <h3>{lotesPreAnio}</h3>
                    <p>Poco más de un año</p>
                    <small
                        style={{
                            fontSize: "11px",
                            color: "#6c757d",
                            fontStyle: "italic",
                        }}
                    >
                        (más de 365 días para vencer)
                    </small>
                </div>
            </div>
        </div>
    );
};

export default ResumenAlertas;
