import React, { useState, useCallback, useRef, useEffect } from "react";
import CustomerSelector from "../components/Sales/CustomerSelector";
import ProductSelector from "../components/Sales/ProductSelector";
import SaleItemsList from "../components/Sales/SaleItemsList";
import SaleSummary from "../components/Sales/SaleSummary";
import InvoiceModal from "../components/Sales/InvoiceModal";
import PaymentMethodSelector from "../components/Sales/PaymentMethodSelector";
import CreditConfigurationForm from "../components/Sales/CreditConfigurationForm";
// ❌ REMOVIDO: import BreakdownConfirmationModal from "../components/Sales/BreakdownConfirmationModal";
import ConversionSuggestionsModal from "../components/Sales/ConversionSuggestionsModal";
import { salesService } from "../services/salesService";
import { inventoryService } from "../services/inventoryService";
import { executeConversion } from "../services/conversionService";
import { useAuth } from "../context/AuthContext";
import {
  createSimpleCredit,
  createCreditWithInstallments,
  calculateInstallmentAmount,
  validateInstallmentTotal,
} from "../services/creditsService";

const SalesPage = () => {
    const { authToken } = useAuth();
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [locations, setLocations] = useState([]);
    const [isLoadingLocations, setIsLoadingLocations] = useState(false);
    const [saleItems, setSaleItems] = useState([]);
    const [shouldInvoice, setShouldInvoice] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

  // Estados para métodos de pago
  const [paymentMethod, setPaymentMethod] = useState("normal"); // normal, card, credit
  const [creditConfig, setCreditConfig] = useState({
    hasInitialPayment: false,
    initialPayment: "",
    installmentsCount: 3,
    paymentFrequency: "monthly",
    nextPaymentDate: "",
    installmentAmount: "",
    isValid: false,
  });

    // Estados para la factura
    const [showInvoice, setShowInvoice] = useState(false);
    const [invoiceData, setInvoiceData] = useState(null);

    // Ref para acceder a la función updateProductsStock
    const productSelectorRef = useRef(null);

  // ✅ NUEVO: Estado para sugerencias de conversión
  const [conversionError, setConversionError] = useState(null);

  // ❌ REMOVIDO: Estados para breakdown confirmation modal
  // const [breakdownState, setBreakdownState] = useState({
  //   isOpen: false,
  //   plan: [],
  //   pendingSaleData: null,
  // });

    // Cargar ubicaciones al iniciar
    useEffect(() => {
        const loadLocations = async () => {
            if (!authToken) return;

            setIsLoadingLocations(true);
            try {
                const data = await inventoryService.getLocations(authToken);
                // Filtrar solo las sedes (type: "sede")
        const sedes = data.filter((location) => location.type === "sede");
                setLocations(sedes);

                // Si solo hay una sede, seleccionarla automáticamente
                if (sedes.length === 1) {
                    console.log("Auto-selecting single location:", sedes[0]);
                    setSelectedLocation(sedes[0]);
                }

                console.log("Available locations loaded:", sedes);
            } catch (error) {
                console.error("Error al cargar ubicaciones:", error);
                // En caso de error, mostrar mensaje pero permitir continuar
            } finally {
                setIsLoadingLocations(false);
            }
        };

        loadLocations();
    }, [authToken]);

    const handleAddProduct = useCallback(
        (product, quantity, unitPrice, additionalData = {}) => {
            console.log("handleAddProduct - Recibido:", {
                product: product.name,
                quantity,
                quantityType: typeof quantity,
                unitPrice,
                unitPriceType: typeof unitPrice,
                additionalData,
            });

            setSaleItems((prevItems) => {
                // Para productos con lotes o componentes, no agrupar automáticamente
                // ya que pueden tener diferentes lotes o configuraciones
                const shouldGroup =
                    !additionalData.batches && !additionalData.components;

                let existingIndex = -1;
                if (shouldGroup) {
                    existingIndex = prevItems.findIndex(
                        (item) =>
                            item.product_id === product.id &&
                            !item.batches &&
                            !item.components
                    );
                }

                if (existingIndex !== -1) {
                    const newItems = [...prevItems];
                    newItems[existingIndex] = {
                        ...newItems[existingIndex],
                        quantity: newItems[existingIndex].quantity + quantity,
                    };
                    return newItems;
                }

                const newItem = {
                    product_id: product.id,
                    quantity: quantity,
                    unit_price: unitPrice,
                    product_details: {
                        name: product.name,
                        sku: product.sku,
                        barcode: product.barcode || "",
                        description: product.description || "",
                        category_name: product.category_name,
                        category: product.category || 0,
                        unit: product.unit,
                        product_type: product.product_type || "simple",
            requires_batch_control: product.requires_batch_control || false,
                    },
                    // Agregar información de lotes si existe
                    ...(additionalData.batches && {
                        batches: additionalData.batches,
            selectedBatches: additionalData.batches, // <-- AÑADIDO
                    }),
                    // Agregar información de componentes si existe
                    ...(additionalData.components && {
                        components: additionalData.components,
                    }),
                };

                console.log("handleAddProduct - Nuevo item creado:", newItem);

                return [...prevItems, newItem];
            });
        },
        []
    );

    const handleRemoveItem = useCallback((index) => {
        setSaleItems((prevItems) => prevItems.filter((_, i) => i !== index));
    }, []);

    const handleUpdateItem = useCallback((index, updates) => {
        setSaleItems((prevItems) => {
            const newItems = [...prevItems];
            newItems[index] = {
                ...newItems[index],
                ...updates,
            };
            return newItems;
        });
    }, []);

    const calculateTotals = useCallback(() => {
        const itemCount = saleItems.length;
        const totalQuantity = saleItems.reduce(
            (total, item) => total + item.quantity,
            0
        );
        const subtotal = saleItems.reduce(
      (total, item) => total + parseFloat(item.unit_price) * item.quantity,
            0
        );
        const tax = 0; // Por ahora sin impuestos
        const total = subtotal + tax;

        return {
            itemCount,
            totalQuantity,
            subtotal: subtotal.toFixed(2),
            tax: tax.toFixed(2),
            total: total.toFixed(2),
        };
    }, [saleItems]);

  const attemptCreateSale = async (saleData) => {
    return salesService.createSale(saleData, authToken);
  };

    const handleSubmitSale = async () => {
        if (isSubmitting) return;

        if (!selectedLocation) {
            alert("Por favor seleccione una sede.");
            return;
        }

        if (saleItems.length === 0) {
            alert("Por favor agregue al menos un producto a la venta.");
            return;
        }

    if (paymentMethod === "credit" && !selectedCustomer) {
      alert("Para ventas a crédito es obligatorio seleccionar un cliente.");
      return;
    }

    if (paymentMethod === "credit" && !creditConfig.isValid) {
      alert("Por favor complete correctamente la configuración del crédito.");
      return;
    }

        setIsSubmitting(true);

        try {
            // DIAGNÓSTICO: Verificar conectividad del backend antes de enviar la venta
            console.log("🔍 DIAGNÓSTICO: Iniciando verificaciones previas...");

            // 1. Test de conectividad básica
            try {
                console.log(
                    "🔍 DIAGNÓSTICO: Probando conectividad con endpoint de ubicaciones..."
                );
        const locationsResponse = await fetch("/api/inventory/locations/", {
                        method: "GET",
                        headers: {
                            Authorization: `Token ${authToken}`,
                            "Content-Type": "application/json",
                        },
        });
                console.log(
                    "🔍 DIAGNÓSTICO: Status de ubicaciones:",
                    locationsResponse.status
                );

                if (!locationsResponse.ok) {
          console.warn("⚠️ DIAGNÓSTICO: Problema con conectividad del backend");
                    throw new Error(
                        `Backend no responde correctamente (status: ${locationsResponse.status})`
                    );
                }
            } catch (connectError) {
        console.error("❌ DIAGNÓSTICO: Error de conectividad:", connectError);
                throw new Error(
                    "No se puede conectar con el servidor. Por favor, verifique su conexión e intente nuevamente."
                );
            }

            // 2. Verificar cada producto en la venta
            for (const item of saleItems) {
                try {
                    console.log(
                        `🔍 DIAGNÓSTICO: Verificando producto ${item.product_id}...`
                    );
                    const productResponse = await fetch(
                        `/api/catalogs/products/${item.product_id}/`,
                        {
                            method: "GET",
                            headers: {
                                Authorization: `Token ${authToken}`,
                                "Content-Type": "application/json",
                            },
                        }
                    );

                    if (!productResponse.ok) {
                        console.error(
                            `❌ DIAGNÓSTICO: Producto ${item.product_id} no encontrado (status: ${productResponse.status})`
                        );
                        throw new Error(
                            `El producto con ID ${item.product_id} no existe o no está disponible.`
                        );
                    }

                    const productData = await productResponse.json();
                    console.log(
                        `✅ DIAGNÓSTICO: Producto ${item.product_id} existe:`,
                        productData.name
                    );
                } catch (productError) {
                    console.error(
                        `❌ DIAGNÓSTICO: Error verificando producto ${item.product_id}:`,
                        productError
                    );
                    throw productError;
                }
            }

            // 3. Verificar stock disponible
            console.log(
                "🔍 DIAGNÓSTICO: Verificando stock para todos los productos..."
            );
            try {
                const stockResponse = await fetch(
                    `/api/inventory/stock/?location=${selectedLocation.id}`,
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Token ${authToken}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (stockResponse.ok) {
                    const stockData = await stockResponse.json();
          console.log("🔍 DIAGNÓSTICO: Stock response obtenido:", stockData);

                    for (const item of saleItems) {
                        const productStock = stockData.results
              ? stockData.results.find((s) => s.product === item.product_id)
              : stockData.find((s) => s.product === item.product_id);

                        if (productStock) {
                            console.log(
                                `🔍 DIAGNÓSTICO: Stock para producto ${item.product_id}: ${productStock.quantity} disponible, solicitado: ${item.quantity}`
                            );
                            if (productStock.quantity < item.quantity) {
                                console.warn(
                                    `⚠️ DIAGNÓSTICO: Stock insuficiente para producto ${item.product_id}`
                                );
                            }
                        } else {
                            console.warn(
                                `⚠️ DIAGNÓSTICO: No se encontró stock para producto ${item.product_id}`
                            );
                        }
                    }
                } else {
                    console.warn(
                        "⚠️ DIAGNÓSTICO: No se pudo obtener información de stock"
                    );
                }
            } catch (stockError) {
        console.warn("⚠️ DIAGNÓSTICO: Error obteniendo stock:", stockError);
            }

            console.log(
                "✅ DIAGNÓSTICO: Verificaciones completadas, procediendo con la venta..."
            );

            // Mapear items según el formato esperado
            const mappedItems = [];

            saleItems.forEach((item) => {
                // Si el producto tiene lotes seleccionados
                if (item.selectedBatches && item.selectedBatches.length > 0) {
                    item.selectedBatches.forEach((batch) => {
                        mappedItems.push({
                            product: item.product_id,
                            batch: batch.batch_id,
                            quantity: batch.quantity,
                            unit_price: item.unit_price.toString(),
                        });
                    });
                } else {
                    // Producto sin lotes o sin lotes seleccionados
                    mappedItems.push({
                        product: item.product_id,
                        quantity: item.quantity,
                        unit_price: item.unit_price.toString(),
                    });
                }
            });

            console.log("handleSubmitSale - mappedItems:", mappedItems);

            console.log("Método de pago a enviar (paymentMethod):", paymentMethod);
            const fixedPaymentMethod = paymentMethod === "cash" ? "normal" : paymentMethod;
            console.log("Método de pago corregido (fixedPaymentMethod):", fixedPaymentMethod);
            const saleData = {
                customer: selectedCustomer ? selectedCustomer.id : null,
                location: selectedLocation.id,
                sale_type: fixedPaymentMethod,
                should_invoice: shouldInvoice,
                items: mappedItems,
            };

            console.log("Datos de la venta a enviar:", saleData);
            console.log("Items en la venta:", saleData.items);
            console.log(
                "JSON completo que se enviará:",
                JSON.stringify(saleData, null, 2)
            );

      let response;
      try {
        response = await attemptCreateSale(saleData);
      } catch (err) {
    // ✅ NUEVO: Manejo de errores con sugerencias de conversión
    if (err.status === 400 && err.raw && err.raw.error && err.raw.error.suggestions) {
      // Error de stock insuficiente con sugerencias de conversión
      setConversionError(err.raw.error);
          setIsSubmitting(false);
      return; // Esperar interacción del usuario
        }
    throw err; // Otro tipo de error
      }

      // Si el método de pago es crédito, crear la cuenta de crédito
      if (paymentMethod === "credit") {
        try {
          const totalAmount = parseFloat(totals.total);

          console.log("🔍 DEBUG - Configuración de crédito:", creditConfig);
          console.log("🔍 DEBUG - Total amount:", totalAmount);

          // Usar cálculo simple y directo

          const initialPayment =
            creditConfig.hasInitialPayment && creditConfig.initialPayment
              ? parseFloat(creditConfig.initialPayment)
              : 0;

          // Las cuotas deben calcularse sobre el saldo restante después del pago inicial
          const remainingAmount = totalAmount - initialPayment;

          // Calcular cuotas sobre el saldo restante
          const installmentAmount = calculateInstallmentAmount(
            totalAmount,
            initialPayment,
            parseInt(creditConfig.installmentsCount)
          );

          // Validar que la suma sea correcta
          const validation = validateInstallmentTotal(
            totalAmount,
            initialPayment,
            installmentAmount,
            parseInt(creditConfig.installmentsCount)
          );

          console.log("🔍 DEBUG - Configuración de crédito:", creditConfig);
          console.log("🔍 DEBUG - Total amount:", totalAmount);
          console.log("🔍 DEBUG - Initial payment:", initialPayment);
          console.log("🔍 DEBUG - Installment amount:", installmentAmount);
          console.log(
            "🔍 DEBUG - Total cuotas:",
            installmentAmount * parseInt(creditConfig.installmentsCount)
          );
          console.log(
            "🔍 DEBUG - Suma (pago inicial + cuotas):",
            initialPayment +
              installmentAmount * parseInt(creditConfig.installmentsCount)
          );
          console.log("🔍 DEBUG - Validation result:", validation);

          if (
            creditConfig.hasInitialPayment &&
            creditConfig.initialPayment &&
            parseFloat(creditConfig.initialPayment) > 0
          ) {
            // Crear crédito con pago inicial y cuotas
            const creditData = {
              sale_id: response.id,
              original_amount: totalAmount.toString(),
              initial_payment: creditConfig.initialPayment.toString(),
              installments_count: parseInt(creditConfig.installmentsCount),
              installment_amount: installmentAmount.toString(),
              payment_frequency: creditConfig.paymentFrequency,
              next_payment_date: creditConfig.nextPaymentDate,
            };

            console.log(
              "🔍 DEBUG - Enviando datos de crédito con pago inicial:",
              creditData
            );
            console.log("🔍 DEBUG - Verificación matemática:");
            console.log("  - Monto original:", creditData.original_amount);
            console.log("  - Pago inicial:", creditData.initial_payment);
            console.log("  - Cuotas:", creditData.installments_count);
            console.log("  - Monto por cuota:", creditData.installment_amount);
            console.log(
              "  - Total cuotas:",
              parseFloat(creditData.installment_amount) *
                creditData.installments_count
            );
            console.log(
              "  - Suma (pago inicial + cuotas):",
              parseFloat(creditData.initial_payment) +
                parseFloat(creditData.installment_amount) *
                  creditData.installments_count
            );
            console.log("  - ¿Suma ≈ Monto original?", validation.isValid);
            console.log("  - Diferencia:", validation.difference);
            const creditResponse = await createCreditWithInstallments(
              creditData,
              authToken
            );
            console.log("✅ Crédito con pago inicial creado:", creditResponse);
          } else {
            // Crear crédito simple con solo cuotas (sin pago inicial)
            const creditData = {
              sale_id: response.id,
              original_amount: totalAmount.toString(),
              installments_count: parseInt(creditConfig.installmentsCount),
              installment_amount: installmentAmount.toString(),
              payment_frequency: creditConfig.paymentFrequency,
              next_payment_date: creditConfig.nextPaymentDate,
            };

            console.log(
              "🔍 DEBUG - Enviando datos de crédito simple:",
              creditData
            );
            console.log(
              "🔍 DEBUG - Verificación matemática (sin pago inicial):"
            );
            console.log("  - Monto original:", creditData.original_amount);
            console.log("  - Cuotas:", creditData.installments_count);
            console.log("  - Monto por cuota:", creditData.installment_amount);
            console.log(
              "  - Total cuotas:",
              parseFloat(creditData.installment_amount) *
                creditData.installments_count
            );
            console.log(
              "  - ¿Total cuotas ≈ Monto original?",
              validation.isValid
            );
            console.log("  - Diferencia:", validation.difference);
            const creditResponse = await createCreditWithInstallments(
              creditData,
              authToken
            );
            console.log("✅ Crédito simple creado:", creditResponse);
          }
        } catch (creditError) {
          console.error("❌ Error al crear crédito:", creditError);
          console.error("❌ Detalles del error:", creditError.message);
          // Mostrar alerta pero no fallar la venta
          alert(
            "⚠️ Venta registrada pero hubo un error al crear el crédito. Contacte al administrador.\n\nError: " +
              creditError.message
          );
        }
      }

            // Si la venta requiere factura, mostrar el modal de factura
            if (shouldInvoice) {
                setInvoiceData({
                    saleData: response,
                    customerData: selectedCustomer,
                    locationData: selectedLocation,
                    saleItems: saleItems,
                    totals: totals,
          paymentMethod: paymentMethod,
                });
                setShowInvoice(true);
            } else {
        const successMessage =
          paymentMethod === "credit"
            ? `¡Venta registrada exitosamente! ID: ${response.id}\n💳 Crédito configurado correctamente.`
            : `¡Venta registrada exitosamente! ID: ${response.id}`;
        alert(successMessage);
            }

            // Actualizar stock localmente
            if (productSelectorRef.current) {
                productSelectorRef.current.updateProductsStock(saleItems);
            }

            // Reset form
            setSelectedCustomer(null);
            setSaleItems([]);
            setShouldInvoice(false);
      setPaymentMethod("normal");
      setCreditConfig({
        hasInitialPayment: false,
        initialPayment: "",
        installmentsCount: 3,
        paymentFrequency: "monthly",
        nextPaymentDate: "",
        installmentAmount: "",
        isValid: false,
      });
            // No resetear la sede seleccionada para facilitar múltiples ventas consecutivas
        } catch (error) {
            console.error("Error al registrar venta:", error);

            // Mejorar mensaje de error para problemas de stock
            let errorMessage = "Error al registrar la venta: ";

            if (error.message.includes("Problemas de stock")) {
                errorMessage =
                    "❌ No se pudo registrar la venta:\n\n" +
                    error.message +
                    "\n\nPor favor, verifique el stock disponible de los productos.";
            } else if (
                error.message.includes("stock") ||
                error.message.includes("inventory")
            ) {
                errorMessage = "❌ Problema de inventario: " + error.message;
            } else if (
                error.message.includes("conectar") ||
                error.message.includes("servidor")
            ) {
                errorMessage = "❌ Problema de conexión: " + error.message;
            } else if (
                error.message.includes("no existe") ||
                error.message.includes("no encontrado")
            ) {
                errorMessage = "❌ Problema con el producto: " + error.message;
            } else {
                errorMessage += error.message || "Error desconocido";
            }

            alert(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Función para cerrar el modal de factura
    const handleCloseInvoice = useCallback(() => {
        setShowInvoice(false);
        setInvoiceData(null);

        // Mostrar mensaje de éxito después de cerrar la factura
        if (invoiceData) {
      alert(`¡Venta registrada exitosamente! ID: ${invoiceData.saleData.id}`);
        }
    }, [invoiceData]);

    const totals = calculateTotals();

  // ✅ NUEVO: Funciones para manejar conversiones
  const handleCancelConversion = () => {
    setConversionError(null);
  };

  const handleConfirmConversion = async (selectedSuggestion, selectedBatch) => {
    if (!selectedSuggestion || !selectedLocation) return;

    setIsSubmitting(true);
    setConversionError(null);

    try {
      // 1. Ejecutar la conversión
      const conversionData = {
        conversion_id: selectedSuggestion.conversion_id,
        quantity_to_convert: selectedSuggestion.units_needed,
        location_id: selectedLocation.id,
        notes: `Conversión manual para venta - ${selectedSuggestion.from_product.name} → ${selectedSuggestion.to_product.name}`
      };

      // Agregar batch_id si el producto origen requiere control de lotes
      if (selectedSuggestion.from_product.requires_batch_control && selectedBatch) {
        conversionData.batch_id = selectedBatch.batch_id; // Usar batch_id de la nueva estructura
      }

      console.log("Executing conversion:", conversionData);
      const conversionResult = await executeConversion(conversionData, authToken);
      console.log("Conversion successful:", conversionResult);

      // 2. Mostrar mensaje de éxito de la conversión con información detallada de lotes
      let successMessage = `✅ Conversión exitosa: +${selectedSuggestion.would_convert_to} ${conversionError.product} disponibles`;
      
      // Mostrar información de herencia de lotes si está disponible
      if (conversionResult.batch_info) {
        successMessage += `\n\n🏷️ Información de lotes:`;
        successMessage += `\n📦 Lote utilizado: ${conversionResult.batch_info.from_batch}`;
        successMessage += `\n🧪 Lote heredado creado: ${conversionResult.batch_info.to_batch}`;
        successMessage += `\n📅 Fecha de vencimiento heredada: ${new Date(conversionResult.batch_info.expiry_date).toLocaleDateString()}`;
      } else if (selectedBatch) {
        // Fallback para mostrar información del lote seleccionado
        successMessage += `\n\n📦 Lote utilizado: ${selectedBatch.batch_number}`;
        successMessage += `\n🧪 Se creó automáticamente un lote heredado para el producto destino`;
      }
      
      successMessage += `\n\n🔄 Ahora reintentando la venta...`;
      alert(successMessage);

      // 3. Reintentar la venta original
      await retryOriginalSale();

    } catch (error) {
      console.error("Error executing conversion:", error);
      
      // Manejo específico de errores de lotes
      if (error.status === 400 && error.raw && error.raw.batch) {
        alert(`❌ Error de lote: ${error.raw.batch[0] || 'Problema con el lote seleccionado'}`);
      } else {
        alert(`❌ Error al ejecutar conversión: ${error.message}`);
      }
      setIsSubmitting(false);
    }
  };

  const retryOriginalSale = async () => {
    // Recrear los datos de venta original y reintentarla
    const mappedItems = [];

    saleItems.forEach((item) => {
      if (item.selectedBatches && item.selectedBatches.length > 0) {
        item.selectedBatches.forEach((batch) => {
          mappedItems.push({
            product: item.product_id,
            batch: batch.batch_id,
            quantity: batch.quantity,
            unit_price: item.unit_price.toString(),
          });
        });
      } else {
        mappedItems.push({
          product: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price.toString(),
        });
      }
    });

    const saleData = {
      customer: selectedCustomer ? selectedCustomer.id : null,
      location: selectedLocation.id,
      sale_type: paymentMethod, // Puede ser 'normal', 'card', 'credit'
      should_invoice: shouldInvoice,
      items: mappedItems,
    };

    try {
      const response = await salesService.createSale(saleData, authToken);
      
      // ✅ Manejar créditos si es necesario (igual que en el flujo original)
      if (paymentMethod === "credit") {
        try {
          const totalAmount = parseFloat(totals.total);
          const initialPayment = creditConfig.hasInitialPayment && creditConfig.initialPayment
            ? parseFloat(creditConfig.initialPayment) : 0;
          const installmentAmount = calculateInstallmentAmount(
            totalAmount, initialPayment, parseInt(creditConfig.installmentsCount)
          );

          if (creditConfig.hasInitialPayment && creditConfig.initialPayment && parseFloat(creditConfig.initialPayment) > 0) {
            const creditData = {
              sale_id: response.id,
              original_amount: totalAmount.toString(),
              initial_payment: creditConfig.initialPayment.toString(),
              installments_count: parseInt(creditConfig.installmentsCount),
              installment_amount: installmentAmount.toString(),
              payment_frequency: creditConfig.paymentFrequency,
              next_payment_date: creditConfig.nextPaymentDate,
            };
            await createCreditWithInstallments(creditData, authToken);
          } else {
            const creditData = {
              sale_id: response.id,
              original_amount: totalAmount.toString(),
              installments_count: parseInt(creditConfig.installmentsCount),
              installment_amount: installmentAmount.toString(),
              payment_frequency: creditConfig.paymentFrequency,
              next_payment_date: creditConfig.nextPaymentDate,
            };
            await createCreditWithInstallments(creditData, authToken);
          }
        } catch (creditError) {
          console.error("❌ Error al crear crédito después de conversión:", creditError);
          alert(`⚠️ Venta registrada pero hubo un error al crear el crédito: ${creditError.message}`);
        }
      }
      
      // ✅ Venta exitosa después de conversión
      if (shouldInvoice) {
        setInvoiceData({
          saleData: response,
          customerData: selectedCustomer,
          locationData: selectedLocation,
          saleItems: saleItems,
          totals: totals,
          paymentMethod: paymentMethod,
        });
        setShowInvoice(true);
      } else {
        const successMessage = paymentMethod === "credit"
          ? `🎉 ¡Venta registrada exitosamente después de conversión! ID: ${response.id}\n💳 Crédito configurado correctamente.`
          : `🎉 ¡Venta registrada exitosamente después de conversión! ID: ${response.id}`;
        alert(successMessage);
      }

      // Reset form
      setSelectedCustomer(null);
      setSaleItems([]);
      setShouldInvoice(false);
      setPaymentMethod("normal");
      setCreditConfig({
        hasInitialPayment: false,
        initialPayment: "",
        installmentsCount: 3,
        paymentFrequency: "monthly",
        nextPaymentDate: "",
        installmentAmount: "",
        isValid: false,
      });

    } catch (retryError) {
      console.error("Error retrying sale after conversion:", retryError);
      
      // Si sigue habiendo problemas de stock después de la conversión
      if (retryError.status === 400 && retryError.raw && retryError.raw.error && retryError.raw.error.suggestions) {
        setConversionError(retryError.raw.error);
      } else {
        alert(`❌ Error al reintentar venta: ${retryError.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ❌ REMOVIDO: Funciones de manejo de ruptura de kits/cajas
  // const handleCancelBreakdown = () => {
  //   setBreakdownState({ isOpen: false, plan: [], pendingSaleData: null });
  // };

  // const handleConfirmBreakdown = async () => {
  //   if (!breakdownState.pendingSaleData) return;
  //   const newData = {
  //     ...breakdownState.pendingSaleData,
  //     confirm_breakdown: true,
  //   };
  //   setBreakdownState((prev) => ({ ...prev, isOpen: false }));
  //   setIsSubmitting(true);
  //   try {
  //     const response = await attemptCreateSale(newData);
  //     // reuse logic after successful response
  //     // Simplest: set saleItems and show success
  //     alert(`¡Venta registrada (desarmando kits)! ID: ${response.id}`);
  //     // TODO: replicate credit logic etc (omitted for brevity)
  //     // Reset forms similar to success path earlier
  //     setSaleItems([]);
  //   } catch (err) {
  //     console.error("Error after confirming breakdown:", err);
  //     alert(err.message || "Error al registrar venta con ruptura");
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

    return (
        <>
            {/* CSS global para box-sizing */}
            <style>
                {`
                    * {
                        box-sizing: border-box;
                    }
                    
                    @media (max-width: 1024px) {
                        .sales-grid {
                            grid-template-columns: 1fr !important;
                        }
                        
                        .sales-summary {
                            position: static !important;
                        }
                    }
                    
                    @media (max-width: 768px) {
                        .sales-payment-grid,
                        .sales-customer-grid,
                        .sales-product-info-grid {
                            grid-template-columns: 1fr !important;
                        }
                        
                        .sales-product-grid {
                            grid-template-columns: 1fr 1fr !important;
                        }
                    }
                    
                    @media (max-width: 480px) {
                        .sales-product-grid,
                        .sales-payment-grid,
                        .sales-customer-grid,
                        .sales-product-info-grid {
                            grid-template-columns: 1fr !important;
                        }
                    }
                `}
            </style>

            <div
                style={{
                    padding: "20px",
                    maxWidth: "1400px",
                    margin: "0 auto",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                    backgroundColor: "#f8f9fa",
                    minHeight: "calc(100vh - 140px)",
                }}
            >
                {/* Título de la página */}
                <div
                    style={{
                        marginBottom: "30px",
                        borderBottom: "2px solid #eee",
                        paddingBottom: "15px",
                        backgroundColor: "white",
                        padding: "20px",
                        borderRadius: "8px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
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
                        Registrar Venta
                    </h1>
                    <p
                        style={{
                            color: "#6c757d",
                            fontSize: "16px",
                            margin: 0,
                        }}
                    >
            Complete la información de la venta y agregue los productos
                    </p>
                </div>

                {/* Contenido principal */}
                <div
                    className="sales-grid"
                    style={{
                        display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(300px, 350px)",
                        gap: "20px",
                    }}
                >
                    {/* Columna izquierda */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "20px",
                            minWidth: 0,
                        }}
                    >
                        {/* Selector de Cliente */}
                        <div
                            style={{
                                backgroundColor: "white",
                                borderRadius: "8px",
                                padding: "20px",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                border: "1px solid #dee2e6",
                            }}
                        >
                            <h3
                                style={{
                                    color: "#2c3e50",
                                    fontSize: "18px",
                                    fontWeight: "600",
                                    margin: "0 0 15px 0",
                                }}
                            >
                                1. Seleccionar Cliente
                            </h3>
                            <CustomerSelector
                                selectedCustomer={selectedCustomer}
                                onCustomerSelected={setSelectedCustomer}
                            />
                        </div>

                        {/* Selector de Sede */}
                        <div
                            style={{
                                backgroundColor: "white",
                                borderRadius: "8px",
                                padding: "20px",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                border: "1px solid #dee2e6",
                            }}
                        >
                            <h3
                                style={{
                                    color: "#2c3e50",
                                    fontSize: "18px",
                                    fontWeight: "600",
                                    margin: "0 0 15px 0",
                                }}
                            >
                                2. Seleccionar Sede
                            </h3>

                            {isLoadingLocations ? (
                                <div
                                    style={{
                                        padding: "15px",
                                        textAlign: "center",
                                        color: "#6c757d",
                                        fontSize: "14px",
                                    }}
                                >
                                    Cargando sedes...
                                </div>
                            ) : (
                                <div
                                    style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: "10px",
                                    }}
                                >
                                    {locations.map((location) => (
                                        <button
                                            key={location.id}
                                            onClick={() => {
                        console.log("Location selected:", location);
                                                setSelectedLocation(location);
                                            }}
                                            style={{
                                                padding: "10px 15px",
                                                border:
                          selectedLocation?.id === location.id
                                                        ? "2px solid #3498db"
                                                        : "1px solid #dee2e6",
                                                borderRadius: "6px",
                                                backgroundColor:
                          selectedLocation?.id === location.id
                                                        ? "#e8f4fd"
                                                        : "white",
                                                color:
                          selectedLocation?.id === location.id
                                                        ? "#2c3e50"
                                                        : "#6c757d",
                                                cursor: "pointer",
                                                fontSize: "14px",
                                                fontWeight: "500",
                                                transition: "all 0.2s ease",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                            }}
                                        >
                                            <span style={{ fontSize: "16px" }}>
                        {selectedLocation?.id === location.id ? "🏢" : "🏪"}
                                            </span>
                                            {location.name}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {selectedLocation && (
                                <div
                                    style={{
                                        marginTop: "15px",
                                        padding: "12px",
                                        backgroundColor: "#d4edda",
                                        border: "1px solid #c3e6cb",
                                        borderRadius: "6px",
                                        fontSize: "14px",
                                        color: "#155724",
                                    }}
                                >
                  ✅ <strong>Sede seleccionada:</strong> {selectedLocation.name}
                                    {selectedLocation.address && (
                                        <div
                                            style={{
                                                marginTop: "4px",
                                                fontSize: "12px",
                                            }}
                                        >
                                            📍 {selectedLocation.address}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Selector de Productos */}
                        <div
                            style={{
                                backgroundColor: "white",
                                borderRadius: "8px",
                                padding: "20px",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                border: "1px solid #dee2e6",
                            }}
                        >
                            <h3
                                style={{
                                    color: "#2c3e50",
                                    fontSize: "18px",
                                    fontWeight: "600",
                                    margin: "0 0 15px 0",
                                }}
                            >
                                3. Agregar Productos
                            </h3>
                            <ProductSelector
                                ref={productSelectorRef}
                                onProductAdded={handleAddProduct}
                                selectedLocation={selectedLocation}
                                availableLocations={locations}
                            />
                        </div>

                        {/* Lista de productos */}
                        <div
                            style={{
                                backgroundColor: "white",
                                borderRadius: "8px",
                                padding: "20px",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                border: "1px solid #dee2e6",
                            }}
                        >
                            <h3
                                style={{
                                    color: "#2c3e50",
                                    fontSize: "18px",
                                    fontWeight: "600",
                                    margin: "0 0 15px 0",
                                }}
                            >
                                4. Productos en la Venta
                            </h3>
                            <SaleItemsList
                                items={saleItems}
                                onRemoveItem={handleRemoveItem}
                                onUpdateItem={handleUpdateItem}
                            />
                        </div>

                        {/* Opciones de venta */}
                        <div
                            style={{
                                backgroundColor: "white",
                                borderRadius: "8px",
                                padding: "20px",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                border: "1px solid #dee2e6",
                            }}
                        >
                            <h3
                                style={{
                                    color: "#2c3e50",
                                    fontSize: "18px",
                                    fontWeight: "600",
                                    margin: "0 0 15px 0",
                                }}
                            >
                                5. Opciones de Venta
                            </h3>

              {/* Método de Pago */}
              <PaymentMethodSelector
                selectedMethod={paymentMethod}
                onMethodChange={setPaymentMethod}
                disabled={isSubmitting}
              />

                                {/* Factura */}
              <div style={{ marginTop: "20px" }}>
                                    <label
                                        style={{
                                            display: "block",
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            color: "#2c3e50",
                                            marginBottom: "8px",
                                        }}
                                    >
                                        Facturación
                                    </label>
                                    <label
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            cursor: "pointer",
                                            padding: "10px",
                                            border: "1px solid #dee2e6",
                                            borderRadius: "4px",
                    backgroundColor: shouldInvoice ? "#e8f4fd" : "white",
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={shouldInvoice}
                    onChange={(e) => setShouldInvoice(e.target.checked)}
                                            style={{ marginRight: "8px" }}
                                        />
                                        <span
                                            style={{
                                                fontSize: "14px",
                                                color: "#2c3e50",
                                            }}
                                        >
                                            📄 Requiere factura
                                        </span>
                                    </label>
                                </div>

              {/* Configuración de Crédito */}
              {paymentMethod === "credit" && (
                <CreditConfigurationForm
                  totalAmount={parseFloat(totals.total)}
                  creditConfig={creditConfig}
                  onConfigChange={setCreditConfig}
                  disabled={isSubmitting}
                />
              )}
                        </div>
                    </div>

                    {/* Columna derecha - Resumen */}
                    <div
                        className="sales-summary"
                        style={{
                            position: "sticky",
                            top: "20px",
                            height: "fit-content",
                        }}
                    >
                        <SaleSummary
                            totals={totals}
                            shouldInvoice={shouldInvoice}
                            selectedLocation={selectedLocation}
              paymentMethod={paymentMethod}
                            onSubmit={handleSubmitSale}
                            isLoading={isSubmitting}
                            disabled={
                                !selectedCustomer ||
                                !selectedLocation ||
                saleItems.length === 0 ||
                (paymentMethod === "credit" && !creditConfig.isValid)
                            }
                        />
                    </div>
                </div>
            </div>

            {/* Modal de Factura */}
            {showInvoice && invoiceData && (
                <InvoiceModal
                    isOpen={showInvoice}
                    onClose={handleCloseInvoice}
                    saleData={invoiceData.saleData}
                    customerData={invoiceData.customerData}
                    locationData={invoiceData.locationData}
                    saleItems={invoiceData.saleItems}
                    totals={invoiceData.totals}
          paymentMethod={invoiceData.paymentMethod}
        />
      )}

      {/* ❌ REMOVIDO: BreakdownConfirmationModal */}
       
       {/* ✅ NUEVO: Modal de sugerencias de conversión */}
       <ConversionSuggestionsModal
         isOpen={!!conversionError}
         error={conversionError}
         locationId={selectedLocation?.id}
         onCancel={handleCancelConversion}
         onConfirm={handleConfirmConversion}
      />
        </>
    );
};

export default SalesPage;
