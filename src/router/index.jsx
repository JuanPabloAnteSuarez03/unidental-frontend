// src/router/index.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import InventoryPage from "../pages/InventoryPage";
import LoginPage from "../pages/LoginPage";
import SalesPage from "../pages/SalesPage";
import ReturnsPage from "../pages/ReturnsPage";
import CustomersListPage from "../pages/CustomersListPage";
import NewCustomerPage from "../pages/NewCustomerPage";
import ProtectedRoute from "./ProtectedRoute";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordConfirmPage from "../pages/ResetPasswordConfirmPage";
import MovimientosDeStockPage from "../pages/MovimientosDeStockPage";
import TransferenciasInternasPage from "../pages/TransferenciasInternasPage";

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
                <Route
                    path="/inventario/movimientos"
                    element={<MovimientosDeStockPage />}
                />
                <Route
                    path="/inventario/transferencias"
                    element={<TransferenciasInternasPage />}
                />
                <Route path="/ventas" element={<SalesPage />} />
                <Route path="/ventas/devoluciones" element={<ReturnsPage />} />
                {/* Rutas de clientes */}
                <Route path="/clientes/lista" element={<CustomersListPage />} />
                <Route path="/clientes/nuevo" element={<NewCustomerPage />} />
            </Route>
        </Routes>
    );
};

export default AppRouter;
