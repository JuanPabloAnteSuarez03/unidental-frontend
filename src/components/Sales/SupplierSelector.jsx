import React, { useState, useEffect, useCallback } from "react";
import { getSuppliers } from "../../services/suppliersService";
import { useAuth } from "../../context/AuthContext";

const SupplierSelector = ({ selectedSupplier, onSupplierSelected }) => {
    const { authToken } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredSuppliers, setFilteredSuppliers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (searchTerm.length < 2) {
            setFilteredSuppliers([]);
            return;
        }
        let isMounted = true;
        setIsLoading(true);
        getSuppliers({ search: searchTerm, page_size: 10 }, authToken)
            .then((data) => {
                if (isMounted) setFilteredSuppliers(data.results || []);
            })
            .catch(() => setFilteredSuppliers([]))
            .finally(() => isMounted && setIsLoading(false));
        return () => {
            isMounted = false;
        };
    }, [searchTerm, authToken]);

    const handleSelect = useCallback(
        (supplier) => {
            onSupplierSelected(supplier);
            setSearchTerm("");
            setFilteredSuppliers([]);
        },
        [onSupplierSelected]
    );

    return (
        <div>
            {selectedSupplier && (
                <div
                    style={{
                        marginBottom: 15,
                        padding: 15,
                        background: "#e8f4fd",
                        border: "1px solid #3498db",
                        borderRadius: 6,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <div>
                            <h4
                                style={{
                                    margin: 0,
                                    fontSize: 16,
                                    fontWeight: 600,
                                    color: "#2c3e50",
                                }}
                            >
                                {selectedSupplier.name}
                            </h4>
                            {selectedSupplier.email && (
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: 14,
                                        color: "#6c757d",
                                    }}
                                >
                                    {selectedSupplier.email}
                                </p>
                            )}
                            {selectedSupplier.phone && (
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: 14,
                                        color: "#6c757d",
                                    }}
                                >
                                    {selectedSupplier.phone}
                                </p>
                            )}
                        </div>
                        <button
                            onClick={() => onSupplierSelected(null)}
                            style={{
                                background: "none",
                                border: "none",
                                color: "#e74c3c",
                                cursor: "pointer",
                                fontWeight: 600,
                            }}
                        >
                            Quitar
                        </button>
                    </div>
                </div>
            )}
            <input
                type="text"
                placeholder="Buscar proveedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={!!selectedSupplier}
                style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 4,
                    border: "1px solid #ccc",
                    marginBottom: 8,
                }}
            />
            {isLoading && (
                <div style={{ color: "#888", fontSize: 14 }}>
                    Buscando proveedores...
                </div>
            )}
            {!selectedSupplier && filteredSuppliers.length > 0 && (
                <ul
                    style={{
                        listStyle: "none",
                        padding: 0,
                        margin: 0,
                        border: "1px solid #eee",
                        borderRadius: 4,
                        background: "#fff",
                        maxHeight: 200,
                        overflowY: "auto",
                    }}
                >
                    {filteredSuppliers.map((supplier) => (
                        <li
                            key={supplier.id}
                            style={{
                                padding: 10,
                                borderBottom: "1px solid #f0f0f0",
                                cursor: "pointer",
                            }}
                            onClick={() => handleSelect(supplier)}
                        >
                            <span style={{ fontWeight: 500 }}>
                                {supplier.name}
                            </span>
                            {supplier.email && (
                                <span style={{ color: "#888", marginLeft: 8 }}>
                                    {supplier.email}
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SupplierSelector;
