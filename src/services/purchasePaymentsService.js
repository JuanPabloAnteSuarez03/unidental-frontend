import API_CONFIG from "../config/api.js";

export const purchasePaymentsService = {
    // Obtener pagos de una orden específica usando fetch
    getOrderPayments: async (orderId) => {
        try {
            const token = localStorage.getItem("authToken");
            const response = await fetch(
                `${API_CONFIG.BASE_URL}/purchases/payments/?order=${orderId}&page_size=100`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Token ${token}` } : {}),
                    },
                }
            );
            if (!response.ok) throw new Error("Error al obtener pagos");
            const data = await response.json();
            if (Array.isArray(data.results)) {
                return data.results;
            } else if (Array.isArray(data)) {
                return data;
            } else {
                return [];
            }
        } catch (error) {
            console.error("Error al obtener pagos de la orden:", error);
            return [];
        }
    },

    // Crear un nuevo pago usando fetch
    createPayment: async (paymentData) => {
        try {
            const token = localStorage.getItem("authToken");
            const response = await fetch(
                `${API_CONFIG.BASE_URL}/purchases/payments/`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Token ${token}` } : {}),
                    },
                    body: JSON.stringify(paymentData),
                }
            );
            if (!response.ok) throw new Error("Error al crear pago");
            return await response.json();
        } catch (error) {
            console.error("Error al crear pago:", error);
            throw error;
        }
    },

    // Anular un pago
    annulPayment: async (paymentId) => {
        try {
            const token = localStorage.getItem("authToken");
            const response = await fetch(
                `${API_CONFIG.BASE_URL}/purchases/payments/${paymentId}/annul/`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Token ${token}` } : {}),
                    },
                }
            );
            if (!response.ok) throw new Error("Error al anular pago");
            return await response.json();
        } catch (error) {
            console.error("Error al anular pago:", error);
            throw error;
        }
    },

    // Obtener todas las cajas disponibles usando fetch
    getCashes: async () => {
        try {
            const token = localStorage.getItem("authToken");
            const response = await fetch(
                `${API_CONFIG.BASE_URL}/cash/cashes/`,
                {
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Token ${token}` } : {}),
                    },
                }
            );
            if (!response.ok) throw new Error("Error al obtener cajas");
            const data = await response.json();
            if (Array.isArray(data.results)) {
                return data.results;
            } else if (Array.isArray(data)) {
                return data;
            } else {
                return [];
            }
        } catch (error) {
            console.error("Error al obtener cajas:", error);
            return [];
        }
    },
};
