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
        requires_batch_control: false, // Manejo por lotes
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

    // Estado para errores críticos que pueden bloquear el renderizado
    const [criticalError, setCriticalError] = useState(null);

    // Cargar categorías e información del sistema SKU al iniciar
    useEffect(() => {
        const loadInitialData = async () => {
            if (!authToken) {
                console.log("❌ No hay authToken disponible");
                return;
            }

            console.log("🚀 Iniciando carga de datos iniciales...");
            setIsLoadingCategories(true);

            try {
                // Cargar categorías primero - ESTO ES CRÍTICO
                console.log("📡 Cargando categorías...");
                const categoriesData = await inventoryService.getCategories(
                    authToken
                );
                console.log("✅ Categorías cargadas:", categoriesData);

                if (!categoriesData || categoriesData.length === 0) {
                    throw new Error(
                        "No se encontraron categorías en el sistema"
                    );
                }

                setCategories(categoriesData);
                console.log(
                    "📊 Categorías del inventario cargadas:",
                    categoriesData?.length || 0,
                    "categorías"
                );
            } catch (error) {
                console.error("❌ Error crítico al cargar categorías:", error);
                setCriticalError(error.message);
                setNotification({
                    show: true,
                    type: "error",
                    message: "Error al cargar categorías: " + error.message,
                });
                setTimeout(() => {
                    setNotification({ show: false, type: "", message: "" });
                }, 5000);
                return; // Salir temprano si no podemos cargar categorías
            }

            // Cargar información del sistema SKU - ESTO NO ES CRÍTICO
            try {
                console.log("📡 Cargando información del sistema SKU...");
                const skuSystemInfo = await inventoryService.getSkuSystemInfo(
                    authToken
                );
                console.log("✅ SKU System Info cargado:", skuSystemInfo);
                setSkuInfo(skuSystemInfo);

                // Extraer las opciones del sistema SKU
                // Los datos vienen como arrays de objetos, necesitamos convertirlos al formato esperado
                const extractedCategorias = {};
                const extractedSubcategorias = {};
                const extractedTipos = {};

                // Convertir categorías de array a objeto
                if (
                    skuSystemInfo.categorias &&
                    Array.isArray(skuSystemInfo.categorias)
                ) {
                    skuSystemInfo.categorias.forEach((cat) => {
                        extractedCategorias[cat.id] = cat.name; // Usar ID en lugar de code
                    });
                }

                // Convertir subcategorías de array a objeto
                if (
                    skuSystemInfo.subcategorias &&
                    Array.isArray(skuSystemInfo.subcategorias)
                ) {
                    skuSystemInfo.subcategorias.forEach((subcat) => {
                        extractedSubcategorias[subcat.id] = subcat.name; // Usar ID en lugar de code
                    });
                }

                // Convertir tipos de array a objeto
                if (skuSystemInfo.tipos && Array.isArray(skuSystemInfo.tipos)) {
                    skuSystemInfo.tipos.forEach((tipo) => {
                        extractedTipos[tipo.id] = tipo.name; // Usar ID en lugar de code
                    });
                }

                setSkuCategorias(extractedCategorias);
                setSkuSubcategorias(extractedSubcategorias);
                setSkuTipos(extractedTipos);

                console.log("📊 Datos SKU extraídos:", {
                    categorias: extractedCategorias,
                    subcategorias: extractedSubcategorias,
                    tipos: extractedTipos,
                });
            } catch (skuError) {
                console.error(
                    "⚠️ Error al cargar información del sistema SKU (no crítico):",
                    skuError
                );
                // No mostrar error aquí ya que puede ser que los endpoints no existan aún
                setSkuInfo({
                    error: "Sistema SKU no disponible",
                    message:
                        "Los endpoints de SKU pueden requerir configuración adicional",
                });
            } finally {
                console.log("🏁 Finalizando carga de datos iniciales");
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

        // 🔍 DEBUG: Agregar logs para verificar el evento recibido
        console.log("🔍 DEBUG - Evento recibido en handleInputChange:", {
            name,
            value,
            type,
            checked,
        });

        // Manejar checkboxes y inputs normales
        const fieldValue = type === "checkbox" ? checked : value;
        let newFormData = { ...formData, [name]: fieldValue };

        // 🔍 DEBUG: Agregar logs para verificar el valor asignado
        console.log("🔍 DEBUG - Valor asignado para", name, ":", fieldValue);
        console.log("🔍 DEBUG - Tipo del valor:", typeof fieldValue);

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

        // 🔍 DEBUG: Agregar logs para verificar el estado actualizado
        console.log(
            "🔍 DEBUG - Estado actualizado del formulario:",
            newFormData
        );

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
                requires_batch_control: formData.requires_batch_control, // Manejo por lotes
                purchase_price: parseFloat(formData.purchase_price),
                sale_price: parseFloat(formData.sale_price),
                description: formData.description
                    ? formData.description.trim()
                    : "",
            };

            // 🔍 DEBUG: Agregar logs para verificar el campo requires_batch_control
            console.log("🔍 DEBUG - Estado actual del formulario:", formData);
            console.log(
                "🔍 DEBUG - Campo requires_batch_control en formData:",
                formData.requires_batch_control
            );
            console.log(
                "🔍 DEBUG - Tipo de requires_batch_control:",
                typeof formData.requires_batch_control
            );
            console.log("🔍 DEBUG - Datos del producto a enviar:", productData);
            console.log(
                "🔍 DEBUG - Campo requires_batch_control en productData:",
                productData.requires_batch_control
            );
            console.log(
                "🔍 DEBUG - Tipo de requires_batch_control en productData:",
                typeof productData.requires_batch_control
            );

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
                requires_batch_control: false,
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
        console.log("Datos de subcategorías disponibles:", {
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

        // Para las subcategorías, filtramos por la categoría seleccionada
        // usando el category_id del objeto subcategoría
        const filteredSubcategorias = {};

        Object.entries(skuSubcategorias).forEach(([id, name]) => {
            // Buscar la subcategoría en los datos originales para obtener el category_id
            if (skuInfo && skuInfo.subcategorias) {
                const subcatData = skuInfo.subcategorias.find(
                    (subcat) => subcat.id === parseInt(id)
                );
                if (subcatData && subcatData.category_id) {
                    // Convertir el category_id a string para comparación
                    const categoryIdStr = String(subcatData.category_id);
                    const selectedCategoryIdStr = String(
                        formData.sku_categoria
                    );

                    if (categoryIdStr === selectedCategoryIdStr) {
                        filteredSubcategorias[id] = name;
                    }
                }
            }
        });

        console.log(
            "Subcategorías filtradas para categoría",
            formData.sku_categoria,
            ":",
            filteredSubcategorias
        );
        return filteredSubcategorias;
    };

    // Obtener tipos/materiales disponibles para la subcategoría seleccionada
    const getAvailableTipos = () => {
        console.log("Datos de tipos disponibles:", {
            formData_sku_subcategoria: formData.sku_subcategoria,
            skuTipos: skuTipos,
            skuTipos_keys: Object.keys(skuTipos),
        });

        if (!formData.sku_subcategoria || !skuTipos) {
            console.log(
                "No hay subcategoría seleccionada o no hay datos de tipos"
            );
            return {};
        }

        // Para los tipos, filtramos por la subcategoría seleccionada
        // usando el subcategory_id del objeto tipo
        const filteredTipos = {};

        Object.entries(skuTipos).forEach(([id, name]) => {
            // Buscar el tipo en los datos originales para obtener el subcategory_id
            if (skuInfo && skuInfo.tipos) {
                const tipoData = skuInfo.tipos.find(
                    (tipo) => tipo.id === parseInt(id)
                );
                if (tipoData && tipoData.subcategory_id) {
                    // Convertir el subcategory_id a string para comparación
                    const subcategoryIdStr = String(tipoData.subcategory_id);
                    const selectedSubcategoryIdStr = String(
                        formData.sku_subcategoria
                    );

                    if (subcategoryIdStr === selectedSubcategoryIdStr) {
                        filteredTipos[id] = name;
                    }
                }
            }
        });

        console.log(
            "Tipos filtrados para subcategoría",
            formData.sku_subcategoria,
            ":",
            filteredTipos
        );
        return filteredTipos;
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

    // Debug del estado de renderizado
    console.log("🎨 Renderizando NuevoProductoPage:", {
        isLoadingCategories,
        categoriesCount: categories?.length || 0,
        hasAuthToken: !!authToken,
        hasNotification: notification.show,
        criticalError,
    });

    // Si hay un error crítico, mostrar un mensaje de error
    if (criticalError) {
        return (
            <div
                style={{
                    padding: "32px",
                    maxWidth: "800px",
                    margin: "0 auto",
                    backgroundColor: "#f8f9fa",
                    minHeight: "100vh",
                }}
            >
                <div
                    style={{
                        backgroundColor: "#f8d7da",
                        color: "#721c24",
                        padding: "24px",
                        borderRadius: "12px",
                        border: "1px solid #f5c6cb",
                        textAlign: "center",
                    }}
                >
                    <h2>❌ Error al cargar la página</h2>
                    <p>
                        Ocurrió un error crítico al cargar los datos necesarios:
                    </p>
                    <code
                        style={{
                            display: "block",
                            margin: "16px 0",
                            padding: "12px",
                            backgroundColor: "rgba(0,0,0,0.1)",
                            borderRadius: "6px",
                        }}
                    >
                        {criticalError}
                    </code>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: "12px 24px",
                            backgroundColor: "#721c24",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "16px",
                            marginTop: "16px",
                        }}
                    >
                        🔄 Recargar página
                    </button>
                </div>
            </div>
        );
    }

    // Si está cargando, mostrar un indicador de carga
    if (isLoadingCategories) {
        return (
            <div
                style={{
                    padding: "32px",
                    maxWidth: "800px",
                    margin: "0 auto",
                    backgroundColor: "#f8f9fa",
                    minHeight: "100vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                }}
            >
                <div style={{ textAlign: "center" }}>
                    <div
                        style={{
                            fontSize: "48px",
                            marginBottom: "16px",
                            animation: "pulse 2s infinite",
                        }}
                    >
                        ⏳
                    </div>
                    <h2 style={{ color: "#2c3e50", marginBottom: "8px" }}>
                        Cargando datos...
                    </h2>
                    <p style={{ color: "#6c757d" }}>
                        Obteniendo categorías y configuraciones del sistema
                    </p>
                </div>
            </div>
        );
    }

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
                    {/* Debug información del formulario */}
                    {console.log(
                        "🔍 Estado del formulario antes de renderizar:",
                        {
                            formData,
                            categories,
                            isLoadingCategories,
                        }
                    )}

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
