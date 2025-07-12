import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getSuppliers, getAllSuppliers } from "../services/suppliersService";

// Componente de formulario para agregar proveedor
const NuevoProveedorForm = ({ onClose }) => {
  const { authToken } = useAuth();
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [contacto, setContacto] = useState("");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!nombre.trim()) return;

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(
        "https://unidental-backend.onrender.com/api/suppliers/suppliers/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${authToken}`,
          },
          body: JSON.stringify({
            name: nombre.trim(),
            contact_name: contacto.trim(),
            phone: telefono.trim(),
            email: email.trim(),
          }),
        }
      );

      if (response.ok) {
        const newSupplier = await response.json();
        alert(`Proveedor "${newSupplier.name}" creado exitosamente`);
        onClose();
        // Recargar la lista de proveedores
        window.location.reload();
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Error al crear el proveedor");
      }
    } catch (err) {
      console.error("Error creating supplier:", err);
      setError("Error de conexión. Por favor, inténtalo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        background: "rgba(0,0,0,0.35)",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "#fff",
          padding: 36,
          borderRadius: 16,
          minWidth: 340,
          maxWidth: 480,
          width: "100%",
          boxShadow: "0 8px 32px rgba(44,62,80,0.18)",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          border: "1.5px solid #e1e4ea",
          position: "relative",
          boxSizing: "border-box",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontWeight: 800,
            fontSize: 24,
            color: "#2c3e50",
            letterSpacing: "-1px",
            textAlign: "center",
          }}
        >
          Agregar Proveedor
        </h2>
        {error && (
          <div
            style={{
              background: "#f8d7da",
              border: "1px solid #f5c6cb",
              borderRadius: 6,
              padding: 12,
              color: "#721c24",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}
        <label style={{ fontWeight: 600, color: "#34495e", fontSize: 15 }}>
          Nombre <span style={{ color: "#e74c3c" }}>*</span>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onBlur={() => setTouched(true)}
            autoFocus
            required
            style={{
              width: "100%",
              padding: "10px 14px",
              marginTop: 6,
              borderRadius: 7,
              border:
                touched && !nombre.trim()
                  ? "1.5px solid #e74c3c"
                  : "1.5px solid #bfc9d1",
              fontSize: 15,
              outline: "none",
              background: touched && !nombre.trim() ? "#fff6f6" : "#f8fafc",
              transition: "border-color 0.2s",
              boxSizing: "border-box",
            }}
          />
          {touched && !nombre.trim() && (
            <span
              style={{
                color: "#e74c3c",
                fontSize: 13,
                marginTop: 2,
                display: "block",
              }}
            >
              El nombre es obligatorio
            </span>
          )}
        </label>
        <label style={{ fontWeight: 600, color: "#34495e", fontSize: 15 }}>
          Teléfono
          <input
            type="text"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              marginTop: 6,
              borderRadius: 7,
              border: "1.5px solid #bfc9d1",
              fontSize: 15,
              outline: "none",
              background: "#f8fafc",
              transition: "border-color 0.2s",
              boxSizing: "border-box",
            }}
          />
        </label>
        <label style={{ fontWeight: 600, color: "#34495e", fontSize: 15 }}>
          Nombre de contacto
          <input
            type="text"
            value={contacto}
            onChange={(e) => setContacto(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              marginTop: 6,
              borderRadius: 7,
              border: "1.5px solid #bfc9d1",
              fontSize: 15,
              outline: "none",
              background: "#f8fafc",
              transition: "border-color 0.2s",
              boxSizing: "border-box",
            }}
          />
        </label>
        <label style={{ fontWeight: 600, color: "#34495e", fontSize: 15 }}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              marginTop: 6,
              borderRadius: 7,
              border: "1.5px solid #bfc9d1",
              fontSize: 15,
              outline: "none",
              background: "#f8fafc",
              transition: "border-color 0.2s",
              boxSizing: "border-box",
            }}
          />
        </label>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 14,
            marginTop: 8,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              padding: "9px 22px",
              background: "#f4f6fa",
              border: "none",
              borderRadius: 7,
              fontWeight: 700,
              color: "#34495e",
              fontSize: 15,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              boxShadow: "0 1px 2px rgba(44,62,80,0.04)",
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!nombre.trim() || isSubmitting}
            style={{
              padding: "9px 22px",
              background:
                nombre.trim() && !isSubmitting ? "#27ae60" : "#bfc9d1",
              color: "white",
              border: "none",
              borderRadius: 7,
              fontWeight: 700,
              fontSize: 15,
              cursor:
                nombre.trim() && !isSubmitting ? "pointer" : "not-allowed",
              boxShadow: "0 1px 2px rgba(44,62,80,0.04)",
            }}
          >
            {isSubmitting ? "Guardando..." : "Guardar"}
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: 12,
            right: 16,
            background: "none",
            border: "none",
            fontSize: 22,
            color: "#bfc9d1",
            cursor: "pointer",
          }}
          title="Cerrar"
        >
          ×
        </button>
      </form>
    </div>
  );
};

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
  const [showNuevoProveedor, setShowNuevoProveedor] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState({
    success: 0,
    failed: 0,
    total: 0,
  });

  // Función para navegar al detalle del proveedor
  const handleSupplierClick = (supplier) => {
    // Crear un nombre URL-friendly que incluya el ID
    const urlName = `${supplier.name
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .toLowerCase()}-id-${supplier.id}`;
    navigate(`/compras/proveedores/${urlName}`);
  };

  // Función para cargar proveedores (optimizada)
  const loadSuppliers = async (page = 1, search = "", forceRefresh = false) => {
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

  // Función para eliminar proveedores seleccionados
  const handleDeleteSuppliers = async () => {
    if (selectedSuppliers.length === 0) return;

    setIsDeleting(true);
    setDeleteProgress({
      success: 0,
      failed: 0,
      total: selectedSuppliers.length,
    });

    const results = [];

    for (const supplierId of selectedSuppliers) {
      try {
        const response = await fetch(
          `https://unidental-backend.onrender.com/api/suppliers/suppliers/${supplierId}/`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Token ${authToken}`,
            },
          }
        );

        if (response.ok) {
          results.push({ id: supplierId, success: true });
          setDeleteProgress((prev) => ({
            ...prev,
            success: prev.success + 1,
          }));
        } else {
          results.push({
            id: supplierId,
            success: false,
            error: response.status,
          });
          setDeleteProgress((prev) => ({
            ...prev,
            failed: prev.failed + 1,
          }));
        }
      } catch (error) {
        results.push({
          id: supplierId,
          success: false,
          error: "Network error",
        });
        setDeleteProgress((prev) => ({
          ...prev,
          failed: prev.failed + 1,
        }));
      }
    }

    // Mostrar resultados
    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    if (successful > 0 && failed === 0) {
      alert(`✅ ${successful} proveedor(es) eliminado(s) exitosamente`);
    } else if (successful > 0 && failed > 0) {
      alert(`⚠️ ${successful} proveedor(es) eliminado(s), ${failed} fallaron`);
    } else {
      alert(`❌ Error al eliminar los proveedores seleccionados`);
    }

    // Limpiar estados y recargar
    setShowDeleteConfirm(false);
    setDeleteMode(false);
    setSelectedSuppliers([]);
    setIsDeleting(false);
    setDeleteProgress({ success: 0, failed: 0, total: 0 });

    // Recargar la lista de proveedores
    window.location.reload();
  };

  if (loading && suppliers.length === 0) {
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
              Esta carga inicial puede tomar unos segundos más, pero las
              navegaciones posteriores serán instantáneas
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
          background: "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
          borderRadius: "12px",
          padding: "32px",
          marginBottom: "24px",
          boxShadow: "0 4px 16px rgba(44,62,80,0.15)",
          border: "1px solid #2c3e50",
          color: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                backgroundColor: "rgba(255,255,255,0.2)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(10px)",
              }}
            >
              <svg
                width="28"
                height="28"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: "white" }}
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
                  fontSize: "32px",
                  fontWeight: "800",
                  color: "white",
                  margin: "0",
                  letterSpacing: "-0.5px",
                }}
              >
                Proveedores
              </h1>
              <p
                style={{
                  color: "rgba(255,255,255,0.8)",
                  margin: "8px 0 0 0",
                  fontSize: "16px",
                  fontWeight: "500",
                }}
              >
                Gestiona todos los proveedores de la empresa
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de agregar y eliminar proveedor debajo del banner */}
      <div style={{ display: "flex", gap: "12px", margin: "24px 0" }}>
        <button
          style={{
            padding: "10px 18px",
            backgroundColor: "#27ae60",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
          title="Agregar proveedor"
          onClick={() => setShowNuevoProveedor(true)}
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Agregar Proveedor
        </button>
        <button
          style={{
            padding: "10px 18px",
            backgroundColor: deleteMode ? "#c0392b" : "#e74c3c",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            position: "relative",
          }}
          title="Eliminar proveedor"
          onClick={() => {
            if (!deleteMode) {
              setDeleteMode(true);
              setSelectedSuppliers([]);
            } else {
              if (selectedSuppliers.length > 0) {
                setShowDeleteConfirm(true);
              }
            }
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          {deleteMode
            ? `Eliminar (${selectedSuppliers.length})`
            : "Eliminar Proveedor"}
        </button>
        {deleteMode && (
          <button
            style={{
              padding: "10px 18px",
              backgroundColor: "#bfc9d1",
              color: "#2c3e50",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
            title="Cancelar selección"
            onClick={() => {
              setDeleteMode(false);
              setSelectedSuppliers([]);
            }}
          >
            Cancelar
          </button>
        )}
      </div>
      {showNuevoProveedor && (
        <NuevoProveedorForm onClose={() => setShowNuevoProveedor(false)} />
      )}

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
        <style>{`
                    @media (max-width: 768px) {
                        .search-form {
                            grid-template-columns: 1fr !important;
                        }
                        .search-button {
                            width: 100% !important;
                            margin-top: 8px !important;
                        }
                    }
                `}</style>
        <form
          onSubmit={handleSearch}
          className="search-form"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: "16px",
            alignItems: "start",
          }}
        >
          <div
            style={{
              position: "relative",
              minWidth: 0,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#6c757d",
                zIndex: 1,
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
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#007bff")}
              onBlur={(e) => (e.target.style.borderColor = "#ced4da")}
            />
          </div>
          <button
            type="submit"
            className="search-button"
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
              whiteSpace: "nowrap",
              height: "fit-content",
            }}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#0056b3")}
            onMouseLeave={(e) => (e.target.style.backgroundColor = "#007bff")}
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
                {/* No checkboxes, solo selección por fila */}
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
              {suppliers.map((supplier) => (
                <tr
                  key={supplier.id}
                  style={{
                    borderBottom: "1px solid #f0f0f0",
                    cursor: "pointer",
                    background:
                      deleteMode && selectedSuppliers.includes(supplier.id)
                        ? "#fdecea"
                        : undefined,
                    transition: "background 0.18s",
                  }}
                  onClick={() => {
                    if (deleteMode) {
                      setSelectedSuppliers((prev) =>
                        prev.includes(supplier.id)
                          ? prev.filter((id) => id !== supplier.id)
                          : [...prev, supplier.id]
                      );
                    } else {
                      handleSupplierClick(supplier);
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (
                      !(deleteMode && selectedSuppliers.includes(supplier.id))
                    ) {
                      e.currentTarget.style.background = "#f0f4fa";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (
                      !(deleteMode && selectedSuppliers.includes(supplier.id))
                    ) {
                      e.currentTarget.style.background = "";
                    }
                  }}
                >
                  {/* No checkboxes, solo selección por fila */}
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
                    {supplier.name}
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
                      ? new Date(supplier.created_at).toLocaleDateString(
                          "es-ES",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
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
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              {Math.min(currentPage * 25, totalCount)} de {totalCount} elementos
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
                disabled={currentPage <= 1 || loading}
                style={{
                  padding: "8px 16px",
                  backgroundColor:
                    currentPage > 1 && !loading ? "#2c3e50" : "#e9ecef",
                  color: currentPage > 1 && !loading ? "#ffffff" : "#adb5bd",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor:
                    currentPage > 1 && !loading ? "pointer" : "not-allowed",
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
                    for (let i = 1; i <= totalPages; i++) {
                      pageNumbers.push(i);
                    }
                  } else {
                    pageNumbers.push(1);
                    let start = Math.max(2, currentPage - 1);
                    let end = Math.min(totalPages - 1, currentPage + 1);

                    if (start === 2) end = Math.min(4, totalPages - 1);
                    if (end === totalPages - 1)
                      start = Math.max(2, totalPages - 3);

                    if (start > 2) pageNumbers.push("...");

                    for (let i = start; i <= end; i++) {
                      pageNumbers.push(i);
                    }

                    if (end < totalPages - 1) pageNumbers.push("...");
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
                        onClick={() => goToPage(page)}
                        style={{
                          padding: "6px 12px",
                          backgroundColor:
                            page === currentPage ? "#2c3e50" : "#ffffff",
                          color: page === currentPage ? "#ffffff" : "#495057",
                          border: "1px solid #dee2e6",
                          borderRadius: "4px",
                          fontSize: "14px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        disabled={loading}
                        aria-label={`Ir a la página ${page}`}
                        aria-current={page === currentPage ? "page" : null}
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
                disabled={currentPage >= totalPages || loading}
                style={{
                  padding: "8px 16px",
                  backgroundColor:
                    currentPage < totalPages && !loading
                      ? "#2c3e50"
                      : "#e9ecef",
                  color:
                    currentPage < totalPages && !loading
                      ? "#ffffff"
                      : "#adb5bd",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor:
                    currentPage < totalPages && !loading
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
              <label htmlFor="page-input">Ir a página:</label>
              <input
                id="page-input"
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
                disabled={loading}
                aria-label="Número de página"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const pageNumber = parseInt(e.target.value, 10);
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
                  const input = document.getElementById("page-input");
                  const pageNumber = parseInt(input.value, 10);
                  if (
                    !isNaN(pageNumber) &&
                    pageNumber >= 1 &&
                    pageNumber <= totalPages
                  ) {
                    goToPage(pageNumber);
                  }
                }}
                disabled={loading}
                style={{
                  padding: "6px 12px",
                  backgroundColor: "#2c3e50",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "4px",
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "background-color 0.2s ease",
                }}
                aria-label="Ir a la página especificada"
              >
                Ir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div
          style={{
            background: "rgba(0,0,0,0.35)",
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 32,
              borderRadius: 14,
              minWidth: 340,
              maxWidth: 480,
              width: "100%",
              boxShadow: "0 8px 32px rgba(44,62,80,0.18)",
              border: "1.5px solid #e1e4ea",
              position: "relative",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontWeight: 800,
                fontSize: 22,
                color: "#c0392b",
                textAlign: "center",
              }}
            >
              ¿Estás seguro de eliminar los siguientes proveedores?
            </h3>
            <ul
              style={{
                margin: "18px 0 0 0",
                padding: 0,
                listStyle: "none",
                maxHeight: 180,
                overflowY: "auto",
              }}
            >
              {suppliers
                .filter((s) => selectedSuppliers.includes(s.id))
                .map((s) => (
                  <li
                    key={s.id}
                    style={{
                      padding: "6px 0",
                      color: "#2c3e50",
                      fontWeight: 600,
                      fontSize: 16,
                    }}
                  >
                    {s.name}
                  </li>
                ))}
            </ul>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 14,
                marginTop: 28,
              }}
            >
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: "9px 22px",
                  background: "#f4f6fa",
                  border: "none",
                  borderRadius: 7,
                  fontWeight: 700,
                  color: "#34495e",
                  fontSize: 15,
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  handleDeleteSuppliers();
                }}
                style={{
                  padding: "9px 22px",
                  background: "#c0392b",
                  color: "white",
                  border: "none",
                  borderRadius: 7,
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: "pointer",
                }}
                disabled={isDeleting}
              >
                {isDeleting ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              style={{
                position: "absolute",
                top: 12,
                right: 16,
                background: "none",
                border: "none",
                fontSize: 22,
                color: "#bfc9d1",
                cursor: "pointer",
              }}
              title="Cerrar"
            >
              ×
            </button>
          </div>
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
