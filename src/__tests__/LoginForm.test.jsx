import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router-dom";
import LoginForm from "../components/Auth/LoginForm";

// Wrapper para renderizar con BrowserRouter (necesario para el Link)
const renderWithRouter = (ui) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe("LoginForm", () => {
    // Props por defecto para el componente
    const defaultProps = {
        onLoginSubmit: jest.fn(),
        error: null,
        loading: false,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("renders form with username and password inputs", () => {
        renderWithRouter(<LoginForm {...defaultProps} />);

        // Verificar que los campos de usuario y contraseña están presentes
        const usernameInput = screen.getByLabelText(/nombre de usuario/i);
        const passwordInput = screen.getByLabelText(/contraseña/i);

        expect(usernameInput).toBeInTheDocument();
        expect(passwordInput).toBeInTheDocument();
    });

    test("renders submit button with correct text", () => {
        renderWithRouter(<LoginForm {...defaultProps} />);

        // Verificar que el botón de envío está presente y tiene el texto correcto
        const submitButton = screen.getByRole("button", { name: /ingresar/i });
        expect(submitButton).toBeInTheDocument();
        expect(submitButton).not.toBeDisabled();
    });

    test("renders 'forgot password' link", () => {
        renderWithRouter(<LoginForm {...defaultProps} />);

        // Verificar que el enlace "¿No recuerdo mi contraseña?" está presente
        const forgotPasswordLink = screen.getByText(
            /¿no recuerdo mi contraseña?/i
        );
        expect(forgotPasswordLink).toBeInTheDocument();
        expect(forgotPasswordLink.tagName).toBe("A");
        expect(forgotPasswordLink).toHaveAttribute("href", "/password-reset");
    });

    test("updates username and password on input change", () => {
        renderWithRouter(<LoginForm {...defaultProps} />);

        // Obtener los campos de entrada
        const usernameInput = screen.getByLabelText(/nombre de usuario/i);
        const passwordInput = screen.getByLabelText(/contraseña/i);

        // Simular cambios en los inputs
        fireEvent.change(usernameInput, { target: { value: "testuser" } });
        fireEvent.change(passwordInput, { target: { value: "testpassword" } });

        // Verificar que los valores se actualizaron
        expect(usernameInput.value).toBe("testuser");
        expect(passwordInput.value).toBe("testpassword");
    });

    test("calls onLoginSubmit with correct values on form submission", () => {
        const mockSubmit = jest.fn();
        renderWithRouter(
            <LoginForm {...defaultProps} onLoginSubmit={mockSubmit} />
        );

        // Obtener los campos de entrada y el botón de submit
        const usernameInput = screen.getByLabelText(/nombre de usuario/i);
        const passwordInput = screen.getByLabelText(/contraseña/i);
        const submitButton = screen.getByRole("button", { name: /ingresar/i });

        // Simular cambios en los inputs
        fireEvent.change(usernameInput, { target: { value: "testuser" } });
        fireEvent.change(passwordInput, { target: { value: "testpassword" } });

        // Simular envío del formulario usando el botón
        fireEvent.click(submitButton);

        // Verificar que la función onLoginSubmit se llamó con los valores correctos
        expect(mockSubmit).toHaveBeenCalledTimes(1);
        expect(mockSubmit).toHaveBeenCalledWith({
            username: "testuser",
            password: "testpassword",
        });
    });

    test("shows loading state when loading prop is true", () => {
        renderWithRouter(<LoginForm {...defaultProps} loading={true} />);

        // Verificar que el botón muestra el texto de carga
        const submitButton = screen.getByRole("button", {
            name: /ingresando/i,
        });
        expect(submitButton).toBeInTheDocument();
        expect(submitButton).toBeDisabled();

        // Verificar que los inputs están deshabilitados
        const usernameInput = screen.getByLabelText(/nombre de usuario/i);
        const passwordInput = screen.getByLabelText(/contraseña/i);
        expect(usernameInput).toBeDisabled();
        expect(passwordInput).toBeDisabled();
    });

    test("displays error message when error prop is provided", () => {
        const errorMessage = "Credenciales inválidas";
        renderWithRouter(<LoginForm {...defaultProps} error={errorMessage} />);

        // Verificar que el mensaje de error se muestra
        const errorElement = screen.getByText(errorMessage);
        expect(errorElement).toBeInTheDocument();
    });

    test("does not display error message when error prop is null", () => {
        renderWithRouter(<LoginForm {...defaultProps} error={null} />);

        // Verificar que no hay mensajes de error
        const errorElements = screen.queryByText(/credenciales inválidas/i);
        expect(errorElements).not.toBeInTheDocument();
    });

    test("form submission is prevented on submit", () => {
        const mockSubmit = jest.fn();
        renderWithRouter(
            <LoginForm {...defaultProps} onLoginSubmit={mockSubmit} />
        );

        // Obtener el formulario usando data-testid
        const form = screen.getByTestId("login-form");

        // Simular envío del formulario directamente
        fireEvent.submit(form);

        // Verificar que se llamó a la función onLoginSubmit
        expect(mockSubmit).toHaveBeenCalledTimes(1);
    });
});
