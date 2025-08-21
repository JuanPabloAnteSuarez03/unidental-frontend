// src/services/authService.js
import API_CONFIG from "../config/api.js"; //

// Define la URL base de tu API usando la configuración centralizada
const API_BASE_URL = API_CONFIG.BASE_URL; //

/**
 * Realiza una solicitud de inicio de sesión al backend.
 * @param {string} username - Nombre de usuario o correo electrónico del usuario.
 * @param {string} password - Contraseña del usuario.
 * @returns {Promise<Object>} - Objeto con los datos de la respuesta del servidor, incluido el token.
 * @throws {Error} Si la respuesta de la red no es exitosa.
 */
export const loginUser = async (username, password) => {
    const loginUrl = `${API_BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`; //

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
    const requestResetUrl = `${API_BASE_URL}${API_CONFIG.ENDPOINTS.RESET_PASSWORD}`; //
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
    const confirmResetUrl = `${API_BASE_URL}${API_CONFIG.ENDPOINTS.RESET_PASSWORD_CONFIRM}`; //

    // Objeto payload que se enviará al backend
    const payload = {
        uid,
        token,
        new_password: newPassword,
        re_new_password: newPassword, // <--- MODIFICACIÓN: Añadir re_new_password
    };

    console.log(
        "Confirming password reset. Payload to be sent (passwords hidden in log):",
        // Para no loguear las contraseñas reales, puedes hacer esto:
        {
            ...payload,
            new_password: "HIDDEN_FOR_LOG",
            re_new_password: "HIDDEN_FOR_LOG",
        },
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
            body: JSON.stringify(payload), // <--- MODIFICACIÓN: Usar el objeto payload
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            let errorMessage = errorData.detail || "";

            // Intentar construir un mensaje de error más detallado
            const fieldErrors = [];
            if (errorData.uid)
                fieldErrors.push(`UID: ${errorData.uid.join(", ")}`);
            if (errorData.token)
                fieldErrors.push(`Token: ${errorData.token.join(", ")}`);
            if (errorData.new_password)
                fieldErrors.push(
                    `Nueva Contraseña: ${errorData.new_password.join(", ")}`
                );
            if (errorData.re_new_password)
                fieldErrors.push(
                    `Confirmar Nueva Contraseña: ${errorData.re_new_password.join(
                        ", "
                    )}`
                );
            if (errorData.non_field_errors)
                fieldErrors.push(errorData.non_field_errors.join(", "));

            if (fieldErrors.length > 0) {
                errorMessage = fieldErrors.join("; ");
            } else if (!errorMessage) {
                // Si no hay 'detail' ni errores de campo específicos
                errorMessage = `Error ${response.status} al confirmar reseteo: ${response.statusText}`;
            }

            throw new Error(errorMessage.trim());
        }

        // Si es 204 No Content, no hay cuerpo JSON para parsear.
        if (response.status === 204) {
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error("Error en resetPasswordConfirm (authService):", error);
        throw error;
    }
};

/**
 * Crea un nuevo usuario en el sistema.
 * @param {Object} userData - Objeto con username, password, email y opcionalmente role.
 * @returns {Promise<Object>} - Respuesta del servidor.
 * @throws {Error} Si la respuesta de la red no es exitosa.
 */
export const registerUser = async (userData, authToken = null) => {
    // Si incluye role, usar el endpoint de admin, si no, usar el endpoint normal
    const endpoint = userData.role
        ? API_CONFIG.ENDPOINTS.ADMIN_CREATE
        : API_CONFIG.ENDPOINTS.USERS;
    const url = `${API_BASE_URL}${endpoint}`;

    // Preparar headers
    const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
    };

    // Si es endpoint de admin, agregar token de autenticación
    if (userData.role && authToken) {
        headers.Authorization = `Token ${authToken}`;
    }

    try {
        const response = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(userData),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            // Mensaje de error más amigable
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
            if (errorData.email)
                fieldErrors.push(`Email: ${errorData.email.join(", ")}`);
            if (fieldErrors.length > 0) {
                throw new Error(fieldErrors.join("; "));
            }
            throw new Error(
                `Error al crear usuario: ${response.status} ${response.statusText}`
            );
        }
        return await response.json();
    } catch (error) {
        console.error("Error en registerUser (authService):", error);
        throw error;
    }
};

/**
 * Obtiene la lista de usuarios del sistema.
 * @param {string} token - Token de autenticación.
 * @returns {Promise<Object>} - Respuesta del servidor con la lista de usuarios.
 * @throws {Error} Si la respuesta de la red no es exitosa.
 */
export const getUsers = async (token) => {
    const url = `${API_BASE_URL}${API_CONFIG.ENDPOINTS.USERS}`;
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Token ${token}`,
            },
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const detail = errorData.detail || errorData.message;
            throw new Error(
                detail ||
                    `Error al obtener usuarios: ${response.status} ${response.statusText}`
            );
        }
        return await response.json();
    } catch (error) {
        console.error("Error en getUsers (authService):", error);
        throw error;
    }
};

// Podrías añadir más funciones aquí a medida que las necesites, por ejemplo:
// export const changePassword = async (currentPassword, newPassword, token) => { ... };
