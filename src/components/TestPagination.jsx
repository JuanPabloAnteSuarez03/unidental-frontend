import React, { useState, useEffect } from "react";
import Pagination from "./Common/Pagination";

const TestPagination = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(10);
    const [totalCount, setTotalCount] = useState(250);
    const [itemsPerPage] = useState(25);
    const [testData, setTestData] = useState([]);

    // Simular datos de prueba
    useEffect(() => {
        const generateTestData = () => {
            const data = [];
            for (let i = 1; i <= totalCount; i++) {
                data.push({
                    id: i,
                    name: `Item ${i}`,
                    description: `Descripción del item ${i}`,
                    value: Math.floor(Math.random() * 1000),
                });
            }
            return data;
        };

        setTestData(generateTestData());
    }, [totalCount]);

    // Obtener datos de la página actual
    const getCurrentPageData = () => {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return testData.slice(start, end);
    };

    const handlePageChange = (newPage) => {
        console.log(
            `🔄 TestPagination: Cambiando de página ${currentPage} a ${newPage}`
        );
        setCurrentPage(newPage);
    };

    const currentData = getCurrentPageData();

    return (
        <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
            <h2>🧪 Prueba de Paginación</h2>
            <p>
                Esta es una prueba para verificar que la paginación funciona
                correctamente.
            </p>

            <div style={{ marginBottom: "20px" }}>
                <strong>Información:</strong>
                <ul>
                    <li>Página actual: {currentPage}</li>
                    <li>Total de páginas: {totalPages}</li>
                    <li>Total de elementos: {totalCount}</li>
                    <li>Elementos por página: {itemsPerPage}</li>
                    <li>Elementos en esta página: {currentData.length}</li>
                </ul>
            </div>

            <div style={{ marginBottom: "20px" }}>
                <h3>Datos de la página actual:</h3>
                <div
                    style={{
                        maxHeight: "300px",
                        overflowY: "auto",
                        border: "1px solid #ddd",
                        padding: "10px",
                        backgroundColor: "#f9f9f9",
                    }}
                >
                    {currentData.map((item) => (
                        <div
                            key={item.id}
                            style={{
                                padding: "8px",
                                borderBottom: "1px solid #eee",
                                backgroundColor: "white",
                                marginBottom: "4px",
                            }}
                        >
                            <strong>ID {item.id}:</strong> {item.name} -{" "}
                            {item.description} (Valor: ${item.value})
                        </div>
                    ))}
                </div>
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalCount={totalCount}
                itemsPerPage={itemsPerPage}
                label="elementos de prueba"
                showGoTo={true}
            />

            <div
                style={{
                    marginTop: "20px",
                    padding: "10px",
                    backgroundColor: "#e3f2fd",
                    borderRadius: "4px",
                }}
            >
                <h4>📋 Logs de la consola:</h4>
                <p>
                    Abre la consola del navegador (F12) para ver los logs
                    detallados de la paginación.
                </p>
            </div>
        </div>
    );
};

export default TestPagination;
