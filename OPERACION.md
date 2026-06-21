# OPERACION.md

# Operacion Basica del Evento

Guia simple para uso en dia de evento (proyecto escolar).

---

## 1) Backup Manual Diario (CSV)

Frecuencia recomendada:

- Antes de abrir reservas.
- Al menos 1 vez durante el uso.
- Al finalizar el evento.

Pasos:

1. Ingresar a Backoffice.
2. Ir a Dashboard: /backoffice/dashboard
3. Presionar "Exportar CSV de reservas".
4. Guardar el archivo con formato sugerido:
   - reservas_YYYYMMDD_HHMM.csv
5. Copiar el archivo a una carpeta de respaldo, por ejemplo:
   - backups/

---

## 2) Restauracion Manual Basica desde CSV

Este proyecto no tiene importador automatico de CSV.
La restauracion es manual y orientada a contingencia.

Pasos recomendados:

1. Elegir el CSV mas reciente valido.
2. Abrirlo en Excel o Google Sheets.
3. Verificar columnas clave:
   - documento
   - nombre_completo
   - seccion
   - fila
   - numero_asiento
4. Volver a cargar datos en base (manual) usando SQL/planilla de apoyo.
5. Validar que:
   - No haya duplicados de documento en el evento.
   - No haya asientos duplicados reservados.

Nota:
Para restauraciones completas mas seguras, usar backup nativo de PostgreSQL en una futura iteracion.

---

## 3) Checklist Rapido Pre-Evento

- Backoffice accesible.
- Evento activo correcto.
- Fecha de cierre correcta.
- Secciones y asientos cargados.
- Exportacion CSV funcionando.
