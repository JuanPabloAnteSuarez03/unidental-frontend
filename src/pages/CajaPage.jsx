import React, { useEffect, useState } from "react";
import ProductSearchSelector from "../components/Common/ProductSearchSelector";
import LoadingSpinner from "../components/Common/LoadingSpinner";
import {
    createInventoryMovement,
    getLocations,
} from "../services/inventoryService";
import { useNavigate } from "react-router-dom";
import API_CONFIG from "../config/api";

// Agregar estilos CSS para la animación de carga
const spinKeyframes = `
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
`;

// Inyectar los estilos en el head si no existen
if (!document.querySelector("#spin-animation-styles")) {
    const style = document.createElement("style");
    style.id = "spin-animation-styles";
    style.textContent = spinKeyframes;
    document.head.appendChild(style);
}

const API_URL = `${API_CONFIG.BASE_URL}/cash`;

const fetchWithAuth = (url, options = {}) => {
    const token = localStorage.getItem("authToken") || "";
    return fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
            ...(options.headers || {}),
        },
    });
};

// Paleta de colores coherente y profesional
const colors = {
    primary: "#3f51b5", // Azul principal (como alertas)
    secondary: "#5c6bc0", // Azul secundario
    success: "#4caf50", // Verde para valores positivos
    warning: "#ff9800", // Naranja para advertencias
    danger: "#f44336", // Rojo para valores negativos
    info: "#2196f3", // Azul claro para información
    light: "#f5f5f5", // Gris claro
    dark: "#333", // Gris oscuro
    white: "#fff", // Blanco
    border: "#e0e0e0", // Borde gris
    text: "#333", // Texto principal
    textSecondary: "#666", // Texto secundario
};

const cardStyle = {
    background: colors.white,
    borderRadius: 16,
    boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
    padding: "24px",
    marginBottom: 24,
    border: "1px solid #f0f0f0",
    transition: "all 0.3s ease",
    position: "relative",
    overflow: "hidden",
};

const sectionTitle = {
    margin: "0 0 16px 0",
    color: colors.text,
    fontWeight: 700,
    fontSize: 22,
};

const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    marginBottom: 12,
};

const thStyle = {
    background: "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
    color: colors.white,
    fontWeight: 600,
    padding: "16px 12px",
    borderBottom: "1px solid #e9ecef",
    textAlign: "center",
    fontSize: "14px",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
};

const tdStyle = {
    padding: "16px 12px",
    borderBottom: "1px solid #e9ecef",
    fontSize: 14,
    color: colors.textSecondary,
};

const btnStyle = {
    background: colors.primary,
    color: colors.white,
    border: "none",
    borderRadius: 8,
    padding: "12px 24px",
    margin: "0 4px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    transition: "all 0.3s ease",
    boxShadow: "0 2px 8px rgba(63,81,181,0.3)",
};

const inputStyle = {
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: "12px 16px",
    margin: "4px 0 12px 0",
    width: "100%",
    fontSize: 14,
    transition: "border-color 0.3s ease",
};

const labelStyle = {
    display: "block",
    marginBottom: 8,
    fontWeight: 600,
    color: colors.text,
    fontSize: 14,
};

const selectStyle = { ...inputStyle };

const mainContainerStyle = {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "32px 16px 48px 16px",
    background: colors.light,
    minHeight: "100vh",
};

const flexRow = {
    display: "flex",
    gap: 32,
    flexWrap: "wrap",
    alignItems: "flex-start",
    justifyContent: "space-between",
};

const cardMain = {
    ...cardStyle,
    maxWidth: 600,
    margin: "0 auto 32px auto",
    boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
    border: "1px solid #f0f0f0",
    background: colors.white,
    marginBottom: 40,
    padding: 36,
    minWidth: 340,
    flex: 1,
    position: "relative",
};
const cardTable = {
    ...cardStyle,
    border: "2px solid #2980b9",
    background: "linear-gradient(135deg, #fafdff 60%, #e3f0ff 100%)",
    boxShadow:
        "0 8px 36px rgba(41,128,185,0.15), 0 2px 12px rgba(44,62,80,0.08)",
    padding: 36,
    minWidth: 420,
    flex: 2,
    overflowX: "auto",
    position: "relative",
};
const h1Style = {
    color: "#1a2a36",
    marginBottom: 24,
    fontWeight: 900,
    fontSize: 38,
    letterSpacing: 1.2,
    textAlign: "left",
};
const sectionTitleMain = {
    ...sectionTitle,
    color: "#27ae60",
    fontSize: 28,
    marginBottom: 18,
};
const sectionTitleTable = {
    ...sectionTitle,
    color: "#2980b9",
    fontSize: 24,
    marginBottom: 18,
};

const CajaPage = () => {
    const [summary, setSummary] = useState(null);
    const [cashes, setCashes] = useState([]);
    const [selectedCash, setSelectedCash] = useState(null);
    const [movements, setMovements] = useState([]);
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Para crear movimientos/transferencias
    const [newMovement, setNewMovement] = useState({
        cash: "",
        movement_type: "ingreso",
        amount: "",
        reference_type: "ajuste_manual",
        notes: "",
    });
    const [newTransfer, setNewTransfer] = useState({
        origin_cash: "",
        destination_cash: "",
        amount: "",
        notes: "",
    });
    const [actionMsg, setActionMsg] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showTransfer, setShowTransfer] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showCreateMovement, setShowCreateMovement] = useState(false);

    // Estado para el proceso de envío de movimientos (add this near other useState declarations)
    const [isCreatingMovement, setIsCreatingMovement] = useState(false);
    const [isCreatingAdjustment, setIsCreatingAdjustment] = useState(false);

    // Estado específico para carga de movimientos durante paginación
    const [loadingMovements, setLoadingMovements] = useState(false);

    const navigate = useNavigate();

    // Función para recargar datos de cajas
    const refreshCashData = async () => {
        try {
            const [summaryRes, cashesRes] = await Promise.all([
                fetchWithAuth(`${API_URL}/cashes/summary/`),
                fetchWithAuth(`${API_URL}/cashes/`),
            ]);

            if (summaryRes.ok && cashesRes.ok) {
                const [summaryData, cashesData] = await Promise.all([
                    summaryRes.json(),
                    cashesRes.json(),
                ]);

                setSummary(summaryData);
                setCashes(cashesData.results || cashesData);
            }
        } catch (error) {
            console.error("Error actualizando datos de cajas:", error);
        }
    };

    // Función para reiniciar todos los campos del formulario
    const resetMovementForm = () => {
        setNewMovement({
            cash: "",
            movement_type: "ingreso",
            amount: "",
            reference_type: "ajuste_manual",
            notes: "",
        });
        setSelectedProduct(null);
    };

    // Función para reiniciar el formulario de transferencias
    const resetTransferForm = () => {
        setNewTransfer({
            origin_cash: "",
            destination_cash: "",
            amount: "",
            notes: "",
        });
    };

    // Función específica para cargar movimientos con paginación
    const loadMovements = async (page = currentPage) => {
        console.log(`🔄 Iniciando carga de movimientos para página ${page}`);
        setLoadingMovements(true);
        try {
            const url = `${API_URL}/movements/?ordering=-created_at&limit=25&page=${page}`;
            console.log(`📡 Requesting: ${url}`);

            const response = await fetchWithAuth(url);

            if (!response.ok) {
                throw new Error(
                    `Error en movements: ${response.status} ${response.statusText}`
                );
            }

            const movementsData = await response.json();
            console.log(`📊 Datos recibidos:`, {
                results: movementsData.results?.length || 0,
                total_pages: movementsData.total_pages,
                count: movementsData.count,
            });

            setMovements(movementsData.results || movementsData);
            setTotalPages(
                movementsData.total_pages ||
                    movementsData.totalPages ||
                    Math.ceil((movementsData.count || 25) / 25)
            );

            console.log(
                `✅ Movimientos página ${page} cargados exitosamente - ${
                    (movementsData.results || movementsData).length
                } elementos`
            );
        } catch (error) {
            console.error(
                `❌ Error cargando movimientos página ${page}:`,
                error
            );
            setError(`Error cargando movimientos: ${error.message}`);
        } finally {
            setLoadingMovements(false);
        }
    };

    // Función mejorada para manejar cambio de página
    const handlePageChange = (newPage) => {
        if (newPage !== currentPage && !loadingMovements) {
            console.log(`📄 Cambiando de página ${currentPage} a ${newPage}`);
            setCurrentPage(newPage);
        } else {
            console.log(
                `⚠️ No se puede cambiar página. newPage=${newPage}, currentPage=${currentPage}, loadingMovements=${loadingMovements}`
            );
        }
    };

    // Cargar resumen, cajas, movimientos y transferencias
    useEffect(() => {
        setLoading(true);
        setError("");

        console.log("🔄 Cargando datos de caja desde:", API_URL);

        Promise.all([
            fetchWithAuth(`${API_URL}/cashes/summary/`).then((r) => {
                if (!r.ok) {
                    throw new Error(
                        `Error en summary: ${r.status} ${r.statusText}`
                    );
                }
                return r.json();
            }),
            fetchWithAuth(`${API_URL}/cashes/`).then((r) => {
                if (!r.ok) {
                    throw new Error(
                        `Error en cashes: ${r.status} ${r.statusText}`
                    );
                }
                return r.json();
            }),
            fetchWithAuth(
                `${API_URL}/transfers/?ordering=-created_at&limit=10`
            ).then((r) => {
                if (!r.ok) {
                    throw new Error(
                        `Error en transfers: ${r.status} ${r.statusText}`
                    );
                }
                return r.json();
            }),
        ])
            .then(([summary, cashes, transfers]) => {
                console.log("✅ Datos de caja cargados exitosamente:", {
                    summary: summary ? "OK" : "NULL",
                    cashes: cashes ? (cashes.results || cashes).length : 0,
                    transfers: transfers
                        ? (transfers.results || transfers).length
                        : 0,
                });

                setSummary(summary);
                setCashes(cashes.results || cashes);
                setTransfers(transfers.results || transfers);
                setError("");
                // Marcar que la carga inicial se completó exitosamente
                setInitialLoadDone(true);
            })
            .catch((e) => {
                console.error("❌ Error cargando datos de caja:", e);
                setError(`Error cargando datos de caja: ${e.message}`);
            })
            .finally(() => setLoading(false));
    }, [actionMsg]);

    // Estado para rastrear si ya se hizo la carga inicial
    const [initialLoadDone, setInitialLoadDone] = useState(false);

    // useEffect unificado para manejar carga de movimientos
    useEffect(() => {
        if (initialLoadDone && !loadingMovements) {
            console.log(`🔄 Cargando página ${currentPage} de movimientos`);
            loadMovements(currentPage);
        }
    }, [currentPage, initialLoadDone]);

    // Handlers para crear movimientos y transferencias
    const handleCreateMovement = async (e) => {
        e.preventDefault();
        setActionMsg("");
        const token = localStorage.getItem("authToken");

        // Validación para egresos y compras - verificar saldo suficiente
        if (
            newMovement.movement_type === "egreso" ||
            newMovement.movement_type === "compra"
        ) {
            const caja = cashes.find(
                (c) => String(c.id) === String(newMovement.cash)
            );

            if (!caja) {
                setActionMsg("Debes seleccionar una caja válida");
                return;
            }

            const saldoDisponible = parseFloat(caja.balance);
            const montoSolicitado = parseFloat(newMovement.amount);

            if (isNaN(montoSolicitado) || montoSolicitado <= 0) {
                setActionMsg("Debes ingresar un monto válido mayor a cero");
                return;
            }

            if (montoSolicitado > saldoDisponible) {
                setActionMsg(
                    `❌ Saldo insuficiente. Disponible: $${saldoDisponible.toLocaleString(
                        "es-CO",
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                    )}, Solicitado: $${montoSolicitado.toLocaleString("es-CO", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}`
                );
                return;
            }
        }

        try {
            if (newMovement.movement_type === "compra") {
                // 1. Buscar la caja seleccionada y su ubicación
                const caja = cashes.find(
                    (c) => String(c.id) === String(newMovement.cash)
                );
                let locationId = caja && (caja.location || caja.location_id);
                let locationName = caja && caja.location_name;
                // Si no hay id, buscar por nombre
                if (!locationId && caja && caja.location_name) {
                    const locations = await getLocations(token);
                    const loc = locations.find(
                        (l) => l.name === caja.location_name
                    );
                    if (loc) locationId = loc.id;
                }
                if (!locationId) {
                    setActionMsg(
                        "No se pudo determinar la sede de la caja seleccionada"
                    );
                    return;
                }
                if (!selectedProduct || !selectedProduct.id) {
                    setActionMsg(
                        "Debes seleccionar un producto para la compra"
                    );
                    return;
                }
                // 2. Intentar crear el movimiento de caja primero
                const purchaseAmount = parseFloat(newMovement.amount) || 0;
                let suggestedQuantity = "";

                // Si el producto tiene precio, calcular cantidad sugerida
                if (
                    selectedProduct.price &&
                    selectedProduct.price > 0 &&
                    purchaseAmount > 0
                ) {
                    const calculatedQuantity = Math.round(
                        purchaseAmount / selectedProduct.price
                    );
                    suggestedQuantity =
                        calculatedQuantity > 0
                            ? calculatedQuantity.toString()
                            : "";
                }

                // Intentar crear el movimiento de caja
                setIsCreatingMovement(true);
                setActionMsg("⏳ Creando movimiento de caja...");

                try {
                    const resp = await fetchWithAuth(`${API_URL}/movements/`, {
                        method: "POST",
                        body: JSON.stringify({
                            cash: newMovement.cash,
                            movement_type: "egreso",
                            amount: purchaseAmount,
                            reference_type: "compra",
                            notes:
                                newMovement.notes ||
                                `Compra de ${selectedProduct.name}`,
                        }),
                    });

                    if (resp.ok) {
                        const data = await resp.json();
                        console.log(
                            "✅ Movimiento de caja creado exitosamente:",
                            data
                        );
                        setActionMsg(
                            "✅ Movimiento de caja registrado exitosamente"
                        );
                    } else {
                        const errorData = await resp.json();
                        console.warn(
                            "⚠️ Error en la respuesta del movimiento de caja:",
                            errorData
                        );
                        setActionMsg(
                            "⚠️ Problema al registrar movimiento de caja, pero continuando..."
                        );
                    }
                } catch (error) {
                    console.warn(
                        "⚠️ Error al crear movimiento de caja:",
                        error.message
                    );
                    setActionMsg(
                        "⚠️ Error de conexión con caja, pero continuando con la compra..."
                    );
                } finally {
                    setIsCreatingMovement(false);
                }

                console.log("Redirigiendo a movimientos de stock con:", {
                    selectedProduct,
                    locationId,
                    locationName,
                    amount: newMovement.amount,
                    suggestedQuantity,
                    notes: newMovement.notes,
                });

                navigate("/inventario/movimientos", {
                    state: {
                        products: [
                            {
                                id: `${selectedProduct.id}-${Date.now()}`, // ID único para el componente
                                key: `${selectedProduct.id}-${Date.now()}`,
                                product: {
                                    id: selectedProduct.id,
                                    name: selectedProduct.name,
                                    sku: selectedProduct.sku,
                                    requires_batch_control:
                                        selectedProduct.requires_batch_control,
                                },
                                quantity: suggestedQuantity, // Cantidad sugerida basada en monto/precio
                                requiresBatchControl:
                                    selectedProduct.requires_batch_control
                                        ? [
                                              {
                                                  batch_number: "",
                                                  expiry_date: "",
                                                  manufacturing_date: "",
                                                  supplier_reference: "",
                                                  quantity: suggestedQuantity, // También en el lote
                                              },
                                          ]
                                        : [],
                                isValid:
                                    !selectedProduct.requires_batch_control &&
                                    suggestedQuantity !== "",
                            },
                        ],
                        location: locationId,
                        locationName: locationName,
                        movementType: "in",
                        notes:
                            newMovement.notes ||
                            `Compra desde caja ${locationName}`,
                        // Datos adicionales del movimiento de caja para referencia futura
                        cashMovementData: {
                            cash: newMovement.cash,
                            amount: parseFloat(newMovement.amount),
                            notes:
                                newMovement.notes ||
                                `Compra de ${selectedProduct.name}`,
                        },
                    },
                });

                // Limpiar formulario después del redireccionamiento exitoso
                resetMovementForm();

                // Pequeño delay para mostrar el mensaje antes de redireccionar
                setTimeout(() => {
                    setActionMsg(
                        "✅ Redirigiendo a registro de entrada de inventario..."
                    );
                }, 500);

                return;
            }
            // Lógica especial para AJUSTE: el monto será el saldo final deseado
            if (newMovement.movement_type === "ajuste") {
                // Prevenir múltiples envíos
                if (isCreatingAdjustment) {
                    setActionMsg("⏳ Ya se está procesando un ajuste...");
                    return;
                }

                setIsCreatingAdjustment(true);
                setActionMsg("⏳ Procesando ajuste...");

                // Obtener el saldo más actualizado de la caja directamente del servidor
                try {
                    const cashResponse = await fetchWithAuth(
                        `${API_URL}/cashes/`
                    );
                    const cashData = await cashResponse.json();
                    const caja = cashData.results?.find(
                        (c) => String(c.id) === String(newMovement.cash)
                    );

                    if (!caja) {
                        setActionMsg(
                            "Debes seleccionar una caja válida para el ajuste"
                        );
                        setIsCreatingAdjustment(false);
                        return;
                    }

                    const saldoActual = parseFloat(caja.balance);
                    const saldoDeseado = parseFloat(newMovement.amount);

                    if (isNaN(saldoDeseado)) {
                        setActionMsg(
                            "Debes ingresar un monto válido para el ajuste"
                        );
                        setIsCreatingAdjustment(false);
                        return;
                    }

                    const diferencia = saldoDeseado - saldoActual;

                    if (Math.abs(diferencia) < 0.01) {
                        setActionMsg(
                            `El saldo ya es $${saldoDeseado.toFixed(2)}`
                        );
                        setIsCreatingAdjustment(false);
                        return;
                    }

                    const tipoAjuste = diferencia > 0 ? "ingreso" : "egreso";

                    const response = await fetchWithAuth(
                        `${API_URL}/movements/`,
                        {
                            method: "POST",
                            body: JSON.stringify({
                                cash: newMovement.cash,
                                movement_type: tipoAjuste,
                                amount: Math.abs(diferencia),
                                reference_type: "ajuste_manual",
                                notes:
                                    newMovement.notes ||
                                    `Ajuste de saldo a ${saldoDeseado.toFixed(
                                        2
                                    )}`,
                            }),
                        }
                    );

                    const data = await response.json();

                    if (data.id) {
                        setActionMsg(
                            `✅ Ajuste realizado correctamente. Nuevo saldo: $${saldoDeseado.toFixed(
                                2
                            )}`
                        );
                        resetMovementForm();

                        // Actualizar el estado de las cajas inmediatamente
                        setCashes((prevCashes) =>
                            prevCashes.map((c) =>
                                String(c.id) === String(newMovement.cash)
                                    ? {
                                          ...c,
                                          balance: saldoDeseado.toFixed(2),
                                          balance_formatted: `$${saldoDeseado.toLocaleString(
                                              "es-CO",
                                              {
                                                  minimumFractionDigits: 2,
                                                  maximumFractionDigits: 2,
                                              }
                                          )}`,
                                      }
                                    : c
                            )
                        );

                        // Actualizar también el resumen después de un breve delay
                        setTimeout(() => {
                            refreshCashData();
                        }, 500);

                        // También recargar movimientos para mostrar el nuevo ajuste
                        setTimeout(() => {
                            fetchWithAuth(
                                `${API_URL}/movements/?ordering=-created_at&limit=25&page=${currentPage}`
                            )
                                .then((r) => {
                                    if (r.ok) {
                                        r.json().then((movementsData) => {
                                            setMovements(
                                                movementsData.results ||
                                                    movementsData
                                            );
                                        });
                                    }
                                })
                                .catch((error) => {
                                    console.error(
                                        "Error recargando movimientos:",
                                        error
                                    );
                                });
                        }, 1000);
                    } else {
                        setActionMsg(
                            data.amount ||
                                data.detail ||
                                "Error al realizar el ajuste"
                        );
                    }
                } catch (error) {
                    console.error("Error en ajuste:", error);
                    setActionMsg("Error de conexión al realizar el ajuste");
                } finally {
                    setIsCreatingAdjustment(false);
                }
                return;
            }
            // Caso normal (no compra): solo movimiento de caja
            fetchWithAuth(`${API_URL}/movements/`, {
                method: "POST",
                body: JSON.stringify({
                    ...newMovement,
                    amount: parseFloat(newMovement.amount),
                }),
            })
                .then((r) => r.json())
                .then((data) => {
                    if (data.id) {
                        setActionMsg("Movimiento creado correctamente");
                        resetMovementForm();
                    } else {
                        setActionMsg(
                            data.amount ||
                                data.detail ||
                                "Error al crear movimiento"
                        );
                    }
                })
                .catch(() => setActionMsg("Error al crear movimiento"));
        } catch (err) {
            setActionMsg("Error inesperado: " + (err.message || err));
        }
    };

    const handleCreateTransfer = (e) => {
        e.preventDefault();
        setActionMsg("");

        // Validación para transferencias - verificar saldo suficiente en caja origen
        const cajaOrigen = cashes.find(
            (c) => String(c.id) === String(newTransfer.origin_cash)
        );

        if (!cajaOrigen) {
            setActionMsg("Debes seleccionar una caja de origen válida");
            return;
        }

        const saldoDisponible = parseFloat(cajaOrigen.balance);
        const montoTransferir = parseFloat(newTransfer.amount);

        if (isNaN(montoTransferir) || montoTransferir <= 0) {
            setActionMsg("Debes ingresar un monto válido mayor a cero");
            return;
        }

        if (montoTransferir > saldoDisponible) {
            setActionMsg(
                `❌ Saldo insuficiente en caja origen. Disponible: $${saldoDisponible.toLocaleString(
                    "es-CO",
                    { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                )}, Solicitado: $${montoTransferir.toLocaleString("es-CO", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })}`
            );
            return;
        }

        if (newTransfer.origin_cash === newTransfer.destination_cash) {
            setActionMsg("❌ La caja origen y destino no pueden ser la misma");
            return;
        }

        fetchWithAuth(`${API_URL}/transfers/`, {
            method: "POST",
            body: JSON.stringify({
                ...newTransfer,
                amount: parseFloat(newTransfer.amount),
            }),
        })
            .then((r) => r.json())
            .then((data) => {
                if (data.id) {
                    setActionMsg("Transferencia creada correctamente");
                    resetTransferForm();
                } else {
                    setActionMsg(
                        data.amount ||
                            data.detail ||
                            "Error al crear transferencia"
                    );
                }
            })
            .catch(() => setActionMsg("Error al crear transferencia"));
    };

    return (
        <div style={mainContainerStyle}>
            {/* Banner superior con nueva paleta de colores */}
            <div
                style={{
                    backgroundColor: "#2c3e50",
                    borderRadius: "16px",
                    padding: "32px",
                    marginBottom: "32px",
                    boxShadow: "0 8px 32px rgba(63,81,181,0.15)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "white",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                    }}
                >
                    <div
                        style={{
                            width: "64px",
                            height: "64px",
                            backgroundColor: "rgba(255,255,255,0.15)",
                            borderRadius: "16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backdropFilter: "blur(10px)",
                            border: "1px solid rgba(255,255,255,0.2)",
                        }}
                    >
                        <svg
                            width="32"
                            height="32"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{ color: "white" }}
                        >
                            <rect
                                x="3"
                                y="7"
                                width="18"
                                height="10"
                                rx="2"
                                strokeWidth="2"
                                stroke="white"
                                fill="rgba(255,255,255,0.2)"
                            />
                            <path
                                d="M16 3v4M8 3v4M3 11h18"
                                stroke="white"
                                strokeWidth="2"
                            />
                        </svg>
                    </div>
                    <div>
                        <h1
                            style={{
                                fontSize: "36px",
                                fontWeight: "700",
                                color: "white",
                                margin: 0,
                                letterSpacing: "-0.5px",
                            }}
                        >
                            Gestión de Caja
                        </h1>
                        <p
                            style={{
                                color: "rgba(255,255,255,0.9)",
                                margin: "8px 0 0 0",
                                fontSize: "16px",
                                fontWeight: "500",
                            }}
                        >
                            Administra los movimientos y saldos de todas las
                            cajas registradas
                        </p>
                    </div>
                </div>
            </div>
            {/* Eliminado: texto "Caja" sobre las tarjetas */}
            {loading && (
                <LoadingSpinner
                    message="Cargando datos de caja..."
                    subMessage="Obteniendo saldos y movimientos"
                    size="compact"
                />
            )}
            {error && (
                <p style={{ color: "#c0392b", fontWeight: 600 }}>{error}</p>
            )}
            {summary && (
                <div
                    style={{
                        ...cardStyle,
                        background: colors.white,
                        borderLeft: `4px solid ${colors.primary}`,
                        marginBottom: 32,
                        padding: "24px",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                        overflow: "visible",
                        minWidth: 340,
                        minHeight: 80,
                        position: "relative",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 16,
                        }}
                    >
                        <h2
                            style={{
                                ...sectionTitle,
                                color: colors.primary,
                                fontSize: 22,
                                margin: 0,
                                letterSpacing: 0.5,
                            }}
                        >
                            Resumen General
                        </h2>
                        <button
                            type="button"
                            style={{
                                background: showCreateMovement
                                    ? colors.danger
                                    : colors.primary,
                                color: colors.white,
                                border: "none",
                                borderRadius: 8,
                                padding: "8px 20px",
                                fontSize: 14,
                                fontWeight: 600,
                                boxShadow: "0 2px 8px rgba(63,81,181,0.3)",
                                transition: "all 0.3s ease",
                                cursor: "pointer",
                                zIndex: 2,
                            }}
                            onClick={() => setShowCreateMovement((v) => !v)}
                        >
                            {showCreateMovement ? "Cerrar" : "Crear Movimiento"}
                        </button>
                    </div>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 24,
                            marginBottom: 4,
                        }}
                    >
                        <span
                            style={{
                                background: colors.white,
                                color: colors.primary,
                                fontWeight: 700,
                                fontSize: 20,
                                borderRadius: 16,
                                padding: "8px 20px",
                                boxShadow: "0 2px 8px rgba(63,81,181,0.2)",
                                border: `2px solid ${colors.primary}20`,
                                display: "inline-block",
                            }}
                        >
                            Saldo total: {summary.total_balance_formatted}
                        </span>
                        {/* Eliminado: badge de movimientos recientes */}
                    </div>
                </div>
            )}
            {/* Estadísticas individuales de cada caja */}
            {/* Eliminado: tarjetas individuales de cada caja y badge de movimientos */}
            {cashes && cashes.length > 0 && (
                <div style={{ marginBottom: 32 }}>
                    {/* Eliminado: saldo total duplicado */}
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            background: colors.white,
                            borderRadius: 12,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                            overflow: "hidden",
                            minWidth: 400,
                        }}
                    >
                        <thead>
                            <tr style={{ background: colors.light }}>
                                <th
                                    style={{
                                        padding: "12px 8px",
                                        textAlign: "left",
                                        color: colors.textSecondary,
                                        fontWeight: 700,
                                        fontSize: 15,
                                    }}
                                >
                                    Caja
                                </th>
                                <th
                                    style={{
                                        padding: "12px 8px",
                                        textAlign: "right",
                                        color: colors.textSecondary,
                                        fontWeight: 700,
                                        fontSize: 15,
                                    }}
                                >
                                    Saldo
                                </th>
                                <th
                                    style={{
                                        padding: "12px 8px",
                                        textAlign: "center",
                                        color: colors.textSecondary,
                                        fontWeight: 700,
                                        fontSize: 15,
                                    }}
                                >
                                    Estado
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {cashes.map((cash) => (
                                <tr
                                    key={cash.id}
                                    style={{
                                        borderBottom: "1px solid #e9ecef",
                                    }}
                                >
                                    <td
                                        style={{
                                            padding: "12px 8px",
                                            color: colors.text,
                                        }}
                                    >
                                        {cash.location_name}
                                    </td>
                                    <td
                                        style={{
                                            padding: "12px 8px",
                                            textAlign: "right",
                                            color:
                                                cash.balance >= 0
                                                    ? colors.success
                                                    : colors.danger,
                                            fontWeight: 700,
                                        }}
                                    >
                                        {/* Solo mostrar el valor, sin iconos ni símbolos */}
                                        {String(cash.balance_formatted).replace(
                                            /^[-+]/,
                                            ""
                                        )}
                                    </td>
                                    <td
                                        style={{
                                            padding: "12px 8px",
                                            textAlign: "center",
                                        }}
                                    >
                                        <span
                                            style={{
                                                display: "inline-block",
                                                padding: "4px 12px",
                                                borderRadius: 10,
                                                fontSize: 13,
                                                fontWeight: 600,
                                                background: cash.is_active
                                                    ? `${colors.success}15`
                                                    : `${colors.danger}15`,
                                                color: cash.is_active
                                                    ? colors.success
                                                    : colors.danger,
                                                border: `1.5px solid ${
                                                    cash.is_active
                                                        ? colors.success
                                                        : colors.danger
                                                }30`,
                                            }}
                                        >
                                            {cash.is_active
                                                ? "Activa"
                                                : "Inactiva"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            <div style={flexRow}>
                <div style={{ width: "100%", marginBottom: 32 }}>
                    {showCreateMovement && (
                        <div
                            style={{
                                ...cardMain,
                                maxWidth: 600,
                                margin: "0 auto 32px auto",
                                boxShadow: "0 4px 24px rgba(41,128,185,0.10)",
                                border: "2px solid #e3f0ff",
                                background: "#fafdff",
                                padding: 36,
                                position: "relative",
                            }}
                        >
                            <h2
                                style={{
                                    ...sectionTitleMain,
                                    textAlign: "center",
                                    color: "#2980b9",
                                    fontSize: 26,
                                    marginBottom: 24,
                                    letterSpacing: 0.5,
                                }}
                            >
                                Crear Movimiento de Caja
                            </h2>
                            {actionMsg && (
                                <div
                                    style={{
                                        background: actionMsg
                                            .toLowerCase()
                                            .includes("error")
                                            ? `${colors.danger}15`
                                            : `${colors.success}15`,
                                        color: actionMsg
                                            .toLowerCase()
                                            .includes("error")
                                            ? colors.danger
                                            : colors.success,
                                        border: `1.5px solid ${
                                            actionMsg
                                                .toLowerCase()
                                                .includes("error")
                                                ? `${colors.danger}30`
                                                : `${colors.success}30`
                                        }`,
                                        borderRadius: 8,
                                        padding: "12px 16px",
                                        marginBottom: 18,
                                        fontWeight: 600,
                                        textAlign: "center",
                                        fontSize: 14,
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                                    }}
                                >
                                    {actionMsg}
                                </div>
                            )}
                            <form
                                onSubmit={handleCreateMovement}
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: 20,
                                    alignItems: "end",
                                    marginBottom: 0,
                                }}
                            >
                                <div style={{ gridColumn: "1/2" }}>
                                    <label
                                        style={{
                                            ...labelStyle,
                                            marginBottom: 4,
                                        }}
                                    >
                                        Caja
                                    </label>
                                    <select
                                        style={{
                                            ...selectStyle,
                                            fontWeight: 600,
                                            background: `${colors.primary}05`,
                                            width: "100%",
                                            borderColor: colors.border,
                                        }}
                                        value={newMovement.cash}
                                        onChange={(e) =>
                                            setNewMovement({
                                                ...newMovement,
                                                cash: e.target.value,
                                            })
                                        }
                                        required
                                    >
                                        <option value="">
                                            Selecciona una caja
                                        </option>
                                        {cashes.map((cash) => (
                                            <option
                                                key={cash.id}
                                                value={cash.id}
                                            >
                                                {cash.location_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ gridColumn: "2/3" }}>
                                    <label
                                        style={{
                                            ...labelStyle,
                                            marginBottom: 4,
                                        }}
                                    >
                                        Tipo
                                    </label>
                                    <select
                                        style={{
                                            ...selectStyle,
                                            fontWeight: 600,
                                            background: `${colors.primary}05`,
                                            width: "100%",
                                            borderColor: colors.border,
                                        }}
                                        value={newMovement.movement_type}
                                        onChange={(e) => {
                                            setNewMovement({
                                                ...newMovement,
                                                movement_type: e.target.value,
                                            });
                                            if (e.target.value !== "compra") {
                                                setSelectedProduct(null);
                                            }
                                        }}
                                    >
                                        <option value="ingreso">Ingreso</option>
                                        <option value="egreso">Egreso</option>
                                        <option value="ajuste">Ajuste</option>
                                        <option value="compra">Compra</option>
                                    </select>
                                </div>

                                {/* Cartel informativo para ajustes */}
                                {newMovement.movement_type === "ajuste" && (
                                    <div
                                        style={{
                                            gridColumn: "1/3",
                                            backgroundColor: "#e8f5e8",
                                            border: "2px solid #27ae60",
                                            borderRadius: "8px",
                                            padding: "14px 16px",
                                            margin: "8px 0",
                                            display: "flex",
                                            alignItems: "flex-start",
                                            gap: "12px",
                                            boxShadow:
                                                "0 2px 8px rgba(39, 174, 96, 0.1)",
                                        }}
                                    >
                                        <i
                                            className="fas fa-balance-scale"
                                            style={{
                                                color: "#27ae60",
                                                fontSize: "18px",
                                                marginTop: "2px",
                                                flexShrink: 0,
                                            }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div
                                                style={{
                                                    fontSize: "14px",
                                                    fontWeight: "700",
                                                    color: "#1e8449",
                                                    marginBottom: "6px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "6px",
                                                }}
                                            >
                                                ⚖️ Ajuste de Saldo
                                                {newMovement.cash && (
                                                    <span
                                                        style={{
                                                            fontSize: "12px",
                                                            backgroundColor:
                                                                "#27ae60",
                                                            color: "white",
                                                            padding: "2px 8px",
                                                            borderRadius:
                                                                "12px",
                                                            fontWeight: "600",
                                                        }}
                                                    >
                                                        Actual: $
                                                        {(() => {
                                                            const caja =
                                                                cashes.find(
                                                                    (c) =>
                                                                        String(
                                                                            c.id
                                                                        ) ===
                                                                        String(
                                                                            newMovement.cash
                                                                        )
                                                                );
                                                            return caja
                                                                ? parseFloat(
                                                                      caja.balance
                                                                  ).toLocaleString(
                                                                      "es-CO",
                                                                      {
                                                                          minimumFractionDigits: 2,
                                                                          maximumFractionDigits: 2,
                                                                      }
                                                                  )
                                                                : "0.00";
                                                        })()}
                                                    </span>
                                                )}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "13px",
                                                    color: "#155724",
                                                    lineHeight: "1.5",
                                                    backgroundColor:
                                                        "rgba(255, 255, 255, 0.7)",
                                                    padding: "8px 10px",
                                                    borderRadius: "4px",
                                                    border: "1px solid rgba(39, 174, 96, 0.2)",
                                                }}
                                            >
                                                <strong>💡 Importante:</strong>{" "}
                                                El valor que ingreses será el{" "}
                                                <strong>
                                                    nuevo saldo final
                                                </strong>{" "}
                                                de la caja. El sistema calculará
                                                la diferencia y registrará
                                                automáticamente el movimiento
                                                necesario (ingreso o egreso).
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Cartel informativo para egresos y compras */}
                                {(newMovement.movement_type === "egreso" ||
                                    newMovement.movement_type === "compra") &&
                                    newMovement.cash && (
                                        <div
                                            style={{
                                                gridColumn: "1/3",
                                                backgroundColor: "#fff3cd",
                                                border: "2px solid #ffc107",
                                                borderRadius: "8px",
                                                padding: "14px 16px",
                                                margin: "8px 0",
                                                display: "flex",
                                                alignItems: "flex-start",
                                                gap: "12px",
                                                boxShadow:
                                                    "0 2px 8px rgba(255, 193, 7, 0.1)",
                                            }}
                                        >
                                            <i
                                                className="fas fa-wallet"
                                                style={{
                                                    color: "#ffc107",
                                                    fontSize: "18px",
                                                    marginTop: "2px",
                                                    flexShrink: 0,
                                                }}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <div
                                                    style={{
                                                        fontSize: "14px",
                                                        fontWeight: "700",
                                                        color: "#856404",
                                                        marginBottom: "6px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "6px",
                                                    }}
                                                >
                                                    💰 Saldo Disponible
                                                    <span
                                                        style={{
                                                            fontSize: "12px",
                                                            backgroundColor:
                                                                "#ffc107",
                                                            color: "white",
                                                            padding: "2px 8px",
                                                            borderRadius:
                                                                "12px",
                                                            fontWeight: "600",
                                                        }}
                                                    >
                                                        $
                                                        {(() => {
                                                            const caja =
                                                                cashes.find(
                                                                    (c) =>
                                                                        String(
                                                                            c.id
                                                                        ) ===
                                                                        String(
                                                                            newMovement.cash
                                                                        )
                                                                );
                                                            return caja
                                                                ? parseFloat(
                                                                      caja.balance
                                                                  ).toLocaleString(
                                                                      "es-CO",
                                                                      {
                                                                          minimumFractionDigits: 2,
                                                                          maximumFractionDigits: 2,
                                                                      }
                                                                  )
                                                                : "0.00";
                                                        })()}
                                                    </span>
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "13px",
                                                        color: "#856404",
                                                        lineHeight: "1.5",
                                                        backgroundColor:
                                                            "rgba(255, 255, 255, 0.7)",
                                                        padding: "8px 10px",
                                                        borderRadius: "4px",
                                                        border: "1px solid rgba(255, 193, 7, 0.2)",
                                                    }}
                                                >
                                                    <strong>
                                                        ⚠️ Importante:
                                                    </strong>{" "}
                                                    No puedes realizar un{" "}
                                                    {newMovement.movement_type ===
                                                    "egreso"
                                                        ? "egreso"
                                                        : "gasto de compra"}{" "}
                                                    por un monto mayor al saldo
                                                    disponible en la caja.
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                {newMovement.movement_type === "compra" && (
                                    <>
                                        <div style={{ gridColumn: "1/3" }}>
                                            <label
                                                style={{
                                                    ...labelStyle,
                                                    marginBottom: 4,
                                                }}
                                            >
                                                Producto
                                            </label>
                                            <ProductSearchSelector
                                                onProductSelected={
                                                    setSelectedProduct
                                                }
                                                placeholder="Buscar producto para la compra..."
                                                showSelectedProduct={true}
                                                allowClearSelection={true}
                                            />
                                        </div>
                                        <div
                                            style={{
                                                gridColumn: "1/3",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 12,
                                            }}
                                        >
                                            <label
                                                style={{
                                                    ...labelStyle,
                                                    marginBottom: 4,
                                                    minWidth: 140,
                                                }}
                                            >
                                                Cantidad de unidades
                                            </label>
                                            <input
                                                style={{
                                                    ...inputStyle,
                                                    background: "#fafdff",
                                                    width: 120,
                                                    minWidth: 0,
                                                    textAlign: "right",
                                                }}
                                                type="number"
                                                min="1"
                                                step="1"
                                                value={
                                                    newMovement.quantity || ""
                                                }
                                                onChange={(e) =>
                                                    setNewMovement({
                                                        ...newMovement,
                                                        quantity:
                                                            e.target.value,
                                                    })
                                                }
                                                required
                                            />
                                        </div>
                                    </>
                                )}
                                <div style={{ gridColumn: "1/2" }}>
                                    <label
                                        style={{
                                            ...labelStyle,
                                            marginBottom: 4,
                                        }}
                                    >
                                        Monto
                                    </label>
                                    <input
                                        style={{
                                            ...inputStyle,
                                            background: "#fafdff",
                                            fontWeight: 700,
                                            color: "#2980b9",
                                            width: "100%",
                                        }}
                                        type="number"
                                        step="0.01"
                                        value={newMovement.amount}
                                        onChange={(e) =>
                                            setNewMovement({
                                                ...newMovement,
                                                amount: e.target.value,
                                            })
                                        }
                                        required
                                    />
                                </div>
                                <div style={{ gridColumn: "1/3" }}>
                                    <label
                                        style={{
                                            ...labelStyle,
                                            marginBottom: 4,
                                        }}
                                    >
                                        Notas
                                    </label>
                                    <input
                                        style={{
                                            ...inputStyle,
                                            background: `${colors.primary}05`,
                                            width: "100%",
                                            borderColor: colors.border,
                                        }}
                                        type="text"
                                        value={newMovement.notes}
                                        onChange={(e) =>
                                            setNewMovement({
                                                ...newMovement,
                                                notes: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div style={{ gridColumn: "1/3" }}>
                                    <button
                                        type="submit"
                                        disabled={
                                            isCreatingMovement ||
                                            isCreatingAdjustment
                                        }
                                        style={{
                                            ...btnStyle,
                                            width: "100%",
                                            padding: "16px 0",
                                            borderRadius: 12,
                                            fontSize: 16,
                                            marginTop: 8,
                                            background:
                                                isCreatingMovement ||
                                                isCreatingAdjustment
                                                    ? `${colors.primary}50`
                                                    : `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                                            color: colors.white,
                                            boxShadow: `0 4px 16px ${colors.primary}40`,
                                            letterSpacing: 0.5,
                                            fontWeight: 700,
                                            cursor:
                                                isCreatingMovement ||
                                                isCreatingAdjustment
                                                    ? "not-allowed"
                                                    : "pointer",
                                            opacity:
                                                isCreatingMovement ||
                                                isCreatingAdjustment
                                                    ? 0.7
                                                    : 1,
                                        }}
                                    >
                                        {isCreatingMovement ||
                                        isCreatingAdjustment
                                            ? newMovement.movement_type ===
                                              "ajuste"
                                                ? "Procesando Ajuste..."
                                                : "Creando..."
                                            : "Crear Movimiento"}
                                    </button>
                                </div>
                            </form>
                            <button
                                type="button"
                                style={{
                                    ...btnStyle,
                                    background: colors.white,
                                    color: colors.success,
                                    border: `2px solid ${colors.success}`,
                                    marginTop: 20,
                                    fontWeight: 700,
                                    fontSize: 16,
                                    boxShadow: `0 2px 8px ${colors.success}30`,
                                    width: "100%",
                                    padding: "14px 0",
                                    borderRadius: 10,
                                    transition: "all 0.3s ease",
                                }}
                                onClick={() => setShowTransfer(true)}
                            >
                                + Crear Transferencia
                            </button>
                        </div>
                    )}
                </div>
                <div style={cardTable}>
                    <h2 style={sectionTitleTable}>
                        Historial de Movimientos{" "}
                        {selectedCash &&
                            `(Caja: ${selectedCash.location_name})`}
                    </h2>
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            minWidth: "900px",
                            backgroundColor: colors.white,
                            borderRadius: "16px",
                            boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                            overflow: "hidden",
                        }}
                    >
                        <thead>
                            <tr
                                style={{
                                    background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                                    color: colors.white,
                                }}
                            >
                                <th
                                    style={{
                                        padding: "16px 12px",
                                        textAlign: "center",
                                        fontWeight: "600",
                                        fontSize: "14px",
                                        letterSpacing: "0.5px",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    Tipo
                                </th>
                                <th
                                    style={{
                                        padding: "16px 12px",
                                        textAlign: "right",
                                        fontWeight: "600",
                                        fontSize: "14px",
                                        letterSpacing: "0.5px",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    Monto
                                </th>
                                <th
                                    style={{
                                        padding: "16px 12px",
                                        textAlign: "left",
                                        fontWeight: "600",
                                        fontSize: "14px",
                                        letterSpacing: "0.5px",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    Referencia
                                </th>
                                <th
                                    style={{
                                        padding: "16px 12px",
                                        textAlign: "left",
                                        fontWeight: "600",
                                        fontSize: "14px",
                                        letterSpacing: "0.5px",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    Notas
                                </th>
                                <th
                                    style={{
                                        padding: "16px 12px",
                                        textAlign: "center",
                                        fontWeight: "600",
                                        fontSize: "14px",
                                        letterSpacing: "0.5px",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    Usuario
                                </th>
                                <th
                                    style={{
                                        padding: "16px 12px",
                                        textAlign: "center",
                                        fontWeight: "600",
                                        fontSize: "14px",
                                        letterSpacing: "0.5px",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    Fecha
                                </th>
                                <th
                                    style={{
                                        padding: "16px 12px",
                                        textAlign: "center",
                                        fontWeight: "600",
                                        fontSize: "14px",
                                        letterSpacing: "0.5px",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    Caja
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingMovements ? (
                                <tr>
                                    <td
                                        colSpan="7"
                                        style={{
                                            padding: "40px 20px",
                                            textAlign: "center",
                                            backgroundColor: colors.light,
                                            borderBottom: "1px solid #e9ecef",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                gap: "12px",
                                                color: colors.primary,
                                                fontSize: "16px",
                                                fontWeight: "600",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: "24px",
                                                    height: "24px",
                                                    border: `3px solid ${colors.primary}30`,
                                                    borderTop: `3px solid ${colors.primary}`,
                                                    borderRadius: "50%",
                                                    animation:
                                                        "spin 1s linear infinite",
                                                }}
                                            ></div>
                                            Cargando movimientos...
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                (selectedCash
                                    ? movements.filter(
                                          (m) => m.cash === selectedCash.id
                                      )
                                    : movements
                                ).map((m, idx) => (
                                    <tr
                                        key={m.id}
                                        style={{
                                            backgroundColor:
                                                idx % 2 === 0
                                                    ? "#fff"
                                                    : "#f8f9fa",
                                            transition: "background 0.2s",
                                        }}
                                    >
                                        <td
                                            style={{
                                                padding: "16px 12px",
                                                borderBottom:
                                                    "1px solid #e9ecef",
                                                textAlign: "center",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    display: "inline-block",
                                                    padding: "8px 16px",
                                                    borderRadius: "20px",
                                                    fontSize: "12px",
                                                    fontWeight: "600",
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.5px",
                                                    backgroundColor:
                                                        m.movement_type ===
                                                        "ingreso"
                                                            ? `${colors.success}15`
                                                            : m.movement_type ===
                                                              "egreso"
                                                            ? `${colors.danger}15`
                                                            : `${colors.info}15`,
                                                    color:
                                                        m.movement_type ===
                                                        "ingreso"
                                                            ? colors.success
                                                            : m.movement_type ===
                                                              "egreso"
                                                            ? colors.danger
                                                            : colors.info,
                                                    border: `2px solid ${
                                                        m.movement_type ===
                                                        "ingreso"
                                                            ? `${colors.success}30`
                                                            : m.movement_type ===
                                                              "egreso"
                                                            ? `${colors.danger}30`
                                                            : `${colors.info}30`
                                                    }`,
                                                    boxShadow:
                                                        "0 2px 8px rgba(0,0,0,0.1)",
                                                }}
                                            >
                                                {m.movement_type_display}
                                            </span>
                                        </td>
                                        <td
                                            style={{
                                                padding: "16px 12px",
                                                borderBottom:
                                                    "1px solid #e9ecef",
                                                textAlign: "right",
                                                fontWeight: 700,
                                                color:
                                                    m.movement_type ===
                                                    "ingreso"
                                                        ? colors.success
                                                        : m.movement_type ===
                                                          "egreso"
                                                        ? colors.danger
                                                        : colors.primary,
                                                fontSize: "15px",
                                                fontFamily: "monospace",
                                            }}
                                        >
                                            {/* Solo mostrar el valor, sin iconos ni símbolos */}
                                            {String(m.amount_formatted).replace(
                                                /^[-+]/,
                                                ""
                                            )}
                                        </td>
                                        <td
                                            style={{
                                                padding: "16px 12px",
                                                borderBottom:
                                                    "1px solid #e9ecef",
                                                fontSize: "14px",
                                                color: colors.textSecondary,
                                            }}
                                        >
                                            {m.reference_type_display}
                                        </td>
                                        <td
                                            style={{
                                                padding: "16px 12px",
                                                borderBottom:
                                                    "1px solid #e9ecef",
                                                fontSize: "14px",
                                                color: colors.textSecondary,
                                            }}
                                        >
                                            {m.notes}
                                        </td>
                                        <td
                                            style={{
                                                padding: "16px 12px",
                                                borderBottom:
                                                    "1px solid #e9ecef",
                                                fontSize: "14px",
                                                color: colors.textSecondary,
                                                textAlign: "center",
                                            }}
                                        >
                                            {m.created_by_name ||
                                                m.created_by ||
                                                "-"}
                                        </td>
                                        <td
                                            style={{
                                                padding: "16px 12px",
                                                borderBottom:
                                                    "1px solid #e9ecef",
                                                textAlign: "center",
                                                fontSize: "13px",
                                                color: colors.textSecondary,
                                                fontFamily: "monospace",
                                            }}
                                        >
                                            {(() => {
                                                if (!m.created_at) return "-";
                                                const d = new Date(
                                                    m.created_at
                                                );
                                                const pad = (n) =>
                                                    n
                                                        .toString()
                                                        .padStart(2, "0");
                                                return `${pad(
                                                    d.getDate()
                                                )}/${pad(d.getMonth() + 1)}/${d
                                                    .getFullYear()
                                                    .toString()
                                                    .slice(-2)} ${pad(
                                                    d.getHours()
                                                )}:${pad(d.getMinutes())}`;
                                            })()}
                                        </td>
                                        <td
                                            style={{
                                                padding: "16px 12px",
                                                borderBottom:
                                                    "1px solid #e9ecef",
                                                textAlign: "center",
                                            }}
                                        >
                                            <span
                                                style={{
                                                    display: "inline-block",
                                                    padding: "6px 12px",
                                                    borderRadius: "16px",
                                                    fontSize: "12px",
                                                    fontWeight: "600",
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.5px",
                                                    backgroundColor: `${colors.primary}15`,
                                                    color: colors.primary,
                                                    border: `2px solid ${colors.primary}30`,
                                                    boxShadow:
                                                        "0 2px 8px rgba(0,0,0,0.1)",
                                                }}
                                            >
                                                {m.cash_name || m.cash || "-"}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        isLoading={loadingMovements}
                    />
                </div>
            </div>
            {/* Modal o sección secundaria para transferencias */}
            {showTransfer && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        background: "rgba(0,0,0,0.5)",
                        zIndex: 1000,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "background 0.3s ease",
                    }}
                    onClick={() => setShowTransfer(false)}
                >
                    <div
                        style={{
                            background: colors.white,
                            borderRadius: 16,
                            padding: 36,
                            minWidth: 340,
                            maxWidth: 440,
                            boxShadow: "0 12px 48px rgba(0,0,0,0.2)",
                            position: "relative",
                            border: `1px solid ${colors.border}`,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3
                            style={{
                                ...sectionTitle,
                                color: colors.primary,
                                fontSize: 22,
                                marginBottom: 18,
                            }}
                        >
                            Crear Transferencia
                        </h3>
                        <form
                            onSubmit={handleCreateTransfer}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 12,
                            }}
                        >
                            <label style={labelStyle}>
                                Caja Origen:
                                <select
                                    style={selectStyle}
                                    value={newTransfer.origin_cash}
                                    onChange={(e) =>
                                        setNewTransfer({
                                            ...newTransfer,
                                            origin_cash: e.target.value,
                                        })
                                    }
                                    required
                                >
                                    <option value="">Selecciona origen</option>
                                    {cashes.map((cash) => (
                                        <option key={cash.id} value={cash.id}>
                                            {cash.location_name} - $
                                            {parseFloat(
                                                cash.balance
                                            ).toLocaleString("es-CO", {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </option>
                                    ))}
                                </select>
                                {newTransfer.origin_cash && (
                                    <div
                                        style={{
                                            fontSize: "12px",
                                            color: "#856404",
                                            marginTop: "4px",
                                            padding: "4px 8px",
                                            backgroundColor: "#fff3cd",
                                            borderRadius: "4px",
                                            border: "1px solid #ffc107",
                                        }}
                                    >
                                        💰 Saldo disponible: $
                                        {(() => {
                                            const caja = cashes.find(
                                                (c) =>
                                                    String(c.id) ===
                                                    String(
                                                        newTransfer.origin_cash
                                                    )
                                            );
                                            return caja
                                                ? parseFloat(
                                                      caja.balance
                                                  ).toLocaleString("es-CO", {
                                                      minimumFractionDigits: 2,
                                                      maximumFractionDigits: 2,
                                                  })
                                                : "0.00";
                                        })()}
                                    </div>
                                )}
                            </label>
                            <label style={labelStyle}>
                                Caja Destino:
                                <select
                                    style={selectStyle}
                                    value={newTransfer.destination_cash}
                                    onChange={(e) =>
                                        setNewTransfer({
                                            ...newTransfer,
                                            destination_cash: e.target.value,
                                        })
                                    }
                                    required
                                >
                                    <option value="">Selecciona destino</option>
                                    {cashes.map((cash) => (
                                        <option key={cash.id} value={cash.id}>
                                            {cash.location_name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label style={labelStyle}>
                                Monto:
                                <input
                                    style={inputStyle}
                                    type="number"
                                    step="0.01"
                                    value={newTransfer.amount}
                                    onChange={(e) =>
                                        setNewTransfer({
                                            ...newTransfer,
                                            amount: e.target.value,
                                        })
                                    }
                                    required
                                />
                            </label>
                            <label style={labelStyle}>
                                Notas:
                                <input
                                    style={inputStyle}
                                    type="text"
                                    value={newTransfer.notes}
                                    onChange={(e) =>
                                        setNewTransfer({
                                            ...newTransfer,
                                            notes: e.target.value,
                                        })
                                    }
                                />
                            </label>
                            <button type="submit" style={btnStyle}>
                                Crear Transferencia
                            </button>
                        </form>
                        <button
                            type="button"
                            style={{
                                ...btnStyle,
                                background: "#fff",
                                color: "#c0392b",
                                border: "2px solid #c0392b",
                                marginTop: 18,
                                fontWeight: 700,
                                fontSize: 16,
                                borderRadius: 8,
                                width: "100%",
                                padding: "10px 0",
                            }}
                            onClick={() => setShowTransfer(false)}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
            {actionMsg && (
                <p
                    style={{
                        color: actionMsg.includes("creado")
                            ? "#27ae60"
                            : "#c0392b",
                        fontWeight: 700,
                        marginTop: 32,
                        fontSize: 18,
                        textAlign: "center",
                        letterSpacing: 0.5,
                    }}
                >
                    {actionMsg}
                </p>
            )}
        </div>
    );
};

// Componente de paginación reutilizable
const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    isLoading = false,
}) => {
    const [inputValue, setInputValue] = React.useState(currentPage);
    React.useEffect(() => {
        setInputValue(currentPage);
    }, [currentPage]);
    if (totalPages <= 1) return null;
    // Solo mostrar 3 botones: anterior, actual, siguiente
    const pages = [];
    if (currentPage > 1) pages.push(currentPage - 1);
    pages.push(currentPage);
    if (currentPage < totalPages) pages.push(currentPage + 1);
    const handleInputChange = (e) => {
        let val = e.target.value.replace(/[^0-9]/g, "");
        if (val === "") val = 1;
        val = Math.max(1, Math.min(Number(val), totalPages));
        setInputValue(val);
    };
    const handleInputBlur = () => {
        if (inputValue !== currentPage) {
            onPageChange(Number(inputValue));
        }
    };
    const handleInputKeyDown = (e) => {
        if (e.key === "Enter") {
            onPageChange(Number(inputValue));
        }
    };
    return (
        <div
            style={{
                display: "flex",
                gap: 8,
                margin: "18px 0",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <button
                style={{
                    ...btnStyle,
                    opacity: currentPage === 1 || isLoading ? 0.5 : 1,
                    cursor:
                        currentPage === 1 || isLoading
                            ? "not-allowed"
                            : "pointer",
                }}
                onClick={() => !isLoading && onPageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
            >
                {isLoading ? "⏳" : "Anterior"}
            </button>
            {pages.map((p) => (
                <button
                    key={p}
                    style={{
                        ...btnStyle,
                        background: p === currentPage ? "#27ae60" : "#fff",
                        color: p === currentPage ? "#fff" : "#27ae60",
                        border: "1.5px solid #27ae60",
                        fontWeight: p === currentPage ? 700 : 500,
                        minWidth: 36,
                        opacity: p === currentPage || isLoading ? 0.7 : 1,
                        cursor:
                            p === currentPage || isLoading
                                ? "not-allowed"
                                : "pointer",
                    }}
                    onClick={() => !isLoading && onPageChange(p)}
                    disabled={p === currentPage || isLoading}
                >
                    {p === currentPage && isLoading ? "⏳" : p}
                </button>
            ))}
            <span style={{ margin: "0 8px", fontWeight: 500 }}>
                Ir a página:
            </span>
            <input
                type="number"
                min={1}
                max={totalPages}
                value={inputValue}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown}
                disabled={isLoading}
                style={{
                    width: 60,
                    padding: "4px 8px",
                    border: "1.5px solid #27ae60",
                    borderRadius: 4,
                    fontSize: 15,
                    opacity: isLoading ? 0.5 : 1,
                    cursor: isLoading ? "not-allowed" : "text",
                }}
            />
            <span style={{ fontWeight: 500 }}>/ {totalPages}</span>
            <button
                style={{
                    ...btnStyle,
                    opacity: currentPage === totalPages || isLoading ? 0.5 : 1,
                    cursor:
                        currentPage === totalPages || isLoading
                            ? "not-allowed"
                            : "pointer",
                }}
                onClick={() => !isLoading && onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
            >
                {isLoading ? "⏳" : "Siguiente"}
            </button>
        </div>
    );
};

export default CajaPage;
