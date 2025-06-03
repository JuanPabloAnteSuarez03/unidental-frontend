import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// Definir TextEncoder y TextDecoder globalmente para Node.js
if (typeof global.TextEncoder === "undefined") {
    global.TextEncoder = require("util").TextEncoder;
}
if (typeof global.TextDecoder === "undefined") {
    global.TextDecoder = require("util").TextDecoder;
}

// Mocks simplificados
const mockNavigate = jest.fn();

// Mock para react-router-dom
jest.mock("react-router-dom", () => ({
    ...jest.requireActual("react-router-dom"),
    useNavigate: () => mockNavigate,
    BrowserRouter: ({ children }) => <div>{children}</div>,
}));

// Mock para AuthContext
jest.mock("../context/AuthContext", () => ({
    useAuth: jest.fn(),
}));

// Mock para LoginForm
jest.mock("../components/Auth/LoginForm", () => {
    return {
        __esModule: true,
        default: jest.fn().mockImplementation((props) => (
            <form
                data-testid="login-form"
                onSubmit={(e) => {
                    e.preventDefault();
                    props.onLoginSubmit({
                        username: "testuser",
                        password: "testpass",
                    });
                }}
            >
                <input data-testid="username-input" type="text" />
                <input data-testid="password-input" type="password" />
                <button data-testid="login-button" type="submit">
                    {props.loading ? "Ingresando..." : "Ingresar"}
                </button>
                {props.error && (
                    <div data-testid="login-error">{props.error}</div>
                )}
            </form>
        )),
    };
});

// Importamos después de los mocks
import LoginPage from "../pages/LoginPage";
import { useAuth } from "../context/AuthContext";
import LoginForm from "../components/Auth/LoginForm";

describe("LoginPage", () => {
    // Estado por defecto del hook useAuth
    const defaultAuthState = {
        login: jest.fn(),
        authToken: null,
        isLoading: false,
        authError: null,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        useAuth.mockReturnValue(defaultAuthState);
    });

    test("renders login form when user is not authenticated", () => {
        render(<LoginPage />);

        // Verificar que el título de la página se muestra
        expect(screen.getByText("Bienvenido")).toBeInTheDocument();
        expect(
            screen.getByText("Ingresa tus credenciales para acceder")
        ).toBeInTheDocument();

        // Verificar que el formulario de login se renderiza
        expect(screen.getByTestId("login-form")).toBeInTheDocument();
    });

    test("shows loading spinner when user is authenticated", () => {
        useAuth.mockReturnValue({
            ...defaultAuthState,
            authToken: "fake-token",
        });

        render(<LoginPage />);

        // Verificar que se muestra el spinner de carga
        expect(screen.getByText("Redirigiendo...")).toBeInTheDocument();
        expect(screen.queryByTestId("login-form")).not.toBeInTheDocument();
    });

    test("calls login function when form is submitted", async () => {
        const mockLogin = jest.fn().mockResolvedValue(true);
        useAuth.mockReturnValue({
            ...defaultAuthState,
            login: mockLogin,
        });

        render(<LoginPage />);

        // Simular envío del formulario
        fireEvent.submit(screen.getByTestId("login-form"));

        // Verificar que la función login se llamó con las credenciales correctas
        expect(mockLogin).toHaveBeenCalledWith("testuser", "testpass");
    });

    test("displays error message when login fails", () => {
        const errorMessage = "Credenciales inválidas";
        useAuth.mockReturnValue({
            ...defaultAuthState,
            authError: errorMessage,
        });

        render(<LoginPage />);

        // Verificar que el error se pasa al LoginForm usando llamada más reciente
        const lastCallProps =
            LoginForm.mock.calls[LoginForm.mock.calls.length - 1][0];
        expect(lastCallProps.error).toBe(errorMessage);
    });

    test("shows loading state when login is in progress", () => {
        useAuth.mockReturnValue({
            ...defaultAuthState,
            isLoading: true,
        });

        render(<LoginPage />);

        // Verificar que el estado de carga se pasa al LoginForm
        const lastCallProps =
            LoginForm.mock.calls[LoginForm.mock.calls.length - 1][0];
        expect(lastCallProps.loading).toBe(true);
    });

    test("redirects to inventory page when user is authenticated", () => {
        useAuth.mockReturnValue({
            ...defaultAuthState,
            authToken: "fake-token",
        });

        render(<LoginPage />);

        // Verificar que navigate se llamó con la ruta correcta
        expect(mockNavigate).toHaveBeenCalledWith("/inventario", {
            replace: true,
        });
    });

    test("passes the correct props to LoginForm", () => {
        const mockAuthState = {
            login: jest.fn(),
            authToken: null,
            isLoading: false,
            authError: "Test error message",
        };

        useAuth.mockReturnValue(mockAuthState);

        render(<LoginPage />);

        // Verificar que se pasan las props correctas a LoginForm
        const lastCallProps =
            LoginForm.mock.calls[LoginForm.mock.calls.length - 1][0];
        expect(lastCallProps.error).toBe(mockAuthState.authError);
        expect(lastCallProps.loading).toBe(mockAuthState.isLoading);
        expect(typeof lastCallProps.onLoginSubmit).toBe("function");
    });

    test("login handler calls login function with correct credentials", async () => {
        const mockLogin = jest.fn().mockResolvedValue(true);
        useAuth.mockReturnValue({
            ...defaultAuthState,
            login: mockLogin,
        });

        render(<LoginPage />);

        // Obtener la función onLoginSubmit pasada a LoginForm
        const loginFormProps = LoginForm.mock.calls[0][0];

        // Llamar directamente a la función de manejo de login
        await loginFormProps.onLoginSubmit({
            username: "user123",
            password: "pass123",
        });

        // Verificar que login se llamó con los argumentos correctos
        expect(mockLogin).toHaveBeenCalledWith("user123", "pass123");
    });
});
