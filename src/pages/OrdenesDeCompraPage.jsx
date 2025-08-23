import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    getAllSuppliers,
    getPurchaseOptions,
} from "../services/suppliersService";
import { useAuth } from "../context/AuthContext";
import { getLocations } from "../services/inventoryService";
import API_CONFIG from "../config/api.js";

// Componentes segmentados
import OrdenesDeCompraHeader from "../components/OrdenesDeCompra/OrdenesDeCompraHeader";
import OrdenesDeCompraStyles from "../components/OrdenesDeCompra/OrdenesDeCompraStyles";
import NotificationBanner from "../components/OrdenesDeCompra/NotificationBanner";
import RegistrarOrden from "../components/OrdenesDeCompra/RegistrarOrden";
import PurchaseOrderModal from "../components/OrdenesDeCompra/PurchaseOrderModal";
import PurchaseOrderPaymentsModal from "../components/OrdenesDeCompra/PurchaseOrderPaymentsModal";

const OrdenesDeCompraPage = () => {
    const { authToken } = useAuth();
    const navigate = useNavigate();

    // Estados principales
    const [activeSection, setActiveSection] = useState("registro");
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
    const [orderItems, setOrderItems] = useState([]); // [{product, quantity}]
    const [locations, setLocations] = useState([]);
    const [isLoadingLocations, setIsLoadingLocations] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searchMode, setSearchMode] = useState("supplier"); // 'supplier' o 'direct_api'

    // Estado para notificación de proveedor seleccionado
    const [supplierNotification, setSupplierNotification] = useState(null);

    // Estados para órdenes registradas
    const [orders, setOrders] = useState([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [ordersPage, setOrdersPage] = useState(1);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [receiptModalData, setReceiptModalData] = useState(null);
    const [isLoadingReceipt, setIsLoadingReceipt] = useState(false);
    const [showStatusDropdown, setShowStatusDropdown] = useState(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isProcessingRedirect, setIsProcessingRedirect] = useState(false);
    const [ordersTotalPages, setOrdersTotalPages] = useState(0);
    const [ordersCount, setOrdersCount] = useState(0);
    const [goToPage, setGoToPage] = useState("");
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);

    // Estados para búsqueda local sin tildes
    const [allProducts, setAllProducts] = useState([]); // Lista completa de productos
    const [isLoadingAllProducts, setIsLoadingAllProducts] = useState(false);

    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [submitSuccess, setSubmitSuccess] = useState("");

    // Estados para el modal de orden de compra
    const [shouldGenerateOrder, setShouldGenerateOrder] = useState(false);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [orderModalData, setOrderModalData] = useState(null);

    // Estado para la tabla de órdenes
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [ordersError, setOrdersError] = useState("");
    const ORDERS_PAGE_SIZE = 25;
    // Estado para el panel de detalle de orden
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderDetail, setShowOrderDetail] = useState(false);
    const [orderDetailLoading, setOrderDetailLoading] = useState(false);
    const [orderDetailError, setOrderDetailError] = useState("");

    // Estados para el modal de pagos
    const [showPaymentsModal, setShowPaymentsModal] = useState(false);
    const [selectedOrderForPayments, setSelectedOrderForPayments] =
        useState(null);

    // Cargar TODOS los proveedores al inicio
    useEffect(() => {
        if (!authToken) return;
        setIsLoadingSuppliers(true);
        console.log("🔄 Iniciando carga de TODOS los proveedores...");

        getAllSuppliers(authToken)
            .then((allSuppliers) => {
                console.log(
                    `✅ Total de proveedores cargados: ${allSuppliers.length}`
                );
                setSuppliers(allSuppliers);
            })
            .catch((error) => {
                console.error("❌ Error al cargar proveedores:", error);
                setSuppliers([]);
            })
            .finally(() => {
                setIsLoadingSuppliers(false);
                console.log("🏁 Carga de proveedores completada");
            });
    }, [authToken]);

    // Cargar productos del proveedor seleccionado
    useEffect(() => {
        if (!selectedSupplier) {
            setProducts([]);
            setOrderItems([]);
            return;
        }

        setIsLoading(true);
        console.log(
            `🔄 Cargando opciones de compra del proveedor: ${selectedSupplier.name} (ID: ${selectedSupplier.id})`
        );
        console.log(
            `🔍 Usando endpoint: /api/suppliers/purchase-options/?supplier=${selectedSupplier.id}`
        );

        // Función para cargar todas las opciones de compra del proveedor
        const loadAllPurchaseOptions = async () => {
            const allProducts = [];
            let nextUrl = `${API_CONFIG.BASE_URL}/suppliers/purchase-options/?supplier=${selectedSupplier.id}&page_size=100`;
            let pageCount = 0;
            const maxPages = 50; // Límite de seguridad

            while (nextUrl && pageCount < maxPages) {
                pageCount++;
                console.log(
                    `📄 Cargando página ${pageCount} de opciones de compra...`
                );

                const response = await fetch(nextUrl, {
                    headers: {
                        Authorization: `Token ${authToken}`,
                        "Content-Type": "application/json",
                    },
                });

                if (!response.ok) {
                    throw new Error(
                        `Error ${response.status}: ${response.statusText}`
                    );
                }

                const data = await response.json();
                const products = data.results || [];

                // Agregar productos de esta página
                allProducts.push(...products);
                console.log(
                    `✅ Página ${pageCount}: ${products.length} productos cargados`
                );

                // Verificar si hay más páginas
                nextUrl = data.next ? data.next : null;

                // Si no hay más páginas, terminar
                if (!nextUrl) {
                    console.log(
                        `🏁 No hay más páginas. Total de productos cargados: ${allProducts.length}`
                    );
                    break;
                }
            }

            // Advertencia si llegamos al límite
            if (pageCount >= maxPages) {
                console.warn(
                    `⚠️ Se alcanzó el límite de ${maxPages} páginas. Es posible que no se hayan cargado todos los productos.`
                );
            }

            return allProducts;
        };

        // Ejecutar la carga de todos los productos
        loadAllPurchaseOptions()
            .then((allProducts) => {
                const productsWithOption = allProducts.map((opt) => ({
                    ...opt,
                    purchase_option: opt.id,
                }));

                console.log(
                    `✅ Opciones de compra cargadas: ${productsWithOption.length} productos del proveedor ${selectedSupplier.name}`
                );
                setProducts(productsWithOption);
            })
            .catch((error) => {
                console.error("❌ Error al cargar opciones de compra:", error);
                setProducts([]);
            })
            .finally(() => {
                setIsLoading(false);
                console.log("🏁 Carga de opciones de compra completada");
            });

        // Solo limpiar orden si no estamos en modo búsqueda directa
        if (searchMode !== "direct_api") {
            setOrderItems([]); // Limpiar orden al cambiar proveedor
        }
    }, [selectedSupplier, authToken, searchMode]);

    // Cargar sedes (locations)
    useEffect(() => {
        if (!authToken) return;
        setIsLoadingLocations(true);
        getLocations(authToken)
            .then((data) => {
                // Filtrar solo sedes (type: "sede") si aplica
                const sedes = Array.isArray(data)
                    ? data.filter((loc) => loc.type === "sede")
                    : [];
                setLocations(sedes);
            })
            .catch(() => setLocations([]))
            .finally(() => setIsLoadingLocations(false));
    }, [authToken]);

    // Cargar órdenes de compra cuando se entra a la sección 'otra'
    useEffect(() => {
        if (activeSection === "otra" && authToken) {
            fetchOrders(ordersPage);
        }
    }, [activeSection, ordersPage, authToken]);

    // Funciones para manejar productos en la orden
    const handleAddProduct = (product) => {
        setOrderItems((prevOrderItems) => {
            const existingItem = prevOrderItems.find(
                (item) => item.purchase_option === product.purchase_option
            );
            if (existingItem) {
                return prevOrderItems.map((item) =>
                    item.purchase_option === product.purchase_option
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prevOrderItems, { ...product, quantity: 1 }];
        });
    };

    const handleRemoveProduct = (productId) => {
        setOrderItems((prev) =>
            prev.filter((item) => item.purchase_option !== productId)
        );
    };

    const clearOrder = () => {
        const eliminatedCount = orderItems.length;
        setOrderItems([]);
        return eliminatedCount;
    };

    const handleChangeQuantity = (productId, value) => {
        setOrderItems((prev) =>
            prev.map((item) =>
                item.purchase_option === productId
                    ? { ...item, quantity: Math.max(1, parseInt(value) || 1) }
                    : item
            )
        );
    };

    // Función para cambiar el precio unitario de un producto
    const handleChangePrice = (productId, value) => {
        setOrderItems((prev) =>
            prev.map((item) =>
                item.purchase_option === productId
                    ? {
                          ...item,
                          purchase_price: Math.max(0, parseFloat(value) || 0),
                      }
                    : item
            )
        );
    };

    // Función para cambiar el subtotal de un producto (calcula el precio unitario)
    const handleChangeSubtotal = (productId, value) => {
        setOrderItems((prev) =>
            prev.map((item) =>
                item.purchase_option === productId
                    ? {
                          ...item,
                          purchase_price:
                              Math.max(0, parseFloat(value) || 0) /
                              Math.max(1, item.quantity),
                      }
                    : item
            )
        );
    };

    // Calcular total
    const total = orderItems.reduce(
        (sum, item) =>
            sum + parseFloat(item.purchase_price || 0) * item.quantity,
        0
    );

    const handleCreateOrder = async () => {
        setSubmitError("");
        setSubmitSuccess("");
        if (!selectedSupplier || !selectedLocation || orderItems.length === 0) {
            setSubmitError("Debe seleccionar proveedor, sede y productos.");
            return;
        }
        // Validar que todos los productos tengan purchase_option
        const missingOption = orderItems.find((item) => !item.purchase_option);
        if (missingOption) {
            setSubmitError(
                `El producto '${
                    missingOption.product_name || missingOption.name
                }' no tiene purchase_option.`
            );
            return;
        }
        setIsCreatingOrder(true);
        try {
            // Generar fecha y hora actual en formato ISO
            const currentDate = new Date().toISOString().split("T")[0];

            const payload = {
                supplier: selectedSupplier.id,
                destination: parseInt(selectedLocation),
                order_date: currentDate,
                items: orderItems.map((item) => ({
                    purchase_option: item.purchase_option,
                    quantity_requested: item.quantity,
                    unit_price: parseFloat(item.purchase_price || 0),
                })),
                notes: notes,
            };

            console.log("📦 Creando orden de compra:", payload);
            console.log("📋 Detalles del payload:", {
                supplier: payload.supplier,
                supplierType: typeof payload.supplier,
                destination: payload.destination,
                destinationType: typeof payload.destination,
                items: payload.items,
                itemsCount: payload.items.length,
                notes: payload.notes,
            });
            console.log(
                "🔍 JSON completo que se enviará:",
                JSON.stringify(payload, null, 2)
            );

            // Verificar que el endpoint existe
            const endpoint = `${API_CONFIG.BASE_URL}/purchases/orders/`;
            console.log("🔍 Verificando endpoint...");
            const testResponse = await fetch(endpoint, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${authToken}`,
                },
            });
            console.log("🔍 Test endpoint status:", testResponse.status);

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${authToken}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const responseText = await response.text();
                console.error("❌ Error response details:", {
                    status: response.status,
                    statusText: response.statusText,
                    responseText: responseText,
                });

                let errorData;
                try {
                    errorData = JSON.parse(responseText);
                } catch (parseError) {
                    errorData = { detail: responseText };
                }

                throw new Error(
                    errorData.detail ||
                        errorData.message ||
                        errorData.error ||
                        JSON.stringify(errorData) ||
                        `Error ${response.status}: ${response.statusText}`
                );
            }

            const result = await response.json();
            console.log("✅ Orden creada exitosamente:", result);

            // Si se debe generar el documento de orden, mostrar el modal
            if (shouldGenerateOrder) {
                setOrderModalData({
                    orderData: result,
                    supplierData: selectedSupplier,
                    locationData: locations.find(
                        (loc) => loc.id === selectedLocation
                    ),
                    orderItems: orderItems,
                    totals: {
                        total: total,
                        subtotal: total,
                        tax: 0,
                        itemCount: orderItems.length,
                        totalQuantity: orderItems.reduce(
                            (sum, item) => sum + item.quantity,
                            0
                        ),
                    },
                    notes: notes,
                });
                setShowOrderModal(true);
            } else {
                setSubmitSuccess(
                    `✅ Orden de compra creada exitosamente!\n\n📋 Número de orden: ${
                        result.order_number || result.id
                    }\n🏢 Proveedor: ${selectedSupplier.name}\n📦 Productos: ${
                        orderItems.length
                    }\n💰 Total: $${total.toLocaleString()}`
                );
            }

            // Limpiar formulario
            setOrderItems([]);
            setSelectedLocation("");
            setNotes("");
            setSelectedSupplier(null);
            setProducts([]);
            setSearchMode("supplier");
            setSearchTerm("");
            setSearchResults([]);
            setShouldGenerateOrder(false);
        } catch (error) {
            console.error("❌ Error al crear orden:", error);
            setSubmitError(
                `Error al crear la orden de compra: ${error.message}`
            );
        } finally {
            setIsCreatingOrder(false);
        }
    };

    // Utilidad para traducir estados si no viene status_display
    const translateStatus = (status) => {
        if (!status) return "-";
        const map = {
            pending: "Pendiente",
            approved: "Aprobada",
            completed: "Completada",
            cancelled: "Cancelada",
            rejected: "Rechazada",
            in_progress: "En progreso",
            draft: "Borrador",
        };
        return map[status] || status;
    };

    // Función auxiliar para obtener el precio de una opción de compra
    const getPurchasePrice = (option) => {
        const price = option.purchase_price || 0;
        return Number(price);
    };

    // Función auxiliar para calcular el número de productos únicos en una orden
    const getUniqueProductsCount = (order) => {
        // Si la orden tiene items_count, usarlo (es más confiable)
        if (order.items_count !== undefined) {
            return order.items_count;
        }

        // Si tiene total_items, asumir que es el número de productos únicos
        // (aunque técnicamente puede ser unidades, es mejor que nada)
        if (order.total_items !== undefined) {
            return order.total_items;
        }

        // Valor por defecto
        return 0;
    };

    // Función para cargar órdenes
    const fetchOrders = async (page = 1) => {
        setIsLoadingOrders(true);
        setOrdersError("");
        try {
            const endpoint = `${API_CONFIG.BASE_URL}/purchases/orders/?page=${page}&page_size=${ORDERS_PAGE_SIZE}`;
            const response = await fetch(endpoint, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${authToken}`,
                },
            });

            if (!response.ok) {
                throw new Error(
                    `Error ${response.status}: ${response.statusText}`
                );
            }

            const data = await response.json();
            setOrders(data.results || []);
            setOrdersCount(data.count || 0);
            setOrdersTotalPages(
                data.count
                    ? Math.max(1, Math.ceil(data.count / ORDERS_PAGE_SIZE))
                    : 1
            );
        } catch (error) {
            console.error("Error fetching orders:", error);
            setOrdersError(error.message || "Error al cargar órdenes");
        } finally {
            setIsLoadingOrders(false);
        }
    };

    // Función para ir a una página específica
    const handleGoToPage = () => {
        const page = parseInt(goToPage);
        if (page && page >= 1 && page <= ordersTotalPages) {
            setOrdersPage(page);
            setGoToPage("");
        }
    };

    // Función para manejar Enter en el campo de página
    const handlePageKeyPress = (e) => {
        if (e.key === "Enter") {
            handleGoToPage();
        }
    };

    // Función para cerrar el modal de orden de compra
    const handleCloseOrderModal = () => {
        setShowOrderModal(false);
        setOrderModalData(null);

        // Mostrar mensaje de éxito después de cerrar la orden
        if (orderModalData) {
            setSubmitSuccess(
                `✅ Orden de compra creada exitosamente!\n\n📋 Número de orden: ${
                    orderModalData.orderData.order_number ||
                    orderModalData.orderData.id
                }\n🏢 Proveedor: ${
                    orderModalData.supplierData.name
                }\n📦 Productos: ${
                    orderModalData.orderItems.length
                }\n💰 Total: $${orderModalData.totals.total.toLocaleString()}`
            );
        }
    };

    // Función para mostrar el recibo de la orden de compra
    const handleShowReceipt = async (order) => {
        setIsLoadingReceipt(true);
        setReceiptModalData(null);

        try {
            // Obtener los detalles de la orden
            const endpoint = `${API_CONFIG.BASE_URL}/purchases/orders/${order.id}/`;
            const response = await fetch(endpoint, {
                method: "GET",
                headers: {
                    Authorization: `Token ${authToken}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(
                    `Error ${response.status}: ${response.statusText}`
                );
            }

            const orderDetails = await response.json();

            // Preparar los datos para el modal
            const modalData = {
                orderData: orderDetails,
                supplierData: orderDetails.supplier_details || {
                    name: orderDetails.supplier_name || "Sin proveedor",
                    phone: "",
                    email: "",
                    address: "",
                },
                locationData: orderDetails.destination_details || {
                    name: "Sin destino",
                    address: "",
                },
                orderItems: orderDetails.items || [],
                totals: {
                    subtotal: parseFloat(orderDetails.total_amount || 0),
                    total: parseFloat(orderDetails.total_amount || 0),
                },
                notes: orderDetails.notes || "",
            };

            setReceiptModalData(modalData);
            setShowReceiptModal(true);
        } catch (error) {
            console.error("Error al cargar los detalles de la orden:", error);
            setSubmitError(`❌ Error al cargar los detalles: ${error.message}`);
        } finally {
            setIsLoadingReceipt(false);
        }
    };

    // Función para cerrar el modal de recibo
    const handleCloseReceiptModal = () => {
        setShowReceiptModal(false);
        setReceiptModalData(null);
    };

    // Funciones para el modal de pagos
    const handleShowPayments = (order) => {
        setSelectedOrderForPayments(order);
        setShowPaymentsModal(true);
    };

    const handleClosePaymentsModal = () => {
        setShowPaymentsModal(false);
        setSelectedOrderForPayments(null);
    };

    const handlePaymentSuccess = () => {
        // Recargar las órdenes para actualizar el estado de pago
        fetchOrders(ordersPage);
    };

    // Lista de acciones disponibles para órdenes pendientes
    const pendingOrderActions = [
        { value: "received", label: "Recibida", endpoint: "mark_received" },
        { value: "canceled", label: "Cancelada", endpoint: "cancel" },
    ];

    // Función para cambiar el estado de una orden pendiente
    const handleStatusChange = async (orderId, action) => {
        setIsUpdatingStatus(true);
        try {
            const actionConfig = pendingOrderActions.find(
                (a) => a.value === action
            );
            if (!actionConfig) {
                throw new Error("Acción no válida");
            }

            const endpoint = `${API_CONFIG.BASE_URL}/purchases/orders/${orderId}/${actionConfig.endpoint}/`;
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    Authorization: `Token ${authToken}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(
                    `Error ${response.status}: ${response.statusText}`
                );
            }

            const updatedOrder = await response.json();

            // Actualizar la orden en el estado local
            setOrders((prevOrders) =>
                prevOrders.map((order) =>
                    order.id === orderId
                        ? {
                              ...order,
                              status: updatedOrder.status || action,
                              status_display:
                                  updatedOrder.status_display ||
                                  actionConfig.label,
                          }
                        : order
                )
            );

            setSubmitSuccess(
                `✅ Orden #${orderId} marcada como ${actionConfig.label.toLowerCase()} exitosamente`
            );
            setShowStatusDropdown(null);

            // Si la acción es "received", redirigir a movimientos de stock con datos pre-llenados
            if (action === "received") {
                await redirectToStockMovements(orderId);
            }
        } catch (error) {
            console.error("Error al actualizar el estado:", error);
            setSubmitError(
                `❌ Error al actualizar el estado: ${error.message}`
            );
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    // Función para redirigir a movimientos de stock con datos pre-llenados
    const redirectToStockMovements = async (orderId) => {
        setIsProcessingRedirect(true);
        try {
            // Obtener los detalles completos de la orden
            const endpoint = `${API_CONFIG.BASE_URL}/purchases/orders/${orderId}/`;
            const response = await fetch(endpoint, {
                method: "GET",
                headers: {
                    Authorization: `Token ${authToken}`,
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(
                    `Error ${response.status}: ${response.statusText}`
                );
            }

            const orderDetails = await response.json();

            // Log para debuggear la estructura de datos
            console.log("🔍 Detalles de la orden recibidos:", orderDetails);
            console.log("🔍 Items de la orden:", orderDetails.items);
            console.log("🔍 Destination:", orderDetails.destination);

            // Preparar los datos para pre-llenar en movimientos de stock
            const stockMovementData = {
                fromPurchaseOrder: true,
                orderId: orderId,
                orderNumber: orderDetails.order_number || orderDetails.id,
                location:
                    orderDetails.destination || orderDetails.destination_name,
                movementType: "in", // Siempre entrada para órdenes recibidas
                notes: `Entrada por orden de compra #${
                    orderDetails.order_number || orderDetails.id
                }${orderDetails.notes ? ` - ${orderDetails.notes}` : ""}`,
                products: await Promise.all(
                    orderDetails.items
                        ? orderDetails.items.map(async (item, index) => {
                              console.log(`🔍 Procesando item ${index}:`, item);
                              console.log(
                                  `🔍 purchase_option_details:`,
                                  item.purchase_option_details
                              );

                              // Obtener el ID del producto directamente desde purchase_option_details
                              const productId =
                                  item.purchase_option_details?.product ||
                                  item.product_id ||
                                  item.product?.id;

                              const productName =
                                  item.product_name ||
                                  item.purchase_option_details?.product_name ||
                                  item.product?.name ||
                                  "Producto sin nombre";

                              const productSku =
                                  item.product_sku ||
                                  item.purchase_option_details?.product_sku ||
                                  item.product?.sku;

                              const quantity =
                                  item.quantity_requested ||
                                  item.quantity ||
                                  "";

                              // IMPORTANTE: Obtener requires_batch_control desde el API del producto
                              let requiresBatchControl = false;
                              let productDetails = null;

                              if (productId) {
                                  try {
                                      console.log(
                                          `🔍 Obteniendo detalles del producto ${productId}...`
                                      );
                                      const productResponse = await fetch(
                                          `https://unidental-backend.onrender.com/api/catalogs/products/${productId}/`,
                                          {
                                              headers: {
                                                  Authorization: `Token ${authToken}`,
                                                  "Content-Type":
                                                      "application/json",
                                              },
                                          }
                                      );

                                      if (productResponse.ok) {
                                          productDetails =
                                              await productResponse.json();
                                          requiresBatchControl =
                                              productDetails.requires_batch_control ||
                                              false;
                                          console.log(
                                              `🔍 Producto ${productId} requires_batch_control:`,
                                              requiresBatchControl
                                          );
                                      } else {
                                          console.warn(
                                              `⚠️ No se pudieron obtener detalles del producto ${productId}`
                                          );
                                      }
                                  } catch (error) {
                                      console.error(
                                          `❌ Error obteniendo detalles del producto ${productId}:`,
                                          error
                                      );
                                  }
                              }

                              console.log(`🔍 Producto ${index} mapeado:`, {
                                  productId,
                                  productName,
                                  productSku,
                                  requiresBatchControl,
                                  quantity,
                              });

                              return {
                                  id: Date.now() + Math.random() + index, // ID único temporal
                                  product: {
                                      id: productId,
                                      name: productName,
                                      sku: productSku,
                                      requires_batch_control:
                                          requiresBatchControl,
                                  },
                                  quantity: requiresBatchControl
                                      ? ""
                                      : quantity, // Si requiere lotes, no pre-llenar cantidad principal
                                  requiresBatchControl: requiresBatchControl,
                                  batchesData: requiresBatchControl
                                      ? [
                                            {
                                                batch_number: "",
                                                expiry_date: "",
                                                manufacturing_date: "",
                                                supplier_reference: "",
                                                quantity: quantity, // Pre-llenar la cantidad en el primer lote
                                            },
                                        ]
                                      : [],
                                  isValid: requiresBatchControl ? false : true, // Si requiere lotes, marcar como no válido hasta que se llenen los datos de lote
                              };
                          })
                        : []
                ),
            };

            console.log(
                "🔍 Datos finales para movimientos:",
                stockMovementData
            );

            // Navegar a la página de movimientos con los datos
            navigate("/inventario/movimientos", {
                state: stockMovementData,
            });
        } catch (error) {
            console.error("Error al obtener detalles de la orden:", error);
            setSubmitError(
                `❌ Error al cargar datos para movimientos: ${error.message}`
            );
            setIsProcessingRedirect(false);
        } finally {
            // El loading se mantiene hasta que se complete la navegación
            setTimeout(() => setIsProcessingRedirect(false), 1000);
        }
    };

    // Función para cerrar el dropdown de estados
    const closeStatusDropdown = () => {
        setShowStatusDropdown(null);
    };

    // Event listener para cerrar dropdown cuando se hace clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                showStatusDropdown &&
                !event.target.closest(".status-dropdown-container")
            ) {
                setShowStatusDropdown(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showStatusDropdown]);

    return (
        <>
            <OrdenesDeCompraStyles />

            {/* Header Banner */}
            <div
                style={{
                    background:
                        "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
                    borderRadius: "12px",
                    padding: "32px",
                    marginBottom: "32px",
                    boxShadow: "0 4px 16px rgba(44,62,80,0.15)",
                    border: "1px solid #2c3e50",
                    color: "white",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                    }}
                >
                    <div
                        style={{
                            width: "56px",
                            height: "56px",
                            backgroundColor: "rgba(255,255,255,0.2)",
                            borderRadius: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backdropFilter: "blur(10px)",
                        }}
                    >
                        <svg
                            width="28"
                            height="28"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            style={{ color: "white" }}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                            />
                        </svg>
                    </div>
                    <div>
                        <h1
                            style={{
                                fontSize: "32px",
                                fontWeight: "800",
                                color: "white",
                                margin: "0",
                                letterSpacing: "-0.5px",
                            }}
                        >
                            Órdenes de Compra
                        </h1>
                        <p
                            style={{
                                color: "rgba(255,255,255,0.8)",
                                margin: "8px 0 0 0",
                                fontSize: "16px",
                                fontWeight: "500",
                            }}
                        >
                            Gestiona las órdenes de compra de tu empresa
                        </p>
                    </div>
                </div>
            </div>

            {/* Barra de navegación de secciones */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "16px",
                    marginBottom: "32px",
                }}
            >
                <button
                    onClick={() => setActiveSection("registro")}
                    style={{
                        padding: "12px 32px",
                        borderRadius: "8px",
                        border:
                            activeSection === "registro"
                                ? "2px solid #2c3e50"
                                : "2px solid #e3eaf3",
                        background:
                            activeSection === "registro" ? "#2c3e50" : "#fff",
                        color:
                            activeSection === "registro" ? "#fff" : "#2c3e50",
                        fontWeight: 700,
                        fontSize: "16px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        boxShadow:
                            activeSection === "registro"
                                ? "0 2px 8px rgba(44,62,80,0.15)"
                                : "none",
                    }}
                >
                    Registrar Orden de Compra
                </button>
                <button
                    onClick={() => setActiveSection("otra")}
                    style={{
                        padding: "12px 32px",
                        borderRadius: "8px",
                        border:
                            activeSection === "otra"
                                ? "2px solid #2c3e50"
                                : "2px solid #e3eaf3",
                        background:
                            activeSection === "otra" ? "#2c3e50" : "#fff",
                        color: activeSection === "otra" ? "#fff" : "#2c3e50",
                        fontWeight: 700,
                        fontSize: "16px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        boxShadow:
                            activeSection === "otra"
                                ? "0 2px 8px rgba(44,62,80,0.15)"
                                : "none",
                    }}
                >
                    Órdenes de Compra Registradas
                </button>
            </div>

            {/* Notificaciones */}
            {submitError && (
                <NotificationBanner
                    type="error"
                    message={submitError}
                    onClose={() => setSubmitError("")}
                />
            )}
            {submitSuccess && (
                <NotificationBanner
                    type="success"
                    message={submitSuccess}
                    onClose={() => setSubmitSuccess("")}
                />
            )}

            {/* Contenido de la sección activa */}
            {activeSection === "registro" && (
                <RegistrarOrden
                    suppliers={suppliers}
                    selectedSupplier={selectedSupplier}
                    setSelectedSupplier={setSelectedSupplier}
                    isLoadingSuppliers={isLoadingSuppliers}
                    searchMode={searchMode}
                    setSearchMode={setSearchMode}
                    setSearchTerm={setSearchTerm}
                    setSearchResults={setSearchResults}
                    handleAddProduct={handleAddProduct}
                    orderItems={orderItems}
                    handleRemoveProduct={handleRemoveProduct}
                    handleChangeQuantity={handleChangeQuantity}
                    handleChangePrice={handleChangePrice}
                    handleChangeSubtotal={handleChangeSubtotal}
                    getPurchasePrice={getPurchasePrice}
                    clearOrder={clearOrder}
                    selectedLocation={selectedLocation}
                    setSelectedLocation={setSelectedLocation}
                    locations={locations}
                    isLoadingLocations={isLoadingLocations}
                    handleCreateOrder={handleCreateOrder}
                    isCreatingOrder={isCreatingOrder}
                    products={products}
                    isLoading={isLoading}
                    notes={notes}
                    setNotes={setNotes}
                    shouldGenerateOrder={shouldGenerateOrder}
                    setShouldGenerateOrder={setShouldGenerateOrder}
                />
            )}

            {activeSection === "otra" && (
                <div
                    style={{
                        maxWidth: 1200,
                        margin: "0 auto",
                        padding: "24px",
                    }}
                >
                    <h2
                        style={{
                            fontSize: "24px",
                            fontWeight: "700",
                            color: "#2c3e50",
                            marginBottom: "24px",
                            textAlign: "center",
                        }}
                    >
                        Órdenes de Compra Registradas
                    </h2>

                    {ordersError && (
                        <div
                            style={{
                                padding: "16px",
                                backgroundColor: "#fee2e2",
                                borderRadius: "8px",
                                color: "#dc2626",
                                marginBottom: "24px",
                                border: "1px solid #fecaca",
                            }}
                        >
                            ❌ {ordersError}
                        </div>
                    )}

                    {isLoadingOrders ? (
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "center",
                                padding: "40px",
                            }}
                        >
                            <div className="custom-loader"></div>
                        </div>
                    ) : (
                        <>
                            {/* Tabla de órdenes */}
                            <div
                                style={{
                                    background: "white",
                                    borderRadius: "12px",
                                    overflow: "hidden",
                                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                                    border: "1px solid #e3eaf3",
                                }}
                            >
                                <table
                                    style={{
                                        width: "100%",
                                        borderCollapse: "collapse",
                                    }}
                                >
                                    <thead>
                                        <tr
                                            style={{
                                                background:
                                                    "linear-gradient(135deg, #2c3e50 0%, #34495e 100%)",
                                                color: "white",
                                            }}
                                        >
                                            <th
                                                style={{
                                                    padding: "16px",
                                                    textAlign: "left",
                                                    fontWeight: "600",
                                                }}
                                            >
                                                Proveedor
                                            </th>
                                            <th
                                                style={{
                                                    padding: "16px",
                                                    textAlign: "left",
                                                    fontWeight: "600",
                                                }}
                                            >
                                                Destino
                                            </th>
                                            <th
                                                style={{
                                                    padding: "16px",
                                                    textAlign: "left",
                                                    fontWeight: "600",
                                                }}
                                            >
                                                Fecha
                                            </th>
                                            <th
                                                style={{
                                                    padding: "16px",
                                                    textAlign: "left",
                                                    fontWeight: "600",
                                                }}
                                            >
                                                Estado
                                            </th>
                                            <th
                                                style={{
                                                    padding: "16px",
                                                    textAlign: "left",
                                                    fontWeight: "600",
                                                }}
                                            >
                                                Estado de Pago
                                            </th>
                                            <th
                                                style={{
                                                    padding: "16px",
                                                    textAlign: "left",
                                                    fontWeight: "600",
                                                }}
                                            >
                                                Creado por
                                            </th>
                                            <th
                                                style={{
                                                    padding: "16px",
                                                    textAlign: "left",
                                                    fontWeight: "600",
                                                }}
                                            >
                                                Total
                                            </th>
                                            <th
                                                style={{
                                                    padding: "16px",
                                                    textAlign: "center",
                                                    fontWeight: "600",
                                                }}
                                            >
                                                Acciones
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map((order, index) => (
                                            <tr
                                                key={order.id}
                                                style={{
                                                    borderBottom:
                                                        "1px solid #f1f5f9",
                                                    backgroundColor:
                                                        index % 2 === 0
                                                            ? "#fff"
                                                            : "#f8f9fa",
                                                }}
                                            >
                                                <td
                                                    style={{
                                                        padding: "16px",
                                                        color: "#495057",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            marginBottom: "4px",
                                                        }}
                                                    >
                                                        <strong
                                                            style={{
                                                                color: "#2c3e50",
                                                            }}
                                                        >
                                                            {order
                                                                .supplier_details
                                                                ?.name ||
                                                                order.supplier_name ||
                                                                order.supplier ||
                                                                "Sin proveedor"}
                                                        </strong>
                                                    </div>
                                                    {order.supplier_details
                                                        ?.contact_name && (
                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "12px",
                                                                color: "#6c757d",
                                                                fontStyle:
                                                                    "italic",
                                                            }}
                                                        >
                                                            Contacto:{" "}
                                                            {
                                                                order
                                                                    .supplier_details
                                                                    .contact_name
                                                            }
                                                        </div>
                                                    )}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "16px",
                                                        color: "#495057",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            marginBottom: "4px",
                                                        }}
                                                    >
                                                        <strong
                                                            style={{
                                                                color: "#2c3e50",
                                                            }}
                                                        >
                                                            {order
                                                                .destination_details
                                                                ?.name ||
                                                                "Sin destino"}
                                                        </strong>
                                                    </div>
                                                    {order.destination_details
                                                        ?.address && (
                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "12px",
                                                                color: "#6c757d",
                                                                fontStyle:
                                                                    "italic",
                                                            }}
                                                        >
                                                            {
                                                                order
                                                                    .destination_details
                                                                    .address
                                                            }
                                                        </div>
                                                    )}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "16px",
                                                        color: "#495057",
                                                    }}
                                                >
                                                    {order.order_date
                                                        ? new Date(
                                                              order.order_date
                                                          ).toLocaleDateString(
                                                              "es-ES"
                                                          )
                                                        : "-"}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "16px",
                                                        position: "relative",
                                                    }}
                                                    className="status-dropdown-container"
                                                >
                                                    {order.status ===
                                                    "pending" ? (
                                                        <div
                                                            style={{
                                                                position:
                                                                    "relative",
                                                            }}
                                                        >
                                                            <button
                                                                onClick={() =>
                                                                    setShowStatusDropdown(
                                                                        showStatusDropdown ===
                                                                            order.id
                                                                            ? null
                                                                            : order.id
                                                                    )
                                                                }
                                                                disabled={
                                                                    isUpdatingStatus
                                                                }
                                                                style={{
                                                                    padding:
                                                                        "6px 12px",
                                                                    backgroundColor:
                                                                        "#f39c12",
                                                                    color: "white",
                                                                    border: "none",
                                                                    borderRadius:
                                                                        "4px",
                                                                    cursor: isUpdatingStatus
                                                                        ? "not-allowed"
                                                                        : "pointer",
                                                                    fontSize:
                                                                        "12px",
                                                                    fontWeight:
                                                                        "500",
                                                                    display:
                                                                        "flex",
                                                                    alignItems:
                                                                        "center",
                                                                    gap: "4px",
                                                                    opacity:
                                                                        isUpdatingStatus
                                                                            ? 0.7
                                                                            : 1,
                                                                }}
                                                            >
                                                                {isUpdatingStatus ? (
                                                                    <svg
                                                                        width="12"
                                                                        height="12"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                        style={{
                                                                            animation:
                                                                                "spin 1s linear infinite",
                                                                        }}
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                                                        />
                                                                    </svg>
                                                                ) : (
                                                                    <svg
                                                                        width="12"
                                                                        height="12"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={
                                                                                2
                                                                            }
                                                                            d="M19 9l-7 7-7-7"
                                                                        />
                                                                    </svg>
                                                                )}
                                                                {order.status_display ||
                                                                    translateStatus(
                                                                        order.status
                                                                    )}
                                                            </button>

                                                            {showStatusDropdown ===
                                                                order.id && (
                                                                <div
                                                                    style={{
                                                                        position:
                                                                            "absolute",
                                                                        top: "100%",
                                                                        left: "0",
                                                                        backgroundColor:
                                                                            "white",
                                                                        border: "1px solid #ddd",
                                                                        borderRadius:
                                                                            "4px",
                                                                        boxShadow:
                                                                            "0 2px 8px rgba(0,0,0,0.15)",
                                                                        zIndex: 1000,
                                                                        minWidth:
                                                                            "150px",
                                                                        marginTop:
                                                                            "4px",
                                                                    }}
                                                                >
                                                                    {pendingOrderActions.map(
                                                                        (
                                                                            action
                                                                        ) => (
                                                                            <button
                                                                                key={
                                                                                    action.value
                                                                                }
                                                                                onClick={() =>
                                                                                    handleStatusChange(
                                                                                        order.id,
                                                                                        action.value
                                                                                    )
                                                                                }
                                                                                disabled={
                                                                                    isUpdatingStatus
                                                                                }
                                                                                style={{
                                                                                    width: "100%",
                                                                                    padding:
                                                                                        "8px 12px",
                                                                                    backgroundColor:
                                                                                        "white",
                                                                                    border: "none",
                                                                                    textAlign:
                                                                                        "left",
                                                                                    cursor: isUpdatingStatus
                                                                                        ? "not-allowed"
                                                                                        : "pointer",
                                                                                    fontSize:
                                                                                        "12px",
                                                                                    color: "#333",
                                                                                    borderBottom:
                                                                                        "1px solid #f0f0f0",
                                                                                }}
                                                                                onMouseEnter={(
                                                                                    e
                                                                                ) => {
                                                                                    e.target.style.backgroundColor =
                                                                                        "#f8f9fa";
                                                                                }}
                                                                                onMouseLeave={(
                                                                                    e
                                                                                ) => {
                                                                                    e.target.style.backgroundColor =
                                                                                        "white";
                                                                                }}
                                                                            >
                                                                                {
                                                                                    action.label
                                                                                }
                                                                            </button>
                                                                        )
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span
                                                            className={`status-badge status-${order.status}`}
                                                        >
                                                            {order.status_display ||
                                                                translateStatus(
                                                                    order.status
                                                                )}
                                                        </span>
                                                    )}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "16px",
                                                        color: "#495057",
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            padding: "4px 8px",
                                                            borderRadius: "4px",
                                                            fontSize: "12px",
                                                            fontWeight: "500",
                                                            backgroundColor:
                                                                order.payment_status ===
                                                                "pagada"
                                                                    ? "#d4edda"
                                                                    : order.payment_status ===
                                                                      "parcial"
                                                                    ? "#fff3cd"
                                                                    : "#f8d7da",
                                                            color:
                                                                order.payment_status ===
                                                                "pagada"
                                                                    ? "#155724"
                                                                    : order.payment_status ===
                                                                      "parcial"
                                                                    ? "#856404"
                                                                    : "#721c24",
                                                            textTransform:
                                                                "capitalize",
                                                        }}
                                                    >
                                                        {order.payment_status ||
                                                            "pendiente"}
                                                    </span>
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "16px",
                                                        color: "#495057",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            marginBottom: "4px",
                                                        }}
                                                    >
                                                        <strong
                                                            style={{
                                                                color: "#2c3e50",
                                                            }}
                                                        >
                                                            {order.created_by_username ||
                                                                "Usuario"}
                                                        </strong>
                                                    </div>
                                                    {order.created_at && (
                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "12px",
                                                                color: "#6c757d",
                                                                fontStyle:
                                                                    "italic",
                                                            }}
                                                        >
                                                            {new Date(
                                                                order.created_at
                                                            ).toLocaleDateString(
                                                                "es-ES"
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "16px",
                                                        color: "#27ae60",
                                                        fontWeight: "600",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            marginBottom: "4px",
                                                        }}
                                                    >
                                                        <strong
                                                            style={{
                                                                fontSize:
                                                                    "16px",
                                                            }}
                                                        >
                                                            $
                                                            {order.total_amount
                                                                ? parseFloat(
                                                                      order.total_amount
                                                                  ).toLocaleString()
                                                                : order.total
                                                                ? parseFloat(
                                                                      order.total
                                                                  ).toLocaleString()
                                                                : "0"}
                                                        </strong>
                                                    </div>
                                                </td>
                                                <td
                                                    style={{
                                                        padding: "16px",
                                                        textAlign: "center",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            gap: "8px",
                                                            justifyContent:
                                                                "center",
                                                        }}
                                                    >
                                                        <button
                                                            onClick={() =>
                                                                handleShowReceipt(
                                                                    order
                                                                )
                                                            }
                                                            style={{
                                                                padding:
                                                                    "8px 16px",
                                                                backgroundColor:
                                                                    isLoadingReceipt
                                                                        ? "#95a5a6"
                                                                        : "#3498db",
                                                                color: "white",
                                                                border: "none",
                                                                borderRadius:
                                                                    "6px",
                                                                cursor: isLoadingReceipt
                                                                    ? "not-allowed"
                                                                    : "pointer",
                                                                fontSize:
                                                                    "14px",
                                                                fontWeight:
                                                                    "500",
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: "6px",
                                                                opacity:
                                                                    isLoadingReceipt
                                                                        ? 0.7
                                                                        : 1,
                                                            }}
                                                        >
                                                            {isLoadingReceipt ? (
                                                                <svg
                                                                    width="16"
                                                                    height="16"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                    style={{
                                                                        animation:
                                                                            "spin 1s linear infinite",
                                                                    }}
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                                                    />
                                                                </svg>
                                                            ) : (
                                                                <svg
                                                                    width="16"
                                                                    height="16"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                                    />
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={
                                                                            2
                                                                        }
                                                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                                    />
                                                                </svg>
                                                            )}
                                                            {isLoadingReceipt
                                                                ? "Cargando..."
                                                                : "Ver Recibo"}
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleShowPayments(
                                                                    order
                                                                )
                                                            }
                                                            style={{
                                                                padding:
                                                                    "8px 16px",
                                                                backgroundColor:
                                                                    "#27ae60",
                                                                color: "white",
                                                                border: "none",
                                                                borderRadius:
                                                                    "6px",
                                                                cursor: "pointer",
                                                                fontSize:
                                                                    "14px",
                                                                fontWeight:
                                                                    "500",
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: "6px",
                                                            }}
                                                        >
                                                            <svg
                                                                width="16"
                                                                height="16"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                viewBox="0 0 24 24"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    strokeWidth={
                                                                        2
                                                                    }
                                                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                                                                />
                                                            </svg>
                                                            Pagos
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Paginación */}
                            {ordersTotalPages > 1 && (
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        gap: "16px",
                                        marginTop: "24px",
                                        padding: "16px",
                                        backgroundColor: "white",
                                        borderRadius: "8px",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                                    }}
                                >
                                    {/* Botón Primera Página */}
                                    <button
                                        onClick={() => setOrdersPage(1)}
                                        disabled={ordersPage === 1}
                                        style={{
                                            padding: "8px 12px",
                                            borderRadius: 6,
                                            border: "1.5px solid #e3eaf3",
                                            background:
                                                ordersPage === 1
                                                    ? "#f8f9fa"
                                                    : "#fff",
                                            color: "#2c3e50",
                                            fontWeight: 600,
                                            fontSize: "14px",
                                            cursor:
                                                ordersPage === 1
                                                    ? "not-allowed"
                                                    : "pointer",
                                            transition: "all 0.2s ease",
                                        }}
                                        title="Primera página"
                                    >
                                        ⏮
                                    </button>

                                    {/* Botón Anterior */}
                                    <button
                                        onClick={() =>
                                            setOrdersPage(
                                                Math.max(1, ordersPage - 1)
                                            )
                                        }
                                        disabled={ordersPage === 1}
                                        style={{
                                            padding: "8px 16px",
                                            backgroundColor:
                                                ordersPage === 1
                                                    ? "#e9ecef"
                                                    : "#3498db",
                                            color:
                                                ordersPage === 1
                                                    ? "#6c757d"
                                                    : "white",
                                            border: "none",
                                            borderRadius: "6px",
                                            cursor:
                                                ordersPage === 1
                                                    ? "not-allowed"
                                                    : "pointer",
                                            transition: "all 0.2s ease",
                                        }}
                                        title="Página anterior"
                                    >
                                        Anterior
                                    </button>

                                    <span
                                        style={{
                                            color: "#495057",
                                            fontWeight: "600",
                                        }}
                                    >
                                        Página {ordersPage} de{" "}
                                        {ordersTotalPages}
                                    </span>

                                    <button
                                        onClick={() =>
                                            setOrdersPage(
                                                Math.min(
                                                    ordersTotalPages,
                                                    ordersPage + 1
                                                )
                                            )
                                        }
                                        disabled={
                                            ordersPage === ordersTotalPages
                                        }
                                        style={{
                                            padding: "8px 16px",
                                            backgroundColor:
                                                ordersPage === ordersTotalPages
                                                    ? "#e9ecef"
                                                    : "#3498db",
                                            color:
                                                ordersPage === ordersTotalPages
                                                    ? "#6c757d"
                                                    : "white",
                                            border: "none",
                                            borderRadius: "6px",
                                            cursor:
                                                ordersPage === ordersTotalPages
                                                    ? "not-allowed"
                                                    : "pointer",
                                            transition: "all 0.2s ease",
                                        }}
                                        title="Página siguiente"
                                    >
                                        Siguiente
                                    </button>

                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                        }}
                                    >
                                        <span
                                            style={{
                                                color: "#495057",
                                                fontSize: "14px",
                                            }}
                                        >
                                            Ir a:
                                        </span>
                                        <input
                                            type="number"
                                            min="1"
                                            max={ordersTotalPages}
                                            value={goToPage}
                                            onChange={(e) =>
                                                setGoToPage(e.target.value)
                                            }
                                            onKeyPress={handlePageKeyPress}
                                            style={{
                                                width: "60px",
                                                padding: "4px 8px",
                                                border: "1px solid #ced4da",
                                                borderRadius: "4px",
                                                textAlign: "center",
                                            }}
                                        />
                                        <button
                                            onClick={handleGoToPage}
                                            style={{
                                                padding: "4px 8px",
                                                backgroundColor: "#28a745",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                                fontSize: "12px",
                                            }}
                                        >
                                            Ir
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Modal de detalle de orden */}
                            {showOrderDetail && selectedOrder && (
                                <div
                                    style={{
                                        position: "fixed",
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundColor: "rgba(0,0,0,0.5)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        zIndex: 1000,
                                        padding: "20px",
                                    }}
                                    onClick={() => setShowOrderDetail(false)}
                                >
                                    <div
                                        style={{
                                            background: "white",
                                            borderRadius: "16px",
                                            padding: "32px",
                                            maxWidth: "800px",
                                            width: "100%",
                                            maxHeight: "90vh",
                                            overflowY: "auto",
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                marginBottom: "24px",
                                            }}
                                        >
                                            <h3
                                                style={{
                                                    fontSize: "24px",
                                                    fontWeight: "700",
                                                    color: "#2c3e50",
                                                    margin: 0,
                                                }}
                                            >
                                                Detalle de Orden
                                            </h3>
                                            <button
                                                onClick={() =>
                                                    setShowOrderDetail(false)
                                                }
                                                style={{
                                                    background: "none",
                                                    border: "none",
                                                    fontSize: "24px",
                                                    cursor: "pointer",
                                                    color: "#6c757d",
                                                }}
                                            >
                                                ×
                                            </button>
                                        </div>

                                        {/* Información básica */}
                                        <div
                                            style={{
                                                display: "grid",
                                                gridTemplateColumns: "1fr 1fr",
                                                gap: "24px",
                                                marginBottom: "32px",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    background: "#f8f9fa",
                                                    padding: "20px",
                                                    borderRadius: "12px",
                                                }}
                                            >
                                                <h4
                                                    style={{
                                                        fontSize: "16px",
                                                        fontWeight: "600",
                                                        color: "#2c3e50",
                                                        marginBottom: "12px",
                                                    }}
                                                >
                                                    Información de la Orden
                                                </h4>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        gap: "8px",
                                                        fontSize: "14px",
                                                        color: "#495057",
                                                    }}
                                                >
                                                    <div>
                                                        <strong>Número:</strong>{" "}
                                                        {selectedOrder.order_number ||
                                                            selectedOrder.id}
                                                    </div>
                                                    <div>
                                                        <strong>Fecha:</strong>{" "}
                                                        {selectedOrder.order_date
                                                            ? new Date(
                                                                  selectedOrder.order_date
                                                              ).toLocaleDateString(
                                                                  "es-ES"
                                                              )
                                                            : "-"}
                                                    </div>
                                                    <div>
                                                        <strong>Estado:</strong>{" "}
                                                        <span
                                                            className={`status-badge status-${selectedOrder.status}`}
                                                        >
                                                            {translateStatus(
                                                                selectedOrder.status
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <strong>Total:</strong>{" "}
                                                        <span
                                                            style={{
                                                                color: "#27ae60",
                                                                fontWeight:
                                                                    "600",
                                                            }}
                                                        >
                                                            $
                                                            {selectedOrder.total
                                                                ? parseFloat(
                                                                      selectedOrder.total
                                                                  ).toLocaleString()
                                                                : "0"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div
                                                style={{
                                                    background: "#f8f9fa",
                                                    padding: "20px",
                                                    borderRadius: "12px",
                                                }}
                                            >
                                                <h4
                                                    style={{
                                                        fontSize: "16px",
                                                        fontWeight: "600",
                                                        color: "#2c3e50",
                                                        marginBottom: "12px",
                                                    }}
                                                >
                                                    Información del Proveedor
                                                </h4>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        gap: "8px",
                                                        fontSize: "14px",
                                                        color: "#495057",
                                                    }}
                                                >
                                                    <div>
                                                        <strong>
                                                            Proveedor:
                                                        </strong>{" "}
                                                        {selectedOrder.supplier_name ||
                                                            selectedOrder.supplier}
                                                    </div>
                                                    <div>
                                                        <strong>
                                                            Destino:
                                                        </strong>{" "}
                                                        {selectedOrder.destination_name ||
                                                            selectedOrder.destination}
                                                    </div>
                                                    {selectedOrder.notes && (
                                                        <div>
                                                            <strong>
                                                                Notas:
                                                            </strong>{" "}
                                                            {
                                                                selectedOrder.notes
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Productos de la orden */}
                                        <div
                                            style={{
                                                background: "white",
                                                borderRadius: "16px",
                                                padding: "20px",
                                                boxShadow:
                                                    "0 4px 16px rgba(44,62,80,0.08)",
                                                border: "1px solid #e9ecef",
                                                marginBottom: "24px",
                                            }}
                                        >
                                            <h4
                                                style={{
                                                    fontSize: "18px",
                                                    fontWeight: "600",
                                                    color: "#2c3e50",
                                                    marginBottom: "16px",
                                                }}
                                            >
                                                Productos de la Orden
                                            </h4>

                                            {selectedOrder.items &&
                                            selectedOrder.items.length > 0 ? (
                                                <div
                                                    style={{
                                                        overflowX: "auto",
                                                    }}
                                                >
                                                    <table
                                                        style={{
                                                            width: "100%",
                                                            borderCollapse:
                                                                "collapse",
                                                            fontSize: "14px",
                                                        }}
                                                    >
                                                        <thead>
                                                            <tr
                                                                style={{
                                                                    background:
                                                                        "#f8f9fa",
                                                                    borderBottom:
                                                                        "2px solid #dee2e6",
                                                                }}
                                                            >
                                                                <th
                                                                    style={{
                                                                        padding:
                                                                            "12px",
                                                                        textAlign:
                                                                            "left",
                                                                        fontWeight:
                                                                            "600",
                                                                        color: "#495057",
                                                                    }}
                                                                >
                                                                    Producto
                                                                </th>
                                                                <th
                                                                    style={{
                                                                        padding:
                                                                            "12px",
                                                                        textAlign:
                                                                            "center",
                                                                        fontWeight:
                                                                            "600",
                                                                        color: "#495057",
                                                                    }}
                                                                >
                                                                    Cantidad
                                                                </th>
                                                                <th
                                                                    style={{
                                                                        padding:
                                                                            "12px",
                                                                        textAlign:
                                                                            "right",
                                                                        fontWeight:
                                                                            "600",
                                                                        color: "#495057",
                                                                    }}
                                                                >
                                                                    Precio Unit.
                                                                </th>
                                                                <th
                                                                    style={{
                                                                        padding:
                                                                            "12px",
                                                                        textAlign:
                                                                            "right",
                                                                        fontWeight:
                                                                            "600",
                                                                        color: "#495057",
                                                                    }}
                                                                >
                                                                    Subtotal
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {selectedOrder.items.map(
                                                                (item, idx) => (
                                                                    <tr
                                                                        key={
                                                                            idx
                                                                        }
                                                                        style={{
                                                                            borderBottom:
                                                                                "1px solid #f0f0f0",
                                                                            backgroundColor:
                                                                                idx %
                                                                                    2 ===
                                                                                0
                                                                                    ? "#fff"
                                                                                    : "#f8f9fa",
                                                                        }}
                                                                    >
                                                                        <td
                                                                            style={{
                                                                                padding:
                                                                                    "12px",
                                                                                fontWeight:
                                                                                    "500",
                                                                                color: "#2c3e50",
                                                                            }}
                                                                        >
                                                                            {item
                                                                                .purchase_option_details
                                                                                ?.product_name ||
                                                                                item.product_name ||
                                                                                item.product ||
                                                                                "-"}
                                                                        </td>
                                                                        <td
                                                                            style={{
                                                                                padding:
                                                                                    "12px",
                                                                                textAlign:
                                                                                    "center",
                                                                                color: "#495057",
                                                                                fontWeight:
                                                                                    "600",
                                                                            }}
                                                                        >
                                                                            {item.quantity_requested ||
                                                                                item.quantity ||
                                                                                "-"}
                                                                        </td>
                                                                        <td
                                                                            style={{
                                                                                padding:
                                                                                    "12px",
                                                                                textAlign:
                                                                                    "right",
                                                                                color: "#495057",
                                                                                fontWeight:
                                                                                    "500",
                                                                            }}
                                                                        >
                                                                            {item.unit_price
                                                                                ? `$${parseFloat(
                                                                                      item.unit_price
                                                                                  ).toLocaleString(
                                                                                      "es-CO",
                                                                                      {
                                                                                          minimumFractionDigits: 0,
                                                                                      }
                                                                                  )}`
                                                                                : "-"}
                                                                        </td>
                                                                        <td
                                                                            style={{
                                                                                padding:
                                                                                    "12px",
                                                                                color: "#27ae60",
                                                                                fontWeight:
                                                                                    "700",
                                                                                textAlign:
                                                                                    "right",
                                                                            }}
                                                                        >
                                                                            {item.line_total
                                                                                ? `$${parseFloat(
                                                                                      item.line_total
                                                                                  ).toLocaleString(
                                                                                      "es-CO",
                                                                                      {
                                                                                          minimumFractionDigits: 0,
                                                                                      }
                                                                                  )}`
                                                                                : "-"}
                                                                        </td>
                                                                    </tr>
                                                                )
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div
                                                    style={{
                                                        color: "#6c757d",
                                                        textAlign: "center",
                                                        padding: "32px 16px",
                                                        fontSize: "14px",
                                                        fontStyle: "italic",
                                                    }}
                                                >
                                                    No hay productos en esta
                                                    orden.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Modal de Orden de Compra */}
            {showOrderModal && orderModalData && (
                <PurchaseOrderModal
                    isOpen={showOrderModal}
                    onClose={handleCloseOrderModal}
                    orderData={orderModalData.orderData}
                    supplierData={orderModalData.supplierData}
                    locationData={orderModalData.locationData}
                    orderItems={orderModalData.orderItems}
                    totals={orderModalData.totals}
                    notes={orderModalData.notes}
                />
            )}

            {/* Modal de recibo para órdenes existentes */}
            {showReceiptModal && receiptModalData && (
                <PurchaseOrderModal
                    isOpen={showReceiptModal}
                    onClose={handleCloseReceiptModal}
                    orderData={receiptModalData.orderData}
                    supplierData={receiptModalData.supplierData}
                    locationData={receiptModalData.locationData}
                    orderItems={receiptModalData.orderItems}
                    totals={receiptModalData.totals}
                    notes={receiptModalData.notes}
                />
            )}

            {/* Modal de Pagos */}
            <PurchaseOrderPaymentsModal
                isOpen={showPaymentsModal}
                onClose={handleClosePaymentsModal}
                orderData={selectedOrderForPayments}
                onPaymentSuccess={handlePaymentSuccess}
            />

            {/* Modal de Procesando Redirección */}
            {isProcessingRedirect && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.7)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 9999,
                        animation: "fadeIn 0.3s ease-in-out",
                    }}
                >
                    <div
                        style={{
                            backgroundColor: "white",
                            borderRadius: "16px",
                            padding: "40px",
                            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                            textAlign: "center",
                            maxWidth: "500px",
                            margin: "20px",
                            animation: "slideIn 0.4s ease-out",
                        }}
                    >
                        {/* Spinner de carga */}
                        <div
                            style={{
                                width: "60px",
                                height: "60px",
                                border: "4px solid #f3f4f6",
                                borderTop: "4px solid #2c3e50",
                                borderRadius: "50%",
                                animation: "spin 1s linear infinite",
                                margin: "0 auto 24px auto",
                            }}
                        ></div>

                        {/* Título */}
                        <h3
                            style={{
                                fontSize: "24px",
                                fontWeight: "700",
                                color: "#2c3e50",
                                margin: "0 0 16px 0",
                                letterSpacing: "-0.5px",
                            }}
                        >
                            ✅ Orden Recibida
                        </h3>

                        {/* Mensaje */}
                        <p
                            style={{
                                fontSize: "16px",
                                color: "#6c757d",
                                margin: "0 0 8px 0",
                                lineHeight: "1.5",
                            }}
                        >
                            Procesando los productos de la orden...
                        </p>
                        <p
                            style={{
                                fontSize: "14px",
                                color: "#27ae60",
                                margin: "0",
                                fontWeight: "600",
                            }}
                        >
                            📦 Redirigiendo a movimientos de stock
                        </p>

                        {/* Indicador de progreso */}
                        <div
                            style={{
                                marginTop: "24px",
                                padding: "12px 16px",
                                backgroundColor: "#f8f9fa",
                                borderRadius: "8px",
                                fontSize: "12px",
                                color: "#495057",
                                fontStyle: "italic",
                            }}
                        >
                            💡 Los productos serán pre-cargados automáticamente
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default OrdenesDeCompraPage;
