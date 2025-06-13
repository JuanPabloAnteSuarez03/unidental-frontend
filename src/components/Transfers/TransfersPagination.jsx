import React from "react";

const TransfersPagination = ({
    transferencias,
    currentPage = 1,
    totalPages = 1,
    totalCount = 0,
    onPageChange,
}) => {
    if (transferencias.length === 0) return null;

    const itemsPerPage = 10; // Ajustar según necesidades
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(
        currentPage * itemsPerPage,
        totalCount || transferencias.length
    );
    const displayTotalCount = totalCount || transferencias.length;

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "24px",
                padding: "20px 0",
                borderTop: "1px solid #e9ecef",
            }}
        >
            {/* Información de registros */}
            <div
                style={{
                    color: "#6c757d",
                    fontSize: "14px",
                    fontWeight: "500",
                }}
            >
                Mostrando {startItem}-{endItem} de {displayTotalCount}{" "}
                transferencias
            </div>

            {/* Controles de paginación */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {/* Botón Anterior */}
                <button
                    onClick={() =>
                        onPageChange && onPageChange(currentPage - 1)
                    }
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
                        transition: "all 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                    }}
                    onMouseOver={(e) => {
                        if (currentPage > 1) {
                            e.target.style.backgroundColor = "#f8f9fa";
                            e.target.style.borderColor = "#dee2e6";
                        }
                    }}
                    onMouseOut={(e) => {
                        if (currentPage > 1) {
                            e.target.style.backgroundColor = "#fff";
                            e.target.style.borderColor = "#e9ecef";
                        }
                    }}
                >
                    <span>←</span>
                    Anterior
                </button>

                {/* Números de página */}
                <div style={{ display: "flex", gap: "4px" }}>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (pageNum) => {
                            const isCurrentPage = pageNum === currentPage;

                            return (
                                <button
                                    key={pageNum}
                                    onClick={() =>
                                        onPageChange && onPageChange(pageNum)
                                    }
                                    style={{
                                        padding: "8px 12px",
                                        border: "1px solid",
                                        borderColor: isCurrentPage
                                            ? "#667eea"
                                            : "#e9ecef",
                                        backgroundColor: isCurrentPage
                                            ? "#667eea"
                                            : "#fff",
                                        borderRadius: "8px",
                                        color: isCurrentPage
                                            ? "#fff"
                                            : "#495057",
                                        cursor: "pointer",
                                        fontSize: "14px",
                                        fontWeight: isCurrentPage
                                            ? "600"
                                            : "500",
                                        minWidth: "40px",
                                        transition: "all 0.2s ease",
                                        boxShadow: isCurrentPage
                                            ? "0 2px 4px rgba(102, 126, 234, 0.3)"
                                            : "none",
                                    }}
                                    onMouseOver={(e) => {
                                        if (!isCurrentPage) {
                                            e.target.style.backgroundColor =
                                                "#f8f9fa";
                                            e.target.style.borderColor =
                                                "#dee2e6";
                                        }
                                    }}
                                    onMouseOut={(e) => {
                                        if (!isCurrentPage) {
                                            e.target.style.backgroundColor =
                                                "#fff";
                                            e.target.style.borderColor =
                                                "#e9ecef";
                                        }
                                    }}
                                >
                                    {pageNum}
                                </button>
                            );
                        }
                    )}
                </div>

                {/* Botón Siguiente */}
                <button
                    onClick={() =>
                        onPageChange && onPageChange(currentPage + 1)
                    }
                    disabled={currentPage >= totalPages}
                    style={{
                        padding: "8px 16px",
                        border: "1px solid #e9ecef",
                        backgroundColor:
                            currentPage >= totalPages ? "#f8f9fa" : "#fff",
                        borderRadius: "8px",
                        color:
                            currentPage >= totalPages ? "#6c757d" : "#495057",
                        cursor:
                            currentPage >= totalPages
                                ? "not-allowed"
                                : "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        transition: "all 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                    }}
                    onMouseOver={(e) => {
                        if (currentPage < totalPages) {
                            e.target.style.backgroundColor = "#f8f9fa";
                            e.target.style.borderColor = "#dee2e6";
                        }
                    }}
                    onMouseOut={(e) => {
                        if (currentPage < totalPages) {
                            e.target.style.backgroundColor = "#fff";
                            e.target.style.borderColor = "#e9ecef";
                        }
                    }}
                >
                    Siguiente
                    <span>→</span>
                </button>
            </div>
        </div>
    );
};

export default TransfersPagination;
