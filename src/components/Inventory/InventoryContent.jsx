import React from "react";
import InventoryTable from "../Table/InventoryTable";

const InventoryContent = ({
    filteredProducts,
    isLoading,
    isStockLoading,
    totalGeneralProducts,
    currentPage,
    totalPages,
    goToPage,
    goToNextPage,
    goToPrevPage,
    hasNextPage,
    hasPrevPage,
    error,
}) => {
    // Mensaje si no hay productos
    if (!isLoading && !error && totalGeneralProducts === 0) {
        return (
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: "12px",
                    padding: "40px 25px",
                    marginBottom: "20px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    border: "1px solid #e9ecef",
                    textAlign: "center",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "12px",
                        marginBottom: "15px",
                    }}
                >
                    <div
                        style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            backgroundColor: "#6c757d",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontSize: "14px",
                            fontWeight: "bold",
                        }}
                    >
                        ?
                    </div>
                    <h3
                        style={{
                            color: "#2c3e50",
                            fontSize: "18px",
                            fontWeight: "600",
                            margin: 0,
                        }}
                    >
                        No se encontraron productos
                    </h3>
                </div>
                <p
                    style={{
                        color: "#6c757d",
                        fontSize: "16px",
                        margin: 0,
                        lineHeight: "1.5",
                    }}
                >
                    No hay productos que coincidan con los criterios de búsqueda
                    actuales.
                    <br />
                    Intenta ajustar los filtros o agregar nuevos productos al
                    inventario.
                </p>
            </div>
        );
    }

    // Contenido principal de la tabla
    if (!error) {
        return (
            <div
                className="inventory-card inventory-table-container"
                style={{
                    backgroundColor: "white",
                    borderRadius: "12px",
                    padding: "25px",
                    marginBottom: "20px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                    border: "1px solid #e9ecef",
                    position: "relative",
                    minHeight: "500px", // Altura mínima para asegurar espacio para los detalles
                }}
            >
                <div
                    className="inventory-section-header"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginBottom: "20px",
                    }}
                >
                    <div
                        style={{
                            width: "3px",
                            height: "24px",
                            backgroundColor: "#17a2b8",
                            borderRadius: "2px",
                        }}
                    />
                    <h3
                        className="inventory-section-title"
                        style={{
                            color: "#2c3e50",
                            fontSize: "18px",
                            fontWeight: "600",
                            margin: 0,
                        }}
                    >
                        Productos del Inventario
                    </h3>
                </div>
                <InventoryTable
                    products={filteredProducts}
                    isLoading={isLoading}
                    isStockLoading={isStockLoading}
                />
                {/* Spacer div para empujar el contenido hacia arriba y dejar espacio en blanco abajo */}
                <div style={{ flexGrow: 1, minHeight: "20px" }} />
                {/* Paginación */}
                {totalGeneralProducts > 0 && (
                    <div
                        style={{
                            marginTop: "20px",
                            paddingTop: "20px",
                            borderTop: "1px solid #e9ecef",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                margin: "20px 0",
                                flexWrap: "wrap",
                                gap: "15px",
                            }}
                            role="navigation"
                            aria-label="Paginación"
                        >
                            {/* Información de elementos mostrados */}
                            <div
                                style={{
                                    fontSize: "14px",
                                    color: "#495057",
                                    fontWeight: "500",
                                }}
                            >
                                Mostrando {(currentPage - 1) * 25 + 1}-
                                {Math.min(
                                    currentPage * 25,
                                    totalGeneralProducts
                                )}{" "}
                                de {totalGeneralProducts} elementos
                            </div>

                            {/* Controles de navegación */}
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                }}
                            >
                                {/* Botón anterior */}
                                <button
                                    onClick={goToPrevPage}
                                    disabled={!hasPrevPage || isLoading}
                                    style={{
                                        padding: "8px 16px",
                                        backgroundColor:
                                            hasPrevPage && !isLoading
                                                ? "#2c3e50"
                                                : "#e9ecef",
                                        color:
                                            hasPrevPage && !isLoading
                                                ? "#ffffff"
                                                : "#adb5bd",
                                        border: "none",
                                        borderRadius: "4px",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        cursor:
                                            hasPrevPage && !isLoading
                                                ? "pointer"
                                                : "not-allowed",
                                        transition: "all 0.2s ease",
                                    }}
                                    aria-label="Ir a la página anterior"
                                >
                                    Anterior
                                </button>

                                {/* Números de página */}
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "5px",
                                    }}
                                >
                                    {(() => {
                                        const pageNumbers = [];
                                        const maxVisiblePages = 5;

                                        if (totalPages <= maxVisiblePages) {
                                            for (
                                                let i = 1;
                                                i <= totalPages;
                                                i++
                                            ) {
                                                pageNumbers.push(i);
                                            }
                                        } else {
                                            pageNumbers.push(1);
                                            let start = Math.max(
                                                2,
                                                currentPage - 1
                                            );
                                            let end = Math.min(
                                                totalPages - 1,
                                                currentPage + 1
                                            );

                                            if (start === 2)
                                                end = Math.min(
                                                    4,
                                                    totalPages - 1
                                                );
                                            if (end === totalPages - 1)
                                                start = Math.max(
                                                    2,
                                                    totalPages - 3
                                                );

                                            if (start > 2)
                                                pageNumbers.push("...");

                                            for (let i = start; i <= end; i++) {
                                                pageNumbers.push(i);
                                            }

                                            if (end < totalPages - 1)
                                                pageNumbers.push("...");
                                            pageNumbers.push(totalPages);
                                        }

                                        return pageNumbers.map((page, index) =>
                                            page === "..." ? (
                                                <span
                                                    key={`ellipsis-${index}`}
                                                    style={{
                                                        padding: "6px 12px",
                                                        color: "#6c757d",
                                                        fontSize: "14px",
                                                    }}
                                                >
                                                    ...
                                                </span>
                                            ) : (
                                                <button
                                                    key={`page-${page}`}
                                                    onClick={() =>
                                                        goToPage(page)
                                                    }
                                                    style={{
                                                        padding: "6px 12px",
                                                        backgroundColor:
                                                            page === currentPage
                                                                ? "#2c3e50"
                                                                : "#ffffff",
                                                        color:
                                                            page === currentPage
                                                                ? "#ffffff"
                                                                : "#495057",
                                                        border: "1px solid #dee2e6",
                                                        borderRadius: "4px",
                                                        fontSize: "14px",
                                                        cursor: "pointer",
                                                        transition:
                                                            "all 0.2s ease",
                                                    }}
                                                    disabled={isLoading}
                                                    aria-label={`Ir a la página ${page}`}
                                                    aria-current={
                                                        page === currentPage
                                                            ? "page"
                                                            : null
                                                    }
                                                >
                                                    {page}
                                                </button>
                                            )
                                        );
                                    })()}
                                </div>

                                {/* Botón siguiente */}
                                <button
                                    onClick={goToNextPage}
                                    disabled={!hasNextPage || isLoading}
                                    style={{
                                        padding: "8px 16px",
                                        backgroundColor:
                                            hasNextPage && !isLoading
                                                ? "#2c3e50"
                                                : "#e9ecef",
                                        color:
                                            hasNextPage && !isLoading
                                                ? "#ffffff"
                                                : "#adb5bd",
                                        border: "none",
                                        borderRadius: "4px",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        cursor:
                                            hasNextPage && !isLoading
                                                ? "pointer"
                                                : "not-allowed",
                                        transition: "all 0.2s ease",
                                    }}
                                    aria-label="Ir a la página siguiente"
                                >
                                    Siguiente
                                </button>
                            </div>

                            {/* Ir a página específica */}
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                }}
                            >
                                <label htmlFor="inventory-page-input">
                                    Ir a página:
                                </label>
                                <input
                                    id="inventory-page-input"
                                    type="number"
                                    min="1"
                                    max={totalPages}
                                    defaultValue={currentPage}
                                    style={{
                                        width: "60px",
                                        padding: "6px 8px",
                                        border: "1px solid #ced4da",
                                        borderRadius: "4px",
                                        fontSize: "14px",
                                        textAlign: "center",
                                    }}
                                    disabled={isLoading}
                                    aria-label="Número de página"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            const pageNumber = parseInt(
                                                e.target.value,
                                                10
                                            );
                                            if (
                                                !isNaN(pageNumber) &&
                                                pageNumber >= 1 &&
                                                pageNumber <= totalPages
                                            ) {
                                                goToPage(pageNumber);
                                            }
                                        }
                                    }}
                                />
                                <button
                                    onClick={() => {
                                        const input = document.getElementById(
                                            "inventory-page-input"
                                        );
                                        const pageNumber = parseInt(
                                            input.value,
                                            10
                                        );
                                        if (
                                            !isNaN(pageNumber) &&
                                            pageNumber >= 1 &&
                                            pageNumber <= totalPages
                                        ) {
                                            goToPage(pageNumber);
                                        }
                                    }}
                                    disabled={isLoading}
                                    style={{
                                        padding: "6px 12px",
                                        backgroundColor: "#2c3e50",
                                        color: "#ffffff",
                                        border: "none",
                                        borderRadius: "4px",
                                        fontSize: "14px",
                                        cursor: "pointer",
                                        transition:
                                            "background-color 0.2s ease",
                                    }}
                                    aria-label="Ir a la página especificada"
                                >
                                    Ir
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return null;
};

export default InventoryContent;
