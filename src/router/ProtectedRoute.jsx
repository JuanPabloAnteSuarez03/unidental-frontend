import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Corregir la importación

/**
 * ProtectedRoute component.
 * Checks if the user is authenticated using the useAuth hook.
 * If authenticated, it renders the child routes (Outlet).
 * If not authenticated, it redirects the user to the /login page.
 */
function ProtectedRoute() {
    const { authToken, isLoading } = useAuth(); // Usar authToken del contexto de autenticación

    // Si isLoading es true, significa que el estado de autenticación aún se está determinando.
    // Puedes mostrar un loader aquí para evitar un parpadeo o una redirección prematura.
    if (isLoading && !authToken) {
        // Solo muestra loader si estamos cargando Y AÚN NO hay token
        return (
            <div className="flex justify-center items-center h-screen">
                <p>Verificando autenticación...</p>
                {/* Aquí podrías poner un spinner/loader visual */}
            </div>
        );
    }

    // Si no hay token (y ya no estamos cargando, o nunca lo estuvimos para el chequeo inicial del token),
    // redirige a la página de login.
    if (!authToken) {
        return <Navigate to="/login" replace />;
    }

    // Si hay un token, el usuario está autenticado, entonces renderiza el contenido de la ruta protegida.
    return <Outlet />;
}

export default ProtectedRoute;
