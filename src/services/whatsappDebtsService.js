import API_CONFIG from "../config/api.js";

// API URL para deudas con WhatsApp
const API_WHATSAPP_DEBTS_URL = `${API_CONFIG.BASE_URL}/credits/purchase-accounts/overdue_with_whatsapp/`;

/**
 * Construir URL con parámetros de consulta
 */
const buildUrlWithParams = (baseUrl, params = {}) => {
    const url = new URL(baseUrl, window.location.origin);
    Object.keys(params).forEach((key) => {
        if (
            params[key] !== null &&
            params[key] !== undefined &&
            params[key] !== ""
        ) {
            url.searchParams.append(key, params[key]);
        }
    });
    return url.toString();
};

/**
 * Obtener deudas vencidas con URLs de WhatsApp
 * @param {Object} params - Parámetros de filtro
 * @param {boolean} params.include_upcoming - Incluir próximas a vencer
 * @param {number} params.upcoming_days - Días de anticipación para recordatorios
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Datos de deudas con WhatsApp
 */
export const getOverdueDebtsWithWhatsApp = async (params = {}, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    const url = buildUrlWithParams(API_WHATSAPP_DEBTS_URL, params);

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching overdue debts with WhatsApp:", error);
        throw error;
    }
};

/**
 * Calcular estadísticas básicas de las deudas
 * @param {Array} debts - Lista de deudas
 * @returns {Object} - Estadísticas calculadas
 */
export const calculateDebtStats = (debts) => {
    if (!debts || debts.length === 0) {
        return {
            total_debts: 0,
            total_amount: 0,
            overdue_count: 0,
            upcoming_count: 0,
            with_phone_count: 0,
            urgent_count: 0,
        };
    }

    const stats = {
        total_debts: debts.length,
        total_amount: debts.reduce(
            (sum, debt) => sum + parseFloat(debt.remaining_amount || 0),
            0
        ),
        overdue_count: debts.filter((debt) => debt.days_overdue > 0).length,
        upcoming_count: debts.filter((debt) => debt.status === "proximo")
            .length,
        with_phone_count: debts.filter((debt) => debt.has_phone).length,
        urgent_count: debts.filter((debt) => debt.days_overdue >= 15).length,
    };

    return stats;
};

/**
 * Obtener el color de urgencia basado en los días de vencimiento
 * @param {number} daysOverdue - Días de vencimiento
 * @param {string} status - Estado de la deuda
 * @returns {string} - Clase CSS para el color de urgencia
 */
export const getUrgencyClass = (daysOverdue, status) => {
    if (status === "proximo") {
        return "urgency-upcoming";
    } else if (daysOverdue >= 16) {
        return "urgency-high";
    } else if (daysOverdue >= 6) {
        return "urgency-medium";
    } else if (daysOverdue >= 1) {
        return "urgency-low";
    } else {
        return "urgency-upcoming";
    }
};

/**
 * Formatear el monto a moneda local
 * @param {number|string} amount - Monto a formatear
 * @returns {string} - Monto formateado
 */
export const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount || 0);
    return numAmount.toLocaleString("es-CL", {
        style: "currency",
        currency: "CLP",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
};

/**
 * Filtrar deudas según los criterios especificados
 * @param {Array} debts - Lista de deudas
 * @param {Object} filters - Filtros a aplicar
 * @returns {Array} - Lista de deudas filtradas
 */
export const filterDebts = (debts, filters) => {
    if (!debts || debts.length === 0) {
        return [];
    }

    let filteredDebts = [...debts];

    // Filtrar solo con teléfono
    if (filters.onlyWithPhone) {
        filteredDebts = filteredDebts.filter((debt) => debt.has_phone);
    }

    // Filtrar por búsqueda de texto
    if (filters.searchTerm && filters.searchTerm.trim()) {
        const searchLower = filters.searchTerm.toLowerCase();
        filteredDebts = filteredDebts.filter(
            (debt) =>
                debt.supplier_name?.toLowerCase().includes(searchLower) ||
                debt.contact_name?.toLowerCase().includes(searchLower) ||
                debt.phone?.includes(searchLower)
        );
    }

    return filteredDebts;
};
