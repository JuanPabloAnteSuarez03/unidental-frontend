import React, { useState, useCallback, useMemo, useEffect } from "react";

const Pagination = ({
    currentPage,
    totalPages,
    goToPage,
    goToNextPage,
    goToPrevPage,
    hasNextPage,
    hasPrevPage,
    isLoading,
}) => {
    // Estado para almacenar el valor del input
    const [pageInputValue, setPageInputValue] = useState(currentPage);
    // Estado para almacenar el valor máximo de página válido
    const [maxValidPage, setMaxValidPage] = useState(totalPages);

    // Actualizar el valor del input cuando cambia la página actual
    useEffect(() => {
        setPageInputValue(currentPage);
    }, [currentPage]);

    // Actualizar el valor máximo de página cuando cambia totalPages
    useEffect(() => {
        setMaxValidPage(totalPages);
    }, [totalPages]);

    // Estilos memoizados para evitar recreaciones
    const styles = useMemo(
        () => ({
            container: {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "20px 0",
                flexWrap: "wrap",
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
            pageInfo: {
                margin: "0 15px",
                color: "#495057",
                fontSize: "14px",
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
            pageNumbers: {
                display: "flex",
                alignItems: "center",
                gap: "5px",
                flexWrap: "wrap",
                margin: "0 10px",
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
            maxPagesInfo: {
                padding: "4px 8px",
                fontSize: "13px",
                color: "#dc3545",
                display: "none", // Inicialmente oculto
            },
            pageCounter: {
                padding: "4px 8px",
                fontSize: "13px",
                color: "#495057",
                fontWeight: "500",
            },
        }),
        []
    );

    // Referencia para el mensaje de error
    const errorMessageRef = React.useRef(null);

    // Manejador para actualizar el valor del input
    const handleInputChange = useCallback((e) => {
        const value = e.target.value;
        if (value === "" || /^\d+$/.test(value)) {
            setPageInputValue(value);

            // Ocultar mensaje de error si estaba visible
            if (errorMessageRef.current) {
                errorMessageRef.current.style.display = "none";
            }
        }
    }, []);

    // Manejador para ir a la página ingresada con validación estricta
    const handleGoToPage = useCallback(() => {
        const pageNumber = parseInt(pageInputValue, 10);

        if (!isNaN(pageNumber)) {
            if (pageNumber >= 1 && pageNumber <= maxValidPage) {
                goToPage(pageNumber);
                // Ocultar mensaje de error si estaba visible
                if (errorMessageRef.current) {
                    errorMessageRef.current.style.display = "none";
                }
            } else {
                // Mostrar mensaje de error
                if (errorMessageRef.current) {
                    errorMessageRef.current.style.display = "block";
                }
                // Restaurar al valor válido si es inválido
                setPageInputValue(currentPage);
            }
        } else {
            // Restaurar al valor válido si no es un número
            setPageInputValue(currentPage);
        }
    }, [pageInputValue, maxValidPage, goToPage, currentPage]);

    // Manejador para la tecla Enter en el input
    const handleKeyPress = useCallback(
        (e) => {
            if (e.key === "Enter") {
                handleGoToPage();
            }
        },
        [handleGoToPage]
    );

    // Generar array de páginas a mostrar con elipsis para muchas páginas
    const pageNumbers = useMemo(() => {
        const range = [];
        const maxVisiblePages = 5;
        const maxPage = maxValidPage;

        if (maxPage <= maxVisiblePages) {
            // Mostrar todas las páginas si son pocas
            for (let i = 1; i <= maxPage; i++) {
                range.push(i);
            }
        } else {
            // Siempre mostrar la primera página
            range.push(1);

            // Calcular el rango de páginas a mostrar
            let start = Math.max(2, currentPage - 1);
            let end = Math.min(maxPage - 1, currentPage + 1);

            // Ajustar para mostrar siempre 3 páginas (o las que quepan)
            if (start === 2) end = Math.min(4, maxPage - 1);
            if (end === maxPage - 1) start = Math.max(2, maxPage - 3);

            // Añadir elipsis antes si es necesario
            if (start > 2) range.push("...");

            // Añadir páginas intermedias
            for (let i = start; i <= end; i++) {
                range.push(i);
            }

            // Añadir elipsis después si es necesario
            if (end < maxPage - 1) range.push("...");

            // Siempre mostrar la última página
            range.push(maxPage);
        }

        return range;
    }, [currentPage, maxValidPage]);

    // Manejadores de eventos para botones específicos
    const handlePageClick = useCallback(
        (page) => {
            if (typeof page === "number" && page <= maxValidPage) {
                goToPage(page);
            }
        },
        [goToPage, maxValidPage]
    );

    // Manejadores de eventos para estilos
    const handleButtonHover = useCallback((e, enabled) => {
        if (enabled) {
            e.target.style.backgroundColor = "#34495e";
        }
    }, []);

    const handleButtonLeave = useCallback((e, enabled) => {
        if (enabled) {
            e.target.style.backgroundColor = "#2c3e50";
        }
    }, []);

    // Información adicional sobre la paginación
    const paginationInfo = useMemo(() => {
        const itemsPerPage = Math.ceil(totalItems / totalPages); // Derive items per page dynamically
        const startItem = (currentPage - 1) * itemsPerPage + 1;
        let endItem = currentPage * itemsPerPage;

        // Si estamos en la última página, el último ítem es el total
        if (currentPage === totalPages) {
            endItem = totalItems;
        }

        return {
            startItem,
            endItem,
        };
    }, [currentPage, maxValidPage]);

    // No renderizar el componente si no hay páginas
    if (maxValidPage === 0) {
        return null;
    }

    return (
        <div style={styles.container}>
            {/* Botón Anterior */}
            <button
                onClick={goToPrevPage}
                disabled={!hasPrevPage || isLoading}
                style={styles.button(hasPrevPage && !isLoading)}
                onMouseOver={(e) =>
                    handleButtonHover(e, hasPrevPage && !isLoading)
                }
                onMouseOut={(e) =>
                    handleButtonLeave(e, hasPrevPage && !isLoading)
                }
                aria-label="Página anterior"
            >
                ← Anterior
            </button>

            {/* Números de página con elipsis */}
            <div style={styles.pageNumbers}>
                {pageNumbers.map((page, index) =>
                    page === "..." ? (
                        <span key={`ellipsis-${index}`} style={styles.ellipsis}>
                            ...
                        </span>
                    ) : (
                        <button
                            key={`page-${page}`}
                            style={styles.pageNumber(page === currentPage)}
                            onClick={() => handlePageClick(page)}
                            onMouseOver={(e) => {
                                if (page !== currentPage) {
                                    e.target.style.backgroundColor = "#f8f9fa";
                                }
                            }}
                            onMouseOut={(e) => {
                                if (page !== currentPage) {
                                    e.target.style.backgroundColor = "#ffffff";
                                }
                            }}
                        >
                            {page}
                        </button>
                    )
                )}
            </div>

            {/* Botón Siguiente */}
            <button
                onClick={goToNextPage}
                disabled={
                    !hasNextPage || isLoading || currentPage >= maxValidPage
                }
                style={styles.button(
                    hasNextPage && !isLoading && currentPage < maxValidPage
                )}
                onMouseOver={(e) =>
                    handleButtonHover(
                        e,
                        hasNextPage && !isLoading && currentPage < maxValidPage
                    )
                }
                onMouseOut={(e) =>
                    handleButtonLeave(
                        e,
                        hasNextPage && !isLoading && currentPage < maxValidPage
                    )
                }
                aria-label="Página siguiente"
            >
                Siguiente →
            </button>

            {/* Input para ir a página específica */}
            <div style={styles.pageInfo}>
                <span>Ir a página:</span>
                <input
                    type="text"
                    value={pageInputValue}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    style={styles.pageInput}
                    aria-label="Número de página"
                    min="1"
                    max={maxValidPage}
                />
                <button
                    onClick={handleGoToPage}
                    style={styles.goButton}
                    onMouseOver={(e) => {
                        e.target.style.backgroundColor = "#34495e";
                    }}
                    onMouseOut={(e) => {
                        e.target.style.backgroundColor = "#2c3e50";
                    }}
                    aria-label="Ir a página"
                >
                    Ir
                </button>
                <span>de {maxValidPage}</span>
                <div ref={errorMessageRef} style={styles.maxPagesInfo}>
                    Solo hay {maxValidPage} página
                    {maxValidPage !== 1 ? "s" : ""} disponible
                    {maxValidPage !== 1 ? "s" : ""} con productos
                </div>
            </div>

            {/* Contador de ítems */}
            <div style={styles.pageCounter}>
                Mostrando {paginationInfo.startItem}-{paginationInfo.endItem} de
                aproximadamente {maxValidPage * 25} productos
            </div>
        </div>
    );
};

export default React.memo(Pagination);
