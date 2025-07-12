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
import NuevoProductoPage from "../pages/NuevoProductoPage";
import AlertasPage from "../pages/AlertasPage";
import AlertasStockPage from "../pages/AlertasStockPage";
import SuppliersPage from "../pages/SuppliersPage";
import SupplierDetailPage from "../pages/SupplierDetailPage";
import AnalisisPreciosPage from "../pages/AnalisisPreciosPage";
import OrdenesDeCompraPage from "../pages/OrdenesDeCompraPage";
import WhatsAppDebtsPage from "../pages/WhatsAppDebtsPage";
import CreditsSalesWhatsAppPage from "../pages/CreditsSalesWhatsAppPage";

import TotalVentasPage from "../pages/TotalVentasPage";
import ReportesPage from "../pages/ReportesPage";

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
        <Route
          path="/inventario/nuevo-producto"
          element={<NuevoProductoPage />}
        />
        <Route
          path="/inventario/alertas-vencimiento"
          element={<AlertasPage />}
        />
        <Route
          path="/inventario/alertas-stock"
          element={<AlertasStockPage />}
        />
        <Route path="/inventario/reportes" element={<ReportesPage />} />
        <Route path="/ventas" element={<SalesPage />} />
        <Route path="/ventas/devoluciones" element={<ReturnsPage />} />

        <Route path="/ventas/total" element={<TotalVentasPage />} />
        {/* Rutas de clientes */}
        <Route path="/clientes/lista" element={<CustomersListPage />} />
        <Route path="/clientes/nuevo" element={<NewCustomerPage />} />

        {/* Rutas de proveedores */}
        <Route path="/compras/proveedores" element={<SuppliersPage />} />
        <Route
          path="/compras/proveedores/:supplierName"
          element={<SupplierDetailPage />}
        />
        <Route
          path="/compras/analisis-precios"
          element={<AnalisisPreciosPage />}
        />
        <Route path="/compras/ordenes" element={<OrdenesDeCompraPage />} />
        {/* Ruta para deudas con WhatsApp */}
        <Route
          path="/compras/deudas-whatsapp"
          element={<WhatsAppDebtsPage />}
        />
        {/* Ruta para créditos de ventas con WhatsApp */}
        <Route
          path="/ventas/creditos-whatsapp"
          element={<CreditsSalesWhatsAppPage />}
        />
      </Route>
    </Routes>
  );
};

export default AppRouter;
