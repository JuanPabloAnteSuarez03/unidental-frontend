#!/usr/bin/env node

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execPromise = util.promisify(exec);

// Configuración de colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Configuración de pruebas
const testSuites = {
  unit: {
    name: 'Unit Tests',
    command: 'npm run test:unit',
    timeout: 120000, // 2 minutos
    critical: true,
    description: 'Pruebas unitarias de componentes y servicios'
  },
  integration: {
    name: 'Integration Tests',
    command: 'npm run test:integration',
    timeout: 300000, // 5 minutos
    critical: true,
    description: 'Pruebas de integración entre módulos'
  },
  e2e: {
    name: 'E2E Tests',
    command: 'npm run test:e2e',
    timeout: 600000, // 10 minutos
    critical: true,
    description: 'Pruebas end-to-end de flujos críticos'
  },
  accessibility: {
    name: 'Accessibility Tests',
    command: 'npm run test:accessibility',
    timeout: 300000, // 5 minutos
    critical: false,
    description: 'Pruebas de accesibilidad y a11y'
  },
  performance: {
    name: 'Performance Tests',
    command: 'npm run test:performance',
    timeout: 600000, // 10 minutos
    critical: false,
    description: 'Pruebas de rendimiento con Lighthouse'
  },
  visual: {
    name: 'Visual Regression Tests',
    command: 'npm run test:visual',
    timeout: 900000, // 15 minutos
    critical: false,
    description: 'Pruebas de regresión visual'
  },
  security: {
    name: 'Security Tests',
    command: 'npm run test:security',
    timeout: 300000, // 5 minutos
    critical: false,
    description: 'Auditoría de seguridad y vulnerabilidades'
  },
  bundle: {
    name: 'Bundle Size Tests',
    command: 'npm run test:bundle',
    timeout: 120000, // 2 minutos
    critical: false,
    description: 'Verificación de tamaño de bundle'
  }
};

// Configuración de reportes
const reportConfig = {
  outputDir: './test-results',
  reportFile: 'comprehensive-test-report.html',
  jsonFile: 'test-results.json',
  coverageFile: 'coverage-summary.json'
};

class TestMonitor {
  constructor() {
    this.results = {};
    this.startTime = Date.now();
    this.coverageData = {};
    this.metrics = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0
    };
  }

  // Función para mostrar mensajes con colores
  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  // Función para mostrar progreso
  showProgress(current, total, testName) {
    const percentage = Math.round((current / total) * 100);
    const bar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
    process.stdout.write(`\r${colors.cyan}[${bar}] ${percentage}% - ${testName}${colors.reset}`);
  }

  // Crear directorio de resultados
  ensureResultsDirectory() {
    if (!fs.existsSync(reportConfig.outputDir)) {
      fs.mkdirSync(reportConfig.outputDir, { recursive: true });
    }
  }

  // Ejecutar un conjunto de pruebas
  async runTestSuite(suiteKey, suite) {
    this.log(`\n${colors.bright}🧪 Ejecutando: ${suite.name}${colors.reset}`);
    this.log(`📝 ${suite.description}`);
    
    const startTime = Date.now();
    
    try {
      // Ejecutar comando con timeout
      const result = await this.executeWithTimeout(suite.command, suite.timeout);
      
      const duration = Date.now() - startTime;
      
      this.results[suiteKey] = {
        name: suite.name,
        status: 'passed',
        duration: duration,
        output: result.stdout,
        error: null,
        critical: suite.critical,
        metrics: this.parseTestOutput(result.stdout, suiteKey)
      };
      
      this.log(`✅ ${suite.name} completado en ${Math.round(duration / 1000)}s`, 'green');
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results[suiteKey] = {
        name: suite.name,
        status: 'failed',
        duration: duration,
        output: error.stdout || '',
        error: error.stderr || error.message,
        critical: suite.critical,
        metrics: this.parseTestOutput(error.stdout || '', suiteKey)
      };
      
      this.log(`❌ ${suite.name} falló en ${Math.round(duration / 1000)}s`, 'red');
      
      if (suite.critical) {
        this.log(`⚠️  CRÍTICO: ${suite.name} es una prueba crítica que falló`, 'yellow');
      }
    }
  }

  // Ejecutar comando con timeout
  executeWithTimeout(command, timeout) {
    return new Promise((resolve, reject) => {
      const child = exec(command, { maxBuffer: 1024 * 1024 * 10 }); // 10MB buffer
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data) => {
        stdout += data;
      });
      
      child.stderr.on('data', (data) => {
        stderr += data;
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          reject({ stdout, stderr, code });
        }
      });
      
      // Timeout handler
      const timeoutId = setTimeout(() => {
        child.kill();
        reject({ stdout, stderr, message: 'Timeout: Command exceeded maximum execution time' });
      }, timeout);
      
      child.on('close', () => {
        clearTimeout(timeoutId);
      });
    });
  }

  // Parsear salida de pruebas para extraer métricas
  parseTestOutput(output, suiteKey) {
    const metrics = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      coverage: null
    };

    // Parsear Jest output
    if (suiteKey === 'unit' || suiteKey === 'integration') {
      const testMatch = output.match(/Tests:\s*(\d+)\s*failed,\s*(\d+)\s*passed,\s*(\d+)\s*total/);
      if (testMatch) {
        metrics.failed = parseInt(testMatch[1]);
        metrics.passed = parseInt(testMatch[2]);
        metrics.total = parseInt(testMatch[3]);
      }
      
      // Parsear cobertura
      const coverageMatch = output.match(/All files\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)/);
      if (coverageMatch) {
        metrics.coverage = {
          statements: parseFloat(coverageMatch[1]),
          branches: parseFloat(coverageMatch[2]),
          functions: parseFloat(coverageMatch[3]),
          lines: parseFloat(coverageMatch[4])
        };
      }
    }

    // Parsear Playwright output
    if (suiteKey === 'e2e' || suiteKey === 'visual') {
      const testMatch = output.match(/(\d+)\s*passed.*?(\d+)\s*failed.*?(\d+)\s*total/);
      if (testMatch) {
        metrics.passed = parseInt(testMatch[1]);
        metrics.failed = parseInt(testMatch[2]);
        metrics.total = parseInt(testMatch[3]);
      }
    }

    // Parsear Lighthouse output
    if (suiteKey === 'performance') {
      const scoreMatch = output.match(/Performance score:\s*([\d.]+)/);
      if (scoreMatch) {
        metrics.performanceScore = parseFloat(scoreMatch[1]);
      }
    }

    return metrics;
  }

  // Calcular métricas generales
  calculateOverallMetrics() {
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    let totalDuration = 0;
    let criticalFailures = 0;

    Object.values(this.results).forEach(result => {
      if (result.metrics) {
        totalTests += result.metrics.total || 0;
        passedTests += result.metrics.passed || 0;
        failedTests += result.metrics.failed || 0;
      }
      totalDuration += result.duration;
      
      if (result.critical && result.status === 'failed') {
        criticalFailures++;
      }
    });

    this.metrics = {
      total: totalTests,
      passed: passedTests,
      failed: failedTests,
      skipped: totalTests - passedTests - failedTests,
      duration: totalDuration,
      criticalFailures: criticalFailures,
      successRate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0
    };
  }

  // Generar reporte HTML
  generateHTMLReport() {
    const templatePath = path.join(__dirname, 'report-template.html');
    let template = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte Comprehensive de Testing - Unidental</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .header h1 { margin: 0; font-size: 2.5em; font-weight: 300; }
        .header p { margin: 10px 0 0; opacity: 0.9; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .metric h3 { margin: 0 0 10px; color: #495057; }
        .metric .value { font-size: 2em; font-weight: bold; }
        .metric.success .value { color: #28a745; }
        .metric.danger .value { color: #dc3545; }
        .metric.warning .value { color: #ffc107; }
        .metric.info .value { color: #17a2b8; }
        .results { padding: 0 30px 30px; }
        .suite { margin-bottom: 30px; border: 1px solid #e9ecef; border-radius: 8px; overflow: hidden; }
        .suite-header { background: #f8f9fa; padding: 20px; border-bottom: 1px solid #e9ecef; }
        .suite-header h3 { margin: 0; display: flex; align-items: center; }
        .suite-header .status { margin-left: auto; padding: 5px 15px; border-radius: 15px; font-size: 0.9em; }
        .status.passed { background: #d4edda; color: #155724; }
        .status.failed { background: #f8d7da; color: #721c24; }
        .status.critical { background: #f8d7da; color: #721c24; font-weight: bold; }
        .suite-content { padding: 20px; }
        .suite-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .suite-metric { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
        .output { background: #f8f9fa; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 0.9em; max-height: 200px; overflow-y: auto; }
        .error { background: #f8d7da; color: #721c24; }
        .footer { text-align: center; padding: 20px; color: #6c757d; border-top: 1px solid #e9ecef; }
        .progress-bar { width: 100%; height: 20px; background: #e9ecef; border-radius: 10px; overflow: hidden; margin: 10px 0; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #28a745, #20c997); transition: width 0.3s ease; }
        @media (max-width: 768px) {
            .metrics { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
            .suite-metrics { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Reporte Comprehensive de Testing</h1>
            <p>Unidental Frontend - Ejecutado el ${new Date().toLocaleString('es-ES')}</p>
        </div>
        
        <div class="metrics">
            <div class="metric success">
                <h3>Pruebas Exitosas</h3>
                <div class="value">${this.metrics.passed}</div>
            </div>
            <div class="metric danger">
                <h3>Pruebas Fallidas</h3>
                <div class="value">${this.metrics.failed}</div>
            </div>
            <div class="metric info">
                <h3>Total de Pruebas</h3>
                <div class="value">${this.metrics.total}</div>
            </div>
            <div class="metric ${this.metrics.successRate >= 80 ? 'success' : this.metrics.successRate >= 60 ? 'warning' : 'danger'}">
                <h3>Tasa de Éxito</h3>
                <div class="value">${this.metrics.successRate}%</div>
            </div>
        </div>

        <div class="progress-bar">
            <div class="progress-fill" style="width: ${this.metrics.successRate}%"></div>
        </div>

        <div class="results">
            ${Object.entries(this.results).map(([key, result]) => `
                <div class="suite">
                    <div class="suite-header">
                        <h3>
                            ${result.status === 'passed' ? '✅' : '❌'} ${result.name}
                            <span class="status ${result.status} ${result.critical && result.status === 'failed' ? 'critical' : ''}">
                                ${result.status === 'passed' ? 'PASÓ' : 'FALLÓ'}
                                ${result.critical && result.status === 'failed' ? ' (CRÍTICO)' : ''}
                            </span>
                        </h3>
                    </div>
                    <div class="suite-content">
                        <div class="suite-metrics">
                            <div class="suite-metric">
                                <strong>Duración</strong><br>
                                ${Math.round(result.duration / 1000)}s
                            </div>
                            ${result.metrics ? `
                                <div class="suite-metric">
                                    <strong>Total</strong><br>
                                    ${result.metrics.total || 0}
                                </div>
                                <div class="suite-metric">
                                    <strong>Exitosas</strong><br>
                                    ${result.metrics.passed || 0}
                                </div>
                                <div class="suite-metric">
                                    <strong>Fallidas</strong><br>
                                    ${result.metrics.failed || 0}
                                </div>
                            ` : ''}
                        </div>
                        ${result.error ? `
                            <div class="output error">
                                <strong>Error:</strong><br>
                                ${result.error.split('\n').slice(0, 10).join('\n')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>

        <div class="footer">
            <p>Generado por Test Monitor v1.0 - Duración total: ${Math.round(this.metrics.duration / 1000)}s</p>
            <p>Fallos críticos: ${this.metrics.criticalFailures}</p>
        </div>
    </div>
</body>
</html>`;

    const reportPath = path.join(reportConfig.outputDir, reportConfig.reportFile);
    fs.writeFileSync(reportPath, template);
    
    this.log(`📊 Reporte HTML generado: ${reportPath}`, 'green');
  }

  // Generar reporte JSON
  generateJSONReport() {
    const report = {
      timestamp: new Date().toISOString(),
      duration: this.metrics.duration,
      metrics: this.metrics,
      results: this.results,
      summary: {
        totalSuites: Object.keys(this.results).length,
        passedSuites: Object.values(this.results).filter(r => r.status === 'passed').length,
        failedSuites: Object.values(this.results).filter(r => r.status === 'failed').length,
        criticalFailures: this.metrics.criticalFailures
      }
    };

    const jsonPath = path.join(reportConfig.outputDir, reportConfig.jsonFile);
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    
    this.log(`📄 Reporte JSON generado: ${jsonPath}`, 'green');
  }

  // Mostrar resumen en consola
  showSummary() {
    const totalDuration = Math.round(this.metrics.duration / 1000);
    
    this.log('\n' + '='.repeat(80), 'cyan');
    this.log('📊 RESUMEN DE PRUEBAS COMPREHENSIVE', 'bright');
    this.log('='.repeat(80), 'cyan');
    
    this.log(`\n⏱️  Duración total: ${totalDuration}s`);
    this.log(`📊 Total de pruebas: ${this.metrics.total}`);
    this.log(`✅ Exitosas: ${this.metrics.passed}`, 'green');
    this.log(`❌ Fallidas: ${this.metrics.failed}`, 'red');
    this.log(`📈 Tasa de éxito: ${this.metrics.successRate}%`, 
      this.metrics.successRate >= 80 ? 'green' : 
      this.metrics.successRate >= 60 ? 'yellow' : 'red');
    
    if (this.metrics.criticalFailures > 0) {
      this.log(`⚠️  Fallos críticos: ${this.metrics.criticalFailures}`, 'red');
    }
    
    this.log('\n🔍 Detalles por suite:');
    Object.entries(this.results).forEach(([key, result]) => {
      const icon = result.status === 'passed' ? '✅' : '❌';
      const color = result.status === 'passed' ? 'green' : 'red';
      const duration = Math.round(result.duration / 1000);
      const critical = result.critical && result.status === 'failed' ? ' (CRÍTICO)' : '';
      
      this.log(`  ${icon} ${result.name}: ${result.status.toUpperCase()} (${duration}s)${critical}`, color);
    });
    
    this.log('\n' + '='.repeat(80), 'cyan');
  }

  // Ejecutar todas las pruebas
  async runAllTests() {
    this.log(`${colors.bright}🚀 Iniciando Testing Comprehensive de Unidental Frontend${colors.reset}`);
    this.log(`📅 ${new Date().toLocaleString('es-ES')}\n`);
    
    this.ensureResultsDirectory();
    
    const suiteKeys = Object.keys(testSuites);
    let currentSuite = 0;
    
    // Ejecutar pruebas críticas primero
    const criticalSuites = suiteKeys.filter(key => testSuites[key].critical);
    const nonCriticalSuites = suiteKeys.filter(key => !testSuites[key].critical);
    
    // Ejecutar pruebas críticas
    for (const suiteKey of criticalSuites) {
      currentSuite++;
      this.showProgress(currentSuite, suiteKeys.length, testSuites[suiteKey].name);
      await this.runTestSuite(suiteKey, testSuites[suiteKey]);
    }
    
    // Ejecutar pruebas no críticas
    for (const suiteKey of nonCriticalSuites) {
      currentSuite++;
      this.showProgress(currentSuite, suiteKeys.length, testSuites[suiteKey].name);
      await this.runTestSuite(suiteKey, testSuites[suiteKey]);
    }
    
    console.log('\n'); // Nueva línea después de la barra de progreso
    
    // Calcular métricas y generar reportes
    this.calculateOverallMetrics();
    this.generateHTMLReport();
    this.generateJSONReport();
    this.showSummary();
    
    // Determinar código de salida
    const hasFailures = this.metrics.failed > 0;
    const hasCriticalFailures = this.metrics.criticalFailures > 0;
    
    if (hasCriticalFailures) {
      this.log('\n❌ Hay fallos críticos. El deployment no debería continuar.', 'red');
      process.exit(1);
    } else if (hasFailures) {
      this.log('\n⚠️  Hay algunos fallos, pero no son críticos.', 'yellow');
      process.exit(0);
    } else {
      this.log('\n✅ Todas las pruebas pasaron exitosamente!', 'green');
      process.exit(0);
    }
  }
}

// Manejo de argumentos de línea de comandos
const args = process.argv.slice(2);
const options = {
  suite: args.find(arg => arg.startsWith('--suite='))?.split('=')[1],
  skipCritical: args.includes('--skip-critical'),
  parallel: args.includes('--parallel'),
  verbose: args.includes('--verbose')
};

// Ejecutar monitor de pruebas
const monitor = new TestMonitor();

// Manejo de señales para limpieza
process.on('SIGINT', () => {
  monitor.log('\n⚠️  Interrumpido por usuario', 'yellow');
  process.exit(130);
});

process.on('SIGTERM', () => {
  monitor.log('\n⚠️  Terminado por sistema', 'yellow');
  process.exit(143);
});

// Ejecutar pruebas específicas o todas
if (options.suite) {
  if (testSuites[options.suite]) {
    monitor.runTestSuite(options.suite, testSuites[options.suite]).then(() => {
      monitor.calculateOverallMetrics();
      monitor.showSummary();
      process.exit(monitor.metrics.failed > 0 ? 1 : 0);
    });
  } else {
    monitor.log(`❌ Suite '${options.suite}' no encontrada`, 'red');
    process.exit(1);
  }
} else {
  monitor.runAllTests();
} 