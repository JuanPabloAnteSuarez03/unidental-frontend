import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { 
    getTodaySales, 
    getSalesInDateRange, 
    getSalesStatisticsByDays, 
    getSalesByLocation, 
    getTopProductsByDays,
    getSalesByDateRange
} from "../../services/salesService";
import { getReturnedItemsBySale } from "../../services/returnsService";
import { getCurrentDateLocal, debugDate } from "../../utils/dateUtils";
import ReportesFilters from "./ReportesFilters";
import ReportesTable from "./ReportesTable";
import ReportesInfo from "./ReportesInfo";
import SaleDetailModal from "./SaleDetailModal";
import ReturnDetailModal from "./ReturnDetailModal";
import PaymentDetailModal from "./PaymentDetailModal";

const VentasSection = () => {
    const { authToken } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [detailedSales, setDetailedSales] = useState([]);
    const [salesStats, setSalesStats] = useState(null);
    const [salesByLocation, setSalesByLocation] = useState([]);
    const [topProducts, setTopProducts] = useState([]);
    const [returns, setReturns] = useState([]);
    const [creditPayments, setCreditPayments] = useState([]);

    // Estados para modales
    const [selectedSaleData, setSelectedSaleData] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedReturnData, setSelectedReturnData] = useState(null);
    const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
    const [selectedPaymentData, setSelectedPaymentData] = useState(null);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

    // Estados para filtros
    const [filters, setFilters] = useState({
        type: "sale",
        days: "", // Por defecto mostrar "Selecciona uno"
        specificDate: getCurrentDateLocal(), // Por defecto mostrar ventas de hoy
        startDate: "",
        endDate: "",
        sede: "all",
    });

    // Mueve aquí la función getFilteredData
    const getFilteredData = (data) => {
        if (!data || filters.sede === "all") return data;
        if (Array.isArray(data)) {
            return data.filter((item) => {
                const itemSede = item.sede || item.location || item.location_name || "";
                return itemSede === filters.sede;
            });
        }
        return data;
    };

    // Ahora sí puedes usar los filtrados
    const filteredDetailedSales = getFilteredData(detailedSales);
    const filteredSalesByLocation = getFilteredData(salesByLocation);

    // Función para validar y corregir datos de ventas por sede
    const validateAndCorrectLocationData = (locationData) => {
        if (!locationData || !Array.isArray(locationData)) return locationData;
        return locationData.map((location) => {
            let correctedLocation = { ...location };
            // Si total_amount es 0 o undefined, pero tenemos total_sales > 0 y average_sale > 0
            // Podemos calcular el total: total_sales * average_sale
            if (
                (!location.total_amount || location.total_amount === 0) &&
                location.total_sales > 0 && location.average_sale > 0
            ) {
                const calculatedTotal = location.total_sales * location.average_sale;
                correctedLocation.total_amount = calculatedTotal;
            }
            // También verificar si tenemos total_revenue como alternativa
            if (
                (!correctedLocation.total_amount || correctedLocation.total_amount === 0) &&
                location.total_revenue && location.total_revenue > 0
            ) {
                correctedLocation.total_amount = location.total_revenue;
            }
            return correctedLocation;
        });
    };

    // Función para mapear días a filtros predefinidos del backend
    const getDateRangeFromDays = (days) => {
        switch (days) {
            case 1:
                return "today";
            case 7:
                return "last_7_days";
            case 30:
                return "last_30_days";
            case 90:
                return "last_90_days";
            case 365:
                return "last_365_days"; // Si el backend lo soporta
            default:
                return null; // Usar filtros específicos de fecha
        }
    };

    // Función para cargar datos usando API de estadísticas
    const loadSalesDataByDays = async (days) => {
        if (!authToken) return;

        setIsLoading(true);
        setError("");

        try {
            console.log(
                `🔄 Cargando datos de ventas para últimos ${days} días`
            );

            // Intentar usar filtros predefinidos del backend
            const dateRange = getDateRangeFromDays(days);
            let salesData = [];

            if (dateRange) {
                console.log(`🎯 Usando filtro predefinido: ${dateRange}`);
                try {
                    salesData = await getSalesByDateRange(dateRange, {}, authToken);
                } catch (error) {
                    console.warn(`⚠️ Error con filtro predefinido ${dateRange}, usando estadísticas:`, error);
                }
            }

            // Si no hay datos con filtros predefinidos, usar estadísticas
            if (salesData.length === 0) {
                console.log("📊 Usando endpoints de estadísticas");
                // Cargar datos en paralelo
                const [statsData, locationData, productsData] = await Promise.all([
                    getSalesStatisticsByDays(days, authToken).catch(err => {
                        console.warn("⚠️ Error cargando estadísticas:", err);
                        return null;
                    }),
                    getSalesByLocation(days, authToken).catch(err => {
                        console.warn("⚠️ Error cargando datos por ubicación:", err);
                        return [];
                    }),
                    getTopProductsByDays(days, 10, authToken).catch(err => {
                        console.warn("⚠️ Error cargando productos top:", err);
                        return [];
                    }),
                ]);

                console.log("📊 Datos de estadísticas recibidos:", statsData);
                console.log("📍 Datos de ubicaciones recibidos:", locationData);
                console.log("🔥 Datos de productos recibidos:", productsData);

                // Agregar logging detallado para debug de totales por sede
                if (locationData && locationData.length > 0) {
                    console.log("🏢 DETALLE DE VENTAS POR SEDE:");
                    locationData.forEach((location, index) => {
                        console.log(
                            `  ${index + 1}. ${
                                location.location_name || "Sin nombre"
                            }:`
                        );
                        console.log(`     - ID: ${location.location_id}`);
                        console.log(
                            `     - Total Sales: ${location.total_sales || 0}`
                        );
                        console.log(
                            `     - Total Amount: ${
                                location.total_amount || 0
                            } (ESTE ES EL TOTAL DE DINERO)`
                        );
                        console.log(
                            `     - Average Sale: ${
                                location.average_sale || 0
                            } (ESTE ES EL PROMEDIO)`
                        );
                        console.log(
                            `     - Total Revenue: ${
                                location.total_revenue || "No disponible"
                            }`
                        );
                    });
                }

                // Procesar datos para compatibilidad
                const processedStats = statsData ? {
                    totalSales: statsData.total_sales || 0,
                    totalRevenue: statsData.total_revenue || 0,
                    averageSale: statsData.average_sale_value || 0,
                    salesByType: statsData.sales_by_type || [],
                    ...statsData
                } : null;

                const processedLocationData = locationData || [];
                const processedProductsData = productsData || [];

                setSalesStats(processedStats);
                setSalesByLocation(processedLocationData);
                setTopProducts(processedProductsData);
            } else {
                // Si tenemos datos de ventas detalladas, procesarlos para estadísticas
                console.log(`📊 Procesando ${salesData.length} ventas para estadísticas`);
                
                // Calcular estadísticas básicas
                const totalSales = salesData.length;
                const totalRevenue = salesData.reduce((sum, sale) => sum + parseFloat(sale.total_net || sale.total_gross || sale.total || 0), 0);
                const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;

                // Agrupar por sede
                const locationMap = {};
                salesData.forEach(sale => {
                    const locationName = sale.location_details?.name || "Sin sede";
                    if (!locationMap[locationName]) {
                        locationMap[locationName] = {
                            location_name: locationName,
                            location_id: sale.location_details?.id || 0,
                            total_sales: 0,
                            total_amount: 0,
                            average_sale: 0
                        };
                    }
                    locationMap[locationName].total_sales++;
                    locationMap[locationName].total_amount += parseFloat(sale.total_net || sale.total_gross || sale.total || 0);
                });

                // Calcular promedios por sede
                Object.values(locationMap).forEach(location => {
                    location.average_sale = location.total_sales > 0 ? location.total_amount / location.total_sales : 0;
                });

                const processedStats = {
                    totalSales,
                    totalRevenue,
                    averageSale,
                    salesByType: []
                };

                setSalesStats(processedStats);
                setSalesByLocation(Object.values(locationMap));
                setTopProducts([]); // Los productos top se calculan en el backend
            }

            console.log("✅ Datos de estadísticas cargados exitosamente");
        } catch (error) {
            console.error("❌ Error cargando estadísticas:", error);
            setError("Error al cargar estadísticas: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Función para cargar ventas detalladas (para fecha específica)
    const loadDetailedSales = async (specificDate) => {
        if (!authToken) return;

        setIsLoading(true);
        setError("");

        try {
            console.log(`🔄 Cargando ventas detalladas para ${specificDate}`);

            let salesData = [];

            // Si es hoy, usar endpoint específico
            const today = getCurrentDateLocal();
            if (specificDate === today) {
                console.log("📅 Usando endpoint de ventas de hoy");
                const todayData = await getTodaySales({}, authToken);
                salesData = todayData.results || todayData || [];
            } else {
                console.log("📅 Usando filtros de fecha del backend");
                // Usar los nuevos filtros de fecha del backend
                salesData = await getSalesInDateRange(
                    specificDate,
                    specificDate,
                    authToken
                );
            }

            // Procesar datos para compatibilidad
            const processedData = salesData.map((sale) => ({
                id: sale.id,
                date: sale.sale_date,
                total: parseFloat(sale.total_net) || 0,
                sale_type: sale.sale_type,
                customer_name: sale.customer_details?.name || "Sin cliente",
                customer_id: sale.customer_details?.id || null,
                location: sale.location_details?.name || "Sin sede",
                sede: sale.location_details?.name || "Sin sede",
                items_count: sale.items?.length || 0,
                created_at: sale.sale_date,
                ...sale,
            }));

            setDetailedSales(processedData);

            // Limpiar estadísticas cuando se ven ventas detalladas
            setSalesStats(null);
            setSalesByLocation([]);
            setTopProducts([]);

            console.log(
                `✅ Ventas detalladas cargadas: ${processedData.length} registros`
            );
        } catch (error) {
            console.error("❌ Error cargando ventas detalladas:", error);
            setError("Error al cargar ventas: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Efecto para cargar datos iniciales cuando el componente se monta
    useEffect(() => {
        // Cargar ventas de hoy por defecto
        if (authToken) {
            const today = getCurrentDateLocal();
            loadDetailedSales(today);
        }
    }, [authToken]);

    // Efecto para cargar datos cuando cambien los filtros
    useEffect(() => {
        if (filters.specificDate) {
            // Si hay fecha específica, cargar ventas detalladas
            loadDetailedSales(filters.specificDate);
        } else if (filters.days) {
            // Si hay filtro de días, cargar estadísticas
            loadSalesDataByDays(filters.days);
            setDetailedSales([]); // Limpiar ventas detalladas
        }
    }, [filters.days, filters.specificDate, authToken]);

    // Nueva función para obtener devoluciones del día o por rango de fechas usando filtros del backend
    const fetchDevolucionesDelDia = useCallback(async (fecha, fechaFin = null) => {
        try {
            let params = {};
            if (fecha && !fechaFin) {
                params.date_range = "today";
            } else if (fecha && fechaFin) {
                params.return_date_from = fecha;
                params.return_date_to = fechaFin;
            }
            const query = new URLSearchParams(params).toString();
            const resp = await fetch(`https://unidental-backend.onrender.com/api/sales/returns/?${query}`, {
                headers: {
                    Authorization: `Token ${authToken}`,
                    "Content-Type": "application/json"
                }
            });
            if (!resp.ok) throw new Error("Error consultando devoluciones");
            const data = await resp.json();
            const arr = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
            setReturns(arr);
            // Sumar el total devuelto
            const total = arr.reduce((sum, d) => sum + parseFloat(d.total_amount || 0), 0);
            return total;
        } catch (e) {
            setReturns([]);
            return 0;
        }
    }, [authToken]);

    // Nueva función para obtener abonos a créditos del día o por rango de fechas usando filtros del backend
    const fetchAbonosDelDia = useCallback(async (fecha, fechaFin = null) => {
        if (!fecha || !authToken) return;
        try {
            let params = {};
            if (fecha && !fechaFin) {
                params.date_range = "today";
            } else if (fecha && fechaFin) {
                params.payment_date_from = fecha;
                params.payment_date_to = fechaFin;
            }
            const query = new URLSearchParams(params).toString();
            const resp = await fetch(`https://unidental-backend.onrender.com/api/credits/payments/?${query}`, {
                headers: {
                    Authorization: `Token ${authToken}`,
                    "Content-Type": "application/json"
                }
            });
            if (!resp.ok) throw new Error("Error consultando abonos");
            const data = await resp.json();
            const pagos = Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []);
            setCreditPayments(pagos);
        } catch (e) {
            setCreditPayments([]);
        }
    }, [authToken]);

    // Efecto para actualizar neto cuando cambian las ventas detalladas o la fecha
    useEffect(() => {
        const calcularNeto = async () => {
            if (filteredDetailedSales.length > 0 && filters.specificDate) {
                const total = filteredDetailedSales.reduce(
                    (sum, sale) => sum + parseFloat(sale.total_net || sale.total_gross || sale.total || 0),
                    0
                );
                const devuelto = await fetchDevolucionesDelDia(filters.specificDate);
                return total - devuelto;
            } else {
                return 0;
            }
        };
        calcularNeto();
        // No incluir fetchDevolucionesDelDia en dependencias para evitar bucles
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredDetailedSales, filters.specificDate]);

    // Llama a fetchAbonosDelDia cuando cambie la fecha
    useEffect(() => {
        if (filters.specificDate) {
            fetchAbonosDelDia(filters.specificDate);
        }
        // No incluir fetchAbonosDelDia en dependencias para evitar bucles
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.specificDate]);

    // Aplicar validación y corrección a los datos filtrados
    const validatedSalesByLocation = validateAndCorrectLocationData(
        filteredSalesByLocation
    );

    // Funciones para manejar el modal de detalle
    const handleSaleClick = (saleData) => {
        console.log(`🔍 Abriendo detalle de venta ${saleData.id}`, saleData);
        setSelectedSaleData(saleData);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedSaleData(null);
    };

    // Función para manejar el click en una devolución
    const handleReturnClick = (returnData) => {
        setSelectedReturnData(returnData);
        setIsReturnModalOpen(true);
    };
    const handleCloseReturnModal = () => {
        setIsReturnModalOpen(false);
        setSelectedReturnData(null);
    };

    // Función para manejar el click en un abono
    const handlePaymentClick = (paymentData) => {
        setSelectedPaymentData(paymentData);
        setIsPaymentModalOpen(true);
    };
    const handleClosePaymentModal = () => {
        setIsPaymentModalOpen(false);
        setSelectedPaymentData(null);
    };

    // Calcular totales por tipo de venta
    const totalVentasBrutas = filteredDetailedSales.reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
    const totalVentasEfectivo = filteredDetailedSales.filter(s => s.sale_type === 'normal').reduce((sum, s) => sum + (parseFloat(s.total) || 0), 0);
    const totalRecibidoEfectivo = totalVentasEfectivo - (returns ? returns.reduce((sum, r) => sum + parseFloat(r.total_amount || 0), 0) : 0);

    // Utilidad para mostrar el tipo de venta
    const getSaleTypeLabel = (type) => {
        if (type === 'normal') return { label: 'Efectivo', color: '#27ae60', bg: '#eafaf1', icon: '💵' };
        if (type === 'card') return { label: 'Tarjeta', color: '#0984e3', bg: '#e3f2fd', icon: '💳' };
        if (type === 'credit') return { label: 'Crédito', color: '#fdcb6e', bg: '#fffbe6', icon: '📝' };
        return { label: type, color: '#636e72', bg: '#f1f2f6', icon: '❓' };
    };

    return (
        <div style={{ padding: "24px" }}>
            {/* Filtros */}
            <ReportesFilters
                filters={filters}
                setFilters={setFilters}
                activeView="ventas"
            />

            {/* Indicador de carga */}
            {isLoading && (
                <div
                    style={{
                        padding: "24px",
                        textAlign: "center",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "12px",
                        margin: "24px 0",
                    }}
                >
                    <div
                        style={{
                            display: "inline-block",
                            width: "40px",
                            height: "40px",
                            border: "4px solid #e3e3e3",
                            borderTop: "4px solid #007bff",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                            marginBottom: "16px",
                        }}
                    ></div>
                    <p style={{ color: "#666", fontSize: "16px" }}>
                        Cargando datos de ventas...
                    </p>
                </div>
            )}

            {/* Error */}
            {error && (
                <div
                    style={{
                        padding: "16px",
                        backgroundColor: "#f8d7da",
                        color: "#721c24",
                        borderRadius: "8px",
                        border: "1px solid #f5c6cb",
                        margin: "24px 0",
                    }}
                >
                    ⚠️ {error}
                </div>
            )}

            {/* Tarjetas de totales */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: "20px",
                marginBottom: "24px",
            }}>
                <div style={{ background: "linear-gradient(135deg, #27ae60 0%, #00b894 100%)", color: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(39, 174, 96, 0.18)" }}>
                    <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "8px" }}>Total del Día (Bruto)</div>
                    <div style={{ fontSize: "32px", fontWeight: "700" }}>${totalVentasBrutas.toLocaleString()}</div>
                    <div style={{ fontSize: "12px", opacity: 0.8, marginTop: "4px" }}>{filters.specificDate}</div>
                </div>
                <div style={{ background: "linear-gradient(135deg, #dc3545 0%, #ff7675 100%)", color: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(220, 53, 69, 0.18)" }}>
                    <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "8px" }}>Total Devuelto</div>
                    <div style={{ fontSize: "32px", fontWeight: "700" }}>-${(returns ? returns.reduce((sum, r) => sum + parseFloat(r.total_amount || 0), 0) : 0).toLocaleString()}</div>
                    <div style={{ fontSize: "12px", opacity: 0.8, marginTop: "4px" }}>{filters.specificDate}</div>
                </div>
                <div style={{ background: "linear-gradient(135deg, #0984e3 0%, #74b9ff 100%)", color: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(9, 132, 227, 0.18)", fontSize: "24px", fontWeight: "700", textAlign: "center" }}>
                    <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "8px" }}>Total Neto (Ventas - Devoluciones)</div>
                    <div style={{ fontSize: "32px", fontWeight: "700" }}>${(totalVentasBrutas - (returns ? returns.reduce((sum, r) => sum + parseFloat(r.total_amount || 0), 0) : 0)).toLocaleString()}</div>
                    <div style={{ fontSize: "12px", opacity: 0.8, marginTop: "4px" }}>{filters.specificDate}</div>
                </div>
                <div style={{ background: "linear-gradient(135deg, #00b894 0%, #55efc4 100%)", color: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0, 184, 148, 0.18)" }}>
                    <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "8px" }}>Total Recibido en Efectivo</div>
                    <div style={{ fontSize: "32px", fontWeight: "700" }}>${totalRecibidoEfectivo.toLocaleString()}</div>
                    <div style={{ fontSize: "12px", opacity: 0.8, marginTop: "4px" }}>Ventas en efectivo - devoluciones</div>
                </div>
                {creditPayments && creditPayments.length > 0 && (
                    <div style={{ background: "linear-gradient(135deg, #00b894 0%, #55efc4 100%)", color: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0, 184, 148, 0.18)" }}>
                        <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "8px" }}>Total Recibido por Abonos</div>
                                                 <div style={{ fontSize: "32px", fontWeight: "700" }}>+${(creditPayments ? creditPayments.reduce((sum, p) => sum + parseFloat(p.amount_paid || 0), 0) : 0).toLocaleString()}</div>
                        <div style={{ fontSize: "12px", opacity: 0.8, marginTop: "4px" }}>Abonos a créditos recibidos</div>
                    </div>
                )}
            </div>

            {/* Estadísticas del día actual */}
            {filteredDetailedSales.length > 0 && !isLoading && (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(300px, 1fr))",
                        gap: "24px",
                        marginBottom: "32px",
                    }}
                >
                    {/* Número de ventas del día */}
                    <div style={{ padding: "24px", backgroundColor: "white", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)", border: "1px solid #e9ecef" }}>
                        <div style={{ fontSize: "32px", fontWeight: "800", marginBottom: "8px", color: "#007bff" }}>
                            {filteredDetailedSales.length}
                        </div>
                        <div style={{ fontSize: "16px", fontWeight: "600", color: "#6c757d" }}>Ventas del Día</div>
                        <div style={{ fontSize: "14px", color: "#6c757d", marginTop: "4px" }}>{filters.specificDate}</div>
                        </div>
                    {/* Promedio por venta del día (Neto) */}
                    <div style={{ padding: "24px", backgroundColor: "white", borderRadius: "16px", boxShadow: "0 4px 20px rgba(255, 193, 7, 0.08)", border: "1px solid #e9ecef" }}>
                        <div style={{ fontSize: "32px", fontWeight: "800", marginBottom: "8px", color: "#fd7e14" }}>
                            ${filteredDetailedSales.length > 0 ? (totalVentasBrutas / filteredDetailedSales.length).toFixed(0) : "0"}
                        </div>
                        <div style={{ fontSize: "16px", fontWeight: "600", color: "#6c757d" }}>Promedio por Venta (Neto)</div>
                        <div style={{ fontSize: "14px", color: "#6c757d", marginTop: "4px" }}>{filters.specificDate}</div>
                    </div>
                </div>
            )}

            {/* Estadísticas generales (cuando se usan días) */}
            {salesStats && !isLoading && (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns:
                            "repeat(auto-fit, minmax(300px, 1fr))",
                        gap: "24px",
                        marginBottom: "32px",
                    }}
                >
                    {/* Total de ventas */}
                    <div
                        style={{
                            padding: "24px",
                            backgroundColor: "white",
                            borderRadius: "16px",
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                            border: "1px solid #e9ecef",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "32px",
                                fontWeight: "800",
                                marginBottom: "8px",
                                color: "#28a745",
                            }}
                        >
                            $
                            {parseFloat(
                                salesStats.total_revenue ||
                                    salesStats.total_amount ||
                                    0
                            ).toLocaleString()}
                        </div>
                        <div
                            style={{
                                fontSize: "16px",
                                fontWeight: "600",
                                color: "#6c757d",
                            }}
                        >
                            Total en Ventas
                        </div>
                        <div
                            style={{
                                fontSize: "14px",
                                color: "#6c757d",
                                marginTop: "4px",
                            }}
                        >
                            Últimos {filters.days} días
                        </div>
                    </div>

                    {/* Número de ventas */}
                    <div
                        style={{
                            padding: "24px",
                            backgroundColor: "white",
                            borderRadius: "16px",
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                            border: "1px solid #e9ecef",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "32px",
                                fontWeight: "800",
                                marginBottom: "8px",
                                color: "#007bff",
                            }}
                        >
                            {parseInt(salesStats.total_sales || 0)}
                        </div>
                        <div
                            style={{
                                fontSize: "16px",
                                fontWeight: "600",
                                color: "#6c757d",
                            }}
                        >
                            Ventas Realizadas
                        </div>
                        <div
                            style={{
                                fontSize: "14px",
                                color: "#6c757d",
                                marginTop: "4px",
                            }}
                        >
                            Últimos {filters.days} días
                        </div>
                    </div>

                    {/* Ventas por día */}
                    <div
                        style={{
                            padding: "24px",
                            backgroundColor: "white",
                            borderRadius: "16px",
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                            border: "1px solid #e9ecef",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "32px",
                                fontWeight: "800",
                                marginBottom: "8px",
                                color: "#6f42c1",
                            }}
                        >
                            {parseInt(salesStats.total_sales || 0) > 0
                                ? (
                                      parseInt(salesStats.total_sales || 0) /
                                      parseInt(filters.days || 1)
                                  ).toFixed(1)
                                : "0.0"}
                        </div>
                        <div
                            style={{
                                fontSize: "16px",
                                fontWeight: "600",
                                color: "#6c757d",
                            }}
                        >
                            Ventas por Día
                        </div>
                        <div
                            style={{
                                fontSize: "14px",
                                color: "#6c757d",
                                marginTop: "4px",
                            }}
                        >
                            Promedio últimos {filters.days} días
                        </div>
                    </div>
                </div>
            )}

            {/* Productos más vendidos */}
            {topProducts && topProducts.length > 0 && !isLoading && (
                <div
                    style={{
                        backgroundColor: "white",
                        borderRadius: "16px",
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                        border: "1px solid #e9ecef",
                        marginBottom: "32px",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            padding: "24px",
                            borderBottom: "1px solid #e9ecef",
                            backgroundColor: "#f8f9fa",
                        }}
                    >
                        <h3
                            style={{
                                margin: 0,
                                fontSize: "20px",
                                fontWeight: "700",
                                color: "#2c3e50",
                            }}
                        >
                            🔥 Productos Más Vendidos
                        </h3>
                        <p style={{ margin: "8px 0 0 0", color: "#6c757d" }}>
                            Últimos {filters.days} días
                        </p>
                    </div>
                    <div style={{ padding: "0" }}>
                        {topProducts.slice(0, 10).map((product, index) => (
                            <div
                                key={product.product_id || index}
                                style={{
                                    padding: "16px 24px",
                                    borderBottom:
                                        index < topProducts.length - 1
                                            ? "1px solid #f1f3f4"
                                            : "none",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <div
                                        style={{
                                            fontWeight: "600",
                                            color: "#2c3e50",
                                            marginBottom: "4px",
                                        }}
                                    >
                                        #{index + 1}.{" "}
                                        {product.product_name ||
                                            "Producto sin nombre"}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            color: "#6c757d",
                                        }}
                                    >
                                        SKU: {product.product_sku || "N/A"}
                                    </div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div
                                        style={{
                                            fontSize: "18px",
                                            fontWeight: "700",
                                            color: "#28a745",
                                        }}
                                    >
                                        {product.total_quantity || 0} vendidos
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            color: "#6c757d",
                                        }}
                                    >
                                        $
                                        {(
                                            product.total_revenue || 0
                                        ).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Ventas por ubicación */}
            {validatedSalesByLocation && validatedSalesByLocation.length > 0 && !isLoading && (
                <div
                    style={{
                        backgroundColor: "white",
                        borderRadius: "16px",
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                        border: "1px solid #e9ecef",
                        marginBottom: "32px",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            padding: "24px",
                            borderBottom: "1px solid #e9ecef",
                            backgroundColor: "#f8f9fa",
                        }}
                    >
                        <h3
                            style={{
                                margin: 0,
                                fontSize: "20px",
                                fontWeight: "700",
                                color: "#2c3e50",
                            }}
                        >
                            🏢 Ventas por Sede
                        </h3>
                        <p style={{ margin: "8px 0 0 0", color: "#6c757d" }}>
                            Últimos {filters.days} días
                        </p>
                    </div>
                    <div style={{ padding: "0" }}>
                        {validatedSalesByLocation.map((location, index) => {
                            // Obtener los valores y manejar casos undefined/null
                            const totalAmount =
                                location.total_amount ||
                                location.total_revenue ||
                                0;
                            const averageSale = location.average_sale || 0;
                            const totalSales = location.total_sales || 0;
                            const locationName =
                                location.location_name || "Sede sin nombre";

                            // Verificar si el total fue calculado automáticamente
                            const wasCalculated =
                                location.total_amount > 0 &&
                                location.total_sales > 0 &&
                                location.average_sale > 0 &&
                                Math.abs(
                                    location.total_amount -
                                        location.total_sales *
                                            location.average_sale
                                ) < 1;

                            // Logging para debug individual
                            console.log(
                                `🏢 Renderizando sede ${locationName}:`,
                                {
                                    totalAmount,
                                    averageSale,
                                    totalSales,
                                    wasCalculated,
                                    originalData: location,
                                }
                            );

                            return (
                                <div
                                    key={location.location_id || index}
                                    style={{
                                        padding: "20px 24px",
                                        borderBottom:
                                            index <
                                            validatedSalesByLocation.length - 1
                                                ? "1px solid #f1f3f4"
                                                : "none",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        background:
                                            index % 2 === 0
                                                ? "#fff"
                                                : "#fafbfc",
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div
                                            style={{
                                                fontWeight: "700",
                                                color: "#2c3e50",
                                                marginBottom: "6px",
                                                fontSize: "16px",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                            }}
                                        >
                                            📍 {locationName}
                                            {wasCalculated && (
                                                <span
                                                    style={{
                                                        fontSize: "10px",
                                                        background: "#e3f2fd",
                                                        color: "#1976d2",
                                                        padding: "2px 6px",
                                                        borderRadius: "4px",
                                                        fontWeight: "500",
                                                    }}
                                                    title="Total calculado automáticamente"
                                                >
                                                    🧮 Calculado
                                                </span>
                                            )}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "14px",
                                                color: "#6c757d",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                            }}
                                        >
                                            <span>
                                                📊 {totalSales} ventas
                                                realizadas
                                            </span>
                                        </div>
                                    </div>
                                    <div
                                        style={{
                                            textAlign: "right",
                                            minWidth: "200px",
                                        }}
                                    >
                                        {/* TOTAL DE DINERO - El valor principal */}
                                        <div
                                            style={{
                                                fontSize: "22px",
                                                fontWeight: "800",
                                                color:
                                                    totalAmount > 0
                                                        ? "#28a745"
                                                        : "#dc3545",
                                                marginBottom: "4px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "flex-end",
                                                gap: "6px",
                                            }}
                                        >
                                            <span style={{ fontSize: "16px" }}>
                                                {totalAmount > 0 ? "💰" : "⚠️"}
                                            </span>
                                            <span>
                                                $
                                                {totalAmount.toLocaleString(
                                                    "es-CO",
                                                    {
                                                        minimumFractionDigits: 0,
                                                        maximumFractionDigits: 0,
                                                    }
                                                )}
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "13px",
                                                fontWeight: "600",
                                                color:
                                                    totalAmount > 0
                                                        ? "#28a745"
                                                        : "#dc3545",
                                                marginBottom: "8px",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.5px",
                                            }}
                                        >
                                            {totalAmount > 0
                                                ? "💸 TOTAL REGISTRADO"
                                                : "⚠️ SIN TOTAL"}
                                        </div>

                                        {/* Línea separadora */}
                                        <div
                                            style={{
                                                height: "1px",
                                                backgroundColor: "#e9ecef",
                                                margin: "8px 0",
                                            }}
                                        />

                                        {/* PROMEDIO - Valor secundario */}
                                        <div
                                            style={{
                                                fontSize: "16px",
                                                fontWeight: "600",
                                                color: "#6c757d",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "flex-end",
                                                gap: "6px",
                                            }}
                                        >
                                            <span style={{ fontSize: "12px" }}>
                                                📈
                                            </span>
                                            <span>
                                                Promedio: $
                                                {averageSale.toLocaleString(
                                                    "es-CO",
                                                    {
                                                        minimumFractionDigits: 0,
                                                        maximumFractionDigits: 0,
                                                    }
                                                )}
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "11px",
                                                color: "#adb5bd",
                                                marginTop: "2px",
                                            }}
                                        >
                                            por venta individual
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Resumen total de todas las sedes */}
                    {validatedSalesByLocation.length > 1 && (
                        <div
                            style={{
                                padding: "20px 24px",
                                backgroundColor: "#f8f9fa",
                                borderTop: "2px solid #e9ecef",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <div
                                    style={{
                                        fontWeight: "800",
                                        color: "#2c3e50",
                                        marginBottom: "6px",
                                        fontSize: "18px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    🏢 TOTAL TODAS LAS SEDES
                                </div>
                                <div
                                    style={{
                                        fontSize: "14px",
                                        color: "#6c757d",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <span>
                                        📊{" "}
                                        {validatedSalesByLocation.reduce(
                                            (total, location) =>
                                                total +
                                                (location.total_sales || 0),
                                            0
                                        )}{" "}
                                        ventas en{" "}
                                        {validatedSalesByLocation.length} sedes
                                    </span>
                                </div>
                            </div>
                            <div
                                style={{
                                    textAlign: "right",
                                    minWidth: "200px",
                                }}
                            >
                                {/* TOTAL GENERAL */}
                                <div
                                    style={{
                                        fontSize: "26px",
                                        fontWeight: "900",
                                        color: "#28a745",
                                        marginBottom: "4px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "flex-end",
                                        gap: "8px",
                                    }}
                                >
                                    <span style={{ fontSize: "20px" }}>💰</span>
                                    <span>
                                        $
                                        {validatedSalesByLocation
                                            .reduce(
                                                (total, location) =>
                                                    total +
                                                    (location.total_amount ||
                                                        location.total_revenue ||
                                                        0),
                                                0
                                            )
                                            .toLocaleString("es-CO", {
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 0,
                                            })}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        fontSize: "14px",
                                        fontWeight: "700",
                                        color: "#28a745",
                                        marginBottom: "8px",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                    }}
                                >
                                    💸 TOTAL GENERAL
                                </div>

                                {/* Línea separadora */}
                                <div
                                    style={{
                                        height: "1px",
                                        backgroundColor: "#dee2e6",
                                        margin: "8px 0",
                                    }}
                                />

                                {/* PROMEDIO GENERAL */}
                                <div
                                    style={{
                                        fontSize: "16px",
                                        fontWeight: "600",
                                        color: "#6c757d",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "flex-end",
                                        gap: "6px",
                                    }}
                                >
                                    <span style={{ fontSize: "12px" }}>📈</span>
                                    <span>
                                        Promedio general: $
                                        {(() => {
                                            const totalSales =
                                                validatedSalesByLocation.reduce(
                                                    (total, location) =>
                                                        total +
                                                        (location.total_sales ||
                                                            0),
                                                    0
                                                );
                                            const totalAmount =
                                                validatedSalesByLocation.reduce(
                                                    (total, location) =>
                                                        total +
                                                        (location.total_amount ||
                                                            location.total_revenue ||
                                                            0),
                                                    0
                                                );
                                            return totalSales > 0
                                                ? totalAmount / totalSales
                                                : 0;
                                        })().toLocaleString("es-CO", {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0,
                                        })}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        fontSize: "11px",
                                        color: "#adb5bd",
                                        marginTop: "2px",
                                    }}
                                >
                                    por venta entre todas las sedes
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Ventas detalladas (cuando se usa fecha específica) */}
            {filteredDetailedSales.length > 0 && !isLoading && (
                <div
                    style={{
                        backgroundColor: "white",
                        borderRadius: "16px",
                        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                        border: "1px solid #e9ecef",
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            padding: "24px",
                            borderBottom: "1px solid #e9ecef",
                            backgroundColor: "#f8f9fa",
                        }}
                    >
                        <h3
                            style={{
                                margin: 0,
                                fontSize: "20px",
                                fontWeight: "700",
                                color: "#2c3e50",
                            }}
                        >
                            📋 Ventas Detalladas
                        </h3>
                        <p style={{ margin: "8px 0 0 0", color: "#6c757d" }}>
                            {filters.specificDate} -{" "}
                            {filteredDetailedSales.length} ventas
                        </p>
                    </div>
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
                                            "linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)",
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
                                        🆔 ID
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
                                        👤 Cliente
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
                                        🏢 Sede
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
                                        💰 Total
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
                                        🏪 Tipo
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
                                        📦 Items
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDetailedSales.map((sale, index) => (
                                    <tr
                                        key={sale.id}
                                        onClick={() => handleSaleClick(sale)}
                                        style={{
                                            backgroundColor:
                                                index % 2 === 0
                                                    ? "#fff"
                                                    : "#f8f9fa",
                                            cursor: "pointer",
                                            transition: "all 0.2s ease",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.backgroundColor =
                                                "#e3f2fd";
                                            e.currentTarget.style.transform =
                                                "translateY(-1px)";
                                            e.currentTarget.style.boxShadow =
                                                "0 2px 8px rgba(0,0,0,0.1)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.backgroundColor =
                                                index % 2 === 0
                                                    ? "#fff"
                                                    : "#f8f9fa";
                                            e.currentTarget.style.transform =
                                                "translateY(0)";
                                            e.currentTarget.style.boxShadow =
                                                "none";
                                        }}
                                    >
                                        <td
                                            style={{
                                                padding: "16px 12px",
                                                borderBottom:
                                                    "1px solid #e9ecef",
                                                fontSize: "14px",
                                                fontWeight: "700",
                                                color: "#2c3e50",
                                            }}
                                        >
                                            #{sale.id}
                                        </td>
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
                                            {sale.customer_name}
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
                                            {sale.sede}
                                        </td>
                                        <td
                                            style={{
                                                padding: "16px 12px",
                                                borderBottom:
                                                    "1px solid #e9ecef",
                                                textAlign: "center",
                                                fontSize: "16px",
                                                fontWeight: "700",
                                                color: "#27ae60",
                                            }}
                                        >
                                            ${sale.total.toLocaleString()}
                                        </td>
                                        <td
                                            style={{
                                                padding: "16px 12px",
                                                borderBottom:
                                                    "1px solid #e9ecef",
                                                textAlign: "center",
                                            }}
                                        >
                                            {(() => {
                                                const t = getSaleTypeLabel(sale.sale_type);
                                                return (
                                                    <span style={{
                                                        background: t.bg,
                                                        color: t.color,
                                                        fontWeight: 600,
                                                        borderRadius: 12,
                                                        padding: '4px 14px',
                                                        fontSize: 14,
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                    }}>
                                                        <span>{t.icon}</span> {t.label}
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td
                                            style={{
                                                padding: "16px 12px",
                                                borderBottom:
                                                    "1px solid #e9ecef",
                                                textAlign: "center",
                                                fontSize: "16px",
                                                fontWeight: "700",
                                                color: "#2c3e50",
                                            }}
                                        >
                                            {sale.items_count}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Tabla de devoluciones con el mismo estilo que ventas detalladas */}
            {returns && returns.length > 0 && (
                <div style={{
                    background: '#fff',
                    borderRadius: 16,
                    boxShadow: '0 2px 12px rgba(220,53,69,0.10)',
                    margin: '32px 0',
                    padding: 0,
                    overflow: 'hidden',
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: '#ffe5e8',
                        padding: '18px 32px',
                        borderBottom: '2px solid #dc3545',
                    }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ marginRight: 12 }}>
                            <circle cx="12" cy="12" r="12" fill="#dc3545"/>
                            <path d="M8 12l2 2 4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <h3 style={{ color: '#dc3545', fontWeight: 700, fontSize: 20, margin: 0 }}>
                            Devoluciones del Día
                        </h3>
                        <span style={{ marginLeft: 16, color: '#dc3545', fontWeight: 500, fontSize: 16 }}>
                                                         {returns ? returns.length : 0} devolución{(returns ? returns.length : 0) !== 1 ? 'es' : ''}
                        </span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
                        <thead>
                            <tr style={{ background: '#ffe5e8' }}>
                                <th style={{ color: '#dc3545', fontWeight: 700, padding: '12px 8px', textAlign: 'left', borderBottom: '2px solid #dc3545' }}>ID</th>
                                <th style={{ color: '#dc3545', fontWeight: 700, padding: '12px 8px', textAlign: 'left', borderBottom: '2px solid #dc3545' }}>Fecha/Hora</th>
                                <th style={{ color: '#dc3545', fontWeight: 700, padding: '12px 8px', textAlign: 'left', borderBottom: '2px solid #dc3545' }}>Monto</th>
                                <th style={{ color: '#dc3545', fontWeight: 700, padding: '12px 8px', textAlign: 'left', borderBottom: '2px solid #dc3545' }}>Motivo</th>
                                <th style={{ color: '#dc3545', fontWeight: 700, padding: '12px 8px', textAlign: 'left', borderBottom: '2px solid #dc3545' }}>Productos devueltos</th>
                            </tr>
                        </thead>
                        <tbody>
                                                         {returns && returns.map((d, idx) => (
                                <tr key={d.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fff6f7' }} onClick={() => handleReturnClick(d)}>
                                    {[
                                        <td key="id" style={{ padding: '12px 8px', color: '#dc3545', fontWeight: 600, cursor: 'pointer' }} onMouseOver={e => { e.currentTarget.style.background = '#ffe5e8'; e.currentTarget.style.color = '#dc3545'; }} onMouseOut={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#dc3545'; }}>#{d.id}</td>,
                                        <td key="fecha" style={{ padding: '12px 8px', cursor: 'pointer' }} onMouseOver={e => { e.currentTarget.style.background = '#ffe5e8'; e.currentTarget.style.color = '#dc3545'; }} onMouseOut={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = ''; }}>{
                                            d.return_date ? new Date(d.return_date).toLocaleString() :
                                            d.created_at ? new Date(d.created_at).toLocaleString() :
                                            '-'
                                        }</td>,
                                        <td key="monto" style={{ padding: '12px 8px', color: '#dc3545', fontWeight: 700, cursor: 'pointer' }} onMouseOver={e => { e.currentTarget.style.background = '#ffe5e8'; e.currentTarget.style.color = '#dc3545'; }} onMouseOut={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#dc3545'; }}>${parseFloat(d.total_amount).toLocaleString()}</td>,
                                        <td key="motivo" style={{ padding: '12px 8px', cursor: 'pointer' }} onMouseOver={e => { e.currentTarget.style.background = '#ffe5e8'; e.currentTarget.style.color = '#dc3545'; }} onMouseOut={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = ''; }}>{
                                            d.reason_display ? d.reason_display :
                                            d.reason ? d.reason.charAt(0).toUpperCase() + d.reason.slice(1) :
                                            '-'
                                        }</td>,
                                        <td key="productos" style={{ padding: '12px 8px', cursor: 'pointer' }} onMouseOver={e => { e.currentTarget.style.background = '#ffe5e8'; e.currentTarget.style.color = '#dc3545'; }} onMouseOut={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = ''; }}>
                                            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                                                {(d.items || []).map((item, i) => (
                                                    <li key={i} style={{ marginBottom: 4 }}>
                                                        <span style={{ color: '#dc3545', fontWeight: 600 }}>{item.product_details?.name || item.product}</span>
                                                        {': '}
                                                        <span style={{ fontWeight: 500 }}>{item.quantity_returned}</span>
                                                        {' x $'}
                                                        <span style={{ fontWeight: 500 }}>{parseFloat(item.unit_price).toLocaleString()}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </td>
                                    ]}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Desglose de abonos a créditos */}
            {creditPayments && creditPayments.length > 0 && (
                <div style={{
                    background: '#fff',
                    borderRadius: 16,
                    boxShadow: '0 2px 12px rgba(0,184,148,0.10)',
                    margin: '32px 0',
                    padding: 0,
                    overflow: 'hidden',
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        background: '#e0f7fa',
                        padding: '18px 32px',
                        borderBottom: '2px solid #00b894',
                    }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ marginRight: 12 }}>
                            <circle cx="12" cy="12" r="12" fill="#00b894"/>
                            <path d="M12 7v5l4 2" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <h3 style={{ color: '#00b894', fontWeight: 700, fontSize: 20, margin: 0 }}>
                            Abonos a Créditos del Día
                        </h3>
                        <span style={{ marginLeft: 16, color: '#00b894', fontWeight: 500, fontSize: 16 }}>
                                                         {creditPayments ? creditPayments.length : 0} abono{(creditPayments ? creditPayments.length : 0) !== 1 ? 's' : ''}
                        </span>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
                        <thead>
                            <tr style={{ background: '#e0f7fa' }}>
                                <th style={{ color: '#00b894', fontWeight: 700, padding: '12px 8px', textAlign: 'left', borderBottom: '2px solid #00b894' }}>ID</th>
                                <th style={{ color: '#00b894', fontWeight: 700, padding: '12px 8px', textAlign: 'left', borderBottom: '2px solid #00b894' }}>Fecha/Hora</th>
                                <th style={{ color: '#00b894', fontWeight: 700, padding: '12px 8px', textAlign: 'left', borderBottom: '2px solid #00b894' }}>Monto</th>
                                <th style={{ color: '#00b894', fontWeight: 700, padding: '12px 8px', textAlign: 'left', borderBottom: '2px solid #00b894' }}>Observaciones</th>
                            </tr>
                        </thead>
                        <tbody>
                                                         {creditPayments && creditPayments.map((p, idx) => (
                                <tr key={p.id} style={{ background: idx % 2 === 0 ? '#fff' : '#eafaf1' }} onClick={() => handlePaymentClick(p)}>
                                    <td style={{ padding: '12px 8px', color: '#00b894', fontWeight: 600, cursor: 'pointer' }} onMouseOver={e => { e.currentTarget.style.background = '#e0f7fa'; e.currentTarget.style.color = '#00b894'; }} onMouseOut={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#00b894'; }}>#{p.id}</td>
                                    <td style={{ padding: '12px 8px', cursor: 'pointer' }} onMouseOver={e => { e.currentTarget.style.background = '#e0f7fa'; e.currentTarget.style.color = '#00b894'; }} onMouseOut={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = ''; }}>{p.payment_date ? new Date(p.payment_date).toLocaleString() : '-'}</td>
                                    <td style={{ padding: '12px 8px', color: '#00b894', fontWeight: 700, cursor: 'pointer' }} onMouseOver={e => { e.currentTarget.style.background = '#e0f7fa'; e.currentTarget.style.color = '#00b894'; }} onMouseOut={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#00b894'; }}>+${parseFloat(p.amount_paid).toLocaleString()}</td>
                                    <td style={{ padding: '12px 8px', cursor: 'pointer' }} onMouseOver={e => { e.currentTarget.style.background = '#e0f7fa'; e.currentTarget.style.color = '#00b894'; }} onMouseOut={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = ''; }}>{p.notes || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Información sobre problemas de datos */}
            {validatedSalesByLocation && validatedSalesByLocation.length === 0 &&
                salesStats === null &&
                filters.days &&
                !isLoading && (
                    <div
                        style={{
                            backgroundColor: "#fff3cd",
                            border: "1px solid #ffeaa7",
                            borderRadius: "12px",
                            padding: "20px",
                            marginBottom: "24px",
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "12px",
                        }}
                    >
                        <div style={{ fontSize: "24px" }}>💡</div>
                        <div style={{ flex: 1 }}>
                            <h4
                                style={{
                                    margin: "0 0 8px 0",
                                    color: "#856404",
                                    fontSize: "16px",
                                }}
                            >
                                Información sobre totales por sede
                            </h4>
                            <p
                                style={{
                                    margin: "0 0 12px 0",
                                    color: "#856404",
                                    fontSize: "14px",
                                }}
                            >
                                Si no ves el total de dinero por sede, puede
                                deberse a:
                            </p>
                            <ul
                                style={{
                                    margin: "0 0 0 20px",
                                    color: "#856404",
                                    fontSize: "14px",
                                }}
                            >
                                <li>
                                    No hay ventas registradas en el período
                                    seleccionado ({filters.days} días)
                                </li>
                                <li>
                                    El sistema está calculando los totales
                                    automáticamente
                                </li>
                                <li>
                                    Verifica que las ventas tengan asignada una
                                    sede correctamente
                                </li>
                            </ul>
                            <p
                                style={{
                                    margin: "12px 0 0 0",
                                    color: "#856404",
                                    fontSize: "13px",
                                    fontStyle: "italic",
                                }}
                            >
                                💬 Los totales se muestran prominentemente en
                                verde, y los promedios en gris más pequeño
                            </p>
                        </div>
                    </div>
                )}

            {/* Estado vacío */}
            {!isLoading &&
                !error &&
                !salesStats &&
                filteredDetailedSales.length === 0 && (
                    <div
                        style={{
                            padding: "64px 24px",
                            textAlign: "center",
                            backgroundColor: "#f8f9fa",
                            borderRadius: "16px",
                            border: "2px dashed #dee2e6",
                        }}
                    >
                        <div style={{ fontSize: "48px", marginBottom: "16px" }}>
                            📊
                        </div>
                        <h3
                            style={{
                                margin: "0 0 8px 0",
                                color: "#6c757d",
                                fontWeight: "600",
                            }}
                        >
                            Selecciona un período para ver las estadísticas
                        </h3>
                        <p style={{ margin: 0, color: "#6c757d" }}>
                            Usa los filtros arriba para elegir un período o
                            fecha específica
                        </p>
                    </div>
                )}

            {/* Modal de detalle de venta */}
            <SaleDetailModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                saleData={selectedSaleData}
            />

            {/* Modal de detalle de devolución */}
            <ReturnDetailModal
                isOpen={isReturnModalOpen}
                onClose={handleCloseReturnModal}
                returnData={selectedReturnData}
            />

            {/* Modal de detalle de abono */}
            <PaymentDetailModal
                isOpen={isPaymentModalOpen}
                onClose={handleClosePaymentModal}
                paymentData={selectedPaymentData}
            />

            <style>
                {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
            </style>
        </div>
    );
};

export default VentasSection;