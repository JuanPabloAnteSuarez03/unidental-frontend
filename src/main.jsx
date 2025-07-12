import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { ReportesProvider } from "./context/ReportesContext";

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        <AuthProvider>
            <ReportesProvider>
                <App />
            </ReportesProvider>
        </AuthProvider>
    </React.StrictMode>
);
