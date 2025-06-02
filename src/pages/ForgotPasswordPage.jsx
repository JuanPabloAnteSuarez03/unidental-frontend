import React, { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../services/authService";

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !email.includes("@")) {
            setError("Por favor ingrese un correo electrónico válido");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            await requestPasswordReset(email);
            setSuccess(true);
        } catch (error) {
            setError(
                error.message ||
                    "Error al solicitar el restablecimiento de contraseña"
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Recuperar Contraseña
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Ingresa tu correo electrónico para recibir instrucciones
                    </p>
                </div>

                <div className="p-8 bg-white shadow-xl rounded-lg">
                    {success ? (
                        <div className="text-center">
                            <div className="mb-4 p-4 bg-green-100 rounded-md">
                                <p className="text-green-700">
                                    Se ha enviado un enlace para restablecer tu
                                    contraseña a {email}. Por favor revisa tu
                                    correo electrónico.
                                </p>
                            </div>
                            <Link
                                to="/login"
                                className="text-indigo-600 hover:text-indigo-500"
                            >
                                Volver a iniciar sesión
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label
                                    htmlFor="email"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Correo Electrónico
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="tu@email.com"
                                    disabled={isLoading}
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
                                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                                >
                                    {isLoading
                                        ? "Enviando..."
                                        : "Enviar Instrucciones"}
                                </button>
                            </div>

                            <div className="text-sm text-center mt-4">
                                <Link
                                    to="/login"
                                    className="font-medium text-indigo-600 hover:text-indigo-500"
                                >
                                    Volver a Iniciar Sesión
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
