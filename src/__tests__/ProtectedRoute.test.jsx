import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "../router/ProtectedRoute";

// Mock del contexto de autenticación
jest.mock("../context/AuthContext", () => ({
    useAuth: jest.fn(),
}));

describe("ProtectedRoute", () => {
    // Componentes de prueba para renderizar dentro de nuestras rutas
    const TestLanding = () => <div>Landing Page</div>;
    const TestProtected = () => <div>Protected Content</div>;
    const TestLogin = () => <div>Login Page</div>;

    // Configuración de rutas para probar ProtectedRoute
    const TestRoutes = ({ adminOnly = false } = {}) => (
        <MemoryRouter initialEntries={["/protected"]}>
            <Routes>
                <Route path="/" element={<TestLanding />} />
                <Route path="/login" element={<TestLogin />} />
                <Route element={<ProtectedRoute adminOnly={adminOnly} />}>
                    <Route path="/protected" element={<TestProtected />} />
                </Route>
            </Routes>
        </MemoryRouter>
    );

    beforeEach(() => {
        // Limpiar todos los mocks antes de cada prueba
        jest.clearAllMocks();
    });

    test("renderiza el contenido protegido cuando el usuario está autenticado", () => {
        // Simular un usuario autenticado con sus datos ya cargados
        useAuth.mockReturnValue({
            authToken: "fake-token",
            isLoading: false,
            currentUser: { role: "User" },
        });

        render(<TestRoutes />);

        // Verificar que se muestra el contenido protegido
        expect(screen.getByText("Protected Content")).toBeInTheDocument();

        // Verificar que no se muestra la página de login
        expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
    });

    test("redirige a la página de login cuando el usuario no está autenticado", () => {
        // Simular un usuario no autenticado
        useAuth.mockReturnValue({
            authToken: null,
            isLoading: false,
            currentUser: null,
        });

        render(<TestRoutes />);

        // Verificar que se muestra la página de login
        expect(screen.getByText("Login Page")).toBeInTheDocument();

        // Verificar que no se muestra el contenido protegido
        expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });

    test("muestra un indicador de carga mientras se obtienen los datos del usuario", () => {
        // Hay token, pero currentUser todavía no llegó de /api/auth/users/me/
        useAuth.mockReturnValue({
            authToken: "fake-token",
            isLoading: false,
            currentUser: null,
        });

        render(<TestRoutes />);

        // Verificar que se muestra el mensaje de carga
        expect(
            screen.getByText("Verificando autenticación...")
        ).toBeInTheDocument();

        // Verificar que no se muestra la página de login ni el contenido protegido
        expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
        expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });

    test("no se queda en carga si currentUser ya llegó, aunque isLoading esté desactualizado", () => {
        useAuth.mockReturnValue({
            authToken: "fake-token",
            isLoading: true,
            currentUser: { role: "User" },
        });

        render(<TestRoutes />);

        // Verificar que se muestra el contenido protegido a pesar de isLoading=true
        expect(screen.getByText("Protected Content")).toBeInTheDocument();

        // Verificar que no se muestra el indicador de carga ni la página de login
        expect(
            screen.queryByText("Verificando autenticación...")
        ).not.toBeInTheDocument();
        expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
    });

    test("ruta adminOnly: espera a que cargue currentUser en vez de redirigir de una (regresión /caja)", () => {
        // Este es exactamente el caso que rompía /caja: hay token, el usuario
        // SÍ es Admin, pero la respuesta de /api/auth/users/me/ todavía no
        // llegó. Antes del fix, esto redirigía a "/" antes de tiempo.
        useAuth.mockReturnValue({
            authToken: "fake-token",
            isLoading: false,
            currentUser: null,
        });

        render(<TestRoutes adminOnly />);

        expect(
            screen.getByText("Verificando autenticación...")
        ).toBeInTheDocument();
        expect(screen.queryByText("Landing Page")).not.toBeInTheDocument();
        expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });

    test("ruta adminOnly: muestra el contenido una vez que currentUser confirma el rol Admin", () => {
        useAuth.mockReturnValue({
            authToken: "fake-token",
            isLoading: false,
            currentUser: { role: "Admin" },
        });

        render(<TestRoutes adminOnly />);

        expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    test("ruta adminOnly: redirige si currentUser ya cargó y no es Admin", () => {
        useAuth.mockReturnValue({
            authToken: "fake-token",
            isLoading: false,
            currentUser: { role: "User" },
        });

        render(<TestRoutes adminOnly />);

        expect(screen.getByText("Landing Page")).toBeInTheDocument();
        expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });
});
