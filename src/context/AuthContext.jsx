// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from "react";
import { loginUser } from "../services/authService"; // Importar el servicio
import API_CONFIG from "../config/api.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [authToken, setAuthToken] = useState(
        localStorage.getItem("authToken")
    );
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [authError, setAuthError] = useState(null);

    // Usar la configuración centralizada de la API
    const BASE_URL = API_CONFIG.BASE_URL;

    // Efecto para cargar datos del usuario si hay un token al iniciar
    useEffect(() => {
        if (authToken) {
            const fetchCurrentUser = async () => {
                setIsLoading(true);
                try {
                    const response = await fetch(
                        `${BASE_URL}${API_CONFIG.ENDPOINTS.USER_PROFILE}`,
                        {
                            headers: {
                                Authorization: `Token ${authToken}`,
                                "Content-Type": "application/json",
                            },
                        }
                    );
                    if (!response.ok) {
                        // Si falla la obtención del usuario (ej. token expirado), desloguear
                        if (
                            response.status === 401 ||
                            response.status === 403
                        ) {
                            console.warn(
                                "Token inválido o expirado. Deslogueando."
                            );
                            await logout(); // Usar la función logout para limpiar todo
                            return;
                        }
                        const errorData = await response.json().catch(() => ({
                            detail: "Error al cargar datos del usuario.",
                        }));
                        throw new Error(
                            errorData.detail || `Error ${response.status}`
                        );
                    }
                    const userData = await response.json();
                    setCurrentUser(userData);
                } catch (error) {
                    console.error("Error al obtener datos del usuario:", error);
                    setAuthError(error.message);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchCurrentUser();
        } else {
            setCurrentUser(null); // Asegurarse que no hay usuario si no hay token
        }
    }, [authToken]); // Dependencia en authToken

    const login = async (username, password) => {
        setIsLoading(true);
        setAuthError(null);
        try {
            const data = await loginUser(username, password); // Usa el servicio de autenticación

            if (data && data.auth_token) {
                localStorage.setItem("authToken", data.auth_token);
                setAuthToken(data.auth_token);
            } else {
                throw new Error(
                    "Token no encontrado en la respuesta de login."
                );
            }
            return true; // Indicar éxito
        } catch (error) {
            console.error("Error en el login del contexto:", error);
            const errorMessage =
                error.message ||
                "Ocurrió un error durante el inicio de sesión.";
            setAuthError(errorMessage);
            localStorage.removeItem("authToken"); // Limpiar en caso de error
            setAuthToken(null);
            setCurrentUser(null);
            return false; // Indicar fallo
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        setIsLoading(true);
        setAuthError(null);
        const token = localStorage.getItem("authToken"); // Obtener token para la llamada a logout API

        if (token) {
            try {
                const response = await fetch(
                    `${BASE_URL}${API_CONFIG.ENDPOINTS.LOGOUT}`,
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Token ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );
                // Djoser's /token/logout/ endpoint returns 204 No Content on success.
                if (!response.ok && response.status !== 204) {
                    // Incluso si falla el logout en el backend, procedemos a limpiar localmente
                    console.warn(
                        `El logout en el servidor pudo haber fallado: ${response.status}`
                    );
                }
            } catch (error) {
                console.error(
                    "Error al intentar desloguear en el servidor:",
                    error
                );
                // Continuar con el logout local independientemente del error del backend
            }
        }

        localStorage.removeItem("authToken");
        setAuthToken(null);
        setCurrentUser(null);
        setIsLoading(false);
        console.log("Usuario deslogueado.");
    };

    return (
        <AuthContext.Provider
            value={{
                authToken,
                currentUser,
                isLoading,
                authError,
                login,
                logout,
                setCurrentUser,
                setAuthToken,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined && AuthContext.displayName !== "AuthContext") {
        // Esta verificación adicional es para evitar falsos positivos si el contexto
        // realmente tuviera 'undefined' como valor válido. En nuestro caso, no debería ser undefined.
        throw new Error("useAuth debe ser utilizado dentro de un AuthProvider");
    }
    return context;
};
