import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import API_CONFIG from "../config/api";

const AgregarComponentesPage = () => {
    const { authToken } = useAuth();
    const [activeTab, setActiveTab] = useState("sede");

    // Estado para formulario de sede
    const [sedeForm, setSedeForm] = useState({
        name: "",
        address: "",
    });

    // Estado para formulario de caja
    const [cajaForm, setCajaForm] = useState({
        location: "",
    });

    // Estados generales
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");
    const [sedes, setSedes] = useState([]);
    const [touched, setTouched] = useState({});

    // Cargar sedes disponibles para el formulario de caja
    React.useEffect(() => {
        if (activeTab === "caja") {
            loadSedes();
        }
    }, [activeTab]);

    const loadSedes = async () => {
        try {
            const response = await fetch(
                `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOCATIONS}`,
                {
                    headers: {
                        Authorization: `Token ${authToken}`,
                        "Content-Type": "application/json",
                    },
                }
            );
            if (response.ok) {
                const data = await response.json();
                const sedesOnly = data.results
                    ? data.results.filter((sede) => sede.type === "sede")
                    : data.filter((sede) => sede.type === "sede");
                setSedes(sedesOnly);
            }
        } catch (err) {
            console.error("Error cargando sedes:", err);
        }
    };

    const handleSedeChange = (e) => {
        const { name, value } = e.target;
        setSedeForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleCajaChange = (e) => {
        const { name, value } = e.target;
        setCajaForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleBlur = (e) => {
        const { name } = e.target;
        setTouched((prev) => ({ ...prev, [name]: true }));
    };

    const validateSedeForm = () => {
        return {
            name: sedeForm.name.trim().length < 2,
        };
    };

    const validateCajaForm = () => {
        return {
            location: !cajaForm.location,
        };
    };

    const sedeErrors = validateSedeForm();
    const cajaErrors = validateCajaForm();
    const sedeIsValid = Object.values(sedeErrors).every((v) => v === false);
    const cajaIsValid = Object.values(cajaErrors).every((v) => v === false);

    const handleSedeSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch(
                `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOCATIONS}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Token ${authToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        name: sedeForm.name.trim(),
                        type: "sede",
                        address: sedeForm.address.trim(),
                    }),
                }
            );

            if (response.ok) {
                const newSede = await response.json();
                setSuccess(`Sede "${newSede.name}" creada exitosamente.`);
                setSedeForm({ name: "", address: "" });
                setTouched({});
                loadSedes(); // Recargar lista de sedes
            } else {
                const errorData = await response.json();
                const errorMessage = errorData.name
                    ? `Error en el nombre: ${errorData.name.join(", ")}`
                    : errorData.detail || "Error al crear la sede";
                setError(errorMessage);
            }
        } catch (err) {
            setError("Error de conexión. Por favor, inténtalo de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    const handleCajaSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch(
                `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CASHES}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Token ${authToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        location: parseInt(cajaForm.location),
                    }),
                }
            );

            if (response.ok) {
                const newCaja = await response.json();
                setSuccess(
                    `Caja creada exitosamente para la sede "${newCaja.location_name}".`
                );
                setCajaForm({ location: "" });
                setTouched({});
            } else {
                const errorData = await response.json();
                const errorMessage = errorData.location
                    ? `Error en la sede: ${errorData.location.join(", ")}`
                    : errorData.detail || "Error al crear la caja";
                setError(errorMessage);
            }
        } catch (err) {
            setError("Error de conexión. Por favor, inténtalo de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "80vh",
                padding: "40px 20px",
                background: "#f4f6fb",
            }}
        >
            <div
                style={{
                    background: "#fff",
                    borderRadius: 16,
                    boxShadow: "0 8px 32px rgba(44, 62, 80, 0.12)",
                    padding: "40px",
                    maxWidth: 800,
                    width: "100%",
                    margin: "0 auto",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        textAlign: "center",
                        marginBottom: 40,
                        borderBottom: "2px solid #ecf0f1",
                        paddingBottom: 24,
                    }}
                >
                    <h1
                        style={{
                            color: "#2c3e50",
                            fontWeight: 800,
                            fontSize: 32,
                            margin: "0 0 8px 0",
                            letterSpacing: "-0.5px",
                        }}
                    >
                        Agregar Componentes
                    </h1>
                    <p
                        style={{
                            color: "#7f8c8d",
                            fontSize: 16,
                            margin: 0,
                            fontWeight: 500,
                        }}
                    >
                        Gestiona sedes y cajas del sistema
                    </p>
                </div>

                {/* Tabs */}
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        marginBottom: 40,
                        background: "#f8fafc",
                        padding: "8px",
                        borderRadius: 12,
                        border: "1px solid #ecf0f1",
                        maxWidth: 400,
                        margin: "0 auto 40px auto",
                    }}
                >
                    <button
                        onClick={() => setActiveTab("sede")}
                        style={{
                            flex: 1,
                            padding: "16px 20px",
                            background:
                                activeTab === "sede"
                                    ? "#2c3e50"
                                    : "transparent",
                            color: activeTab === "sede" ? "#fff" : "#2c3e50",
                            border: "none",
                            borderRadius: 8,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            fontSize: 15,
                            boxShadow:
                                activeTab === "sede"
                                    ? "0 4px 12px rgba(44,62,80,0.15)"
                                    : "none",
                        }}
                    >
                        🏢 Crear Sede
                    </button>
                    <button
                        onClick={() => setActiveTab("caja")}
                        style={{
                            flex: 1,
                            padding: "16px 20px",
                            background:
                                activeTab === "caja"
                                    ? "#27ae60"
                                    : "transparent",
                            color: activeTab === "caja" ? "#fff" : "#27ae60",
                            border: "none",
                            borderRadius: 8,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            fontSize: 15,
                            boxShadow:
                                activeTab === "caja"
                                    ? "0 4px 12px rgba(39,174,96,0.15)"
                                    : "none",
                        }}
                    >
                        💰 Crear Caja
                    </button>
                </div>

                {/* Mensajes de estado */}
                {success && (
                    <div
                        style={{
                            background: "#d4edda",
                            color: "#155724",
                            padding: "16px",
                            borderRadius: 8,
                            marginBottom: 24,
                            border: "1px solid #c3e6cb",
                            textAlign: "center",
                            fontWeight: 600,
                        }}
                    >
                        ✅ {success}
                    </div>
                )}

                {error && (
                    <div
                        style={{
                            background: "#f8d7da",
                            color: "#721c24",
                            padding: "16px",
                            borderRadius: 8,
                            marginBottom: 24,
                            border: "1px solid #f5c6cb",
                            textAlign: "center",
                            fontWeight: 600,
                        }}
                    >
                        ❌ {error}
                    </div>
                )}

                {/* Contenido dinámico */}
                <div
                    style={{
                        minHeight: 400,
                        background: "#fafbfc",
                        borderRadius: 12,
                        padding: "32px",
                        border: "1px solid #ecf0f1",
                    }}
                >
                    {activeTab === "sede" ? (
                        /* Formulario de Sede */
                        <div style={{ maxWidth: 500, margin: "0 auto" }}>
                            <div
                                style={{
                                    textAlign: "center",
                                    marginBottom: 32,
                                }}
                            >
                                <h2
                                    style={{
                                        color: "#2c3e50",
                                        fontWeight: 700,
                                        fontSize: 24,
                                        margin: "0 0 8px 0",
                                    }}
                                >
                                    Crear Nueva Sede
                                </h2>
                                <p
                                    style={{
                                        color: "#7f8c8d",
                                        fontSize: 16,
                                        margin: 0,
                                    }}
                                >
                                    Agrega una nueva sede al sistema
                                </p>
                            </div>

                            <form onSubmit={handleSedeSubmit} noValidate>
                                <div style={{ marginBottom: 24 }}>
                                    <label
                                        htmlFor="name"
                                        style={{
                                            fontWeight: 600,
                                            color: "#34495e",
                                            display: "block",
                                            marginBottom: 8,
                                            fontSize: 15,
                                        }}
                                    >
                                        Nombre de la sede
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={sedeForm.name}
                                        onChange={handleSedeChange}
                                        onBlur={handleBlur}
                                        required
                                        style={{
                                            width: "100%",
                                            padding: "14px 16px",
                                            border:
                                                sedeErrors.name && touched.name
                                                    ? "2px solid #e74c3c"
                                                    : "2px solid #e1e8ed",
                                            borderRadius: 8,
                                            fontSize: 16,
                                            outline: "none",
                                            background:
                                                sedeErrors.name && touched.name
                                                    ? "#fff6f6"
                                                    : "#fff",
                                            transition: "all 0.3s ease",
                                            boxSizing: "border-box",
                                        }}
                                        minLength={2}
                                        autoComplete="off"
                                        disabled={loading}
                                        placeholder="Ej: Sede Norte"
                                    />
                                    {touched.name && sedeErrors.name && (
                                        <div
                                            style={{
                                                color: "#e74c3c",
                                                fontSize: 14,
                                                marginTop: 6,
                                                fontWeight: 500,
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 6,
                                            }}
                                        >
                                            ⚠️ El nombre debe tener al menos 2
                                            caracteres.
                                        </div>
                                    )}
                                </div>

                                <div style={{ marginBottom: 32 }}>
                                    <label
                                        htmlFor="address"
                                        style={{
                                            fontWeight: 600,
                                            color: "#34495e",
                                            display: "block",
                                            marginBottom: 8,
                                            fontSize: 15,
                                        }}
                                    >
                                        Dirección (opcional)
                                    </label>
                                    <input
                                        type="text"
                                        id="address"
                                        name="address"
                                        value={sedeForm.address}
                                        onChange={handleSedeChange}
                                        onBlur={handleBlur}
                                        style={{
                                            width: "100%",
                                            padding: "14px 16px",
                                            border: "2px solid #e1e8ed",
                                            borderRadius: 8,
                                            fontSize: 16,
                                            outline: "none",
                                            background: "#fff",
                                            transition: "all 0.3s ease",
                                            boxSizing: "border-box",
                                        }}
                                        autoComplete="off"
                                        disabled={loading}
                                        placeholder="Ej: Av. Principal 123, Ciudad"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={!sedeIsValid || loading}
                                    style={{
                                        width: "100%",
                                        padding: "16px 0",
                                        background:
                                            sedeIsValid && !loading
                                                ? "#2c3e50"
                                                : "#bdc3c7",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: 8,
                                        fontWeight: 700,
                                        fontSize: 16,
                                        cursor:
                                            sedeIsValid && !loading
                                                ? "pointer"
                                                : "not-allowed",
                                        boxShadow:
                                            sedeIsValid && !loading
                                                ? "0 4px 16px rgba(44,62,80,0.2)"
                                                : "none",
                                        transition: "all 0.3s ease",
                                        letterSpacing: "0.5px",
                                    }}
                                >
                                    {loading
                                        ? "🔄 Creando..."
                                        : "🏢 Crear Sede"}
                                </button>
                            </form>
                        </div>
                    ) : (
                        /* Formulario de Caja */
                        <div style={{ maxWidth: 500, margin: "0 auto" }}>
                            <div
                                style={{
                                    textAlign: "center",
                                    marginBottom: 32,
                                }}
                            >
                                <h2
                                    style={{
                                        color: "#2c3e50",
                                        fontWeight: 700,
                                        fontSize: 24,
                                        margin: "0 0 8px 0",
                                    }}
                                >
                                    Crear Nueva Caja
                                </h2>
                                <p
                                    style={{
                                        color: "#7f8c8d",
                                        fontSize: 16,
                                        margin: 0,
                                    }}
                                >
                                    Asigna una caja de efectivo a una sede
                                    existente
                                </p>
                            </div>

                            <form onSubmit={handleCajaSubmit} noValidate>
                                <div style={{ marginBottom: 32 }}>
                                    <label
                                        htmlFor="location"
                                        style={{
                                            fontWeight: 600,
                                            color: "#34495e",
                                            display: "block",
                                            marginBottom: 8,
                                            fontSize: 15,
                                        }}
                                    >
                                        Seleccionar Sede
                                    </label>
                                    <select
                                        id="location"
                                        name="location"
                                        value={cajaForm.location}
                                        onChange={handleCajaChange}
                                        onBlur={handleBlur}
                                        required
                                        style={{
                                            width: "100%",
                                            padding: "14px 16px",
                                            border:
                                                cajaErrors.location &&
                                                touched.location
                                                    ? "2px solid #e74c3c"
                                                    : "2px solid #e1e8ed",
                                            borderRadius: 8,
                                            fontSize: 16,
                                            outline: "none",
                                            background:
                                                cajaErrors.location &&
                                                touched.location
                                                    ? "#fff6f6"
                                                    : "#fff",
                                            transition: "all 0.3s ease",
                                            boxSizing: "border-box",
                                            cursor: "pointer",
                                        }}
                                        disabled={loading}
                                    >
                                        <option value="">
                                            Selecciona una sede
                                        </option>
                                        {sedes.map((sede) => (
                                            <option
                                                key={sede.id}
                                                value={sede.id}
                                            >
                                                {sede.name} -{" "}
                                                {sede.address ||
                                                    "Sin dirección"}
                                            </option>
                                        ))}
                                    </select>
                                    {touched.location &&
                                        cajaErrors.location && (
                                            <div
                                                style={{
                                                    color: "#e74c3c",
                                                    fontSize: 14,
                                                    marginTop: 6,
                                                    fontWeight: 500,
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 6,
                                                }}
                                            >
                                                ⚠️ Debes seleccionar una sede.
                                            </div>
                                        )}
                                </div>

                                <div
                                    style={{
                                        background: "#fff3cd",
                                        border: "1px solid #ffeaa7",
                                        borderRadius: 12,
                                        padding: "20px",
                                        marginBottom: 32,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: 12,
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: 20,
                                                marginTop: 2,
                                            }}
                                        >
                                            ℹ️
                                        </div>
                                        <div>
                                            <h4
                                                style={{
                                                    color: "#856404",
                                                    fontWeight: 600,
                                                    margin: "0 0 8px 0",
                                                    fontSize: 16,
                                                }}
                                            >
                                                Información importante
                                            </h4>
                                            <ul
                                                style={{
                                                    color: "#856404",
                                                    fontSize: 14,
                                                    margin: 0,
                                                    lineHeight: 1.5,
                                                    paddingLeft: "20px",
                                                }}
                                            >
                                                <li>
                                                    Cada sede solo puede tener
                                                    una caja
                                                </li>
                                                <li>
                                                    La caja se creará con saldo
                                                    inicial de $0.00
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={!cajaIsValid || loading}
                                    style={{
                                        width: "100%",
                                        padding: "16px 0",
                                        background:
                                            cajaIsValid && !loading
                                                ? "#27ae60"
                                                : "#bdc3c7",
                                        color: "#fff",
                                        border: "none",
                                        borderRadius: 8,
                                        fontWeight: 700,
                                        fontSize: 16,
                                        cursor:
                                            cajaIsValid && !loading
                                                ? "pointer"
                                                : "not-allowed",
                                        boxShadow:
                                            cajaIsValid && !loading
                                                ? "0 4px 16px rgba(39,174,96,0.2)"
                                                : "none",
                                        transition: "all 0.3s ease",
                                        letterSpacing: "0.5px",
                                    }}
                                >
                                    {loading
                                        ? "🔄 Creando..."
                                        : "💰 Crear Caja"}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AgregarComponentesPage;
