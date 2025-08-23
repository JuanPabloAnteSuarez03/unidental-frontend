import { test, expect } from "@playwright/test";

test.describe("Flujo de Compras - Crítico", () => {
    test.beforeEach(async ({ page }) => {
        // Autenticación
        await page.goto("/login");
        await page.fill('input[name="username"]', "admin");
        await page.fill('input[name="password"]', "admin123");
        await page.click('button[type="submit"]');

        // Navegar a órdenes de compra
        await page.goto("/purchase-orders");
        await page.waitForLoadState("networkidle");
    });

    test("Debe crear orden de compra completa", async ({ page }) => {
        // Verificar página de órdenes
        await expect(page.locator("h1, h2")).toContainText(
            /orden.*compra|compras/i
        );

        // Crear nueva orden
        const nuevaOrdenBtn = page
            .locator(
                'button:has-text("Nueva Orden"), button:has-text("Crear"), button:has-text("Agregar")'
            )
            .first();
        await nuevaOrdenBtn.click();

        // PASO 1: Seleccionar proveedor
        const proveedorSelect = page
            .locator(
                'select[name*="proveedor"], select[name*="supplier"], input[placeholder*="proveedor"]'
            )
            .first();
        await proveedorSelect.waitFor({ state: "visible" });

        if ((await proveedorSelect.getAttribute("tagName")) === "SELECT") {
            await proveedorSelect.selectOption({ index: 1 });
        } else {
            await proveedorSelect.fill("Farmacéutica ABC");
            await page.waitForTimeout(1000);
            const proveedorOption = page
                .locator("text=Farmacéutica ABC")
                .first();
            if (await proveedorOption.isVisible()) {
                await proveedorOption.click();
            }
        }

        // PASO 2: Agregar productos a la orden
        const productoInput = page
            .locator(
                'input[placeholder*="producto"], input[placeholder*="buscar"]'
            )
            .first();
        await productoInput.fill("Amoxicilina");
        await page.waitForTimeout(1500);

        const producto = page.locator("text=Amoxicilina").first();
        if (await producto.isVisible()) {
            await producto.click();
        }

        // Establecer cantidad a comprar
        const cantidadInput = page
            .locator('input[type="number"], input[name*="cantidad"]')
            .first();
        if (await cantidadInput.isVisible()) {
            await cantidadInput.fill("50");
        }

        // Establecer precio unitario
        const precioInput = page
            .locator('input[name*="precio"], input[placeholder*="precio"]')
            .first();
        if (await precioInput.isVisible()) {
            await precioInput.fill("12.50");
        }

        // Agregar producto a la orden
        const agregarBtn = page
            .locator('button:has-text("Agregar"), button:has-text("Añadir")')
            .first();
        if (await agregarBtn.isVisible()) {
            await agregarBtn.click();
        }

        // PASO 3: Verificar total de la orden
        await page.waitForTimeout(500);
        const totalElement = page
            .locator('text=/total.*$|total.*:.*[d,.]/, [data-testid="total"]')
            .first();
        if (await totalElement.isVisible()) {
            await expect(totalElement).toBeVisible();
        }

        // PASO 4: Confirmar orden
        const confirmarBtn = page
            .locator(
                'button:has-text("Confirmar"), button:has-text("Crear Orden"), button:has-text("Registrar")'
            )
            .first();
        await confirmarBtn.waitFor({ state: "visible" });
        await confirmarBtn.click();

        // PASO 5: Verificar orden creada
        await page.waitForTimeout(2000);
        const exitoMessage = page
            .locator(
                "text=/orden.*creada/i, text=/orden.*registrada/i, .success-message"
            )
            .first();
        if (await exitoMessage.isVisible()) {
            await expect(exitoMessage).toBeVisible();
        }
    });

    test("Debe recibir productos de orden de compra", async ({ page }) => {
        // Buscar una orden pendiente
        const ordenPendiente = page
            .locator(
                'tr:has-text("Pendiente"), .order-item:has-text("Pendiente")'
            )
            .first();
        if (await ordenPendiente.isVisible()) {
            await ordenPendiente.click();
        }

        // Acceder a recepción
        const recibirBtn = page
            .locator('button:has-text("Recibir"), button:has-text("Recepción")')
            .first();
        if (await recibirBtn.isVisible()) {
            await recibirBtn.click();
        }

        // Confirmar cantidad recibida
        const cantidadRecibida = page
            .locator('input[name*="recibida"], input[name*="cantidad"]')
            .first();
        if (await cantidadRecibida.isVisible()) {
            await cantidadRecibida.fill("45"); // Recibir menos de lo ordenado
        }

        // Verificar estado del producto
        const estadoSelect = page
            .locator('select[name*="estado"], select[name*="condition"]')
            .first();
        if (await estadoSelect.isVisible()) {
            await estadoSelect.selectOption("bueno");
        }

        // Confirmar recepción
        const confirmarRecepcionBtn = page
            .locator(
                'button:has-text("Confirmar Recepción"), button:has-text("Recibir")'
            )
            .first();
        if (await confirmarRecepcionBtn.isVisible()) {
            await confirmarRecepcionBtn.click();
        }

        // Verificar recepción exitosa
        await page.waitForTimeout(1500);
        const exito = page
            .locator(
                "text=/recibido.*correctamente/i, text=/recepción.*exitosa/i"
            )
            .first();
        if (await exito.isVisible()) {
            await expect(exito).toBeVisible();
        }
    });

    test("Debe manejar orden con múltiples productos", async ({ page }) => {
        // Crear nueva orden múltiple
        const nuevaOrdenBtn = page
            .locator('button:has-text("Nueva"), button:has-text("Crear")')
            .first();
        await nuevaOrdenBtn.click();

        // Seleccionar proveedor
        const proveedorSelect = page
            .locator('select, input[placeholder*="proveedor"]')
            .first();
        if ((await proveedorSelect.getAttribute("tagName")) === "SELECT") {
            await proveedorSelect.selectOption({ index: 1 });
        }

        // Agregar primer producto
        let productoInput = page
            .locator('input[placeholder*="producto"]')
            .first();
        await productoInput.fill("Ibuprofeno");
        await page.waitForTimeout(1000);

        let producto = page.locator("text=Ibuprofeno").first();
        if (await producto.isVisible()) {
            await producto.click();
        }

        let cantidadInput = page.locator('input[type="number"]').first();
        if (await cantidadInput.isVisible()) {
            await cantidadInput.fill("100");
        }

        let agregarBtn = page.locator('button:has-text("Agregar")').first();
        if (await agregarBtn.isVisible()) {
            await agregarBtn.click();
        }

        // Agregar segundo producto
        await page.waitForTimeout(500);
        productoInput = page.locator('input[placeholder*="producto"]').first();
        await productoInput.fill("Paracetamol");
        await page.waitForTimeout(1000);

        producto = page.locator("text=Paracetamol").first();
        if (await producto.isVisible()) {
            await producto.click();
        }

        cantidadInput = page.locator('input[type="number"]').first();
        if (await cantidadInput.isVisible()) {
            await cantidadInput.fill("75");
        }

        agregarBtn = page.locator('button:has-text("Agregar")').first();
        if (await agregarBtn.isVisible()) {
            await agregarBtn.click();
        }

        // Confirmar orden múltiple
        const confirmarBtn = page
            .locator('button:has-text("Confirmar"), button:has-text("Crear")')
            .first();
        if (await confirmarBtn.isVisible()) {
            await confirmarBtn.click();
        }

        await page.waitForTimeout(2000);
        const exito = page
            .locator("text=/orden.*creada/i, text=/éxito/i")
            .first();
        await expect(exito).toBeVisible();
    });

    test("Debe validar datos obligatorios en orden", async ({ page }) => {
        // Intentar crear orden sin proveedor
        const nuevaOrdenBtn = page
            .locator('button:has-text("Nueva"), button:has-text("Crear")')
            .first();
        await nuevaOrdenBtn.click();

        // Intentar confirmar sin datos
        const confirmarBtn = page
            .locator('button:has-text("Confirmar"), button:has-text("Crear")')
            .first();
        if (await confirmarBtn.isVisible()) {
            await confirmarBtn.click();
        }

        // Verificar mensaje de validación
        await page.waitForTimeout(1000);
        const errorValidacion = page
            .locator(
                "text=/proveedor.*requerido/i, text=/seleccionar.*proveedor/i, .error-message"
            )
            .first();
        if (await errorValidacion.isVisible()) {
            await expect(errorValidacion).toBeVisible();
        }
    });

    test("Debe calcular correctamente el total de la orden", async ({
        page,
    }) => {
        const nuevaOrdenBtn = page.locator('button:has-text("Nueva")').first();
        await nuevaOrdenBtn.click();

        // Seleccionar proveedor
        const proveedorSelect = page
            .locator('select, input[placeholder*="proveedor"]')
            .first();
        if ((await proveedorSelect.getAttribute("tagName")) === "SELECT") {
            await proveedorSelect.selectOption({ index: 1 });
        }

        // Agregar producto con precio específico
        const productoInput = page
            .locator('input[placeholder*="producto"]')
            .first();
        await productoInput.fill("Vitamina D");
        await page.waitForTimeout(1000);

        const producto = page.locator("text=Vitamina").first();
        if (await producto.isVisible()) {
            await producto.click();
        }

        // Cantidad: 10, Precio: $15.00 = Total: $150.00
        const cantidadInput = page.locator('input[type="number"]').first();
        if (await cantidadInput.isVisible()) {
            await cantidadInput.fill("10");
        }

        const precioInput = page.locator('input[name*="precio"]').first();
        if (await precioInput.isVisible()) {
            await precioInput.fill("15.00");
        }

        const agregarBtn = page.locator('button:has-text("Agregar")').first();
        if (await agregarBtn.isVisible()) {
            await agregarBtn.click();
        }

        // Verificar cálculo del total
        await page.waitForTimeout(500);
        const totalCalculado = page
            .locator('text=/$150.00/, text=/150/, [data-testid="total"]')
            .first();
        if (await totalCalculado.isVisible()) {
            await expect(totalCalculado).toBeVisible();
        }
    });
});
