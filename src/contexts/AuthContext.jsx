import React, { createContext, useContext, useState, useEffect } from "react";
import { TEST_AUTH_TOKEN } from "../config/api";

// Crear el contexto de autenticación
const AuthContext = createContext();

// Proveedor del contexto
export const AuthProvider = ({ children }) => {
    // Estado para el token de autenticación
    const [authToken, setAuthToken] = useState(null);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Al iniciar, intentar cargar el token desde localStorage
    useEffect(() => {
        const storedToken = localStorage.getItem("authToken");

        // Si hay un token almacenado, usarlo
        if (storedToken) {
            setAuthToken(storedToken);
            // Aquí se podría hacer una petición para validar el token y obtener datos del usuario
        } else {
            // Para desarrollo, usar el token de prueba
            setAuthToken(TEST_AUTH_TOKEN);
        }

        setIsLoading(false);
    }, []);

    // Función para iniciar sesión
    const login = (token, userData) => {
        localStorage.setItem("authToken", token);
        setAuthToken(token);
        setUser(userData);
    };

    // Función para cerrar sesión
    const logout = () => {
        localStorage.removeItem("authToken");
        setAuthToken(null);
        setUser(null);
    };

    // Valor del contexto
    const value = {
        authToken,
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!authToken,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};

// Hook personalizado para acceder al contexto
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth debe ser usado dentro de un AuthProvider");
    }
    return context;
};

export default AuthContext;
