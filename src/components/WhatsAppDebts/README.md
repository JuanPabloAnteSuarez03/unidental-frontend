# Sistema de Recordatorios WhatsApp - Deudas Vencidas

## Descripción
Sistema de recordatorios semi-automatizado por WhatsApp para deudas de compras a crédito que permite a los trabajadores enviar mensajes personalizados de manera eficiente y sin costo adicional.

## Componentes

### 1. `WhatsAppDebtsPage`
Página principal que integra todos los componentes y maneja el estado general.

**Ruta:** `/compras/deudas-whatsapp`

### 2. `DebtsFilters`
Componente de filtros que incluye:
- Búsqueda por proveedor, contacto o teléfono
- Checkbox "Solo con teléfono"
- Selector de días de anticipación (1-7 días)
- Toggle "Incluir próximas a vencer"
- Filtros por urgencia, estado y monto mínimo
- Botón de actualizar datos

### 3. `DebtsStats`
Componente de estadísticas que muestra:
- Total de deudas
- Monto total adeudado
- Número de deudas vencidas
- Número de deudas próximas a vencer
- Deudas con teléfono
- Deudas urgentes (+15 días)

### 4. `DebtsTable`
Tabla que muestra:
- Información del proveedor y contacto
- Monto adeudado (formato moneda)
- Fecha de vencimiento
- Estado con indicadores visuales
- Días de vencimiento/restantes
- Botones de acción (Ver mensaje, Enviar WhatsApp)

### 5. `MessagePreviewModal`
Modal para vista previa que incluye:
- Información completa del proveedor
- Vista previa del mensaje de WhatsApp
- Botones para enviar o cancelar

## Servicio: `whatsappDebtsService`

### Funciones principales:
- `getOverdueDebtsWithWhatsApp(params, authToken)`: Obtiene deudas del backend
- `calculateDebtStats(debts)`: Calcula estadísticas
- `getUrgencyClass(daysOverdue, status)`: Determina clase CSS de urgencia
- `formatCurrency(amount)`: Formatea montos a moneda local
- `filterDebts(debts, filters)`: Aplica filtros locales

## Indicadores Visuales de Urgencia

### Clases CSS:
- `.urgency-high`: +16 días vencido (rojo)
- `.urgency-medium`: 6-15 días vencido (naranja)
- `.urgency-low`: 1-5 días vencido (verde)
- `.urgency-upcoming`: Próximo a vencer (azul)

## Endpoint del Backend
```
GET /api/credits/purchase-accounts/overdue_with_whatsapp/
```

### Parámetros opcionales:
- `include_upcoming`: boolean (incluir próximas a vencer)
- `upcoming_days`: number (días de anticipación)

## Flujo de Usuario

1. **Trabajador abre la página de deudas**
2. **Sistema carga lista automáticamente**
3. **Trabajador ve deudas ordenadas por urgencia**
4. **Hace click en "Enviar Recordatorio"**
5. **Se abre WhatsApp con mensaje pre-escrito**
6. **Trabajador solo presiona "Enviar"**
7. **Mensaje enviado sin costo adicional**

## Tipos de Mensajes Implementados

### Recordatorio Preventivo (días_overdue < 0)
Para deudas próximas a vencer según días de anticipación.

### Vencido 1-5 días
Mensaje cordial informando del vencimiento reciente.

### Vencido 6-15 días
Mensaje más directo solicitando regularización.

### Vencido +16 días
Mensaje urgente con tono más formal.

## Características Técnicas

- **Responsive Design**: Adaptado para móviles y escritorio
- **Filtros en tiempo real**: Búsqueda y filtros instantáneos
- **Caching inteligente**: Optimización de llamadas al backend
- **Manejo de errores**: Feedback claro al usuario
- **Accesibilidad**: Soporte para lectores de pantalla
- **Performance**: Componentes optimizados con React

## Notas Importantes

- **Gratuito**: No usa API de WhatsApp, solo URLs
- **Mensajes personalizados**: Según días de vencimiento
- **Funciona con cualquier dispositivo**: Que tenga WhatsApp
- **No requiere configuración**: Del lado del proveedor
- **Backend completamente implementado**: Y probado

## Uso

```jsx
// Importar página
import WhatsAppDebtsPage from '../pages/WhatsAppDebtsPage';

// Usar en router
<Route path="/compras/deudas-whatsapp" element={<WhatsAppDebtsPage />} />
```

## Mantenimiento

Para actualizaciones futuras:
1. Modificar mensajes en el backend
2. Ajustar filtros en `DebtsFilters`
3. Personalizar estilos en `WhatsAppDebtsStyles.css`
4. Agregar nuevas estadísticas en `DebtsStats` 