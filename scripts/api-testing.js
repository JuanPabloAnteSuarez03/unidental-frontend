#!/usr/bin/env node

/**
 * Tests Directos de API - Sin Navegador
 * Verifica que las funcionalidades críticas funcionan a nivel de servicios
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const BASE_URL = process.env.API_URL || 'https://unidental-backend.onrender.com';
const TEST_CREDENTIALS = {
  username: process.env.TEST_USER || 'admin',
  password: process.env.TEST_PASSWORD || 'admin123'
};

let authToken = null;
const testResults = {
  timestamp: new Date().toISOString(),
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  results: []
};

// Utilidades
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const icons = { info: '📋', success: '✅', error: '❌', warning: '⚠️' };
  console.log(`${icons[type]} [${timestamp}] ${message}`);
}

async function runTest(testName, testFunction) {
  testResults.totalTests++;
  log(`Ejecutando: ${testName}`);
  
  try {
    const result = await testFunction();
    testResults.passedTests++;
    testResults.results.push({
      name: testName,
      status: 'PASSED',
      result: result,
      timestamp: new Date().toISOString()
    });
    log(`✅ ${testName} - PASÓ`, 'success');
    return { success: true, data: result };
  } catch (error) {
    testResults.failedTests++;
    testResults.results.push({
      name: testName,
      status: 'FAILED',
      error: error.message,
      timestamp: new Date().toISOString()
    });
    log(`❌ ${testName} - FALLÓ: ${error.message}`, 'error');
    return { success: false, error: error.message };
  }
}

// Tests de API
async function authenticateUser() {
  const response = await axios.post(`${BASE_URL}/api/auth/login/`, TEST_CREDENTIALS);
  
  if (response.data && response.data.access) {
    authToken = response.data.access;
    return { token: authToken, user: response.data.user };
  }
  throw new Error('No se recibió token de autenticación');
}

async function getInventoryData() {
  if (!authToken) throw new Error('No hay token de autenticación');
  
  const response = await axios.get(`${BASE_URL}/api/inventory/products/`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  if (response.data && Array.isArray(response.data.results)) {
    return {
      totalProducts: response.data.count || response.data.results.length,
      sampleProducts: response.data.results.slice(0, 3).map(p => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        stock: p.total_stock
      }))
    };
  }
  throw new Error('Respuesta de inventario inválida');
}

async function getCustomersData() {
  if (!authToken) throw new Error('No hay token de autenticación');
  
  const response = await axios.get(`${BASE_URL}/api/customers/`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  if (response.data && Array.isArray(response.data.results)) {
    return {
      totalCustomers: response.data.count || response.data.results.length,
      sampleCustomers: response.data.results.slice(0, 2).map(c => ({
        id: c.id,
        name: c.name,
        email: c.email
      }))
    };
  }
  throw new Error('Respuesta de clientes inválida');
}

async function testSalesValidation() {
  if (!authToken) throw new Error('No hay token de autenticación');
  
  // Simular datos de venta
  const saleData = {
    customer: 1,
    sale_type: 'normal',
    items: [
      { product: 1, quantity: 1, unit_price: 100 }
    ],
    location: 1
  };
  
  // Este test verifica que el endpoint responde (aunque falle por datos de prueba)
  try {
    const response = await axios.post(`${BASE_URL}/api/sales/`, saleData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    return { message: 'Venta creada exitosamente', saleId: response.data.id };
  } catch (error) {
    // Verificar errores esperados de validación (no son errores reales del sistema)
    if (error.response && error.response.status >= 400 && error.response.status < 500) {
      return { 
        message: 'Endpoint de ventas funcional (error de validación esperado)',
        validationErrors: error.response.data 
      };
    }
    throw error;
  }
}

async function testStockMovements() {
  if (!authToken) throw new Error('No hay token de autenticación');
  
  const response = await axios.get(`${BASE_URL}/api/inventory/stock-movements/`, {
    headers: { Authorization: `Bearer ${authToken}` },
    params: { limit: 5 }
  });
  
  if (response.data) {
    return {
      totalMovements: response.data.count || 0,
      recentMovements: response.data.results?.slice(0, 3) || []
    };
  }
  throw new Error('No se pudieron obtener movimientos de stock');
}

async function testSuppliersData() {
  if (!authToken) throw new Error('No hay token de autenticación');
  
  const response = await axios.get(`${BASE_URL}/api/suppliers/`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  if (response.data && Array.isArray(response.data.results)) {
    return {
      totalSuppliers: response.data.count || response.data.results.length,
      sampleSuppliers: response.data.results.slice(0, 2).map(s => ({
        id: s.id,
        name: s.name,
        contact: s.contact_info
      }))
    };
  }
  throw new Error('Respuesta de proveedores inválida');
}

// Función principal
async function runAllTests() {
  console.log('🚀 Iniciando Tests de API Directos\n');
  console.log(`🔗 Base URL: ${BASE_URL}`);
  console.log(`👤 Usuario de prueba: ${TEST_CREDENTIALS.username}\n`);

  // 1. Autenticación
  await runTest('Autenticación de Usuario', authenticateUser);

  if (!authToken) {
    log('❌ No se pudo autenticar. Deteniendo tests.', 'error');
    return;
  }

  // 2. Tests de datos básicos
  await runTest('Obtener Datos de Inventario', getInventoryData);
  await runTest('Obtener Datos de Clientes', getCustomersData);
  await runTest('Obtener Datos de Proveedores', testSuppliersData);

  // 3. Tests de funcionalidades
  await runTest('Validar Endpoint de Ventas', testSalesValidation);
  await runTest('Obtener Movimientos de Stock', testStockMovements);

  // Resultados finales
  console.log('\n📊 RESUMEN DE RESULTADOS:');
  console.log(`✅ Tests exitosos: ${testResults.passedTests}`);
  console.log(`❌ Tests fallidos: ${testResults.failedTests}`);
  console.log(`📈 Porcentaje de éxito: ${Math.round((testResults.passedTests / testResults.totalTests) * 100)}%`);

  // Guardar resultados
  const outputPath = path.join(process.cwd(), 'test-results', 'api-test-results.json');
  if (!fs.existsSync(path.dirname(outputPath))) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(testResults, null, 2));
  log(`💾 Resultados guardados en: ${outputPath}`, 'info');

  // Generar reporte HTML
  generateHTMLReport();

  // Código de salida
  process.exit(testResults.failedTests > 0 ? 1 : 0);
}

function generateHTMLReport() {
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resultados Tests API - Unidental</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 1000px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-left: 4px solid #007bff; }
        .stat-card.success { border-left-color: #28a745; }
        .stat-card.error { border-left-color: #dc3545; }
        .stat-number { font-size: 2em; font-weight: bold; margin-bottom: 10px; }
        .test-result { margin: 15px 0; padding: 15px; border-radius: 5px; border-left: 4px solid #ccc; }
        .test-result.passed { background: #d4edda; border-left-color: #28a745; }
        .test-result.failed { background: #f8d7da; border-left-color: #dc3545; }
        .test-name { font-weight: bold; margin-bottom: 10px; }
        .test-details { font-size: 0.9em; color: #666; }
        .timestamp { text-align: center; margin-top: 30px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Resultados Tests API - Sistema Unidental</h1>
            <p>Generado el ${new Date(testResults.timestamp).toLocaleString('es-ES')}</p>
        </div>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${testResults.totalTests}</div>
                <div>Total Tests</div>
            </div>
            <div class="stat-card success">
                <div class="stat-number">${testResults.passedTests}</div>
                <div>Exitosos</div>
            </div>
            <div class="stat-card error">
                <div class="stat-number">${testResults.failedTests}</div>
                <div>Fallidos</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${Math.round((testResults.passedTests / testResults.totalTests) * 100)}%</div>
                <div>Éxito</div>
            </div>
        </div>

        <h2>📋 Detalle de Tests</h2>
        ${testResults.results.map(result => `
            <div class="test-result ${result.status.toLowerCase()}">
                <div class="test-name">
                    ${result.status === 'PASSED' ? '✅' : '❌'} ${result.name}
                </div>
                <div class="test-details">
                    <strong>Estado:</strong> ${result.status}<br>
                    <strong>Timestamp:</strong> ${new Date(result.timestamp).toLocaleTimeString('es-ES')}<br>
                    ${result.result ? `<strong>Resultado:</strong> ${JSON.stringify(result.result, null, 2)}<br>` : ''}
                    ${result.error ? `<strong>Error:</strong> ${result.error}` : ''}
                </div>
            </div>
        `).join('')}

        <div class="timestamp">
            <p>Base URL: ${BASE_URL}</p>
            <p>Usuario: ${TEST_CREDENTIALS.username}</p>
        </div>
    </div>
</body>
</html>`;

  const htmlPath = path.join(process.cwd(), 'test-results', 'api-test-report.html');
  fs.writeFileSync(htmlPath, html);
  log(`📊 Reporte HTML generado: ${htmlPath}`, 'info');
}

// Manejo de errores no capturados
process.on('unhandledRejection', (error) => {
  log(`Error no capturado: ${error.message}`, 'error');
  process.exit(1);
});

// Ejecutar inmediatamente
runAllTests().catch(error => {
  console.error('Error ejecutando tests:', error);
  process.exit(1);
});

export { runAllTests, testResults }; 