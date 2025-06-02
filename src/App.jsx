import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import MainLayout from "./components/layouts/MainLayout";
import AppRouter from "./router";

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <MainLayout>
                    <AppRouter />
                </MainLayout>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
