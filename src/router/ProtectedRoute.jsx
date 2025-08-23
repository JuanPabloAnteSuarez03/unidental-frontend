import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ adminOnly = false }) {
    const { authToken, isLoading, currentUser } = useAuth();

    if (isLoading && !authToken) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p>Verificando autenticación...</p>
            </div>
        );
    }

    if (!authToken) {
        return <Navigate to="/login" replace />;
    }

    // Si la ruta es solo para admin, verifica el rol
    if (adminOnly) {
        if (!currentUser || currentUser.role !== "Admin") {
            // Puedes redirigir a una página de no autorizado si prefieres
            return <Navigate to="/" replace />;
        }
    }

    return <Outlet />;
}

export default ProtectedRoute;
