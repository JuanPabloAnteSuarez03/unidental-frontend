// Servicio optimizado para estadísticas de ventas usando endpoints especializados
import { API_CONFIG } from "../config/api";

class SalesStatsService {
    /**
     * Obtiene estadísticas de ventas optimizadas del backend
     * @param {number} days - Número de días hacia atrás (default: 30)
     * @param {string} token - Token de autenticación
     * @returns {Promise<Object>} Estadísticas: total_sales, total_revenue, average_sale_value, sales_by_type
     */
    async getSalesStatistics(days = 30, token) {
        try {
            console.log(
                `📊 Obteniendo estadísticas de ventas (${days} días)...`
            );

            const response = await fetch(
                `${API_CONFIG.BASE_URL}/api/sales/sales/statistics/?days=${days}`,
                {
                    headers: {
                        Authorization: `Token ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Error ${response.status}: ${response.statusText}`
                );
            }

            const stats = await response.json();
            console.log("✅ Estadísticas de ventas obtenidas:", stats);

            return {
                totalSales: stats.total_sales || 0,
                totalRevenue: stats.total_revenue || 0,
                averageSale: stats.average_sale_value || 0,
                salesByType: stats.sales_by_type || [],
                // Mantener compatibilidad con el código existente
                uniqueCustomers: 0, // Este dato no viene del endpoint, se puede calcular por separado si es necesario
            };
        } catch (error) {
            console.error("❌ Error al obtener estadísticas de ventas:", error);
            throw error;
        }
    }

    /**
     * Obtiene estadísticas de ventas por ubicación/sede
     * @param {number} days - Número de días hacia atrás (default: 30)
     * @param {string} token - Token de autenticación
     * @returns {Promise<Array>} Array de estadísticas por ubicación
     */
    async getSalesByLocation(days = 30, token) {
        try {
            console.log(`🏢 Obteniendo ventas por ubicación (${days} días)...`);

            const response = await fetch(
                `${API_CONFIG.BASE_URL}/api/sales/sales/by_location/?days=${days}`,
                {
                    headers: {
                        Authorization: `Token ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Error ${response.status}: ${response.statusText}`
                );
            }

            const locationStats = await response.json();
            console.log(
                "✅ Estadísticas por ubicación obtenidas:",
                locationStats
            );

            // Transformar datos para compatibilidad con el código existente
            const sedeCounts = {};
            const locationData = {};

            locationStats.forEach((location) => {
                sedeCounts[location.location_name] = location.total_sales;
                locationData[location.location_name] = {
                    id: location.location_id,
                    name: location.location_name,
                    type: location.location_type,
                    totalSales: location.total_sales,
                    totalRevenue: location.total_revenue,
                    averageSale: location.average_sale,
                };
            });

            return {
                sedeCounts,
                locationData,
                rawData: locationStats,
            };
        } catch (error) {
            console.error("❌ Error al obtener ventas por ubicación:", error);
            throw error;
        }
    }

    /**
     * Obtiene las ventas del día actual
     * @param {string} token - Token de autenticación
     * @returns {Promise<Array>} Array de ventas del día actual
     */
    async getTodaySales(token) {
        try {
            console.log("📅 Obteniendo ventas de hoy...");

            const response = await fetch(
                `${API_CONFIG.BASE_URL}/api/sales/sales/today/`,
                {
                    headers: {
                        Authorization: `Token ${token}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Error ${response.status}: ${response.statusText}`
                );
            }

            const todaySales = await response.json();
            console.log("✅ Ventas de hoy obtenidas:", todaySales);

            return {
                sales: todaySales.results || todaySales || [],
                count:
                    todaySales.count ||
                    (Array.isArray(todaySales) ? todaySales.length : 0),
                totalRevenue: (todaySales.results || todaySales || []).reduce(
                    (sum, sale) =>
                        sum +
                        parseFloat(
                            sale.total_net ||
                                sale.total_gross ||
                                sale.total ||
                                0
                        ),
                    0
                ),
            };
        } catch (error) {
            console.error("❌ Error al obtener ventas de hoy:", error);
            throw error;
        }
    }

    /**
     * Función inteligente que selecciona el mejor endpoint según los filtros
     * @param {Object} filters - Filtros aplicados
     * @param {string} token - Token de autenticación
     * @returns {Promise<Object>} Datos optimizados según el contexto
     */
    async getOptimizedSalesData(filters, token) {
        try {
            const { startDate, endDate } = filters;

            // Si es solo hoy, usar endpoint específico
            const today = new Date().toISOString().split("T")[0];
            if (startDate === today && endDate === today) {
                console.log("🎯 Usando endpoint optimizado para ventas de hoy");
                return await this.getTodaySales(token);
            }

            // Si necesita estadísticas agregadas, calcular días y usar endpoint de stats
            if (startDate && endDate) {
                const startDateObj = new Date(startDate);
                const endDateObj = new Date(endDate);
                const diffTime = Math.abs(endDateObj - startDateObj);
                const diffDays =
                    Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                console.log(
                    `🎯 Usando endpoint de estadísticas para ${diffDays} días`
                );

                const [stats, locationStats] = await Promise.all([
                    this.getSalesStatistics(diffDays, token),
                    this.getSalesByLocation(diffDays, token),
                ]);

                return {
                    type: "statistics",
                    stats,
                    locationStats,
                    period: diffDays,
                };
            }

            // Por defecto, usar estadísticas de 30 días
            console.log("🎯 Usando estadísticas por defecto (30 días)");
            const [stats, locationStats] = await Promise.all([
                this.getSalesStatistics(30, token),
                this.getSalesByLocation(30, token),
            ]);

            return {
                type: "statistics",
                stats,
                locationStats,
                period: 30,
            };
        } catch (error) {
            console.error("❌ Error en getOptimizedSalesData:", error);
            throw error;
        }
    }
}

// Exportar instancia singleton
const salesStatsService = new SalesStatsService();
export default salesStatsService;
