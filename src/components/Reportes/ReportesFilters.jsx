import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getLocations } from "../../services/inventoryService";
import { getCurrentDateLocal, debugDate } from "../../utils/dateUtils";

const ReportesFilters = ({ filters, setFilters, activeView, children }) => {
    const { authToken } = useAuth();
    const [locations, setLocations] = useState([]);
    const [isLoadingLocations, setIsLoadingLocations] = useState(false);

    // Función para obtener la fecha actual en zona horaria local
    const getTodayLocal = () => {
        const today = getCurrentDateLocal();
        console.log("📅 Fecha actual (local):", today);
        debugDate(today, "Fecha actual local");
        return today;
    };

    // Cargar ubicaciones disponibles
    const loadLocations = async () => {
        if (!authToken) return;

        setIsLoadingLocations(true);
        try {
            // Usar el servicio de inventario para obtener todas las ubicaciones
            const locationData = await getLocations(authToken);

            // Filtrar solo las sedes (type: "sede") y extraer nombres
            const sedes = locationData.filter((location) => location.type === "sede");
            const sedeNames = sedes.map((sede) => sede.name).sort(); // Ordenar alfabéticamente

            setLocations(sedeNames);
            console.log("✅ Sedes cargadas:", sedeNames);
        } catch (error) {
            console.error("❌ Error cargando sedes:", error);
            // Fallback a ubicaciones básicas si falla la carga
            setLocations(["Principal", "Sucursal Norte", "Sucursal Sur"]);
        } finally {
            setIsLoadingLocations(false);
        }
    };

    // Cargar ubicaciones al montar el componente
    useEffect(() => {
        loadLocations();
    }, [authToken]);

    return (
        <div
            style={{
                padding: "24px",
                background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                borderRadius: "16px",
                marginBottom: "24px",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
                color: "#495057",
                border: "1px solid #dee2e6",
            }}
        >
            <h3
                style={{
                    margin: "0 0 20px 0",
                    color: "#2c3e50",
                    fontSize: "20px",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                }}
            >
                🔍 Filtros de Búsqueda
            </h3>
            <div
                style={{
                    display: "flex",
                    gap: 16,
                    alignItems: "flex-end",
                    flexWrap: "wrap",
                }}
            >
                {/* Filtro por días hacia atrás */}
                {activeView === "ventas" && (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                            minWidth: "200px",
                        }}
                    >
                        <label
                            style={{
                                fontWeight: "600",
                                color: "#495057",
                                fontSize: "14px",
                            }}
                        >
                            📅 Período (últimos días)
                        </label>
                        <select
                            value={filters.days || ""}
                            onChange={(e) =>
                                setFilters({
                                    ...filters,
                                    days: e.target.value
                                        ? parseInt(e.target.value)
                                        : "",
                                    // Limpiar filtros de fecha específicos cuando se usa días
                                    startDate: "",
                                    endDate: "",
                                    specificDate: "",
                                })
                            }
                            style={{
                                padding: "12px 16px",
                                border: "1px solid #ced4da",
                                borderRadius: "8px",
                                fontSize: "14px",
                                backgroundColor: "white",
                                color: "#2c3e50",
                                fontWeight: "500",
                                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                                transition: "all 0.2s ease",
                                cursor: "pointer",
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = "#6c757d";
                                e.target.style.boxShadow =
                                    "0 2px 8px rgba(0, 0, 0, 0.1)";
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = "#ced4da";
                                e.target.style.boxShadow =
                                    "0 2px 4px rgba(0, 0, 0, 0.05)";
                            }}
                        >
                            <option value="">Selecciona uno</option>
                            <option value={7}>Esta semana (7 días)</option>
                            <option value={15}>
                                Últimas 2 semanas (15 días)
                            </option>
                            <option value={30}>Este mes (30 días)</option>
                            <option value={60}>
                                Últimos 2 meses (60 días)
                            </option>
                            <option value={90}>
                                Últimos 3 meses (90 días)
                            </option>
                            <option value={180}>
                                Últimos 6 meses (180 días)
                            </option>
                            <option value={365}>Este año (365 días)</option>
                        </select>
                    </div>
                )}

                {/* Filtro de fecha específica */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        minWidth: "200px",
                    }}
                >
                    <label
                        style={{
                            fontWeight: "600",
                            color: "#495057",
                            fontSize: "14px",
                        }}
                    >
                        📅 Fecha Específica
                    </label>
                    <input
                        type="date"
                        value={filters.specificDate}
                        onChange={(e) =>
                            setFilters({
                                ...filters,
                                specificDate: e.target.value,
                                // Limpiar filtros de días cuando se usa fecha específica
                                days: "",
                                startDate: "",
                                endDate: "",
                            })
                        }
                        style={{
                            padding: "12px 16px",
                            border: "1px solid #ced4da",
                            borderRadius: "8px",
                            fontSize: "14px",
                            backgroundColor: "white",
                            color: "#2c3e50",
                            fontWeight: "500",
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                            transition: "all 0.2s ease",
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = "#6c757d";
                            e.target.style.boxShadow =
                                "0 2px 8px rgba(0, 0, 0, 0.1)";
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = "#ced4da";
                            e.target.style.boxShadow =
                                "0 2px 4px rgba(0, 0, 0, 0.05)";
                        }}
                    />
                </div>

                {/* Filtro por ubicación */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        minWidth: "200px",
                    }}
                >
                    <label
                        style={{
                            fontWeight: "600",
                            color: "#495057",
                            fontSize: "14px",
                        }}
                    >
                        🏢 Sede
                    </label>
                    <select
                        value={filters.sede}
                        onChange={(e) =>
                            setFilters({
                                ...filters,
                                sede: e.target.value,
                            })
                        }
                        style={{
                            padding: "12px 16px",
                            border: "1px solid #ced4da",
                            borderRadius: "8px",
                            fontSize: "14px",
                            backgroundColor: "white",
                            color: "#2c3e50",
                            fontWeight: "500",
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                            transition: "all 0.2s ease",
                            cursor: "pointer",
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = "#6c757d";
                            e.target.style.boxShadow =
                                "0 2px 8px rgba(0, 0, 0, 0.1)";
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = "#ced4da";
                            e.target.style.boxShadow =
                                "0 2px 4px rgba(0, 0, 0, 0.05)";
                        }}
                    >
                        <option value="all">Todas las sedes</option>
                        {isLoadingLocations ? (
                            <option value="" disabled>
                                Cargando sedes...
                            </option>
                        ) : (
                            locations.map((location, index) => (
                                <option key={index} value={location}>
                                    {location}
                                </option>
                            ))
                        )}
                    </select>
                </div>

                {/* Sección de acceso rápido */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        minWidth: "200px",
                    }}
                >
                    <label
                        style={{
                            fontWeight: "600",
                            color: "#495057",
                            fontSize: "14px",
                        }}
                    >
                        ⚡ Acceso rápido
                    </label>
                    <button
                        onClick={() => {
                            const today = getTodayLocal();
                            console.log("🔄 Configurando filtro para ventas de hoy:", today);
                            setFilters({
                                ...filters,
                                specificDate: today,
                                days: "",
                                startDate: "",
                                endDate: "",
                            });
                        }}
                        style={{
                            padding: "12px 16px",
                            background: "#28a745",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "600",
                            whiteSpace: "nowrap",
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                            transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = "#218838";
                            e.target.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = "#28a745";
                            e.target.style.transform = "translateY(0)";
                        }}
                    >
                        Ver ventas de hoy
                    </button>
                </div>

                {/* Botón de limpiar filtros */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        minWidth: "200px",
                    }}
                >
                    <label
                        style={{
                            fontWeight: "600",
                            color: "#495057",
                            fontSize: "14px",
                            opacity: 0, // Invisible label para alineación
                        }}
                    >
                        Acciones
                    </label>
                    <button
                        onClick={() => {
                            const today = getTodayLocal();
                            console.log("🧹 Limpiando filtros, volviendo a fecha actual:", today);
                            setFilters({
                                type: "sale",
                                days: "",
                                specificDate: today,
                                startDate: "",
                                endDate: "",
                                sede: "all",
                            });
                        }}
                        style={{
                            padding: "12px 16px",
                            background: "#dc3545",
                            color: "white",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "600",
                            whiteSpace: "nowrap",
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                            transition: "all 0.2s ease",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = "#c82333";
                            e.target.style.transform = "translateY(-1px)";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = "#dc3545";
                            e.target.style.transform = "translateY(0)";
                        }}
                    >
                        🗑️ Limpiar Filtros
                    </button>
                </div>
            </div>

            {/* Mostrar filtros activos */}
            {(filters.days || filters.specificDate || filters.startDate || filters.endDate) && (
                <div
                    style={{
                        marginTop: "16px",
                        padding: "12px 16px",
                        backgroundColor: "#e3f2fd",
                        borderRadius: "8px",
                        border: "1px solid #2196f3",
                        fontSize: "14px",
                        color: "#1976d2",
                        fontWeight: "500",
                    }}
                >
                    <strong>Filtros activos:</strong>
                    {filters.days && (
                        <span style={{ marginLeft: "8px" }}>
                            📅 Período: Últimos {filters.days} días
                        </span>
                    )}
                    {filters.specificDate && (
                        <span style={{ marginLeft: "8px" }}>
                            🗓️ Fecha: {filters.specificDate}
                        </span>
                    )}
                    {filters.startDate && filters.endDate && (
                        <span style={{ marginLeft: "8px" }}>
                            📅 Rango: {filters.startDate} - {filters.endDate}
                        </span>
                    )}
                </div>
            )}

            {/* Renderizar children adicionales */}
            {children}
        </div>
    );
};

export default ReportesFilters;
