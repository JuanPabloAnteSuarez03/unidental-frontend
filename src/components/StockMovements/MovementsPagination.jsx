import React from "react";

const MovementsPagination = ({
    isLoadingMovements = false,
    realMovements = [],
    movementsTotalPages = 0,
    movementsCurrentPage = 1,
    movementsTotalCount = 0,
    goToPrevMovementsPage = () => {},
    goToNextMovementsPage = () => {},
    goToMovementsPage = () => {},
}) => {
    if (
        !movementsTotalPages ||
        movementsTotalPages <= 1 ||
        isLoadingMovements ||
        realMovements.length === 0
    ) {
        return null;
    }

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "24px",
                padding: "20px 24px",
                backgroundColor: "#f8f9fa",
                borderRadius: "12px",
                border: "1px solid #e9ecef",
            }}
        >
            <div
                style={{
                    color: "#495057",
                    fontSize: "14px",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                }}
            >
                <span style={{ fontSize: "16px" }}>📊</span>
                <span>
                    Mostrando{" "}
                    <strong style={{ color: "#2c3e50" }}>
                        {movementsTotalCount > 0
                            ? Math.min(
                                  25 * (Math.max(1, movementsCurrentPage) - 1) +
                                      1,
                                  movementsTotalCount
                              )
                            : 0}
                        -
                        {Math.min(
                            25 * Math.max(1, movementsCurrentPage),
                            movementsTotalCount
                        )}
                    </strong>{" "}
                    de{" "}
                    <strong style={{ color: "#2c3e50" }}>
                        {movementsTotalCount}
                    </strong>{" "}
                    movimientos
                    {movementsTotalPages > 1 && (
                        <span style={{ marginLeft: "8px", color: "#6c757d" }}>
                            • Página{" "}
                            <strong style={{ color: "#2c3e50" }}>
                                {movementsCurrentPage}
                            </strong>{" "}
                            de{" "}
                            <strong style={{ color: "#2c3e50" }}>
                                {movementsTotalPages}
                            </strong>
                        </span>
                    )}
                </span>
            </div>

            <div
                style={{
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                }}
            >
                {/* Botón Anterior */}
                <button
                    onClick={goToPrevMovementsPage}
                    disabled={movementsCurrentPage <= 1}
                    style={{
                        padding: "10px 16px",
                        border: "2px solid #e9ecef",
                        backgroundColor:
                            movementsCurrentPage > 1 ? "#fff" : "#f8f9fa",
                        borderRadius: "8px",
                        color: movementsCurrentPage > 1 ? "#2c3e50" : "#6c757d",
                        cursor:
                            movementsCurrentPage > 1
                                ? "pointer"
                                : "not-allowed",
                        fontSize: "14px",
                        fontWeight: "500",
                        transition: "all 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                    }}
                    onMouseEnter={(e) => {
                        if (movementsCurrentPage > 1) {
                            e.currentTarget.style.borderColor = "#2c3e50";
                            e.currentTarget.style.backgroundColor = "#f8f9fa";
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (movementsCurrentPage > 1) {
                            e.currentTarget.style.borderColor = "#e9ecef";
                            e.currentTarget.style.backgroundColor = "#fff";
                        }
                    }}
                >
                    ⬅️ Anterior
                </button>

                {/* Números de página */}
                {Array.from(
                    {
                        length: Math.min(5, movementsTotalPages),
                    },
                    (_, i) => {
                        const pageNum =
                            Math.max(1, movementsCurrentPage - 2) + i;
                        if (pageNum > movementsTotalPages) return null;

                        return (
                            <button
                                key={pageNum}
                                onClick={() => goToMovementsPage(pageNum)}
                                style={{
                                    padding: "10px 14px",
                                    border: `2px solid ${
                                        pageNum === movementsCurrentPage
                                            ? "#2c3e50"
                                            : "#e9ecef"
                                    }`,
                                    backgroundColor:
                                        pageNum === movementsCurrentPage
                                            ? "#2c3e50"
                                            : "#fff",
                                    borderRadius: "8px",
                                    color:
                                        pageNum === movementsCurrentPage
                                            ? "#fff"
                                            : "#2c3e50",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    minWidth: "44px",
                                    transition: "all 0.2s ease",
                                }}
                                onMouseEnter={(e) => {
                                    if (pageNum !== movementsCurrentPage) {
                                        e.currentTarget.style.borderColor =
                                            "#2c3e50";
                                        e.currentTarget.style.backgroundColor =
                                            "#f8f9fa";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (pageNum !== movementsCurrentPage) {
                                        e.currentTarget.style.borderColor =
                                            "#e9ecef";
                                        e.currentTarget.style.backgroundColor =
                                            "#fff";
                                    }
                                }}
                            >
                                {pageNum}
                            </button>
                        );
                    }
                )}

                {/* Botón Siguiente */}
                <button
                    onClick={goToNextMovementsPage}
                    disabled={movementsCurrentPage >= movementsTotalPages}
                    style={{
                        padding: "10px 16px",
                        border: "2px solid #e9ecef",
                        backgroundColor:
                            movementsCurrentPage < movementsTotalPages
                                ? "#fff"
                                : "#f8f9fa",
                        borderRadius: "8px",
                        color:
                            movementsCurrentPage < movementsTotalPages
                                ? "#2c3e50"
                                : "#6c757d",
                        cursor:
                            movementsCurrentPage < movementsTotalPages
                                ? "pointer"
                                : "not-allowed",
                        fontSize: "14px",
                        fontWeight: "500",
                        transition: "all 0.2s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                    }}
                    onMouseEnter={(e) => {
                        if (movementsCurrentPage < movementsTotalPages) {
                            e.currentTarget.style.borderColor = "#2c3e50";
                            e.currentTarget.style.backgroundColor = "#f8f9fa";
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (movementsCurrentPage < movementsTotalPages) {
                            e.currentTarget.style.borderColor = "#e9ecef";
                            e.currentTarget.style.backgroundColor = "#fff";
                        }
                    }}
                >
                    Siguiente ➡️
                </button>
            </div>
        </div>
    );
};

export default MovementsPagination;
