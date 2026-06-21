# QA_MINIMO.md

# QA Minimo Antes de Entrega

Este documento permite ejecutar las pruebas funcionales finales del MVP.

---

## Precondiciones

- Docker DB levantada.
- API local levantada en http://localhost:8787.
- Frontend levantado en http://localhost:5173 (o puerto equivalente).
- Evento activo con secciones y asientos generados.

---

## Casos de Prueba

## QA-001 Flujo completo de reserva

1. Abrir portal publico.
2. Cargar nombre y documento validos.
3. Seleccionar seccion y asiento disponible.
4. Confirmar reserva.

Resultado esperado:

- Se muestra mensaje de reserva confirmada.
- El asiento pasa a estado reservado.
- Dashboard refleja 1 reserva adicional.

---

## QA-002 No duplicar asiento

1. Reservar un asiento A-1 con usuario 1.
2. Intentar reservar el mismo asiento con usuario 2.

Resultado esperado:

- El segundo intento falla con mensaje de asiento ya reservado.

---

## QA-003 No duplicar documento

1. Reservar un asiento con documento X.
2. Intentar otra reserva distinta con el mismo documento X.

Resultado esperado:

- El segundo intento falla con mensaje de limite alcanzado para documento.

---

## QA-004 Cierre de reservas

1. En backoffice, fijar fecha_cierre_reservas en una fecha pasada.
2. Volver al portal publico e intentar reservar.

Resultado esperado:

- El portal informa que el periodo de reservas finalizo.
- No permite confirmar reserva.

---

## QA-005 Backoffice protegido

1. Cerrar sesion de backoffice.
2. Intentar entrar directamente a /backoffice/configuracion.

Resultado esperado:

- Redirige a /backoffice/login.

---

## QA-006 Exportacion CSV

1. Ir a /backoffice/dashboard.
2. Presionar "Exportar CSV de reservas".

Resultado esperado:

- Se descarga archivo CSV.
- El archivo incluye columnas de reserva y asientos.

---

## QA-007 Simultaneidad 2 navegadores

1. Abrir navegador A y B en portal publico.
2. Elegir mismo asiento disponible en ambos.
3. Confirmar casi al mismo tiempo.

Resultado esperado:

- Solo una reserva se confirma.
- La otra recibe error de concurrencia (asiento ocupado).

---

## Registro de resultados

Completar esta tabla:

| Caso | Estado | Observaciones |
|------|--------|---------------|
| QA-001 | OK | Reserva creada, asiento marcado reservado y dashboard incremento +1. |
| QA-002 | OK | Segundo intento sobre mismo asiento rechazo con mensaje "El asiento ya fue reservado." |
| QA-003 | OK | Segundo intento con mismo documento rechazo con mensaje "El documento ya tiene una reserva." |
| QA-004 | OK | Con fecha cierre pasada, reserva bloqueada con mensaje "La reserva esta fuera de horario." |
| QA-005 | OK | Acceso directo a /backoffice/configuracion redirigio a /backoffice/login. |
| QA-006 | OK | CSV descargado y cabecera valida con columnas esperadas. |
| QA-007 | OK | En concurrencia, 1 reserva OK y 1 rechazo por asiento ocupado. |

Estados sugeridos: Pendiente, OK, Falla.
