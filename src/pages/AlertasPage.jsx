import React, { useState, useEffect } from "react";
import AlertasHeader from "../components/Alertas/AlertasHeader";
import AlertasStyles from "../components/Alertas/AlertasStyles";
import ResumenAlertas from "../components/Alertas/ResumenAlertas";
import LotesTable from "../components/Alertas/LotesTable";
import { useAuth } from "../contexts/AuthContext";
import {
    getAllProductBatches,
    getExpiringSoonBatches,
    getExpiredBatches,
    getBatchesByExpiryRange,
} from "../services/productBatchService";

// Definición de rangos disponibles
const RANGOS = {
    ALERTAS_CRITICAS: "alertas_criticas", // Alertas críticas (vencidos y próximos a vencer en 90 días)
    SEIS_MESES: "seis_meses", // Entre 91 y 180 días
    UN_ANIO: "un_anio", // Entre 181 y 365 días
    POCO_MAS_ANIO: "poco_mas_anio", // Más de 365 días
};

// Definición de los rangos de días para cada categoría
const DIAS_RANGOS = {
    [RANGOS.ALERTAS_CRITICAS]: { min: 0, max: 90 },
    [RANGOS.SEIS_MESES]: { min: 91, max: 180 },
    [RANGOS.UN_ANIO]: { min: 181, max: 365 },
    [RANGOS.POCO_MAS_ANIO]: { min: 366, max: 730 }, // Hasta 2 años
};

const AlertasPage = () => {
    // Estado para los lotes de productos por periodo de vencimiento
    const [expiredLotes, setExpiredLotes] = useState([]); // Vencidos
    const [lotes90Dias, setLotes90Dias] = useState([]); // Vencen en 90 días o menos
    const [lotes6Meses, setLotes6Meses] = useState([]); // Vencen entre 91 y 180 días
    const [lotes1Anio, setLotes1Anio] = useState([]); // Vencen entre 181 y 365 días
    const [lotesPreAnio, setLotesPreAnio] = useState([]); // Vencen después de 365 días
    const [isLoadingLotes, setIsLoadingLotes] = useState(false);

    // Estado para los conteos totales (para el resumen)
    const [totales, setTotales] = useState({
        expirados: 0,
        proximosAVencer: 0,
        seisMeses: 0,
        unAnio: 0,
        preAnio: 0,
    });

    // Estado para controlar qué rango se muestra
    const [rangoSeleccionado, setRangoSeleccionado] = useState(
        RANGOS.ALERTAS_CRITICAS
    );

    // Obtener el contexto de autenticación
    const { authToken } = useAuth();

    // Cargar todos los datos al iniciar
    useEffect(() => {
        if (authToken) {
            fetchTodosLosDatos();
        }
    }, [authToken]);

    // Función para cargar todos los datos de alertas
    const fetchTodosLosDatos = async () => {
        setIsLoadingLotes(true);
        try {
            // Cargar datos para todas las categorías
            const [
                expiredLotesData,
                expiringLotesData,
                lotes6MesesData,
                lotes1AnioData,
                lotesPreAnioData,
            ] = await Promise.all([
                getExpiredBatches(authToken),
                getExpiringSoonBatches(authToken, 90),
                getBatchesByExpiryRange(authToken, 91, 180),
                getBatchesByExpiryRange(authToken, 181, 365),
                getBatchesByExpiryRange(authToken, 366, 730),
            ]);

            // Actualizar los totales para el resumen
            setTotales({
                expirados: expiredLotesData.length,
                proximosAVencer: expiringLotesData.length,
                seisMeses: lotes6MesesData.length,
                unAnio: lotes1AnioData.length,
                preAnio: lotesPreAnioData.length,
            });

            // Actualizar los datos para la visualización según el rango seleccionado
            if (rangoSeleccionado === RANGOS.ALERTAS_CRITICAS) {
                setExpiredLotes(expiredLotesData);
                setLotes90Dias(expiringLotesData);
                setLotes6Meses([]);
                setLotes1Anio([]);
                setLotesPreAnio([]);
            } else if (rangoSeleccionado === RANGOS.SEIS_MESES) {
                setExpiredLotes([]);
                setLotes90Dias([]);
                setLotes6Meses(lotes6MesesData);
                setLotes1Anio([]);
                setLotesPreAnio([]);
            } else if (rangoSeleccionado === RANGOS.UN_ANIO) {
                setExpiredLotes([]);
                setLotes90Dias([]);
                setLotes6Meses([]);
                setLotes1Anio(lotes1AnioData);
                setLotesPreAnio([]);
            } else if (rangoSeleccionado === RANGOS.POCO_MAS_ANIO) {
                setExpiredLotes([]);
                setLotes90Dias([]);
                setLotes6Meses([]);
                setLotes1Anio([]);
                setLotesPreAnio(lotesPreAnioData);
            }
        } catch (error) {
            console.error("Error al cargar todos los datos:", error);
        } finally {
            setIsLoadingLotes(false);
        }
    };

    // Función para cargar un rango específico de lotes
    const fetchRangoEspecifico = async (rango) => {
        setIsLoadingLotes(true);
        try {
            // Resetear todas las categorías de visualización
            setExpiredLotes([]);
            setLotes90Dias([]);
            setLotes6Meses([]);
            setLotes1Anio([]);
            setLotesPreAnio([]);

            if (rango === RANGOS.ALERTAS_CRITICAS) {
                // Para alertas críticas, cargamos los lotes vencidos y próximos a vencer
                const [expiredLotesData, expiringLotesData] = await Promise.all(
                    [
                        getExpiredBatches(authToken),
                        getExpiringSoonBatches(authToken, 90),
                    ]
                );

                setExpiredLotes(expiredLotesData);
                setLotes90Dias(expiringLotesData);
            } else {
                // Para otros rangos, cargamos solo ese rango específico
                const { min, max } = DIAS_RANGOS[rango];
                const lotesData = await getBatchesByExpiryRange(
                    authToken,
                    min,
                    max
                );

                // Actualizar el estado según el rango seleccionado
                switch (rango) {
                    case RANGOS.SEIS_MESES:
                        setLotes6Meses(lotesData);
                        break;
                    case RANGOS.UN_ANIO:
                        setLotes1Anio(lotesData);
                        break;
                    case RANGOS.POCO_MAS_ANIO:
                        setLotesPreAnio(lotesData);
                        break;
                    default:
                        break;
                }
            }

            // Actualizar el rango seleccionado
            setRangoSeleccionado(rango);
        } catch (error) {
            console.error(`Error al cargar rango específico ${rango}:`, error);
        } finally {
            setIsLoadingLotes(false);
        }
    };

    // Función para manejar el cambio de rango
    const handleRangoChange = (rango) => {
        if (rango === rangoSeleccionado) {
            // Si se hace clic en el mismo rango, no hacemos nada
            return;
        } else {
            // Cargar el nuevo rango seleccionado
            fetchRangoEspecifico(rango);
        }
    };

    // Determinar si hay lotes para mostrar según el rango seleccionado
    const hayLotesParaMostrar = () => {
        switch (rangoSeleccionado) {
            case RANGOS.ALERTAS_CRITICAS:
                return expiredLotes.length > 0 || lotes90Dias.length > 0;
            case RANGOS.SEIS_MESES:
                return lotes6Meses.length > 0;
            case RANGOS.UN_ANIO:
                return lotes1Anio.length > 0;
            case RANGOS.POCO_MAS_ANIO:
                return lotesPreAnio.length > 0;
            default:
                return false;
        }
    };

    // Obtener el título de la tabla según el rango seleccionado
    const getTituloTabla = (rango) => {
        switch (rango) {
            case RANGOS.SEIS_MESES:
                return "Lotes que vencen entre 91 días y 6 meses";
            case RANGOS.UN_ANIO:
                return "Lotes que vencen entre 6 meses y 1 año";
            case RANGOS.POCO_MAS_ANIO:
                return "Lotes que vencen después de 1 año";
            default:
                return "";
        }
    };

    return (
        <div className="alertas-page">
            <AlertasStyles />
            <AlertasHeader title="Alertas por Vencimiento" />
            <ResumenAlertas
                lotesExpirados={totales.expirados}
                lotesProximosAVencer={totales.proximosAVencer}
                lotes6Meses={totales.seisMeses}
                lotes1Anio={totales.unAnio}
                lotesPreAnio={totales.preAnio}
            />

            {/* Selector de rangos de tiempo */}
            <div className="range-selector-container">
                <div className="range-selector-title">
                    Seleccione un rango de tiempo para visualizar:
                </div>
                <div className="button-group">
                    <button
                        className={`toggle-button ${
                            rangoSeleccionado === RANGOS.ALERTAS_CRITICAS
                                ? "active"
                                : ""
                        }`}
                        onClick={() =>
                            handleRangoChange(RANGOS.ALERTAS_CRITICAS)
                        }
                        disabled={isLoadingLotes}
                    >
                        <i
                            className="fas fa-exclamation-triangle"
                            style={{ marginRight: "5px" }}
                        ></i>
                        Alertas Críticas
                    </button>
                    <button
                        className={`toggle-button ${
                            rangoSeleccionado === RANGOS.SEIS_MESES
                                ? "active"
                                : ""
                        }`}
                        onClick={() => handleRangoChange(RANGOS.SEIS_MESES)}
                        disabled={isLoadingLotes}
                    >
                        <i
                            className="fas fa-calendar-alt"
                            style={{ marginRight: "5px" }}
                        ></i>
                        Ver 6 Meses
                    </button>
                    <button
                        className={`toggle-button ${
                            rangoSeleccionado === RANGOS.UN_ANIO ? "active" : ""
                        }`}
                        onClick={() => handleRangoChange(RANGOS.UN_ANIO)}
                        disabled={isLoadingLotes}
                    >
                        <i
                            className="fas fa-calendar-check"
                            style={{ marginRight: "5px" }}
                        ></i>
                        Ver 1 Año
                    </button>
                    <button
                        className={`toggle-button ${
                            rangoSeleccionado === RANGOS.POCO_MAS_ANIO
                                ? "active"
                                : ""
                        }`}
                        onClick={() => handleRangoChange(RANGOS.POCO_MAS_ANIO)}
                        disabled={isLoadingLotes}
                    >
                        <i
                            className="fas fa-clock"
                            style={{ marginRight: "5px" }}
                        ></i>
                        Ver Más de 1 Año
                    </button>
                    <button
                        className="refresh-button"
                        onClick={fetchTodosLosDatos}
                        disabled={isLoadingLotes}
                    >
                        <i
                            className={`fas ${
                                isLoadingLotes
                                    ? "fa-spinner fa-spin"
                                    : "fa-sync-alt"
                            }`}
                            style={{ marginRight: "5px" }}
                        ></i>
                        {isLoadingLotes ? "Cargando..." : "Actualizar Lotes"}
                    </button>
                </div>
            </div>

            {/* Sección de lotes de productos */}
            <div className="lotes-section">
                <div className="section-title">
                    <h2>Lotes de Productos</h2>
                </div>

                {isLoadingLotes ? (
                    <div className="loading-message">
                        Cargando lotes de productos...
                    </div>
                ) : (
                    <>
                        {/* Lotes vencidos - Solo visibles cuando se seleccionan alertas críticas */}
                        {rangoSeleccionado === RANGOS.ALERTAS_CRITICAS &&
                            expiredLotes.length > 0 && (
                                <LotesTable
                                    lotes={expiredLotes}
                                    title="Lotes Vencidos"
                                    alertType="danger"
                                />
                            )}

                        {/* Lotes próximos a vencer en 90 días - Solo visibles cuando se seleccionan alertas críticas */}
                        {rangoSeleccionado === RANGOS.ALERTAS_CRITICAS &&
                            lotes90Dias.length > 0 && (
                                <LotesTable
                                    lotes={lotes90Dias}
                                    title="Lotes próximos a vencer (90 días o menos)"
                                    alertType="warning"
                                />
                            )}

                        {/* Rango seleccionado: 6 meses */}
                        {rangoSeleccionado === RANGOS.SEIS_MESES &&
                            lotes6Meses.length > 0 && (
                                <LotesTable
                                    lotes={lotes6Meses}
                                    title={getTituloTabla(RANGOS.SEIS_MESES)}
                                    alertType="info"
                                />
                            )}

                        {/* Rango seleccionado: 1 año */}
                        {rangoSeleccionado === RANGOS.UN_ANIO &&
                            lotes1Anio.length > 0 && (
                                <LotesTable
                                    lotes={lotes1Anio}
                                    title={getTituloTabla(RANGOS.UN_ANIO)}
                                    alertType="success"
                                />
                            )}

                        {/* Rango seleccionado: poco más de 1 año */}
                        {rangoSeleccionado === RANGOS.POCO_MAS_ANIO &&
                            lotesPreAnio.length > 0 && (
                                <LotesTable
                                    lotes={lotesPreAnio}
                                    title={getTituloTabla(RANGOS.POCO_MAS_ANIO)}
                                    alertType="secondary"
                                />
                            )}

                        {!hayLotesParaMostrar() && (
                            <div className="no-data-message">
                                No hay lotes de productos en el rango de tiempo
                                seleccionado.
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AlertasPage;
