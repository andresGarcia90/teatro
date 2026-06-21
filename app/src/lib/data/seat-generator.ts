import { supabase } from '../supabase/client'

export type SeatGenerationInput = {
  seccionId: string
  filaInicio: string
  cantidadFilas: number
  asientosPorFila: number
  sobrescribir: boolean
}

export type SeatSummary = {
  totalAsientos: number
  filas: number
}

const dataMode = (import.meta.env.VITE_DATA_MODE || 'supabase').toLowerCase()
const localApiUrl = import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:8787'

function normalizeRowPrefix(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1) || 'A'
}

function buildRowLabels(startRow: string, count: number): string[] {
  const start = normalizeRowPrefix(startRow)
  const startCode = start.charCodeAt(0)

  if (startCode + count - 1 > 'Z'.charCodeAt(0)) {
    throw new Error('El rango de filas excede Z. Reduce la cantidad de filas o cambia fila inicial.')
  }

  return Array.from({ length: count }, (_, index) =>
    String.fromCharCode(startCode + index),
  )
}

export async function getSeatSummary(seccionId: string): Promise<SeatSummary> {
  if (dataMode === 'local') {
    const response = await fetch(`${localApiUrl}/api/backoffice/secciones/${seccionId}/asientos/resumen`)
    const body = await response.json()

    if (!response.ok || !body.ok) {
      throw new Error(body.message || body.error || 'No se pudo consultar resumen de asientos.')
    }

    return body.resumen
  }

  if (!supabase) {
    throw new Error('Faltan variables de Supabase en app/.env.local.')
  }

  const { data, error } = await supabase.from('asientos').select('fila').eq('seccion_id', seccionId)

  if (error) {
    throw new Error(error.message)
  }

  const rows = data || []
  const distinctRows = new Set(rows.map((row) => row.fila)).size

  return {
    totalAsientos: rows.length,
    filas: distinctRows,
  }
}

export async function generateSeatsForSection(input: SeatGenerationInput): Promise<void> {
  if (dataMode === 'local') {
    const response = await fetch(`${localApiUrl}/api/backoffice/secciones/${input.seccionId}/asientos/generar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    })

    const body = await response.json()

    if (!response.ok || !body.ok) {
      throw new Error(body.message || body.error || 'No se pudo generar asientos.')
    }

    return
  }

  if (!supabase) {
    throw new Error('Faltan variables de Supabase en app/.env.local.')
  }

  const rowLabels = buildRowLabels(input.filaInicio, input.cantidadFilas)

  if (input.sobrescribir) {
    const { error: deleteError } = await supabase
      .from('asientos')
      .delete()
      .eq('seccion_id', input.seccionId)

    if (deleteError) {
      throw new Error(deleteError.message)
    }
  }

  const seats = rowLabels.flatMap((fila) =>
    Array.from({ length: input.asientosPorFila }, (_, index) => {
      const numero = index + 1
      return {
        seccion_id: input.seccionId,
        fila,
        numero,
        codigo_asiento: `${fila}-${numero}`,
      }
    }),
  )

  const { error } = await supabase
    .from('asientos')
    .upsert(seats, { onConflict: 'seccion_id,fila,numero' })

  if (error) {
    throw new Error(error.message)
  }
}
