import React, { useState } from "react";
import ReportesHeader from "../components/Reportes/ReportesHeader";
import VentasSection from "../components/Reportes/VentasSection";
import ComprasSection from "../components/Reportes/ComprasSection";
import ReportesStyles from "../components/Reportes/ReportesStyles";

const ReportesPage = () => {
    const [activeSection, setActiveSection] = useState("ventas");

    return (
        <>
            <ReportesStyles />

            {/* Header con navegación de secciones */}
            <ReportesHeader
                activeSection={activeSection}
                setActiveSection={setActiveSection}
            />

            {/* Contenido de la sección activa */}
            {activeSection === "ventas" && <VentasSection />}
            {activeSection === "compras" && <ComprasSection />}
        </>
    );
};

export default ReportesPage;
