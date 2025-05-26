// src/components/Table/TableRow.jsx
const TableRow = ({ item, index }) => {
  const margen =
    ((item.precio_venta - item.precio_compra) / item.precio_compra) * 100;
  const stockBajo = item.cantidad_disponible < 10;
  const stockCritico = item.cantidad_disponible < 5;

  return (
    <tr
      style={{
        backgroundColor: index % 2 === 0 ? "#ffffff" : "#f8f9fa",
        "&:hover": { backgroundColor: "#e8f4f8" },
      }}
    >
      <td
        style={{
          border: "1px solid #dee2e6",
          padding: "10px",
          fontFamily: "monospace",
          fontWeight: "600",
          color: "#495057",
        }}
      >
        {item.codigo}
      </td>
      <td
        style={{
          border: "1px solid #dee2e6",
          padding: "10px",
          fontWeight: "500",
          color: "#212529",
        }}
      >
        {item.nombre}
      </td>
      <td
        style={{
          border: "1px solid #dee2e6",
          padding: "10px",
          color: "#6c757d",
        }}
      >
        {item.marca}
      </td>
      <td style={{ border: "1px solid #dee2e6", padding: "10px" }}>
        <span
          style={{
            backgroundColor: "#e3f2fd",
            color: "#1565c0",
            padding: "4px 8px",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: "500",
          }}
        >
          {item.categoria}
        </span>
      </td>
      <td
        style={{
          border: "1px solid #dee2e6",
          padding: "10px",
          textAlign: "center",
          fontWeight: "600",
        }}
      >
        <span
          style={{
            color: stockCritico ? "#dc3545" : stockBajo ? "#fd7e14" : "#28a745",
            backgroundColor: stockCritico
              ? "#f8d7da"
              : stockBajo
              ? "#fff3cd"
              : "#d4edda",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "14px",
          }}
        >
          {item.cantidad_disponible}
        </span>
      </td>
      <td
        style={{
          border: "1px solid #dee2e6",
          padding: "10px",
          textAlign: "right",
          fontFamily: "monospace",
        }}
      >
        ${item.precio_compra.toFixed(2)}
      </td>
      <td
        style={{
          border: "1px solid #dee2e6",
          padding: "10px",
          textAlign: "right",
          fontFamily: "monospace",
          fontWeight: "600",
        }}
      >
        ${item.precio_venta.toFixed(2)}
      </td>
      <td
        style={{
          border: "1px solid #dee2e6",
          padding: "10px",
          textAlign: "center",
          fontWeight: "600",
        }}
      >
        <span
          style={{
            color:
              margen > 50 ? "#28a745" : margen > 25 ? "#fd7e14" : "#dc3545",
          }}
        >
          {margen.toFixed(1)}%
        </span>
      </td>
      <td
        style={{
          border: "1px solid #dee2e6",
          padding: "10px",
          fontSize: "14px",
        }}
      >
        {item.sede}
      </td>
      <td
        style={{
          border: "1px solid #dee2e6",
          padding: "10px",
          fontSize: "14px",
          color: "#6c757d",
        }}
      >
        {item.proveedor}
      </td>
    </tr>
  );
};

export default TableRow;
