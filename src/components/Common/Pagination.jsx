import React from "react";

const Pagination = ({
    currentPage = 1,
    totalPages = 1,
    onPageChange,
    showGoTo = false,
    totalCount = null,
    itemsPerPage = null,
    label = "registros",
}) => {
    if (totalPages <= 1) return null;

    const handleGoTo = (e) => {
        e.preventDefault();
        const page = parseInt(e.target.elements.page.value, 10);
        if (!isNaN(page) && page >= 1 && page <= totalPages) {
            onPageChange(page);
        }
    };

    const startItem = itemsPerPage
        ? (currentPage - 1) * itemsPerPage + 1
        : null;
    const endItem =
        itemsPerPage && totalCount
            ? Math.min(currentPage * itemsPerPage, totalCount)
            : null;

    // Paginación simple con máximo 5 páginas visibles
    const getPageNumbers = () => {
        const maxVisible = 5;
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, start + maxVisible - 1);
        if (end - start < maxVisible - 1) {
            start = Math.max(1, end - maxVisible + 1);
        }
        const pages = [];
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    };

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "16px",
                marginTop: "24px",
                flexWrap: "wrap",
            }}
        >
            {totalCount && itemsPerPage && (
                <span style={{ color: "#6c757d", fontSize: 14 }}>
                    Mostrando {startItem}-{endItem} de {totalCount} {label}
                </span>
            )}
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                style={{
                    padding: "8px 16px",
                    border: "1px solid #e9ecef",
                    backgroundColor: currentPage <= 1 ? "#f8f9fa" : "#fff",
                    borderRadius: "8px",
                    color: currentPage <= 1 ? "#6c757d" : "#495057",
                    cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                }}
            >
                ← Anterior
            </button>
            {getPageNumbers().map((page) => (
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    style={{
                        padding: "8px 12px",
                        border: "1px solid",
                        borderColor:
                            page === currentPage ? "#007bff" : "#e9ecef",
                        backgroundColor:
                            page === currentPage ? "#007bff" : "#fff",
                        borderRadius: "8px",
                        color: page === currentPage ? "#fff" : "#495057",
                        cursor: "pointer",
                        fontSize: "14px",
                        fontWeight: page === currentPage ? "600" : "500",
                        minWidth: "40px",
                    }}
                >
                    {page}
                </button>
            ))}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                style={{
                    padding: "8px 16px",
                    border: "1px solid #e9ecef",
                    backgroundColor:
                        currentPage >= totalPages ? "#f8f9fa" : "#fff",
                    borderRadius: "8px",
                    color: currentPage >= totalPages ? "#6c757d" : "#495057",
                    cursor:
                        currentPage >= totalPages ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                }}
            >
                Siguiente →
            </button>
            {showGoTo && (
                <form onSubmit={handleGoTo} style={{ display: "flex", gap: 8 }}>
                    <input
                        name="page"
                        type="number"
                        min={1}
                        max={totalPages}
                        defaultValue={currentPage}
                        style={{
                            width: 60,
                            padding: "6px 8px",
                            border: "1px solid #ced4da",
                            borderRadius: "4px",
                            fontSize: "14px",
                            textAlign: "center",
                        }}
                        aria-label="Número de página"
                    />
                    <button
                        type="submit"
                        style={{
                            padding: "6px 12px",
                            backgroundColor: "#007bff",
                            color: "#fff",
                            border: "none",
                            borderRadius: "4px",
                            fontSize: "14px",
                            cursor: "pointer",
                        }}
                    >
                        Ir
                    </button>
                </form>
            )}
        </div>
    );
};

export default Pagination;
