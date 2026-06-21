# PREGUNTAS_ABIERTAS.md

# Pendientes Funcionales

## PA-001

¿Una persona puede reservar una sola vez o múltiples veces?

Estado: Resuelto

Respuesta: Una sola vez.

---

## PA-002

¿El documento debe ser único dentro de un evento?

Estado: Resuelto

Respuesta: Sí.

---

## PA-003

¿Se permitirá cancelar reservas?

Estado: Resuelto

Respuesta: No.

---

## PA-004

¿Se permitirá modificar reservas?

Estado: Resuelto

Respuesta: No.

---

## PA-005

¿Las reservas tienen vencimiento?

Estado: Resuelto

Respuesta: Sí.

---

## PA-006

¿Existirá una lista de documentos habilitados?

Estado: Resuelto

Respuesta: No.

---

## PA-007

¿Se podrán crear múltiples eventos?

Estado: Resuelto

Respuesta: No. Solo un evento.

Actualmente el alcance contempla un único evento activo.

---

## PA-008

¿El backoffice tendrá autenticación?

Estado: Resuelto

Respuesta: Sí, con usuario y contraseña definidos por el equipo (hardcodeados).

Opciones:

* Usuario y contraseña.
* Magic Link de Supabase.
* Sin autenticación (no recomendado).

---

## PA-009

¿Cómo se administrarán los permisos?

Estado: Resuelto

Respuesta: No habrá gestión de permisos por roles.

---

## PA-010

¿Se necesita comprobante para el usuario?

Estado: Resuelto

Respuesta: No.

Opciones:

* Ninguno.
* PDF.
* QR.
* Correo electrónico.

---

# Pendientes Técnicos

## PT-001

Definir estrategia definitiva de RLS.

Estado: Resuelto

Respuesta: RLS mínima para proteger escritura y acceso administrativo.

---

## PT-002

Definir si el realtime se implementará mediante:

* Supabase Realtime.
* Refetch periódico.

Estado: Resuelto

Respuesta: Refetch periódico.

---

## PT-003

Definir estrategia de backups.

Estado: Resuelto

Respuesta: Backup manual por exportación CSV.

CSV manual inicialmente.

---

## PT-004

Definir si el frontend será desplegado en:

* Vercel
* Netlify
* Cloudflare Pages

Estado: Resuelto

Respuesta: Vercel.
