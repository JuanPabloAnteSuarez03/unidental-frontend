import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import inventoryService, {
    getSkuCategories,
    getSkuSubcategories,
    getSkuTypes,
    createSkuCategory,
    createSkuSubcategory,
    createSkuType,
} from "../services/inventoryService";
import { createProductComponent } from "../services/compositeProductsService";
import { useNavigate } from "react-router-dom";
import ProductHeader from "../components/ProductForm/ProductHeader";
import ProductNotification from "../components/ProductForm/ProductNotification";
import BasicInfoForm from "../components/ProductForm/BasicInfoForm";
import SkuConfigForm from "../components/ProductForm/SkuConfigForm";
import SkuGenerationForm from "../components/ProductForm/SkuGenerationForm";
import AdditionalInfoForm from "../components/ProductForm/AdditionalInfoForm";
import FormActions from "../components/ProductForm/FormActions";
import ComponentSearch from "../components/ProductForm/ComponentSearch";
import CreateSkuEntityModal from "../components/Common/CreateSkuEntityModal";
import Modal from "../components/Common/Modal"; // Asume que tienes un componente Modal, si no, lo creo inline
import ProductSearchSelector from "../components/Common/ProductSearchSelector";

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
        requires_batch_control: false, // Manejo por lotes
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

    // Estados para el nuevo sistema SKU
    const [skuCategories, setSkuCategories] = useState([]);
    const [skuSubcategories, setSkuSubcategories] = useState([]);
    const [skuTypes, setSkuTypes] = useState([]);
    const [isLoadingSkuData, setIsLoadingSkuData] = useState(false);

    // Estado para errores de validación
    const [errors, setErrors] = useState({});

    // Estados para el modal de creación de entidades SKU
    const [createModal, setCreateModal] = useState({
        isOpen: false,
        entityType: null,
        parentData: null,
        isSubmitting: false,
    });

    // Estado para mostrar el modal de conversión
    const [showConversionModal, setShowConversionModal] = useState(false);
    const [lastCreatedProduct, setLastCreatedProduct] = useState(null);
    const [conversionForm, setConversionForm] = useState({
      to_product: null,
      conversion_rate: 1,
      is_reversible: false,
    });
    const [isSubmittingConversion, setIsSubmittingConversion] = useState(false);

    // Estado para mensaje de actualización
    const [refreshMsg, setRefreshMsg] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);

    // Cargar categorías e información del sistema SKU al iniciar
    useEffect(() => {
        const loadInitialData = async () => {
            if (!authToken) return;

            setIsLoadingCategories(true);
            try {
                // Cargar ambas categorías en paralelo para mayor velocidad
                const [categoriesData, skuCategoriesData] = await Promise.all([
                    inventoryService.getCategories(authToken),
                    getSkuCategories(authToken),
                ]);

                setCategories(categoriesData || []);
                setSkuCategories(skuCategoriesData?.results || []);

                // Cargar información del sistema SKU para validaciones (opcional)
                try {
                    const skuSystemInfo =
                        await inventoryService.getSkuSystemInfo(authToken);
                    setSkuInfo(skuSystemInfo);
                } catch (skuError) {
                    console.warn(
                        "Sistema SKU legacy no disponible:",
                        skuError.message
                    );
                    setSkuInfo({
                        error: "Sistema SKU legacy no disponible",
                        message: "Usando nuevos endpoints de categorías",
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

    // Cargar subcategorías cuando cambia la categoría SKU (con debounce implícito)
    useEffect(() => {
        let isCancelled = false;

        const loadSubcategories = async () => {
            if (!authToken || !formData.sku_categoria) {
                setSkuSubcategories([]);
                return;
            }

            setIsLoadingSkuData(true);
            try {
                const subcategoriesData = await getSkuSubcategories(
                    formData.sku_categoria,
                    authToken
                );

                // Evitar actualizar el estado si el componente se desmontó o la categoría cambió
                if (!isCancelled) {
                    setSkuSubcategories(subcategoriesData?.results || []);
                }
            } catch (error) {
                if (!isCancelled) {
                    console.error("Error al cargar subcategorías SKU:", error);
                    setSkuSubcategories([]);
                }
            } finally {
                if (!isCancelled) {
                    setIsLoadingSkuData(false);
                }
            }
        };

        loadSubcategories();

        // Cleanup function para cancelar la operación si cambia la dependencia
        return () => {
            isCancelled = true;
        };
    }, [authToken, formData.sku_categoria]);

    // Cargar tipos cuando cambia la subcategoría SKU (con debounce implícito)
    useEffect(() => {
        let isCancelled = false;

        const loadTypes = async () => {
            if (!authToken || !formData.sku_subcategoria) {
                setSkuTypes([]);
                return;
            }

            setIsLoadingSkuData(true);
            try {
                const typesData = await getSkuTypes(
                    formData.sku_subcategoria,
                    authToken
                );

                // Evitar actualizar el estado si el componente se desmontó o la subcategoría cambió
                if (!isCancelled) {
                    setSkuTypes(typesData?.results || []);
                }
            } catch (error) {
                if (!isCancelled) {
                    console.error("Error al cargar tipos SKU:", error);
                    setSkuTypes([]);
                }
            } finally {
                if (!isCancelled) {
                    setIsLoadingSkuData(false);
                }
            }
        };

        loadTypes();

        // Cleanup function para cancelar la operación si cambia la dependencia
        return () => {
            isCancelled = true;
        };
    }, [authToken, formData.sku_subcategoria]);

    // Verificar qué requisitos son necesarios para operaciones de SKU
    const getSkuRequirements = useCallback(() => {
        // Primero verificar si el sistema SKU está disponible
        if (!skuInfo || skuInfo.error) {
            return {
                canOperate: false,
                missingFields: [],
                reason: "Sistema SKU no disponible o no configurado",
            };
        }

        // Basado en las pruebas de la API, se requieren: category_id, subcategory_id y type_id
        const potentialRequirements = [];

        if (!formData.sku_categoria || !String(formData.sku_categoria).trim()) {
            potentialRequirements.push("categoría SKU");
        }
        if (
            !formData.sku_subcategoria ||
            !String(formData.sku_subcategoria).trim()
        ) {
            potentialRequirements.push("subcategoría SKU");
        }
        if (!formData.sku_tipo || !String(formData.sku_tipo).trim()) {
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
    }, [
        formData.sku_categoria,
        formData.sku_subcategoria,
        formData.sku_tipo,
        skuInfo,
    ]);

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

        // Limpiar campos dependientes cuando cambian los campos padre
        if (name === "sku_categoria") {
            newFormData.sku_subcategoria = "";
            newFormData.sku_tipo = "";
        }

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
            // Preparar datos para la generación usando el nuevo formato con IDs
            const generateData = {
                category_id: formData.sku_categoria,
                subcategory_id: formData.sku_subcategoria,
                type_id: formData.sku_tipo,
            };

            const result = await inventoryService.generateNextSku(
                authToken,
                generateData
            );

            if (result.next_sku) {
                setFormData((prev) => ({ ...prev, sku: result.next_sku }));
                setSkuValidation({
                    valid: true,
                    message: "SKU generado automáticamente",
                });
                setNotification({
                    show: true,
                    type: "success",
                    message: `SKU generado: ${result.next_sku}`,
                });
                setTimeout(() => {
                    setNotification({ show: false, type: "", message: "" });
                }, 4000);
            } else {
                setNotification({
                    show: true,
                    type: "error",
                    message: result.error || "No se pudo generar el SKU",
                });
            }
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

    // El margen se calculará automáticamente en el backend basado en los costos promedio
    // o se puede establecer manualmente como porcentaje de ganancia deseado

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
            { field: "unit", label: "Unidad de medida" },
            { field: "sale_price", label: "Precio de venta" },
        ];

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
                category: parseInt(formData.category),
                unit: formData.unit,
                product_type: "simple", // Siempre simple
                requires_batch_control: formData.requires_batch_control,
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

            // Crear el producto
            const productId = await inventoryService.createProduct(
                productData,
                authToken
            );

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
                requires_batch_control: false,
                sale_price: "",
                description: "",
                margin: "",
            });

            // Limpiar validación de SKU
            setSkuValidation(null);

            setLastCreatedProduct(productId); // Guarda el producto recién creado
            setShowConversionModal(true); // Muestra el modal de conversión

        } catch (error) {
            console.error("Error al crear producto:", error);

            let errorMessage = "Error al crear el producto";

            if (error.message) {
                errorMessage = error.message;
            } else if (error.response && error.response.data) {
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
        return skuSubcategories || [];
    };

    // Obtener tipos/materiales disponibles para la subcategoría seleccionada
    const getAvailableTipos = () => {
        return skuTypes || [];
    };

    // Obtener categorías SKU disponibles
    const getAvailableSkuCategorias = () => {
        return skuCategories || [];
    };

    // Función para abrir el modal de creación de categoría SKU
    const handleCreateSkuCategory = () => {
        setCreateModal({
            isOpen: true,
            entityType: "category",
            parentData: null,
            isSubmitting: false,
        });
    };

    // Función para abrir el modal de creación de subcategoría SKU
    const handleCreateSkuSubcategory = () => {
        if (!formData.sku_categoria) {
            setNotification({
                show: true,
                type: "warning",
                message:
                    "Primero debe seleccionar una categoría para crear una subcategoría",
            });
            setTimeout(() => {
                setNotification({ show: false, type: "", message: "" });
            }, 5000);
            return;
        }

        const selectedCategory = skuCategories.find(
            (cat) => cat.id == formData.sku_categoria
        ); // Usar == para comparar sin tipo

        if (!selectedCategory) {
            setNotification({
                show: true,
                type: "error",
                message: "No se pudo encontrar la categoría seleccionada",
            });
            setTimeout(() => {
                setNotification({ show: false, type: "", message: "" });
            }, 5000);
            return;
        }

        setCreateModal({
            isOpen: true,
            entityType: "subcategory",
            parentData: selectedCategory,
            isSubmitting: false,
        });
    };

    // Función para abrir el modal de creación de tipo SKU
    const handleCreateSkuType = () => {
        if (!formData.sku_subcategoria) {
            setNotification({
                show: true,
                type: "warning",
                message:
                    "Primero debe seleccionar una subcategoría para crear un tipo",
            });
            setTimeout(() => {
                setNotification({ show: false, type: "", message: "" });
            }, 5000);
            return;
        }

        const selectedSubcategory = skuSubcategories.find(
            (sub) => sub.id == formData.sku_subcategoria
        ); // Usar == para comparar sin tipo

        if (!selectedSubcategory) {
            setNotification({
                show: true,
                type: "error",
                message: "No se pudo encontrar la subcategoría seleccionada",
            });
            setTimeout(() => {
                setNotification({ show: false, type: "", message: "" });
            }, 5000);
            return;
        }

        setCreateModal({
            isOpen: true,
            entityType: "type",
            parentData: selectedSubcategory,
            isSubmitting: false,
        });
    };

    // Función para cerrar el modal de creación
    const handleCloseCreateModal = () => {
        setCreateModal({
            isOpen: false,
            entityType: null,
            parentData: null,
            isSubmitting: false,
        });
    };

    // Función para manejar la creación de una nueva entidad SKU
    const handleCreateSkuEntity = async (entityData) => {
        setCreateModal((prev) => ({ ...prev, isSubmitting: true }));

        try {
            let newEntity;
            let successMessage;

            switch (createModal.entityType) {
                case "category":
                    newEntity = await createSkuCategory(entityData, authToken);
                    successMessage = `Categoría "${newEntity.code} - ${newEntity.name}" creada exitosamente`;

                    // Actualizar la lista de categorías y seleccionar la nueva
                    setSkuCategories((prev) => [...prev, newEntity]);
                    setFormData((prev) => ({
                        ...prev,
                        sku_categoria: newEntity.id,
                    }));
                    break;

                case "subcategory":
                    newEntity = await createSkuSubcategory(
                        entityData,
                        authToken
                    );
                    successMessage = `Subcategoría "${newEntity.code} - ${newEntity.name}" creada exitosamente`;

                    // Actualizar la lista de subcategorías y seleccionar la nueva
                    setSkuSubcategories((prev) => [...prev, newEntity]);
                    setFormData((prev) => ({
                        ...prev,
                        sku_subcategoria: newEntity.id,
                    }));
                    break;

                case "type":
                    newEntity = await createSkuType(entityData, authToken);
                    successMessage = `Tipo "${newEntity.code} - ${newEntity.name}" creado exitosamente`;

                    // Actualizar la lista de tipos y seleccionar el nuevo
                    setSkuTypes((prev) => [...prev, newEntity]);
                    setFormData((prev) => ({
                        ...prev,
                        sku_tipo: newEntity.id,
                    }));
                    break;

                default:
                    throw new Error("Tipo de entidad no válido");
            }

            // Mostrar notificación de éxito
            setNotification({
                show: true,
                type: "success",
                message: successMessage,
            });

            setTimeout(() => {
                setNotification({ show: false, type: "", message: "" });
            }, 4000);

            // Cerrar el modal
            handleCloseCreateModal();
        } catch (error) {
            console.error("Error al crear entidad SKU:", error);

            let errorMessage = `Error al crear ${createModal.entityType}`;

            // Manejar errores específicos del backend
            if (error.message.includes("already exists")) {
                errorMessage = `El código ya existe. Por favor, use un código diferente.`;
            } else if (error.message.includes("400")) {
                // Extraer el mensaje específico del error 400
                const match = error.message.match(/Error: (.+)/);
                if (match) {
                    errorMessage = match[1];
                } else {
                    errorMessage =
                        "Datos inválidos. Verifique los campos ingresados.";
                }
            } else if (error.message.includes("500")) {
                errorMessage =
                    "Error interno del servidor. Intente nuevamente más tarde.";
            } else if (error.message.includes("404")) {
                errorMessage =
                    "Endpoint no encontrado. Contacte al administrador.";
            } else if (error.message.includes("403")) {
                errorMessage = "No tiene permisos para realizar esta acción.";
            } else {
                errorMessage = error.message || "Error desconocido";
            }

            setNotification({
                show: true,
                type: "error",
                message: errorMessage,
            });

            setTimeout(() => {
                setNotification({ show: false, type: "", message: "" });
            }, 8000);

            setCreateModal((prev) => ({ ...prev, isSubmitting: false }));
        }
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
                        {/* Este bloque ya no es necesario para productos simples */}
                        {/* {formData.product_type === "composite" && (
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
                        )} */}

                        {/* SKU y Configuración */}
                        <div className="form-section">
                            <SkuConfigForm
                                formData={formData}
                                handleInputChange={handleInputChange}
                                getAvailableSkuCategorias={
                                    getAvailableSkuCategorias
                                }
                                getAvailableSubcategorias={
                                    getAvailableSubcategorias
                                }
                                getAvailableTipos={getAvailableTipos}
                                isLoadingCategories={isLoadingCategories}
                                isLoadingSkuData={isLoadingSkuData}
                                onCreateSkuCategory={handleCreateSkuCategory}
                                onCreateSkuSubcategory={
                                    handleCreateSkuSubcategory
                                }
                                onCreateSkuType={handleCreateSkuType}
                            />

                            <SkuGenerationForm
                                formData={formData}
                                handleInputChange={handleInputChange}
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

            {/* Modal de creación de entidades SKU */}
            <CreateSkuEntityModal
                isOpen={createModal.isOpen}
                onClose={handleCloseCreateModal}
                onSubmit={handleCreateSkuEntity}
                entityType={createModal.entityType}
                parentData={createModal.parentData}
                isSubmitting={createModal.isSubmitting}
            />

            {/* Modal de conversión */}
            <Modal isOpen={showConversionModal} onClose={() => setShowConversionModal(false)}>
              <h2>¿Deseas crear una conversión para este producto?</h2>
              <p>Por ejemplo: de caja a unidad, blister, etc.</p>
              <button
                onClick={async () => {
                  try {
                    if (window?.localStorage) {
                      // limpiar cache persistente de productos del contexto
                      localStorage.removeItem("products_cache_data");
                    }
                  if (typeof refrescarCacheInventario === 'function') {
                    await refrescarCacheInventario();
                    }
                    setRefreshMsg("Productos actualizados");
                    setRefreshKey(k => k + 1);
                    setTimeout(() => setRefreshMsg(""), 2000);
                  } catch (e) {
                    console.error('Error refrescando productos:', e);
                    setRefreshMsg("Error al actualizar productos");
                    setTimeout(() => setRefreshMsg(""), 2500);
                  }
                }}
                style={{ marginBottom: 10, background: '#00b894', color: 'white', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 600, cursor: 'pointer' }}
              >
                Actualizar productos
              </button>
              {refreshMsg && <span style={{ color: '#00b894', marginLeft: 10 }}>{refreshMsg}</span>}
              <div style={{ margin: '16px 0' }}>
                <div style={{ marginBottom: 12 }}>
                  <strong>Producto origen:</strong> {lastCreatedProduct?.name} (SKU: {lastCreatedProduct?.sku})<br />
                  <span style={{ color: '#888', fontSize: 13 }}>Unidad: {lastCreatedProduct?.unit}</span>
                </div>
                <label>Producto destino:</label>
                <ProductSearchSelector
                  key={refreshKey + '-to'}
                  showSelectedProduct={false}
                  refreshKey={refreshKey}
                  onProductSelected={prod => setConversionForm(f => ({ ...f, to_product: prod }))}
                  placeholder="Buscar producto destino por nombre, SKU o código..."
                  minSearchLength={2}
                  maxResults={50}
                />
                {conversionForm.to_product && (
                  <div style={{ marginTop: 8, color: '#2c3e50', border: '1px solid #2ecc71', borderRadius: 8, padding: 8, background: '#eafaf1', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <strong>{conversionForm.to_product.name}</strong><br />
                      SKU: {conversionForm.to_product.sku}<br />
                      <span style={{ color: '#888', fontSize: 13 }}>Unidad: {conversionForm.to_product.unit} | Categoría: {conversionForm.to_product.category_name || ''}</span>
                    </div>
                    <button onClick={() => setConversionForm(f => ({ ...f, to_product: null }))} style={{ background: '#ff7675', color: 'white', border: 'none', borderRadius: 4, fontWeight: 700, fontSize: 18, width: 32, height: 32, cursor: 'pointer' }}>×</button>
                  </div>
                )}
                {conversionForm.to_product && (
                  <div style={{ marginTop: 18 }}>
                    <label style={{ fontWeight: 600 }}>
                      ¿Cuántas <span style={{ color: '#0984e3' }}>{conversionForm.to_product.unit}</span> de <span style={{ color: '#0984e3' }}>{conversionForm.to_product.name}</span> salen de 1 <span style={{ color: '#27ae60' }}>{lastCreatedProduct?.unit}</span> de <span style={{ color: '#27ae60' }}>{lastCreatedProduct?.name}</span>?
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={conversionForm.conversion_rate}
                      onChange={e => setConversionForm(f => ({ ...f, conversion_rate: Math.max(1, Number(e.target.value)) }))}
                      style={{ width: 80, marginLeft: 8 }}
                    />
                    <div style={{ marginTop: 12 }}>
                      <label>
                        <input
                          type="checkbox"
                          checked={conversionForm.is_reversible}
                          onChange={e => setConversionForm(f => ({ ...f, is_reversible: e.target.checked }))}
                        /> Conversión reversible
                      </label>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button
                  onClick={async () => {
                    if (!lastCreatedProduct || !conversionForm.to_product || !conversionForm.conversion_rate) return;
                    setIsSubmittingConversion(true);
                    try {
                      const resp = await fetch("https://unidental-backend.onrender.com/api/catalogs/product-conversions/", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Token ${authToken}`,
                        },
                        body: JSON.stringify({
                          from_product: lastCreatedProduct.id || lastCreatedProduct,
                          to_product: conversionForm.to_product.id,
                          conversion_rate: conversionForm.conversion_rate,
                          is_reversible: conversionForm.is_reversible,
                        }),
                      });
                      if (!resp.ok) throw new Error("Error creando conversión");
                      setNotification({ show: true, type: "success", message: "¡Conversión creada exitosamente!" });
                      // Limpiar el formulario para permitir crear otra conversión
                      setConversionForm({ to_product: null, conversion_rate: 1, is_reversible: false });
                    } catch (err) {
                      setNotification({ show: true, type: "error", message: err.message || "Error al crear conversión" });
                    } finally {
                      setIsSubmittingConversion(false);
                    }
                  }}
                  disabled={isSubmittingConversion || !conversionForm.to_product || !conversionForm.conversion_rate}
                  style={{ background: '#3498db', color: 'white', padding: '8px 18px', borderRadius: 6, border: 'none', fontWeight: 600 }}
                >
                  Crear conversión
                </button>
                <button
                  onClick={() => {
                    setShowConversionModal(false);
                    navigate("/inventario");
                  }}
                  style={{ background: '#eee', color: '#2c3e50', padding: '8px 18px', borderRadius: 6, border: 'none' }}
                >
                  No, gracias
                </button>
              </div>
            </Modal>
        </>
    );
};

export default NuevoProductoPage;
