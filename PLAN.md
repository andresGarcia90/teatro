# PLAN.md

# Sistema de Reserva de Asientos para Teatro

## Enfoque

Proyecto escolar para un evento puntual.

Se prioriza simplicidad de implementación por sobre escalabilidad.

## Objetivo

Desarrollar una aplicación web para gestionar reservas de asientos en un teatro mediante una interfaz pública y un backoffice de administración.

La solución deberá permitir:

* Configurar secciones del teatro.
* Generar filas y asientos automáticamente.
* Limitar la cantidad de entradas por persona.
* Mostrar disponibilidad actualizada periódicamente.
* Evitar reservas duplicadas.
* Exportar reservas en CSV.
* Operar completamente sobre servicios gratuitos.
* Trabajar con un único evento activo.
* Refrescar disponibilidad mediante refetch periódico.

---

# Alcance MVP

## Portal Público

### Identificación

Datos requeridos:

* Nombre completo
* Documento

### Selección de Asientos

* Visualización por sección.
* Visualización de asientos ocupados.
* Selección limitada por configuración.
* Confirmación de reserva.

### Confirmación

* Mostrar resumen.
* Confirmar reserva.
* Registrar datos.
* No emitir comprobante.

### Reglas de Negocio

* Una reserva por documento dentro del evento.
* No se permite cancelar reservas.
* No se permite editar reservas.
* Las reservas vencen al llegar a la fecha/hora de cierre.

---

## Backoffice

Acceso simple con usuario y contraseña hardcodeados para uso escolar.

### Configuración General

* Nombre del evento.
* Máximo de entradas por usuario.
* Habilitar/deshabilitar reservas.
* Fecha y hora límite de reserva.

### Secciones

* Crear sección.
* Editar sección.
* Eliminar sección.

### Generación de Asientos

* Cantidad de filas.
* Cantidad de asientos por fila.
* Generación automática.

### Exportación

* Descarga CSV.

---

# Arquitectura

## Frontend

* React
* TypeScript
* Vite
* TailwindCSS
* Zustand
* TanStack Query

## Backend

No habrá backend propio.

La aplicación consumirá Supabase directamente.

## Persistencia

* Supabase PostgreSQL

## Actualización de Disponibilidad

* Refetch periódico con TanStack Query.

## Seguridad

Sin sistema de roles. Un único perfil administrador.

RLS mínima para proteger escrituras y operaciones administrativas.

## Backup

* Exportación CSV manual.

## Deploy

* Vercel.

---

# Fases

## Plan de Diseño UI

La incorporacion visual basada en Figma (no estricta) se detalla en `PLAN_DISENO_UI.md`.

Se implementara por fases, manteniendo la logica funcional actual del MVP.

## Fase 0 - Inicialización

* Crear repositorio.
* Configurar Vite.
* Configurar Tailwind.
* Configurar Supabase.
* Configurar estructura de carpetas.

## Fase 1 - Modelo de Datos

* Crear tablas.
* Crear índices.
* Crear restricciones.
* Crear RLS.
* Incorporar unicidad por documento y evento.
* Incorporar fecha de vencimiento/cierre.
* Aplicar políticas mínimas de RLS.

## Fase 2 - Backoffice

* Login simple hardcodeado.
* Configuración.
* Gestión de secciones.
* Generador de asientos.

## Fase 3 - Portal Público

* Identificación.
* Visualización de asientos.
* Reserva.
* Validación de cierre automático.

## Fase 4 - Actualización de Disponibilidad

* Implementar refetch periódico.
* Ajustar intervalos de refresco.

## Fase 5 - Exportación

* Generación CSV.
* Descarga.

## Fase 6 - QA

* Pruebas funcionales.
* Pruebas simultáneas.
* Validaciones finales.

---

# Criterios de Éxito

* Un usuario puede reservar asientos.
* No existen reservas duplicadas.
* Un documento no puede reservar más de una vez en el evento.
* El límite de entradas se respeta.
* Los asientos se actualizan con refetch periódico.
* El administrador puede exportar reservas.
