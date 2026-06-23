import { supabase } from '../supabase/client'

type CsvExportResult = {
  blob: Blob
  fileName: string
}

type CsvColumn = {
  label: string
  key: string
}

const dataMode = (import.meta.env.VITE_DATA_MODE || 'supabase').toLowerCase()
const localApiUrl = import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:8787'

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }

  return str
}

function formatReservationDate(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (value instanceof Date) {
    const day = String(value.getUTCDate()).padStart(2, '0')
    const month = String(value.getUTCMonth() + 1).padStart(2, '0')
    const year = value.getUTCFullYear()
    return `${day}/${month}/${year}`
  }

  const text = String(value)
  const isoDate = text.slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    const [year, month, day] = isoDate.split('-')
    return `${day}/${month}/${year}`
  }

  const parsedDate = new Date(text)
  if (!Number.isNaN(parsedDate.getTime())) {
    const day = String(parsedDate.getUTCDate()).padStart(2, '0')
    const month = String(parsedDate.getUTCMonth() + 1).padStart(2, '0')
    const year = parsedDate.getUTCFullYear()
    return `${day}/${month}/${year}`
  }

  return text
}

function buildCsv(rows: Array<Record<string, unknown>>, columns: CsvColumn[]): string {
  const lines = [columns.map((column) => escapeCsv(column.label)).join(',')]

  for (const row of rows) {
    const line = columns.map((column) => escapeCsv(row[column.key])).join(',')
    lines.push(line)
  }

  return lines.join('\n')
}

function todayStamp(): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}${mm}${dd}`
}

async function exportFromLocalApi(): Promise<CsvExportResult> {
  const response = await fetch(`${localApiUrl}/api/backoffice/export/reservas.csv`)

  if (!response.ok) {
    let message = 'No se pudo exportar CSV en modo local.'
    try {
      const body = await response.json()
      message = body.message || body.error || message
    } catch {
      // no-op
    }
    throw new Error(message)
  }

  const blob = await response.blob()
  const fileName = `reservas_${todayStamp()}.csv`

  return { blob, fileName }
}

async function exportFromSupabase(): Promise<CsvExportResult> {
  if (!supabase) {
    throw new Error('Faltan variables de Supabase en app/.env.local.')
  }

  const columns: CsvColumn[] = [
    { label: 'Nombre del hijo', key: 'nombre_nino' },
    { label: 'Nombre', key: 'nombre' },
    { label: 'Apellido', key: 'apellido' },
    { label: 'Seccion', key: 'seccion' },
    { label: 'Fila', key: 'fila' },
    { label: 'Nro de asiento', key: 'numero_asiento' },
    { label: 'Codigo de asiento', key: 'codigo_asiento' },
    { label: 'Fecha de reserva', key: 'fecha_reserva' },
  ]

  const { data: evento, error: eventoError } = await supabase
    .from('eventos')
    .select('id,nombre')
    .eq('activo', true)
    .limit(1)
    .maybeSingle()

  if (eventoError) {
    throw new Error(eventoError.message)
  }

  if (!evento?.id) {
    throw new Error('No hay evento activo.')
  }

  const { data: reservas, error: reservasError } = await supabase
    .from('reservas')
    .select('id,asiento_id,documento,nombre_completo,nombre,apellido,nombre_nino,created_at')
    .eq('evento_id', evento.id)
    .order('created_at', { ascending: true })

  if (reservasError) {
    throw new Error(reservasError.message)
  }

  const reservationRows = reservas || []

  const asientoIds = reservationRows.map((item) => item.asiento_id)

  const seatMap = new Map<string, { seccion_id: string; fila: string; numero: number; codigo_asiento: string }>()
  const sectionMap = new Map<string, string>()

  if (asientoIds.length > 0) {
    const { data: seats, error: seatsError } = await supabase
      .from('asientos')
      .select('id,seccion_id,fila,numero,codigo_asiento')
      .in('id', asientoIds)

    if (seatsError) {
      throw new Error(seatsError.message)
    }

    for (const seat of seats || []) {
      seatMap.set(seat.id, {
        seccion_id: seat.seccion_id,
        fila: seat.fila,
        numero: seat.numero,
        codigo_asiento: seat.codigo_asiento,
      })
    }

    const seccionIds = Array.from(new Set((seats || []).map((item) => item.seccion_id)))

    if (seccionIds.length > 0) {
      const { data: sections, error: sectionsError } = await supabase
        .from('secciones')
        .select('id,nombre')
        .in('id', seccionIds)

      if (sectionsError) {
        throw new Error(sectionsError.message)
      }

      for (const section of sections || []) {
        sectionMap.set(section.id, section.nombre)
      }
    }
  }

  const csvRows = reservationRows.map((reserva) => {
    const seat = seatMap.get(reserva.asiento_id)
    return {
      nombre: reserva.nombre || '',
      apellido: reserva.apellido || '',
      nombre_nino: reserva.nombre_nino || '',
      seccion: seat ? sectionMap.get(seat.seccion_id) || '' : '',
      fila: seat?.fila || '',
      numero_asiento: seat?.numero || '',
      codigo_asiento: seat?.codigo_asiento || '',
      fecha_reserva: formatReservationDate(reserva.created_at),
    }
  })

  const csv = buildCsv(csvRows, columns)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const fileName = `reservas_${todayStamp()}.csv`

  return { blob, fileName }
}

export async function exportReservationsCsv(): Promise<CsvExportResult> {
  if (dataMode === 'local') {
    return exportFromLocalApi()
  }

  return exportFromSupabase()
}
