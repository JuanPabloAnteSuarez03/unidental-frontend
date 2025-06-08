// NameSearch.jsx

import React, { useState, useEffect } from "react";

const NameSearch = ({ value, onChange }) => {
    const [searchTerm, setSearchTerm] = useState(value || "");

    useEffect(() => {
        setSearchTerm(value || "");
    }, [value]);

    const handleChange = (e) => {
        const newValue = e.target.value;
        setSearchTerm(newValue);
        onChange(newValue);
    };

    // --- ESTILOS MODIFICADOS ---
    const styles = {
        container: {
            // Ya no usamos flex para que no se expanda
        },
        label: {
            display: "block",
            marginBottom: "5px",
            fontSize: "14px",
            fontWeight: "500",
            color: "#495057",
        },
        input: {
            width: "250px", // Ancho fijo más pequeño
            padding: "8px 12px",
            fontSize: "14px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            outline: "none",
        },
    };

    return (
        <div style={styles.container}>
            <label htmlFor="nameSearch" style={styles.label}>
                Nombre del producto
            </label>
            <input
                id="nameSearch"
                type="text"
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={handleChange}
                style={styles.input}
            />
        </div>
    );
};

export default NameSearch;
