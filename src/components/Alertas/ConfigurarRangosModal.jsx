import React, { useState, useEffect } from "react";
import { FaTimes, FaSave, FaPlay, FaEdit } from "react-icons/fa";

const ConfigurarRangosModal = ({
    isOpen,
    onClose,
    rangosActuales,
    onAplicarRangos,
    onDefinirPorDefecto,
}) => {
    const [rangoConfig, setRangoConfig] = useState(rangosActuales);
    const [hayCambios, setHayCambios] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setRangoConfig(rangosActuales);
            setHayCambios(false);
        }
    }, [isOpen, rangosActuales]);

    const handleInputChange = (field, value) => {
        const newConfig = {
            ...rangoConfig,
            [field]: parseInt(value) || 0,
        };
        setRangoConfig(newConfig);
        setHayCambios(true);
    };

    const handleAplicarRangos = () => {
        onAplicarRangos(rangoConfig);
        setHayCambios(false);
    };

    const handleDefinirPorDefecto = () => {
        onDefinirPorDefecto(rangoConfig);
        setHayCambios(false);
    };

    const handleCancelar = () => {
        setRangoConfig(rangosActuales);
        setHayCambios(false);
        onClose();
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
                    background: "white",
                    borderRadius: "12px",
                    padding: "30px",
                    width: "90%",
                    maxWidth: "600px",
                    maxHeight: "90vh",
                    overflowY: "auto",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "25px",
                        paddingBottom: "15px",
                        borderBottom: "2px solid #e9ecef",
                    }}
                >
                    <h2
                        style={{
                            margin: 0,
                            color: "#2c3e50",
                            fontSize: "1.5rem",
                            fontWeight: "700",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                        }}
                    >
                        <FaEdit style={{ color: "#1976d2" }} />
                        Configurar Rangos de Stock
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            fontSize: "20px",
                            cursor: "pointer",
                            color: "#6c757d",
                            padding: "5px",
                            borderRadius: "50%",
                            width: "35px",
                            height: "35px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "#f8f9fa";
                            e.target.style.color = "#dc3545";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "transparent";
                            e.target.style.color = "#6c757d";
                        }}
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Contenido */}
                <div style={{ marginBottom: "25px" }}>
                    <div
                        style={{
                            background: "#f8f9fa",
                            padding: "15px",
                            borderRadius: "8px",
                            marginBottom: "20px",
                            borderLeft: "4px solid #1976d2",
                        }}
                    >
                        <h4 style={{ margin: "0 0 10px 0", color: "#2c3e50" }}>
                            📊 Configuración de Rangos
                        </h4>
                        <p
                            style={{
                                margin: 0,
                                color: "#6c757d",
                                fontSize: "14px",
                            }}
                        >
                            Define los rangos de stock para clasificar
                            automáticamente los productos según su cantidad
                            disponible.
                        </p>
                    </div>

                    {/* Formulario de rangos */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "15px",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                padding: "12px",
                                background: "#fff3cd",
                                borderRadius: "6px",
                                borderLeft: "4px solid #ffc107",
                            }}
                        >
                            <label
                                style={{
                                    fontWeight: "600",
                                    color: "#495057",
                                    marginRight: "8px",
                                    minWidth: "150px",
                                }}
                            >
                                Stock Crítico: 0 a
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={rangoConfig.criticoMax}
                                onChange={(e) =>
                                    handleInputChange(
                                        "criticoMax",
                                        e.target.value
                                    )
                                }
                                style={{
                                    width: "80px",
                                    padding: "8px 12px",
                                    border: "2px solid #ced4da",
                                    borderRadius: "4px",
                                    textAlign: "center",
                                    fontWeight: "600",
                                    fontSize: "14px",
                                }}
                            />
                            <span
                                style={{ color: "#6c757d", marginLeft: "8px" }}
                            >
                                unidades
                            </span>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                padding: "12px",
                                background: "#fff8e1",
                                borderRadius: "6px",
                                borderLeft: "4px solid #ffc107",
                            }}
                        >
                            <label
                                style={{
                                    fontWeight: "600",
                                    color: "#495057",
                                    marginRight: "8px",
                                    minWidth: "150px",
                                }}
                            >
                                Stock Bajo: {rangoConfig.criticoMax + 1} a
                            </label>
                            <input
                                type="number"
                                min={rangoConfig.criticoMax + 1}
                                value={rangoConfig.bajoMax}
                                onChange={(e) =>
                                    handleInputChange("bajoMax", e.target.value)
                                }
                                style={{
                                    width: "80px",
                                    padding: "8px 12px",
                                    border: "2px solid #ced4da",
                                    borderRadius: "4px",
                                    textAlign: "center",
                                    fontWeight: "600",
                                    fontSize: "14px",
                                }}
                            />
                            <span
                                style={{ color: "#6c757d", marginLeft: "8px" }}
                            >
                                unidades
                            </span>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                padding: "12px",
                                background: "#e3f2fd",
                                borderRadius: "6px",
                                borderLeft: "4px solid #17a2b8",
                            }}
                        >
                            <label
                                style={{
                                    fontWeight: "600",
                                    color: "#495057",
                                    marginRight: "8px",
                                    minWidth: "150px",
                                }}
                            >
                                Stock Normal: {rangoConfig.bajoMax + 1} a
                            </label>
                            <input
                                type="number"
                                min={rangoConfig.bajoMax + 1}
                                value={rangoConfig.normalMax}
                                onChange={(e) =>
                                    handleInputChange(
                                        "normalMax",
                                        e.target.value
                                    )
                                }
                                style={{
                                    width: "80px",
                                    padding: "8px 12px",
                                    border: "2px solid #ced4da",
                                    borderRadius: "4px",
                                    textAlign: "center",
                                    fontWeight: "600",
                                    fontSize: "14px",
                                }}
                            />
                            <span
                                style={{ color: "#6c757d", marginLeft: "8px" }}
                            >
                                unidades
                            </span>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                padding: "12px",
                                background: "#e8f5e9",
                                borderRadius: "6px",
                                borderLeft: "4px solid #28a745",
                            }}
                        >
                            <label
                                style={{
                                    fontWeight: "600",
                                    color: "#495057",
                                    marginRight: "8px",
                                    minWidth: "150px",
                                }}
                            >
                                Stock Alto: {rangoConfig.normalMax + 1} a
                            </label>
                            <input
                                type="number"
                                min={rangoConfig.normalMax + 1}
                                value={rangoConfig.altoMax}
                                onChange={(e) =>
                                    handleInputChange("altoMax", e.target.value)
                                }
                                style={{
                                    width: "80px",
                                    padding: "8px 12px",
                                    border: "2px solid #ced4da",
                                    borderRadius: "4px",
                                    textAlign: "center",
                                    fontWeight: "600",
                                    fontSize: "14px",
                                }}
                            />
                            <span
                                style={{ color: "#6c757d", marginLeft: "8px" }}
                            >
                                unidades
                            </span>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                padding: "12px",
                                background: "#f5f5f5",
                                borderRadius: "6px",
                                borderLeft: "4px solid #6c757d",
                            }}
                        >
                            <label
                                style={{
                                    fontWeight: "600",
                                    color: "#495057",
                                    marginRight: "8px",
                                    minWidth: "150px",
                                }}
                            >
                                Stock Excesivo: más de {rangoConfig.altoMax}{" "}
                                unidades
                            </label>
                        </div>
                    </div>

                    {/* Ayuda */}
                    <div
                        style={{
                            marginTop: "20px",
                            padding: "15px",
                            backgroundColor: "#e3f2fd",
                            borderRadius: "8px",
                            border: "1px solid #bbdefb",
                        }}
                    >
                        <h5 style={{ margin: "0 0 10px 0", color: "#1976d2" }}>
                            💡 Información:
                        </h5>
                        <ul
                            style={{
                                margin: 0,
                                paddingLeft: "20px",
                                color: "#495057",
                                fontSize: "14px",
                            }}
                        >
                            <li>
                                <strong>Aplicar Rangos:</strong> Aplica los
                                cambios solo para esta sesión
                            </li>
                            <li>
                                <strong>Definir como Por Defecto:</strong>{" "}
                                Guarda estos rangos como configuración
                                permanente
                            </li>
                            <li>
                                Los rangos deben ser coherentes (cada valor
                                máximo debe ser mayor que el anterior)
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Botones */}
                <div
                    style={{
                        display: "flex",
                        gap: "10px",
                        justifyContent: "flex-end",
                        borderTop: "1px solid #e9ecef",
                        paddingTop: "20px",
                    }}
                >
                    <button
                        onClick={handleCancelar}
                        style={{
                            padding: "10px 20px",
                            border: "1px solid #6c757d",
                            borderRadius: "6px",
                            background: "white",
                            color: "#6c757d",
                            fontWeight: "600",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                        }}
                    >
                        <FaTimes />
                        Cancelar
                    </button>

                    <button
                        onClick={handleAplicarRangos}
                        disabled={!hayCambios}
                        style={{
                            padding: "10px 20px",
                            border: "none",
                            borderRadius: "6px",
                            background: hayCambios ? "#17a2b8" : "#6c757d",
                            color: "white",
                            fontWeight: "600",
                            cursor: hayCambios ? "pointer" : "not-allowed",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                        }}
                    >
                        <FaPlay />
                        Aplicar Rangos
                    </button>

                    <button
                        onClick={handleDefinirPorDefecto}
                        disabled={!hayCambios}
                        style={{
                            padding: "10px 20px",
                            border: "none",
                            borderRadius: "6px",
                            background: hayCambios ? "#28a745" : "#6c757d",
                            color: "white",
                            fontWeight: "600",
                            cursor: hayCambios ? "pointer" : "not-allowed",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                        }}
                    >
                        <FaSave />
                        Definir como Por Defecto
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfigurarRangosModal;
