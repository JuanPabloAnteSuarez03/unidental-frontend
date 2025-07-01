import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getSuppliers, getAllSuppliers } from "../services/suppliersService";
import Pagination from "../components/Pagination/Pagination";
import "../components/Pagination/Pagination.css";

const SuppliersPage = () => {
    const { authToken } = useAuth();
    const navigate = useNavigate();
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [pageSize] = useState(25);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Función para navegar al detalle del proveedor
    const handleSupplierClick = (supplier) => {
        // Crear un nombre URL-friendly que incluya el ID
        const urlName = `${supplier.name
            .replace(/[^a-zA-Z0-9\s]/g, "")
            .replace(/\s+/g, "-")
            .toLowerCase()}-id-${supplier.id}`;
        navigate(`/proveedores/${urlName}`);
    };

    // Función para cargar proveedores (optimizada)
    const loadSuppliers = async (
        page = 1,
        search = "",
        forceRefresh = false
    ) => {
        if (!authToken) return;

        setLoading(true);
        setError(null);

        try {
            const params = {
                page,
                page_size: pageSize,
                ...(search && { search }),
            };

            const data = await getSuppliers(params, authToken, forceRefresh);

            setSuppliers(data.results || []);
            setTotalPages(Math.ceil(data.count / pageSize));
            setTotalCount(data.count);
            setCurrentPage(page);
        } catch (err) {
            console.error("Error loading suppliers:", err);
            setError(
                "Error al cargar los proveedores. Por favor, inténtalo de nuevo."
            );
        } finally {
            setLoading(false);
            setIsInitialLoad(false);
        }
    };

    // Función para cargar todos los proveedores en la primera carga
    const loadAllSuppliers = async () => {
        if (!authToken) return;

        setLoading(true);
        setError(null);

        try {
            console.log("🔄 Cargando todos los proveedores para cache...");
            await getAllSuppliers(authToken);
            console.log("✅ Cache de proveedores cargado exitosamente");

            // Ahora cargar la primera página desde el cache
            await loadSuppliers(1, "", false);
        } catch (err) {
            console.error("Error loading all suppliers:", err);
            // Si falla la carga completa, intentar carga normal
            await loadSuppliers(1, "", false);
        } finally {
            setLoading(false);
            setIsInitialLoad(false);
        }
    };

    // Cargar proveedores al montar el componente
    useEffect(() => {
        if (isInitialLoad) {
            // En la primera carga, cargar todos los proveedores para cache
            loadAllSuppliers();
        } else {
            // En cargas posteriores, usar cache
            loadSuppliers(1, searchTerm);
        }
    }, [authToken]);

    // Manejar búsqueda
    const handleSearch = (e) => {
        e.preventDefault();
        // Para búsquedas, forzar recarga sin cache
        loadSuppliers(1, searchTerm, true);
    };

    // Funciones de paginación
    const goToPage = (page) => {
        // Para navegación, usar cache si está disponible
        loadSuppliers(page, searchTerm, false);
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            loadSuppliers(currentPage + 1, searchTerm, false);
        }
    };

    const goToPrevPage = () => {
        if (currentPage > 1) {
            loadSuppliers(currentPage - 1, searchTerm, false);
        }
    };

    // Formatear fecha
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("es-ES", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading && suppliers.length === 0) {
        return (
            <div
                style={{
                    padding: "20px",
                    maxWidth: "1400px",
                    margin: "0 auto",
                    fontFamily:
                        "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                    backgroundColor: "#f8f9fa",
                    minHeight: "calc(100vh - 140px)",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: "400px",
                        flexDirection: "column",
                    }}
                >
                    <div
                        style={{
                            width: "50px",
                            height: "50px",
                            border: "4px solid #e3e6ea",
                            borderTop: "4px solid #007bff",
                            borderRadius: "50%",
                            animation: "spin 1s linear infinite",
                        }}
                    ></div>
                    <p
                        style={{
                            marginTop: "20px",
                            color: "#6c757d",
                            fontSize: "16px",
                        }}
                    >
                        {isInitialLoad
                            ? "Cargando proveedores (optimizando para navegación rápida)..."
                            : "Cargando proveedores..."}
                    </p>
                    {isInitialLoad && (
                        <p
                            style={{
                                marginTop: "8px",
                                color: "#6c757d",
                                fontSize: "12px",
                                textAlign: "center",
                            }}
                        >
                            Esta carga inicial puede tomar unos segundos más,
                            pero las navegaciones posteriores serán instantáneas
                        </p>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                padding: "20px",
                maxWidth: "1400px",
                margin: "0 auto",
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                backgroundColor: "#f8f9fa",
                minHeight: "calc(100vh - 140px)",
            }}
        >
            {/* Header */}
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    padding: "24px",
                    marginBottom: "24px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    border: "1px solid #e9ecef",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                        }}
                    >
                        <div
                            style={{
                                width: "48px",
                                height: "48px",
                                backgroundColor: "#e3f2fd",
                                borderRadius: "8px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <svg
                                width="24"
                                height="24"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                style={{ color: "#1976d2" }}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                            </svg>
                        </div>
                        <div>
                            <h1
                                style={{
                                    fontSize: "28px",
                                    fontWeight: "bold",
                                    color: "#212529",
                                    margin: "0",
                                }}
                            >
                                Proveedores
                            </h1>
                            <p
                                style={{
                                    color: "#6c757d",
                                    margin: "4px 0 0 0",
                                    fontSize: "14px",
                                }}
                            >
                                Gestiona todos los proveedores de la empresa
                            </p>
                        </div>
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: "16px",
                            flexWrap: "wrap",
                        }}
                    >
                        <div
                            style={{
                                backgroundColor: "#007bff",
                                color: "white",
                                padding: "16px 20px",
                                borderRadius: "8px",
                                minWidth: "140px",
                            }}
                        >
                            <div
                                style={{ fontSize: "24px", fontWeight: "bold" }}
                            >
                                {totalCount}
                            </div>
                            <div style={{ fontSize: "12px", opacity: "0.9" }}>
                                Proveedores totales
                            </div>
                        </div>
                        <div
                            style={{
                                backgroundColor: "#28a745",
                                color: "white",
                                padding: "16px 20px",
                                borderRadius: "8px",
                                minWidth: "140px",
                            }}
                        >
                            <div
                                style={{ fontSize: "24px", fontWeight: "bold" }}
                            >
                                {suppliers.length}
                            </div>
                            <div style={{ fontSize: "12px", opacity: "0.9" }}>
                                En esta página
                            </div>
                        </div>
                        {!isInitialLoad && (
                            <div
                                style={{
                                    backgroundColor: "#17a2b8",
                                    color: "white",
                                    padding: "16px 20px",
                                    borderRadius: "8px",
                                    minWidth: "140px",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "24px",
                                        fontWeight: "bold",
                                    }}
                                >
                                    ⚡
                                </div>
                                <div
                                    style={{ fontSize: "12px", opacity: "0.9" }}
                                >
                                    Navegación rápida
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Búsqueda */}
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    padding: "24px",
                    marginBottom: "24px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    border: "1px solid #e9ecef",
                }}
            >
                <form
                    onSubmit={handleSearch}
                    style={{
                        display: "flex",
                        gap: "16px",
                        flexWrap: "wrap",
                    }}
                >
                    <div
                        style={{
                            flex: "1",
                            minWidth: "300px",
                            position: "relative",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                left: "12px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: "#6c757d",
                            }}
                        >
                            <svg
                                width="16"
                                height="16"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar proveedores por nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "12px 12px 12px 40px",
                                border: "1px solid #ced4da",
                                borderRadius: "6px",
                                fontSize: "14px",
                                outline: "none",
                                transition: "border-color 0.2s",
                            }}
                            onFocus={(e) =>
                                (e.target.style.borderColor = "#007bff")
                            }
                            onBlur={(e) =>
                                (e.target.style.borderColor = "#ced4da")
                            }
                        />
                    </div>
                    <button
                        type="submit"
                        style={{
                            padding: "12px 24px",
                            backgroundColor: "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "14px",
                            fontWeight: "500",
                            cursor: "pointer",
                            transition: "background-color 0.2s",
                        }}
                        onMouseEnter={(e) =>
                            (e.target.style.backgroundColor = "#0056b3")
                        }
                        onMouseLeave={(e) =>
                            (e.target.style.backgroundColor = "#007bff")
                        }
                    >
                        Buscar
                    </button>
                </form>
            </div>

            {/* Error */}
            {error && (
                <div
                    style={{
                        backgroundColor: "#f8d7da",
                        border: "1px solid #f5c6cb",
                        borderRadius: "6px",
                        padding: "16px",
                        marginBottom: "24px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                    }}
                >
                    <svg
                        width="20"
                        height="20"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        style={{ color: "#721c24", flexShrink: 0 }}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                    <div>
                        <h3
                            style={{
                                margin: "0 0 4px 0",
                                fontSize: "14px",
                                fontWeight: "600",
                                color: "#721c24",
                            }}
                        >
                            Error
                        </h3>
                        <p
                            style={{
                                margin: "0",
                                fontSize: "14px",
                                color: "#721c24",
                            }}
                        >
                            {error}
                        </p>
                    </div>
                </div>
            )}

            {/* Tabla de proveedores */}
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: "12px",
                    overflow: "hidden",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    border: "1px solid #e9ecef",
                }}
            >
                <div style={{ overflowX: "auto" }}>
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            minWidth: 900,
                            backgroundColor: "#fff",
                        }}
                    >
                        <thead>
                            <tr
                                style={{
                                    background:
                                        "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
                                    color: "white",
                                }}
                            >
                                <th
                                    style={{
                                        padding: "16px 12px",
                                        textAlign: "left",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        letterSpacing: "0.5px",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    🆔 ID
                                </th>
                                <th
                                    style={{
                                        padding: "16px 12px",
                                        textAlign: "left",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        letterSpacing: "0.5px",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    🏢 Nombre
                                </th>
                                <th
                                    style={{
                                        padding: "16px 12px",
                                        textAlign: "left",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        letterSpacing: "0.5px",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    👤 Contacto
                                </th>
                                <th
                                    style={{
                                        padding: "16px 12px",
                                        textAlign: "left",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        letterSpacing: "0.5px",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    ☎️ Teléfono
                                </th>
                                <th
                                    style={{
                                        padding: "16px 12px",
                                        textAlign: "left",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        letterSpacing: "0.5px",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    📧 Email
                                </th>
                                <th
                                    style={{
                                        padding: "16px 12px",
                                        textAlign: "left",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        letterSpacing: "0.5px",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    📅 Fecha de Creación
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {suppliers.map((supplier, index) => (
                                <tr
                                    key={supplier.id}
                                    style={{
                                        backgroundColor:
                                            index % 2 === 0
                                                ? "#fff"
                                                : "#f8f9fa",
                                        transition: "background-color 0.2s",
                                    }}
                                    onMouseEnter={(e) =>
                                        (e.target.parentElement.style.backgroundColor =
                                            "#e3f2fd")
                                    }
                                    onMouseLeave={(e) =>
                                        (e.target.parentElement.style.backgroundColor =
                                            index % 2 === 0
                                                ? "#fff"
                                                : "#f8f9fa")
                                    }
                                >
                                    <td
                                        style={{
                                            padding: "16px 12px",
                                            borderBottom: "1px solid #e9ecef",
                                        }}
                                    >
                                        <span
                                            style={{
                                                display: "inline-block",
                                                padding: "6px 14px",
                                                borderRadius: "20px",
                                                backgroundColor: "#e3f2fd",
                                                color: "#1976d2",
                                                fontWeight: "700",
                                                fontSize: "13px",
                                                letterSpacing: "0.5px",
                                            }}
                                        >
                                            #{supplier.id}
                                        </span>
                                    </td>
                                    <td
                                        style={{
                                            padding: "16px 12px",
                                            borderBottom: "1px solid #e9ecef",
                                            fontWeight: 600,
                                            color: "#2c3e50",
                                            fontSize: 15,
                                        }}
                                    >
                                        <button
                                            onClick={() =>
                                                handleSupplierClick(supplier)
                                            }
                                            style={{
                                                background: "none",
                                                border: "none",
                                                fontSize: "14px",
                                                fontWeight: "500",
                                                color: "#007bff",
                                                cursor: "pointer",
                                                textAlign: "left",
                                                padding: "0",
                                                textDecoration: "underline",
                                                textDecorationColor:
                                                    "transparent",
                                                transition: "all 0.2s",
                                            }}
                                            onMouseEnter={(e) =>
                                                (e.target.style.textDecorationColor =
                                                    "#007bff")
                                            }
                                            onMouseLeave={(e) =>
                                                (e.target.style.textDecorationColor =
                                                    "transparent")
                                            }
                                        >
                                            {supplier.name}
                                        </button>
                                    </td>
                                    <td
                                        style={{
                                            padding: "16px 12px",
                                            borderBottom: "1px solid #e9ecef",
                                            color: "#495057",
                                            fontWeight: 500,
                                            fontSize: 14,
                                        }}
                                    >
                                        {supplier.contact_name || (
                                            <span
                                                style={{
                                                    color: "#adb5bd",
                                                    fontStyle: "italic",
                                                }}
                                            >
                                                No especificado
                                            </span>
                                        )}
                                    </td>
                                    <td
                                        style={{
                                            padding: "16px 12px",
                                            borderBottom: "1px solid #e9ecef",
                                            color: "#495057",
                                            fontWeight: 500,
                                            fontSize: 14,
                                        }}
                                    >
                                        {supplier.phone || (
                                            <span
                                                style={{
                                                    color: "#adb5bd",
                                                    fontStyle: "italic",
                                                }}
                                            >
                                                No especificado
                                            </span>
                                        )}
                                    </td>
                                    <td
                                        style={{
                                            padding: "16px 12px",
                                            borderBottom: "1px solid #e9ecef",
                                            color: "#495057",
                                            fontWeight: 500,
                                            fontSize: 14,
                                        }}
                                    >
                                        {supplier.email || (
                                            <span
                                                style={{
                                                    color: "#adb5bd",
                                                    fontStyle: "italic",
                                                }}
                                            >
                                                No especificado
                                            </span>
                                        )}
                                    </td>
                                    <td
                                        style={{
                                            padding: "16px 12px",
                                            borderBottom: "1px solid #e9ecef",
                                            color: "#495057",
                                            fontWeight: 500,
                                            fontSize: 14,
                                        }}
                                    >
                                        {supplier.created_at
                                            ? new Date(
                                                  supplier.created_at
                                              ).toLocaleDateString("es-ES", {
                                                  year: "numeric",
                                                  month: "short",
                                                  day: "numeric",
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                              })
                                            : "-"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Estado vacío */}
                {suppliers.length === 0 && !loading && (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "64px 24px",
                            color: "#6c757d",
                        }}
                    >
                        <div
                            style={{
                                width: "96px",
                                height: "96px",
                                margin: "0 auto 24px",
                                color: "#dee2e6",
                            }}
                        >
                            <svg
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1}
                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                            </svg>
                        </div>
                        <h3
                            style={{
                                fontSize: "18px",
                                fontWeight: "600",
                                color: "#495057",
                                margin: "0 0 8px 0",
                            }}
                        >
                            No se encontraron proveedores
                        </h3>
                        <p
                            style={{
                                fontSize: "14px",
                                color: "#6c757d",
                                maxWidth: "400px",
                                margin: "0 auto",
                            }}
                        >
                            {searchTerm
                                ? "No hay proveedores que coincidan con tu búsqueda. Intenta con otros términos."
                                : "Aún no hay proveedores registrados en el sistema."}
                        </p>
                    </div>
                )}

                {/* Loading en la tabla */}
                {loading && suppliers.length > 0 && (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "32px 24px",
                        }}
                    >
                        <div
                            style={{
                                width: "32px",
                                height: "32px",
                                border: "3px solid #e3e6ea",
                                borderTop: "3px solid #007bff",
                                borderRadius: "50%",
                                animation: "spin 1s linear infinite",
                                margin: "0 auto 16px",
                            }}
                        ></div>
                        <p
                            style={{
                                color: "#6c757d",
                                fontSize: "14px",
                                margin: "0",
                            }}
                        >
                            Cargando más proveedores...
                        </p>
                    </div>
                )}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
                <div style={{ marginTop: "32px" }}>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        goToPage={goToPage}
                        goToNextPage={goToNextPage}
                        goToPrevPage={goToPrevPage}
                        hasNextPage={currentPage < totalPages}
                        hasPrevPage={currentPage > 1}
                        isLoading={loading}
                        totalItems={totalCount}
                    />
                </div>
            )}

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

export default SuppliersPage;
