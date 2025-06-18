import React, { useState, useEffect, useCallback, useMemo } from "react";
import "./Pagination.css";

const Pagination = ({
    currentPage,
    totalPages,
    goToPage,
    goToNextPage,
    goToPrevPage,
    hasNextPage,
    hasPrevPage,
    isLoading,
    totalItems,
}) => {
    const [pageInputValue, setPageInputValue] = useState(currentPage);
    const itemsPerPage = 25;

    // Actualizar el valor del input cuando cambia la página actual
    useEffect(() => {
        setPageInputValue(currentPage);
    }, [currentPage]);

    // Calcular información de la paginación con useMemo para evitar recálculos innecesarios
    const paginationInfo = useMemo(() => {
        const startItem = (currentPage - 1) * itemsPerPage + 1;
        const endItem = Math.min(
            currentPage * itemsPerPage,
            totalItems || totalPages * itemsPerPage
        );
        const calculatedTotalItems = totalItems || totalPages * itemsPerPage;

        return { startItem, endItem, calculatedTotalItems };
    }, [currentPage, totalItems, totalPages, itemsPerPage]);

    const { startItem, endItem, calculatedTotalItems } = paginationInfo;

    // Manejar cambio en el input de página con useCallback
    const handleInputChange = useCallback((e) => {
        const value = e.target.value;
        if (value === "" || /^\d+$/.test(value)) {
            setPageInputValue(value);
        }
    }, []);

    // Manejar navegación a una página específica con useCallback
    const handleGoToPage = useCallback(() => {
        const pageNumber = parseInt(pageInputValue, 10);
        if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
            goToPage(pageNumber);
        } else {
            setPageInputValue(currentPage);
        }
    }, [pageInputValue, totalPages, goToPage, currentPage]);

    // Manejar tecla Enter en el input con useCallback
    const handleKeyPress = useCallback(
        (e) => {
            if (e.key === "Enter") {
                handleGoToPage();
            }
        },
        [handleGoToPage]
    );

    // Generar números de página a mostrar con useMemo
    const pageNumbers = useMemo(() => {
        const result = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            // Mostrar todas las páginas si son pocas
            for (let i = 1; i <= totalPages; i++) {
                result.push(i);
            }
        } else {
            // Siempre mostrar la primera página
            result.push(1);

            // Calcular rango de páginas a mostrar
            let start = Math.max(2, currentPage - 1);
            let end = Math.min(totalPages - 1, currentPage + 1);

            // Ajustar para mostrar siempre 3 páginas intermedias
            if (start === 2) end = Math.min(4, totalPages - 1);
            if (end === totalPages - 1) start = Math.max(2, totalPages - 3);

            // Añadir elipsis antes si es necesario
            if (start > 2) result.push("...");

            // Añadir páginas intermedias
            for (let i = start; i <= end; i++) {
                result.push(i);
            }

            // Añadir elipsis después si es necesario
            if (end < totalPages - 1) result.push("...");

            // Siempre mostrar la última página
            result.push(totalPages);
        }

        return result;
    }, [currentPage, totalPages]);

    // Si no hay páginas, no mostrar el componente
    if (totalPages <= 0) return null;

    return (
        <div
            className="pagination-container"
            style={styles.container}
            role="navigation"
            aria-label="Paginación"
        >
            {/* Información de elementos mostrados */}
            <div className="pagination-counter" style={styles.pageCounter}>
                Mostrando {startItem}-{endItem} de {calculatedTotalItems}{" "}
                elementos
            </div>

            {/* Controles de navegación */}
            <div
                className="pagination-controls"
                style={styles.controlsContainer}
            >
                {/* Botón anterior */}
                <button
                    className="pagination-btn"
                    onClick={goToPrevPage}
                    disabled={!hasPrevPage || isLoading}
                    style={styles.button(hasPrevPage && !isLoading)}
                    aria-label="Ir a la página anterior"
                >
                    Anterior
                </button>

                {/* Números de página */}
                <div
                    className="pagination-numbers"
                    style={styles.pageNumbers}
                    role="list"
                >
                    {pageNumbers.map((page, index) =>
                        page === "..." ? (
                            <span
                                key={`ellipsis-${index}`}
                                className="pagination-ellipsis"
                                style={styles.ellipsis}
                            >
                                ...
                            </span>
                        ) : (
                            <button
                                key={`page-${page}`}
                                className={`pagination-number ${
                                    page === currentPage
                                        ? "pagination-active"
                                        : ""
                                }`}
                                onClick={() => goToPage(page)}
                                style={styles.pageNumber(page === currentPage)}
                                disabled={isLoading}
                                aria-label={`Ir a la página ${page}`}
                                aria-current={
                                    page === currentPage ? "page" : null
                                }
                                role="listitem"
                            >
                                {page}
                            </button>
                        )
                    )}
                </div>

                {/* Botón siguiente */}
                <button
                    className="pagination-btn"
                    onClick={goToNextPage}
                    disabled={!hasNextPage || isLoading}
                    style={styles.button(hasNextPage && !isLoading)}
                    aria-label="Ir a la página siguiente"
                >
                    Siguiente
                </button>
            </div>

            {/* Ir a página específica */}
            <div className="pagination-goto" style={styles.goToPageContainer}>
                <label htmlFor="page-input">Ir a página:</label>
                <input
                    id="page-input"
                    type="text"
                    className="pagination-input"
                    value={pageInputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                    style={styles.pageInput}
                    disabled={isLoading}
                    aria-label="Número de página"
                />
                <button
                    className="pagination-go-btn"
                    onClick={handleGoToPage}
                    disabled={isLoading}
                    style={styles.goButton}
                    aria-label="Ir a la página especificada"
                >
                    Ir
                </button>
            </div>
        </div>
    );
};

// Estilos del componente
const styles = {
    container: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        margin: "20px 0",
        flexWrap: "wrap",
        gap: "15px",
    },
    controlsContainer: {
        display: "flex",
        alignItems: "center",
        gap: "10px",
    },
    button: (enabled) => ({
        padding: "8px 16px",
        backgroundColor: enabled ? "#2c3e50" : "#e9ecef",
        color: enabled ? "#ffffff" : "#adb5bd",
        border: "none",
        borderRadius: "4px",
        fontSize: "14px",
        fontWeight: "500",
        cursor: enabled ? "pointer" : "not-allowed",
        transition: "all 0.2s ease",
    }),
    pageNumbers: {
        display: "flex",
        alignItems: "center",
        gap: "5px",
    },
    pageNumber: (isActive) => ({
        padding: "6px 12px",
        backgroundColor: isActive ? "#2c3e50" : "#ffffff",
        color: isActive ? "#ffffff" : "#495057",
        border: "1px solid #dee2e6",
        borderRadius: "4px",
        fontSize: "14px",
        cursor: "pointer",
        transition: "all 0.2s ease",
    }),
    ellipsis: {
        padding: "6px 12px",
        color: "#6c757d",
        fontSize: "14px",
    },
    pageCounter: {
        fontSize: "14px",
        color: "#495057",
        fontWeight: "500",
    },
    goToPageContainer: {
        display: "flex",
        alignItems: "center",
        gap: "8px",
    },
    pageInput: {
        width: "60px",
        padding: "6px 8px",
        border: "1px solid #ced4da",
        borderRadius: "4px",
        fontSize: "14px",
        textAlign: "center",
    },
    goButton: {
        padding: "6px 12px",
        backgroundColor: "#2c3e50",
        color: "#ffffff",
        border: "none",
        borderRadius: "4px",
        fontSize: "14px",
        cursor: "pointer",
        transition: "background-color 0.2s ease",
    },
};

export default Pagination;
