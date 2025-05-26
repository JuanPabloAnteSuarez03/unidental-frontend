import { Routes, Route } from "react-router-dom";
import InventoryPage from "../pages/InventoryPage";

const AppRouter = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div>
            <h1>Página de Inicio</h1>
            <h2>Bienvenido al Sistema</h2>
          </div>
        }
      />
      <Route path="/inventario" element={<InventoryPage />} />
      {/* Aquí puedes agregar más rutas según necesites */}
    </Routes>
  );
};

export default AppRouter;
