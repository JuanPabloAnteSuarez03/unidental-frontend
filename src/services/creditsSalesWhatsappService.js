import API_CONFIG from "../config/api.js";

// API URL para cuentas de crédito de ventas con WhatsApp
const API_CREDITS_SALES_WHATSAPP_URL = `${API_CONFIG.BASE_URL}/credits/accounts/overdue_with_whatsapp/`;

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
 * Obtener cuentas de crédito con URLs de WhatsApp
 * @param {Object} params - Parámetros de filtro
 * @param {boolean} params.include_upcoming - Incluir próximas a vencer (default: false)
 * @param {number} params.upcoming_days - Días de anticipación para recordatorios (default: 7)
 * @param {boolean} params.include_all - Incluir TODOS los créditos activos (ignora fechas)
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Datos de cuentas de crédito con WhatsApp
 */
export const getCreditAccountsWithWhatsApp = async (params = {}, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    const url = buildUrlWithParams(API_CREDITS_SALES_WHATSAPP_URL, params);

    try {
        const response = await fetch(url, {
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            console.warn(`API endpoint not found: ${url}`);

            // Datos de prueba temporales con diferentes tipos de cuentas
            let mockAccounts = [
                // CUENTAS VENCIDAS
                {
                    id: 1,
                    customer_name: "Juan Pérez",
                    customer_phone: "956789123",
                    customer_email: "juan.perez@email.com",
                    remaining_amount: "150000",
                    days_overdue: 15,
                    reference_date: "2024-01-15",
                    status: "vencido",
                    has_phone: true,
                    whatsapp_url:
                        "https://wa.me/56956789123?text=Estimado%20Juan%20Pérez%2C%20le%20recordamos%20que%20tiene%20una%20cuenta%20pendiente%20de%20%24150%2C000%20vencida%20hace%2015%20días.",
                    whatsapp_message:
                        "Estimado Juan Pérez, le recordamos que tiene una cuenta pendiente de $150,000 vencida hace 15 días. Por favor, póngase en contacto con nosotros para coordinar el pago.",
                },
                {
                    id: 2,
                    customer_name: "María González",
                    customer_phone: "987654321",
                    customer_email: "maria.gonzalez@email.com",
                    remaining_amount: "85000",
                    days_overdue: 7,
                    reference_date: "2024-01-23",
                    status: "vencido",
                    has_phone: true,
                    whatsapp_url:
                        "https://wa.me/56987654321?text=Estimada%20María%20González%2C%20le%20recordamos%20que%20tiene%20una%20cuenta%20pendiente%20de%20%2485%2C000%20vencida%20hace%207%20días.",
                    whatsapp_message:
                        "Estimada María González, le recordamos que tiene una cuenta pendiente de $85,000 vencida hace 7 días. Por favor, póngase en contacto con nosotros para coordinar el pago.",
                },
                {
                    id: 3,
                    customer_name: "Carlos Rodríguez",
                    customer_phone: "",
                    customer_email: "carlos.rodriguez@email.com",
                    remaining_amount: "200000",
                    days_overdue: 25,
                    reference_date: "2024-01-05",
                    status: "vencido",
                    has_phone: false,
                    whatsapp_url: "",
                    whatsapp_message: "Sin teléfono registrado",
                },
                // CUENTAS PRÓXIMAS A VENCER
                {
                    id: 4,
                    customer_name: "Ana López",
                    customer_phone: "912345678",
                    customer_email: "ana.lopez@email.com",
                    remaining_amount: "120000",
                    days_overdue: -2,
                    reference_date: "2024-02-02",
                    status: "proximo",
                    has_phone: true,
                    whatsapp_url:
                        "https://wa.me/56912345678?text=Estimada%20Ana%20López%2C%20le%20recordamos%20que%20tiene%20una%20cuenta%20de%20%24120%2C000%20próxima%20a%20vencer%20en%202%20días.",
                    whatsapp_message:
                        "Estimada Ana López, le recordamos que tiene una cuenta de $120,000 próxima a vencer en 2 días. Por favor, esté atenta a la fecha de vencimiento.",
                },
                {
                    id: 5,
                    customer_name: "Pedro Silva",
                    customer_phone: "945123678",
                    customer_email: "pedro.silva@email.com",
                    remaining_amount: "75000",
                    days_overdue: -5,
                    reference_date: "2024-02-05",
                    status: "proximo",
                    has_phone: true,
                    whatsapp_url:
                        "https://wa.me/56945123678?text=Estimado%20Pedro%20Silva%2C%20le%20recordamos%20que%20tiene%20una%20cuenta%20de%20%2475%2C000%20próxima%20a%20vencer%20en%205%20días.",
                    whatsapp_message:
                        "Estimado Pedro Silva, le recordamos que tiene una cuenta de $75,000 próxima a vencer en 5 días. Por favor, esté atento a la fecha de vencimiento.",
                },
                // CUENTAS ACTIVAS (para include_all)
                {
                    id: 6,
                    customer_name: "Laura Morales",
                    customer_phone: "923456789",
                    customer_email: "laura.morales@email.com",
                    remaining_amount: "180000",
                    days_overdue: -30,
                    reference_date: "2024-03-01",
                    status: "activo",
                    has_phone: true,
                    whatsapp_url:
                        "https://wa.me/56923456789?text=Estimada%20Laura%20Morales%2C%20le%20informamos%20sobre%20su%20cuenta%20activa%20de%20%24180%2C000.",
                    whatsapp_message:
                        "Estimada Laura Morales, le informamos sobre su cuenta activa de $180,000. Su próximo vencimiento es el 1 de marzo.",
                },
                {
                    id: 7,
                    customer_name: "Roberto Fernández",
                    customer_phone: "",
                    customer_email: "roberto.fernandez@email.com",
                    remaining_amount: "95000",
                    days_overdue: -45,
                    reference_date: "2024-03-15",
                    status: "activo",
                    has_phone: false,
                    whatsapp_url: "",
                    whatsapp_message: "Sin teléfono registrado",
                },
                {
                    id: 8,
                    customer_name: "Sofia Vargas",
                    customer_phone: "934567891",
                    customer_email: "sofia.vargas@email.com",
                    remaining_amount: "320000",
                    days_overdue: -60,
                    reference_date: "2024-04-01",
                    status: "activo",
                    has_phone: true,
                    whatsapp_url:
                        "https://wa.me/56934567891?text=Estimada%20Sofia%20Vargas%2C%20le%20informamos%20sobre%20su%20cuenta%20activa%20de%20%24320%2C000.",
                    whatsapp_message:
                        "Estimada Sofia Vargas, le informamos sobre su cuenta activa de $320,000. Su próximo vencimiento es el 1 de abril.",
                },
            ];

            // Filtrar según los parámetros recibidos
            if (params.include_all) {
                // Mostrar TODAS las cuentas activas (ignora fechas)
                console.log("🔧 Modo: TODOS los créditos activos");
            } else {
                // Modo por defecto: solo vencidos y próximos a vencer
                mockAccounts = mockAccounts.filter((account) => {
                    if (account.status === "vencido") return true;

                    if (
                        params.include_upcoming &&
                        account.status === "proximo"
                    ) {
                        const upcomingDays = params.upcoming_days || 7;
                        return Math.abs(account.days_overdue) <= upcomingDays;
                    }

                    return false;
                });

                const mode = params.include_upcoming
                    ? "Vencidos + Próximos a vencer"
                    : "Solo vencidos";
                console.log(`🔧 Modo: ${mode}`);
            }

            const mockData = {
                overdue_accounts: mockAccounts,
                total_count: mockAccounts.length,
            };

            console.log(
                "🔧 Usando datos de prueba temporales para cuentas de crédito"
            );
            console.log(
                `📊 Total de cuentas filtradas: ${mockAccounts.length}`
            );
            return mockData;
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(
            "Error fetching overdue credit accounts with WhatsApp:",
            error
        );
        throw error;
    }
};

/**
 * Calcular estadísticas básicas de las cuentas de crédito
 * @param {Array} accounts - Lista de cuentas de crédito
 * @returns {Object} - Estadísticas calculadas
 */
export const calculateCreditAccountStats = (accounts) => {
    if (!accounts || accounts.length === 0) {
        return {
            total_accounts: 0,
            total_amount: 0,
            overdue_count: 0,
            upcoming_count: 0,
            with_phone_count: 0,
            urgent_count: 0,
        };
    }

    const stats = {
        total_accounts: accounts.length,
        total_amount: accounts.reduce(
            (sum, account) => sum + parseFloat(account.remaining_amount || 0),
            0
        ),
        overdue_count: accounts.filter(
            (account) => account.status === "vencido"
        ).length,
        upcoming_count: accounts.filter(
            (account) => account.status === "proximo"
        ).length,
        active_count: accounts.filter((account) => account.status === "activo")
            .length,
        with_phone_count: accounts.filter((account) => account.has_phone)
            .length,
        urgent_count: accounts.filter(
            (account) =>
                account.status === "vencido" && account.days_overdue >= 15
        ).length,
    };

    return stats;
};

/**
 * Obtener el color de urgencia basado en los días de vencimiento
 * @param {number} daysOverdue - Días de vencimiento
 * @param {string} status - Estado de la cuenta
 * @returns {string} - Clase CSS para el color de urgencia
 */
export const getUrgencyClass = (daysOverdue, status) => {
    if (status === "proximo") {
        return "urgency-upcoming";
    } else if (status === "activo") {
        return "urgency-active";
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
 * Filtrar cuentas de crédito según los criterios especificados
 * @param {Array} accounts - Lista de cuentas de crédito
 * @param {Object} filters - Filtros a aplicar
 * @returns {Array} - Lista de cuentas filtradas
 */
export const filterCreditAccounts = (accounts, filters) => {
    if (!accounts || accounts.length === 0) {
        return [];
    }

    let filteredAccounts = [...accounts];

    // Filtrar solo con teléfono
    if (filters.onlyWithPhone) {
        filteredAccounts = filteredAccounts.filter(
            (account) => account.has_phone
        );
    }

    // Filtrar por búsqueda de texto
    if (filters.searchTerm && filters.searchTerm.trim()) {
        const searchLower = filters.searchTerm.toLowerCase();
        filteredAccounts = filteredAccounts.filter(
            (account) =>
                account.customer_name?.toLowerCase().includes(searchLower) ||
                account.customer_phone?.includes(searchLower) ||
                account.customer_email?.toLowerCase().includes(searchLower)
        );
    }

    // Filtrar por urgencia
    if (filters.urgencyFilter && filters.urgencyFilter !== "all") {
        filteredAccounts = filteredAccounts.filter((account) => {
            const urgencyClass = getUrgencyClass(
                account.days_overdue,
                account.status
            );
            switch (filters.urgencyFilter) {
                case "urgent":
                    return urgencyClass === "urgency-high";
                case "medium":
                    return urgencyClass === "urgency-medium";
                case "low":
                    return urgencyClass === "urgency-low";
                case "upcoming":
                    return urgencyClass === "urgency-upcoming";
                case "active":
                    return urgencyClass === "urgency-active";
                default:
                    return true;
            }
        });
    }

    // Filtrar por estado
    if (filters.statusFilter && filters.statusFilter !== "all") {
        filteredAccounts = filteredAccounts.filter(
            (account) => account.status === filters.statusFilter
        );
    }

    // Filtrar por monto mínimo
    if (filters.minAmount && filters.minAmount.trim()) {
        const minAmount = parseFloat(filters.minAmount);
        if (!isNaN(minAmount)) {
            filteredAccounts = filteredAccounts.filter(
                (account) => parseFloat(account.remaining_amount) >= minAmount
            );
        }
    }

    return filteredAccounts;
};
