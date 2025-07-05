import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import inventoryService from "../services/inventoryService";
import { createProductComponent } from "../services/compositeProductsService";
import { useNavigate } from "react-router-dom";
import ProductHeader from "../components/ProductForm/ProductHeader";
import ProductNotification from "../components/ProductForm/ProductNotification";
import BasicInfoForm from "../components/ProductForm/BasicInfoForm";
import SkuConfigForm from "../components/ProductForm/SkuConfigForm";
import AdditionalInfoForm from "../components/ProductForm/AdditionalInfoForm";
import FormActions from "../components/ProductForm/FormActions";
import ComponentSearch from "../components/ProductForm/ComponentSearch";

const NuevoProductoPage = () => {
    const { authToken } = useAuth();
    const navigate = useNavigate();

    // Estado para el formulario
    const [formData, setFormData] = useState({
        name: "",
        sku: "",
        sku_categoria: "",
        sku_subcategoria: "",
        sku_tipo: "",
        category: "", // Categoría de inventario (ID numérico)
        unit: "",
        product_type: "", // Tipo de producto: simple o composite
        has_batch_management: false, // Manejo por lotes
        purchase_price: "",
        sale_price: "",
        description: "",
        margin: "",
    });

    // Estado para componentes del producto compuesto
    const [selectedComponents, setSelectedComponents] = useState([]);

    // Estado para las categorías
    const [categories, setCategories] = useState([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);

    // Estados para funcionalidad de SKU
    const [skuInfo, setSkuInfo] = useState(null);
    const [isGeneratingSku, setIsGeneratingSku] = useState(false);
    const [isValidatingSku, setIsValidatingSku] = useState(false);
    const [skuValidation, setSkuValidation] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Estado para notificaciones
    const [notification, setNotification] = useState({
        show: false,
        type: "",
        message: "",
    });

    // Estados para el sistema SKU
    const [skuCategorias, setSkuCategorias] = useState({});
    const [skuSubcategorias, setSkuSubcategorias] = useState({});
    const [skuTipos, setSkuTipos] = useState({});

    // Estado para errores de validación
    const [errors, setErrors] = useState({});

    // Cargar categorías e información del sistema SKU al iniciar
    useEffect(() => {
        const loadInitialData = async () => {
            if (!authToken) return;

            setIsLoadingCategories(true);
            try {
                // Cargar categorías primero
                const categoriesData = await inventoryService.getCategories(
                    authToken
                );
                setCategories(categoriesData || []);
                console.log(
                    "Categorías del inventario cargadas:",
                    categoriesData
                );

                // Intentar cargar información del sistema SKU para verificar requisitos
                try {
                    const skuSystemInfo =
                        await inventoryService.getSkuSystemInfo(authToken);
                    setSkuInfo(skuSystemInfo);
                    console.log("SKU System Info completo:", skuSystemInfo);

                    // Extraer las opciones del sistema SKU
                    const extractedCategorias = skuSystemInfo.categorias || {};
                    const extractedSubcategorias =
                        skuSystemInfo.subcategorias || {};
                    const extractedTipos = skuSystemInfo.tipos_materiales || {};

                    setSkuCategorias(extractedCategorias);
                    setSkuSubcategorias(extractedSubcategorias);
                    setSkuTipos(extractedTipos);

                    console.log("Datos SKU extraídos:", {
                        categorias: extractedCategorias,
                        subcategorias: extractedSubcategorias,
                        tipos: extractedTipos,
                    });
                } catch (skuError) {
                    console.error(
                        "Error al cargar información del sistema SKU:",
                        skuError
                    );
                    // No mostrar error aquí ya que puede ser que los endpoints no existan aún
                    setSkuInfo({
                        error: "Sistema SKU no disponible",
                        message:
                            "Los endpoints de SKU pueden requerir configuración adicional",
                    });
                }
            } catch (error) {
                console.error("Error al cargar datos iniciales:", error);
                setNotification({
                    show: true,
                    type: "error",
                    message: "Error al cargar categorías",
                });
                setTimeout(() => {
                    setNotification({ show: false, type: "", message: "" });
                }, 5000);
            } finally {
                setIsLoadingCategories(false);
            }
        };

        loadInitialData();
    }, [authToken]);

    // Verificar qué requisitos son necesarios para operaciones de SKU
    const getSkuRequirements = () => {
        // Primero verificar si el sistema SKU está disponible
        if (!skuInfo || skuInfo.error) {
            return {
                canOperate: false,
                missingFields: [],
                reason: "Sistema SKU no disponible o no configurado",
            };
        }

        // Basado en las pruebas de la API, se requieren: categoria, subcategoria y tipo
        const potentialRequirements = [];

        if (!formData.sku_categoria.trim()) {
            potentialRequirements.push("categoría SKU");
        }
        if (!formData.sku_subcategoria.trim()) {
            potentialRequirements.push("subcategoría SKU");
        }
        if (!formData.sku_tipo.trim()) {
            potentialRequirements.push("tipo/material SKU");
        }

        return {
            canOperate: potentialRequirements.length === 0,
            missingFields: potentialRequirements,
            reason:
                potentialRequirements.length > 0
                    ? `Faltan campos requeridos: ${potentialRequirements.join(
                          ", "
                      )}`
                    : "Todos los requisitos cumplidos",
        };
    };

    // Manejar cambios en los campos del formulario
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        // Manejar checkboxes y inputs normales
        const fieldValue = type === "checkbox" ? checked : value;
        let newFormData = { ...formData, [name]: fieldValue };

        // Calcular margen automáticamente si cambian los precios
        if (name === "purchase_price" || name === "sale_price") {
            const purchasePrice =
                parseFloat(
                    name === "purchase_price" ? value : formData.purchase_price
                ) || 0;
            const salePrice =
                parseFloat(
                    name === "sale_price" ? value : formData.sale_price
                ) || 0;

            if (purchasePrice > 0 && salePrice > 0) {
                const margin = (
                    ((salePrice - purchasePrice) / purchasePrice) *
                    100
                ).toFixed(2);
                newFormData.margin = margin;
            } else {
                newFormData.margin = "";
            }
        }

        // Limpiar subcategoría si cambia la categoría SKU
        if (name === "sku_categoria") {
            newFormData.sku_subcategoria = "";
            newFormData.sku_tipo = "";
        }

        // Limpiar tipo si cambia la subcategoría SKU
        if (name === "sku_subcategoria") {
            newFormData.sku_tipo = "";
        }

        setFormData(newFormData);

        // Limpiar error del campo modificado
        if (errors[name]) {
            setErrors({ ...errors, [name]: "" });
        }
    };

    // Manejar selección de componentes
    const handleSelectComponent = (component) => {
        setSelectedComponents((prev) => {
            // Verificar si el componente ya existe
            const existingIndex = prev.findIndex((c) => c.id === component.id);
            if (existingIndex >= 0) {
                // Actualizar el componente existente
                const updated = [...prev];
                updated[existingIndex] = component;
                return updated;
            } else {
                // Agregar nuevo componente
                return [...prev, component];
            }
        });
    };

    // Manejar eliminación de componentes
    const handleRemoveComponent = (componentId) => {
        setSelectedComponents((prev) =>
            prev.filter((c) => c.id !== componentId)
        );
    };

    // Generar siguiente SKU
    const handleGenerateNextSku = async () => {
        if (!authToken) return;

        // Verificar requisitos antes de generar
        const requirements = getSkuRequirements();
        if (!requirements.canOperate) {
            setNotification({
                show: true,
                type: "warning",
                message: `No se puede generar SKU: ${requirements.reason}`,
            });
            setTimeout(() => {
                setNotification({ show: false, type: "", message: "" });
            }, 5000);
            return;
        }

        setIsGeneratingSku(true);
        try {
            // Preparar datos para la generación si son necesarios
            const generateData = {
                categoria: formData.sku_categoria,
                subcategoria: formData.sku_subcategoria,
                tipo: formData.sku_tipo,
            };

            const result = await inventoryService.generateNextSku(
                authToken,
                generateData
            );
            setFormData({
                ...formData,
                sku: result.sku_sugerido || "",
            });
            setSkuValidation({
                valid: true,
                message: "SKU generado automáticamente",
            });
            setNotification({
                show: true,
                type: "success",
                message: "SKU generado correctamente",
            });
            setTimeout(() => {
                setNotification({ show: false, type: "", message: "" });
            }, 3000);
        } catch (error) {
            console.error("Error al generar SKU:", error);
            let errorMessage = "Error al generar SKU";

            // Manejar errores específicos
            if (error.message.includes("400")) {
                errorMessage = "Faltan datos requeridos para generar el SKU";
            } else if (error.message.includes("404")) {
                errorMessage = "Endpoint de generación de SKU no encontrado";
            } else if (error.message.includes("500")) {
                errorMessage = "Error interno del servidor";
            }

            setNotification({
                show: true,
                type: "error",
                message: errorMessage,
            });
            setTimeout(() => {
                setNotification({ show: false, type: "", message: "" });
            }, 5000);
        } finally {
            setIsGeneratingSku(false);
        }
    };

    // Función auxiliar para extraer y actualizar el número secuencial del SKU
    const incrementSkuNumber = (sku) => {
        // Formato esperado: CATEGORIA-SUBCATEGORIA-TIPO-###
        const parts = sku.split("-");
        if (parts.length !== 4) return null;

        const currentNumber = parseInt(parts[3]);
        if (isNaN(currentNumber)) return null;

        const nextNumber = currentNumber + 1;
        const paddedNumber = nextNumber.toString().padStart(3, "0");

        return `${parts[0]}-${parts[1]}-${parts[2]}-${paddedNumber}`;
    };

    // Validar SKU con auto-generación incremental
    const handleValidateSku = async () => {
        if (!authToken || !formData.sku.trim()) return;

        // Verificar si el sistema de validación está disponible
        if (skuInfo && skuInfo.error) {
            setNotification({
                show: true,
                type: "warning",
                message: "Sistema de validación de SKU no disponible",
            });
            setTimeout(() => {
                setNotification({ show: false, type: "", message: "" });
            }, 5000);
            return;
        }

        setIsValidatingSku(true);
        let currentSku = formData.sku.trim();
        let attempts = 0;
        const maxAttempts = 50; // Límite de intentos para evitar bucles infinitos

        try {
            while (attempts < maxAttempts) {
                attempts++;

                // Mostrar progreso de búsqueda
                if (attempts > 1) {
                    setNotification({
                        show: true,
                        type: "info",
                        message: `Buscando SKU disponible... Intento ${attempts}: ${currentSku}`,
                    });
                }

                const result = await inventoryService.validateSku(
                    currentSku,
                    authToken
                );

                if (result.valido && result.disponible) {
                    // SKU válido encontrado
                    setFormData({ ...formData, sku: currentSku });
                    setSkuValidation({
                        valid: true,
                        message:
                            attempts === 1
                                ? "SKU válido y disponible"
                                : `SKU encontrado después de ${attempts} intentos`,
                    });
                    setNotification({
                        show: true,
                        type: "success",
                        message:
                            attempts === 1
                                ? "SKU válido confirmado"
                                : `SKU válido encontrado: ${currentSku} (intento ${attempts})`,
                    });
                    setTimeout(() => {
                        setNotification({ show: false, type: "", message: "" });
                    }, 4000);
                    break;
                } else {
                    // SKU no válido o no disponible, intentar con el siguiente número
                    if (attempts === 1) {
                        setNotification({
                            show: true,
                            type: "warning",
                            message: `SKU ${currentSku} no disponible. Buscando alternativa...`,
                        });
                    }

                    const nextSku = incrementSkuNumber(currentSku);
                    if (!nextSku) {
                        // No se puede incrementar el SKU (formato inválido)
                        setSkuValidation({
                            valid: false,
                            message:
                                "Formato de SKU inválido para auto-incremento",
                        });
                        setNotification({
                            show: true,
                            type: "error",
                            message:
                                "No se puede generar SKU automáticamente. Formato inválido.",
                        });
                        break;
                    }

                    currentSku = nextSku;
                }
            }

            if (attempts >= maxAttempts) {
                setSkuValidation({
                    valid: false,
                    message: `No se encontró SKU disponible después de ${maxAttempts} intentos`,
                });
                setNotification({
                    show: true,
                    type: "error",
                    message: `No se encontró un SKU disponible después de ${maxAttempts} intentos. Pruebe con otra configuración.`,
                });
            }

            setTimeout(() => {
                setNotification({ show: false, type: "", message: "" });
            }, 5000);
        } catch (error) {
            console.error("Error al validar SKU:", error);
            let errorMessage = "Error al validar SKU";

            if (error.message.includes("404")) {
                errorMessage = "Endpoint de validación de SKU no encontrado";
            }

            setSkuValidation({ valid: false, message: errorMessage });
            setNotification({
                show: true,
                type: "error",
                message: errorMessage,
            });
            setTimeout(() => {
                setNotification({ show: false, type: "", message: "" });
            }, 5000);
        } finally {
            setIsValidatingSku(false);
        }
    };

    // Calcular margen automáticamente cuando cambien los precios
    const calculateMargin = () => {
        const purchasePrice = parseFloat(formData.purchase_price) || 0;
        const salePrice = parseFloat(formData.sale_price) || 0;

        if (purchasePrice > 0 && salePrice > 0) {
            return (
                ((salePrice - purchasePrice) / purchasePrice) *
                100
            ).toFixed(1);
        }
        return "0.0";
    };

    // Manejar envío del formulario
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!authToken) {
            setNotification({
                show: true,
                type: "error",
                message: "No hay token de autenticación disponible",
            });
            return;
        }

        // Validar campos requeridos
        const requiredFields = [
            { field: "name", label: "Nombre del producto" },
            { field: "sku", label: "SKU" },
            { field: "category", label: "Categoría de inventario" },
            { field: "sku_categoria", label: "Categoría del producto" },
            { field: "product_type", label: "Tipo de producto" },
            { field: "unit", label: "Unidad de medida" },
            { field: "purchase_price", label: "Precio de compra" },
            { field: "sale_price", label: "Precio de venta" },
        ];

        // Validación adicional para productos compuestos
        if (
            formData.product_type === "composite" &&
            selectedComponents.length === 0
        ) {
            setNotification({
                show: true,
                type: "error",
                message:
                    "Los productos compuestos deben tener al menos un componente",
            });
            setTimeout(() => {
                setNotification({ show: false, type: "", message: "" });
            }, 5000);
            return;
        }

        const missingFields = requiredFields.filter(
            ({ field }) =>
                !formData[field] || formData[field].toString().trim() === ""
        );

        if (missingFields.length > 0) {
            setNotification({
                show: true,
                type: "error",
                message: `Faltan campos requeridos: ${missingFields
                    .map((f) => f.label)
                    .join(", ")}`,
            });
            setTimeout(() => {
                setNotification({ show: false, type: "", message: "" });
            }, 5000);
            return;
        }

        setIsSubmitting(true);

        try {
            // Preparar datos del producto para la API
            const productData = {
                name: formData.name.trim(),
                sku: formData.sku.trim(),
                category: parseInt(formData.category), // Usar la categoría de inventario como categoría del producto
                unit: formData.unit,
                product_type: formData.product_type,
                has_batch_management: formData.has_batch_management, // Manejo por lotes
                purchase_price: parseFloat(formData.purchase_price),
                sale_price: parseFloat(formData.sale_price),
                description: formData.description
                    ? formData.description.trim()
                    : "",
            };

            // Validar que category sea un número válido
            if (isNaN(productData.category) || productData.category <= 0) {
                setNotification({
                    show: true,
                    type: "error",
                    message: "La categoría de inventario debe ser seleccionada",
                });
                setTimeout(() => {
                    setNotification({ show: false, type: "", message: "" });
                }, 5000);
                return;
            }

            console.log("Datos del producto a enviar:", productData);

            // Crear el producto
            const productId = await inventoryService.createProduct(
                productData,
                authToken
            );

            console.log("Producto creado exitosamente:", productId);

            // Si es un producto compuesto, agregar los componentes
            if (
                formData.product_type === "composite" &&
                selectedComponents.length > 0
            ) {
                try {
                    console.log(
                        "Agregando componentes al producto compuesto..."
                    );

                    // Crear cada componente individualmente según la documentación de la API
                    for (const component of selectedComponents) {
                        const componentData = {
                            composite_product: productId.id, // ID del producto padre
                            component_product: component.id, // ID del producto componente
                            quantity: component.quantity, // Cantidad del componente
                        };

                        console.log("Creando componente:", componentData);

                        await createProductComponent(componentData, authToken);
                        console.log(
                            `Componente ${component.name} agregado exitosamente`
                        );
                    }

                    console.log("Todos los componentes agregados exitosamente");
                } catch (componentError) {
                    console.error(
                        "Error al agregar componentes:",
                        componentError
                    );
                    // No fallar la creación del producto si falla la adición de componentes
                    setNotification({
                        show: true,
                        type: "warning",
                        message:
                            "Producto creado pero hubo un problema al agregar los componentes. Puedes agregarlos manualmente más tarde.",
                    });
                }
            }

            // Mostrar notificación de éxito
            setNotification({
                show: true,
                type: "success",
                message: `Producto "${productData.name}" creado exitosamente con SKU: ${productData.sku}`,
            });

            // Limpiar el formulario después del éxito
            setFormData({
                name: "",
                sku: "",
                sku_categoria: "",
                sku_subcategoria: "",
                sku_tipo: "",
                category: "",
                unit: "",
                product_type: "",
                has_batch_management: false,
                purchase_price: "",
                sale_price: "",
                description: "",
                margin: "",
            });

            // Limpiar componentes seleccionados
            setSelectedComponents([]);

            // Limpiar validación de SKU
            setSkuValidation(null);

            // Redirigir al inventario después de 3 segundos
            setTimeout(() => {
                setNotification({ show: false, type: "", message: "" });
                navigate("/inventario");
            }, 3000);
        } catch (error) {
            console.error("Error al crear producto:", error);

            let errorMessage = "Error al crear el producto";

            // Manejar diferentes tipos de errores
            if (error.message) {
                // Si el error tiene un mensaje específico de la API
                errorMessage = error.message;
            } else if (error.response && error.response.data) {
                // Si hay datos de error de la respuesta
                errorMessage =
                    typeof error.response.data === "string"
                        ? error.response.data
                        : JSON.stringify(error.response.data);
            }

            setNotification({
                show: true,
                type: "error",
                message: errorMessage,
            });

            setTimeout(() => {
                setNotification({ show: false, type: "", message: "" });
            }, 8000);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Obtener subcategorías disponibles para la categoría seleccionada
    const getAvailableSubcategorias = () => {
        // Debug: mostrar los datos disponibles
        console.log("Datos SKU disponibles:", {
            formData_sku_categoria: formData.sku_categoria,
            skuSubcategorias: skuSubcategorias,
            skuSubcategorias_keys: Object.keys(skuSubcategorias),
        });

        if (!formData.sku_categoria || !skuSubcategorias) {
            console.log(
                "No hay categoría seleccionada o no hay datos de subcategorías"
            );
            return {};
        }

        // Buscar subcategorías por la clave de la categoría seleccionada
        const selectedCategorySubcategorias =
            skuSubcategorias[formData.sku_categoria];

        if (!selectedCategorySubcategorias) {
            console.log(
                `No se encontraron subcategorías para la categoría: ${formData.sku_categoria}`
            );
            // Si no encontramos por clave exacta, intentar buscar en todas las subcategorías
            // por si la estructura es diferente
            const allSubcategorias = {};
            Object.values(skuSubcategorias).forEach((subcatGroup) => {
                if (typeof subcatGroup === "object") {
                    Object.assign(allSubcategorias, subcatGroup);
                }
            });

            if (Object.keys(allSubcategorias).length > 0) {
                console.log(
                    "Usando todas las subcategorías disponibles como fallback:",
                    allSubcategorias
                );
                return allSubcategorias;
            }

            return {};
        }

        console.log(
            "Subcategorías encontradas:",
            selectedCategorySubcategorias
        );
        return selectedCategorySubcategorias;
    };

    // Obtener tipos/materiales disponibles para la subcategoría seleccionada
    const getAvailableTipos = () => {
        console.log("Datos de tipos disponibles:", {
            formData_sku_subcategoria: formData.sku_subcategoria,
            skuTipos: skuTipos,
            skuTipos_keys: Object.keys(skuTipos),
        });

        // Para tipos, mostramos todos los disponibles ya que pueden ser independientes de la subcategoría
        // O pueden estar filtrados por subcategoría si la API los devuelve así
        return skuTipos || {};
    };

    // Obtener categorías SKU disponibles
    const getAvailableSkuCategorias = () => {
        console.log("Datos de categorías SKU disponibles:", {
            skuCategorias: skuCategorias,
            skuCategorias_keys: Object.keys(skuCategorias),
            categories_from_inventory: categories,
        });

        // Si tenemos categorías del sistema SKU, las usamos
        if (skuCategorias && Object.keys(skuCategorias).length > 0) {
            return skuCategorias;
        }

        // Si no tenemos categorías SKU, usamos las categorías regulares del inventario
        // Pero las convertimos al formato esperado (objeto con id como clave)
        const categoriesAsObject = {};
        categories.forEach((category) => {
            categoriesAsObject[category.id] = category.name;
        });

        console.log(
            "Usando categorías del inventario convertidas:",
            categoriesAsObject
        );
        return categoriesAsObject;
    };

    return (
        <>
            {/* CSS global para mejorar el diseño */}
            <style>
                {`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.8;
            }
          }
          
          .form-section {
            animation: fadeInUp 0.6s ease-out;
          }
          
          .form-section:nth-child(2) {
            animation-delay: 0.1s;
          }
          
          .form-section:nth-child(3) {
            animation-delay: 0.2s;
          }
          
          .form-section:nth-child(4) {
            animation-delay: 0.3s;
          }
          
          @media (max-width: 768px) {
            .product-form-grid {
              grid-template-columns: 1fr !important;
              gap: 15px !important;
            }
          }
        `}
            </style>

            <div
                style={{
                    padding: "32px",
                    maxWidth: "1400px",
                    margin: "0 auto",
                    fontFamily:
                        "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                    backgroundColor: "#f5f6fa",
                    minHeight: "100vh",
                }}
            >
                {/* Encabezado mejorado */}
                <div
                    style={{
                        marginBottom: "40px",
                        background:
                            "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
                        borderRadius: "16px",
                        padding: "32px",
                        color: "white",
                        boxShadow: "0 8px 32px rgba(44, 62, 80, 0.15)",
                        position: "relative",
                        overflow: "hidden",
                    }}
                >
                    {/* Patrones decorativos de fondo */}
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            width: "200px",
                            height: "200px",
                            background: "rgba(255, 255, 255, 0.05)",
                            borderRadius: "50%",
                            transform: "translate(50%, -50%)",
                        }}
                    ></div>
                    <div
                        style={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            width: "150px",
                            height: "150px",
                            background: "rgba(255, 255, 255, 0.03)",
                            borderRadius: "50%",
                            transform: "translate(-50%, 50%)",
                        }}
                    ></div>

                    <div style={{ position: "relative", zIndex: 1 }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "16px",
                                marginBottom: "16px",
                            }}
                        >
                            <div
                                style={{
                                    backgroundColor:
                                        "rgba(255, 255, 255, 0.15)",
                                    borderRadius: "12px",
                                    padding: "16px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <span style={{ fontSize: "32px" }}>➕</span>
                            </div>
                            <div>
                                <h1
                                    style={{
                                        color: "white",
                                        fontSize: "32px",
                                        fontWeight: "700",
                                        margin: "0 0 4px 0",
                                        letterSpacing: "-0.5px",
                                    }}
                                >
                                    Nuevo Producto
                                </h1>
                                <p
                                    style={{
                                        color: "rgba(255, 255, 255, 0.9)",
                                        fontSize: "16px",
                                        margin: 0,
                                        fontWeight: "400",
                                    }}
                                >
                                    Registra un nuevo producto en el inventario
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Formulario */}
                <div
                    style={{
                        backgroundColor: "#ffffff",
                        borderRadius: "16px",
                        padding: "40px",
                        boxShadow:
                            "0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.1)",
                        border: "1px solid #e9ecef",
                        position: "relative",
                    }}
                >
                    <form onSubmit={handleSubmit}>
                        {/* Información Básica del Producto */}
                        <div className="form-section">
                            <BasicInfoForm
                                formData={formData}
                                handleInputChange={handleInputChange}
                                categories={categories}
                                isLoadingCategories={isLoadingCategories}
                            />
                        </div>

                        {/* Búsqueda de Componentes (solo si es producto compuesto) */}
                        {formData.product_type === "composite" && (
                            <div className="form-section">
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        marginBottom: "24px",
                                        padding: "16px 20px",
                                        background:
                                            "linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)",
                                        borderRadius: "12px",
                                        color: "white",
                                    }}
                                >
                                    <div
                                        style={{
                                            background:
                                                "rgba(255, 255, 255, 0.2)",
                                            width: "40px",
                                            height: "40px",
                                            borderRadius: "10px",
                                            marginRight: "12px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            boxShadow:
                                                "0 2px 8px rgba(0, 0, 0, 0.1)",
                                        }}
                                    >
                                        <span
                                            style={{
                                                color: "white",
                                                fontSize: "24px",
                                            }}
                                        >
                                            🔧
                                        </span>
                                    </div>
                                    <div>
                                        <h3
                                            style={{
                                                color: "white",
                                                fontSize: "20px",
                                                fontWeight: "600",
                                                margin: 0,
                                                letterSpacing: "-0.3px",
                                            }}
                                        >
                                            Componentes del Producto
                                        </h3>
                                        <p
                                            style={{
                                                color: "rgba(255, 255, 255, 0.9)",
                                                fontSize: "14px",
                                                margin: "4px 0 0 0",
                                            }}
                                        >
                                            Selecciona los productos que forman
                                            parte de este kit
                                        </p>
                                    </div>
                                </div>

                                <ComponentSearch
                                    onSelectComponent={handleSelectComponent}
                                    selectedComponents={selectedComponents}
                                    onRemoveComponent={handleRemoveComponent}
                                />
                            </div>
                        )}

                        {/* SKU y Configuración */}
                        <div className="form-section">
                            <SkuConfigForm
                                formData={formData}
                                handleInputChange={handleInputChange}
                                categories={categories}
                                isLoadingCategories={isLoadingCategories}
                                getAvailableSubcategorias={
                                    getAvailableSubcategorias
                                }
                                getAvailableTipos={getAvailableTipos}
                                getAvailableSkuCategorias={
                                    getAvailableSkuCategorias
                                }
                                skuValidation={skuValidation}
                                handleGenerateNextSku={handleGenerateNextSku}
                                isGeneratingSku={isGeneratingSku}
                                getSkuRequirements={getSkuRequirements}
                                handleValidateSku={handleValidateSku}
                                isValidatingSku={isValidatingSku}
                                skuInfo={skuInfo}
                            />
                        </div>

                        {/* Información Adicional del Producto */}
                        <div className="form-section">
                            <AdditionalInfoForm
                                formData={formData}
                                handleInputChange={handleInputChange}
                                calculateMargin={calculateMargin}
                            />
                        </div>

                        {/* Notificación */}
                        <div style={{ marginBottom: "20px" }}>
                            <ProductNotification notification={notification} />
                        </div>

                        {/* Botones */}
                        <div className="form-section">
                            <FormActions
                                isSubmitting={isSubmitting}
                                navigate={navigate}
                            />
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default NuevoProductoPage;
