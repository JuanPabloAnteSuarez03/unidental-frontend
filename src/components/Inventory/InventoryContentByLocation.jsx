import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import inventoryService from "../../services/inventoryService";
import InventoryTable from "../Table/InventoryTable";
import Pagination from "../Common/Pagination";

const ITEMS_PER_PAGE = 25;

const InventoryContentByLocation = ({
  locationId,
  nameFilter = "",
  skuFilter = "",
  purchasePricesMap = {},
}) => {
  const { authToken } = useAuth();

  const [products, setProducts] = useState([]);
  const [count, setCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Unificar término de búsqueda: priorizar SKU sobre nombre
  const searchTerm = useMemo(() => {
    if (skuFilter && skuFilter.length > 0) return skuFilter;
    if (nameFilter && nameFilter.length > 0) return nameFilter;
    return undefined;
  }, [nameFilter, skuFilter]);

  const fetchPage = useCallback(
    async (page) => {
      if (!authToken || !locationId) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await inventoryService.getProductsByLocation(
          {
            locationId,
            hasStock: true,
            search: searchTerm,
            page,
          },
          authToken
        );
        if (!data) return;
        let results = Array.isArray(data.results) ? data.results : [];
        const total =
          typeof data.count === "number" ? data.count : parseInt(data.count, 10) || 0;

        // Cargar stock por sede para los productos de esta página
        try {
          // 1) stock por sede actual
          const stockPairs = await Promise.all(
            results.map(async (p) => {
              try {
                const qty = await inventoryService.getProductStockAtLocation(
                  p.id,
                  locationId,
                  authToken
                );
                return [p.id, qty];
              } catch {
                return [p.id, 0];
              }
            })
          );
          const idToQty = Object.fromEntries(stockPairs);

          // 2) precio compra desde cache global (igual que tabla original)
          results = results.map((p) => ({
            ...p,
            stock: idToQty[p.id] || 0,
            latest_purchase_price:
              purchasePricesMap[p.id] !== undefined && purchasePricesMap[p.id] !== null
                ? purchasePricesMap[p.id]
                : null,
            purchasePriceLoading: false,
          }));
        } catch (e) {
          // Si falla, mantener resultados sin precios/stock
        }

        setProducts(results);
        setCount(total);
        const pages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));
        setTotalPages(pages);
        setCurrentPage(page);
      } catch (e) {
        setError(e.message || "Error al cargar productos por sede");
        setProducts([]);
        setCount(0);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    },
    [authToken, locationId, searchTerm]
  );

  // Resetear a página 1 cuando cambie sede o búsqueda
  useEffect(() => {
    setCurrentPage(1);
    fetchPage(1);
  }, [locationId, searchTerm, fetchPage]);

  const goToPage = useCallback(
    (page) => {
      const safe = Math.max(1, Math.min(page, totalPages));
      if (safe !== currentPage) fetchPage(safe);
    },
    [currentPage, totalPages, fetchPage]
  );

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) fetchPage(currentPage + 1);
  }, [currentPage, totalPages, fetchPage]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 1) fetchPage(currentPage - 1);
  }, [currentPage, fetchPage]);

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
        minHeight: "500px",
      }}
    >
      <div
        className="inventory-section-header"
        style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: 20 }}
      >
        <div style={{ width: 3, height: 24, backgroundColor: "#17a2b8", borderRadius: 2 }} />
        <h3 style={{ color: "#2c3e50", fontSize: 18, fontWeight: 600, margin: 0 }}>
          Productos del Inventario — Vista por sede
        </h3>
      </div>

      <InventoryTable
        products={products}
        isLoading={isLoading}
        isStockLoading={false}
        isPurchasePricesLoading={false}
        locationId={locationId}
      />

      <div style={{ flexGrow: 1, minHeight: 20 }} />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={goToPage}
        totalCount={count}
        itemsPerPage={ITEMS_PER_PAGE}
        isLoading={isLoading}
      />
    </div>
  );
};

export default InventoryContentByLocation;


