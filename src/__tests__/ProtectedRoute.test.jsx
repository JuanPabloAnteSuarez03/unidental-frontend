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
    const TestRoutes = () => (
        <MemoryRouter initialEntries={["/protected"]}>
            <Routes>
                <Route path="/" element={<TestLanding />} />
                <Route path="/login" element={<TestLogin />} />
                <Route element={<ProtectedRoute />}>
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
        // Simular un usuario autenticado
        useAuth.mockReturnValue({
            authToken: "fake-token",
            isLoading: false,
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
        });

        render(<TestRoutes />);

        // Verificar que se muestra la página de login
        expect(screen.getByText("Login Page")).toBeInTheDocument();

        // Verificar que no se muestra el contenido protegido
        expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });

    test("muestra un indicador de carga mientras se verifica la autenticación", () => {
        // Simular el estado de carga
        useAuth.mockReturnValue({
            authToken: null,
            isLoading: true,
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

    test("no muestra la carga si hay token, aunque isLoading sea true", () => {
        // Simular estado de carga pero con token existente
        useAuth.mockReturnValue({
            authToken: "fake-token",
            isLoading: true,
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
});
