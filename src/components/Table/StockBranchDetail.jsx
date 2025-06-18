import React from "react";
import "./StockBranchDetail.css";

const StockBranchDetail = ({
  product,
  stockByLocation = {},
  locations = [],
  isLoading = false,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const totalStock = Object.values(stockByLocation).reduce(
    (sum, qty) => sum + (qty || 0),
    0
  );

  return (
    <div className="stock-branch-detail">
      <div className="stock-branch-detail__header">
        <h4>Stock por sede - {product?.name || "Producto"}</h4>
        <button className="stock-branch-detail__close" onClick={onClose}>
          &times;
        </button>
      </div>
      <div className="stock-branch-detail__content">
        {isLoading ? (
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              color: "#6c757d",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                border: "2px solid #e9ecef",
                borderTop: "2px solid #007bff",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 10px",
              }}
            ></div>
            Cargando stock por sede...
          </div>
        ) : locations.length > 0 ? (
          locations.map((location) => {
            const stock = stockByLocation[location.id] || 0;
            return (
              <div key={location.id} className="stock-branch-detail__item">
                <span className="stock-branch-detail__branch-name">
                  {location.name}
                </span>
                <span
                  className="stock-branch-detail__quantity"
                  style={{
                    color: stock > 0 ? "#28a745" : "#dc3545",
                    fontWeight: stock > 0 ? "600" : "400",
                  }}
                >
                  {stock}
                </span>
              </div>
            );
          })
        ) : Object.keys(stockByLocation).length > 0 ? (
          // Fallback: mostrar stock por ID de ubicación si no tenemos info de ubicaciones
          Object.entries(stockByLocation).map(([locationId, quantity]) => (
            <div key={locationId} className="stock-branch-detail__item">
              <span className="stock-branch-detail__branch-name">
                Ubicación {locationId}
              </span>
              <span
                className="stock-branch-detail__quantity"
                style={{
                  color: quantity > 0 ? "#28a745" : "#dc3545",
                  fontWeight: quantity > 0 ? "600" : "400",
                }}
              >
                {quantity}
              </span>
            </div>
          ))
        ) : (
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              color: "#6c757d",
            }}
          >
            No se encontró información de stock por sede
          </div>
        )}

        {!isLoading && (
          <div className="stock-branch-detail__footer">
            <span className="stock-branch-detail__total-label">Total</span>
            <span
              className="stock-branch-detail__total-quantity"
              style={{
                color: totalStock > 0 ? "#28a745" : "#dc3545",
                fontWeight: "700",
              }}
            >
              {totalStock}
            </span>
          </div>
        )}
      </div>

      {/* CSS para animaciones */}
      <style>
        {`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}
      </style>
    </div>
  );
};

export default StockBranchDetail;
