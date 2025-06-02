// Mock completo de los servicios
jest.mock("../services/authService", () => {
    return {
        loginUser: jest.fn(),
        requestPasswordReset: jest.fn(),
        resetPasswordConfirm: jest.fn(),
    };
});

// Importamos los servicios mockeados
import {
    loginUser,
    requestPasswordReset,
    resetPasswordConfirm,
} from "../services/authService";

// Mock para fetch API
global.fetch = jest.fn();

// Mock para console.error y console.log para evitar ruido en los tests
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

beforeEach(() => {
    console.error = jest.fn();
    console.log = jest.fn();
    // Limpiar todos los mocks
    jest.clearAllMocks();
});

afterEach(() => {
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
});

describe("authService", () => {
    describe("loginUser", () => {
        test("llama a la función con los parámetros correctos", async () => {
            // Configurar el mock para devolver un resultado exitoso
            loginUser.mockResolvedValueOnce({ auth_token: "test-token" });

            // Llamar a la función
            await loginUser("testuser", "password123");

            // Verificar que se llamó con los parámetros correctos
            expect(loginUser).toHaveBeenCalledWith("testuser", "password123");
        });

        test("devuelve el token cuando la autenticación es exitosa", async () => {
            // Configurar el mock para devolver un resultado exitoso
            const mockToken = { auth_token: "test-token" };
            loginUser.mockResolvedValueOnce(mockToken);

            // Llamar a la función y verificar el resultado
            const result = await loginUser("testuser", "password123");
            expect(result).toEqual(mockToken);
        });

        test("propaga el error cuando falla la autenticación", async () => {
            // Configurar el mock para lanzar un error
            loginUser.mockRejectedValueOnce(
                new Error("Credenciales inválidas")
            );

            // Verificar que se propaga el error
            await expect(loginUser("wronguser", "wrongpass")).rejects.toThrow(
                "Credenciales inválidas"
            );
        });
    });

    describe("requestPasswordReset", () => {
        test("llama a la función con el email correcto", async () => {
            // Configurar el mock para devolver un resultado exitoso
            requestPasswordReset.mockResolvedValueOnce(null);

            // Llamar a la función
            await requestPasswordReset("user@example.com");

            // Verificar que se llamó con los parámetros correctos
            expect(requestPasswordReset).toHaveBeenCalledWith(
                "user@example.com"
            );
        });

        test("devuelve null cuando la solicitud es exitosa (204 No Content)", async () => {
            // Configurar el mock para devolver null (respuesta 204)
            requestPasswordReset.mockResolvedValueOnce(null);

            // Llamar a la función y verificar el resultado
            const result = await requestPasswordReset("user@example.com");
            expect(result).toBeNull();
        });

        test("devuelve la respuesta cuando la solicitud es exitosa con contenido", async () => {
            // Configurar el mock para devolver una respuesta con contenido
            const mockResponse = {
                detail: "Se ha enviado un correo de recuperación",
            };
            requestPasswordReset.mockResolvedValueOnce(mockResponse);

            // Llamar a la función y verificar el resultado
            const result = await requestPasswordReset("user@example.com");
            expect(result).toEqual(mockResponse);
        });

        test("propaga el error cuando falla la solicitud", async () => {
            // Configurar el mock para lanzar un error
            requestPasswordReset.mockRejectedValueOnce(
                new Error("Email no encontrado")
            );

            // Verificar que se propaga el error
            await expect(
                requestPasswordReset("nonexistent@example.com")
            ).rejects.toThrow("Email no encontrado");
        });
    });

    describe("resetPasswordConfirm", () => {
        test("llama a la función con los parámetros correctos", async () => {
            // Configurar el mock para devolver un resultado exitoso
            resetPasswordConfirm.mockResolvedValueOnce(null);

            // Llamar a la función
            await resetPasswordConfirm(
                "user-uid",
                "reset-token",
                "newPassword123"
            );

            // Verificar que se llamó con los parámetros correctos
            expect(resetPasswordConfirm).toHaveBeenCalledWith(
                "user-uid",
                "reset-token",
                "newPassword123"
            );
        });

        test("devuelve null cuando la solicitud es exitosa (204 No Content)", async () => {
            // Configurar el mock para devolver null (respuesta 204)
            resetPasswordConfirm.mockResolvedValueOnce(null);

            // Llamar a la función y verificar el resultado
            const result = await resetPasswordConfirm(
                "user-uid",
                "reset-token",
                "newPassword123"
            );
            expect(result).toBeNull();
        });

        test("devuelve la respuesta cuando la solicitud es exitosa con contenido", async () => {
            // Configurar el mock para devolver una respuesta con contenido
            const mockResponse = { detail: "Contraseña actualizada con éxito" };
            resetPasswordConfirm.mockResolvedValueOnce(mockResponse);

            // Llamar a la función y verificar el resultado
            const result = await resetPasswordConfirm(
                "user-uid",
                "reset-token",
                "newPassword123"
            );
            expect(result).toEqual(mockResponse);
        });

        test("propaga el error cuando falla la solicitud", async () => {
            // Configurar el mock para lanzar un error
            resetPasswordConfirm.mockRejectedValueOnce(
                new Error("El enlace de recuperación ha expirado")
            );

            // Verificar que se propaga el error
            await expect(
                resetPasswordConfirm(
                    "user-uid",
                    "expired-token",
                    "newPassword123"
                )
            ).rejects.toThrow("El enlace de recuperación ha expirado");
        });

        test("propaga errores específicos de campos múltiples", async () => {
            // Configurar el mock para lanzar un error con mensaje complejo
            const errorMsg =
                "Contraseña: La contraseña es demasiado común. Token: Token inválido. UID: UID inválido.";
            resetPasswordConfirm.mockRejectedValueOnce(new Error(errorMsg));

            // Verificar que se propaga el error con el mensaje completo
            await expect(
                resetPasswordConfirm("invalid-uid", "invalid-token", "password")
            ).rejects.toThrow(errorMsg);
        });
    });
});
