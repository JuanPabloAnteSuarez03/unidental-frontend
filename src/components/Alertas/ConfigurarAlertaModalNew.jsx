import React, { useState, useEffect } from "react";
import {
    FaCalendarAlt,
    FaExclamation,
    FaBox,
    FaTimes,
    FaSearch,
    FaTrash,
    FaTag,
    FaChevronRight,
    FaSave,
} from "react-icons/fa";

const ConfigurarAlertaModal = ({ producto, onClose, onSave }) => {
    // Estado para la configuración
    const [config, setConfig] = useState({
        tipoAlerta: "stockBajo",
        estado: "activa",
        umbralStock: 0,
        diasAntes: 30,
    });

    // Estado para la búsqueda de productos
    const [busquedaProducto, setBusquedaProducto] = useState("");

    // Productos de ejemplo para la búsqueda (simulación)
    const productosEjemplo = [
        {
            id: 101,
            nombre: "Guantes de nitrilo",
            sku: "GN-001",
            categoria: "Protección",
            stockActual: 200,
            stockMinimo: 50,
        },
        {
            id: 102,
            nombre: "Implante dental cerámico",
            sku: "IC-200",
            categoria: "Implantes",
            stockActual: 25,
            stockMinimo: 10,
        },
        {
            id: 103,
            nombre: "Resina compuesta",
            sku: "RC-150",
            categoria: "Resinas",
            stockActual: 45,
            stockMinimo: 15,
        },
        {
            id: 104,
            nombre: "Anestésico tópico",
            sku: "AT-050",
            categoria: "Medicamentos",
            stockActual: 30,
            stockMinimo: 10,
        },
    ];

    // Filtrar productos basados en la búsqueda
    const productosFiltrados = busquedaProducto
        ? productosEjemplo.filter(
              (p) =>
                  p.nombre
                      .toLowerCase()
                      .includes(busquedaProducto.toLowerCase()) ||
                  p.sku.toLowerCase().includes(busquedaProducto.toLowerCase())
          )
        : [];

    // Configuración inicial basada en el producto seleccionado
    useEffect(() => {
        if (producto) {
            setConfig((prevConfig) => ({
                ...prevConfig,
                umbralStock: producto.stockMinimo || 0,
                // Si el producto tiene lotes, configuramos por defecto la alerta de vencimiento
                tipoAlerta:
                    producto.lotes?.length > 0 ? "vencimiento" : "stockBajo",
            }));
        }
    }, [producto]);

    // Manejar cambios en los campos del formulario
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setConfig({
            ...config,
            [name]:
                type === "checkbox"
                    ? checked
                    : type === "number"
                    ? parseInt(value)
                    : value,
        });
    };

    // Manejar cambios en el campo de búsqueda
    const handleSearchChange = (e) => {
        setBusquedaProducto(e.target.value);
    };

    // Limpiar campo de búsqueda
    const handleClearSearch = () => {
        setBusquedaProducto("");
    };

    // Seleccionar un producto de la lista de resultados
    const handleSelectProducto = (productoSeleccionado) => {
        console.log("Producto seleccionado:", productoSeleccionado);
        // Aquí iría la lógica para seleccionar el producto
        // Por ahora solo limpiamos la búsqueda
        setBusquedaProducto("");
    };

    // Guardar configuración
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...config,
            producto,
        });
    };

    return (
        <div className="modal-overlay">
            <div
                className="modal-content"
                style={{
                    width: "600px",
                    maxWidth: "95%",
                    borderRadius: "10px",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
                }}
            >
                <div
                    className="modal-header"
                    style={{
                        borderBottom: "1px solid #e0e0e0",
                        paddingBottom: "15px",
                        marginBottom: "20px",
                        backgroundColor: "#f8f9fa",
                        margin: "-20px -20px 20px -20px",
                        padding: "20px",
                        borderTopLeftRadius: "10px",
                        borderTopRightRadius: "10px",
                    }}
                >
                    <h3
                        className="modal-title"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            fontSize: "20px",
                            color: "#2c3e50",
                        }}
                    >
                        <FaTag
                            style={{ marginRight: "12px", color: "#4caf50" }}
                        />
                        Configurar Alerta para{" "}
                        <span
                            style={{
                                marginLeft: "5px",
                                fontWeight: "600",
                                color: "#1976d2",
                            }}
                        >
                            {producto ? producto.nombre : "Producto"}
                        </span>
                    </h3>
                    <button
                        className="modal-close"
                        onClick={onClose}
                        style={{ fontSize: "22px" }}
                    >
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Campo de búsqueda de productos */}
                    <div
                        className="form-group"
                        style={{
                            marginBottom: "20px",
                            backgroundColor: "#fff",
                            padding: "15px",
                            borderRadius: "8px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        }}
                    >
                        <label
                            htmlFor="busquedaProducto"
                            style={{
                                fontWeight: "600",
                                color: "#2c3e50",
                                display: "flex",
                                alignItems: "center",
                                marginBottom: "10px",
                            }}
                        >
                            <FaSearch
                                style={{ marginRight: "8px", color: "#4caf50" }}
                            />
                            Buscar producto
                        </label>
                        <div style={{ display: "flex", position: "relative" }}>
                            <input
                                type="text"
                                id="busquedaProducto"
                                className="form-control"
                                placeholder="Buscar por nombre o SKU..."
                                value={busquedaProducto}
                                onChange={handleSearchChange}
                                style={{
                                    padding: "10px 15px 10px 40px",
                                    border: "1px solid #ddd",
                                    borderRadius: "6px",
                                    fontSize: "14px",
                                    width: "100%",
                                }}
                            />
                            <FaSearch
                                style={{
                                    position: "absolute",
                                    left: "15px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "#666",
                                }}
                            />
                            {busquedaProducto && (
                                <button
                                    type="button"
                                    onClick={handleClearSearch}
                                    style={{
                                        position: "absolute",
                                        right: "10px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        color: "#666",
                                    }}
                                    title="Limpiar búsqueda"
                                >
                                    <FaTimes />
                                </button>
                            )}
                        </div>
                        <small
                            style={{
                                display: "block",
                                marginTop: "8px",
                                color: "#666",
                                fontSize: "12px",
                            }}
                        >
                            Busque productos específicos para configurar alertas
                        </small>

                        {/* Resultados de búsqueda */}
                        {busquedaProducto && productosFiltrados.length > 0 && (
                            <div
                                style={{
                                    marginTop: "15px",
                                    border: "1px solid #ddd",
                                    borderRadius: "6px",
                                    maxHeight: "200px",
                                    overflowY: "auto",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                                }}
                            >
                                {productosFiltrados.map((prod) => (
                                    <div
                                        key={prod.id}
                                        onClick={() =>
                                            handleSelectProducto(prod)
                                        }
                                        style={{
                                            padding: "10px 15px",
                                            borderBottom: "1px solid #eee",
                                            cursor: "pointer",
                                            transition: "background-color 0.2s",
                                            display: "flex",
                                            justifyContent: "space-between",
                                        }}
                                        onMouseOver={(e) =>
                                            (e.currentTarget.style.backgroundColor =
                                                "#f5f5f5")
                                        }
                                        onMouseOut={(e) =>
                                            (e.currentTarget.style.backgroundColor =
                                                "transparent")
                                        }
                                    >
                                        <div>
                                            <div
                                                style={{
                                                    fontWeight: "500",
                                                    color: "#2c3e50",
                                                }}
                                            >
                                                {prod.nombre}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "12px",
                                                    color: "#666",
                                                    marginTop: "3px",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        backgroundColor:
                                                            "#f0f7f0",
                                                        padding: "2px 6px",
                                                        borderRadius: "3px",
                                                        color: "#4caf50",
                                                    }}
                                                >
                                                    {prod.sku}
                                                </span>{" "}
                                                | {prod.categoria}
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "flex-end",
                                                fontSize: "12px",
                                            }}
                                        >
                                            <span>
                                                Stock: {prod.stockActual}
                                            </span>
                                            <span
                                                style={{
                                                    color:
                                                        prod.stockActual <
                                                        prod.stockMinimo
                                                            ? "#d32f2f"
                                                            : "#2e7d32",
                                                    fontWeight: "500",
                                                }}
                                            >
                                                Min: {prod.stockMinimo}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {busquedaProducto &&
                            productosFiltrados.length === 0 && (
                                <div
                                    style={{
                                        marginTop: "15px",
                                        padding: "12px",
                                        backgroundColor: "#fff3e0",
                                        borderRadius: "6px",
                                        textAlign: "center",
                                        color: "#e65100",
                                        border: "1px solid #ffe0b2",
                                    }}
                                >
                                    No se encontraron productos que coincidan
                                    con la búsqueda
                                </div>
                            )}
                    </div>

                    {/* Separador */}
                    <div
                        style={{
                            margin: "25px 0 20px 0",
                            borderTop: "1px solid #e0e0e0",
                            paddingTop: "20px",
                            position: "relative",
                        }}
                    >
                        <h4
                            style={{
                                fontSize: "16px",
                                color: "#2c3e50",
                                margin: "0 0 15px 0",
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            <FaChevronRight
                                style={{ marginRight: "8px", color: "#4caf50" }}
                            />
                            {producto
                                ? `Configuración para: ${producto.nombre}`
                                : "Configuración de alerta"}
                        </h4>
                    </div>

                    {/* Tipo de alerta */}
                    <div
                        className="form-group"
                        style={{
                            backgroundColor: "#fff",
                            padding: "15px",
                            borderRadius: "8px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                            marginBottom: "15px",
                        }}
                    >
                        <label
                            style={{
                                fontWeight: "600",
                                color: "#2c3e50",
                                marginBottom: "10px",
                                display: "block",
                            }}
                        >
                            Tipo de alerta
                        </label>
                        <div style={{ display: "flex", gap: "20px" }}>
                            <div
                                className="form-check"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    backgroundColor:
                                        config.tipoAlerta === "stockBajo"
                                            ? "#f0f7f0"
                                            : "transparent",
                                    padding: "8px 15px",
                                    borderRadius: "5px",
                                    border:
                                        config.tipoAlerta === "stockBajo"
                                            ? "1px solid #d7e7d7"
                                            : "1px solid transparent",
                                }}
                            >
                                <input
                                    type="radio"
                                    id="tipoStockBajo"
                                    name="tipoAlerta"
                                    value="stockBajo"
                                    checked={config.tipoAlerta === "stockBajo"}
                                    onChange={handleChange}
                                    style={{ marginRight: "8px" }}
                                />
                                <label
                                    htmlFor="tipoStockBajo"
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        cursor: "pointer",
                                        fontWeight:
                                            config.tipoAlerta === "stockBajo"
                                                ? "600"
                                                : "normal",
                                    }}
                                >
                                    <FaBox
                                        style={{
                                            marginRight: "8px",
                                            color: "#1976d2",
                                        }}
                                    />
                                    Alerta de stock bajo
                                </label>
                            </div>
                            <div
                                className="form-check"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    backgroundColor:
                                        config.tipoAlerta === "vencimiento"
                                            ? "#f0f7f0"
                                            : "transparent",
                                    padding: "8px 15px",
                                    borderRadius: "5px",
                                    border:
                                        config.tipoAlerta === "vencimiento"
                                            ? "1px solid #d7e7d7"
                                            : "1px solid transparent",
                                }}
                            >
                                <input
                                    type="radio"
                                    id="tipoVencimiento"
                                    name="tipoAlerta"
                                    value="vencimiento"
                                    checked={
                                        config.tipoAlerta === "vencimiento"
                                    }
                                    onChange={handleChange}
                                    style={{ marginRight: "8px" }}
                                />
                                <label
                                    htmlFor="tipoVencimiento"
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        cursor: "pointer",
                                        fontWeight:
                                            config.tipoAlerta === "vencimiento"
                                                ? "600"
                                                : "normal",
                                    }}
                                >
                                    <FaCalendarAlt
                                        style={{
                                            marginRight: "8px",
                                            color: "#d32f2f",
                                        }}
                                    />
                                    Alerta de vencimiento
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Estado de la alerta */}
                    <div
                        className="form-group"
                        style={{
                            backgroundColor: "#fff",
                            padding: "15px",
                            borderRadius: "8px",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                            marginBottom: "15px",
                        }}
                    >
                        <label
                            style={{
                                fontWeight: "600",
                                color: "#2c3e50",
                                marginBottom: "10px",
                                display: "block",
                            }}
                        >
                            Estado de la alerta
                        </label>
                        <div
                            className="form-check"
                            style={{ display: "flex", alignItems: "center" }}
                        >
                            <input
                                type="checkbox"
                                id="estadoActiva"
                                name="estado"
                                checked={config.estado === "activa"}
                                onChange={(e) =>
                                    setConfig({
                                        ...config,
                                        estado: e.target.checked
                                            ? "activa"
                                            : "inactiva",
                                    })
                                }
                                style={{ marginRight: "10px" }}
                            />
                            <label
                                htmlFor="estadoActiva"
                                style={{ cursor: "pointer" }}
                            >
                                Alerta activa
                            </label>
                        </div>
                    </div>

                    {/* Configuraciones específicas por tipo de alerta */}
                    {config.tipoAlerta === "stockBajo" ? (
                        <div
                            className="form-group"
                            style={{
                                backgroundColor: "#fff",
                                padding: "15px",
                                borderRadius: "8px",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                marginBottom: "15px",
                            }}
                        >
                            <label
                                htmlFor="umbralStock"
                                style={{
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                    marginBottom: "10px",
                                    display: "block",
                                }}
                            >
                                Umbral de stock mínimo
                            </label>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                <input
                                    type="number"
                                    id="umbralStock"
                                    name="umbralStock"
                                    className="form-control"
                                    value={config.umbralStock}
                                    min="0"
                                    onChange={handleChange}
                                    style={{
                                        width: "120px",
                                        padding: "10px 15px",
                                        border: "1px solid #ddd",
                                        borderRadius: "6px",
                                        fontSize: "14px",
                                    }}
                                />
                                <span
                                    style={{
                                        marginLeft: "10px",
                                        color: "#666",
                                    }}
                                >
                                    unidades
                                </span>
                            </div>
                            <small
                                style={{
                                    display: "block",
                                    marginTop: "8px",
                                    color: "#666",
                                    fontSize: "12px",
                                }}
                            >
                                Se generará una alerta cuando el stock sea menor
                                a este valor.
                            </small>

                            {producto && (
                                <div
                                    style={{
                                        marginTop: "15px",
                                        padding: "12px",
                                        backgroundColor: "#e8f5e9",
                                        borderRadius: "6px",
                                        border: "1px solid #c8e6c9",
                                    }}
                                >
                                    <div
                                        style={{
                                            marginBottom: "5px",
                                            fontSize: "13px",
                                            color: "#2c3e50",
                                        }}
                                    >
                                        <strong>Stock actual:</strong>{" "}
                                        <span style={{ fontWeight: "600" }}>
                                            {producto.stockActual} unidades
                                        </span>
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "13px",
                                            color: "#2c3e50",
                                        }}
                                    >
                                        <strong>
                                            Stock mínimo recomendado:
                                        </strong>{" "}
                                        <span style={{ fontWeight: "600" }}>
                                            {producto.stockMinimo} unidades
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div
                            className="form-group"
                            style={{
                                backgroundColor: "#fff",
                                padding: "15px",
                                borderRadius: "8px",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                                marginBottom: "15px",
                            }}
                        >
                            <label
                                htmlFor="diasAntes"
                                style={{
                                    fontWeight: "600",
                                    color: "#2c3e50",
                                    marginBottom: "10px",
                                    display: "block",
                                }}
                            >
                                Días antes del vencimiento para alertar
                            </label>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                <input
                                    type="number"
                                    id="diasAntes"
                                    name="diasAntes"
                                    className="form-control"
                                    value={config.diasAntes}
                                    min="1"
                                    onChange={handleChange}
                                    style={{
                                        width: "120px",
                                        padding: "10px 15px",
                                        border: "1px solid #ddd",
                                        borderRadius: "6px",
                                        fontSize: "14px",
                                    }}
                                />
                                <span
                                    style={{
                                        marginLeft: "10px",
                                        color: "#666",
                                    }}
                                >
                                    días
                                </span>
                            </div>
                            <small
                                style={{
                                    display: "block",
                                    marginTop: "8px",
                                    color: "#666",
                                    fontSize: "12px",
                                }}
                            >
                                Se generará una alerta cuando un lote esté a
                                esta cantidad de días de vencer.
                            </small>

                            {/* Info de lotes si el producto tiene */}
                            {producto &&
                                producto.lotes &&
                                producto.lotes.length > 0 && (
                                    <div
                                        style={{
                                            marginTop: "15px",
                                            padding: "12px",
                                            backgroundColor: "#fff3e0",
                                            borderRadius: "6px",
                                            border: "1px solid #ffe0b2",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "13px",
                                                fontWeight: "600",
                                                marginBottom: "10px",
                                                color: "#e65100",
                                            }}
                                        >
                                            Lotes de este producto:
                                        </div>
                                        {producto.lotes.map((lote) => (
                                            <div
                                                key={lote.id}
                                                style={{
                                                    fontSize: "12px",
                                                    marginBottom: "8px",
                                                    padding: "6px 10px",
                                                    backgroundColor:
                                                        "rgba(255,255,255,0.5)",
                                                    borderRadius: "4px",
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                }}
                                            >
                                                <span>
                                                    Lote #{lote.id}:{" "}
                                                    {lote.cantidad} unidades
                                                </span>
                                                <span
                                                    style={{
                                                        fontWeight: "600",
                                                        color: "#d32f2f",
                                                    }}
                                                >
                                                    Vence:{" "}
                                                    {new Date(
                                                        lote.fechaVencimiento
                                                    ).toLocaleDateString(
                                                        "es-ES"
                                                    )}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                        </div>
                    )}

                    <div
                        className="modal-footer"
                        style={{
                            borderTop: "1px solid #e0e0e0",
                            paddingTop: "20px",
                            marginTop: "20px",
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: "15px",
                        }}
                    >
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                            style={{
                                padding: "10px 20px",
                                backgroundColor: "#f1f1f1",
                                color: "#333",
                                borderRadius: "6px",
                                fontWeight: "500",
                                border: "none",
                                cursor: "pointer",
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{
                                padding: "10px 20px",
                                backgroundColor: "#4caf50",
                                color: "white",
                                borderRadius: "6px",
                                fontWeight: "500",
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <FaSave />
                            Guardar Alerta
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ConfigurarAlertaModal;
