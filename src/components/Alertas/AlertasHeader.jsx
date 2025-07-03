import React from "react";

const AlertasHeader = ({ title = "Alertas de Vencimiento" }) => {
    return (
        <div className="alertas-header">
            <h1>{title}</h1>
        </div>
    );
};

export default AlertasHeader;
