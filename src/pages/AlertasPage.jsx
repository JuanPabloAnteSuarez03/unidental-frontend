import React, { useState, useEffect } from "react";
import AlertasHeader from "../components/Alertas/AlertasHeader";
import AlertasStyles from "../components/Alertas/AlertasStyles";
import ConfigurarUmbralModal from "../components/Alertas/ConfigurarUmbralModal";
import { useAuth } from "../context/AuthContext";
import API_CONFIG from "../config/api.js";
import { FaCog, FaPlus } from "react-icons/fa";

// 🚀 CONSTANTES PARA CACHE PERSISTENTE
const CACHE_STORAGE_KEY = "alertas_cache_data";
const CACHE_EXPIRY_TIME = 12 * 60 * 60 * 1000; // 12 horas

const AlertasPage = () => {
    // Estados principales
    const [lotesConStock, setLotesConStock] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState(""); // Mensaje específico de carga
    const [rangoActivo, setRangoActivo] = useState("vencidos"); // Rango por defecto
    const [estadisticas, setEstadisticas] = useState({
        total: 0,
        vencidos: 0,
        proximosAVencer: 0,
        seisMetres: 0,
        unAno: 0,
        masDeUnAno: 0,
    });

    // 🚀 OPTIMIZADO: Estados para cache duradero con localStorage
    const [cacheData, setCacheData] = useState(() => {
        // Intentar cargar cache desde localStorage al inicializar
        return cargarCacheDesdeStorage();
    });

    // Estado para el modal de configuración de umbrales
    const [mostrarModalUmbral, setMostrarModalUmbral] = useState(false);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);

    const { authToken } = useAuth();

    // Definición de rangos de vencimiento
    const rangosVencimiento = {
        vencidos: {
            nombre: "Vencidos",
            descripcion: "Productos ya vencidos",
            color: "#d32f2f",
            backgroundColor: "#ffebee",
            icono: "🚨",
            filtro: (dias) => dias < 0,
        },
        proximos: {
            nombre: "Próximos",
            descripcion: "0-90 días para vencer",
            color: "#f57c00",
            backgroundColor: "#fff3e0",
            icono: "⚠️",
            filtro: (dias) => dias >= 0 && dias <= 90,
        },
        seismeses: {
            nombre: "6 Meses",
            descripcion: "91-180 días para vencer",
            color: "#1976d2",
            backgroundColor: "#e3f2fd",
            icono: "📅",
            filtro: (dias) => dias > 90 && dias <= 180,
        },
        unano: {
            nombre: "1 Año",
            descripcion: "181-365 días para vencer",
            color: "#388e3c",
            backgroundColor: "#e8f5e9",
            icono: "📆",
            filtro: (dias) => dias > 180 && dias <= 365,
        },
        masdeunano: {
            nombre: "Más de 1 Año",
            descripcion: "Más de 365 días para vencer",
            color: "#4caf50",
            backgroundColor: "#f1f8e9",
            icono: "✅",
            filtro: (dias) => dias > 365,
        },
    };

    // Función para calcular días restantes
    const calcularDiasRestantes = (fechaVencimiento) => {
        if (!fechaVencimiento) return null;
        const hoy = new Date();
        const fechaVenc = new Date(fechaVencimiento);
        return Math.ceil((fechaVenc - hoy) / (1000 * 60 * 60 * 24));
    };

    // Función para calcular días efectivos considerando umbrales
    const calcularDiasEfectivos = (diasVencimiento, umbralProducto) => {
        // Si no hay umbral configurado, usar días de vencimiento normales
        if (!umbralProducto || umbralProducto === 0) {
            return diasVencimiento;
        }

        // Calcular días efectivos: días_vencimiento - umbral
        const diasEfectivos = diasVencimiento - umbralProducto;

        console.log(
            `🎯 Umbral aplicado: ${diasVencimiento} días - ${umbralProducto} umbral = ${diasEfectivos} días efectivos`
        );

        return diasEfectivos;
    };

    // 🚀 OPTIMIZADO: Función para obtener información de productos con umbrales (con cache)
    const obtenerProductosConUmbrales = async (forceRefresh = false) => {
        // Si ya tenemos datos en cache y no es un refresh forzado, usar cache
        if (
            !forceRefresh &&
            cacheData.mapaUmbrales &&
            Object.keys(cacheData.mapaUmbrales).length > 0
        ) {
            console.log("🎯 Usando mapa de umbrales desde cache");
            return cacheData.mapaUmbrales;
        }

        try {
            console.log("📦 Obteniendo productos con umbrales desde API...");

            // Optimización: solo obtener campos necesarios
            const response = await fetch(
                `${API_CONFIG.BASE_URL}/catalogs/products/all/`,
                {
                    headers: {
                        Authorization: `Token ${authToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const productos = Array.isArray(data) ? data : data.results || [];

            // Crear un mapa de ID de producto -> umbral
            const mapaUmbrales = {};
            productos.forEach((producto) => {
                mapaUmbrales[producto.id] =
                    producto.min_expiry_days_threshold || 0;
            });

            console.log(
                `✅ Productos con umbrales obtenidos: ${productos.length}`
            );
            console.log("🎯 Mapa de umbrales:", mapaUmbrales);

            // Actualizar cache en memoria
            setCacheData((prev) => {
                const nuevoCache = {
                    ...prev,
                    mapaUmbrales: mapaUmbrales,
                };
                // Guardar en localStorage solo si ya tenemos datos completos
                if (prev.isLoaded && prev.todosLosLotes.length > 0) {
                    guardarCacheEnStorage(nuevoCache);
                }
                return nuevoCache;
            });

            return mapaUmbrales;
        } catch (error) {
            console.error("❌ Error al obtener productos con umbrales:", error);
            return cacheData.mapaUmbrales || {};
        }
    };

    // 🚀 NUEVA FUNCIÓN: Cargar todos los datos una sola vez
    const cargarTodosLosDatos = async (forceRefresh = false) => {
        if (!authToken) return;

        // Si ya tenemos datos en cache y no es un refresh forzado, no recargar
        if (
            !forceRefresh &&
            cacheData.isLoaded &&
            cacheData.todosLosLotes.length > 0
        ) {
            console.log(
                "💾 Usando datos desde cache, no es necesario recargar"
            );
            return;
        }

        // 🔧 MEJORA: Limpiar caché del navegador si hay force refresh
        if (forceRefresh) {
            console.log("🔄 Force refresh detectado, limpiando cache...");
            localStorage.removeItem(CACHE_STORAGE_KEY);
        }

        setIsLoading(true);
        setLoadingMessage("Iniciando carga de datos...");
        try {
            console.log(
                `🔄 ${
                    forceRefresh
                        ? "Refrescando datos forzosamente"
                        : "Cargando datos por primera vez"
                }`
            );

            // STEP 1: Obtener umbrales de productos
            setLoadingMessage("Cargando configuración de productos...");
            const mapaUmbrales = await obtenerProductosConUmbrales(
                forceRefresh
            );

            // STEP 2: Obtener TODOS los lotes
            setLoadingMessage("Descargando inventario completo...");
            const allUrl = new URL(
                `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STOCK_ALL}`,
                window.location.origin
            );

            allUrl.searchParams.append("requires_batch_control", "true");
            allUrl.searchParams.append("has_batch", "true");
            allUrl.searchParams.append("has_stock", "true");
            allUrl.searchParams.append("ordering", "batch__expiry_date");

            console.log("📡 Fetching ALL lotes desde:", allUrl.toString());

            const response = await fetch(allUrl.toString(), {
                headers: {
                    Authorization: `Token ${authToken}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            let todosLosLotes = Array.isArray(data) ? data : data.results || [];

            console.log(`✅ Total de lotes obtenidos: ${todosLosLotes.length}`);

            // STEP 3: Procesar lotes con información adicional
            setLoadingMessage(`Procesando ${todosLosLotes.length} lotes...`);
            const lotesExpandidos = todosLosLotes.map((lote) => {
                const fechaVencimiento =
                    lote.batch_expiry_date || lote.expiry_date || null;
                let diasRestantes = null;
                let diasEfectivos = null;
                let umbralProducto = 0;

                if (fechaVencimiento) {
                    diasRestantes = calcularDiasRestantes(fechaVencimiento);
                    umbralProducto = mapaUmbrales[lote.product] || 0;
                    diasEfectivos = calcularDiasEfectivos(
                        diasRestantes,
                        umbralProducto
                    );
                }

                const loteExpandido = {
                    ...lote,
                    id: `${lote.id}_${lote.batch_number || "no-batch"}`,
                    producto_nombre: lote.product_name,
                    producto_sku: lote.product_sku,
                    numero_lote: lote.batch_number || "N/A",
                    ubicacion_nombre: lote.location_name,
                    cantidad: lote.quantity || 0,
                    fecha_vencimiento: fechaVencimiento,
                    producto_id: lote.product,
                    ubicacion_id: lote.location,
                    batch_id: lote.batch,
                    dias_restantes: diasRestantes,
                    dias_efectivos: diasEfectivos,
                    umbral_producto: umbralProducto,
                };



                return loteExpandido;
            });

            // Ordenar por fecha de vencimiento (más próximos primero)
            setLoadingMessage("Organizando datos por fecha de vencimiento...");
            lotesExpandidos.sort((a, b) => {
                if (!a.fecha_vencimiento) return 1;
                if (!b.fecha_vencimiento) return -1;
                const fechaA = new Date(a.fecha_vencimiento);
                const fechaB = new Date(b.fecha_vencimiento);
                return fechaA - fechaB;
            });

            // 🚀 Actualizar cache con todos los datos
            setLoadingMessage("Finalizando carga de datos...");
            const nuevoCache = {
                todosLosLotes: lotesExpandidos,
                mapaUmbrales: mapaUmbrales,
                isLoaded: true,
                lastFetch: Date.now(),
            };

            setCacheData(nuevoCache);

            // Guardar en localStorage
            guardarCacheEnStorage(nuevoCache);

            console.log(
                "💾 Datos guardados en cache de memoria y localStorage exitosamente"
            );
        } catch (error) {
            console.error("❌ Error al cargar datos:", error);

            // FALLBACK: Intentar con paginación manual
            console.log("🔄 Intentando fallback...");
            try {
                await cargarDatosFallback(forceRefresh);
            } catch (fallbackError) {
                console.error("❌ Error en fallback:", fallbackError);
            }
        } finally {
            setIsLoading(false);
            setLoadingMessage("");
        }
    };

    // 🚀 NUEVA FUNCIÓN: Filtrar lotes desde cache por rango
    const filtrarLotesPorRango = (rangoKey) => {
        if (!cacheData.isLoaded || cacheData.todosLosLotes.length === 0) {
            console.log("⚠️ No hay datos en cache para filtrar");
            return;
        }

        console.log(`🔍 Filtrando lotes para rango: ${rangoKey} desde cache`);

        const rango = rangosVencimiento[rangoKey];
        if (!rango) {
            console.error(`❌ Rango no encontrado: ${rangoKey}`);
            return;
        }

        // Filtrar lotes por el rango seleccionado
        const lotesFiltrados = cacheData.todosLosLotes.filter((lote) => {
            if (!lote.fecha_vencimiento || lote.dias_efectivos === null) {
                return false;
            }
            return rango.filtro(lote.dias_efectivos);
        });

        // Calcular estadísticas de todos los lotes en cache
        const statsTemp = {
            total: 0,
            vencidos: 0,
            proximosAVencer: 0,
            seisMetres: 0,
            unAno: 0,
            masDeUnAno: 0,
        };

        cacheData.todosLosLotes.forEach((lote) => {
            if (lote.fecha_vencimiento && lote.dias_efectivos !== null) {
                if (lote.dias_efectivos < 0) {
                    statsTemp.vencidos++;
                } else if (lote.dias_efectivos <= 90) {
                    statsTemp.proximosAVencer++;
                } else if (lote.dias_efectivos <= 180) {
                    statsTemp.seisMetres++;
                } else if (lote.dias_efectivos <= 365) {
                    statsTemp.unAno++;
                } else {
                    statsTemp.masDeUnAno++;
                }
            }
        });

        statsTemp.total =
            statsTemp.vencidos +
            statsTemp.proximosAVencer +
            statsTemp.seisMetres +
            statsTemp.unAno +
            statsTemp.masDeUnAno;

        setLotesConStock(lotesFiltrados);
        setEstadisticas(statsTemp);

        console.log(
            `📊 Lotes filtrados para "${rangoKey}": ${lotesFiltrados.length}`
        );
        console.log("📈 Estadísticas actualizadas:", statsTemp);
    };

    // Función de fallback con paginación manual
    const cargarDatosFallback = async (forceRefresh = false) => {
        console.log(`🔄 Fallback para carga de datos`);
        setLoadingMessage("Carga alternativa: obteniendo configuración...");

        // Obtener umbrales de productos
        const mapaUmbrales = await obtenerProductosConUmbrales(forceRefresh);
        setLoadingMessage(
            "Carga alternativa: descargando lotes por páginas..."
        );

        const baseUrl = new URL(
            `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STOCK}`,
            window.location.origin
        );

        baseUrl.searchParams.append("requires_batch_control", "true");
        baseUrl.searchParams.append("has_batch", "true");
        baseUrl.searchParams.append("has_stock", "true");
        baseUrl.searchParams.append("ordering", "batch__expiry_date");
        baseUrl.searchParams.append("page_size", "100");

        let todosLosLotes = [];
        let pagina = 1;
        let hasNextPage = true;

        while (hasNextPage) {
            const url = new URL(baseUrl);
            url.searchParams.append("page", pagina);

            setLoadingMessage(
                `Carga alternativa: página ${pagina}... (${todosLosLotes.length} lotes)`
            );

            const response = await fetch(url.toString(), {
                headers: {
                    Authorization: `Token ${authToken}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const lotesPagina = data.results || [];
            todosLosLotes.push(...lotesPagina);

            hasNextPage = data.next !== null;
            pagina++;

            if (pagina > 100) break;
        }

        // Procesar lotes con información adicional
        const lotesExpandidos = todosLosLotes.map((lote) => {
            const fechaVencimiento =
                lote.batch_expiry_date || lote.expiry_date || null;
            let diasRestantes = null;
            let diasEfectivos = null;
            let umbralProducto = 0;

            if (fechaVencimiento) {
                diasRestantes = calcularDiasRestantes(fechaVencimiento);
                umbralProducto = mapaUmbrales[lote.product] || 0;
                diasEfectivos = calcularDiasEfectivos(
                    diasRestantes,
                    umbralProducto
                );
            }

            const loteExpandido = {
                ...lote,
                id: `${lote.id}_${lote.batch_number || "no-batch"}`,
                producto_nombre: lote.product_name,
                producto_sku: lote.product_sku,
                numero_lote: lote.batch_number || "N/A",
                ubicacion_nombre: lote.location_name,
                cantidad: lote.quantity || 0,
                fecha_vencimiento: fechaVencimiento,
                producto_id: lote.product,
                ubicacion_id: lote.location,
                batch_id: lote.batch,
                dias_restantes: diasRestantes,
                dias_efectivos: diasEfectivos,
                umbral_producto: umbralProducto,
            };



            return loteExpandido;
        });

        // Ordenar por fecha de vencimiento
        lotesExpandidos.sort((a, b) => {
            if (!a.fecha_vencimiento) return 1;
            if (!b.fecha_vencimiento) return -1;
            const fechaA = new Date(a.fecha_vencimiento);
            const fechaB = new Date(b.fecha_vencimiento);
            return fechaA - fechaB;
        });

        // Actualizar cache con datos del fallback
        const nuevoCache = {
            todosLosLotes: lotesExpandidos,
            mapaUmbrales: mapaUmbrales,
            isLoaded: true,
            lastFetch: Date.now(),
        };

        setCacheData(nuevoCache);

        // Guardar en localStorage
        guardarCacheEnStorage(nuevoCache);

        console.log(
            "💾 Datos del fallback guardados en cache de memoria y localStorage exitosamente"
        );
    };

    // 🚀 OPTIMIZADO: Función para cambiar de rango (solo filtra desde cache)
    const cambiarRango = (nuevoRango) => {
        if (nuevoRango !== rangoActivo) {
            setRangoActivo(nuevoRango);
            // Si ya tenemos datos en cache, solo filtrar
            if (cacheData.isLoaded && cacheData.todosLosLotes.length > 0) {
                filtrarLotesPorRango(nuevoRango);
            } else {
                // Si no hay datos en cache, cargar datos
                cargarTodosLosDatos();
            }
        }
    };

    // Función para formatear fechas
    const formatearFecha = (fechaString) => {
        if (!fechaString) return "N/A";
        const fecha = new Date(fechaString);
        return fecha.toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    // Función para obtener el color según los días efectivos (considerando umbrales)
    const getColorVencimiento = (lote) => {
        if (!lote || !lote.fecha_vencimiento)
            return { color: "#666", backgroundColor: "#f5f5f5" };

        // Usar días efectivos si están disponibles, sino calcular
        let diasEfectivos;
        if (lote.dias_efectivos !== undefined) {
            diasEfectivos = lote.dias_efectivos;
        } else {
            const diasRestantes = calcularDiasRestantes(lote.fecha_vencimiento);
            const umbral = lote.umbral_producto || 0;
            diasEfectivos = calcularDiasEfectivos(diasRestantes, umbral);
        }

        if (diasEfectivos < 0) {
            return { color: "#d32f2f", backgroundColor: "#ffebee" }; // Crítico/Vencido - Rojo
        } else if (diasEfectivos <= 90) {
            return { color: "#f57c00", backgroundColor: "#fff3e0" }; // Próximos - Naranja
        } else if (diasEfectivos <= 180) {
            return { color: "#1976d2", backgroundColor: "#e3f2fd" }; // 6 Meses - Azul
        } else if (diasEfectivos <= 365) {
            return { color: "#388e3c", backgroundColor: "#e8f5e9" }; // 1 Año - Verde
        } else {
            return { color: "#4caf50", backgroundColor: "#f1f8e9" }; // Más de 1 Año - Verde claro
        }
    };

    // Función para convertir días a meses y días
    const convertirDiasAMesesYDias = (dias) => {
        if (dias < 30) {
            return `${dias} días`;
        }

        const meses = Math.floor(dias / 30);
        const diasRestantes = dias % 30;

        if (diasRestantes === 0) {
            return `${meses} mes${meses > 1 ? "es" : ""}`;
        } else {
            return `${meses} mes${
                meses > 1 ? "es" : ""
            } y ${diasRestantes} días`;
        }
    };

    // Función para obtener texto del estado considerando umbrales
    const getEstadoVencimiento = (lote) => {
        if (!lote || !lote.fecha_vencimiento) return "Sin fecha";

        const diasRestantes =
            lote.dias_restantes ||
            calcularDiasRestantes(lote.fecha_vencimiento);
        const diasEfectivos =
            lote.dias_efectivos !== undefined
                ? lote.dias_efectivos
                : diasRestantes;
        const umbral = lote.umbral_producto || 0;

        // Texto base del vencimiento
        let textoVencimiento;
        if (diasRestantes < 0) {
            const diasVencidos = Math.abs(diasRestantes);
            textoVencimiento = `Vencido hace ${convertirDiasAMesesYDias(
                diasVencidos
            )}`;
        } else if (diasRestantes === 0) {
            textoVencimiento = "Vence hoy";
        } else if (diasRestantes === 1) {
            textoVencimiento = "Vence mañana";
        } else {
            textoVencimiento = `Vence en ${convertirDiasAMesesYDias(
                diasRestantes
            )}`;
        }

        // Si hay umbral configurado, mostrar información más clara
        if (umbral > 0) {
            if (diasEfectivos < 0) {
                // Producto está en estado crítico según el umbral
                return `🚨 CRÍTICO - Vence en ${convertirDiasAMesesYDias(
                    diasRestantes
                )} (Umbral: ${convertirDiasAMesesYDias(umbral)})`;
            } else {
                // Producto está dentro del umbral de alerta
                return `${textoVencimiento} ⚠️ Umbral: ${convertirDiasAMesesYDias(
                    umbral
                )}`;
            }
        }

        return textoVencimiento;
    };

    // Funciones para manejar el modal de umbrales
    const abrirModalUmbral = (producto = null) => {
        setProductoSeleccionado(producto);
        setMostrarModalUmbral(true);
    };

    const cerrarModalUmbral = () => {
        setMostrarModalUmbral(false);
        setProductoSeleccionado(null);
    };

    // 🔧 NUEVA FUNCIÓN: Limpiar caché y recargar datos
    const limpiarCacheYRecargar = () => {
        console.log("🧹 Limpiando caché y recargando datos...");
        localStorage.removeItem(CACHE_STORAGE_KEY);
        setCacheData({
            mapaUmbrales: {},
            todosLosLotes: [],
            isLoaded: false,
            lastFetch: null,
        });
        cargarTodosLosDatos(true);
    };

    const onUmbralGuardado = (productoActualizado) => {
        console.log("✅ Umbral guardado para producto:", productoActualizado);
        // Recargar los lotes para aplicar los nuevos umbrales
        cargarTodosLosDatos(true);
    };

    // 🚀 NUEVA FUNCIÓN: Refrescar cache manualmente
    const refrescarCache = () => {
        console.log("🔄 Refrescando cache manualmente...");
        limpiarCacheStorage(); // Limpiar cache del localStorage
        cargarTodosLosDatos(true);
    };

    // 🚀 NUEVA FUNCIÓN: Obtener información del cache
    const obtenerInfoCache = () => {
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
            cantidad: cacheData.todosLosLotes.length,
            ultimaActualizacion: cacheData.lastFetch
                ? new Date(cacheData.lastFetch).toLocaleString("es-ES")
                : "Desconocida",
            tiempoRestante: `${minutosRestantes} min`,
            expiraSoon: expiraSoon,
        };
    };

    // 🚀 NUEVA FUNCIÓN: Cargar cache desde localStorage
    function cargarCacheDesdeStorage() {
        try {
            const cacheGuardado = localStorage.getItem(CACHE_STORAGE_KEY);
            if (cacheGuardado) {
                const cache = JSON.parse(cacheGuardado);

                // Verificar si el cache no ha expirado
                const ahora = Date.now();
                const tiempoTranscurrido = ahora - (cache.lastFetch || 0);

                if (
                    tiempoTranscurrido < CACHE_EXPIRY_TIME &&
                    cache.todosLosLotes &&
                    cache.todosLosLotes.length > 0
                ) {
                    console.log("💾 Cache cargado desde localStorage:", {
                        lotes: cache.todosLosLotes.length,
                        ultimaActualizacion: new Date(
                            cache.lastFetch
                        ).toLocaleString("es-ES"),
                    });
                    return {
                        todosLosLotes: cache.todosLosLotes || [],
                        mapaUmbrales: cache.mapaUmbrales || {},
                        isLoaded: true,
                        lastFetch: cache.lastFetch,
                    };
                } else {
                    console.log("⏰ Cache expirado o vacío, se eliminará");
                    localStorage.removeItem(CACHE_STORAGE_KEY);
                }
            }
        } catch (error) {
            console.error(
                "❌ Error al cargar cache desde localStorage:",
                error
            );
            localStorage.removeItem(CACHE_STORAGE_KEY);
        }

        return {
            todosLosLotes: [],
            mapaUmbrales: {},
            isLoaded: false,
            lastFetch: null,
        };
    }

    // 🚀 NUEVA FUNCIÓN: Guardar cache en localStorage
    function guardarCacheEnStorage(nuevoCache) {
        try {
            const cacheParaGuardar = {
                todosLosLotes: nuevoCache.todosLosLotes,
                mapaUmbrales: nuevoCache.mapaUmbrales,
                lastFetch: nuevoCache.lastFetch,
            };
            localStorage.setItem(
                CACHE_STORAGE_KEY,
                JSON.stringify(cacheParaGuardar)
            );
            console.log("💾 Cache guardado en localStorage:", {
                lotes: nuevoCache.todosLosLotes.length,
                timestamp: new Date(nuevoCache.lastFetch).toLocaleString(
                    "es-ES"
                ),
            });
        } catch (error) {
            console.error("❌ Error al guardar cache en localStorage:", error);
        }
    }

    // 🚀 NUEVA FUNCIÓN: Limpiar cache del localStorage
    function limpiarCacheStorage() {
        try {
            localStorage.removeItem(CACHE_STORAGE_KEY);
            console.log("🗑️ Cache eliminado del localStorage");
        } catch (error) {
            console.error("❌ Error al limpiar cache:", error);
        }
    }

    // Cargar datos al montar el componente
    useEffect(() => {
        if (authToken) {
            // Si no hay datos en cache, cargarlos
            if (!cacheData.isLoaded || cacheData.todosLosLotes.length === 0) {
                console.log("🚀 No hay datos en cache, cargando desde API...");
                cargarTodosLosDatos();
            } else {
                console.log(
                    "✅ Datos encontrados en cache persistente, no es necesario cargar desde API"
                );
            }
        }
    }, [authToken]);

    // 🚀 NUEVO: Filtrar automáticamente cuando los datos del cache estén listos
    useEffect(() => {
        if (cacheData.isLoaded && cacheData.todosLosLotes.length > 0) {
            filtrarLotesPorRango(rangoActivo);
        }
    }, [cacheData.isLoaded, cacheData.todosLosLotes.length, rangoActivo]);

    return (
        <div className="alertas-page">
            <AlertasStyles />
            <AlertasHeader
                rangoActivo={rangoActivo}
                cambiarRango={cambiarRango}
                rangosVencimiento={rangosVencimiento}
                estadisticas={estadisticas}
                abrirModalUmbral={abrirModalUmbral}
            />

            {/* Resumen de estadísticas generales */}
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
                            {estadisticas.total}
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
                            Total Lotes
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
                            {estadisticas.vencidos}
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
                            Vencidos
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
                            {estadisticas.proximosAVencer}
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
                            Próximos (0-90 días)
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
                            {estadisticas.seisMetres}
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
                            6 Meses (91-180 días)
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
                            {estadisticas.unAno}
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
                            1 Año (181-365 días)
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
                            {estadisticas.masDeUnAno}
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
                            Más de 1 Año
                        </p>
                    </div>
                </div>
            </div>

            {/* Navegación por rangos */}
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
                    {Object.entries(rangosVencimiento).map(
                        ([rangoKey, rango]) => {
                            const isActivo = rangoActivo === rangoKey;
                            const cantidadRango =
                                estadisticas[
                                    rangoKey === "proximos"
                                        ? "proximosAVencer"
                                        : rangoKey === "seismeses"
                                        ? "seisMetres"
                                        : rangoKey === "unano"
                                        ? "unAno"
                                        : rangoKey === "masdeunano"
                                        ? "masDeUnAno"
                                        : rangoKey
                                ] || 0;

                            return (
                                <button
                                    key={rangoKey}
                                    onClick={() => cambiarRango(rangoKey)}
                                    disabled={isLoading}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "12px",
                                        padding: "16px 24px",
                                        border: "none",
                                        backgroundColor: isActivo
                                            ? "#ffffff"
                                            : "#f8f9fa",
                                        color: isActivo ? "#2c3e50" : "#6c757d",
                                        borderRadius: "16px",
                                        cursor: isLoading
                                            ? "not-allowed"
                                            : "pointer",
                                        fontSize: "15px",
                                        fontWeight: isActivo ? "700" : "500",
                                        transition: "all 0.3s ease",
                                        boxShadow: isActivo
                                            ? "0 8px 32px rgba(0,0,0,0.12)"
                                            : "0 4px 16px rgba(0,0,0,0.06)",
                                        transform: isActivo
                                            ? "translateY(-4px)"
                                            : "translateY(0)",
                                        opacity: isLoading ? 0.7 : 1,
                                        position: "relative",
                                        overflow: "hidden",
                                        minWidth: "140px",
                                        justifyContent: "center",
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActivo && !isLoading) {
                                            e.target.style.backgroundColor =
                                                "#ffffff";
                                            e.target.style.color = "#2c3e50";
                                            e.target.style.transform =
                                                "translateY(-2px)";
                                            e.target.style.boxShadow =
                                                "0 6px 24px rgba(0,0,0,0.1)";
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isActivo && !isLoading) {
                                            e.target.style.backgroundColor =
                                                "#f8f9fa";
                                            e.target.style.color = "#6c757d";
                                            e.target.style.transform =
                                                "translateY(0)";
                                            e.target.style.boxShadow =
                                                "0 4px 16px rgba(0,0,0,0.06)";
                                        }
                                    }}
                                >
                                    {isActivo && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                height: "4px",
                                                background: `linear-gradient(90deg, ${rango.color} 0%, ${rango.color}80 100%)`,
                                            }}
                                        />
                                    )}
                                    <span style={{ fontSize: "16px" }}>
                                        {rango.icono}
                                    </span>
                                    <div>
                                        <div
                                            style={{
                                                fontWeight: "600",
                                                fontSize: "14px",
                                            }}
                                        >
                                            {rango.nombre}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "12px",
                                                opacity: 0.8,
                                                fontWeight: "500",
                                            }}
                                        >
                                            {cantidadRango} lotes
                                        </div>
                                    </div>
                                </button>
                            );
                        }
                    )}
                </div>

                {/* Información del rango activo */}
                <div
                    style={{
                        padding: "15px 20px",
                        backgroundColor:
                            rangosVencimiento[rangoActivo]?.backgroundColor ||
                            "#f5f5f5",
                        border: `1px solid ${
                            rangosVencimiento[rangoActivo]?.color || "#ccc"
                        }40`,
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                    }}
                >
                    <span style={{ fontSize: "24px" }}>
                        {rangosVencimiento[rangoActivo]?.icono}
                    </span>
                    <div>
                        <h3
                            style={{
                                margin: "0 0 4px 0",
                                fontSize: "18px",
                                color: rangosVencimiento[rangoActivo]?.color,
                                fontWeight: "600",
                            }}
                        >
                            {rangosVencimiento[rangoActivo]?.nombre}
                        </h3>
                        <p
                            style={{
                                margin: 0,
                                fontSize: "14px",
                                color: rangosVencimiento[rangoActivo]?.color,
                                opacity: 0.8,
                            }}
                        >
                            {rangosVencimiento[rangoActivo]?.descripcion} •{" "}
                            {lotesConStock.length} lotes encontrados
                        </p>
                    </div>
                </div>
            </div>

            {/* Controles */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                    padding: "15px",
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
            >
                <h2 style={{ margin: 0, color: "#333" }}>
                    Lotes - {rangosVencimiento[rangoActivo]?.nombre}
                </h2>
                <div
                    style={{
                        display: "flex",
                        gap: "12px",
                        alignItems: "center",
                    }}
                >
                    <button
                        onClick={refrescarCache}
                        disabled={isLoading}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            padding: "10px 20px",
                            backgroundColor: "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontWeight: "600",
                            cursor: isLoading ? "not-allowed" : "pointer",
                            transition: "all 0.3s ease",
                            boxShadow: "0 2px 4px rgba(0,123,255,0.3)",
                            opacity: isLoading ? 0.7 : 1,
                        }}
                        onMouseEnter={(e) => {
                            if (!isLoading) {
                                e.target.style.backgroundColor = "#0056b3";
                                e.target.style.transform = "translateY(-1px)";
                                e.target.style.boxShadow =
                                    "0 4px 8px rgba(0,123,255,0.4)";
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isLoading) {
                                e.target.style.backgroundColor = "#007bff";
                                e.target.style.transform = "translateY(0)";
                                e.target.style.boxShadow =
                                    "0 2px 4px rgba(0,123,255,0.3)";
                            }
                        }}
                        title="Recargar datos de lotes"
                    >
                        <span style={{ fontSize: "16px" }}>🔄</span>
                        Recargar Datos
                    </button>
                    <button
                        onClick={limpiarCacheYRecargar}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            padding: "10px 20px",
                            backgroundColor: "#dc3545",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontWeight: "600",
                            cursor: "pointer",
                            transition: "background-color 0.2s",
                        }}
                        title="Limpiar caché del navegador y recargar datos"
                    >
                        <span style={{ fontSize: "16px" }}>🧹</span>
                        Limpiar Caché
                    </button>
                    <button
                        onClick={abrirModalUmbral}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            padding: "10px 20px",
                            backgroundColor: "#28a745",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontWeight: "600",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            boxShadow: "0 2px 4px rgba(40,167,69,0.3)",
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = "#218838";
                            e.target.style.transform = "translateY(-1px)";
                            e.target.style.boxShadow =
                                "0 4px 8px rgba(40,167,69,0.4)";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = "#28a745";
                            e.target.style.transform = "translateY(0)";
                            e.target.style.boxShadow =
                                "0 2px 4px rgba(40,167,69,0.3)";
                        }}
                        title="Configurar umbrales de vencimiento"
                    >
                        <FaCog style={{ fontSize: "14px" }} />
                        Configurar Umbrales
                    </button>
                </div>
            </div>

            {/* Tabla de lotes */}
            <div
                style={{
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    overflow: "hidden",
                }}
            >
                {isLoading ? (
                    <div
                        style={{
                            padding: "40px",
                            textAlign: "center",
                            background:
                                "linear-gradient(135deg, #e3f2fd 0%, #f8f9fa 100%)",
                            border: "1px solid #bbdefb",
                        }}
                    >
                        <i
                            className="fas fa-spinner fa-spin"
                            style={{
                                fontSize: "28px",
                                color: "#1976d2",
                                marginBottom: "16px",
                            }}
                        ></i>
                        <div
                            style={{
                                fontSize: "16px",
                                fontWeight: "600",
                                color: "#1976d2",
                                marginBottom: "8px",
                            }}
                        >
                            {loadingMessage || "Cargando datos..."}
                        </div>
                        <p style={{ marginTop: "10px", color: "#666" }}>
                            Cargando datos...
                        </p>
                    </div>
                ) : lotesConStock.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center" }}>
                        <i
                            className="fas fa-info-circle"
                            style={{ fontSize: "24px", color: "#666" }}
                        ></i>
                        <p style={{ marginTop: "10px", color: "#666" }}>
                            No se encontraron lotes en el rango "
                            {rangosVencimiento[rangoActivo]?.nombre}"
                        </p>
                    </div>
                ) : (
                    <div
                        style={{
                            overflowX: "auto",
                            borderRadius: "12px",
                            border: "1px solid #e9ecef",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
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
                                            padding: "16px 12px",
                                            textAlign: "left",
                                            fontWeight: "600",
                                            fontSize: "14px",
                                            letterSpacing: "0.5px",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        📦 Producto
                                    </th>
                                    <th
                                        style={{
                                            padding: "16px 12px",
                                            textAlign: "left",
                                            fontWeight: "600",
                                            fontSize: "14px",
                                            letterSpacing: "0.5px",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        🏷️ SKU
                                    </th>
                                    <th
                                        style={{
                                            padding: "16px 12px",
                                            textAlign: "left",
                                            fontWeight: "600",
                                            fontSize: "14px",
                                            letterSpacing: "0.5px",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        🧪 Lote
                                    </th>
                                    <th
                                        style={{
                                            padding: "16px 12px",
                                            textAlign: "left",
                                            fontWeight: "600",
                                            fontSize: "14px",
                                            letterSpacing: "0.5px",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        📍 Ubicación
                                    </th>
                                    <th
                                        style={{
                                            padding: "16px 12px",
                                            textAlign: "center",
                                            fontWeight: "600",
                                            fontSize: "14px",
                                            letterSpacing: "0.5px",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        📊 Stock
                                    </th>
                                    <th
                                        style={{
                                            padding: "16px 12px",
                                            textAlign: "center",
                                            fontWeight: "600",
                                            fontSize: "14px",
                                            letterSpacing: "0.5px",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        📅 Fecha Vencimiento
                                    </th>
                                    <th
                                        style={{
                                            padding: "16px 12px",
                                            textAlign: "center",
                                            fontWeight: "600",
                                            fontSize: "14px",
                                            letterSpacing: "0.5px",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        ⚠️ Estado
                                    </th>
                                    <th
                                        style={{
                                            padding: "16px 12px",
                                            textAlign: "center",
                                            fontWeight: "600",
                                            fontSize: "14px",
                                            letterSpacing: "0.5px",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        🎯 Umbral
                                    </th>
                                    <th
                                        style={{
                                            padding: "16px 12px",
                                            textAlign: "center",
                                            fontWeight: "600",
                                            fontSize: "14px",
                                            letterSpacing: "0.5px",
                                            textTransform: "uppercase",
                                            width: "100px",
                                        }}
                                    >
                                        ⚙️ Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {lotesConStock.map((lote, index) => {
                                    const colorVencimiento =
                                        getColorVencimiento(lote);
                                    return (
                                        <tr
                                            key={lote.id || index}
                                            style={{
                                                backgroundColor:
                                                    index % 2 === 0
                                                        ? "#fff"
                                                        : "#f8f9fa",
                                            }}
                                        >
                                            <td
                                                style={{
                                                    padding: "16px 12px",
                                                    borderBottom:
                                                        "1px solid #e9ecef",
                                                    fontSize: "14px",
                                                    fontWeight: "600",
                                                    color: "#2c3e50",
                                                }}
                                            >
                                                {lote.producto_nombre || "N/A"}
                                            </td>
                                            <td
                                                style={{
                                                    padding: "16px 12px",
                                                    borderBottom:
                                                        "1px solid #e9ecef",
                                                    fontSize: "13px",
                                                    fontWeight: "500",
                                                    color: "#495057",
                                                    fontFamily: "monospace",
                                                    backgroundColor: "#f8f9fa",
                                                }}
                                            >
                                                {lote.producto_sku || "N/A"}
                                            </td>
                                            <td
                                                style={{
                                                    padding: "16px 12px",
                                                    borderBottom:
                                                        "1px solid #e9ecef",
                                                    fontSize: "13px",
                                                    fontWeight: "500",
                                                    color: "#495057",
                                                    fontFamily: "monospace",
                                                }}
                                            >
                                                {lote.numero_lote || "N/A"}
                                            </td>
                                            <td
                                                style={{
                                                    padding: "16px 12px",
                                                    borderBottom:
                                                        "1px solid #e9ecef",
                                                    fontSize: "14px",
                                                    fontWeight: "500",
                                                    color: "#495057",
                                                }}
                                            >
                                                {lote.ubicacion_nombre || "N/A"}
                                            </td>
                                            <td
                                                style={{
                                                    padding: "16px 12px",
                                                    borderBottom:
                                                        "1px solid #e9ecef",
                                                    textAlign: "center",
                                                    fontSize: "14px",
                                                    fontWeight: "700",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        display: "inline-block",
                                                        padding: "6px 12px",
                                                        borderRadius: "20px",
                                                        fontSize: "12px",
                                                        fontWeight: "600",
                                                        textTransform:
                                                            "uppercase",
                                                        letterSpacing: "0.5px",
                                                        color: "white",
                                                        backgroundColor:
                                                            lote.cantidad > 10
                                                                ? "#28a745"
                                                                : lote.cantidad >
                                                                  5
                                                                ? "#ffc107"
                                                                : "#dc3545",
                                                    }}
                                                >
                                                    {lote.cantidad || 0}
                                                </span>
                                            </td>
                                            <td
                                                style={{
                                                    padding: "16px 12px",
                                                    borderBottom:
                                                        "1px solid #e9ecef",
                                                    textAlign: "center",
                                                    fontSize: "13px",
                                                    fontWeight: "500",
                                                    color: "#495057",
                                                    fontFamily: "monospace",
                                                }}
                                            >
                                                {formatearFecha(
                                                    lote.fecha_vencimiento
                                                )}
                                            </td>
                                            <td
                                                style={{
                                                    padding: "16px 12px",
                                                    borderBottom:
                                                        "1px solid #e9ecef",
                                                    textAlign: "center",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        display: "inline-block",
                                                        padding: "8px 16px",
                                                        borderRadius: "20px",
                                                        fontSize: "12px",
                                                        fontWeight: "600",
                                                        textTransform:
                                                            "uppercase",
                                                        letterSpacing: "0.5px",
                                                        color: colorVencimiento.color,
                                                        backgroundColor:
                                                            colorVencimiento.backgroundColor,
                                                        border: `2px solid ${colorVencimiento.color}30`,
                                                        boxShadow:
                                                            "0 2px 4px rgba(0,0,0,0.1)",
                                                    }}
                                                >
                                                    {getEstadoVencimiento(lote)}
                                                </span>
                                            </td>
                                            <td
                                                style={{
                                                    padding: "16px 12px",
                                                    borderBottom:
                                                        "1px solid #e9ecef",
                                                    textAlign: "center",
                                                }}
                                            >
                                                {lote.umbral_producto > 0 ? (
                                                    <span
                                                        style={{
                                                            display:
                                                                "inline-block",
                                                            padding: "6px 12px",
                                                            borderRadius:
                                                                "20px",
                                                            fontSize: "12px",
                                                            fontWeight: "600",
                                                            textTransform:
                                                                "uppercase",
                                                            letterSpacing:
                                                                "0.5px",
                                                            color: "white",
                                                            backgroundColor:
                                                                "#1976d2",
                                                            boxShadow:
                                                                "0 2px 4px rgba(25,118,210,0.3)",
                                                        }}
                                                    >
                                                        {convertirDiasAMesesYDias(
                                                            lote.umbral_producto
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span
                                                        style={{
                                                            display:
                                                                "inline-block",
                                                            padding: "6px 12px",
                                                            borderRadius:
                                                                "20px",
                                                            fontSize: "11px",
                                                            fontWeight: "500",
                                                            color: "#6c757d",
                                                            backgroundColor:
                                                                "#f8f9fa",
                                                            border: "1px solid #dee2e6",
                                                        }}
                                                    >
                                                        Sin configurar
                                                    </span>
                                                )}
                                            </td>
                                            <td
                                                style={{
                                                    padding: "16px 12px",
                                                    borderBottom:
                                                        "1px solid #e9ecef",
                                                    textAlign: "center",
                                                }}
                                            >
                                                <button
                                                    onClick={() => {
                                                        // Configurar umbral para este producto específico
                                                        const producto = {
                                                            id: lote.producto_id,
                                                            name: lote.producto_nombre,
                                                            sku: lote.producto_sku,
                                                            min_expiry_days_threshold:
                                                                lote.umbral_producto,
                                                        };
                                                        console.log(
                                                            "Configurar umbral para producto:",
                                                            producto
                                                        );
                                                        abrirModalUmbral(
                                                            producto
                                                        );
                                                    }}
                                                    style={{
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "center",
                                                        gap: "6px",
                                                        padding: "8px 16px",
                                                        backgroundColor:
                                                            "#1976d2",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: "20px",
                                                        fontSize: "12px",
                                                        fontWeight: "600",
                                                        textTransform:
                                                            "uppercase",
                                                        letterSpacing: "0.5px",
                                                        cursor: "pointer",
                                                        transition:
                                                            "all 0.3s ease",
                                                        boxShadow:
                                                            "0 2px 4px rgba(25,118,210,0.3)",
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.target.style.backgroundColor =
                                                            "#1565c0";
                                                        e.target.style.transform =
                                                            "translateY(-2px)";
                                                        e.target.style.boxShadow =
                                                            "0 4px 8px rgba(25,118,210,0.4)";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.target.style.backgroundColor =
                                                            "#1976d2";
                                                        e.target.style.transform =
                                                            "translateY(0)";
                                                        e.target.style.boxShadow =
                                                            "0 2px 4px rgba(25,118,210,0.3)";
                                                    }}
                                                    title="Configurar umbral para este producto"
                                                >
                                                    <FaCog
                                                        style={{
                                                            fontSize: "12px",
                                                        }}
                                                    />
                                                    Configurar
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal para configurar umbrales */}
            <ConfigurarUmbralModal
                isOpen={mostrarModalUmbral}
                onClose={cerrarModalUmbral}
                onUmbralGuardado={onUmbralGuardado}
                productoPreSeleccionado={productoSeleccionado}
            />
        </div>
    );
};

export default AlertasPage;
