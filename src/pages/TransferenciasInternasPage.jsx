import React, { useState } from "react";

const TransferenciasInternasPage = () => {
    // Estados para los filtros del historial
    const [filters, setFilters] = useState({
        estado: "",
        sedeOrigen: "",
        sedeDestino: "",
        producto: "",
        fechaDesde: "",
        fechaHasta: "",
        tipoTransferencia: "",
    });

    // Estado para el historial de transferencias (simulado)
    const [transferencias, setTransferencias] = useState([]);

    // Estado para el modal de nueva transferencia
    const [showModal, setShowModal] = useState(false);

    // Estado para el formulario de nueva transferencia
    const [formData, setFormData] = useState({
        producto: "",
        sedeOrigen: "",
        sedeDestino: "",
        cantidad: "",
        motivo: "",
        urgencia: "media",
        tipoTransferencia: "pull",
    });

    // Estado para el modal de detalles
    const [showDetallesModal, setShowDetallesModal] = useState(false);
    const [selectedTransferencia, setSelectedTransferencia] = useState(null);

    // Estado para notificaciones
    const [notification, setNotification] = useState({
        show: false,
        type: "",
        message: "",
    });

    // Datos simulados para los selects
    const ubicaciones = [
        "Sede Principal",
        "Sede Norte",
        "Sede Sur",
        "Almacén Central",
    ];

    const productos = [
        "Jeringa desechable 5ml",
        "Guantes de látex talla M",
        "Algodón hidrófilo 500g",
        "Mascarilla quirúrgica",
        "Alcohol isopropílico 1L",
    ];

    const estados = [
        "Pendiente",
        "Aprobada",
        "En Tránsito",
        "Completada",
        "Rechazada",
        "Cancelada",
    ];

    const nivelesUrgencia = [
        { value: "baja", label: "Baja" },
        { value: "media", label: "Media" },
        { value: "alta", label: "Alta" },
    ];

    // Funciones para manejar filtros
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters({
            ...filters,
            [name]: value,
        });
    };

    const applyFilters = () => {
        // En un caso real, aquí haríamos la llamada a la API con los filtros
        // Por ahora solo mostraremos una notificación
        setNotification({
            show: true,
            type: "success",
            message: "Filtros aplicados",
        });

        setTimeout(() => {
            setNotification({ show: false, type: "", message: "" });
        }, 3000);
    };

    const clearFilters = () => {
        setFilters({
            estado: "",
            sedeOrigen: "",
            sedeDestino: "",
            producto: "",
            fechaDesde: "",
            fechaHasta: "",
            tipoTransferencia: "",
        });

        setNotification({
            show: true,
            type: "success",
            message: "Filtros limpiados",
        });

        setTimeout(() => {
            setNotification({ show: false, type: "", message: "" });
        }, 3000);
    };

    // Funciones para el formulario de nueva transferencia
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validación básica
        if (
            !formData.producto ||
            !formData.sedeOrigen ||
            !formData.sedeDestino ||
            !formData.cantidad
        ) {
            setNotification({
                show: true,
                type: "error",
                message: "Por favor complete todos los campos obligatorios",
            });
            return;
        }

        if (formData.sedeOrigen === formData.sedeDestino) {
            setNotification({
                show: true,
                type: "error",
                message: "La sede de origen y destino no pueden ser iguales",
            });
            return;
        }

        // Crear nueva transferencia
        const nuevaTransferencia = {
            id: Date.now(),
            fechaSolicitud: new Date().toLocaleString("es"),
            producto: formData.producto,
            cantidad: parseInt(formData.cantidad),
            sedeOrigen: formData.sedeOrigen,
            sedeDestino: formData.sedeDestino,
            estado: "Pendiente",
            solicitadoPor: "Usuario Actual",
            motivo: formData.motivo,
            urgencia: formData.urgencia,
            tipoTransferencia: formData.tipoTransferencia,
            ultimaActualizacion: new Date().toLocaleString("es"),
        };

        // Actualizar el historial
        setTransferencias([nuevaTransferencia, ...transferencias]);

        // Mostrar notificación
        setNotification({
            show: true,
            type: "success",
            message:
                formData.tipoTransferencia === "pull"
                    ? "Solicitud de transferencia creada con éxito"
                    : "Transferencia registrada con éxito",
        });

        // Cerrar modal y resetear formulario
        setShowModal(false);
        setFormData({
            producto: "",
            sedeOrigen: "",
            sedeDestino: "",
            cantidad: "",
            motivo: "",
            urgencia: "media",
            tipoTransferencia: "pull",
        });

        setTimeout(() => {
            setNotification({ show: false, type: "", message: "" });
        }, 3000);
    };

    // Función para abrir el modal de detalles
    const openDetalles = (transferencia) => {
        setSelectedTransferencia(transferencia);
        setShowDetallesModal(true);
    };

    // Función para cambiar el estado de una transferencia
    const cambiarEstado = (id, nuevoEstado) => {
        const transferenciasActualizadas = transferencias.map((t) =>
            t.id === id
                ? {
                      ...t,
                      estado: nuevoEstado,
                      ultimaActualizacion: new Date().toLocaleString("es"),
                  }
                : t
        );

        setTransferencias(transferenciasActualizadas);

        setNotification({
            show: true,
            type: "success",
            message: `Estado actualizado a "${nuevoEstado}"`,
        });

        setTimeout(() => {
            setNotification({ show: false, type: "", message: "" });
        }, 3000);
    };

    return (
        <div
            style={{
                padding: "20px",
                maxWidth: "1400px",
                margin: "0 auto",
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            }}
        >
            {/* Título de la página */}
            <div
                style={{
                    marginBottom: "30px",
                    borderBottom: "2px solid #eee",
                    paddingBottom: "15px",
                }}
            >
                <h1
                    style={{
                        color: "#2c3e50",
                        fontSize: "28px",
                        fontWeight: "700",
                        margin: "0 0 8px 0",
                    }}
                >
                    Gestión de Transferencias Internas de Stock
                </h1>
                <p style={{ color: "#6c757d", fontSize: "16px", margin: 0 }}>
                    Administra y realiza seguimiento de las transferencias entre
                    sedes
                </p>
            </div>

            {/* Notificación */}
            {notification.show && (
                <div
                    style={{
                        padding: "10px 15px",
                        marginBottom: "20px",
                        borderRadius: "4px",
                        backgroundColor:
                            notification.type === "success"
                                ? "#d4edda"
                                : "#f8d7da",
                        color:
                            notification.type === "success"
                                ? "#155724"
                                : "#721c24",
                        border: `1px solid ${
                            notification.type === "success"
                                ? "#c3e6cb"
                                : "#f5c6cb"
                        }`,
                    }}
                >
                    {notification.message}
                </div>
            )}

            {/* Botón para solicitar nueva transferencia */}
            <div
                style={{
                    marginBottom: "20px",
                    display: "flex",
                    gap: "15px",
                    flexWrap: "wrap",
                }}
            >
                <button
                    onClick={() => {
                        setFormData({
                            ...formData,
                            tipoTransferencia: "pull", // Reiniciar al valor por defecto
                        });
                        setShowModal(true);
                    }}
                    style={{
                        backgroundColor: "#2c3e50",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "10px 16px",
                        fontSize: "16px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        fontWeight: "500",
                    }}
                >
                    <span style={{ marginRight: "8px" }}>+</span>
                    Solicitar Transferencia
                </button>
                <button
                    onClick={() => {
                        setFormData({
                            ...formData,
                            tipoTransferencia: "push", // Establecer como push
                        });
                        setShowModal(true);
                    }}
                    style={{
                        backgroundColor: "#3a506b",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        padding: "10px 16px",
                        fontSize: "16px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        fontWeight: "500",
                    }}
                >
                    <span style={{ marginRight: "8px" }}>+</span>
                    Registrar Envío
                </button>
            </div>

            {/* Sección de Filtros */}
            <div
                style={{
                    backgroundColor: "#f8f9fa",
                    borderRadius: "6px",
                    padding: "15px",
                    marginBottom: "20px",
                    border: "1px solid #e9ecef",
                }}
            >
                <h3
                    style={{
                        fontSize: "16px",
                        margin: "0 0 15px 0",
                        color: "#495057",
                    }}
                >
                    Filtros de Búsqueda
                </h3>

                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "15px",
                        marginBottom: "15px",
                    }}
                >
                    {/* Filtro de Estado */}
                    <div style={{ flex: "1", minWidth: "220px" }}>
                        <label
                            htmlFor="estado"
                            style={{
                                display: "block",
                                marginBottom: "5px",
                                fontWeight: "500",
                                fontSize: "14px",
                                color: "#495057",
                            }}
                        >
                            Estado:
                        </label>
                        <select
                            id="estado"
                            name="estado"
                            value={filters.estado}
                            onChange={handleFilterChange}
                            style={{
                                width: "100%",
                                padding: "8px",
                                borderRadius: "4px",
                                border: "1px solid #ced4da",
                                fontSize: "14px",
                            }}
                        >
                            <option value="">Todos los estados</option>
                            {estados.map((estado, index) => (
                                <option key={index} value={estado}>
                                    {estado}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro de Sede Origen */}
                    <div style={{ flex: "1", minWidth: "220px" }}>
                        <label
                            htmlFor="sedeOrigen"
                            style={{
                                display: "block",
                                marginBottom: "5px",
                                fontWeight: "500",
                                fontSize: "14px",
                                color: "#495057",
                            }}
                        >
                            Sede Origen:
                        </label>
                        <select
                            id="sedeOrigen"
                            name="sedeOrigen"
                            value={filters.sedeOrigen}
                            onChange={handleFilterChange}
                            style={{
                                width: "100%",
                                padding: "8px",
                                borderRadius: "4px",
                                border: "1px solid #ced4da",
                                fontSize: "14px",
                            }}
                        >
                            <option value="">Todas las sedes</option>
                            {ubicaciones.map((ubicacion, index) => (
                                <option key={index} value={ubicacion}>
                                    {ubicacion}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro de Sede Destino */}
                    <div style={{ flex: "1", minWidth: "220px" }}>
                        <label
                            htmlFor="sedeDestino"
                            style={{
                                display: "block",
                                marginBottom: "5px",
                                fontWeight: "500",
                                fontSize: "14px",
                                color: "#495057",
                            }}
                        >
                            Sede Destino:
                        </label>
                        <select
                            id="sedeDestino"
                            name="sedeDestino"
                            value={filters.sedeDestino}
                            onChange={handleFilterChange}
                            style={{
                                width: "100%",
                                padding: "8px",
                                borderRadius: "4px",
                                border: "1px solid #ced4da",
                                fontSize: "14px",
                            }}
                        >
                            <option value="">Todas las sedes</option>
                            {ubicaciones.map((ubicacion, index) => (
                                <option key={index} value={ubicacion}>
                                    {ubicacion}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Filtro de Tipo de Transferencia */}
                    <div style={{ flex: "1", minWidth: "220px" }}>
                        <label
                            htmlFor="tipoTransferencia"
                            style={{
                                display: "block",
                                marginBottom: "5px",
                                fontWeight: "500",
                                fontSize: "14px",
                                color: "#495057",
                            }}
                        >
                            Tipo de Transferencia:
                        </label>
                        <select
                            id="tipoTransferencia"
                            name="tipoTransferencia"
                            value={filters.tipoTransferencia}
                            onChange={handleFilterChange}
                            style={{
                                width: "100%",
                                padding: "8px",
                                borderRadius: "4px",
                                border: "1px solid #ced4da",
                                fontSize: "14px",
                            }}
                        >
                            <option value="">Todos los tipos</option>
                            <option value="pull">
                                Pull (Destino solicita a Origen)
                            </option>
                            <option value="push">
                                Push (Origen envía a Destino)
                            </option>
                        </select>
                    </div>
                </div>

                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "15px",
                        marginBottom: "15px",
                    }}
                >
                    {/* Filtro de Producto */}
                    <div style={{ flex: "1", minWidth: "220px" }}>
                        <label
                            htmlFor="producto"
                            style={{
                                display: "block",
                                marginBottom: "5px",
                                fontWeight: "500",
                                fontSize: "14px",
                                color: "#495057",
                            }}
                        >
                            Producto:
                        </label>
                        <input
                            type="text"
                            id="producto"
                            name="producto"
                            value={filters.producto}
                            onChange={handleFilterChange}
                            list="productosFilter"
                            style={{
                                width: "100%",
                                padding: "8px",
                                borderRadius: "4px",
                                border: "1px solid #ced4da",
                                fontSize: "14px",
                            }}
                            placeholder="Buscar producto"
                        />
                        <datalist id="productosFilter">
                            {productos.map((producto, index) => (
                                <option key={index} value={producto} />
                            ))}
                        </datalist>
                    </div>

                    {/* Filtro de Fecha Desde */}
                    <div style={{ flex: "1", minWidth: "220px" }}>
                        <label
                            htmlFor="fechaDesde"
                            style={{
                                display: "block",
                                marginBottom: "5px",
                                fontWeight: "500",
                                fontSize: "14px",
                                color: "#495057",
                            }}
                        >
                            Desde:
                        </label>
                        <input
                            type="date"
                            id="fechaDesde"
                            name="fechaDesde"
                            value={filters.fechaDesde}
                            onChange={handleFilterChange}
                            style={{
                                width: "100%",
                                padding: "8px",
                                borderRadius: "4px",
                                border: "1px solid #ced4da",
                                fontSize: "14px",
                            }}
                        />
                    </div>

                    {/* Filtro de Fecha Hasta */}
                    <div style={{ flex: "1", minWidth: "220px" }}>
                        <label
                            htmlFor="fechaHasta"
                            style={{
                                display: "block",
                                marginBottom: "5px",
                                fontWeight: "500",
                                fontSize: "14px",
                                color: "#495057",
                            }}
                        >
                            Hasta:
                        </label>
                        <input
                            type="date"
                            id="fechaHasta"
                            name="fechaHasta"
                            value={filters.fechaHasta}
                            onChange={handleFilterChange}
                            style={{
                                width: "100%",
                                padding: "8px",
                                borderRadius: "4px",
                                border: "1px solid #ced4da",
                                fontSize: "14px",
                            }}
                        />
                    </div>
                </div>

                {/* Botones de acción para filtros */}
                <div
                    style={{
                        display: "flex",
                        gap: "10px",
                        justifyContent: "flex-end",
                    }}
                >
                    <button
                        onClick={clearFilters}
                        style={{
                            backgroundColor: "#f8f9fa",
                            color: "#6c757d",
                            border: "1px solid #ced4da",
                            borderRadius: "4px",
                            padding: "8px 16px",
                            fontSize: "14px",
                            cursor: "pointer",
                            fontWeight: "500",
                        }}
                    >
                        Limpiar Filtros
                    </button>
                    <button
                        onClick={applyFilters}
                        style={{
                            backgroundColor: "#2c3e50",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            padding: "8px 16px",
                            fontSize: "14px",
                            cursor: "pointer",
                            fontWeight: "500",
                        }}
                    >
                        Aplicar Filtros
                    </button>
                </div>
            </div>

            {/* Tabla de Transferencias */}
            <div
                style={{
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    padding: "20px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                }}
            >
                <h2
                    style={{
                        fontSize: "20px",
                        margin: "0 0 20px 0",
                        color: "#2c3e50",
                    }}
                >
                    Historial de Transferencias
                </h2>

                <div style={{ overflowX: "auto" }}>
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            minWidth: "1000px",
                        }}
                    >
                        <thead>
                            <tr
                                style={{
                                    backgroundColor: "#2c3e50",
                                    color: "white",
                                }}
                            >
                                <th
                                    style={{
                                        padding: "12px 8px",
                                        textAlign: "left",
                                        border: "1px solid #34495e",
                                    }}
                                >
                                    ID
                                </th>
                                <th
                                    style={{
                                        padding: "12px 8px",
                                        textAlign: "left",
                                        border: "1px solid #34495e",
                                    }}
                                >
                                    Fecha Solicitud
                                </th>
                                <th
                                    style={{
                                        padding: "12px 8px",
                                        textAlign: "center",
                                        border: "1px solid #34495e",
                                    }}
                                >
                                    Tipo
                                </th>
                                <th
                                    style={{
                                        padding: "12px 8px",
                                        textAlign: "left",
                                        border: "1px solid #34495e",
                                    }}
                                >
                                    Producto
                                </th>
                                <th
                                    style={{
                                        padding: "12px 8px",
                                        textAlign: "center",
                                        border: "1px solid #34495e",
                                    }}
                                >
                                    Cantidad
                                </th>
                                <th
                                    style={{
                                        padding: "12px 8px",
                                        textAlign: "left",
                                        border: "1px solid #34495e",
                                    }}
                                >
                                    Sede Origen
                                </th>
                                <th
                                    style={{
                                        padding: "12px 8px",
                                        textAlign: "left",
                                        border: "1px solid #34495e",
                                    }}
                                >
                                    Sede Destino
                                </th>
                                <th
                                    style={{
                                        padding: "12px 8px",
                                        textAlign: "center",
                                        border: "1px solid #34495e",
                                    }}
                                >
                                    Estado
                                </th>
                                <th
                                    style={{
                                        padding: "12px 8px",
                                        textAlign: "left",
                                        border: "1px solid #34495e",
                                    }}
                                >
                                    Solicitado Por
                                </th>
                                <th
                                    style={{
                                        padding: "12px 8px",
                                        textAlign: "left",
                                        border: "1px solid #34495e",
                                    }}
                                >
                                    Últ. Actualización
                                </th>
                                <th
                                    style={{
                                        padding: "12px 8px",
                                        textAlign: "center",
                                        border: "1px solid #34495e",
                                    }}
                                >
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {transferencias.length > 0 ? (
                                transferencias.map((t) => (
                                    <tr key={t.id}>
                                        <td
                                            style={{
                                                padding: "10px 8px",
                                                borderBottom:
                                                    "1px solid #dee2e6",
                                            }}
                                        >
                                            {`TR-${t.id
                                                .toString()
                                                .substring(
                                                    t.id.toString().length - 5
                                                )}`}
                                        </td>
                                        <td
                                            style={{
                                                padding: "10px 8px",
                                                borderBottom:
                                                    "1px solid #dee2e6",
                                            }}
                                        >
                                            {t.fechaSolicitud}
                                        </td>
                                        <td
                                            style={{
                                                padding: "10px 8px",
                                                borderBottom:
                                                    "1px solid #dee2e6",
                                            }}
                                        >
                                            {t.tipoTransferencia === "pull"
                                                ? "Pull"
                                                : "Push"}
                                        </td>
                                        <td
                                            style={{
                                                padding: "10px 8px",
                                                borderBottom:
                                                    "1px solid #dee2e6",
                                            }}
                                        >
                                            {t.producto}
                                        </td>
                                        <td
                                            style={{
                                                padding: "10px 8px",
                                                borderBottom:
                                                    "1px solid #dee2e6",
                                                textAlign: "center",
                                                fontWeight: "600",
                                            }}
                                        >
                                            {t.cantidad}
                                        </td>
                                        <td
                                            style={{
                                                padding: "10px 8px",
                                                borderBottom:
                                                    "1px solid #dee2e6",
                                            }}
                                        >
                                            {t.sedeOrigen}
                                        </td>
                                        <td
                                            style={{
                                                padding: "10px 8px",
                                                borderBottom:
                                                    "1px solid #dee2e6",
                                            }}
                                        >
                                            {t.sedeDestino}
                                        </td>
                                        <td
                                            style={{
                                                padding: "10px 8px",
                                                borderBottom:
                                                    "1px solid #dee2e6",
                                                textAlign: "center",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    display: "inline-block",
                                                    padding: "4px 8px",
                                                    borderRadius: "4px",
                                                    backgroundColor:
                                                        t.estado === "Pendiente"
                                                            ? "#fef3e8"
                                                            : t.estado ===
                                                              "Aprobada"
                                                            ? "#e3f2fd"
                                                            : t.estado ===
                                                              "En Tránsito"
                                                            ? "#fff8e1"
                                                            : t.estado ===
                                                              "Completada"
                                                            ? "#e8f5e9"
                                                            : t.estado ===
                                                              "Rechazada"
                                                            ? "#ffebee"
                                                            : "#f5f5f5",
                                                    color:
                                                        t.estado === "Pendiente"
                                                            ? "#e67e22"
                                                            : t.estado ===
                                                              "Aprobada"
                                                            ? "#1976d2"
                                                            : t.estado ===
                                                              "En Tránsito"
                                                            ? "#f57f17"
                                                            : t.estado ===
                                                              "Completada"
                                                            ? "#2e7d32"
                                                            : t.estado ===
                                                              "Rechazada"
                                                            ? "#c62828"
                                                            : "#757575",
                                                    fontSize: "14px",
                                                    whiteSpace: "nowrap",
                                                }}
                                            >
                                                {t.estado}
                                            </span>
                                        </td>
                                        <td
                                            style={{
                                                padding: "10px 8px",
                                                borderBottom:
                                                    "1px solid #dee2e6",
                                            }}
                                        >
                                            {t.solicitadoPor}
                                        </td>
                                        <td
                                            style={{
                                                padding: "10px 8px",
                                                borderBottom:
                                                    "1px solid #dee2e6",
                                            }}
                                        >
                                            {t.ultimaActualizacion}
                                        </td>
                                        <td
                                            style={{
                                                padding: "10px 8px",
                                                borderBottom:
                                                    "1px solid #dee2e6",
                                                textAlign: "center",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: "5px",
                                                    justifyContent: "center",
                                                }}
                                            >
                                                <button
                                                    onClick={() =>
                                                        openDetalles(t)
                                                    }
                                                    style={{
                                                        backgroundColor:
                                                            "#2c3e50",
                                                        color: "white",
                                                        border: "none",
                                                        borderRadius: "4px",
                                                        padding: "5px 10px",
                                                        fontSize: "12px",
                                                        cursor: "pointer",
                                                    }}
                                                >
                                                    Ver Detalles
                                                </button>

                                                {t.estado === "Pendiente" && (
                                                    <>
                                                        <button
                                                            onClick={() =>
                                                                cambiarEstado(
                                                                    t.id,
                                                                    "Aprobada"
                                                                )
                                                            }
                                                            style={{
                                                                backgroundColor:
                                                                    "#1976d2",
                                                                color: "white",
                                                                border: "none",
                                                                borderRadius:
                                                                    "4px",
                                                                padding:
                                                                    "5px 10px",
                                                                fontSize:
                                                                    "12px",
                                                                cursor: "pointer",
                                                            }}
                                                        >
                                                            Aprobar
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                cambiarEstado(
                                                                    t.id,
                                                                    "Rechazada"
                                                                )
                                                            }
                                                            style={{
                                                                backgroundColor:
                                                                    "#c62828",
                                                                color: "white",
                                                                border: "none",
                                                                borderRadius:
                                                                    "4px",
                                                                padding:
                                                                    "5px 10px",
                                                                fontSize:
                                                                    "12px",
                                                                cursor: "pointer",
                                                            }}
                                                        >
                                                            Rechazar
                                                        </button>
                                                    </>
                                                )}

                                                {t.estado === "Aprobada" && (
                                                    <button
                                                        onClick={() =>
                                                            cambiarEstado(
                                                                t.id,
                                                                "En Tránsito"
                                                            )
                                                        }
                                                        style={{
                                                            backgroundColor:
                                                                "#f57f17",
                                                            color: "white",
                                                            border: "none",
                                                            borderRadius: "4px",
                                                            padding: "5px 10px",
                                                            fontSize: "12px",
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        Marcar Enviada
                                                    </button>
                                                )}

                                                {t.estado === "En Tránsito" && (
                                                    <button
                                                        onClick={() =>
                                                            cambiarEstado(
                                                                t.id,
                                                                "Completada"
                                                            )
                                                        }
                                                        style={{
                                                            backgroundColor:
                                                                "#2e7d32",
                                                            color: "white",
                                                            border: "none",
                                                            borderRadius: "4px",
                                                            padding: "5px 10px",
                                                            fontSize: "12px",
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        Marcar Recibida
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="10"
                                        style={{
                                            padding: "30px 8px",
                                            textAlign: "center",
                                            color: "#6c757d",
                                        }}
                                    >
                                        No hay transferencias registradas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginación */}
                {transferencias.length > 0 && (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: "20px",
                            padding: "10px 0",
                        }}
                    >
                        <div style={{ color: "#6c757d", fontSize: "14px" }}>
                            Mostrando 1-{transferencias.length} de{" "}
                            {transferencias.length} registros
                        </div>
                        <div style={{ display: "flex", gap: "5px" }}>
                            <button
                                style={{
                                    padding: "6px 12px",
                                    border: "1px solid #ced4da",
                                    backgroundColor: "#fff",
                                    borderRadius: "4px",
                                    color: "#6c757d",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                }}
                                disabled={true}
                            >
                                Anterior
                            </button>
                            <button
                                style={{
                                    padding: "6px 12px",
                                    border: "1px solid #2c3e50",
                                    backgroundColor: "#2c3e50",
                                    borderRadius: "4px",
                                    color: "#fff",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                }}
                            >
                                1
                            </button>
                            <button
                                style={{
                                    padding: "6px 12px",
                                    border: "1px solid #ced4da",
                                    backgroundColor: "#fff",
                                    borderRadius: "4px",
                                    color: "#6c757d",
                                    cursor: "pointer",
                                    fontSize: "14px",
                                }}
                                disabled={true}
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal para Nueva Transferencia */}
            {showModal && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
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
                            padding: "25px",
                            width: "90%",
                            maxWidth: "700px",
                            maxHeight: "90vh",
                            overflowY: "auto",
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "20px",
                            }}
                        >
                            <h2
                                style={{
                                    fontSize: "22px",
                                    margin: 0,
                                    color: "#2c3e50",
                                }}
                            >
                                {formData.tipoTransferencia === "pull"
                                    ? "Solicitar Nueva Transferencia"
                                    : "Registrar Nueva Transferencia"}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    backgroundColor: "transparent",
                                    border: "none",
                                    fontSize: "22px",
                                    cursor: "pointer",
                                    color: "#6c757d",
                                }}
                            >
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {/* Producto */}
                            <div style={{ marginBottom: "15px" }}>
                                <label
                                    htmlFor="producto"
                                    style={{
                                        display: "block",
                                        marginBottom: "5px",
                                        fontWeight: "500",
                                        fontSize: "14px",
                                        color: "#495057",
                                    }}
                                >
                                    Producto: *
                                </label>
                                <input
                                    type="text"
                                    id="producto"
                                    name="producto"
                                    value={formData.producto}
                                    onChange={handleInputChange}
                                    list="productosFilter"
                                    style={{
                                        width: "100%",
                                        padding: "8px",
                                        borderRadius: "4px",
                                        border: "1px solid #ced4da",
                                        fontSize: "14px",
                                    }}
                                    placeholder="Buscar producto"
                                    required
                                />
                                <datalist id="productosFilter">
                                    {productos.map((producto, index) => (
                                        <option key={index} value={producto} />
                                    ))}
                                </datalist>
                            </div>

                            {/* Sede Origen */}
                            <div style={{ marginBottom: "15px" }}>
                                <label
                                    htmlFor="sedeOrigen"
                                    style={{
                                        display: "block",
                                        marginBottom: "5px",
                                        fontWeight: "500",
                                        fontSize: "14px",
                                        color: "#495057",
                                    }}
                                >
                                    Sede Origen: *
                                </label>
                                <select
                                    id="sedeOrigen"
                                    name="sedeOrigen"
                                    value={formData.sedeOrigen}
                                    onChange={handleInputChange}
                                    style={{
                                        width: "100%",
                                        padding: "8px",
                                        borderRadius: "4px",
                                        border: "1px solid #ced4da",
                                        fontSize: "14px",
                                    }}
                                    required
                                >
                                    <option value="">
                                        Seleccionar sede origen
                                    </option>
                                    {ubicaciones.map((ubicacion, index) => (
                                        <option key={index} value={ubicacion}>
                                            {ubicacion}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Sede Destino */}
                            <div style={{ marginBottom: "15px" }}>
                                <label
                                    htmlFor="sedeDestino"
                                    style={{
                                        display: "block",
                                        marginBottom: "5px",
                                        fontWeight: "500",
                                        fontSize: "14px",
                                        color: "#495057",
                                    }}
                                >
                                    Sede Destino: *
                                </label>
                                <select
                                    id="sedeDestino"
                                    name="sedeDestino"
                                    value={formData.sedeDestino}
                                    onChange={handleInputChange}
                                    style={{
                                        width: "100%",
                                        padding: "8px",
                                        borderRadius: "4px",
                                        border: "1px solid #ced4da",
                                        fontSize: "14px",
                                    }}
                                    required
                                >
                                    <option value="">
                                        Seleccionar sede destino
                                    </option>
                                    {ubicaciones.map((ubicacion, index) => (
                                        <option key={index} value={ubicacion}>
                                            {ubicacion}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Cantidad */}
                            <div style={{ marginBottom: "15px" }}>
                                <label
                                    htmlFor="cantidad"
                                    style={{
                                        display: "block",
                                        marginBottom: "5px",
                                        fontWeight: "500",
                                        fontSize: "14px",
                                        color: "#495057",
                                    }}
                                >
                                    Cantidad: *
                                </label>
                                <input
                                    type="number"
                                    id="cantidad"
                                    name="cantidad"
                                    value={formData.cantidad}
                                    onChange={handleInputChange}
                                    style={{
                                        width: "100%",
                                        padding: "8px",
                                        borderRadius: "4px",
                                        border: "1px solid #ced4da",
                                        fontSize: "14px",
                                    }}
                                    min="1"
                                    required
                                />
                            </div>

                            {/* Motivo/Justificación */}
                            <div style={{ marginBottom: "20px" }}>
                                <label
                                    htmlFor="motivo"
                                    style={{
                                        display: "block",
                                        marginBottom: "5px",
                                        fontWeight: "500",
                                        fontSize: "14px",
                                        color: "#495057",
                                    }}
                                >
                                    Motivo/Justificación:
                                </label>
                                <textarea
                                    id="motivo"
                                    name="motivo"
                                    value={formData.motivo}
                                    onChange={handleInputChange}
                                    style={{
                                        width: "100%",
                                        padding: "8px",
                                        borderRadius: "4px",
                                        border: "1px solid #ced4da",
                                        fontSize: "14px",
                                    }}
                                    placeholder="Escribe el motivo de la transferencia"
                                />
                            </div>

                            {/* Botones de acción */}
                            <div
                                style={{
                                    marginTop: "30px",
                                    display: "flex",
                                    gap: "10px",
                                    justifyContent: "flex-end",
                                }}
                            >
                                <button
                                    type="submit"
                                    style={{
                                        backgroundColor: "#2c3e50",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        padding: "10px 16px",
                                        fontSize: "16px",
                                        cursor: "pointer",
                                    }}
                                >
                                    {formData.tipoTransferencia === "pull"
                                        ? "Solicitar Transferencia"
                                        : "Registrar Transferencia"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal para Detalles de Transferencia */}
            {showDetallesModal && selectedTransferencia && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
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
                            padding: "25px",
                            width: "90%",
                            maxWidth: "700px",
                            maxHeight: "90vh",
                            overflowY: "auto",
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: "20px",
                            }}
                        >
                            <h2
                                style={{
                                    fontSize: "22px",
                                    margin: 0,
                                    color: "#2c3e50",
                                }}
                            >
                                Detalles de Transferencia
                            </h2>
                            <button
                                onClick={() => setShowDetallesModal(false)}
                                style={{
                                    backgroundColor: "transparent",
                                    border: "none",
                                    fontSize: "22px",
                                    cursor: "pointer",
                                    color: "#6c757d",
                                }}
                            >
                                &times;
                            </button>
                        </div>

                        <div style={{ marginBottom: "25px" }}>
                            <div
                                style={{
                                    display: "inline-block",
                                    backgroundColor: "#e9ecef",
                                    padding: "8px 15px",
                                    borderRadius: "4px",
                                    fontWeight: "600",
                                    marginBottom: "15px",
                                }}
                            >
                                ID:{" "}
                                {`TR-${selectedTransferencia.id
                                    .toString()
                                    .substring(
                                        selectedTransferencia.id.toString()
                                            .length - 5
                                    )}`}
                            </div>

                            <div style={{ marginBottom: "20px" }}>
                                <span
                                    style={{
                                        display: "inline-block",
                                        padding: "4px 8px",
                                        borderRadius: "4px",
                                        backgroundColor:
                                            selectedTransferencia.estado ===
                                            "Pendiente"
                                                ? "#fef3e8"
                                                : selectedTransferencia.estado ===
                                                  "Aprobada"
                                                ? "#e3f2fd"
                                                : selectedTransferencia.estado ===
                                                  "En Tránsito"
                                                ? "#fff8e1"
                                                : selectedTransferencia.estado ===
                                                  "Completada"
                                                ? "#e8f5e9"
                                                : selectedTransferencia.estado ===
                                                  "Rechazada"
                                                ? "#ffebee"
                                                : "#f5f5f5",
                                        color:
                                            selectedTransferencia.estado ===
                                            "Pendiente"
                                                ? "#e67e22"
                                                : selectedTransferencia.estado ===
                                                  "Aprobada"
                                                ? "#1976d2"
                                                : selectedTransferencia.estado ===
                                                  "En Tránsito"
                                                ? "#f57f17"
                                                : selectedTransferencia.estado ===
                                                  "Completada"
                                                ? "#2e7d32"
                                                : selectedTransferencia.estado ===
                                                  "Rechazada"
                                                ? "#c62828"
                                                : "#757575",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                    }}
                                >
                                    Estado: {selectedTransferencia.estado}
                                </span>
                            </div>

                            <h3
                                style={{
                                    fontSize: "16px",
                                    color: "#6c757d",
                                    margin: "0 0 10px 0",
                                }}
                            >
                                Información General
                            </h3>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                        "repeat(auto-fill, minmax(300px, 1fr))",
                                    gap: "15px",
                                    marginBottom: "20px",
                                }}
                            >
                                <div>
                                    <p
                                        style={{
                                            margin: "0 0 5px 0",
                                            fontWeight: "600",
                                            color: "#495057",
                                        }}
                                    >
                                        Tipo de Transferencia:
                                    </p>
                                    <p style={{ margin: 0, color: "#212529" }}>
                                        {selectedTransferencia.tipoTransferencia ===
                                        "pull"
                                            ? "Pull (Destino solicita a Origen)"
                                            : "Push (Origen envía a Destino)"}
                                    </p>
                                </div>
                                <div>
                                    <p
                                        style={{
                                            margin: "0 0 5px 0",
                                            fontWeight: "600",
                                            color: "#495057",
                                        }}
                                    >
                                        Fecha de Solicitud:
                                    </p>
                                    <p style={{ margin: 0, color: "#212529" }}>
                                        {selectedTransferencia.fechaSolicitud}
                                    </p>
                                </div>
                                <div>
                                    <p
                                        style={{
                                            margin: "0 0 5px 0",
                                            fontWeight: "600",
                                            color: "#495057",
                                        }}
                                    >
                                        Última Actualización:
                                    </p>
                                    <p style={{ margin: 0, color: "#212529" }}>
                                        {
                                            selectedTransferencia.ultimaActualizacion
                                        }
                                    </p>
                                </div>
                                <div>
                                    <p
                                        style={{
                                            margin: "0 0 5px 0",
                                            fontWeight: "600",
                                            color: "#495057",
                                        }}
                                    >
                                        Solicitado Por:
                                    </p>
                                    <p style={{ margin: 0, color: "#212529" }}>
                                        {selectedTransferencia.solicitadoPor}
                                    </p>
                                </div>
                            </div>

                            <h3
                                style={{
                                    fontSize: "16px",
                                    color: "#6c757d",
                                    margin: "0 0 10px 0",
                                }}
                            >
                                Detalles de la Transferencia
                            </h3>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                        "repeat(auto-fill, minmax(300px, 1fr))",
                                    gap: "15px",
                                    marginBottom: "20px",
                                }}
                            >
                                <div>
                                    <p
                                        style={{
                                            margin: "0 0 5px 0",
                                            fontWeight: "600",
                                            color: "#495057",
                                        }}
                                    >
                                        Producto:
                                    </p>
                                    <p style={{ margin: 0, color: "#212529" }}>
                                        {selectedTransferencia.producto}
                                    </p>
                                </div>
                                <div>
                                    <p
                                        style={{
                                            margin: "0 0 5px 0",
                                            fontWeight: "600",
                                            color: "#495057",
                                        }}
                                    >
                                        Cantidad:
                                    </p>
                                    <p
                                        style={{
                                            margin: 0,
                                            color: "#212529",
                                            fontWeight: "700",
                                        }}
                                    >
                                        {selectedTransferencia.cantidad}
                                    </p>
                                </div>
                                <div>
                                    <p
                                        style={{
                                            margin: "0 0 5px 0",
                                            fontWeight: "600",
                                            color: "#495057",
                                        }}
                                    >
                                        Sede Origen:
                                    </p>
                                    <p style={{ margin: 0, color: "#212529" }}>
                                        {selectedTransferencia.sedeOrigen}
                                    </p>
                                </div>
                                <div>
                                    <p
                                        style={{
                                            margin: "0 0 5px 0",
                                            fontWeight: "600",
                                            color: "#495057",
                                        }}
                                    >
                                        Sede Destino:
                                    </p>
                                    <p style={{ margin: 0, color: "#212529" }}>
                                        {selectedTransferencia.sedeDestino}
                                    </p>
                                </div>
                            </div>

                            {selectedTransferencia.motivo && (
                                <div style={{ marginBottom: "20px" }}>
                                    <h3
                                        style={{
                                            fontSize: "16px",
                                            color: "#6c757d",
                                            margin: "0 0 10px 0",
                                        }}
                                    >
                                        Motivo/Justificación
                                    </h3>
                                    <div
                                        style={{
                                            backgroundColor: "#f8f9fa",
                                            padding: "15px",
                                            borderRadius: "4px",
                                            color: "#212529",
                                            borderLeft: "4px solid #6c757d",
                                        }}
                                    >
                                        {selectedTransferencia.motivo}
                                    </div>
                                </div>
                            )}

                            {/* Acciones según estado */}
                            <div
                                style={{
                                    marginTop: "30px",
                                    display: "flex",
                                    gap: "10px",
                                    justifyContent: "flex-end",
                                }}
                            >
                                <button
                                    onClick={() => setShowDetallesModal(false)}
                                    style={{
                                        backgroundColor: "#6c757d",
                                        color: "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        padding: "10px 16px",
                                        fontSize: "16px",
                                        cursor: "pointer",
                                    }}
                                >
                                    Cerrar
                                </button>

                                {selectedTransferencia.estado ===
                                    "Pendiente" && (
                                    <>
                                        <button
                                            onClick={() => {
                                                cambiarEstado(
                                                    selectedTransferencia.id,
                                                    "Aprobada"
                                                );
                                                setShowDetallesModal(false);
                                            }}
                                            style={{
                                                backgroundColor: "#1976d2",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "4px",
                                                padding: "10px 16px",
                                                fontSize: "16px",
                                                cursor: "pointer",
                                            }}
                                        >
                                            Aprobar
                                        </button>
                                        <button
                                            onClick={() => {
                                                cambiarEstado(
                                                    selectedTransferencia.id,
                                                    "Rechazada"
                                                );
                                                setShowDetallesModal(false);
                                            }}
                                            style={{
                                                backgroundColor: "#c62828",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "4px",
                                                padding: "10px 16px",
                                                fontSize: "16px",
                                                cursor: "pointer",
                                            }}
                                        >
                                            Rechazar
                                        </button>
                                    </>
                                )}

                                {selectedTransferencia.estado ===
                                    "Aprobada" && (
                                    <button
                                        onClick={() => {
                                            cambiarEstado(
                                                selectedTransferencia.id,
                                                "En Tránsito"
                                            );
                                            setShowDetallesModal(false);
                                        }}
                                        style={{
                                            backgroundColor: "#f57f17",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "4px",
                                            padding: "10px 16px",
                                            fontSize: "16px",
                                            cursor: "pointer",
                                        }}
                                    >
                                        Marcar Enviada
                                    </button>
                                )}

                                {selectedTransferencia.estado ===
                                    "En Tránsito" && (
                                    <button
                                        onClick={() => {
                                            cambiarEstado(
                                                selectedTransferencia.id,
                                                "Completada"
                                            );
                                            setShowDetallesModal(false);
                                        }}
                                        style={{
                                            backgroundColor: "#2e7d32",
                                            color: "white",
                                            border: "none",
                                            borderRadius: "4px",
                                            padding: "10px 16px",
                                            fontSize: "16px",
                                            cursor: "pointer",
                                        }}
                                    >
                                        Marcar Recibida
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransferenciasInternasPage;
