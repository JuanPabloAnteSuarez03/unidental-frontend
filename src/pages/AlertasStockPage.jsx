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
import ConfigurarUmbralStockModal from "../components/Alertas/ConfigurarUmbralStockModal";
import ConfigurarRangosModal from "../components/Alertas/ConfigurarRangosModal";

// URL base para las peticiones a la API
const API_URL = API_CONFIG.BASE_URL;

// Claves para localStorage
const RANGOS_STORAGE_KEY = "alertas_stock_rangos";
const CACHE_STORAGE_KEY = "alertas_stock_cache_data";
const CACHE_EXPIRY_TIME = 12 * 60 * 60 * 1000; // 12 horas

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

// 🚀 NUEVA FUNCIÓN: Cargar cache de stock desde localStorage
const cargarCacheStockDesdeStorage = () => {
    try {
        const cacheGuardado = localStorage.getItem(CACHE_STORAGE_KEY);
        if (cacheGuardado) {
            const cache = JSON.parse(cacheGuardado);

            // Verificar si el cache no ha expirado
            const ahora = Date.now();
            const tiempoTranscurrido = ahora - (cache.lastFetch || 0);

            if (
                tiempoTranscurrido < CACHE_EXPIRY_TIME &&
                cache.productosCompletos &&
                cache.productosCompletos.length > 0
            ) {
                console.log("💾 Cache de stock cargado desde localStorage:", {
                    productos: cache.productosCompletos.length,
                    ultimaActualizacion: new Date(
                        cache.lastFetch
                    ).toLocaleString("es-ES"),
                });
                return {
                    productosCompletos: cache.productosCompletos || [],
                    isLoaded: true,
                    lastFetch: cache.lastFetch,
                };
            } else {
                console.log("⏰ Cache de stock expirado o vacío, se eliminará");
                localStorage.removeItem(CACHE_STORAGE_KEY);
            }
        }
    } catch (error) {
        console.error(
            "❌ Error al cargar cache de stock desde localStorage:",
            error
        );
        localStorage.removeItem(CACHE_STORAGE_KEY);
    }

    return {
        productosCompletos: [],
        isLoaded: false,
        lastFetch: null,
    };
};

// 🚀 NUEVA FUNCIÓN: Guardar cache de stock en localStorage
const guardarCacheStockEnStorage = (nuevoCache) => {
    try {
        const cacheParaGuardar = {
            productosCompletos: nuevoCache.productosCompletos,
            lastFetch: nuevoCache.lastFetch,
        };
        localStorage.setItem(
            CACHE_STORAGE_KEY,
            JSON.stringify(cacheParaGuardar)
        );
        console.log("💾 Cache de stock guardado en localStorage:", {
            productos: nuevoCache.productosCompletos.length,
            timestamp: new Date(nuevoCache.lastFetch).toLocaleString("es-ES"),
        });
    } catch (error) {
        console.error(
            "❌ Error al guardar cache de stock en localStorage:",
            error
        );
    }
};

// 🚀 NUEVA FUNCIÓN: Limpiar cache de stock del localStorage
const limpiarCacheStockStorage = () => {
    try {
        localStorage.removeItem(CACHE_STORAGE_KEY);
        console.log("🗑️ Cache de stock eliminado del localStorage");
    } catch (error) {
        console.error("❌ Error al limpiar cache de stock:", error);
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

    // 🎨 NUEVO ESTADO: Para mostrar si los rangos actuales son diferentes a los guardados
    const [hayRangosSinGuardar, setHayRangosSinGuardar] = useState(false);

    // Estado para almacenar todos los productos (sin filtrar)
    const [allProductos, setAllProductos] = useState([]);

    // 🚀 NUEVO: Estado para cache persistente de stock
    const [cacheData, setCacheData] = useState(() => {
        // Intentar cargar cache desde localStorage al inicializar
        return cargarCacheStockDesdeStorage();
    });

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

    // 🚀 NUEVA FUNCIÓN: Cargar todos los datos de stock con cache persistente
    const cargarTodosLosDatosStock = async (forceRefresh = false) => {
        if (!authToken) return;

        // Si ya tenemos datos en cache y no es un refresh forzado, no recargar
        if (
            !forceRefresh &&
            cacheData.isLoaded &&
            cacheData.productosCompletos.length > 0
        ) {
            console.log(
                "💾 Usando datos de stock desde cache persistente, no es necesario recargar"
            );
            // Procesar datos desde cache
            procesarDatosDesdeCache();
            return;
        }

        setIsLoadingProductos(true);
        setError(null);
        console.log(
            `🔄 ${
                forceRefresh
                    ? "Refrescando datos de stock forzosamente"
                    : "Cargando datos de stock por primera vez"
            }`
        );

        try {
            // Cargar productos y stock desde API
            const productosCompletos = await cargarProductosDesdeAPI();

            // Guardar en cache
            const nuevoCache = {
                productosCompletos: productosCompletos,
                isLoaded: true,
                lastFetch: Date.now(),
            };

            setCacheData(nuevoCache);
            guardarCacheStockEnStorage(nuevoCache);

            // Procesar datos
            procesarDatosStock(productosCompletos);

            console.log(
                "💾 Datos de stock guardados en cache de memoria y localStorage exitosamente"
            );
        } catch (error) {
            console.error("❌ Error al cargar datos de stock:", error);
            setError(
                "Error al cargar los datos de stock. Por favor, intente nuevamente."
            );
            setAllProductos([]);
        } finally {
            setIsLoadingProductos(false);
        }
    };

    // 🚀 NUEVA FUNCIÓN: Procesar datos desde cache
    const procesarDatosDesdeCache = () => {
        if (cacheData.productosCompletos.length > 0) {
            procesarDatosStock(cacheData.productosCompletos);
        }
    };

    // 🚀 NUEVA FUNCIÓN: Cargar productos desde API
    const cargarProductosDesdeAPI = async () => {
        console.log("⚡ Iniciando carga optimizada de productos desde API...");

        // 🚀 CAMBIO CRÍTICO: Primero obtener todos los productos con información completa
        const productosResponse = await axios.get(
            `${API_URL}/catalogs/products/all/`,
            {
                headers: {
                    Authorization: `Token ${authToken}`,
                },
            }
        );

        let productosCompletos = [];
        if (Array.isArray(productosResponse.data)) {
            productosCompletos = productosResponse.data;
        } else if (
            productosResponse.data &&
            Array.isArray(productosResponse.data.results)
        ) {
            productosCompletos = productosResponse.data.results;
        }

        console.log(
            `📦 Productos completos obtenidos: ${productosCompletos.length}`
        );

        // 🚀 CAMBIO CRÍTICO: Luego obtener el stock
        const stockResponse = await axios.get(
            `${API_URL}${API_CONFIG.ENDPOINTS.STOCK_ALL}`,
            {
                headers: {
                    Authorization: `Token ${authToken}`,
                },
            }
        );

        const responseData = stockResponse.data;
        let allData = [];

        if (Array.isArray(responseData)) {
            allData = responseData;
        } else if (responseData && Array.isArray(responseData.results)) {
            allData = responseData.results;
        } else {
            throw new Error("Formato de datos inesperado del servidor");
        }

        console.log(
            `⚡ Total de registros de stock cargados: ${allData.length}`
        );

        // 🚀 NUEVA LÓGICA: Combinar información de productos con stock
        const productosConInfoCompleta = allData.map((stockItem) => {
            const productoCompleto = productosCompletos.find(
                (p) => p.id === stockItem.product
            );
            return {
                ...stockItem,
                min_stock_threshold: productoCompleto
                    ? productoCompleto.min_stock_threshold
                    : null,
                product_name:
                    stockItem.product_name ||
                    (productoCompleto
                        ? productoCompleto.name
                        : "Producto sin nombre"),
                sku:
                    stockItem.product_sku ||
                    (productoCompleto ? productoCompleto.sku : "N/A"),
            };
        });

        console.log(
            `📊 Productos con información completa: ${productosConInfoCompleta.length}`
        );

        return productosConInfoCompleta;
    };

    // 🚀 NUEVA FUNCIÓN: Procesar datos de stock (desde API o cache)
    const procesarDatosStock = (productosConInfoCompleta) => {
        // Almacenar todos los productos
        setAllProductos(productosConInfoCompleta);

        // 🚀 OPTIMIZACIÓN: Calcular totales y filtrar usando rangos actuales
        if (productosConInfoCompleta.length > 0) {
            calcularTotalesPorRango(productosConInfoCompleta, rangosCalculados);
            filtrarProductosDelRango(
                rangoSeleccionado,
                productosConInfoCompleta,
                rangosCalculados
            );
        }
    };

    // 🚀 NUEVA FUNCIÓN: Refrescar cache manualmente
    const refrescarCacheStock = () => {
        console.log("🔄 Refrescando cache de stock manualmente...");
        limpiarCacheStockStorage(); // Limpiar cache del localStorage
        cargarTodosLosDatosStock(true);
    };

    // 🚀 NUEVA FUNCIÓN: Obtener información del cache de stock
    const obtenerInfoCacheStock = () => {
        if (!cacheData.isLoaded) {
            return {
                estado: "No cargado",
                cantidad: 0,
                ultimaActualizacion: "Nunca",
                tiempoRestante: "N/A",
                expiraSoon: false,
            };
        }

        const ahora = Date.now();
        const tiempoTranscurrido = ahora - (cacheData.lastFetch || 0);
        const tiempoRestante = CACHE_EXPIRY_TIME - tiempoTranscurrido;
        const minutosRestantes = Math.max(
            0,
            Math.floor(tiempoRestante / (1000 * 60))
        );
        const expiraSoon = minutosRestantes < 5; // Alerta si faltan menos de 5 minutos

        return {
            estado: "Cargado (Persistente)",
            cantidad: cacheData.productosCompletos.length,
            ultimaActualizacion: cacheData.lastFetch
                ? new Date(cacheData.lastFetch).toLocaleString("es-ES")
                : "Desconocida",
            tiempoRestante: `${minutosRestantes} min`,
            expiraSoon: expiraSoon,
        };
    };

    // Efecto para cargar datos al montar el componente
    useEffect(() => {
        if (authToken) {
            // Si no hay datos en cache, cargarlos
            if (
                !cacheData.isLoaded ||
                cacheData.productosCompletos.length === 0
            ) {
                console.log(
                    "🚀 No hay datos de stock en cache, cargando desde API..."
                );
                cargarTodosLosDatosStock();
            } else {
                console.log(
                    "✅ Datos de stock encontrados en cache persistente, no es necesario cargar desde API"
                );
                procesarDatosDesdeCache();
            }
        }
    }, [authToken]);

    // 🚀 OPTIMIZACIÓN: Función memoizada para calcular totales (misma lógica, mejor rendimiento)
    const calcularTotalesPorRango = useCallback(
        (productos, rangosActuales = rangos) => {
            console.log(
                `📊 Calculando totales por rango para ${productos.length} registros de stock`
            );

            const startTime = performance.now();

            let criticos = 0,
                bajos = 0,
                normales = 0,
                altos = 0,
                excesivos = 0;

            // 🚀 NUEVA LÓGICA: Agrupar productos por nombre y sumar stocks
            const productosAgrupados = {};

            productos.forEach((producto) => {
                const nombreProducto =
                    producto.product_name ||
                    producto.product_display_name ||
                    "Producto sin nombre";
                const cantidad = parseInt(producto.quantity) || 0;
                const ubicacion =
                    producto.location_name ||
                    producto.location_display_name ||
                    "Sin ubicación";
                const sku = producto.sku || producto.product_sku || "N/A";

                if (productosAgrupados[nombreProducto]) {
                    // Si ya existe, sumar la cantidad y combinar ubicaciones/SKUs si son diferentes
                    productosAgrupados[nombreProducto].quantity += cantidad;

                    // Agregar SKUs únicos (para mostrar múltiples lotes)
                    if (
                        !productosAgrupados[
                            nombreProducto
                        ].batch_number.includes(sku)
                    ) {
                        productosAgrupados[
                            nombreProducto
                        ].batch_number += `, ${sku}`;
                    }

                    // Agregar stock por ubicación específica
                    if (
                        productosAgrupados[nombreProducto].stockPorUbicacion[
                            ubicacion
                        ]
                    ) {
                        productosAgrupados[nombreProducto].stockPorUbicacion[
                            ubicacion
                        ] += cantidad;
                    } else {
                        productosAgrupados[nombreProducto].stockPorUbicacion[
                            ubicacion
                        ] = cantidad;
                    }
                } else {
                    // Primera vez que vemos este producto
                    productosAgrupados[nombreProducto] = {
                        id: producto.id || producto.product_id,
                        product_name: nombreProducto,
                        batch_number: sku,
                        quantity: cantidad,
                        stockPorUbicacion: { [ubicacion]: cantidad },
                        min_stock_threshold: producto.min_stock_threshold,
                    };
                }
            });

            console.log(
                `📦 Productos únicos después de agrupar por lotes: ${
                    Object.keys(productosAgrupados).length
                }`
            );

            // 🚀 NUEVA LÓGICA: Clasificar productos usando teoría de umbrales
            Object.values(productosAgrupados).forEach((producto) => {
                const stockTotal = producto.quantity;
                const umbralStock = producto.min_stock_threshold;

                // Si el producto tiene umbral configurado, usar lógica de umbrales
                if (
                    umbralStock !== undefined &&
                    umbralStock !== null &&
                    umbralStock > 0
                ) {
                    const stockEfectivo = stockTotal - umbralStock;

                    console.log(
                        `🎯 Producto con umbral: Stock ${stockTotal} - Umbral ${umbralStock} = Efectivo ${stockEfectivo}`
                    );

                    if (stockEfectivo < 0) {
                        // Stock Crítico: Por debajo del umbral
                        criticos++;
                    } else if (stockEfectivo <= 50) {
                        // Stock Bajo: Justo por encima del umbral
                        bajos++;
                    } else if (stockEfectivo <= 100) {
                        // Stock Normal: Bien por encima del umbral
                        normales++;
                    } else if (stockEfectivo <= 200) {
                        // Stock Alto: Muy por encima del umbral
                        altos++;
                    } else {
                        // Stock Excesivo: Extremadamente por encima del umbral
                        excesivos++;
                    }
                } else {
                    // Si no tiene umbral, usar rangos estándar
                    if (
                        stockTotal >= rangosActuales.STOCK_CRITICO.min &&
                        stockTotal <= rangosActuales.STOCK_CRITICO.max
                    ) {
                        criticos++;
                    } else if (
                        stockTotal >= rangosActuales.STOCK_BAJO.min &&
                        stockTotal <= rangosActuales.STOCK_BAJO.max
                    ) {
                        bajos++;
                    } else if (
                        stockTotal >= rangosActuales.STOCK_NORMAL.min &&
                        stockTotal <= rangosActuales.STOCK_NORMAL.max
                    ) {
                        normales++;
                    } else if (
                        stockTotal >= rangosActuales.STOCK_ALTO.min &&
                        stockTotal <= rangosActuales.STOCK_ALTO.max
                    ) {
                        altos++;
                    } else if (
                        stockTotal >= rangosActuales.STOCK_EXCESIVO.min
                    ) {
                        excesivos++;
                    }
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
    const aplicarRangosTemporalmente = (nuevosRangos = rangoConfig) => {
        // Validar que los rangos sean coherentes
        if (
            nuevosRangos.criticoMax >= 0 &&
            nuevosRangos.bajoMax > nuevosRangos.criticoMax &&
            nuevosRangos.normalMax > nuevosRangos.bajoMax &&
            nuevosRangos.altoMax > nuevosRangos.normalMax
        ) {
            setRangoConfig(nuevosRangos);
            setRangos({
                STOCK_CRITICO: {
                    nombre: "Stock Crítico",
                    min: 0,
                    max: nuevosRangos.criticoMax,
                    tipo: "danger",
                },
                STOCK_BAJO: {
                    nombre: "Stock Bajo",
                    min: nuevosRangos.criticoMax + 1,
                    max: nuevosRangos.bajoMax,
                    tipo: "warning",
                },
                STOCK_NORMAL: {
                    nombre: "Stock Normal",
                    min: nuevosRangos.bajoMax + 1,
                    max: nuevosRangos.normalMax,
                    tipo: "info",
                },
                STOCK_ALTO: {
                    nombre: "Stock Alto",
                    min: nuevosRangos.normalMax + 1,
                    max: nuevosRangos.altoMax,
                    tipo: "success",
                },
                STOCK_EXCESIVO: {
                    nombre: "Stock Excesivo",
                    min: nuevosRangos.altoMax + 1,
                    max: Infinity,
                    tipo: "secondary",
                },
            });
            setMostrarModalRangos(false);
            console.log("✅ Rangos aplicados temporalmente (solo esta sesión)");
        } else {
            alert(
                "Los rangos deben ser coherentes. Cada valor máximo debe ser mayor que el anterior."
            );
        }
    };

    // 🚀 NUEVA FUNCIÓN: Definir rangos como por defecto (persistente)
    const definirComoRangosPorDefecto = (nuevosRangos = rangoConfig) => {
        // Validar que los rangos sean coherentes
        if (
            nuevosRangos.criticoMax >= 0 &&
            nuevosRangos.bajoMax > nuevosRangos.criticoMax &&
            nuevosRangos.normalMax > nuevosRangos.bajoMax &&
            nuevosRangos.altoMax > nuevosRangos.normalMax
        ) {
            // Guardar en localStorage
            const guardadoExitoso = guardarRangosEnStorage(nuevosRangos);

            if (guardadoExitoso) {
                setRangoConfig(nuevosRangos);
                setRangos({
                    STOCK_CRITICO: {
                        nombre: "Stock Crítico",
                        min: 0,
                        max: nuevosRangos.criticoMax,
                        tipo: "danger",
                    },
                    STOCK_BAJO: {
                        nombre: "Stock Bajo",
                        min: nuevosRangos.criticoMax + 1,
                        max: nuevosRangos.bajoMax,
                        tipo: "warning",
                    },
                    STOCK_NORMAL: {
                        nombre: "Stock Normal",
                        min: nuevosRangos.bajoMax + 1,
                        max: nuevosRangos.normalMax,
                        tipo: "info",
                    },
                    STOCK_ALTO: {
                        nombre: "Stock Alto",
                        min: nuevosRangos.normalMax + 1,
                        max: nuevosRangos.altoMax,
                        tipo: "success",
                    },
                    STOCK_EXCESIVO: {
                        nombre: "Stock Excesivo",
                        min: nuevosRangos.altoMax + 1,
                        max: Infinity,
                        tipo: "secondary",
                    },
                });
                setMostrarModalRangos(false);
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

    // 🚀 OPTIMIZACIÓN: Función memoizada para filtrar productos (agrupados por lotes)
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

            // 🚀 NUEVA LÓGICA: Agrupar productos por nombre y sumar stocks
            const productosAgrupados = {};

            productos.forEach((producto) => {
                const nombreProducto =
                    producto.product_name ||
                    producto.product_display_name ||
                    "Producto sin nombre";
                const cantidad = parseInt(producto.quantity) || 0;
                const ubicacion =
                    producto.location_name ||
                    producto.location_display_name ||
                    "Sin ubicación";
                const sku = producto.sku || producto.product_sku || "N/A";

                if (productosAgrupados[nombreProducto]) {
                    // Si ya existe, sumar la cantidad y combinar ubicaciones/SKUs si son diferentes
                    productosAgrupados[nombreProducto].quantity += cantidad;

                    // Agregar SKUs únicos (para mostrar múltiples lotes)
                    if (
                        !productosAgrupados[
                            nombreProducto
                        ].batch_number.includes(sku)
                    ) {
                        productosAgrupados[
                            nombreProducto
                        ].batch_number += `, ${sku}`;
                    }

                    // Agregar stock por ubicación específica
                    if (
                        productosAgrupados[nombreProducto].stockPorUbicacion[
                            ubicacion
                        ]
                    ) {
                        productosAgrupados[nombreProducto].stockPorUbicacion[
                            ubicacion
                        ] += cantidad;
                    } else {
                        productosAgrupados[nombreProducto].stockPorUbicacion[
                            ubicacion
                        ] = cantidad;
                    }
                } else {
                    // Primera vez que vemos este producto
                    productosAgrupados[nombreProducto] = {
                        id: producto.id || producto.product_id,
                        product_name: nombreProducto,
                        batch_number: sku,
                        quantity: cantidad,
                        stockPorUbicacion: { [ubicacion]: cantidad },
                        min_stock_threshold: producto.min_stock_threshold,
                    };
                }
            });

            // 🚀 FILTRAR productos agrupados según el rango
            const productosFiltrados = Object.values(productosAgrupados)
                .filter((producto) => {
                    const stockTotal = producto.quantity;
                    const umbralStock = producto.min_stock_threshold;

                    // Si el producto tiene umbral configurado, usar lógica de umbrales
                    if (
                        umbralStock !== undefined &&
                        umbralStock !== null &&
                        umbralStock > 0
                    ) {
                        const stockEfectivo = stockTotal - umbralStock;

                        // Para productos con umbral, usar lógica específica por rango
                        if (rango === "STOCK_CRITICO") {
                            // Stock crítico: por debajo del umbral (stock efectivo < 0)
                            return stockEfectivo < 0;
                        } else if (rango === "STOCK_BAJO") {
                            // Stock bajo: justo por encima del umbral (0-50)
                            return stockEfectivo >= 0 && stockEfectivo <= 50;
                        } else if (rango === "STOCK_NORMAL") {
                            // Stock normal: bien por encima del umbral (51-100)
                            return stockEfectivo > 50 && stockEfectivo <= 100;
                        } else if (rango === "STOCK_ALTO") {
                            // Stock alto: muy por encima del umbral (101-200)
                            return stockEfectivo > 100 && stockEfectivo <= 200;
                        } else if (rango === "STOCK_EXCESIVO") {
                            // Stock excesivo: extremadamente por encima del umbral (>200)
                            return stockEfectivo > 200;
                        }
                    } else {
                        // Si no tiene umbral, usar rangos estándar
                        if (rangoConfigLocal.max === Infinity) {
                            // Para stock excesivo (sin límite superior)
                            return stockTotal >= rangoConfigLocal.min;
                        } else {
                            // Para rangos con límite superior definido
                            return (
                                stockTotal >= rangoConfigLocal.min &&
                                stockTotal <= rangoConfigLocal.max
                            );
                        }
                    }
                })
                .sort((a, b) => a.product_name.localeCompare(b.product_name)); // Ordenar alfabéticamente

            const endTime = performance.now();
            console.log(
                `✅ Encontrados ${
                    productosFiltrados.length
                } productos únicos para ${rangoConfigLocal.nombre} en ${(
                    endTime - startTime
                ).toFixed(2)}ms`
            );

            // Mostrar ejemplos de productos filtrados en la consola
            if (productosFiltrados.length > 0) {
                console.log("Ejemplos de productos agrupados:");
                productosFiltrados.slice(0, 3).forEach((p, i) => {
                    console.log(
                        `  ${i + 1}. ${p.product_name} - Stock Total: ${
                            p.quantity
                        }`
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

    const [mostrarModalUmbralStock, setMostrarModalUmbralStock] =
        useState(false);
    const [mostrarModalRangos, setMostrarModalRangos] = useState(false);

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

            {/* Resumen de productos por rango - Productos únicos (agrupados por lotes) */}
            <div className="resumen-alertas" style={{ marginBottom: "20px" }}>
                <div
                    className="stats-grid"
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "15px",
                        marginBottom: "20px",
                    }}
                >
                    <div
                        className="stat-card"
                        style={{
                            padding: "24px 20px",
                            backgroundColor: "#ffffff",
                            borderRadius: "16px",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                            textAlign: "center",
                            border: "1px solid #f0f0f0",
                            position: "relative",
                            overflow: "hidden",
                            transition: "all 0.3s ease",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                height: "4px",
                                background:
                                    "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
                            }}
                        />
                        <h3
                            style={{
                                margin: "0 0 8px 0",
                                fontSize: "32px",
                                fontWeight: "700",
                                color: "#2c3e50",
                                lineHeight: "1",
                            }}
                        >
                            {totales.criticos +
                                totales.bajos +
                                totales.normales +
                                totales.altos +
                                totales.excesivos}
                        </h3>
                        <p
                            style={{
                                margin: 0,
                                color: "#7f8c8d",
                                fontSize: "14px",
                                fontWeight: "500",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                            }}
                        >
                            Total de Productos
                        </p>
                    </div>

                    <div
                        className="stat-card"
                        style={{
                            padding: "24px 20px",
                            backgroundColor: "#ffffff",
                            borderRadius: "16px",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                            textAlign: "center",
                            border: "1px solid #ffebee",
                            position: "relative",
                            overflow: "hidden",
                            transition: "all 0.3s ease",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                height: "4px",
                                background:
                                    "linear-gradient(90deg, #ff6b6b 0%, #ee5a52 100%)",
                            }}
                        />
                        <h3
                            style={{
                                margin: "0 0 8px 0",
                                fontSize: "32px",
                                fontWeight: "700",
                                color: "#d32f2f",
                                lineHeight: "1",
                            }}
                        >
                            {totales.criticos}
                        </h3>
                        <p
                            style={{
                                margin: 0,
                                color: "#d32f2f",
                                fontSize: "14px",
                                fontWeight: "500",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                            }}
                        >
                            {rangos.STOCK_CRITICO.nombre}
                        </p>
                        <small
                            style={{
                                fontSize: "12px",
                                color: "#6c757d",
                                fontStyle: "italic",
                                display: "block",
                                marginTop: "4px",
                            }}
                        >
                            ({rangos.STOCK_CRITICO.min}-
                            {rangos.STOCK_CRITICO.max} unidades)
                        </small>
                    </div>

                    <div
                        className="stat-card"
                        style={{
                            padding: "24px 20px",
                            backgroundColor: "#ffffff",
                            borderRadius: "16px",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                            textAlign: "center",
                            border: "1px solid #fff3e0",
                            position: "relative",
                            overflow: "hidden",
                            transition: "all 0.3s ease",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                height: "4px",
                                background:
                                    "linear-gradient(90deg, #ffa726 0%, #ff9800 100%)",
                            }}
                        />
                        <h3
                            style={{
                                margin: "0 0 8px 0",
                                fontSize: "32px",
                                fontWeight: "700",
                                color: "#f57c00",
                                lineHeight: "1",
                            }}
                        >
                            {totales.bajos}
                        </h3>
                        <p
                            style={{
                                margin: 0,
                                color: "#f57c00",
                                fontSize: "14px",
                                fontWeight: "500",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                            }}
                        >
                            {rangos.STOCK_BAJO.nombre}
                        </p>
                        <small
                            style={{
                                fontSize: "12px",
                                color: "#6c757d",
                                fontStyle: "italic",
                                display: "block",
                                marginTop: "4px",
                            }}
                        >
                            ({rangos.STOCK_BAJO.min}-{rangos.STOCK_BAJO.max}{" "}
                            unidades)
                        </small>
                    </div>

                    <div
                        className="stat-card"
                        style={{
                            padding: "24px 20px",
                            backgroundColor: "#ffffff",
                            borderRadius: "16px",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                            textAlign: "center",
                            border: "1px solid #e3f2fd",
                            position: "relative",
                            overflow: "hidden",
                            transition: "all 0.3s ease",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                height: "4px",
                                background:
                                    "linear-gradient(90deg, #42a5f5 0%, #1976d2 100%)",
                            }}
                        />
                        <h3
                            style={{
                                margin: "0 0 8px 0",
                                fontSize: "32px",
                                fontWeight: "700",
                                color: "#1976d2",
                                lineHeight: "1",
                            }}
                        >
                            {totales.normales}
                        </h3>
                        <p
                            style={{
                                margin: 0,
                                color: "#1976d2",
                                fontSize: "14px",
                                fontWeight: "500",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                            }}
                        >
                            {rangos.STOCK_NORMAL.nombre}
                        </p>
                        <small
                            style={{
                                fontSize: "12px",
                                color: "#6c757d",
                                fontStyle: "italic",
                                display: "block",
                                marginTop: "4px",
                            }}
                        >
                            ({rangos.STOCK_NORMAL.min}-{rangos.STOCK_NORMAL.max}{" "}
                            unidades)
                        </small>
                    </div>

                    <div
                        className="stat-card"
                        style={{
                            padding: "24px 20px",
                            backgroundColor: "#ffffff",
                            borderRadius: "16px",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                            textAlign: "center",
                            border: "1px solid #e8f5e9",
                            position: "relative",
                            overflow: "hidden",
                            transition: "all 0.3s ease",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                height: "4px",
                                background:
                                    "linear-gradient(90deg, #66bb6a 0%, #388e3c 100%)",
                            }}
                        />
                        <h3
                            style={{
                                margin: "0 0 8px 0",
                                fontSize: "32px",
                                fontWeight: "700",
                                color: "#388e3c",
                                lineHeight: "1",
                            }}
                        >
                            {totales.altos}
                        </h3>
                        <p
                            style={{
                                margin: 0,
                                color: "#388e3c",
                                fontSize: "14px",
                                fontWeight: "500",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                            }}
                        >
                            {rangos.STOCK_ALTO.nombre}
                        </p>
                        <small
                            style={{
                                fontSize: "12px",
                                color: "#6c757d",
                                fontStyle: "italic",
                                display: "block",
                                marginTop: "4px",
                            }}
                        >
                            ({rangos.STOCK_ALTO.min}-{rangos.STOCK_ALTO.max}{" "}
                            unidades)
                        </small>
                    </div>

                    <div
                        className="stat-card"
                        style={{
                            padding: "24px 20px",
                            backgroundColor: "#ffffff",
                            borderRadius: "16px",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                            textAlign: "center",
                            border: "1px solid #f5f5f5",
                            position: "relative",
                            overflow: "hidden",
                            transition: "all 0.3s ease",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                height: "4px",
                                background:
                                    "linear-gradient(90deg, #9e9e9e 0%, #757575 100%)",
                            }}
                        />
                        <h3
                            style={{
                                margin: "0 0 8px 0",
                                fontSize: "32px",
                                fontWeight: "700",
                                color: "#666",
                                lineHeight: "1",
                            }}
                        >
                            {totales.excesivos}
                        </h3>
                        <p
                            style={{
                                margin: 0,
                                color: "#666",
                                fontSize: "14px",
                                fontWeight: "500",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                            }}
                        >
                            {rangos.STOCK_EXCESIVO.nombre}
                        </p>
                        <small
                            style={{
                                fontSize: "12px",
                                color: "#6c757d",
                                fontStyle: "italic",
                                display: "block",
                                marginTop: "4px",
                            }}
                        >
                            (más de {rangos.STOCK_ALTO.max} unidades)
                        </small>
                    </div>
                </div>
            </div>

            {/* Navegación por rangos de stock */}
            <div className="rangos-navegacion" style={{ marginBottom: "30px" }}>
                <div
                    style={{
                        display: "flex",
                        gap: "12px",
                        marginBottom: "20px",
                        flexWrap: "wrap",
                        padding: "20px",
                        backgroundColor: "#ffffff",
                        borderRadius: "20px",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                        border: "1px solid #f0f0f0",
                    }}
                >
                    <button
                        onClick={() => handleRangoChange("STOCK_CRITICO")}
                        disabled={isLoadingProductos || totales.criticos === 0}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "16px 24px",
                            border: "none",
                            backgroundColor:
                                rangoSeleccionado === "STOCK_CRITICO"
                                    ? "#ffffff"
                                    : "#f8f9fa",
                            color:
                                rangoSeleccionado === "STOCK_CRITICO"
                                    ? "#2c3e50"
                                    : "#6c757d",
                            borderRadius: "16px",
                            cursor:
                                isLoadingProductos || totales.criticos === 0
                                    ? "not-allowed"
                                    : "pointer",
                            fontSize: "15px",
                            fontWeight:
                                rangoSeleccionado === "STOCK_CRITICO"
                                    ? "700"
                                    : "500",
                            transition: "all 0.3s ease",
                            boxShadow:
                                rangoSeleccionado === "STOCK_CRITICO"
                                    ? "0 8px 32px rgba(0,0,0,0.12)"
                                    : "0 4px 16px rgba(0,0,0,0.06)",
                            transform:
                                rangoSeleccionado === "STOCK_CRITICO"
                                    ? "translateY(-4px)"
                                    : "translateY(0)",
                            opacity:
                                isLoadingProductos || totales.criticos === 0
                                    ? 0.7
                                    : 1,
                            position: "relative",
                            overflow: "hidden",
                            minWidth: "160px",
                            justifyContent: "center",
                        }}
                        onMouseEnter={(e) => {
                            if (
                                rangoSeleccionado !== "STOCK_CRITICO" &&
                                !isLoadingProductos &&
                                totales.criticos > 0
                            ) {
                                e.target.style.backgroundColor = "#ffffff";
                                e.target.style.color = "#2c3e50";
                                e.target.style.transform = "translateY(-2px)";
                                e.target.style.boxShadow =
                                    "0 6px 24px rgba(0,0,0,0.1)";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (
                                rangoSeleccionado !== "STOCK_CRITICO" &&
                                !isLoadingProductos &&
                                totales.criticos > 0
                            ) {
                                e.target.style.backgroundColor = "#f8f9fa";
                                e.target.style.color = "#6c757d";
                                e.target.style.transform = "translateY(0)";
                                e.target.style.boxShadow =
                                    "0 4px 16px rgba(0,0,0,0.06)";
                            }
                        }}
                    >
                        {rangoSeleccionado === "STOCK_CRITICO" && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: "4px",
                                    background:
                                        "linear-gradient(90deg, #ff6b6b 0%, #ee5a52 100%)",
                                }}
                            />
                        )}
                        <FaBatteryEmpty style={{ fontSize: "16px" }} />
                        <div>
                            <div
                                style={{ fontWeight: "600", fontSize: "14px" }}
                            >
                                {rangos.STOCK_CRITICO.nombre}
                            </div>
                            <div
                                style={{
                                    fontSize: "12px",
                                    opacity: 0.8,
                                    fontWeight: "500",
                                }}
                            >
                                {totales.criticos} productos
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => handleRangoChange("STOCK_BAJO")}
                        disabled={isLoadingProductos || totales.bajos === 0}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "16px 24px",
                            border: "none",
                            backgroundColor:
                                rangoSeleccionado === "STOCK_BAJO"
                                    ? "#ffffff"
                                    : "#f8f9fa",
                            color:
                                rangoSeleccionado === "STOCK_BAJO"
                                    ? "#2c3e50"
                                    : "#6c757d",
                            borderRadius: "16px",
                            cursor:
                                isLoadingProductos || totales.bajos === 0
                                    ? "not-allowed"
                                    : "pointer",
                            fontSize: "15px",
                            fontWeight:
                                rangoSeleccionado === "STOCK_BAJO"
                                    ? "700"
                                    : "500",
                            transition: "all 0.3s ease",
                            boxShadow:
                                rangoSeleccionado === "STOCK_BAJO"
                                    ? "0 8px 32px rgba(0,0,0,0.12)"
                                    : "0 4px 16px rgba(0,0,0,0.06)",
                            transform:
                                rangoSeleccionado === "STOCK_BAJO"
                                    ? "translateY(-4px)"
                                    : "translateY(0)",
                            opacity:
                                isLoadingProductos || totales.bajos === 0
                                    ? 0.7
                                    : 1,
                            position: "relative",
                            overflow: "hidden",
                            minWidth: "160px",
                            justifyContent: "center",
                        }}
                        onMouseEnter={(e) => {
                            if (
                                rangoSeleccionado !== "STOCK_BAJO" &&
                                !isLoadingProductos &&
                                totales.bajos > 0
                            ) {
                                e.target.style.backgroundColor = "#ffffff";
                                e.target.style.color = "#2c3e50";
                                e.target.style.transform = "translateY(-2px)";
                                e.target.style.boxShadow =
                                    "0 6px 24px rgba(0,0,0,0.1)";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (
                                rangoSeleccionado !== "STOCK_BAJO" &&
                                !isLoadingProductos &&
                                totales.bajos > 0
                            ) {
                                e.target.style.backgroundColor = "#f8f9fa";
                                e.target.style.color = "#6c757d";
                                e.target.style.transform = "translateY(0)";
                                e.target.style.boxShadow =
                                    "0 4px 16px rgba(0,0,0,0.06)";
                            }
                        }}
                    >
                        {rangoSeleccionado === "STOCK_BAJO" && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: "4px",
                                    background:
                                        "linear-gradient(90deg, #ffa726 0%, #ff9800 100%)",
                                }}
                            />
                        )}
                        <FaBatteryQuarter style={{ fontSize: "16px" }} />
                        <div>
                            <div
                                style={{ fontWeight: "600", fontSize: "14px" }}
                            >
                                {rangos.STOCK_BAJO.nombre}
                            </div>
                            <div
                                style={{
                                    fontSize: "12px",
                                    opacity: 0.8,
                                    fontWeight: "500",
                                }}
                            >
                                {totales.bajos} productos
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => handleRangoChange("STOCK_NORMAL")}
                        disabled={isLoadingProductos || totales.normales === 0}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "16px 24px",
                            border: "none",
                            backgroundColor:
                                rangoSeleccionado === "STOCK_NORMAL"
                                    ? "#ffffff"
                                    : "#f8f9fa",
                            color:
                                rangoSeleccionado === "STOCK_NORMAL"
                                    ? "#2c3e50"
                                    : "#6c757d",
                            borderRadius: "16px",
                            cursor:
                                isLoadingProductos || totales.normales === 0
                                    ? "not-allowed"
                                    : "pointer",
                            fontSize: "15px",
                            fontWeight:
                                rangoSeleccionado === "STOCK_NORMAL"
                                    ? "700"
                                    : "500",
                            transition: "all 0.3s ease",
                            boxShadow:
                                rangoSeleccionado === "STOCK_NORMAL"
                                    ? "0 8px 32px rgba(0,0,0,0.12)"
                                    : "0 4px 16px rgba(0,0,0,0.06)",
                            transform:
                                rangoSeleccionado === "STOCK_NORMAL"
                                    ? "translateY(-4px)"
                                    : "translateY(0)",
                            opacity:
                                isLoadingProductos || totales.normales === 0
                                    ? 0.7
                                    : 1,
                            position: "relative",
                            overflow: "hidden",
                            minWidth: "160px",
                            justifyContent: "center",
                        }}
                        onMouseEnter={(e) => {
                            if (
                                rangoSeleccionado !== "STOCK_NORMAL" &&
                                !isLoadingProductos &&
                                totales.normales > 0
                            ) {
                                e.target.style.backgroundColor = "#ffffff";
                                e.target.style.color = "#2c3e50";
                                e.target.style.transform = "translateY(-2px)";
                                e.target.style.boxShadow =
                                    "0 6px 24px rgba(0,0,0,0.1)";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (
                                rangoSeleccionado !== "STOCK_NORMAL" &&
                                !isLoadingProductos &&
                                totales.normales > 0
                            ) {
                                e.target.style.backgroundColor = "#f8f9fa";
                                e.target.style.color = "#6c757d";
                                e.target.style.transform = "translateY(0)";
                                e.target.style.boxShadow =
                                    "0 4px 16px rgba(0,0,0,0.06)";
                            }
                        }}
                    >
                        {rangoSeleccionado === "STOCK_NORMAL" && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: "4px",
                                    background:
                                        "linear-gradient(90deg, #42a5f5 0%, #1976d2 100%)",
                                }}
                            />
                        )}
                        <FaBatteryHalf style={{ fontSize: "16px" }} />
                        <div>
                            <div
                                style={{ fontWeight: "600", fontSize: "14px" }}
                            >
                                {rangos.STOCK_NORMAL.nombre}
                            </div>
                            <div
                                style={{
                                    fontSize: "12px",
                                    opacity: 0.8,
                                    fontWeight: "500",
                                }}
                            >
                                {totales.normales} productos
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => handleRangoChange("STOCK_ALTO")}
                        disabled={isLoadingProductos || totales.altos === 0}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "16px 24px",
                            border: "none",
                            backgroundColor:
                                rangoSeleccionado === "STOCK_ALTO"
                                    ? "#ffffff"
                                    : "#f8f9fa",
                            color:
                                rangoSeleccionado === "STOCK_ALTO"
                                    ? "#2c3e50"
                                    : "#6c757d",
                            borderRadius: "16px",
                            cursor:
                                isLoadingProductos || totales.altos === 0
                                    ? "not-allowed"
                                    : "pointer",
                            fontSize: "15px",
                            fontWeight:
                                rangoSeleccionado === "STOCK_ALTO"
                                    ? "700"
                                    : "500",
                            transition: "all 0.3s ease",
                            boxShadow:
                                rangoSeleccionado === "STOCK_ALTO"
                                    ? "0 8px 32px rgba(0,0,0,0.12)"
                                    : "0 4px 16px rgba(0,0,0,0.06)",
                            transform:
                                rangoSeleccionado === "STOCK_ALTO"
                                    ? "translateY(-4px)"
                                    : "translateY(0)",
                            opacity:
                                isLoadingProductos || totales.altos === 0
                                    ? 0.7
                                    : 1,
                            position: "relative",
                            overflow: "hidden",
                            minWidth: "160px",
                            justifyContent: "center",
                        }}
                        onMouseEnter={(e) => {
                            if (
                                rangoSeleccionado !== "STOCK_ALTO" &&
                                !isLoadingProductos &&
                                totales.altos > 0
                            ) {
                                e.target.style.backgroundColor = "#ffffff";
                                e.target.style.color = "#2c3e50";
                                e.target.style.transform = "translateY(-2px)";
                                e.target.style.boxShadow =
                                    "0 6px 24px rgba(0,0,0,0.1)";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (
                                rangoSeleccionado !== "STOCK_ALTO" &&
                                !isLoadingProductos &&
                                totales.altos > 0
                            ) {
                                e.target.style.backgroundColor = "#f8f9fa";
                                e.target.style.color = "#6c757d";
                                e.target.style.transform = "translateY(0)";
                                e.target.style.boxShadow =
                                    "0 4px 16px rgba(0,0,0,0.06)";
                            }
                        }}
                    >
                        {rangoSeleccionado === "STOCK_ALTO" && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: "4px",
                                    background:
                                        "linear-gradient(90deg, #66bb6a 0%, #388e3c 100%)",
                                }}
                            />
                        )}
                        <FaBatteryThreeQuarters style={{ fontSize: "16px" }} />
                        <div>
                            <div
                                style={{ fontWeight: "600", fontSize: "14px" }}
                            >
                                {rangos.STOCK_ALTO.nombre}
                            </div>
                            <div
                                style={{
                                    fontSize: "12px",
                                    opacity: 0.8,
                                    fontWeight: "500",
                                }}
                            >
                                {totales.altos} productos
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => handleRangoChange("STOCK_EXCESIVO")}
                        disabled={isLoadingProductos || totales.excesivos === 0}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "16px 24px",
                            border: "none",
                            backgroundColor:
                                rangoSeleccionado === "STOCK_EXCESIVO"
                                    ? "#ffffff"
                                    : "#f8f9fa",
                            color:
                                rangoSeleccionado === "STOCK_EXCESIVO"
                                    ? "#2c3e50"
                                    : "#6c757d",
                            borderRadius: "16px",
                            cursor:
                                isLoadingProductos || totales.excesivos === 0
                                    ? "not-allowed"
                                    : "pointer",
                            fontSize: "15px",
                            fontWeight:
                                rangoSeleccionado === "STOCK_EXCESIVO"
                                    ? "700"
                                    : "500",
                            transition: "all 0.3s ease",
                            boxShadow:
                                rangoSeleccionado === "STOCK_EXCESIVO"
                                    ? "0 8px 32px rgba(0,0,0,0.12)"
                                    : "0 4px 16px rgba(0,0,0,0.06)",
                            transform:
                                rangoSeleccionado === "STOCK_EXCESIVO"
                                    ? "translateY(-4px)"
                                    : "translateY(0)",
                            opacity:
                                isLoadingProductos || totales.excesivos === 0
                                    ? 0.7
                                    : 1,
                            position: "relative",
                            overflow: "hidden",
                            minWidth: "160px",
                            justifyContent: "center",
                        }}
                        onMouseEnter={(e) => {
                            if (
                                rangoSeleccionado !== "STOCK_EXCESIVO" &&
                                !isLoadingProductos &&
                                totales.excesivos > 0
                            ) {
                                e.target.style.backgroundColor = "#ffffff";
                                e.target.style.color = "#2c3e50";
                                e.target.style.transform = "translateY(-2px)";
                                e.target.style.boxShadow =
                                    "0 6px 24px rgba(0,0,0,0.1)";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (
                                rangoSeleccionado !== "STOCK_EXCESIVO" &&
                                !isLoadingProductos &&
                                totales.excesivos > 0
                            ) {
                                e.target.style.backgroundColor = "#f8f9fa";
                                e.target.style.color = "#6c757d";
                                e.target.style.transform = "translateY(0)";
                                e.target.style.boxShadow =
                                    "0 4px 16px rgba(0,0,0,0.06)";
                            }
                        }}
                    >
                        {rangoSeleccionado === "STOCK_EXCESIVO" && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: "4px",
                                    background:
                                        "linear-gradient(90deg, #9e9e9e 0%, #757575 100%)",
                                }}
                            />
                        )}
                        <FaBatteryFull style={{ fontSize: "16px" }} />
                        <div>
                            <div
                                style={{ fontWeight: "600", fontSize: "14px" }}
                            >
                                {rangos.STOCK_EXCESIVO.nombre}
                            </div>
                            <div
                                style={{
                                    fontSize: "12px",
                                    opacity: 0.8,
                                    fontWeight: "500",
                                }}
                            >
                                {totales.excesivos} productos
                            </div>
                        </div>
                    </button>

                    <button
                        onClick={() => refrescarCacheStock()}
                        disabled={isLoadingProductos}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "16px 24px",
                            border: "none",
                            backgroundColor: "#1976d2",
                            color: "white",
                            borderRadius: "16px",
                            cursor: isLoadingProductos
                                ? "not-allowed"
                                : "pointer",
                            fontSize: "15px",
                            fontWeight: "600",
                            transition: "all 0.3s ease",
                            boxShadow: "0 4px 16px rgba(25,118,210,0.3)",
                            transform: "translateY(0)",
                            opacity: isLoadingProductos ? 0.7 : 1,
                            minWidth: "140px",
                            justifyContent: "center",
                        }}
                        onMouseEnter={(e) => {
                            if (!isLoadingProductos) {
                                e.target.style.backgroundColor = "#1565c0";
                                e.target.style.transform = "translateY(-2px)";
                                e.target.style.boxShadow =
                                    "0 6px 24px rgba(25,118,210,0.4)";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isLoadingProductos) {
                                e.target.style.backgroundColor = "#1976d2";
                                e.target.style.transform = "translateY(0)";
                                e.target.style.boxShadow =
                                    "0 4px 16px rgba(25,118,210,0.3)";
                            }
                        }}
                    >
                        {isLoadingProductos ? (
                            <FaSpinner
                                className="fa-spin"
                                style={{ fontSize: "16px" }}
                            />
                        ) : (
                            <FaSync style={{ fontSize: "16px" }} />
                        )}
                        {isLoadingProductos ? "Actualizando..." : "Actualizar"}
                    </button>

                    <button
                        onClick={() => setMostrarModalRangos(true)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "12px 16px",
                            border: "none",
                            backgroundColor: "#28a745",
                            color: "white",
                            borderRadius: "12px",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: "600",
                            transition: "all 0.3s ease",
                            boxShadow: "0 2px 8px rgba(40,167,69,0.3)",
                            transform: "translateY(0)",
                            minWidth: "120px",
                            justifyContent: "center",
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "#218838";
                            e.target.style.transform = "translateY(-1px)";
                            e.target.style.boxShadow =
                                "0 4px 12px rgba(40,167,69,0.4)";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "#28a745";
                            e.target.style.transform = "translateY(0)";
                            e.target.style.boxShadow =
                                "0 2px 8px rgba(40,167,69,0.3)";
                        }}
                    >
                        ⚙️ Rangos
                    </button>

                    <button
                        onClick={() => setMostrarModalUmbralStock(true)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "12px 16px",
                            border: "none",
                            backgroundColor: "#17a2b8",
                            color: "white",
                            borderRadius: "12px",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: "600",
                            transition: "all 0.3s ease",
                            boxShadow: "0 2px 8px rgba(23,162,184,0.3)",
                            transform: "translateY(0)",
                            minWidth: "120px",
                            justifyContent: "center",
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "#138496";
                            e.target.style.transform = "translateY(-1px)";
                            e.target.style.boxShadow =
                                "0 4px 12px rgba(23,162,184,0.4)";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "#17a2b8";
                            e.target.style.transform = "translateY(0)";
                            e.target.style.boxShadow =
                                "0 2px 8px rgba(23,162,184,0.3)";
                        }}
                    >
                        🎯 Umbral
                    </button>
                </div>
            </div>

            {/* 🚀 NUEVO: Mensaje informativo sobre el cache de stock */}

            {/* Sección de productos por nivel de stock - Agrupados por lotes */}
            <div className="lotes-section" style={{ marginTop: "30px" }}>
                <div className="section-title" style={{ marginBottom: "25px" }}>
                    <h2
                        style={{
                            fontSize: "28px",
                            fontWeight: "700",
                            color: "#2c3e50",
                            margin: "0 0 8px 0",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                        }}
                    >
                        📊 Productos por Nivel de Stock
                    </h2>
                    <p
                        style={{
                            fontSize: "15px",
                            color: "#6c757d",
                            margin: 0,
                            lineHeight: "1.5",
                        }}
                    >
                        Los productos con manejo por lotes se muestran como una
                        entidad única con el stock total sumado
                    </p>
                </div>

                {isLoadingProductos ? (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "60px 20px",
                            fontSize: "18px",
                            color: "#6c757d",
                            backgroundColor: "#ffffff",
                            borderRadius: "16px",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                            border: "1px solid #f0f0f0",
                        }}
                    >
                        <FaSpinner
                            className="fa-spin"
                            style={{
                                fontSize: "24px",
                                marginBottom: "12px",
                                display: "block",
                                margin: "0 auto 12px auto",
                            }}
                        />
                        Cargando productos...
                    </div>
                ) : error ? (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "40px 20px",
                            fontSize: "16px",
                            color: "#dc3545",
                            backgroundColor: "#ffffff",
                            borderRadius: "16px",
                            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
                            border: "1px solid #f0f0f0",
                        }}
                    >
                        ❌ {error}
                    </div>
                ) : (
                    <>
                        {hayProductosParaMostrar() ? (
                            <div
                                style={{
                                    overflowX: "auto",
                                    borderRadius: "20px",
                                    border: "1px solid #f0f0f0",
                                    boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                                    backgroundColor: "#ffffff",
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
                                                    "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
                                                color: "white",
                                            }}
                                        >
                                            <th
                                                style={{
                                                    padding: "20px 16px",
                                                    textAlign: "left",
                                                    fontWeight: "700",
                                                    fontSize: "13px",
                                                    letterSpacing: "1px",
                                                    textTransform: "uppercase",
                                                    borderBottom:
                                                        "2px solid #1a252f",
                                                }}
                                            >
                                                📦 Producto
                                            </th>
                                            <th
                                                style={{
                                                    padding: "20px 16px",
                                                    textAlign: "left",
                                                    fontWeight: "700",
                                                    fontSize: "13px",
                                                    letterSpacing: "1px",
                                                    textTransform: "uppercase",
                                                    borderBottom:
                                                        "2px solid #1a252f",
                                                }}
                                            >
                                                🏷️ SKU
                                            </th>
                                            <th
                                                style={{
                                                    padding: "20px 16px",
                                                    textAlign: "center",
                                                    fontWeight: "700",
                                                    fontSize: "13px",
                                                    letterSpacing: "1px",
                                                    textTransform: "uppercase",
                                                    borderBottom:
                                                        "2px solid #1a252f",
                                                }}
                                            >
                                                📊 Stock Total
                                            </th>
                                            <th
                                                style={{
                                                    padding: "20px 16px",
                                                    textAlign: "center",
                                                    fontWeight: "700",
                                                    fontSize: "13px",
                                                    letterSpacing: "1px",
                                                    textTransform: "uppercase",
                                                    borderBottom:
                                                        "2px solid #1a252f",
                                                }}
                                            >
                                                🎯 Umbral Stock
                                            </th>
                                            <th
                                                style={{
                                                    padding: "20px 16px",
                                                    textAlign: "left",
                                                    fontWeight: "700",
                                                    fontSize: "13px",
                                                    letterSpacing: "1px",
                                                    textTransform: "uppercase",
                                                    borderBottom:
                                                        "2px solid #1a252f",
                                                }}
                                            >
                                                📍 Ubicación(es)
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getProductosPorRango().productos.map(
                                            (producto, index) => (
                                                <tr
                                                    key={producto.id}
                                                    style={{
                                                        backgroundColor:
                                                            index % 2 === 0
                                                                ? "#fff"
                                                                : "#fafbfc",
                                                        transition:
                                                            "all 0.2s ease",
                                                    }}
                                                >
                                                    <td
                                                        style={{
                                                            padding:
                                                                "20px 16px",
                                                            borderBottom:
                                                                "1px solid #f0f0f0",
                                                            fontSize: "15px",
                                                            fontWeight: "600",
                                                            color: "#2c3e50",
                                                            lineHeight: "1.4",
                                                        }}
                                                    >
                                                        {producto.product_name}
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding:
                                                                "20px 16px",
                                                            borderBottom:
                                                                "1px solid #f0f0f0",
                                                            fontSize: "13px",
                                                            fontWeight: "500",
                                                            color: "#495057",
                                                            fontFamily:
                                                                "'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
                                                            backgroundColor:
                                                                "#f8f9fa",
                                                            borderRadius: "8px",
                                                            margin: "4px 0",
                                                        }}
                                                    >
                                                        {producto.batch_number}
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding:
                                                                "20px 16px",
                                                            borderBottom:
                                                                "1px solid #f0f0f0",
                                                            textAlign: "center",
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                display:
                                                                    "inline-block",
                                                                padding:
                                                                    "8px 16px",
                                                                borderRadius:
                                                                    "12px",
                                                                fontSize:
                                                                    "13px",
                                                                fontWeight:
                                                                    "700",
                                                                textTransform:
                                                                    "uppercase",
                                                                letterSpacing:
                                                                    "0.5px",
                                                                color: "white",
                                                                backgroundColor:
                                                                    producto.quantity >
                                                                    50
                                                                        ? "#28a745"
                                                                        : producto.quantity >
                                                                          20
                                                                        ? "#ffc107"
                                                                        : "#dc3545",
                                                                boxShadow:
                                                                    "0 4px 12px rgba(0,0,0,0.15)",
                                                                minWidth:
                                                                    "60px",
                                                            }}
                                                        >
                                                            {producto.quantity}
                                                        </span>
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding:
                                                                "20px 16px",
                                                            borderBottom:
                                                                "1px solid #f0f0f0",
                                                            textAlign: "center",
                                                        }}
                                                    >
                                                        {producto.min_stock_threshold !==
                                                            undefined &&
                                                        producto.min_stock_threshold !==
                                                            null &&
                                                        producto.min_stock_threshold !==
                                                            "" ? (
                                                            <span
                                                                style={{
                                                                    display:
                                                                        "inline-block",
                                                                    padding:
                                                                        "8px 16px",
                                                                    borderRadius:
                                                                        "12px",
                                                                    fontSize:
                                                                        "13px",
                                                                    fontWeight:
                                                                        "700",
                                                                    textTransform:
                                                                        "uppercase",
                                                                    letterSpacing:
                                                                        "0.5px",
                                                                    color: "white",
                                                                    backgroundColor:
                                                                        "#1976d2",
                                                                    boxShadow:
                                                                        "0 4px 12px rgba(25,118,210,0.3)",
                                                                    minWidth:
                                                                        "60px",
                                                                }}
                                                            >
                                                                {
                                                                    producto.min_stock_threshold
                                                                }
                                                            </span>
                                                        ) : (
                                                            <span
                                                                style={{
                                                                    display:
                                                                        "inline-block",
                                                                    padding:
                                                                        "8px 16px",
                                                                    borderRadius:
                                                                        "12px",
                                                                    fontSize:
                                                                        "12px",
                                                                    fontWeight:
                                                                        "500",
                                                                    color: "#6c757d",
                                                                    backgroundColor:
                                                                        "#f8f9fa",
                                                                    border: "1px solid #dee2e6",
                                                                    minWidth:
                                                                        "100px",
                                                                }}
                                                            >
                                                                Sin configurar
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td
                                                        style={{
                                                            padding:
                                                                "20px 16px",
                                                            borderBottom:
                                                                "1px solid #f0f0f0",
                                                            fontSize: "14px",
                                                            fontWeight: "500",
                                                            color: "#495057",
                                                        }}
                                                    >
                                                        {producto.stockPorUbicacion ? (
                                                            <div
                                                                style={{
                                                                    display:
                                                                        "flex",
                                                                    flexDirection:
                                                                        "column",
                                                                    gap: "6px",
                                                                }}
                                                            >
                                                                {Object.entries(
                                                                    producto.stockPorUbicacion
                                                                ).map(
                                                                    (
                                                                        [
                                                                            ubicacion,
                                                                            cantidad,
                                                                        ],
                                                                        idx
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                idx
                                                                            }
                                                                            style={{
                                                                                display:
                                                                                    "flex",
                                                                                justifyContent:
                                                                                    "space-between",
                                                                                alignItems:
                                                                                    "center",
                                                                                padding:
                                                                                    "8px 12px",
                                                                                backgroundColor:
                                                                                    "#f8f9fa",
                                                                                borderRadius:
                                                                                    "8px",
                                                                                fontSize:
                                                                                    "13px",
                                                                                border: "1px solid #e9ecef",
                                                                                boxShadow:
                                                                                    "0 2px 4px rgba(0,0,0,0.04)",
                                                                            }}
                                                                        >
                                                                            <span
                                                                                style={{
                                                                                    fontWeight:
                                                                                        "600",
                                                                                    color: "#495057",
                                                                                }}
                                                                            >
                                                                                {
                                                                                    ubicacion
                                                                                }

                                                                                :
                                                                            </span>
                                                                            <span
                                                                                style={{
                                                                                    padding:
                                                                                        "2px 6px",
                                                                                    borderRadius:
                                                                                        "12px",
                                                                                    fontSize:
                                                                                        "11px",
                                                                                    fontWeight:
                                                                                        "700",
                                                                                    color: "white",
                                                                                    backgroundColor:
                                                                                        cantidad >
                                                                                        50
                                                                                            ? "#28a745"
                                                                                            : cantidad >
                                                                                              20
                                                                                            ? "#ffc107"
                                                                                            : "#dc3545",
                                                                                    minWidth:
                                                                                        "30px",
                                                                                    textAlign:
                                                                                        "center",
                                                                                }}
                                                                            >
                                                                                {
                                                                                    cantidad
                                                                                }
                                                                            </span>
                                                                        </div>
                                                                    )
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span
                                                                style={{
                                                                    color: "#6c757d",
                                                                    fontStyle:
                                                                        "italic",
                                                                }}
                                                            >
                                                                Sin ubicación
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div
                                style={{ padding: "40px", textAlign: "center" }}
                            >
                                <i
                                    className="fas fa-info-circle"
                                    style={{ fontSize: "24px", color: "#666" }}
                                ></i>
                                <p style={{ marginTop: "10px", color: "#666" }}>
                                    No hay productos en el rango de stock
                                    seleccionado.
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>

            <ConfigurarUmbralStockModal
                isOpen={mostrarModalUmbralStock}
                onClose={() => setMostrarModalUmbralStock(false)}
            />

            <ConfigurarRangosModal
                isOpen={mostrarModalRangos}
                onClose={() => setMostrarModalRangos(false)}
                rangosActuales={rangoConfig}
                onAplicarRangos={aplicarRangosTemporalmente}
                onDefinirPorDefecto={definirComoRangosPorDefecto}
            />
        </div>
    );
};

export default AlertasStockPage;
