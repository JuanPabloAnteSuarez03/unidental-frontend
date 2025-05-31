// src/pages/ResetPasswordConfirmPage.jsx
import React, { useState, useEffect } from "react";
// Importa useParams para leer parámetros de la ruta
import { useParams, useNavigate, Link } from "react-router-dom";
import { resetPasswordConfirm } from "../services/authService"; //

function ResetPasswordConfirmPage() {
    // useParams() nos devuelve un objeto con los parámetros de la ruta: { uid: "valor", token: "valor" }
    const { uid, token } = useParams(); // <--- CAMBIO PRINCIPAL AQUÍ
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Ya no necesitas el useEffect para extraer de location.search.
    // uid y token vienen directamente de useParams().
    // Puedes tener un useEffect para validar si uid/token existen, si lo deseas,
    // aunque la comprobación en handleSubmit también es importante.
    useEffect(() => {
        if (!uid || !token) {
            setError(
                "Enlace de reseteo inválido o la URL no contiene los parámetros necesarios (uid, token)."
            );
        }
    }, [uid, token]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setSuccessMessage("");

        if (!uid || !token) {
            setError(
                "No se pueden procesar los datos: falta uid o token del enlace. Por favor, usa el enlace de tu correo."
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            return;
        }
        if (newPassword.length < 8) {
            setError("La nueva contraseña debe tener al menos 8 caracteres.");
            return;
        }

        setIsLoading(true);

        try {
            await resetPasswordConfirm(uid, token, newPassword); //
            setSuccessMessage(
                "¡Tu contraseña ha sido restablecida exitosamente! Serás redirigido para iniciar sesión."
            );
            setTimeout(() => {
                navigate("/login");
            }, 3000);
        } catch (err) {
            console.error("Error al restablecer la contraseña:", err);
            setError(
                err.message ||
                    "No se pudo restablecer la contraseña. El enlace puede ser inválido, haber expirado, o la contraseña no cumple los requisitos."
            );
        } finally {
            setIsLoading(false);
        }
    };

    // ... (el resto del JSX para renderizar el formulario y mensajes es similar)
    // Solo asegúrate de que la lógica para mostrar errores si !uid || !token funciona bien
    // con cómo useParams los entrega (serán undefined si no están en la URL).

    if (successMessage) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-md text-center p-8 bg-white shadow-xl rounded-lg">
                    <h2 className="text-2xl font-bold text-green-600">
                        ¡Éxito!
                    </h2>
                    <p className="mt-4 text-gray-700">{successMessage}</p>
                    <Link
                        to="/login"
                        className="mt-6 inline-block px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Ir a Iniciar Sesión
                    </Link>
                </div>
            </div>
        );
    }

    if (!uid || !token) {
        // Comprobación temprana si uid o token no llegaron por la URL
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-md text-center p-8 bg-white shadow-xl rounded-lg">
                    <h2 className="text-2xl font-bold text-red-600">
                        Error de Enlace
                    </h2>
                    <p className="mt-4 text-gray-700">
                        {error ||
                            "El enlace para restablecer la contraseña es inválido o está incompleto."}
                    </p>
                    <Link
                        to="/password-reset"
                        className="mt-6 inline-block px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                    >
                        Solicitar Nuevo Enlace
                    </Link>
                    <Link
                        to="/login"
                        className="mt-2 inline-block text-sm text-indigo-600 hover:text-indigo-500"
                    >
                        Volver a Iniciar Sesión
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Establecer Nueva Contraseña
                    </h2>
                </div>
                <form
                    onSubmit={handleSubmit}
                    className="mt-8 space-y-6 p-8 bg-white shadow-xl rounded-lg"
                >
                    {/* Campos de contraseña y botón de submit como los tenías */}
                    <div>
                        <label htmlFor="new-password" /* ... */>
                            Nueva Contraseña
                        </label>
                        <input
                            id="new-password"
                            name="newPassword"
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={isLoading}
                            minLength={8}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Ingresa tu nueva contraseña"
                        />
                    </div>
                    <div>
                        <label htmlFor="confirm-password" /* ... */>
                            Confirmar Nueva Contraseña
                        </label>
                        <input
                            id="confirm-password"
                            name="confirmPassword"
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={isLoading}
                            minLength={8}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Confirma tu nueva contraseña"
                        />
                    </div>
                    {error && (
                        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                            <p className="text-sm">{error}</p>
                        </div>
                    )}
                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                        >
                            {isLoading
                                ? "Estableciendo..."
                                : "Restablecer Contraseña"}
                        </button>
                    </div>
                </form>
                <div className="text-sm text-center mt-4">
                    <Link
                        to="/login"
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                    >
                        Cancelar y volver a Iniciar Sesión
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default ResetPasswordConfirmPage;
