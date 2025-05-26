// src/components/Table/InventoryTable.jsx
import TableRow from "./TableRow";
import mockInventoryItems from "../../data/mockInventoryData";

const InventoryTable = ({
  products = mockInventoryItems,
  sortConfig,
  onSort,
}) => {
  // Función para obtener el icono de ordenamiento
  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return " ↕️"; // Icono neutral cuando no está ordenado
    }
    return sortConfig.direction === "ascending" ? " ⬆️" : " ⬇️";
  };

  // Estilo para headers clickeables
  const headerStyle = {
    border: "1px solid #34495e",
    padding: "12px",
    fontWeight: "600",
    cursor: "pointer",
    userSelect: "none",
    transition: "background-color 0.2s ease",
    position: "relative",
  };

  const headerHoverStyle = {
    backgroundColor: "#34495e",
  };
  return (
    <div style={{ overflowX: "auto", marginTop: "15px" }}>
      {/* Mensaje cuando no hay productos */}
      {products.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "40px 20px",
            backgroundColor: "#f8f9fa",
            borderRadius: "8px",
            border: "1px solid #dee2e6",
          }}
        >
          <p
            style={{
              color: "#6c757d",
              fontSize: "16px",
              margin: 0,
            }}
          >
            No se encontraron productos que coincidan con los filtros de
            búsqueda.
          </p>
        </div>
      )}

      {/* Tabla de productos */}
      {products.length > 0 && (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            minWidth: "1000px",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#2c3e50", color: "white" }}>
              <th
                style={{
                  ...headerStyle,
                  textAlign: "left",
                }}
                onClick={() => onSort("codigo")}
                onMouseOver={(e) =>
                  (e.target.style.backgroundColor = "#34495e")
                }
                onMouseOut={(e) =>
                  (e.target.style.backgroundColor = "transparent")
                }
                title="Clic para ordenar por código"
              >
                Código{getSortIcon("codigo")}
              </th>
              <th
                style={{
                  ...headerStyle,
                  textAlign: "left",
                }}
                onClick={() => onSort("nombre")}
                onMouseOver={(e) =>
                  (e.target.style.backgroundColor = "#34495e")
                }
                onMouseOut={(e) =>
                  (e.target.style.backgroundColor = "transparent")
                }
                title="Clic para ordenar por nombre"
              >
                Producto{getSortIcon("nombre")}
              </th>
              <th
                style={{
                  ...headerStyle,
                  textAlign: "left",
                }}
                onClick={() => onSort("marca")}
                onMouseOver={(e) =>
                  (e.target.style.backgroundColor = "#34495e")
                }
                onMouseOut={(e) =>
                  (e.target.style.backgroundColor = "transparent")
                }
                title="Clic para ordenar por marca"
              >
                Marca{getSortIcon("marca")}
              </th>
              <th
                style={{
                  ...headerStyle,
                  textAlign: "left",
                }}
                onClick={() => onSort("categoria")}
                onMouseOver={(e) =>
                  (e.target.style.backgroundColor = "#34495e")
                }
                onMouseOut={(e) =>
                  (e.target.style.backgroundColor = "transparent")
                }
                title="Clic para ordenar por categoría"
              >
                Categoría{getSortIcon("categoria")}
              </th>
              <th
                style={{
                  ...headerStyle,
                  textAlign: "center",
                }}
                onClick={() => onSort("cantidad_disponible")}
                onMouseOver={(e) =>
                  (e.target.style.backgroundColor = "#34495e")
                }
                onMouseOut={(e) =>
                  (e.target.style.backgroundColor = "transparent")
                }
                title="Clic para ordenar por stock"
              >
                Stock{getSortIcon("cantidad_disponible")}
              </th>
              <th
                style={{
                  ...headerStyle,
                  textAlign: "right",
                }}
                onClick={() => onSort("precio_compra")}
                onMouseOver={(e) =>
                  (e.target.style.backgroundColor = "#34495e")
                }
                onMouseOut={(e) =>
                  (e.target.style.backgroundColor = "transparent")
                }
                title="Clic para ordenar por precio de compra"
              >
                P. Compra{getSortIcon("precio_compra")}
              </th>
              <th
                style={{
                  ...headerStyle,
                  textAlign: "right",
                }}
                onClick={() => onSort("precio_venta")}
                onMouseOver={(e) =>
                  (e.target.style.backgroundColor = "#34495e")
                }
                onMouseOut={(e) =>
                  (e.target.style.backgroundColor = "transparent")
                }
                title="Clic para ordenar por precio de venta"
              >
                P. Venta{getSortIcon("precio_venta")}
              </th>
              <th
                style={{
                  border: "1px solid #34495e",
                  padding: "12px",
                  textAlign: "center",
                  fontWeight: "600",
                }}
                title="Margen calculado (no ordenable)"
              >
                Margen
              </th>
              <th
                style={{
                  ...headerStyle,
                  textAlign: "left",
                }}
                onClick={() => onSort("sede")}
                onMouseOver={(e) =>
                  (e.target.style.backgroundColor = "#34495e")
                }
                onMouseOut={(e) =>
                  (e.target.style.backgroundColor = "transparent")
                }
                title="Clic para ordenar por sede"
              >
                Sede{getSortIcon("sede")}
              </th>
              <th
                style={{
                  ...headerStyle,
                  textAlign: "left",
                }}
                onClick={() => onSort("proveedor")}
                onMouseOver={(e) =>
                  (e.target.style.backgroundColor = "#34495e")
                }
                onMouseOut={(e) =>
                  (e.target.style.backgroundColor = "transparent")
                }
                title="Clic para ordenar por proveedor"
              >
                Proveedor{getSortIcon("proveedor")}
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((item, index) => (
              <TableRow key={item.id} item={item} index={index} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default InventoryTable;
