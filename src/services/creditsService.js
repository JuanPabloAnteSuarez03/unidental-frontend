import API_CONFIG from "../config/api.js";

// URLs para el sistema de créditos
const API_CREDITS_BASE_URL = `${API_CONFIG.BASE_URL}/credits`;
const API_ACCOUNTS_URL = `${API_CREDITS_BASE_URL}/accounts/`;
const API_PAYMENTS_URL = `${API_CREDITS_BASE_URL}/payments/`;

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
 * Crear cuenta de crédito simple
 * @param {Object} creditData - Datos del crédito
 * @param {number} creditData.sale_id - ID de la venta
 * @param {string} creditData.original_amount - Monto original
 * @param {string} creditData.due_date - Fecha de vencimiento (opcional)
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Cuenta de crédito creada
 */
export const createSimpleCredit = async (creditData, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const response = await fetch(`${API_ACCOUNTS_URL}create_credit/`, {
            method: "POST",
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(creditData),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.detail || 
                errorData.error || 
                `Error ${response.status}: ${response.statusText}`
            );
        }

        return await response.json();
    } catch (error) {
        console.error("Error creating simple credit:", error);
        throw error;
    }
};

/**
 * Crear cuenta de crédito con cuotas
 * @param {Object} creditData - Datos del crédito con cuotas
 * @param {number} creditData.sale_id - ID de la venta
 * @param {string} creditData.original_amount - Monto original total
 * @param {string} creditData.initial_payment - Pago inicial (opcional)
 * @param {number} creditData.installments_count - Número de cuotas
 * @param {string} creditData.installment_amount - Monto por cuota
 * @param {string} creditData.payment_frequency - Frecuencia de pago
 * @param {string} creditData.next_payment_date - Fecha del primer pago
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Cuenta de crédito creada
 */
export const createCreditWithInstallments = async (creditData, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const response = await fetch(`${API_ACCOUNTS_URL}create_credit/`, {
            method: "POST",
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(creditData),
        });

        if (!response.ok) {
            let errorData;
            const responseText = await response.text();
            console.error("🔍 DEBUG - createCreditWithInstallments error response text:", responseText);
            
            try {
                errorData = JSON.parse(responseText);
                console.error("🔍 DEBUG - createCreditWithInstallments error response JSON:", errorData);
            } catch (parseError) {
                console.error("🔍 DEBUG - Error parsing response as JSON:", parseError);
                errorData = { detail: responseText };
            }

            // Crear un mensaje de error más detallado
            let errorMessage = `Error ${response.status}: ${response.statusText}`;
            
            if (errorData) {
                if (errorData.detail) {
                    errorMessage += `\nDetalle: ${errorData.detail}`;
                }
                
                // Si hay errores de validación específicos, mostrarlos
                Object.keys(errorData).forEach(field => {
                    if (field !== 'detail' && Array.isArray(errorData[field])) {
                        errorMessage += `\n${field}: ${errorData[field].join(', ')}`;
                    } else if (field !== 'detail' && typeof errorData[field] === 'string') {
                        errorMessage += `\n${field}: ${errorData[field]}`;
                    }
                });
            }
            
            throw new Error(errorMessage);
        }

        const responseData = await response.json();
        console.log("✅ DEBUG - createCreditWithInstallments SUCCESS response:", responseData);
        console.log("✅ DEBUG - Credit account created with ID:", responseData.id || responseData.credit_account_id || 'ID not found');
        
        return responseData;
    } catch (error) {
        console.error("Error creating credit with installments:", error);
        throw error;
    }
};

/**
 * Registrar pago de crédito
 * @param {Object} paymentData - Datos del pago
 * @param {number} paymentData.credit_account - ID de la cuenta de crédito
 * @param {string} paymentData.amount_paid - Monto pagado
 * @param {string} paymentData.payment_date - Fecha del pago
 * @param {string} paymentData.notes - Notas del pago (opcional)
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Pago registrado
 */
export const registerPayment = async (paymentData, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const response = await fetch(`${API_PAYMENTS_URL}register_payment/`, {
            method: "POST",
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(paymentData),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.detail || 
                errorData.error || 
                `Error ${response.status}: ${response.statusText}`
            );
        }

        return await response.json();
    } catch (error) {
        console.error("Error registering payment:", error);
        throw error;
    }
};

/**
 * Obtener cuentas de crédito
 * @param {Object} params - Parámetros de filtro
 * @param {number} params.sale_customer - Filtrar por cliente
 * @param {string} params.search - Buscar por nombre/email/teléfono
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Lista de cuentas de crédito
 */
export const getCreditAccounts = async (params = {}, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    const url = buildUrlWithParams(API_ACCOUNTS_URL, params);

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

        return await response.json();
    } catch (error) {
        console.error("Error fetching credit accounts:", error);
        throw error;
    }
};

/**
 * Obtener cuentas vencidas
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Array>} - Lista de cuentas vencidas
 */
export const getOverdueAccounts = async (authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const response = await fetch(`${API_ACCOUNTS_URL}overdue_accounts/`, {
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching overdue accounts:", error);
        throw error;
    }
};

/**
 * Obtener pagos próximos a vencer
 * @param {number} days - Días de anticipación (por defecto 7)
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Array>} - Lista de pagos próximos
 */
export const getUpcomingPayments = async (days = 7, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const response = await fetch(
            `${API_ACCOUNTS_URL}upcoming_payments/?days=${days}`, 
            {
                headers: {
                    Authorization: `Token ${authToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching upcoming payments:", error);
        throw error;
    }
};

/**
 * Obtener resumen de deudas
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Resumen de deudas
 */
export const getDebtSummary = async (authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const response = await fetch(`${API_ACCOUNTS_URL}debt_summary/`, {
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching debt summary:", error);
        throw error;
    }
};

/**
 * Obtener estadísticas de créditos
 * @param {number} days - Días para el período de estadísticas (por defecto 30)
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Estadísticas de créditos
 */
export const getCreditStatistics = async (days = 30, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    try {
        const response = await fetch(
            `${API_ACCOUNTS_URL}statistics/?days=${days}`, 
            {
                headers: {
                    Authorization: `Token ${authToken}`,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching credit statistics:", error);
        throw error;
    }
};

/**
 * Calcular monto de cuota automáticamente
 * @param {number} totalAmount - Monto total
 * @param {number} initialPayment - Pago inicial
 * @param {number} installmentsCount - Número de cuotas
 * @returns {number} - Monto por cuota (entero)
 */
export const calculateInstallmentAmount = (totalAmount, initialPayment = 0, installmentsCount) => {
    if (!installmentsCount || installmentsCount <= 0) {
        return 0;
    }
    
    const remainingAmount = totalAmount - initialPayment;
    
    // Calcular el monto exacto por cuota
    const exactAmount = remainingAmount / installmentsCount;
    
    // Redondear al entero más cercano para compatibilidad con el backend
    return Math.round(exactAmount);
};

/**
 * Calcular distribución exacta de cuotas
 * Distribuye el monto de manera que la suma total sea exactamente igual al monto original
 * @param {number} totalAmount - Monto total
 * @param {number} initialPayment - Pago inicial
 * @param {number} installmentsCount - Número de cuotas
 * @returns {Array} - Array con los montos de cada cuota
 */
export const calculateInstallmentDistribution = (totalAmount, initialPayment = 0, installmentsCount) => {
    if (!installmentsCount || installmentsCount <= 0) {
        return [];
    }
    
    const remainingAmount = totalAmount - initialPayment;
    
    // Calcular cuota base (redondeada hacia abajo)
    const baseInstallment = Math.floor(remainingAmount / installmentsCount);
    
    // Calcular el resto
    const remainder = remainingAmount - (baseInstallment * installmentsCount);
    
    // Crear array con las cuotas
    const installments = new Array(installmentsCount).fill(baseInstallment);
    
    // Distribuir el resto entre las primeras cuotas
    for (let i = 0; i < remainder; i++) {
        installments[i] += 1;
    }
    
    return installments;
};

/**
 * Validar que la suma sea correcta según la nueva lógica del backend
 * @param {number} totalAmount - Monto total
 * @param {number} initialPayment - Pago inicial
 * @param {number} installmentAmount - Monto por cuota
 * @param {number} installmentsCount - Número de cuotas
 * @returns {Object} - Resultado de la validación
 */
export const validateInstallmentTotal = (totalAmount, initialPayment = 0, installmentAmount, installmentsCount) => {
    // Nueva lógica: pago_inicial + total_cuotas ≈ monto_original
    const totalCuotas = installmentAmount * installmentsCount;
    const sumaPagoInicialYCuotas = initialPayment + totalCuotas;
    const difference = sumaPagoInicialYCuotas - totalAmount;
    
    // Tolerancia de $1 como en el backend
    const tolerance = 1;
    const isValid = Math.abs(difference) <= tolerance;
    
    return {
        isValid: isValid,
        difference: difference,
        totalAmount: totalAmount,
        initialPayment: initialPayment,
        totalCuotas: totalCuotas,
        sumaPagoInicialYCuotas: sumaPagoInicialYCuotas,
        tolerance: tolerance
    };
};

/**
 * Validar datos de crédito
 * @param {Object} creditData - Datos del crédito a validar
 * @returns {Object} - Resultado de la validación
 */
export const validateCreditData = (creditData) => {
    const errors = [];
    
    if (!creditData.sale_id || creditData.sale_id <= 0) {
        errors.push("ID de venta es requerido");
    }
    
    if (!creditData.original_amount || parseFloat(creditData.original_amount) <= 0) {
        errors.push("Monto original debe ser mayor a 0");
    }
    
    if (creditData.initial_payment && parseFloat(creditData.initial_payment) >= parseFloat(creditData.original_amount)) {
        errors.push("Pago inicial no puede ser mayor o igual al monto total");
    }
    
    if (creditData.installments_count && creditData.installments_count <= 0) {
        errors.push("Número de cuotas debe ser mayor a 0");
    }
    
    const validFrequencies = ['weekly', 'biweekly', 'monthly', 'quarterly', 'custom'];
    if (creditData.payment_frequency && !validFrequencies.includes(creditData.payment_frequency)) {
        errors.push("Frecuencia de pago no válida");
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Formatear monto a moneda local
 * @param {number|string} amount - Monto a formatear
 * @returns {string} - Monto formateado
 */
export const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount || 0);
    return numAmount.toLocaleString('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    });
};

// Constantes para frecuencias de pago
export const PAYMENT_FREQUENCIES = {
    weekly: { value: 'weekly', label: 'Semanal', days: 7 },
    biweekly: { value: 'biweekly', label: 'Quincenal', days: 15 },
    monthly: { value: 'monthly', label: 'Mensual', days: 30 },
    quarterly: { value: 'quarterly', label: 'Trimestral', days: 90 },
    custom: { value: 'custom', label: 'Personalizado', days: null }
};

// Constantes para métodos de pago
export const PAYMENT_METHODS = {
    cash: { value: 'cash', label: 'Efectivo', icon: '💵' },
    card: { value: 'card', label: 'Tarjeta', icon: '💳' },
    transfer: { value: 'transfer', label: 'Transferencia', icon: '💸' },
    credit: { value: 'credit', label: 'Crédito', icon: '📝' }
};

/**
 * Obtener detalles de una cuenta de crédito por ID
 * @param {number} creditAccountId - ID de la cuenta
 * @param {string} authToken - Token de autenticación
 * @returns {Promise<Object>} - Detalle de la cuenta de crédito
 */
export const getCreditAccountById = async (creditAccountId, authToken) => {
    if (!authToken) {
        throw new Error("No authentication token provided");
    }

    if (!creditAccountId) {
        throw new Error("No creditAccountId provided");
    }

    try {
        const response = await fetch(`${API_ACCOUNTS_URL}${creditAccountId}/`, {
            headers: {
                Authorization: `Token ${authToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.detail ||
                `Error ${response.status}: ${response.statusText}`
            );
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching credit account detail:", error);
        throw error;
    }
}; 