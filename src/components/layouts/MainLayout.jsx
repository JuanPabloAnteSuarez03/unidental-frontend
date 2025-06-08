// src/components/layouts/MainLayout.jsx
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
// Asegúrate que la ruta a useAuth sea la correcta según tu estructura de proyecto
import { useAuth } from "../../context/AuthContext"; // [cite: src/context/AuthContext.jsx]

const MainLayout = ({ children }) => {
    const { authToken } = useAuth();
    const isAuthenticated = !!authToken;
    const location = useLocation();
    const [activeMenu, setActiveMenu] = useState(null);
    const [hoveredItem, setHoveredItem] = useState(null);

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
                    name: "Alertas y Notificaciones",
                    path: "/inventario/alertas",
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
            ],
        },
        ventas: {
            title: "Ventas",
            items: [
                { name: "Registrar Venta", path: "/ventas/pos" },
                {
                    name: "Gestión de Devoluciones",
                    path: "/ventas/devoluciones",
                },
                { name: "Gestión de Domicilios", path: "/ventas/domicilios" },
                {
                    name: "Cuentas por Cobrar (Créditos)",
                    path: "/ventas/creditos",
                },
            ],
        },
        clientes: {
            title: "Clientes",
            items: [
                { name: "Lista de Clientes", path: "/clientes/lista" },
                { name: "Nuevo Cliente", path: "/clientes/nuevo" },
                { name: "Ver Reportes", path: "/clientes/reportes" },
            ],
        },
        configuracion: {
            title: "Configuración",
            items: [
                {
                    name: "Tipos de Venta y Precios",
                    path: "/configuracion/tipos-venta",
                },
                {
                    name: "Niveles Mínimos de Stock",
                    path: "/configuracion/niveles-stock",
                },
            ],
        },
    };

    // Función para manejar hover en menús
    const handleMenuHover = (menuId) => {
        setActiveMenu(menuId);
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
                                            {menus[menuId].items.map(
                                                (item, index) => (
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
                                                                menus[menuId]
                                                                    .items
                                                                    .length -
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
                                                    </Link>
                                                )
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
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
        </div>
    );
};

export default MainLayout;