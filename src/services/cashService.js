import API_CONFIG from "../config/api.js";

function getApiUrl(path) {
    // Normaliza la barra final de BASE_URL y la inicial de path
    let base = API_CONFIG.BASE_URL;
    if (base.endsWith("/")) base = base.slice(0, -1);
    let cleanPath = path.startsWith("/") ? path : "/" + path;
    return base + cleanPath;
}

export const cashService = {
    // Crear un movimiento de caja usando fetch
    createMovement: async (movementData) => {
        try {
            const token = localStorage.getItem("authToken");
            const url = getApiUrl("/cash/movements/");
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Token ${token}` } : {}),
                },
                body: JSON.stringify(movementData),
            });
            let data = null;
            try {
                data = await response.json();
            } catch (e) {
                // Si no es JSON, ignora el error
            }
            if (!response.ok)
                throw new Error("Error al crear movimiento de caja");
            return data;
        } catch (error) {
            console.error("Error al crear movimiento de caja:", error);
            throw error;
        }
    },
};
