module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000',
        'http://localhost:3000/login',
        'http://localhost:3000/inventario',
        'http://localhost:3000/ventas',
        'http://localhost:3000/compras/proveedores',
        'http://localhost:3000/clientes/lista',
      ],
      startServerCommand: 'npm run dev',
      startServerReadyPattern: 'Local:.*http://localhost:3000',
      startServerReadyTimeout: 60000,
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0,
        },
        screenEmulation: {
          mobile: false,
          width: 1920,
          height: 1080,
          deviceScaleRatio: 1,
          disabled: false,
        },
        emulatedFormFactor: 'desktop',
        locale: 'es-ES',
        onlyCategories: [
          'performance',
          'accessibility',
          'best-practices',
          'seo',
          'pwa'
        ],
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.8 }],
        'categories:pwa': ['warn', { minScore: 0.6 }],
        
        // Métricas específicas de performance
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 4000 }],
        'first-meaningful-paint': ['error', { maxNumericValue: 2000 }],
        'speed-index': ['error', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 500 }],
        
        // Métricas de accesibilidad
        'color-contrast': 'error',
        'heading-order': 'error',
        'label': 'error',
        'aria-allowed-attr': 'error',
        'aria-required-attr': 'error',
        'aria-valid-attr': 'error',
        'aria-valid-attr-value': 'error',
        'button-name': 'error',
        'document-title': 'error',
        'duplicate-id': 'error',
        'html-has-lang': 'error',
        'image-alt': 'error',
        'link-name': 'error',
        'list': 'error',
        'listitem': 'error',
        'meta-description': 'error',
        'meta-viewport': 'error',
        
        // Métricas de best practices
        'is-on-https': 'error',
        'uses-responsive-images': 'error',
        'efficient-animated-content': 'error',
        'no-document-write': 'error',
        'no-vulnerable-libraries': 'error',
        'js-libraries': 'error',
        'notification-on-start': 'error',
        'password-inputs-can-be-pasted-into': 'error',
        
        // Métricas de SEO
        'meta-description': 'error',
        'http-status-code': 'error',
        'link-text': 'error',
        'crawlable-anchors': 'error',
        'is-crawlable': 'error',
        'robots-txt': 'error',
        'hreflang': 'error',
        'canonical': 'error',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
    server: {
      port: 9001,
      storage: './lighthouse-ci-data',
    },
  },
}; 