// src/router/index.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import InventoryPage from "../pages/InventoryPage";
import LoginPage from "../pages/LoginPage";
import ProtectedRoute from "./ProtectedRoute";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordConfirmPage from "../pages/ResetPasswordConfirmPage";

const AppRouter = () => {
    return (
        <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/password-reset" element={<ForgotPasswordPage />} />
            <Route
                path="/password-reset/confirm/:uid/:token"
                element={<ResetPasswordConfirmPage />}
            />
            {/* Rutas protegidas */}
            <Route element={<ProtectedRoute />}>
                <Route path="/inventario" element={<InventoryPage />} />
            </Route>
        </Routes>
    );
};

export default AppRouter;
