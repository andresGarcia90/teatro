# Plan de incorporacion de UI (referencia Figma no estricta)

## Objetivo
Incorporar el estilo visual del diseno de Figma sin romper la funcionalidad actual del MVP.

## Alcance
- Mantener rutas, reglas de negocio y adaptadores de datos existentes.
- Aplicar una capa visual progresiva sobre pantallas actuales.
- Priorizar experiencia de la pantalla publica (`/publico`).
- Extender despues la consistencia visual al backoffice.

## Principios de implementacion
- No cambiar contratos de API ni validaciones funcionales.
- Separar cambios visuales de cambios de logica.
- Reutilizar componentes y clases para evitar duplicacion.
- Confirmar responsive en mobile y desktop en cada fase.

## Fases

### Fase 1 - Base visual global
**Objetivo:** definir tokens visuales compartidos.

**Tareas:**
- Definir variables CSS para colores, radios, sombras y espaciados.
- Ajustar tipografia y jerarquia de titulos.
- Definir estilos base para botones, cards e inputs.

**Archivos objetivo:**
- `app/src/index.css`

**Criterio de listo:**
- La app completa usa una misma base visual (colores/espaciado/tipografia) sin cambios de logica.

### Fase 2 - Home publica estilo Figma
**Objetivo:** llevar `/publico` al lenguaje visual del diseno.

**Tareas:**
- Crear hero principal con CTA clara.
- Agregar cards de contexto (estado del evento, cupos, horario).
- Reorganizar listado de funciones/secciones con mejor legibilidad.

**Archivos objetivo:**
- `app/src/features/publico/PublicoPage.tsx`

**Criterio de listo:**
- La pantalla publica refleja el look-and-feel principal del diseno y conserva flujo de reserva actual.

### Fase 3 - Componentes reutilizables
**Objetivo:** evitar estilos ad-hoc repetidos.

**Tareas:**
- Extraer bloques reutilizables (hero, metric card, action button, section row).
- Centralizar variantes de estilo (primary, secondary, subtle).

**Archivos objetivo (a crear o ajustar):**
- `app/src/components/ui/*` o carpeta equivalente del proyecto.

**Criterio de listo:**
- Pantalla publica y backoffice comparten componentes base.

### Fase 4 - Mapa de asientos y feedback visual
**Objetivo:** mejorar lectura y estados del mapa de asientos.

**Tareas:**
- Estilizar estados de asiento: disponible, seleccionado, reservado.
- Agregar leyenda visual y mejoras de contraste.
- Agregar estados de carga/empty/error mas claros.

**Archivos objetivo:**
- `app/src/features/publico/PublicoPage.tsx`

**Criterio de listo:**
- El estado de cada asiento se identifica rapidamente sin afectar reglas de reserva.

### Fase 5 - Consistencia de backoffice
**Objetivo:** alinear admin con la identidad visual de la pantalla publica.

**Tareas:**
- Aplicar cards, botones, tablas y formularios con la misma base visual.
- Unificar espaciado, titulos y jerarquia de informacion.

**Archivos objetivo:**
- `app/src/features/backoffice/BackofficeConfiguracionPage.tsx`
- `app/src/features/backoffice/BackofficeSeccionesPage.tsx`
- `app/src/features/backoffice/BackofficeAsientosPage.tsx`
- `app/src/features/backoffice/BackofficeDashboardPage.tsx`

**Criterio de listo:**
- Backoffice y publico se perciben como una sola aplicacion.

### Fase 6 - Responsive, accesibilidad y microinteracciones
**Objetivo:** pulir experiencia final.

**Tareas:**
- Revisar breakpoints clave (mobile, tablet, desktop).
- Validar contraste y foco de teclado en acciones principales.
- Incorporar transiciones suaves en hover, seleccion y carga.

**Criterio de listo:**
- UX consistente en todos los dispositivos con mejoras visuales no invasivas.

## Riesgos y mitigaciones
- Riesgo: mezclar cambios visuales y funcionales.
  - Mitigacion: PRs por fase, con foco solo en UI.
- Riesgo: degradar legibilidad por exceso de estilos.
  - Mitigacion: validar contraste y tamanos minimos en cada pantalla.
- Riesgo: romper responsive al mover layout.
  - Mitigacion: test manual por breakpoint antes de cerrar cada fase.

## Orden recomendado de ejecucion
1. Fase 1
2. Fase 2
3. Fase 4
4. Fase 3
5. Fase 5
6. Fase 6

## Estimacion simple
- Fase 1 + 2: 1 dia
- Fase 3 + 4: 1 dia
- Fase 5 + 6: 1 dia
- Pulido final: 0.5 dia

## Definition of Done (UI)
- No cambios en reglas de negocio.
- Flujo de reserva funcionando end-to-end.
- Coherencia visual entre publico y backoffice.
- Responsive validado en mobile y desktop.
- QA minimo funcional sigue en verde.
