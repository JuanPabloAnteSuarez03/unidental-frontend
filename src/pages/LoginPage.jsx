import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/Auth/LoginForm";
import { useAuth } from "../context/AuthContext";

/**
 * LoginPage component.
 * Handles the login process using the useAuth hook and LoginForm component.
 * Redirects the user upon successful login.
 */
function LoginPage() {
    const navigate = useNavigate();
    const { login, authToken, isLoading, authError } = useAuth();

    /**
     * Handles the login form submission.
     * Calls the login function from useAuth.
     * @param {object} credentials - Object containing username and password.
     */
    const handleLoginSubmit = async (credentials) => {
        await login(credentials.username, credentials.password);
        // La redirección se manejará en el useEffect al detectar un cambio en 'token'
    };

    // useEffect para redirigir al usuario si el login es exitoso (token presente)
    useEffect(() => {
        if (authToken) {
            // Si está autenticado, redirigir a la página principal
            console.log("Login successful, navigating to inventory...");
            navigate("/inventario", { replace: true }); // replace: true evita volver al login con "atrás"
        }
    }, [authToken, navigate]);

    // Si ya está autenticado al cargar la página, no mostrar el formulario
    if (authToken) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Redirigiendo...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Iniciar Sesión
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Accede a tu panel de administración
                    </p>
                </div>

                <div className="p-8 bg-white shadow-xl rounded-lg">
                    <LoginForm
                        onLoginSubmit={handleLoginSubmit}
                        loading={isLoading}
                        error={authError}
                    />
                </div>

                <p className="mt-4 text-center text-sm text-gray-500">
                    ¿No tienes cuenta?{" "}
                    {/* <a href="/registro" className="font-medium text-indigo-600 hover:text-indigo-500">
            Regístrate
          </a> */}
                    Contacta al administrador.
                </p>
            </div>
        </div>
    );
}

export default LoginPage;
