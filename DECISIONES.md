# DECISIONES.md

# DEC-001 - Uso de Supabase

## Estado

Aceptada

## Fecha

2026-06-18

## Contexto

El proyecto no dispone de presupuesto para infraestructura.

## Decisión

Utilizar Supabase Free como base de datos principal.

## Consecuencias

### Positivas

* Sin costo.
* PostgreSQL administrado.
* Realtime integrado.
* Escalabilidad suficiente para el caso de uso.

### Negativas

* Dependencia de un proveedor externo.

---

# DEC-002 - Sin Backend Propio

## Estado

Aceptada

## Fecha

2026-06-18

## Contexto

Se busca minimizar complejidad operativa.

## Decisión

La aplicación React consumirá Supabase directamente.

## Consecuencias

### Positivas

* Menor tiempo de desarrollo.
* Menor mantenimiento.

### Negativas

* Mayor responsabilidad en configuración de RLS.

---

# DEC-003 - Exportación CSV

## Estado

Aceptada

## Fecha

2026-06-18

## Contexto

Los organizadores necesitan acceder fácilmente a las reservas.

## Decisión

Implementar exportación CSV.

## Consecuencias

### Positivas

* Compatible con Excel.
* Compatible con Google Sheets.

### Negativas

* No existe sincronización bidireccional.

---

# DEC-004 - Documento como Identificador

## Estado

Aceptada

## Fecha

2026-06-18

## Contexto

No se requiere autenticación formal.

## Decisión

Identificar usuarios mediante:

* Documento
* Nombre completo

## Consecuencias

### Positivas

* Flujo simple.
* Sin registro.

### Negativas

* El documento no garantiza identidad real.

---

# DEC-005 - Reserva Única por Asiento

## Estado

Aceptada

## Fecha

2026-06-18

## Decisión

Crear restricción única sobre el asiento reservado.

## Consecuencia

Se evita que dos usuarios reserven el mismo asiento simultáneamente.

---

# DEC-006 - Arquitectura Multi-Sección

## Estado

Aceptada

## Fecha

2026-06-18

## Decisión

El teatro se modelará mediante secciones independientes.

Ejemplos:

* Planta Baja
* Planta Alta
* Palco

## Consecuencias

Permite representar distintos tipos de salas sin cambios estructurales.

---

# DEC-007 - Evento Único

## Estado

Aceptada

## Fecha

2026-06-18

## Contexto

El proyecto es para una escuelita y un evento puntual.

## Decisión

Trabajar con un único evento activo.

## Consecuencias

### Positivas

* Menor complejidad funcional.
* Menor tiempo de implementación.

### Negativas

* No permite gestionar múltiples funciones.

---

# DEC-008 - Reserva Única por Documento

## Estado

Aceptada

## Fecha

2026-06-18

## Decisión

Cada documento podrá reservar una sola vez dentro del evento.

## Consecuencias

Se reduce el riesgo de duplicaciones y se simplifica la validación.

---

# DEC-009 - Sin Cancelación ni Edición

## Estado

Aceptada

## Fecha

2026-06-18

## Decisión

No se habilitarán funcionalidades de cancelación ni modificación de reservas.

## Consecuencias

Se simplifica el flujo del usuario y la lógica de negocio.

---

# DEC-010 - Reserva con Vencimiento

## Estado

Aceptada

## Fecha

2026-06-18

## Decisión

Las reservas tendrán una fecha y hora límite de vigencia.

## Consecuencias

Se evita aceptar reservas fuera de la ventana del evento.

---

# DEC-011 - Sin Lista Blanca de Documentos

## Estado

Aceptada

## Fecha

2026-06-18

## Decisión

No se implementará lista de documentos habilitados.

## Consecuencias

Se elimina una validación administrativa y se acelera el desarrollo.

---

# DEC-012 - Backoffice con Credenciales Hardcodeadas

## Estado

Aceptada

## Fecha

2026-06-18

## Decisión

El acceso al backoffice se resolverá con usuario y contraseña hardcodeados para el proyecto escolar.

## Consecuencias

### Positivas

* Implementación rápida.
* Sin dependencia de flujo de autenticación completo.

### Negativas

* Seguridad limitada.
* No apto para producción.

---

# DEC-013 - Sin Gestión de Roles

## Estado

Aceptada

## Fecha

2026-06-18

## Decisión

No se implementará administración de permisos por roles.

## Consecuencias

Se reduce complejidad del backoffice.

---

# DEC-014 - Sin Comprobante al Usuario

## Estado

Aceptada

## Fecha

2026-06-18

## Decisión

No se generará comprobante (ni PDF, ni QR, ni correo).

## Consecuencias

Se simplifica el cierre de la reserva y la entrega funcional del MVP.

---

# DEC-015 - Estrategia RLS Mínima

## Estado

Aceptada

## Fecha

2026-06-18

## Decisión

Implementar una estrategia de RLS mínima enfocada en proteger escrituras y operaciones administrativas.

## Consecuencias

### Positivas

* Menor complejidad de implementación.
* Nivel de protección adecuado para proyecto escolar.

### Negativas

* Modelo de seguridad limitado para escenarios productivos.

---

# DEC-016 - Actualización por Refetch Periódico

## Estado

Aceptada

## Fecha

2026-06-18

## Decisión

Usar refetch periódico en frontend para refrescar disponibilidad de asientos.

## Consecuencias

### Positivas

* Implementación más simple que Realtime.
* Menor complejidad operativa para el equipo.

### Negativas

* La actualización no es inmediata al 100%.

---

# DEC-017 - Backup Manual por CSV

## Estado

Aceptada

## Fecha

2026-06-18

## Decisión

La estrategia de backups será manual mediante exportación CSV.

## Consecuencias

* Bajo esfuerzo de implementación.
* Requiere disciplina operativa para ejecutar backups.

---

# DEC-018 - Despliegue en Vercel

## Estado

Aceptada

## Fecha

2026-06-18

## Decisión

Desplegar el frontend en Vercel.

## Consecuencias

* Flujo de despliegue simple para proyecto escolar.
