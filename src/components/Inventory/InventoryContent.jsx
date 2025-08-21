import React from "react";
import InventoryTable from "../Table/InventoryTable";
import Pagination from "../Common/Pagination";

const InventoryContent = ({
  filteredProducts,
  isLoading,
  isStockLoading,
  isPurchasePricesLoading,
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
          No hay productos que coincidan con los criterios de búsqueda actuales.
          <br />
          Intenta ajustar los filtros o agregar nuevos productos al inventario.
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
          isPurchasePricesLoading={isPurchasePricesLoading}
        />
        {/* Spacer div para empujar el contenido hacia arriba y dejar espacio en blanco abajo */}
        <div style={{ flexGrow: 1, minHeight: "20px" }} />
        {/* Paginación */}
        {totalGeneralProducts > 0 && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            totalCount={totalGeneralProducts}
            itemsPerPage={25}
            isLoading={isLoading}
          />
        )}
      </div>
    );
  }

  return null;
};

export default InventoryContent;
