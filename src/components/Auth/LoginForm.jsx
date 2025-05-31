// src/components/Auth/LoginForm.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";

/**
 * LoginForm component.
 * Renders a form with username and password fields, a submit button,
 * and a space to display error messages.
 *
 * @param {object} props - The component's props.
 * @param {function} props.onLoginSubmit - Function to call when the form is submitted.
 * @param {string} props.error - Error message to display.
 * @param {boolean} props.loading - Indicates if a login operation is in progress.
 */
function LoginForm({ onLoginSubmit, error, loading }) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = (event) => {
        event.preventDefault();
        if (onLoginSubmit) {
            onLoginSubmit({ username, password });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-700"
                >
                    Nombre de Usuario
                </label>
                <input
                    type="text"
                    name="username"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="tu_usuario"
                    disabled={loading}
                />
            </div>

            <div>
                <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                >
                    Contraseña
                </label>
                <input
                    type="password"
                    name="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="tu_contraseña"
                    disabled={loading}
                />
            </div>

            {/* Espacio para mensajes de error */}
            {error && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                    <p className="text-sm">{error}</p>
                </div>
            )}

            <div>
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                >
                    {loading ? "Ingresando..." : "Ingresar"}
                </button>
            </div>

            <div className="text-sm text-center">
                <Link
                    to="/password-reset"
                    className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                    ¿No recuerdo mi contraseña?
                </Link>
            </div>
        </form>
    );
}

export default LoginForm;
