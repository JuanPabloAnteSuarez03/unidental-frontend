import React, { useState } from "react";

const Pagination = ({
    currentPage = 1,
    totalPages = 1,
    onPageChange,
    totalCount = 0,
    itemsPerPage = 25,
    isLoading = false,
}) => {
    const [goToPage, setGoToPage] = useState("");

    // Validaciones básicas
    if (totalPages <= 1) {
        return null;
    }

    if (typeof onPageChange !== "function") {
        console.error("❌ Pagination: onPageChange debe ser una función");
        return null;
    }

    const handlePageChange = (newPage) => {
        if (isLoading) return;

        if (newPage < 1 || newPage > totalPages) {
            console.warn(
                `⚠️ Página ${newPage} fuera de rango (1-${totalPages})`
            );
            return;
        }

        if (newPage === currentPage) {
            return;
        }

        console.log(`🔄 Cambiando de página ${currentPage} a ${newPage}`);
        onPageChange(newPage);
    };

    const handleGoToSubmit = (e) => {
        e.preventDefault();
        const page = parseInt(goToPage, 10);
        if (!isNaN(page) && page >= 1 && page <= totalPages) {
            handlePageChange(page);
            setGoToPage("");
        }
    };

    // Calcular elementos mostrados
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalCount);

    // Generar números de página a mostrar
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 7;

        if (totalPages <= maxVisible) {
            // Mostrar todas las páginas si hay 7 o menos
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Lógica para mostrar páginas con elipsis
            pages.push(1);

            let start = Math.max(2, currentPage - 2);
            let end = Math.min(totalPages - 1, currentPage + 2);

            if (start > 2) {
                pages.push("...");
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (end < totalPages - 1) {
                pages.push("...");
            }

            if (totalPages > 1) {
                pages.push(totalPages);
            }
        }

        return pages;
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px",
                marginTop: "24px",
                padding: "20px",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
                border: "1px solid #e9ecef",
            }}
        >
            {/* Información de elementos mostrados */}
            {totalCount > 0 && (
                <div
                    style={{
                        color: "#6c757d",
                        fontSize: "14px",
                        fontWeight: "500",
                    }}
                >
                    Mostrando {startItem}-{endItem} de {totalCount} productos
                </div>
            )}

            {/* Controles de paginación */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    flexWrap: "wrap",
                    justifyContent: "center",
                }}
            >
                {/* Botón Anterior */}
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1 || isLoading}
                    style={{
                        padding: "8px 16px",
                        border: "1px solid #dee2e6",
                        backgroundColor:
                            currentPage <= 1 || isLoading
                                ? "#f8f9fa"
                                : "#ffffff",
                        color:
                            currentPage <= 1 || isLoading
                                ? "#6c757d"
                                : "#495057",
                        borderRadius: "6px",
                        cursor:
                            currentPage <= 1 || isLoading
                                ? "not-allowed"
                                : "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        transition: "all 0.2s ease",
                        minWidth: "80px",
                    }}
                >
                    ← Anterior
                </button>

                {/* Números de página */}
                {getPageNumbers().map((page, index) => (
                    <React.Fragment key={`page-${index}`}>
                        {page === "..." ? (
                            <span
                                style={{
                                    padding: "8px 12px",
                                    color: "#6c757d",
                                    fontSize: "14px",
                                }}
                            >
                                ...
                            </span>
                        ) : (
                            <button
                                onClick={() => handlePageChange(page)}
                                disabled={isLoading}
                                style={{
                                    padding: "8px 12px",
                                    border: "1px solid",
                                    borderColor:
                                        page === currentPage
                                            ? "#007bff"
                                            : "#dee2e6",
                                    backgroundColor:
                                        page === currentPage
                                            ? "#007bff"
                                            : "#ffffff",
                                    color:
                                        page === currentPage
                                            ? "#ffffff"
                                            : "#495057",
                                    borderRadius: "6px",
                                    cursor: isLoading
                                        ? "not-allowed"
                                        : "pointer",
                                    fontSize: "14px",
                                    fontWeight:
                                        page === currentPage ? "600" : "500",
                                    minWidth: "40px",
                                    transition: "all 0.2s ease",
                                }}
                            >
                                {page}
                            </button>
                        )}
                    </React.Fragment>
                ))}

                {/* Botón Siguiente */}
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages || isLoading}
                    style={{
                        padding: "8px 16px",
                        border: "1px solid #dee2e6",
                        backgroundColor:
                            currentPage >= totalPages || isLoading
                                ? "#f8f9fa"
                                : "#ffffff",
                        color:
                            currentPage >= totalPages || isLoading
                                ? "#6c757d"
                                : "#495057",
                        borderRadius: "6px",
                        cursor:
                            currentPage >= totalPages || isLoading
                                ? "not-allowed"
                                : "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        transition: "all 0.2s ease",
                        minWidth: "80px",
                    }}
                >
                    Siguiente →
                </button>
            </div>

            {/* Ir a página específica */}
            <form
                onSubmit={handleGoToSubmit}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                }}
            >
                <label
                    htmlFor="go-to-page"
                    style={{
                        fontSize: "14px",
                        color: "#495057",
                        fontWeight: "500",
                    }}
                >
                    Ir a página:
                </label>
                <input
                    id="go-to-page"
                    type="number"
                    min="1"
                    max={totalPages}
                    value={goToPage}
                    onChange={(e) => setGoToPage(e.target.value)}
                    disabled={isLoading}
                    style={{
                        width: "60px",
                        padding: "6px 8px",
                        border: "1px solid #ced4da",
                        borderRadius: "4px",
                        fontSize: "14px",
                        textAlign: "center",
                    }}
                    placeholder={currentPage.toString()}
                />
                <button
                    type="submit"
                    disabled={isLoading}
                    style={{
                        padding: "6px 12px",
                        backgroundColor: "#007bff",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "14px",
                        cursor: isLoading ? "not-allowed" : "pointer",
                        fontWeight: "500",
                        transition: "background-color 0.2s ease",
                    }}
                >
                    Ir
                </button>
            </form>
        </div>
    );
};

export default Pagination;
