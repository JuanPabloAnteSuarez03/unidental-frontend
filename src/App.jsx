import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CustomersProvider } from "./context/CustomersContext";
import { ProductsProvider } from "./context/ProductsContext";
import MainLayout from "./components/layouts/MainLayout";
import AppRouter from "./router";
import useKeepBackendAwake from "./hooks/useKeepBackendAwake";

function App() {
    useKeepBackendAwake();
    return (
        <BrowserRouter>
            <AuthProvider>
                <CustomersProvider>
                    <ProductsProvider>
                        <MainLayout>
                            <AppRouter />
                        </MainLayout>
                    </ProductsProvider>
                </CustomersProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
