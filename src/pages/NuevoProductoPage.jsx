import React, { useState, useEffect } from "react";
import axios from "axios";

const NuevoProductoPage = () => {
    // Estados para los selectores de SKU
    const [categoriaSku, setCategoriaSku] = useState("");
    const [subcategoriaSku, setSubcategoriaSku] = useState("");
    const [tipoSku, setTipoSku] = useState("");

    // Estado para las listas de opciones
    const [opcionesCategoriasSku, setOpcionesCategoriasSku] = useState([]);
    const [opcionesSubcategoriasSku, setOpcionesSubcategoriasSku] = useState(
        []
    );
    const [opcionesTipoSku, setOpcionesTipoSku] = useState([]);
    const [categoriasPrincipales, setCategoriasPrincipales] = useState([]);

    // Estado para el formulario del producto
    const [formProducto, setFormProducto] = useState({
        sku: "",
        name: "",
        barcode: "",
        description: "",
        unit: "",
        category: "",
    });

    // Estado para notificaciones
    const [notification, setNotification] = useState({
        show: false,
        type: "",
        message: "",
    });

    // Estado para mensajes de SKU
    const [skuMessage, setSkuMessage] = useState({
        show: false,
        type: "",
        message: "",
    });

    // Opciones comunes para unidades de medida
    const unidadesMedida = [
        "Unidad",
        "Caja",
        "Paquete",
        "Kg",
        "Litro",
        "ml",
        "g",
        "Set",
    ];

    // Cargar datos iniciales
    useEffect(() => {
        // Cargar información del sistema SKU
        const fetchSkuInfo = async () => {
            try {
                const response = await axios.get("/api/catalogs/sku/info/");
                setOpcionesCategoriasSku(response.data.categorias || []);
                // Las subcategorías y tipos se cargarán cuando el usuario seleccione una categoría
            } catch (error) {
                console.error("Error al cargar información del SKU:", error);
                setNotification({
                    show: true,
                    type: "error",
                    message: "No se pudo cargar la información del sistema SKU",
                });
            }
        };

        // Cargar categorías principales de productos
        const fetchCategorias = async () => {
            try {
                const response = await axios.get("/api/catalogs/categories/");
                setCategoriasPrincipales(response.data || []);
            } catch (error) {
                console.error(
                    "Error al cargar categorías de productos:",
                    error
                );
                setNotification({
                    show: true,
                    type: "error",
                    message:
                        "No se pudieron cargar las categorías de productos",
                });
            }
        };

        fetchSkuInfo();
        fetchCategorias();
    }, []);

    // Cargar subcategorías cuando cambia la categoría seleccionada
    useEffect(() => {
        if (categoriaSku) {
            const fetchSubcategorias = async () => {
                try {
                    const response = await axios.get(
                        `/api/catalogs/sku/subcategories/?categoria=${categoriaSku}`
                    );
                    setOpcionesSubcategoriasSku(response.data || []);
                    setSubcategoriaSku(""); // Reset subcategoría
                    setTipoSku(""); // Reset tipo
                    setOpcionesTipoSku([]);
                } catch (error) {
                    console.error("Error al cargar subcategorías:", error);
                }
            };

            fetchSubcategorias();
        }
    }, [categoriaSku]);

    // Cargar tipos cuando cambia la subcategoría seleccionada
    useEffect(() => {
        if (subcategoriaSku) {
            const fetchTipos = async () => {
                try {
                    const response = await axios.get(
                        `/api/catalogs/sku/types/?subcategoria=${subcategoriaSku}`
                    );
                    setOpcionesTipoSku(response.data || []);
                    setTipoSku(""); // Reset tipo
                } catch (error) {
                    console.error("Error al cargar tipos:", error);
                }
            };

            fetchTipos();
        }
    }, [subcategoriaSku]);

    // Manejar cambios en los selectores SKU
    const handleCategoriaSkuChange = (e) => {
        setCategoriaSku(e.target.value);
    };

    const handleSubcategoriaSkuChange = (e) => {
        setSubcategoriaSku(e.target.value);
    };

    const handleTipoSkuChange = (e) => {
        setTipoSku(e.target.value);
    };

    // Manejar cambios en el formulario de producto
    const handleProductoChange = (e) => {
        const { name, value } = e.target;
        setFormProducto({
            ...formProducto,
            [name]: value,
        });
    };

    // Generar SKU
    const handleGenerarSku = async () => {
        if (!categoriaSku || !subcategoriaSku || !tipoSku) {
            setSkuMessage({
                show: true,
                type: "error",
                message:
                    "Debe seleccionar categoría, subcategoría y tipo para generar el SKU",
            });
            return;
        }

        try {
            const response = await axios.post("/api/catalogs/sku/generate/", {
                categoria: categoriaSku,
                subcategoria: subcategoriaSku,
                tipo: tipoSku,
            });

            if (response.data && response.data.sku_sugerido) {
                setFormProducto({
                    ...formProducto,
                    sku: response.data.sku_sugerido,
                });

                setSkuMessage({
                    show: true,
                    type: "success",
                    message: `SKU generado: ${response.data.sku_sugerido}`,
                });
            } else {
                setSkuMessage({
                    show: true,
                    type: "error",
                    message: "No se pudo generar el SKU",
                });
            }
        } catch (error) {
            console.error("Error al generar SKU:", error);
            setSkuMessage({
                show: true,
                type: "error",
                message:
                    error.response?.data?.message ||
                    "Error al comunicarse con el servidor",
            });
        }
    };

    // Validar SKU manual
    const handleValidarSku = async () => {
        if (!formProducto.sku) {
            setSkuMessage({
                show: true,
                type: "error",
                message: "Ingrese un SKU para validar",
            });
            return;
        }

        try {
            const response = await axios.post("/api/catalogs/sku/validate/", {
                sku: formProducto.sku,
            });

            if (response.data && response.data.valid) {
                setSkuMessage({
                    show: true,
                    type: "success",
                    message: "SKU válido y disponible",
                });
            } else {
                setSkuMessage({
                    show: true,
                    type: "error",
                    message:
                        response.data?.message || "SKU inválido o ya en uso",
                });
            }
        } catch (error) {
            console.error("Error al validar SKU:", error);
            setSkuMessage({
                show: true,
                type: "error",
                message:
                    error.response?.data?.message ||
                    "Error al comunicarse con el servidor",
            });
        }
    };

    // Guardar producto
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validación básica
        if (
            !formProducto.sku ||
            !formProducto.name ||
            !formProducto.unit ||
            !formProducto.category
        ) {
            setNotification({
                show: true,
                type: "error",
                message: "Complete todos los campos obligatorios",
            });
            return;
        }

        try {
            const response = await axios.post("/api/catalogs/products/", {
                ...formProducto,
                category: parseInt(formProducto.category, 10),
            });

            setNotification({
                show: true,
                type: "success",
                message: "Producto guardado correctamente",
            });

            // Resetear formulario
            setFormProducto({
                sku: "",
                name: "",
                barcode: "",
                description: "",
                unit: "",
                category: "",
            });
            setCategoriaSku("");
            setSubcategoriaSku("");
            setTipoSku("");

            // Cerrar notificación después de unos segundos
            setTimeout(() => {
                setNotification({ show: false, type: "", message: "" });
            }, 3000);
        } catch (error) {
            console.error("Error al guardar producto:", error);
            setNotification({
                show: true,
                type: "error",
                message:
                    error.response?.data?.message ||
                    "Error al guardar el producto",
            });
        }
    };

    return (
        <div
            style={{
                padding: "20px",
                maxWidth: "1200px",
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
                    Registrar Nuevo Producto
                </h1>
                <p style={{ color: "#6c757d", fontSize: "16px", margin: 0 }}>
                    Complete el formulario para agregar un nuevo producto al
                    inventario
                </p>
            </div>

            {/* Notificación general */}
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

            {/* Formulario principal */}
            <form onSubmit={handleSubmit}>
                <div
                    style={{
                        backgroundColor: "#fff",
                        borderRadius: "8px",
                        padding: "25px",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                        marginBottom: "30px",
                    }}
                >
                    <h2
                        style={{
                            fontSize: "20px",
                            margin: "0 0 20px 0",
                            color: "#2c3e50",
                            borderBottom: "1px solid #eee",
                            paddingBottom: "10px",
                        }}
                    >
                        1. Identificación y SKU del Producto
                    </h2>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fill, minmax(280px, 1fr))",
                            gap: "20px",
                            marginBottom: "20px",
                        }}
                    >
                        {/* Selector de Categoría SKU */}
                        <div>
                            <label
                                htmlFor="categoriaSku"
                                style={{
                                    display: "block",
                                    marginBottom: "5px",
                                    fontWeight: "500",
                                    color: "#495057",
                                }}
                            >
                                Categoría para SKU: *
                            </label>
                            <select
                                id="categoriaSku"
                                value={categoriaSku}
                                onChange={handleCategoriaSkuChange}
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "4px",
                                    border: "1px solid #ced4da",
                                    fontSize: "14px",
                                }}
                                required
                            >
                                <option value="">Seleccionar categoría</option>
                                {opcionesCategoriasSku.map((cat) => (
                                    <option key={cat.codigo} value={cat.codigo}>
                                        {cat.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Selector de Subcategoría SKU */}
                        <div>
                            <label
                                htmlFor="subcategoriaSku"
                                style={{
                                    display: "block",
                                    marginBottom: "5px",
                                    fontWeight: "500",
                                    color: "#495057",
                                }}
                            >
                                Subcategoría para SKU: *
                            </label>
                            <select
                                id="subcategoriaSku"
                                value={subcategoriaSku}
                                onChange={handleSubcategoriaSkuChange}
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "4px",
                                    border: "1px solid #ced4da",
                                    fontSize: "14px",
                                }}
                                disabled={!categoriaSku}
                                required
                            >
                                <option value="">
                                    {categoriaSku
                                        ? "Seleccionar subcategoría"
                                        : "Primero seleccione una categoría"}
                                </option>
                                {opcionesSubcategoriasSku.map((subcat) => (
                                    <option
                                        key={subcat.codigo}
                                        value={subcat.codigo}
                                    >
                                        {subcat.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Selector de Tipo/Material SKU */}
                        <div>
                            <label
                                htmlFor="tipoSku"
                                style={{
                                    display: "block",
                                    marginBottom: "5px",
                                    fontWeight: "500",
                                    color: "#495057",
                                }}
                            >
                                Tipo/Material para SKU: *
                            </label>
                            <select
                                id="tipoSku"
                                value={tipoSku}
                                onChange={handleTipoSkuChange}
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "4px",
                                    border: "1px solid #ced4da",
                                    fontSize: "14px",
                                }}
                                disabled={!subcategoriaSku}
                                required
                            >
                                <option value="">
                                    {subcategoriaSku
                                        ? "Seleccionar tipo/material"
                                        : "Primero seleccione una subcategoría"}
                                </option>
                                {opcionesTipoSku.map((tipo) => (
                                    <option
                                        key={tipo.codigo}
                                        value={tipo.codigo}
                                    >
                                        {tipo.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: "25px" }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "15px",
                                marginBottom: "15px",
                            }}
                        >
                            <button
                                type="button"
                                onClick={handleGenerarSku}
                                disabled={
                                    !categoriaSku ||
                                    !subcategoriaSku ||
                                    !tipoSku
                                }
                                style={{
                                    backgroundColor:
                                        !categoriaSku ||
                                        !subcategoriaSku ||
                                        !tipoSku
                                            ? "#e9ecef"
                                            : "#2c3e50",
                                    color:
                                        !categoriaSku ||
                                        !subcategoriaSku ||
                                        !tipoSku
                                            ? "#6c757d"
                                            : "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    padding: "10px 16px",
                                    fontSize: "14px",
                                    cursor:
                                        !categoriaSku ||
                                        !subcategoriaSku ||
                                        !tipoSku
                                            ? "not-allowed"
                                            : "pointer",
                                    fontWeight: "500",
                                }}
                            >
                                Generar SKU Sugerido
                            </button>

                            <div
                                style={{
                                    display: "flex",
                                    flex: 1,
                                    alignItems: "center",
                                    gap: "10px",
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <label
                                        htmlFor="sku"
                                        style={{
                                            display: "block",
                                            marginBottom: "5px",
                                            fontWeight: "500",
                                            color: "#495057",
                                        }}
                                    >
                                        SKU del Producto: *
                                    </label>
                                    <input
                                        type="text"
                                        id="sku"
                                        name="sku"
                                        value={formProducto.sku}
                                        onChange={handleProductoChange}
                                        style={{
                                            width: "100%",
                                            padding: "10px",
                                            borderRadius: "4px",
                                            border: "1px solid #ced4da",
                                            fontSize: "14px",
                                        }}
                                        placeholder="SKU único del producto"
                                        required
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleValidarSku}
                                    disabled={!formProducto.sku}
                                    style={{
                                        backgroundColor: !formProducto.sku
                                            ? "#e9ecef"
                                            : "#6c757d",
                                        color: !formProducto.sku
                                            ? "#6c757d"
                                            : "white",
                                        border: "none",
                                        borderRadius: "4px",
                                        padding: "10px 16px",
                                        marginTop: "22px",
                                        fontSize: "14px",
                                        cursor: !formProducto.sku
                                            ? "not-allowed"
                                            : "pointer",
                                        fontWeight: "500",
                                    }}
                                >
                                    Validar SKU
                                </button>
                            </div>
                        </div>

                        {/* Mensaje de SKU */}
                        {skuMessage.show && (
                            <div
                                style={{
                                    padding: "10px 15px",
                                    borderRadius: "4px",
                                    backgroundColor:
                                        skuMessage.type === "success"
                                            ? "#d4edda"
                                            : "#f8d7da",
                                    color:
                                        skuMessage.type === "success"
                                            ? "#155724"
                                            : "#721c24",
                                    border: `1px solid ${
                                        skuMessage.type === "success"
                                            ? "#c3e6cb"
                                            : "#f5c6cb"
                                    }`,
                                    fontSize: "14px",
                                }}
                            >
                                {skuMessage.message}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sección 2: Detalles del Producto */}
                <div
                    style={{
                        backgroundColor: "#fff",
                        borderRadius: "8px",
                        padding: "25px",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                        marginBottom: "30px",
                    }}
                >
                    <h2
                        style={{
                            fontSize: "20px",
                            margin: "0 0 20px 0",
                            color: "#2c3e50",
                            borderBottom: "1px solid #eee",
                            paddingBottom: "10px",
                        }}
                    >
                        2. Información General del Producto
                    </h2>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns:
                                "repeat(auto-fill, minmax(280px, 1fr))",
                            gap: "20px",
                            marginBottom: "20px",
                        }}
                    >
                        {/* Nombre del Producto */}
                        <div>
                            <label
                                htmlFor="name"
                                style={{
                                    display: "block",
                                    marginBottom: "5px",
                                    fontWeight: "500",
                                    color: "#495057",
                                }}
                            >
                                Nombre del Producto: *
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formProducto.name}
                                onChange={handleProductoChange}
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "4px",
                                    border: "1px solid #ced4da",
                                    fontSize: "14px",
                                }}
                                placeholder="Nombre completo del producto"
                                required
                            />
                        </div>

                        {/* Código de Barras */}
                        <div>
                            <label
                                htmlFor="barcode"
                                style={{
                                    display: "block",
                                    marginBottom: "5px",
                                    fontWeight: "500",
                                    color: "#495057",
                                }}
                            >
                                Código de Barras:
                            </label>
                            <input
                                type="text"
                                id="barcode"
                                name="barcode"
                                value={formProducto.barcode}
                                onChange={handleProductoChange}
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "4px",
                                    border: "1px solid #ced4da",
                                    fontSize: "14px",
                                }}
                                placeholder="Código de barras (opcional)"
                            />
                        </div>

                        {/* Unidad de Medida */}
                        <div>
                            <label
                                htmlFor="unit"
                                style={{
                                    display: "block",
                                    marginBottom: "5px",
                                    fontWeight: "500",
                                    color: "#495057",
                                }}
                            >
                                Unidad de Medida: *
                            </label>
                            <select
                                id="unit"
                                name="unit"
                                value={formProducto.unit}
                                onChange={handleProductoChange}
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "4px",
                                    border: "1px solid #ced4da",
                                    fontSize: "14px",
                                }}
                                required
                            >
                                <option value="">
                                    Seleccionar unidad de medida
                                </option>
                                {unidadesMedida.map((unidad) => (
                                    <option key={unidad} value={unidad}>
                                        {unidad}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Categoría Principal */}
                        <div>
                            <label
                                htmlFor="category"
                                style={{
                                    display: "block",
                                    marginBottom: "5px",
                                    fontWeight: "500",
                                    color: "#495057",
                                }}
                            >
                                Categoría Principal: *
                            </label>
                            <select
                                id="category"
                                name="category"
                                value={formProducto.category}
                                onChange={handleProductoChange}
                                style={{
                                    width: "100%",
                                    padding: "10px",
                                    borderRadius: "4px",
                                    border: "1px solid #ced4da",
                                    fontSize: "14px",
                                }}
                                required
                            >
                                <option value="">
                                    Seleccionar categoría principal
                                </option>
                                {categoriasPrincipales.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Descripción */}
                    <div style={{ marginBottom: "20px" }}>
                        <label
                            htmlFor="description"
                            style={{
                                display: "block",
                                marginBottom: "5px",
                                fontWeight: "500",
                                color: "#495057",
                            }}
                        >
                            Descripción:
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formProducto.description}
                            onChange={handleProductoChange}
                            style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "4px",
                                border: "1px solid #ced4da",
                                fontSize: "14px",
                                minHeight: "100px",
                                resize: "vertical",
                            }}
                            placeholder="Descripción detallada del producto (opcional)"
                        />
                    </div>
                </div>

                {/* Sección 3: Acciones del Formulario */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "15px",
                        marginTop: "20px",
                    }}
                >
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        style={{
                            backgroundColor: "#f8f9fa",
                            color: "#6c757d",
                            border: "1px solid #ced4da",
                            borderRadius: "4px",
                            padding: "10px 20px",
                            fontSize: "16px",
                            cursor: "pointer",
                            fontWeight: "500",
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        style={{
                            backgroundColor: "#2c3e50",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            padding: "10px 20px",
                            fontSize: "16px",
                            cursor: "pointer",
                            fontWeight: "500",
                        }}
                    >
                        Guardar Producto
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NuevoProductoPage;
