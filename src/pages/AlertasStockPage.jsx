import React, {
    useState,
    useEffect,
    useRef,
    useMemo,
    useCallback,
} from "react";
import AlertasHeader from "../components/Alertas/AlertasHeader";
import AlertasStyles from "../components/Alertas/AlertasStyles";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import API_CONFIG from "../config/api";
import {
    FaBoxes,
    FaBatteryEmpty,
    FaBatteryQuarter,
    FaBatteryHalf,
    FaBatteryThreeQuarters,
    FaBatteryFull,
    FaSync,
    FaSpinner,
} from "react-icons/fa";

// URL base para las peticiones a la API
const API_URL = API_CONFIG.BASE_URL;

// Clave para localStorage
const RANGOS_STORAGE_KEY = "alertas_stock_rangos";

// Definición de rangos predeterminados (fallback)
const RANGOS_FACTORY_DEFAULT = {
    STOCK_CRITICO: { min: 0, max: 5, nombre: "Stock Crítico", tipo: "danger" },
    STOCK_BAJO: { min: 6, max: 15, nombre: "Stock Bajo", tipo: "warning" },
    STOCK_NORMAL: { min: 16, max: 30, nombre: "Stock Normal", tipo: "info" },
    STOCK_ALTO: { min: 31, max: 100, nombre: "Stock Alto", tipo: "success" },
    STOCK_EXCESIVO: {
        min: 101,
        max: Infinity,
        nombre: "Stock Excesivo",
        tipo: "secondary",
    },
};

// 🚀 NUEVA FUNCIÓN: Cargar rangos guardados desde localStorage
const cargarRangosGuardados = () => {
    try {
        const rangosGuardados = localStorage.getItem(RANGOS_STORAGE_KEY);
        if (rangosGuardados) {
            const rangosParsed = JSON.parse(rangosGuardados);
            console.log("📦 Rangos cargados desde localStorage:", rangosParsed);
            return rangosParsed;
        }
    } catch (error) {
        console.error("Error al cargar rangos desde localStorage:", error);
    }
    console.log("📦 Usando rangos de fábrica por defecto");
    return {
        criticoMax: RANGOS_FACTORY_DEFAULT.STOCK_CRITICO.max,
        bajoMax: RANGOS_FACTORY_DEFAULT.STOCK_BAJO.max,
        normalMax: RANGOS_FACTORY_DEFAULT.STOCK_NORMAL.max,
        altoMax: RANGOS_FACTORY_DEFAULT.STOCK_ALTO.max,
    };
};

// 🚀 NUEVA FUNCIÓN: Guardar rangos en localStorage
const guardarRangosEnStorage = (rangosConfig) => {
    try {
        localStorage.setItem(RANGOS_STORAGE_KEY, JSON.stringify(rangosConfig));
        console.log("💾 Rangos guardados en localStorage:", rangosConfig);
        return true;
    } catch (error) {
        console.error("Error al guardar rangos en localStorage:", error);
        return false;
    }
};

const AlertasStockPage = () => {
    // Obtener el token de autenticación del contexto
    const { authToken } = useAuth();

    // 🚀 ESTADO MEJORADO: Cargar rangos guardados al inicializar
    const rangosIniciales = useMemo(() => cargarRangosGuardados(), []);

    // Estado para los rangos configurables
    const [rangos, setRangos] = useState(RANGOS_FACTORY_DEFAULT);

    // Estados para productos filtrados
    const [productosActuales, setProductosActuales] = useState([]);
    const [tipoActual, setTipoActual] = useState("default");
    const [tituloActual, setTituloActual] = useState("");

    // Estados para totales por categoría
    const [totales, setTotales] = useState({
        criticos: 0,
        bajos: 0,
        normales: 0,
        altos: 0,
        excesivos: 0,
    });

    // Estados para control de UI
    const [isLoadingProductos, setIsLoadingProductos] = useState(false);
    const [error, setError] = useState(null);
    const [rangoSeleccionado, setRangoSeleccionado] = useState("STOCK_CRITICO");
    const [isEditing, setIsEditing] = useState(false);

    // 🚀 ESTADO MEJORADO: Usar rangos guardados como valores iniciales
    const [rangoConfig, setRangoConfig] = useState(rangosIniciales);

    // �� NUEVO ESTADO: Para mostrar si los rangos actuales son diferentes a los guardados
    const [hayRangosSinGuardar, setHayRangosSinGuardar] = useState(false);

    // Estado para almacenar todos los productos (sin filtrar)
    const [allProductos, setAllProductos] = useState([]);

    // Referencia para evitar bucles infinitos en el filtrado
    const isFilteringRef = useRef(false);

    // 🚀 OPTIMIZACIÓN: Memoizar rangos calculados para evitar recálculos innecesarios
    const rangosCalculados = useMemo(() => {
        return {
            STOCK_CRITICO: {
                min: 0,
                max: rangoConfig.criticoMax,
                nombre: "Stock Crítico",
                tipo: "danger",
            },
            STOCK_BAJO: {
                min: rangoConfig.criticoMax + 1,
                max: rangoConfig.bajoMax,
                nombre: "Stock Bajo",
                tipo: "warning",
            },
            STOCK_NORMAL: {
                min: rangoConfig.bajoMax + 1,
                max: rangoConfig.normalMax,
                nombre: "Stock Normal",
                tipo: "info",
            },
            STOCK_ALTO: {
                min: rangoConfig.normalMax + 1,
                max: rangoConfig.altoMax,
                nombre: "Stock Alto",
                tipo: "success",
            },
            STOCK_EXCESIVO: {
                min: rangoConfig.altoMax + 1,
                max: Infinity,
                nombre: "Stock Excesivo",
                tipo: "secondary",
            },
        };
    }, [rangoConfig]);

    // 🚀 NUEVO EFECTO: Verificar si hay cambios sin guardar
    useEffect(() => {
        const rangosGuardados = cargarRangosGuardados();
        const sonDiferentes =
            rangoConfig.criticoMax !== rangosGuardados.criticoMax ||
            rangoConfig.bajoMax !== rangosGuardados.bajoMax ||
            rangoConfig.normalMax !== rangosGuardados.normalMax ||
            rangoConfig.altoMax !== rangosGuardados.altoMax;

        setHayRangosSinGuardar(sonDiferentes);
    }, [rangoConfig]);

    // 🚀 OPTIMIZACIÓN: Actualizar rangos solo cuando cambie rangosCalculados
    useEffect(() => {
        setRangos(rangosCalculados);
    }, [rangosCalculados]);

    // 🚀 OPTIMIZACIÓN: useEffect separado para recálculos cuando cambien los rangos
    useEffect(() => {
        if (allProductos.length > 0) {
            console.log("🔄 Recalculando datos por cambio en rangos...");
            calcularTotalesPorRango(allProductos, rangosCalculados);
            filtrarProductosDelRango(
                rangoSeleccionado,
                allProductos,
                rangosCalculados
            );
        }
    }, [rangosCalculados, rangoSeleccionado]); // Eliminé allProductos de las dependencias para evitar bucles

    // Efecto para cargar productos al montar el componente
    useEffect(() => {
        cargarProductos();
    }, []);

    // 🚀 OPTIMIZACIÓN: Función optimizada para cargar productos usando endpoint sin paginación
    const cargarProductos = async () => {
        setIsLoadingProductos(true);
        setError(null);
        console.log("⚡ Iniciando carga optimizada de productos...");

        try {
            // 🚀 CAMBIO CRÍTICO: Usar endpoint sin paginación para una sola petición
            const response = await axios.get(
                `${API_URL}${API_CONFIG.ENDPOINTS.STOCK_ALL}`,
                {
                    headers: {
                        Authorization: `Token ${authToken}`,
                    },
                    // No necesitamos parámetros de paginación para /stock/all/
                }
            );

            const responseData = response.data;

            // El endpoint /stock/all/ puede devolver directamente un array o un objeto con results
            let allData = [];

            if (Array.isArray(responseData)) {
                allData = responseData;
            } else if (responseData && Array.isArray(responseData.results)) {
                allData = responseData.results;
            } else {
                throw new Error("Formato de datos inesperado del servidor");
            }

            console.log(
                `⚡ Total de productos cargados en UNA petición: ${allData.length}`
            );

            // Almacenar todos los productos
            setAllProductos(allData);

            // 🚀 OPTIMIZACIÓN: Calcular totales y filtrar usando rangos actuales
            if (allData.length > 0) {
                calcularTotalesPorRango(allData, rangosCalculados);
                filtrarProductosDelRango(
                    rangoSeleccionado,
                    allData,
                    rangosCalculados
                );
            }
        } catch (error) {
            console.error("Error al cargar datos de stock:", error);
            setError(
                "Error al cargar los datos de stock. Por favor, intente nuevamente."
            );

            // Limpiar productos en caso de error
            setAllProductos([]);
        } finally {
            setIsLoadingProductos(false);
        }
    };

    // 🚀 OPTIMIZACIÓN: Función memoizada para calcular totales (misma lógica, mejor rendimiento)
    const calcularTotalesPorRango = useCallback(
        (productos, rangosActuales = rangos) => {
            console.log(
                `📊 Calculando totales por rango para ${productos.length} productos`
            );

            const startTime = performance.now();

            let criticos = 0,
                bajos = 0,
                normales = 0,
                altos = 0,
                excesivos = 0;

            // 🚀 MISMA LÓGICA DE FILTRADO - Sin cambios para mantener funcionalidad
            productos.forEach((producto) => {
                const cantidad = parseInt(producto.quantity) || 0;

                // Clasificar en cada categoría (lógica original preservada)
                if (
                    cantidad >= rangosActuales.STOCK_CRITICO.min &&
                    cantidad <= rangosActuales.STOCK_CRITICO.max
                ) {
                    criticos++;
                } else if (
                    cantidad >= rangosActuales.STOCK_BAJO.min &&
                    cantidad <= rangosActuales.STOCK_BAJO.max
                ) {
                    bajos++;
                } else if (
                    cantidad >= rangosActuales.STOCK_NORMAL.min &&
                    cantidad <= rangosActuales.STOCK_NORMAL.max
                ) {
                    normales++;
                } else if (
                    cantidad >= rangosActuales.STOCK_ALTO.min &&
                    cantidad <= rangosActuales.STOCK_ALTO.max
                ) {
                    altos++;
                } else if (cantidad >= rangosActuales.STOCK_EXCESIVO.min) {
                    excesivos++;
                }
            });

            const endTime = performance.now();
            console.log(
                `📈 Totales calculados en ${(endTime - startTime).toFixed(
                    2
                )}ms: Críticos: ${criticos}, Bajos: ${bajos}, Normales: ${normales}, Altos: ${altos}, Excesivos: ${excesivos}`
            );

            setTotales({
                criticos,
                bajos,
                normales,
                altos,
                excesivos,
            });
        },
        [rangos]
    );

    // Función para manejar el cambio de rango seleccionado (sin cambios)
    const handleRangoChange = (rango) => {
        console.log(`🔄 Cambiando de rango ${rangoSeleccionado} a ${rango}`);

        if (rango === rangoSeleccionado) {
            console.log("El mismo rango seleccionado, no se requiere cambio");
            return;
        }

        // Limpiar productos actuales primero
        setProductosActuales([]);
        setTipoActual("default");
        setTituloActual("");

        // Cambiar el rango seleccionado
        setRangoSeleccionado(rango);
    };

    // 🚀 FUNCIÓN MEJORADA: Aplicar rangos temporalmente (solo para esta sesión)
    const aplicarRangosTemporalmente = () => {
        // Validar que los rangos sean coherentes
        if (
            rangoConfig.criticoMax >= 0 &&
            rangoConfig.bajoMax > rangoConfig.criticoMax &&
            rangoConfig.normalMax > rangoConfig.bajoMax &&
            rangoConfig.altoMax > rangoConfig.normalMax
        ) {
            setIsEditing(false);
            console.log("✅ Rangos aplicados temporalmente (solo esta sesión)");
        } else {
            alert(
                "Los rangos deben ser coherentes. Cada valor máximo debe ser mayor que el anterior."
            );
        }
    };

    // 🚀 NUEVA FUNCIÓN: Definir rangos como por defecto (persistente)
    const definirComoRangosPorDefecto = () => {
        // Validar que los rangos sean coherentes
        if (
            rangoConfig.criticoMax >= 0 &&
            rangoConfig.bajoMax > rangoConfig.criticoMax &&
            rangoConfig.normalMax > rangoConfig.bajoMax &&
            rangoConfig.altoMax > rangoConfig.normalMax
        ) {
            // Guardar en localStorage
            const guardadoExitoso = guardarRangosEnStorage(rangoConfig);

            if (guardadoExitoso) {
                setIsEditing(false);
                setHayRangosSinGuardar(false);
                alert(
                    "✅ Rangos definidos como por defecto. Se aplicarán para todos los usuarios futuras sesiones."
                );
                console.log("💾 Rangos guardados como por defecto");
            } else {
                alert("❌ Error al guardar los rangos. Inténtalo de nuevo.");
            }
        } else {
            alert(
                "Los rangos deben ser coherentes. Cada valor máximo debe ser mayor que el anterior."
            );
        }
    };

    // Función para cancelar la edición de rangos (sin cambios)
    const cancelarEdicion = () => {
        // Restaurar los valores guardados
        const rangosGuardados = cargarRangosGuardados();
        setRangoConfig(rangosGuardados);
        setIsEditing(false);
    };

    // Determinar qué productos mostrar según el rango seleccionado (sin cambios)
    const getProductosPorRango = () => {
        return {
            productos: productosActuales,
            titulo: tituloActual,
            tipo: tipoActual,
        };
    };

    // Determinar si hay productos para mostrar según el rango seleccionado (sin cambios)
    const hayProductosParaMostrar = () => {
        return productosActuales && productosActuales.length > 0;
    };

    // 🚀 OPTIMIZACIÓN: Función memoizada para filtrar productos (misma lógica, mejor rendimiento)
    const filtrarProductosDelRango = useCallback(
        (rango, productos = allProductos, rangosActuales = rangos) => {
            console.log(`🎯 Filtrando productos para rango: ${rango}`);

            const startTime = performance.now();

            if (!productos || productos.length === 0) {
                console.log("No hay productos para filtrar");
                setProductosActuales([]);
                setTipoActual("default");
                setTituloActual("");
                return;
            }

            const rangoConfigLocal = rangosActuales[rango];
            if (!rangoConfigLocal) {
                console.error(`Rango ${rango} no encontrado`);
                setProductosActuales([]);
                return;
            }

            console.log(
                `Aplicando filtro para ${rangoConfigLocal.nombre}: ${
                    rangoConfigLocal.min
                } - ${
                    rangoConfigLocal.max === Infinity
                        ? "∞"
                        : rangoConfigLocal.max
                }`
            );

            // 🚀 MISMA LÓGICA DE FILTRADO - Sin cambios para mantener funcionalidad
            const productosFiltrados = productos
                .filter((producto) => {
                    const cantidad = parseInt(producto.quantity) || 0;

                    // Aplicar filtro específico para este rango (lógica original preservada)
                    if (rangoConfigLocal.max === Infinity) {
                        // Para stock excesivo (sin límite superior)
                        return cantidad >= rangoConfigLocal.min;
                    } else {
                        // Para rangos con límite superior definido
                        return (
                            cantidad >= rangoConfigLocal.min &&
                            cantidad <= rangoConfigLocal.max
                        );
                    }
                })
                .map((producto) => ({
                    id: producto.id || producto.product_id,
                    product_name:
                        producto.product_name ||
                        producto.product_display_name ||
                        "Producto sin nombre",
                    batch_number: producto.sku || producto.product_sku || "N/A",
                    quantity: parseInt(producto.quantity) || 0,
                    location_name:
                        producto.location_name ||
                        producto.location_display_name ||
                        "Sin ubicación",
                }));

            const endTime = performance.now();
            console.log(
                `✅ Encontrados ${productosFiltrados.length} productos para ${
                    rangoConfigLocal.nombre
                } en ${(endTime - startTime).toFixed(2)}ms`
            );

            // Mostrar ejemplos de productos filtrados en la consola
            if (productosFiltrados.length > 0) {
                console.log("Ejemplos de productos filtrados:");
                productosFiltrados.slice(0, 3).forEach((p, i) => {
                    console.log(
                        `  ${i + 1}. ${p.product_name} - Stock: ${p.quantity}`
                    );
                });
            }

            // Actualizar estado con productos del rango actual
            setProductosActuales([...productosFiltrados]);
            setTipoActual(rangoConfigLocal.tipo);
            setTituloActual(rangoConfigLocal.nombre);
        },
        [rangos, allProductos]
    );

    // Función para determinar el color según el tipo de nivel de stock (sin cambios)
    const getStatusColor = (tipo) => {
        switch (tipo) {
            case "danger":
                return "#ffebee"; // Rojo claro para stock crítico
            case "warning":
                return "#fff8e1"; // Amarillo claro para stock bajo
            case "info":
                return "#e3f2fd"; // Azul claro para stock normal
            case "success":
                return "#e8f5e9"; // Verde claro para stock alto
            case "secondary":
                return "#f5f5f5"; // Gris claro para stock excesivo
            default:
                return "inherit"; // Color normal
        }
    };

    // Función para obtener el ícono según el tipo de nivel de stock (sin cambios)
    const getStatusIcon = (tipo) => {
        switch (tipo) {
            case "danger":
                return (
                    <i
                        className="fas fa-battery-empty"
                        style={{ color: "#e53935", marginRight: "5px" }}
                    />
                );
            case "warning":
                return (
                    <i
                        className="fas fa-battery-quarter"
                        style={{ color: "#ff9800", marginRight: "5px" }}
                    />
                );
            case "info":
                return (
                    <i
                        className="fas fa-battery-half"
                        style={{ color: "#2196f3", marginRight: "5px" }}
                    />
                );
            case "success":
                return (
                    <i
                        className="fas fa-battery-three-quarters"
                        style={{ color: "#4caf50", marginRight: "5px" }}
                    />
                );
            case "secondary":
                return (
                    <i
                        className="fas fa-battery-full"
                        style={{ color: "#757575", marginRight: "5px" }}
                    />
                );
            default:
                return (
                    <i
                        className="fas fa-battery-half"
                        style={{ color: "#4caf50", marginRight: "5px" }}
                    />
                );
        }
    };

    // Función para obtener el texto de estado según el tipo de nivel de stock (sin cambios)
    const getStatusText = (tipo) => {
        switch (tipo) {
            case "danger":
                return "Stock Crítico";
            case "warning":
                return "Stock Bajo";
            case "info":
                return "Stock Normal";
            case "success":
                return "Stock Alto";
            case "secondary":
                return "Stock Excesivo";
            default:
                return "Stock Normal";
        }
    };

    return (
        <div className="alertas-page">
            <AlertasStyles />
            <AlertasHeader title="Alertas por Stock" />

            {/* 🎨 Estilos mejorados para la sección de configuración */}
            <style>{`
                .configuracion-rangos {
                    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                    border-radius: 12px;
                    padding: 25px;
                    margin-bottom: 25px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
                    border: 1px solid #dee2e6;
                }

                .rangos-form {
                    background: white;
                    border-radius: 8px;
                    padding: 20px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                    border: 1px solid #e9ecef;
                }

                .rango-input-group {
                    display: flex;
                    align-items: center;
                    margin-bottom: 15px;
                    padding: 12px;
                    background: #f8f9fa;
                    border-radius: 6px;
                    border-left: 4px solid #007bff;
                    transition: all 0.2s ease;
                }

                .rango-input-group:hover {
                    background: #e9ecef;
                    border-left-color: #0056b3;
                }

                .rango-input-group label {
                    font-weight: 600;
                    color: #495057;
                    margin-right: 8px;
                    min-width: 150px;
                }

                .rango-input-group input {
                    width: 80px;
                    padding: 6px 10px;
                    border: 2px solid #ced4da;
                    border-radius: 4px;
                    text-align: center;
                    font-weight: 600;
                    transition: border-color 0.2s ease;
                }

                .rango-input-group input:focus {
                    outline: none;
                    border-color: #007bff;
                    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
                }

                .rango-input-group span {
                    color: #6c757d;
                    font-size: 14px;
                    margin-left: 5px;
                }

                .rangos-display {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 15px;
                    margin-top: 20px;
                }

                .rango-display-item {
                    background: white;
                    padding: 15px;
                    border-radius: 8px;
                    border-left: 4px solid #007bff;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                    transition: transform 0.2s ease;
                }

                .rango-display-item:hover {
                    transform: translateY(-2px);
                }

                .rango-display-item.rango-critico { border-left-color: #dc3545; }
                .rango-display-item.rango-bajo { border-left-color: #ffc107; }
                .rango-display-item.rango-normal { border-left-color: #17a2b8; }
                .rango-display-item.rango-alto { border-left-color: #28a745; }
                .rango-display-item.rango-excesivo { border-left-color: #6c757d; }

                .button-group {
                    display: flex;
                    gap: 10px;
                    flex-wrap: wrap;
                    align-items: center;
                }

                .button-group button {
                    padding: 10px 16px;
                    border: none;
                    border-radius: 6px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }

                .button-group button:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
                }

                .section-title {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #e9ecef;
                }

                .section-title h2 {
                    color: #495057;
                    font-size: 1.5rem;
                    margin: 0;
                    font-weight: 700;
                }

                .ayuda-botones {
                    background: #e3f2fd;
                    border: 1px solid #bbdefb;
                    border-radius: 8px;
                    padding: 15px;
                    margin-top: 20px;
                }

                .ayuda-botones strong {
                    color: #1976d2;
                }

                .indicador-cambios {
                    background: #fff3cd;
                    border: 1px solid #ffeaa7;
                    color: #856404;
                    padding: 10px 15px;
                    border-radius: 6px;
                    margin-bottom: 15px;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
            `}</style>

            {/* Sección de configuración de rangos */}
            <div className="configuracion-rangos">
                <div className="section-title">
                    <h2>Configuración de Rangos de Stock</h2>
                    {/* 🚀 INDICADOR: Mostrar si hay cambios sin guardar */}
                    {hayRangosSinGuardar && !isEditing && (
                        <div
                            style={{
                                color: "#ff9800",
                                fontSize: "14px",
                                fontStyle: "italic",
                                marginBottom: "10px",
                            }}
                        >
                            ⚠️ Hay cambios sin guardar como por defecto
                        </div>
                    )}

                    {!isEditing ? (
                        <div className="button-group">
                            <button
                                className="btn-primary"
                                onClick={() => setIsEditing(true)}
                            >
                                <i
                                    className="fas fa-edit"
                                    style={{ marginRight: "5px" }}
                                ></i>
                                Editar Rangos
                            </button>
                        </div>
                    ) : (
                        <div className="button-group">
                            {/* 🚀 BOTÓN NUEVO: Aplicar temporalmente */}
                            <button
                                className="btn-info"
                                onClick={aplicarRangosTemporalmente}
                                style={{
                                    backgroundColor: "#17a2b8",
                                    color: "white",
                                    marginRight: "10px",
                                }}
                            >
                                <i
                                    className="fas fa-play"
                                    style={{ marginRight: "5px" }}
                                ></i>
                                Aplicar Rangos
                            </button>

                            {/* 🚀 BOTÓN NUEVO: Definir como por defecto */}
                            <button
                                className="btn-success"
                                onClick={definirComoRangosPorDefecto}
                                style={{
                                    backgroundColor: "#28a745",
                                    color: "white",
                                    marginRight: "10px",
                                }}
                            >
                                <i
                                    className="fas fa-save"
                                    style={{ marginRight: "5px" }}
                                ></i>
                                Definir como Por Defecto
                            </button>

                            <button
                                className="btn-secondary"
                                onClick={cancelarEdicion}
                            >
                                <i
                                    className="fas fa-times"
                                    style={{ marginRight: "5px" }}
                                ></i>
                                Cancelar
                            </button>
                        </div>
                    )}
                </div>

                {isEditing ? (
                    <div className="rangos-form">
                        <div className="rango-input-group">
                            <label>Stock Crítico: 0 a </label>
                            <input
                                type="number"
                                min="1"
                                value={rangoConfig.criticoMax}
                                onChange={(e) =>
                                    setRangoConfig({
                                        ...rangoConfig,
                                        criticoMax:
                                            parseInt(e.target.value) || 0,
                                    })
                                }
                            />
                            <span> unidades</span>
                        </div>
                        <div className="rango-input-group">
                            <label>
                                Stock Bajo: {rangoConfig.criticoMax + 1} a{" "}
                            </label>
                            <input
                                type="number"
                                min={rangoConfig.criticoMax + 1}
                                value={rangoConfig.bajoMax}
                                onChange={(e) =>
                                    setRangoConfig({
                                        ...rangoConfig,
                                        bajoMax: parseInt(e.target.value) || 0,
                                    })
                                }
                            />
                            <span> unidades</span>
                        </div>
                        <div className="rango-input-group">
                            <label>
                                Stock Normal: {rangoConfig.bajoMax + 1} a{" "}
                            </label>
                            <input
                                type="number"
                                min={rangoConfig.bajoMax + 1}
                                value={rangoConfig.normalMax}
                                onChange={(e) =>
                                    setRangoConfig({
                                        ...rangoConfig,
                                        normalMax:
                                            parseInt(e.target.value) || 0,
                                    })
                                }
                            />
                            <span> unidades</span>
                        </div>
                        <div className="rango-input-group">
                            <label>
                                Stock Alto: {rangoConfig.normalMax + 1} a{" "}
                            </label>
                            <input
                                type="number"
                                min={rangoConfig.normalMax + 1}
                                value={rangoConfig.altoMax}
                                onChange={(e) =>
                                    setRangoConfig({
                                        ...rangoConfig,
                                        altoMax: parseInt(e.target.value) || 0,
                                    })
                                }
                            />
                            <span> unidades</span>
                        </div>
                        <div className="rango-input-group">
                            <label>
                                Stock Excesivo: más de {rangoConfig.altoMax}{" "}
                                unidades
                            </label>
                        </div>

                        {/* 🚀 NUEVO: Ayuda sobre los botones */}
                        <div
                            style={{
                                marginTop: "15px",
                                padding: "10px",
                                backgroundColor: "#e9ecef",
                                borderRadius: "5px",
                                fontSize: "13px",
                                color: "#495057",
                            }}
                        >
                            <strong>💡 Ayuda:</strong>
                            <br />• <strong>Aplicar Rangos:</strong> Aplica los
                            cambios solo para esta sesión
                            <br />• <strong>
                                Definir como Por Defecto:
                            </strong>{" "}
                            Guarda estos rangos como configuración permanente
                            para todas las sesiones futuras
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Resumen de productos por rango */}
            <div className="resumen-alertas">
                <div className="resumen-card total">
                    <div className="icon">
                        <FaBoxes />
                    </div>
                    <div className="info">
                        <h3>
                            {totales.criticos +
                                totales.bajos +
                                totales.normales +
                                totales.altos +
                                totales.excesivos}
                        </h3>
                        <p>Total de Productos</p>
                    </div>
                </div>
                <div
                    className={`resumen-card expirados ${
                        totales.criticos > 0 ? "active" : ""
                    }`}
                >
                    <div className="icon">
                        <FaBatteryEmpty style={{ color: "#e53935" }} />
                    </div>
                    <div className="info">
                        <h3>{totales.criticos}</h3>
                        <p>{rangos.STOCK_CRITICO.nombre}</p>
                        <small
                            style={{
                                fontSize: "11px",
                                color: "#6c757d",
                                fontStyle: "italic",
                            }}
                        >
                            ({rangos.STOCK_CRITICO.min}-
                            {rangos.STOCK_CRITICO.max} unidades)
                        </small>
                    </div>
                </div>
                <div
                    className={`resumen-card proximos ${
                        totales.bajos > 0 ? "active" : ""
                    }`}
                >
                    <div className="icon">
                        <FaBatteryQuarter style={{ color: "#ff9800" }} />
                    </div>
                    <div className="info">
                        <h3>{totales.bajos}</h3>
                        <p>{rangos.STOCK_BAJO.nombre}</p>
                        <small
                            style={{
                                fontSize: "11px",
                                color: "#6c757d",
                                fontStyle: "italic",
                            }}
                        >
                            ({rangos.STOCK_BAJO.min}-{rangos.STOCK_BAJO.max}{" "}
                            unidades)
                        </small>
                    </div>
                </div>
                <div
                    className={`resumen-card seis-meses ${
                        totales.normales > 0 ? "active" : ""
                    }`}
                >
                    <div className="icon">
                        <FaBatteryHalf style={{ color: "#2196f3" }} />
                    </div>
                    <div className="info">
                        <h3>{totales.normales}</h3>
                        <p>{rangos.STOCK_NORMAL.nombre}</p>
                        <small
                            style={{
                                fontSize: "11px",
                                color: "#6c757d",
                                fontStyle: "italic",
                            }}
                        >
                            ({rangos.STOCK_NORMAL.min}-{rangos.STOCK_NORMAL.max}{" "}
                            unidades)
                        </small>
                    </div>
                </div>
                <div
                    className={`resumen-card un-anio ${
                        totales.altos > 0 ? "active" : ""
                    }`}
                >
                    <div className="icon">
                        <FaBatteryThreeQuarters style={{ color: "#4caf50" }} />
                    </div>
                    <div className="info">
                        <h3>{totales.altos}</h3>
                        <p>{rangos.STOCK_ALTO.nombre}</p>
                        <small
                            style={{
                                fontSize: "11px",
                                color: "#6c757d",
                                fontStyle: "italic",
                            }}
                        >
                            ({rangos.STOCK_ALTO.min}-{rangos.STOCK_ALTO.max}{" "}
                            unidades)
                        </small>
                    </div>
                </div>
                <div
                    className={`resumen-card pre-anio ${
                        totales.excesivos > 0 ? "active" : ""
                    }`}
                >
                    <div className="icon">
                        <FaBatteryFull style={{ color: "#757575" }} />
                    </div>
                    <div className="info">
                        <h3>{totales.excesivos}</h3>
                        <p>{rangos.STOCK_EXCESIVO.nombre}</p>
                        <small
                            style={{
                                fontSize: "11px",
                                color: "#6c757d",
                                fontStyle: "italic",
                            }}
                        >
                            (más de {rangos.STOCK_ALTO.max} unidades)
                        </small>
                    </div>
                </div>
            </div>

            {/* Selector de rangos de stock */}
            <div className="range-selector-container">
                <div className="range-selector-title">
                    Seleccione un nivel de stock para visualizar:
                </div>
                <div className="button-group">
                    <button
                        className={`toggle-button ${
                            rangoSeleccionado === "STOCK_CRITICO"
                                ? "active"
                                : ""
                        }`}
                        onClick={() => handleRangoChange("STOCK_CRITICO")}
                        disabled={isLoadingProductos || totales.criticos === 0}
                    >
                        <FaBatteryEmpty style={{ marginRight: "5px" }} />
                        {rangos.STOCK_CRITICO.nombre} ({totales.criticos})
                    </button>
                    <button
                        className={`toggle-button ${
                            rangoSeleccionado === "STOCK_BAJO" ? "active" : ""
                        }`}
                        onClick={() => handleRangoChange("STOCK_BAJO")}
                        disabled={isLoadingProductos || totales.bajos === 0}
                    >
                        <FaBatteryQuarter style={{ marginRight: "5px" }} />
                        {rangos.STOCK_BAJO.nombre} ({totales.bajos})
                    </button>
                    <button
                        className={`toggle-button ${
                            rangoSeleccionado === "STOCK_NORMAL" ? "active" : ""
                        }`}
                        onClick={() => handleRangoChange("STOCK_NORMAL")}
                        disabled={isLoadingProductos || totales.normales === 0}
                    >
                        <FaBatteryHalf style={{ marginRight: "5px" }} />
                        {rangos.STOCK_NORMAL.nombre} ({totales.normales})
                    </button>
                    <button
                        className={`toggle-button ${
                            rangoSeleccionado === "STOCK_ALTO" ? "active" : ""
                        }`}
                        onClick={() => handleRangoChange("STOCK_ALTO")}
                        disabled={isLoadingProductos || totales.altos === 0}
                    >
                        <FaBatteryThreeQuarters
                            style={{ marginRight: "5px" }}
                        />
                        {rangos.STOCK_ALTO.nombre} ({totales.altos})
                    </button>
                    <button
                        className={`toggle-button ${
                            rangoSeleccionado === "STOCK_EXCESIVO"
                                ? "active"
                                : ""
                        }`}
                        onClick={() => handleRangoChange("STOCK_EXCESIVO")}
                        disabled={isLoadingProductos || totales.excesivos === 0}
                    >
                        <FaBatteryFull style={{ marginRight: "5px" }} />
                        {rangos.STOCK_EXCESIVO.nombre} ({totales.excesivos})
                    </button>
                    <button
                        className="refresh-button"
                        onClick={cargarProductos}
                        disabled={isLoadingProductos}
                    >
                        {isLoadingProductos ? (
                            <FaSpinner
                                className="fa-spin"
                                style={{ marginRight: "5px" }}
                            />
                        ) : (
                            <FaSync style={{ marginRight: "5px" }} />
                        )}
                        {isLoadingProductos
                            ? "Cargando..."
                            : "Actualizar Stock"}
                    </button>
                </div>
            </div>

            {/* Sección de productos por nivel de stock */}
            <div className="lotes-section">
                <div className="section-title">
                    <h2>Productos por Nivel de Stock</h2>
                </div>

                {isLoadingProductos ? (
                    <div className="loading-message">Cargando productos...</div>
                ) : error ? (
                    <div className="error-message">{error}</div>
                ) : (
                    <>
                        {hayProductosParaMostrar() ? (
                            <table className="alertas-table">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th>SKU</th>
                                        <th>Stock Actual</th>
                                        <th>Ubicación</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getProductosPorRango().productos.map(
                                        (producto) => (
                                            <tr
                                                key={producto.id}
                                                style={{
                                                    backgroundColor:
                                                        getStatusColor(
                                                            getProductosPorRango()
                                                                .tipo
                                                        ),
                                                }}
                                            >
                                                <td
                                                    style={{
                                                        minWidth: "150px",
                                                    }}
                                                >
                                                    {producto.product_name}
                                                </td>
                                                <td>{producto.batch_number}</td>
                                                <td
                                                    style={{
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    {producto.quantity}
                                                </td>
                                                <td>
                                                    {producto.location_name}
                                                </td>
                                                <td>
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems:
                                                                "center",
                                                            fontSize: "13px",
                                                        }}
                                                    >
                                                        {getStatusIcon(
                                                            getProductosPorRango()
                                                                .tipo
                                                        )}
                                                        {getStatusText(
                                                            getProductosPorRango()
                                                                .tipo
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            <div className="no-data-message">
                                No hay productos en el rango de stock
                                seleccionado.
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AlertasStockPage;
