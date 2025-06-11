import React, { useState, useEffect, useCallback } from "react";
import { customersService } from "../services/customersService";
import { useAuth } from "../context/AuthContext";

const CustomersListPage = () => {
    const { authToken } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        pageSize: 20
    });
    
    // Estados para edición
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: "",
        phone: "",
        email: "",
        notes: ""
    });
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState(null);

    // Estados para eliminación
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Cargar clientes
    const loadCustomers = useCallback(async (page = 1, search = "") => {
        if (!authToken) return;

        try {
            setLoading(true);
            setError(null);

            let response;
            if (search.trim().length >= 2) {
                response = await customersService.searchCustomers({ 
                    search: search.trim(),
                    page,
                    page_size: pagination.pageSize
                }, authToken);
            } else {
                response = await customersService.getCustomers({
                    page,
                    page_size: pagination.pageSize
                }, authToken);
            }

            const customersList = response.results || [];
            setCustomers(customersList);
            setFilteredCustomers(customersList);
            
            setPagination(prev => ({
                ...prev,
                currentPage: page,
                totalPages: Math.ceil((response.count || 0) / pagination.pageSize),
                totalItems: response.count || 0
            }));

        } catch (error) {
            console.error("Error loading customers:", error);
            setError("Error al cargar los clientes");
            setCustomers([]);
            setFilteredCustomers([]);
        } finally {
            setLoading(false);
        }
    }, [authToken, pagination.pageSize]);

    // Effect para cargar clientes iniciales
    useEffect(() => {
        loadCustomers(1);
    }, [loadCustomers]);

    // Effect para búsqueda con debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            loadCustomers(1, searchTerm);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, loadCustomers]);

    // Validaciones
    const validatePhone = (phone) => {
        if (!phone) return true;
        const phoneRegex = /^[\d\s\-\(\)\+]*$/;
        if (!phoneRegex.test(phone)) return false;
        const digitCount = phone.replace(/[^\d]/g, '').length;
        return !(digitCount > 0 && digitCount < 7);
    };

    const validateEmail = (email) => {
        if (!email) return true;
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email.trim());
    };

    // Manejo de edición
    const handleEditCustomer = (customer) => {
        setEditingCustomer(customer);
        setEditFormData({
            name: customer.name || "",
            phone: customer.phone || "",
            email: customer.email || "",
            notes: customer.notes || ""
        });
        setShowEditModal(true);
        setUpdateError(null);
    };

    const handleUpdateCustomer = async () => {
        if (!editFormData.name.trim()) {
            setUpdateError("El nombre del cliente es requerido");
            return;
        }

        if (editFormData.phone && !validatePhone(editFormData.phone)) {
            setUpdateError("El número de teléfono no es válido");
            return;
        }

        if (editFormData.email && !validateEmail(editFormData.email)) {
            setUpdateError("El formato del email no es válido");
            return;
        }

        try {
            setIsUpdating(true);
            setUpdateError(null);

            await customersService.updateCustomer(editingCustomer.id, editFormData, authToken);
            
            // Recargar la lista
            await loadCustomers(pagination.currentPage, searchTerm);
            
            setShowEditModal(false);
            setEditingCustomer(null);

        } catch (error) {
            console.error("Error updating customer:", error);
            setUpdateError(error.message || "Error al actualizar el cliente");
        } finally {
            setIsUpdating(false);
        }
    };

    // Manejo de eliminación
    const handleDeleteCustomer = (customer) => {
        setCustomerToDelete(customer);
        setShowDeleteModal(true);
    };

    const confirmDeleteCustomer = async () => {
        if (!customerToDelete) return;

        try {
            setIsDeleting(true);
            await customersService.deleteCustomer(customerToDelete.id, authToken);
            
            // Recargar la lista
            await loadCustomers(pagination.currentPage, searchTerm);
            
            setShowDeleteModal(false);
            setCustomerToDelete(null);

        } catch (error) {
            console.error("Error deleting customer:", error);
            alert("Error al eliminar el cliente: " + (error.message || "Error desconocido"));
        } finally {
            setIsDeleting(false);
        }
    };

    // Paginación
    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            loadCustomers(newPage, searchTerm);
        }
    };

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
            {/* Título de la página */}
            <div
                style={{
                    marginBottom: "30px",
                    borderBottom: "2px solid #eee",
                    paddingBottom: "15px",
                    backgroundColor: "white",
                    padding: "20px",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <h1
                            style={{
                                color: "#2c3e50",
                                fontSize: "28px",
                                fontWeight: "700",
                                margin: "0 0 8px 0",
                            }}
                        >
                            Lista de Clientes
                        </h1>
                        <p
                            style={{
                                color: "#6c757d",
                                fontSize: "16px",
                                margin: 0,
                            }}
                        >
                            Gestione la información de sus clientes
                        </p>
                    </div>
                    
                    <button
                        onClick={() => window.location.href = "/clientes/nuevo"}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "12px 20px",
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "white",
                            backgroundColor: "#3498db",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            textDecoration: "none",
                        }}
                    >
                        <span style={{ marginRight: "8px", fontSize: "14px" }}>+</span>
                        Nuevo Cliente
                    </button>
                </div>
            </div>

            {/* Filtros y búsqueda */}
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    padding: "20px",
                    marginBottom: "20px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    border: "1px solid #dee2e6",
                }}
            >
                <div style={{ display: "flex", gap: "15px", alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ flex: "1", minWidth: "300px" }}>
                        <label
                            style={{
                                display: "block",
                                fontSize: "14px",
                                fontWeight: "600",
                                color: "#2c3e50",
                                marginBottom: "8px",
                            }}
                        >
                            Buscar Cliente
                        </label>
                        <div style={{ position: "relative" }}>
                            <input
                                type="text"
                                placeholder="Buscar por nombre, teléfono o email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: "100%",
                                    boxSizing: "border-box",
                                    paddingLeft: "35px",
                                    paddingRight: "12px",
                                    paddingTop: "10px",
                                    paddingBottom: "10px",
                                    border: "1px solid #dee2e6",
                                    borderRadius: "4px",
                                    fontSize: "14px",
                                    backgroundColor: "white",
                                }}
                            />
                            <div
                                style={{
                                    position: "absolute",
                                    left: "10px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "#6c757d",
                                    fontSize: "14px",
                                }}
                            >
                                ⌕
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenido principal */}
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    border: "1px solid #dee2e6",
                    overflow: "hidden",
                }}
            >
                {error && (
                    <div
                        style={{
                            padding: "15px 20px",
                            backgroundColor: "#f8d7da",
                            border: "1px solid #f5c6cb",
                            color: "#721c24",
                            fontSize: "14px",
                        }}
                    >
                        {error}
                    </div>
                )}

                {loading && (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "40px",
                            color: "#6c757d",
                        }}
                    >
                        <div style={{ fontSize: "20px", marginBottom: "10px" }}>⏳</div>
                        <p style={{ margin: 0, fontSize: "16px" }}>Cargando clientes...</p>
                    </div>
                )}

                {!loading && !error && (
                    <>
                        {/* Encabezado de la tabla */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 150px 200px 100px 120px",
                                gap: "15px",
                                padding: "15px 20px",
                                backgroundColor: "#f8f9fa",
                                borderBottom: "1px solid #dee2e6",
                                fontSize: "14px",
                                fontWeight: "600",
                                color: "#2c3e50",
                            }}
                        >
                            <div>CLIENTE</div>
                            <div>TELÉFONO</div>
                            <div>EMAIL</div>
                            <div>NOTAS</div>
                            <div>ACCIONES</div>
                        </div>

                        {/* Lista de clientes */}
                        {filteredCustomers.length > 0 ? (
                            filteredCustomers.map((customer) => (
                                <div
                                    key={customer.id}
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "1fr 150px 200px 100px 120px",
                                        gap: "15px",
                                        padding: "15px 20px",
                                        borderBottom: "1px solid #f8f9fa",
                                        fontSize: "14px",
                                        alignItems: "center",
                                    }}
                                >
                                    <div>
                                        <div
                                            style={{
                                                fontWeight: "600",
                                                color: "#2c3e50",
                                            }}
                                        >
                                            {customer.name}
                                        </div>
                                    </div>
                                    
                                    <div style={{ color: "#6c757d" }}>
                                        {customer.phone || "-"}
                                    </div>
                                    
                                    <div 
                                        style={{ 
                                            color: "#6c757d",
                                            wordBreak: "break-word"
                                        }}
                                    >
                                        {customer.email || "-"}
                                    </div>
                                    
                                    <div style={{ color: "#6c757d" }}>
                                        {customer.notes ? (
                                            <span title={customer.notes}>
                                                {customer.notes.length > 20 
                                                    ? customer.notes.substring(0, 20) + "..." 
                                                    : customer.notes}
                                            </span>
                                        ) : (
                                            "-"
                                        )}
                                    </div>
                                    
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <button
                                            onClick={() => handleEditCustomer(customer)}
                                            style={{
                                                padding: "6px 10px",
                                                fontSize: "12px",
                                                backgroundColor: "#3498db",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                            }}
                                            title="Editar cliente"
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCustomer(customer)}
                                            style={{
                                                padding: "6px 10px",
                                                fontSize: "12px",
                                                backgroundColor: "#e74c3c",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                            }}
                                            title="Eliminar cliente"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div
                                style={{
                                    textAlign: "center",
                                    padding: "40px",
                                    color: "#6c757d",
                                }}
                            >
                                <div style={{ fontSize: "20px", marginBottom: "10px" }}>👥</div>
                                <p style={{ margin: 0, fontSize: "16px" }}>
                                    {searchTerm 
                                        ? `No se encontraron clientes con "${searchTerm}"` 
                                        : "No hay clientes registrados"}
                                </p>
                            </div>
                        )}

                        {/* Paginación */}
                        {pagination.totalPages > 1 && (
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "15px 20px",
                                    borderTop: "1px solid #dee2e6",
                                    backgroundColor: "#f8f9fa",
                                }}
                            >
                                <div style={{ fontSize: "14px", color: "#6c757d" }}>
                                    Mostrando {filteredCustomers.length} de {pagination.totalItems} clientes
                                </div>
                                
                                <div style={{ display: "flex", gap: "5px" }}>
                                    <button
                                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                                        disabled={pagination.currentPage === 1}
                                        style={{
                                            padding: "8px 12px",
                                            fontSize: "14px",
                                            backgroundColor: pagination.currentPage === 1 ? "#f8f9fa" : "#3498db",
                                            color: pagination.currentPage === 1 ? "#6c757d" : "white",
                                            border: "1px solid #dee2e6",
                                            borderRadius: "4px",
                                            cursor: pagination.currentPage === 1 ? "not-allowed" : "pointer",
                                        }}
                                    >
                                        Anterior
                                    </button>
                                    
                                    <span
                                        style={{
                                            padding: "8px 12px",
                                            fontSize: "14px",
                                            color: "#2c3e50",
                                            alignSelf: "center",
                                        }}
                                    >
                                        {pagination.currentPage} de {pagination.totalPages}
                                    </span>
                                    
                                    <button
                                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                                        disabled={pagination.currentPage === pagination.totalPages}
                                        style={{
                                            padding: "8px 12px",
                                            fontSize: "14px",
                                            backgroundColor: pagination.currentPage === pagination.totalPages ? "#f8f9fa" : "#3498db",
                                            color: pagination.currentPage === pagination.totalPages ? "#6c757d" : "white",
                                            border: "1px solid #dee2e6",
                                            borderRadius: "4px",
                                            cursor: pagination.currentPage === pagination.totalPages ? "not-allowed" : "pointer",
                                        }}
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal de edición */}
            {showEditModal && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 1000,
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            setShowEditModal(false);
                        }
                    }}
                >
                    <div
                        style={{
                            backgroundColor: "white",
                            borderRadius: "8px",
                            padding: "30px",
                            maxWidth: "500px",
                            width: "90%",
                            maxHeight: "80vh",
                            overflow: "auto",
                        }}
                    >
                        <h3
                            style={{
                                margin: "0 0 20px 0",
                                fontSize: "20px",
                                fontWeight: "600",
                                color: "#2c3e50",
                            }}
                        >
                            Editar Cliente
                        </h3>

                        {updateError && (
                            <div
                                style={{
                                    marginBottom: "15px",
                                    padding: "12px",
                                    backgroundColor: "#f8d7da",
                                    border: "1px solid #f5c6cb",
                                    borderRadius: "4px",
                                    color: "#721c24",
                                    fontSize: "14px",
                                }}
                            >
                                {updateError}
                            </div>
                        )}

                        <div style={{ display: "grid", gap: "15px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#2c3e50", marginBottom: "5px" }}>
                                    Nombre *
                                </label>
                                <input
                                    type="text"
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                                    style={{
                                        width: "100%",
                                        boxSizing: "border-box",
                                        padding: "10px",
                                        fontSize: "14px",
                                        border: "1px solid #dee2e6",
                                        borderRadius: "4px",
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#2c3e50", marginBottom: "5px" }}>
                                    Teléfono
                                </label>
                                <input
                                    type="tel"
                                    value={editFormData.phone}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    style={{
                                        width: "100%",
                                        boxSizing: "border-box",
                                        padding: "10px",
                                        fontSize: "14px",
                                        border: "1px solid #dee2e6",
                                        borderRadius: "4px",
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#2c3e50", marginBottom: "5px" }}>
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={editFormData.email}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                                    style={{
                                        width: "100%",
                                        boxSizing: "border-box",
                                        padding: "10px",
                                        fontSize: "14px",
                                        border: "1px solid #dee2e6",
                                        borderRadius: "4px",
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#2c3e50", marginBottom: "5px" }}>
                                    Notas
                                </label>
                                <textarea
                                    value={editFormData.notes}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    rows={3}
                                    style={{
                                        width: "100%",
                                        boxSizing: "border-box",
                                        padding: "10px",
                                        fontSize: "14px",
                                        border: "1px solid #dee2e6",
                                        borderRadius: "4px",
                                        resize: "vertical",
                                        fontFamily: "inherit",
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                            <button
                                onClick={() => setShowEditModal(false)}
                                disabled={isUpdating}
                                style={{
                                    padding: "10px 20px",
                                    fontSize: "14px",
                                    color: "#6c757d",
                                    backgroundColor: "transparent",
                                    border: "1px solid #dee2e6",
                                    borderRadius: "4px",
                                    cursor: isUpdating ? "not-allowed" : "pointer",
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleUpdateCustomer}
                                disabled={isUpdating || !editFormData.name.trim()}
                                style={{
                                    padding: "10px 20px",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: "white",
                                    backgroundColor: isUpdating || !editFormData.name.trim() ? "#95a5a6" : "#3498db",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: isUpdating || !editFormData.name.trim() ? "not-allowed" : "pointer",
                                }}
                            >
                                {isUpdating ? "Actualizando..." : "Guardar Cambios"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de confirmación de eliminación */}
            {showDeleteModal && customerToDelete && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0,0,0,0.5)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 1000,
                    }}
                >
                    <div
                        style={{
                            backgroundColor: "white",
                            borderRadius: "8px",
                            padding: "30px",
                            maxWidth: "400px",
                            width: "90%",
                        }}
                    >
                        <h3
                            style={{
                                margin: "0 0 15px 0",
                                fontSize: "20px",
                                fontWeight: "600",
                                color: "#e74c3c",
                            }}
                        >
                            Confirmar Eliminación
                        </h3>
                        
                        <p style={{ margin: "0 0 20px 0", fontSize: "16px", color: "#2c3e50" }}>
                            ¿Está seguro que desea eliminar al cliente <strong>"{customerToDelete.name}"</strong>?
                        </p>
                        
                        <p style={{ margin: "0 0 20px 0", fontSize: "14px", color: "#6c757d" }}>
                            Esta acción no se puede deshacer.
                        </p>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isDeleting}
                                style={{
                                    padding: "10px 20px",
                                    fontSize: "14px",
                                    color: "#6c757d",
                                    backgroundColor: "transparent",
                                    border: "1px solid #dee2e6",
                                    borderRadius: "4px",
                                    cursor: isDeleting ? "not-allowed" : "pointer",
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDeleteCustomer}
                                disabled={isDeleting}
                                style={{
                                    padding: "10px 20px",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: "white",
                                    backgroundColor: isDeleting ? "#95a5a6" : "#e74c3c",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: isDeleting ? "not-allowed" : "pointer",
                                }}
                            >
                                {isDeleting ? "Eliminando..." : "Eliminar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomersListPage; 