#!/usr/bin/env node

/**
 * Guía de Testing Manual Estructurada
 * Genera checklist interactiva para probar los flujos críticos
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testingGuide = {
  "✅ FLUJO DE VENTAS": {
    "📋 Preparación": [
      "✓ Servidor en localhost:3000 corriendo",
      "✓ Usuario logueado en el sistema",
      "✓ Al menos 1 cliente registrado",
      "✓ Al menos 3 productos con stock disponible"
    ],
    "🛒 Proceso de Venta": [
      "1. ✓ Navegar a /ventas",
      "2. ✓ Seleccionar cliente existente",
      "3. ✓ Buscar y agregar producto (verificar que aparece en lista)",
      "4. ✓ Modificar cantidad (verificar cálculo automático)",
      "5. ✓ Agregar segundo producto",
      "6. ✓ Verificar total general correcto",
      "7. ✓ Seleccionar método de pago 'Efectivo'",
      "8. ✓ Confirmar venta",
      "9. ✓ Verificar mensaje de éxito"
    ],
    "🔍 Validaciones": [
      "▶ Stock se reduce automáticamente",
      "▶ Total calculado correctamente",
      "▶ Venta queda registrada en sistema",
      "▶ Cliente puede verse en historial"
    ]
  },

  "📦 FLUJO DE COMPRAS": {
    "📋 Preparación": [
      "✓ Navegar a /compras/ordenes",
      "✓ Tener al menos 1 proveedor registrado",
      "✓ Productos disponibles para compra"
    ],
    "🏪 Proceso de Compra": [
      "1. ✓ Seleccionar proveedor",
      "2. ✓ Buscar productos del proveedor",
      "3. ✓ Agregar productos a orden",
      "4. ✓ Definir cantidades a comprar",
      "5. ✓ Verificar precios y totales",
      "6. ✓ Confirmar orden de compra",
      "7. ✓ Verificar orden aparece en lista"
    ],
    "🔍 Validaciones": [
      "▶ Orden se registra correctamente",
      "▶ Proveedor asociado correctamente",
      "▶ Cantidades y precios correctos",
      "▶ Estado de orden actualizado"
    ]
  },

  "🔄 FLUJO DE DEVOLUCIONES": {
    "📋 Preparación": [
      "✓ Tener al menos 1 venta registrada previamente",
      "✓ Productos con stock disponible",
      "✓ Navegar a /ventas/devoluciones"
    ],
    "↩️ Proceso de Devolución": [
      "1. ✓ Buscar venta a devolver",
      "2. ✓ Seleccionar productos a devolver",
      "3. ✓ Especificar cantidades a devolver",
      "4. ✓ Seleccionar motivo de devolución",
      "5. ✓ Confirmar devolución",
      "6. ✓ Verificar stock se reintegra",
      "7. ✓ Verificar ajuste contable"
    ],
    "🔍 Validaciones Críticas": [
      "▶ Stock se reintegra correctamente",
      "▶ Montos se calculan bien",
      "▶ Devolución queda registrada",
      "▶ Cliente actualizado correctamente"
    ]
  },

  "🧪 CASOS EXTREMOS": {
    "🚫 Escenarios de Error": [
      "1. ✓ Intentar vender sin stock suficiente",
      "2. ✓ Intentar venta sin seleccionar cliente",
      "3. ✓ Intentar devolver más cantidad de la vendida",
      "4. ✓ Navegación con token expirado",
      "5. ✓ Formularios con campos vacíos"
    ],
    "⚡ Escenarios de Performance": [
      "1. ✓ Cargar página con muchos productos",
      "2. ✓ Buscar en listas grandes",
      "3. ✓ Múltiples operaciones seguidas",
      "4. ✓ Refrescar página durante operación"
    ]
  }
};

function generateHTMLReport() {
  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Guía de Testing Manual - Unidental</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; text-align: center; margin-bottom: 30px; }
        h2 { color: #34495e; border-left: 4px solid #3498db; padding-left: 15px; margin-top: 30px; }
        h3 { color: #555; margin-top: 25px; }
        .checklist { list-style: none; padding: 0; }
        .checklist li { 
            background: #f8f9fa; 
            margin: 8px 0; 
            padding: 12px; 
            border-radius: 5px; 
            border-left: 3px solid #28a745;
            cursor: pointer;
            transition: all 0.3s;
        }
        .checklist li:hover { background: #e9ecef; transform: translateX(5px); }
        .checklist li.completed { background: #d4edda; border-left-color: #155724; }
        .validation { background: #fff3cd; border-left-color: #856404; }
        .error-case { background: #f8d7da; border-left-color: #721c24; }
        .performance { background: #d1ecf1; border-left-color: #0c5460; }
        .status { float: right; font-weight: bold; }
        .completed .status { color: #155724; }
        .timestamp { text-align: center; margin-top: 30px; color: #666; font-size: 0.9em; }
        .progress-bar { 
            width: 100%; 
            height: 10px; 
            background: #e9ecef; 
            border-radius: 5px; 
            margin: 20px 0;
            overflow: hidden;
        }
        .progress-fill { height: 100%; background: #28a745; transition: width 0.3s; }
        .controls { text-align: center; margin: 20px 0; }
        button { 
            background: #007bff; 
            color: white; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 5px; 
            cursor: pointer; 
            margin: 0 10px;
            font-size: 14px;
        }
        button:hover { background: #0056b3; }
        .reset-btn { background: #dc3545; }
        .reset-btn:hover { background: #c82333; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧪 Guía de Testing Manual - Sistema Unidental</h1>
        
        <div class="controls">
            <button onclick="markAllCompleted()">✅ Marcar Todo Completado</button>
            <button onclick="resetProgress()" class="reset-btn">🔄 Reiniciar Progreso</button>
            <button onclick="exportResults()">📊 Exportar Resultados</button>
        </div>

        <div class="progress-bar">
            <div class="progress-fill" id="progressFill" style="width: 0%"></div>
        </div>
        <p id="progressText" style="text-align: center;">Progreso: 0 de 0 items completados (0%)</p>

${Object.entries(testingGuide).map(([section, subsections]) => `
        <h2>${section}</h2>
        ${Object.entries(subsections).map(([subsection, items]) => `
            <h3>${subsection}</h3>
            <ul class="checklist ${getClassForSubsection(subsection)}">
                ${items.map((item, index) => `
                    <li onclick="toggleItem(this)" data-section="${section}" data-subsection="${subsection}" data-index="${index}">
                        ${item}
                        <span class="status">⏳</span>
                    </li>
                `).join('')}
            </ul>
        `).join('')}
`).join('')}

        <div class="timestamp">
            <p>Generado: ${new Date().toLocaleString('es-ES')}</p>
            <p>💡 <strong>Instrucciones:</strong> Haz clic en cada item para marcarlo como completado</p>
        </div>
    </div>

    <script>
        let completedItems = JSON.parse(localStorage.getItem('testingProgress') || '{}');
        
        function toggleItem(element) {
            const section = element.dataset.section;
            const subsection = element.dataset.subsection;
            const index = element.dataset.index;
            const key = section + '|' + subsection + '|' + index;
            
            if (completedItems[key]) {
                delete completedItems[key];
                element.classList.remove('completed');
                element.querySelector('.status').textContent = '⏳';
            } else {
                completedItems[key] = {
                    timestamp: new Date().toISOString(),
                    text: element.textContent.replace('⏳', '').replace('✅', '').trim()
                };
                element.classList.add('completed');
                element.querySelector('.status').textContent = '✅';
            }
            
            updateProgress();
            localStorage.setItem('testingProgress', JSON.stringify(completedItems));
        }
        
        function updateProgress() {
            const totalItems = document.querySelectorAll('.checklist li').length;
            const completedCount = Object.keys(completedItems).length;
            const percentage = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;
            
            document.getElementById('progressFill').style.width = percentage + '%';
            document.getElementById('progressText').textContent = 
                'Progreso: ' + completedCount + ' de ' + totalItems + ' items completados (' + percentage + '%)';
        }
        
        function markAllCompleted() {
            document.querySelectorAll('.checklist li').forEach(item => {
                if (!item.classList.contains('completed')) {
                    toggleItem(item);
                }
            });
        }
        
        function resetProgress() {
            if (confirm('¿Estás seguro de que quieres reiniciar todo el progreso?')) {
                completedItems = {};
                localStorage.removeItem('testingProgress');
                document.querySelectorAll('.checklist li').forEach(item => {
                    item.classList.remove('completed');
                    item.querySelector('.status').textContent = '⏳';
                });
                updateProgress();
            }
        }
        
        function exportResults() {
            const results = {
                timestamp: new Date().toISOString(),
                totalItems: document.querySelectorAll('.checklist li').length,
                completedItems: completedItems,
                completedCount: Object.keys(completedItems).length
            };
            
            const blob = new Blob([JSON.stringify(results, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'testing-results-' + new Date().toISOString().split('T')[0] + '.json';
            a.click();
        }
        
        // Cargar progreso al iniciar
        document.addEventListener('DOMContentLoaded', function() {
            Object.keys(completedItems).forEach(key => {
                const [section, subsection, index] = key.split('|');
                const element = document.querySelector(
                    '[data-section="' + section + '"][data-subsection="' + subsection + '"][data-index="' + index + '"]'
                );
                if (element) {
                    element.classList.add('completed');
                    element.querySelector('.status').textContent = '✅';
                }
            });
            updateProgress();
        });
    </script>
</body>
</html>`;

  return html;
}

function getClassForSubsection(subsection) {
  if (subsection.includes('Validaciones')) return 'validation';
  if (subsection.includes('Error')) return 'error-case';
  if (subsection.includes('Performance')) return 'performance';
  return '';
}

// Generar archivo HTML
const htmlContent = generateHTMLReport();
const outputPath = path.join(process.cwd(), 'test-results', 'manual-testing-guide.html');

// Crear directorio si no existe
if (!fs.existsSync(path.dirname(outputPath))) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
}

fs.writeFileSync(outputPath, htmlContent);

console.log('🎯 Guía de Testing Manual Generada:');
console.log('📁 Archivo:', outputPath);
console.log('🌐 Para abrir: file://' + outputPath.replace(/\\/g, '/'));
console.log('\n✨ Características:');
console.log('  ✓ Checklist interactiva');
console.log('  ✓ Progreso guardado automáticamente');
console.log('  ✓ Exportación de resultados');
console.log('  ✓ Casos de prueba estructurados');

export { testingGuide, generateHTMLReport }; 