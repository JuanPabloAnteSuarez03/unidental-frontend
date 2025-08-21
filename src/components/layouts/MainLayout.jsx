// src/components/layouts/MainLayout.jsx
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
// Asegúrate que la ruta a useAuth sea la correcta según tu estructura de proyecto
import { useAuth } from "../../context/AuthContext"; // [cite: src/context/AuthContext.jsx]

const MainLayout = ({ children }) => {
    const { authToken, currentUser, logout } = useAuth();
    const isAuthenticated = !!authToken;
    const isAdmin = currentUser && currentUser.role === "Admin";
    const location = useLocation();
    const [activeMenu, setActiveMenu] = useState(null);
    const [hoveredItem, setHoveredItem] = useState(null);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [logoutLoading, setLogoutLoading] = useState(false);

    // Verificar si estamos en la página de login o related
    const isAuthPage =
        location.pathname === "/login" ||
        location.pathname === "/" ||
        location.pathname.includes("/password-reset");

    // Si es una página de autenticación, mostrar solo el contenido sin header ni footer
    if (isAuthPage) {
        return <>{children}</>;
    }

    // Configuración de los menús
    const menus = {
        inventario: {
            title: "Inventario",
            items: [
                { name: "Vista General de Inventario", path: "/inventario" },
                {
                    name: "Movimientos de Stock",
                    path: "/inventario/movimientos",
                },
                {
                    name: "Transferencias Internas",
                    path: "/inventario/transferencias",
                },
                { name: "Nuevo Producto", path: "/inventario/nuevo-producto" },
                {
                    name: "Alertas por Vencimiento",
                    path: "/inventario/alertas-vencimiento",
                },
                {
                    name: "Alertas por Stock",
                    path: "/inventario/alertas-stock",
                },
                {
                    name: "Ver Reportes",
                    path: "/inventario/reportes",
                },
            ],
        },
        compras: {
            title: "Compras",
            items: [
                { name: "Proveedores", path: "/compras/proveedores" },
                { name: "Órdenes de Compra", path: "/compras/ordenes" },
                {
                    name: "Análisis de Precios",
                    path: "/compras/analisis-precios",
                },
                {
                    name: "Deudas WhatsApp",
                    path: "/compras/deudas-whatsapp",
                },
            ],
        },
        ventas: {
            title: "Ventas",
            items: [
                { name: "Registrar Venta", path: "/ventas" },
                {
                    name: "Gestión de Devoluciones",
                    path: "/ventas/devoluciones",
                },
                {
                    name: "Total de Ventas",
                    path: "/ventas/total",
                },
                {
                    name: "Créditos WhatsApp",
                    path: "/ventas/creditos-whatsapp",
                },
            ],
        },
        clientes: {
            title: "Clientes",
            items: [
                { name: "Lista de Clientes", path: "/clientes/lista" },
                { name: "Nuevo Cliente", path: "/clientes/nuevo" },
            ],
        },
        caja: {
            title: "Caja",
            items: [{ name: "Panel de Caja", path: "/caja" }],
        },
        configuracion: {
            title: "Configuración",
            items: [
                {
                    name: "Control de Usuarios",
                    path: "/configuracion/control-usuarios",
                },
                {
                    name: "Agregar Componentes",
                    path: "/configuracion/agregar-componentes",
                },
            ],
        },
    };

    // Definir rutas solo para admin
    const adminOnlyPaths = [
        "/configuracion/control-usuarios",
        "/configuracion/agregar-componentes",
        "/compras/deudas-whatsapp",
        "/ventas/creditos-whatsapp",
        "/caja",
    ];

    // Función para manejar hover en menús
    const handleMenuHover = (menuId) => {
        setActiveMenu(menuId);
    };

    // Función para manejar el logout
    const handleLogout = async () => {
        setLogoutLoading(true);
        try {
            await logout();
            setShowLogoutConfirm(false);
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        } finally {
            setLogoutLoading(false);
        }
    };

    return (
        <div style={{ minHeight: "100vh", fontFamily: "Arial, sans-serif" }}>
            {/* Header global */}
            <header
                style={{
                    backgroundColor: "#2c3e50",
                    color: "white",
                    padding: "1rem 2rem",
                    marginBottom: "20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    boxSizing: "border-box",
                }}
            >
                <div className="logo-area" style={{ flexShrink: 0 }}>
                    <h1 style={{ margin: 0, fontSize: "1.8em" }}>
                        Sistema de Gestión
                    </h1>
                    <h2
                        style={{
                            margin: "0.2em 0 0 0",
                            fontSize: "1em",
                            fontWeight: "normal",
                        }}
                    >
                        Panel Principal
                    </h2>
                </div>
                <nav
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        flexGrow: 1,
                        overflow: "visible",
                        paddingRight: "50px",
                    }}
                >
                    {/* Menús desplegables */}
                    {isAuthenticated && (
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                marginRight: "-30px",
                            }}
                        >
                            {Object.keys(menus).map((menuId) => (
                                <div
                                    key={menuId}
                                    style={{
                                        position: "relative",
                                        marginRight:
                                            menuId === "configuracion"
                                                ? "0"
                                                : "25px",
                                    }}
                                    onMouseEnter={() => handleMenuHover(menuId)}
                                    onMouseLeave={() => {
                                        handleMenuHover(null);
                                        setHoveredItem(null);
                                    }}
                                >
                                    <div
                                        style={{
                                            color: "white",
                                            cursor: "pointer",
                                            padding: "10px",
                                            borderRadius: "4px",
                                            backgroundColor:
                                                activeMenu === menuId
                                                    ? "#3a506b"
                                                    : "transparent",
                                        }}
                                    >
                                        {menus[menuId].title} ▼
                                    </div>

                                    {activeMenu === menuId && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                top: "100%",
                                                left: "50%",
                                                transform: "translateX(-50%)",
                                                backgroundColor: "#fff",
                                                boxShadow:
                                                    "0 2px 10px rgba(0,0,0,0.2)",
                                                borderRadius: "4px",
                                                width: "220px",
                                                zIndex: 100,
                                            }}
                                        >
                                            {menus[menuId].items
                                                .filter(
                                                    (item) =>
                                                        // Si la ruta es solo para admin, solo mostrarla si es admin
                                                        !adminOnlyPaths.includes(
                                                            item.path
                                                        ) || isAdmin
                                                )
                                                .map((item, index) => (
                                                    <Link
                                                        key={index}
                                                        to={item.path}
                                                        style={{
                                                            display: "block",
                                                            padding:
                                                                "10px 15px",
                                                            textDecoration:
                                                                "none",
                                                            color: "#333",
                                                            borderBottom:
                                                                index <
                                                                menus[
                                                                    menuId
                                                                ].items.filter(
                                                                    (item) =>
                                                                        !adminOnlyPaths.includes(
                                                                            item.path
                                                                        ) ||
                                                                        isAdmin
                                                                ).length -
                                                                    1
                                                                    ? "1px solid #eee"
                                                                    : "none",
                                                            backgroundColor:
                                                                hoveredItem ===
                                                                `${menuId}-${index}`
                                                                    ? "#e0e0e0"
                                                                    : "transparent",
                                                            transition:
                                                                "background-color 0.2s ease",
                                                            pointerEvents:
                                                                !isAdmin &&
                                                                adminOnlyPaths.includes(
                                                                    item.path
                                                                )
                                                                    ? "none"
                                                                    : "auto",
                                                            opacity:
                                                                !isAdmin &&
                                                                adminOnlyPaths.includes(
                                                                    item.path
                                                                )
                                                                    ? 0.5
                                                                    : 1,
                                                        }}
                                                        onMouseEnter={() =>
                                                            setHoveredItem(
                                                                `${menuId}-${index}`
                                                            )
                                                        }
                                                        onMouseLeave={() =>
                                                            setHoveredItem(null)
                                                        }
                                                    >
                                                        {item.name}
                                                        {!isAdmin &&
                                                            adminOnlyPaths.includes(
                                                                item.path
                                                            ) && (
                                                                <span
                                                                    style={{
                                                                        color: "#b00",
                                                                        marginLeft: 8,
                                                                        fontSize: 12,
                                                                    }}
                                                                >
                                                                    (Solo Admin)
                                                                </span>
                                                            )}
                                                    </Link>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Botón de cerrar sesión */}
                    {isAuthenticated && (
                        <div
                            style={{
                                marginLeft: "30px",
                                display: "flex",
                                alignItems: "center",
                                borderLeft: "1px solid rgba(255,255,255,0.2)",
                                paddingLeft: "20px",
                            }}
                        >
                            <button
                                onClick={() => setShowLogoutConfirm(true)}
                                style={{
                                    background: "#e74c3c",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    padding: "8px 12px",
                                    cursor: "pointer",
                                    fontWeight: 600,
                                    fontSize: "12px",
                                    transition: "all 0.3s ease",
                                    boxShadow: "0 2px 6px rgba(231,76,60,0.2)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    minWidth: "auto",
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = "#c0392b";
                                    e.target.style.transform =
                                        "translateY(-1px)";
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = "#e74c3c";
                                    e.target.style.transform = "translateY(0)";
                                }}
                            >
                                <span style={{ fontSize: "14px" }}>🚪</span>
                                Salir
                            </button>
                        </div>
                    )}
                </nav>
            </header>

            {/* Contenido principal */}
            <main style={{ padding: "0 20px" }}>{children}</main>

            {/* Footer global */}
            <footer
                style={{
                    marginTop: "40px",
                    padding: "20px",
                    backgroundColor: "#ecf0f1",
                    textAlign: "center",
                    borderTop: "1px solid #dee2e6",
                }}
            >
                <p style={{ margin: 0, color: "#34495e" }}>
                    &copy; {new Date().getFullYear()} Sistema de Inventario
                    Unidental
                </p>
            </footer>

            {/* Modal de confirmación de logout */}
            {showLogoutConfirm && (
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
                    onClick={() => setShowLogoutConfirm(false)}
                >
                    <div
                        style={{
                            background: "white",
                            borderRadius: "16px",
                            padding: "32px",
                            minWidth: "400px",
                            maxWidth: "500px",
                            boxShadow: "0 12px 48px rgba(0,0,0,0.2)",
                            position: "relative",
                            border: "1px solid #e0e0e0",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            style={{
                                textAlign: "center",
                                marginBottom: "24px",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "48px",
                                    marginBottom: "16px",
                                }}
                            >
                                🚪
                            </div>
                            <h3
                                style={{
                                    color: "#2c3e50",
                                    fontWeight: 700,
                                    fontSize: "24px",
                                    margin: "0 0 8px 0",
                                }}
                            >
                                ¿Cerrar sesión?
                            </h3>
                            <p
                                style={{
                                    color: "#7f8c8d",
                                    fontSize: "16px",
                                    margin: 0,
                                    lineHeight: 1.5,
                                }}
                            >
                                ¿Estás seguro de que quieres cerrar tu sesión?
                                Tendrás que volver a iniciar sesión para acceder
                                al sistema.
                            </p>
                        </div>

                        <div
                            style={{
                                display: "flex",
                                gap: "12px",
                                justifyContent: "center",
                            }}
                        >
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                disabled={logoutLoading}
                                style={{
                                    padding: "12px 24px",
                                    background: "#95a5a6",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontWeight: 600,
                                    fontSize: "14px",
                                    cursor: logoutLoading
                                        ? "not-allowed"
                                        : "pointer",
                                    transition: "all 0.3s ease",
                                    opacity: logoutLoading ? 0.6 : 1,
                                }}
                                onMouseEnter={(e) => {
                                    if (!logoutLoading) {
                                        e.target.style.background = "#7f8c8d";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!logoutLoading) {
                                        e.target.style.background = "#95a5a6";
                                    }
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleLogout}
                                disabled={logoutLoading}
                                style={{
                                    padding: "12px 24px",
                                    background: logoutLoading
                                        ? "#bdc3c7"
                                        : "#e74c3c",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontWeight: 600,
                                    fontSize: "14px",
                                    cursor: logoutLoading
                                        ? "not-allowed"
                                        : "pointer",
                                    transition: "all 0.3s ease",
                                    boxShadow: logoutLoading
                                        ? "none"
                                        : "0 4px 16px rgba(231,76,60,0.2)",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "8px",
                                }}
                                onMouseEnter={(e) => {
                                    if (!logoutLoading) {
                                        e.target.style.background = "#c0392b";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!logoutLoading) {
                                        e.target.style.background =
                                            logoutLoading
                                                ? "#bdc3c7"
                                                : "#e74c3c";
                                    }
                                }}
                            >
                                {logoutLoading ? (
                                    <>
                                        <span style={{ fontSize: "16px" }}>
                                            🔄
                                        </span>
                                        Cerrando...
                                    </>
                                ) : (
                                    <>
                                        <span style={{ fontSize: "16px" }}>
                                            ✅
                                        </span>
                                        Sí, cerrar sesión
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MainLayout;
