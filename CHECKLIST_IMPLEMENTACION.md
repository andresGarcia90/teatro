# CHECKLIST_IMPLEMENTACION.md

# Checklist de Implementacion Tecnica

Proyecto escolar para un evento puntual.

Objetivo: construir un MVP funcional, simple y consistente con las decisiones ya cerradas.

Opcional para desarrollo local sin Supabase Cloud: usar PostgreSQL con Docker (ver DOCKER_DB.md).

---

## 1) Preparacion del Proyecto

- [x] Crear app con React + TypeScript + Vite.
- [x] Instalar dependencias base: TailwindCSS, Zustand, TanStack Query, cliente de Supabase.
- [x] Definir variables de entorno:
  - [x] VITE_SUPABASE_URL
  - [x] VITE_SUPABASE_ANON_KEY
  - [x] ADMIN_USER
  - [x] ADMIN_PASSWORD
- [x] Estructurar carpetas minimas:
  - [x] src/app
  - [x] src/features/publico
  - [x] src/features/backoffice
  - [x] src/lib/supabase
  - [x] src/lib/utils
- [x] Habilitar selector de fuente de datos por entorno (Supabase o API local).

---

## 2) Modelo de Datos en Supabase

- [ ] Ejecutar script inicial en Supabase SQL Editor: supabase_init.sql.
- [ ] Ejecutar datos semilla para pruebas: supabase_seed.sql.
- [ ] Crear tabla eventos (solo 1 activo).
- [ ] Crear tabla secciones.
- [ ] Crear tabla asientos.
- [ ] Crear tabla reservas.
- [ ] Crear tabla configuracion.

Validacion rapida esperada tras semilla:

- [ ] 1 evento activo.
- [ ] 3 secciones cargadas.
- [ ] 70 asientos totales cargados.

Campos recomendados minimos:

- eventos:
  - [ ] id
  - [ ] nombre
  - [ ] fecha_evento
  - [ ] fecha_cierre_reservas
  - [ ] activo
- secciones:
  - [ ] id
  - [ ] evento_id
  - [ ] nombre
- asientos:
  - [ ] id
  - [ ] seccion_id
  - [ ] fila
  - [ ] numero
  - [ ] codigo_asiento
- reservas:
  - [ ] id
  - [ ] evento_id
  - [ ] asiento_id
  - [ ] nombre_completo
  - [ ] documento
  - [ ] created_at
- configuracion:
  - [ ] id
  - [ ] evento_id
  - [ ] max_entradas_por_persona
  - [ ] reservas_habilitadas

Restricciones clave:

- [ ] Unicidad por asiento reservado (evento_id + asiento_id).
- [ ] Unicidad por documento en el evento (evento_id + documento).
- [ ] FK correctas entre tablas.

---

## 3) Seguridad (RLS Minima)

- [ ] Activar RLS en tablas sensibles.
- [ ] Permitir lectura publica de disponibilidad de asientos y secciones.
- [ ] Permitir insercion de reserva publica solo si:
  - [ ] reservas_habilitadas = true
  - [ ] fecha actual <= fecha_cierre_reservas
  - [ ] no existe reserva previa del documento en ese evento
  - [ ] asiento aun no reservado
- [ ] Restringir operaciones administrativas a contexto backoffice.

Nota:
Para este proyecto escolar, el login admin es hardcodeado en frontend. Evitar exponer operaciones administrativas en el portal publico.

---

## 4) Backoffice MVP

- [x] Implementar pantalla de login simple (usuario y password hardcodeados).
- [x] Proteger rutas del backoffice con guard de sesion local.
- [x] Pantalla de configuracion general:
  - [x] nombre del evento
  - [x] maximo de entradas por persona
  - [x] habilitar/deshabilitar reservas
  - [x] fecha y hora limite
- [x] CRUD de secciones.
- [x] Generador de asientos por seccion (filas x asientos).
- [x] Dashboard de ocupacion:
  - [x] reservados
  - [x] disponibles
  - [x] porcentaje
- [x] Exportacion CSV.

---

## 5) Portal Publico MVP

- [x] Formulario de identificacion:
  - [x] nombre completo
  - [x] documento
- [x] Vista de secciones y asientos.
- [x] Indicadores de estado de asientos (disponible/ocupado/seleccionado).
- [x] Validar limite por persona antes de confirmar.
- [x] Confirmar reserva y guardar en Supabase.
- [x] Mostrar mensaje final sin comprobante (segun decision).

---

## 6) Actualizacion de Disponibilidad

- [x] Implementar refetch periodico con TanStack Query.
- [x] Intervalo recomendado inicial: 10 a 15 segundos.
- [x] Refetch inmediato al confirmar reserva.
- [x] Manejar errores de concurrencia con mensaje claro al usuario.

---

## 7) Backup y Operacion

- [x] Crear boton de exportacion CSV en backoffice.
- [x] Definir rutina manual:
  - [x] exportar CSV al menos 1 vez por dia de uso
  - [x] guardar copia local con fecha
- [x] Probar restauracion manual basica desde CSV (documentar procedimiento simple).

---

## 8) Deploy en Vercel

- [ ] Subir repositorio a GitHub.
- [ ] Conectar proyecto en Vercel.
- [ ] Cargar variables de entorno en Vercel.
- [ ] Validar build y deploy.
- [ ] Prueba final en URL publica.

Referencia:

- Config SPA para rutas: app/vercel.json.

---

## 9) QA Minimo Antes de Entrega

- [x] Flujo completo de reserva funcionando.
- [x] No se puede reservar el mismo asiento dos veces.
- [x] No se puede reservar dos veces con el mismo documento.
- [x] No se puede reservar fuera del horario de cierre.
- [x] Backoffice protegido por login.
- [x] Exportacion CSV descargable y legible.
- [x] Prueba con 2 navegadores al mismo tiempo.

Referencia:

- Ejecucion de pruebas: QA_MINIMO.md.

---

## 10) Orden de Trabajo Recomendado (1 semana)

- Dia 1: setup frontend + Supabase + esquema base.
- Dia 2: restricciones + RLS minima.
- Dia 3: backoffice (login + configuracion + secciones).
- Dia 4: generador de asientos + portal publico.
- Dia 5: reserva completa + refetch periodico.
- Dia 6: dashboard + exportacion CSV + QA.
- Dia 7: deploy en Vercel + ajustes finales.
