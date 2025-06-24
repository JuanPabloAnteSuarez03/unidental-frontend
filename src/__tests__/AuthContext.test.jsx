import React from "react";
import { render, act, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { loginUser } from "../services/authService";

// Mock para el servicio de autenticación
jest.mock("../services/authService", () => ({
    loginUser: jest.fn(),
}));

// Mock para localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: jest.fn((key) => store[key] || null),
        setItem: jest.fn((key, value) => {
            store[key] = value;
        }),
        removeItem: jest.fn((key) => {
            delete store[key];
        }),
        clear: jest.fn(() => {
            store = {};
        }),
    };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock para fetch API
global.fetch = jest.fn();

// Componente de prueba para acceder al contexto
const TestComponent = ({ onContextReady }) => {
    const auth = useAuth();
    React.useEffect(() => {
        if (auth) {
            onContextReady(auth);
        }
    }, [auth, onContextReady]);
    return <div>Test Component</div>;
};

describe("AuthContext", () => {
    // Variables para guardar los console originales
    let originalConsoleLog;
    let originalConsoleWarn;
    let originalConsoleError;

    beforeAll(() => {
        // Silenciar console logs durante los tests
        originalConsoleLog = console.log;
        originalConsoleWarn = console.warn;
        originalConsoleError = console.error;

        console.log = jest.fn();
        console.warn = jest.fn();
        console.error = jest.fn();
    });

    afterAll(() => {
        // Restaurar console logs
        console.log = originalConsoleLog;
        console.warn = originalConsoleWarn;
        console.error = originalConsoleError;
    });

    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.clear();

        // Restablecer fetch para que no mantenga configuraciones anteriores
        global.fetch.mockReset();

        // Configuración por defecto para fetch: respuesta exitosa vacía
        global.fetch.mockResolvedValue({
            ok: true,
            status: 204,
            json: async () => ({}),
        });
    });

    test("proporciona valores iniciales correctos cuando no hay token", async () => {
        let authContext;
        const onContextReady = (context) => {
            authContext = context;
        };

        await act(async () => {
            render(
                <AuthProvider>
                    <TestComponent onContextReady={onContextReady} />
                </AuthProvider>
            );
        });

        await waitFor(() => expect(authContext).toBeDefined());

        expect(authContext.authToken).toBeNull();
        expect(authContext.currentUser).toBeNull();
        expect(authContext.isLoading).toBe(false);
        expect(authContext.authError).toBeNull();
        expect(typeof authContext.login).toBe("function");
        expect(typeof authContext.logout).toBe("function");
    });

    test("carga el usuario cuando hay un token almacenado", async () => {
        // Preparar un token en localStorage
        const mockToken = "fake-auth-token";
        const mockUser = { id: 1, username: "testuser" };

        localStorageMock.getItem.mockReturnValue(mockToken);

        // Mock para la petición de datos del usuario
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockUser,
        });

        let authContext;
        const onContextReady = (context) => {
            authContext = context;
        };

        await act(async () => {
            render(
                <AuthProvider>
                    <TestComponent onContextReady={onContextReady} />
                </AuthProvider>
            );
        });

        await waitFor(() => expect(authContext.currentUser).not.toBeNull());

        expect(authContext.authToken).toBe(mockToken);
        expect(authContext.currentUser).toEqual(mockUser);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/api/auth/users/me/"),
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: `Token ${mockToken}`,
                }),
            })
        );
    });

    test("maneja errores de carga de usuario correctamente", async () => {
        // Preparar un token en localStorage
        const mockToken = "invalid-token";
        localStorageMock.getItem.mockReturnValue(mockToken);

        // Mock para simular un error 401 en la petición de usuario
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 401,
            json: async () => ({ detail: "Token inválido" }),
        });

        // Mock para la petición de logout (que se llama automáticamente al fallar)
        global.fetch.mockResolvedValueOnce({
            ok: true,
            status: 204,
        });

        let authContext;
        const onContextReady = (context) => {
            authContext = context;
        };

        await act(async () => {
            render(
                <AuthProvider>
                    <TestComponent onContextReady={onContextReady} />
                </AuthProvider>
            );
        });

        // Esperar primero a que se llame a removeItem
        await waitFor(() =>
            expect(localStorageMock.removeItem).toHaveBeenCalledWith(
                "authToken"
            )
        );

        // Luego esperar a que authToken sea null
        await waitFor(() => expect(authContext.authToken).toBeNull());
        expect(authContext.currentUser).toBeNull();
    });

    test("realiza login correctamente", async () => {
        const mockToken = "new-auth-token";
        const mockUser = { id: 1, username: "testuser" };

        // Mock para el servicio de login
        loginUser.mockResolvedValueOnce({ auth_token: mockToken });

        let authContext;
        const onContextReady = (context) => {
            authContext = context;
        };

        await act(async () => {
            render(
                <AuthProvider>
                    <TestComponent onContextReady={onContextReady} />
                </AuthProvider>
            );
        });

        await waitFor(() => expect(authContext).toBeDefined());

        // Configurar el mock para la petición de datos del usuario que se realizará después del login
        global.fetch.mockImplementationOnce(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockUser),
            })
        );

        // Realizar login
        let result;
        await act(async () => {
            result = await authContext.login("testuser", "password123");
        });

        // Verificar que el login fue exitoso
        expect(result).toBe(true);
        expect(loginUser).toHaveBeenCalledWith("testuser", "password123");
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
            "authToken",
            mockToken
        );
        expect(authContext.authToken).toBe(mockToken);

        // Esperar a que se complete la actualización del usuario
        await waitFor(() => {
            expect(authContext.currentUser).toEqual(mockUser);
        });

        // Verificar que fetch fue llamado para obtener datos del usuario
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/api/auth/users/me/"),
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: `Token ${mockToken}`,
                }),
            })
        );
    });

    test("maneja errores de login correctamente", async () => {
        // Mock para simular un error en el login
        loginUser.mockRejectedValueOnce(new Error("Credenciales inválidas"));

        let authContext;
        const onContextReady = (context) => {
            authContext = context;
        };

        await act(async () => {
            render(
                <AuthProvider>
                    <TestComponent onContextReady={onContextReady} />
                </AuthProvider>
            );
        });

        await waitFor(() => expect(authContext).toBeDefined());

        // Intentar login con credenciales incorrectas
        let result;
        await act(async () => {
            result = await authContext.login("wronguser", "wrongpass");
        });

        expect(result).toBe(false);
        expect(authContext.authError).toBe("Credenciales inválidas");
        expect(authContext.authToken).toBeNull();
        expect(authContext.currentUser).toBeNull();
    });

    test("realiza logout correctamente", async () => {
        // Configurar un estado inicial autenticado
        const mockToken = "existing-token";
        localStorageMock.getItem.mockReturnValue(mockToken);

        // Mock para la petición de datos del usuario
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 1, username: "testuser" }),
        });

        let authContext;
        const onContextReady = (context) => {
            authContext = context;
        };

        await act(async () => {
            render(
                <AuthProvider>
                    <TestComponent onContextReady={onContextReady} />
                </AuthProvider>
            );
        });

        await waitFor(() => expect(authContext.authToken).toBe(mockToken));

        // Realizar logout
        await act(async () => {
            await authContext.logout();
        });

        // Verificar que se llamó al endpoint de logout
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/api/auth/token/logout/"),
            expect.objectContaining({
                method: "POST",
                headers: expect.objectContaining({
                    Authorization: `Token ${mockToken}`,
                }),
            })
        );

        // Verificar que se limpiaron los datos locales
        expect(localStorageMock.removeItem).toHaveBeenCalledWith("authToken");
        expect(authContext.authToken).toBeNull();
        expect(authContext.currentUser).toBeNull();
    });

    test("maneja errores de logout correctamente", async () => {
        // Configurar un estado inicial autenticado
        const mockToken = "existing-token";
        localStorageMock.getItem.mockReturnValue(mockToken);

        // Mock para la petición de datos del usuario
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 1, username: "testuser" }),
        });

        // Mock para simular un error en el logout
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            statusText: "Internal Server Error",
        });

        let authContext;
        const onContextReady = (context) => {
            authContext = context;
        };

        await act(async () => {
            render(
                <AuthProvider>
                    <TestComponent onContextReady={onContextReady} />
                </AuthProvider>
            );
        });

        await waitFor(() => expect(authContext.authToken).toBe(mockToken));

        // Realizar logout
        await act(async () => {
            await authContext.logout();
        });

        // Incluso con error en el servidor, debería limpiar los datos locales
        expect(localStorageMock.removeItem).toHaveBeenCalledWith("authToken");
        expect(authContext.authToken).toBeNull();
        expect(authContext.currentUser).toBeNull();
    });

    test("AuthContext proporciona todas las funcionalidades necesarias", async () => {
        let authContext;
        const onContextReady = (context) => {
            authContext = context;
        };

        await act(async () => {
            render(
                <AuthProvider>
                    <TestComponent onContextReady={onContextReady} />
                </AuthProvider>
            );
        });

        await waitFor(() => expect(authContext).toBeDefined());

        // Verificar que el contexto proporciona todas las funciones y propiedades necesarias
        expect(authContext).toHaveProperty("authToken");
        expect(authContext).toHaveProperty("currentUser");
        expect(authContext).toHaveProperty("isLoading");
        expect(authContext).toHaveProperty("authError");
        expect(authContext).toHaveProperty("login");
        expect(authContext).toHaveProperty("logout");
        expect(authContext).toHaveProperty("setCurrentUser");
        expect(authContext).toHaveProperty("setAuthToken");
    });
});
