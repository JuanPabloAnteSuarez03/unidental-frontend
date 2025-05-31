// src/services/authService.js

// Define la URL base de tu API.
// En un proyecto más grande, podrías obtener esto de variables de entorno
// o de una configuración centralizada, similar a como lo hace tu hook useAuth.js.
// Por ahora, la mantenemos simple aquí.
const API_BASE_URL = import.meta.env.DEV
    ? "/api" // Para usar el proxy de Vite en desarrollo
    : "https://unidental-backend-production.up.railway.app/api"; // URL directa para producción

/**
 * Realiza una solicitud de inicio de sesión al backend.
 * @param {string} username - El nombre de usuario.
 * @param {string} password - La contraseña del usuario.
 * @returns {Promise<Object>} La respuesta del servidor, que generalmente incluye un token.
 * @throws {Error} Si la respuesta de la red no es exitosa.
 */
export const loginUser = async (username, password) => {
    const loginUrl = `${API_BASE_URL}/auth/token/login/`;

    try {
        const response = await fetch(loginUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            // Intenta obtener un mensaje de error más específico de Djoser/DRF
            const detail =
                errorData.detail ||
                (errorData.non_field_errors
                    ? errorData.non_field_errors.join(", ")
                    : null);
            if (detail) {
                throw new Error(detail);
            }
            // Fallback a errores de campo si existen
            const fieldErrors = [];
            if (errorData.username)
                fieldErrors.push(`Usuario: ${errorData.username.join(", ")}`);
            if (errorData.password)
                fieldErrors.push(
                    `Contraseña: ${errorData.password.join(", ")}`
                );
            if (fieldErrors.length > 0) {
                throw new Error(fieldErrors.join("; "));
            }
            throw new Error(
                `Error al iniciar sesión: ${response.status} ${response.statusText}`
            );
        }
        return await response.json();
    } catch (error) {
        console.error("Error en loginUser (authService):", error);
        throw error;
    }
};

/**
 * Solicita un reseteo de contraseña para el email proporcionado.
 * Llama a POST /api/auth/users/reset_password/
 * @param {string} email - El correo electrónico del usuario.
 * @returns {Promise<Object|null>} La respuesta del servidor.
 * @throws {Error} Si la respuesta de la red no es exitosa o hay otros errores.
 */
export const requestPasswordReset = async (email) => {
    const requestResetUrl = `${API_BASE_URL}/auth/users/reset_password/`;
    console.log(
        "Requesting password reset for:",
        email,
        "at URL:",
        requestResetUrl
    );

    try {
        const response = await fetch(requestResetUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({ email }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const detail =
                errorData.detail ||
                (errorData.email
                    ? `Email: ${errorData.email.join(", ")}`
                    : null);
            throw new Error(
                detail ||
                    `Error ${response.status} al solicitar reseteo: ${response.statusText}`
            );
        }

        // Si es 204 No Content, no hay cuerpo JSON para parsear.
        if (response.status === 204) {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error("Error en requestPasswordReset (authService):", error);
        throw error;
    }
};

/**
 * Confirma el reseteo de contraseña con el uid, token y la nueva contraseña.
 * Llama a POST /api/auth/users/reset_password_confirm/
 * @param {string} uid - El UID del usuario.
 * @param {string} token - El token de reseteo.
 * @param {string} newPassword - La nueva contraseña.
 * @returns {Promise<Object|null>} La respuesta del servidor.
 * @throws {Error} Si la respuesta de la red no es exitosa o hay otros errores.
 */
export const resetPasswordConfirm = async (uid, token, newPassword) => {
    const confirmResetUrl = `${API_BASE_URL}/auth/users/reset_password_confirm/`;
    console.log(
        "Confirming password reset with:",
        { uid, token, new_password: "HIDDEN" },
        "at URL:",
        confirmResetUrl
    );

    try {
        const response = await fetch(confirmResetUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({ uid, token, new_password: newPassword }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            let errorMessage = errorData.detail || "";
            if (errorData.new_password)
                errorMessage += ` Contraseña: ${errorData.new_password.join(
                    ", "
                )}.`;
            if (errorData.token)
                errorMessage += ` Token: ${errorData.token.join(", ")}.`;
            if (errorData.uid)
                errorMessage += ` UID: ${errorData.uid.join(", ")}.`;
            if (!errorMessage)
                errorMessage = `Error ${response.status} al confirmar reseteo: ${response.statusText}`;
            throw new Error(errorMessage.trim());
        }

        if (response.status === 204) {
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error("Error en resetPasswordConfirm (authService):", error);
        throw error;
    }
};

// Podrías añadir más funciones aquí a medida que las necesites, por ejemplo:
// export const changePassword = async (currentPassword, newPassword, token) => { ... };
// export const registerUser = async (userData) => { ... };
