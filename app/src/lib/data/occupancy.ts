import { supabase } from '../supabase/client'

export type OccupancyData = {
  reservados: number
  disponibles: number
  total: number
  porcentajeOcupacion: number
}

const dataMode = (import.meta.env.VITE_DATA_MODE || 'supabase').toLowerCase()
const localApiUrl = import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:8787'

async function getFromLocalApi(): Promise<OccupancyData> {
  const response = await fetch(`${localApiUrl}/api/backoffice/dashboard-ocupacion`)
  const body = await response.json()

  if (!response.ok || !body.ok) {
    throw new Error(body.message || body.error || 'No se pudo leer ocupacion local.')
  }

  return body.ocupacion
}

async function getFromSupabase(): Promise<OccupancyData> {
  if (!supabase) {
    throw new Error('Faltan variables de Supabase en app/.env.local.')
  }

  const { data: evento, error: eventoError } = await supabase
    .from('eventos')
    .select('id')
    .eq('activo', true)
    .limit(1)
    .maybeSingle()

  if (eventoError) {
    throw new Error(eventoError.message)
  }

  if (!evento?.id) {
    throw new Error('No hay evento activo.')
  }

  const [reservasRes, seccionesRes] = await Promise.all([
    supabase
      .from('reservas')
      .select('id', { count: 'exact', head: true })
      .eq('evento_id', evento.id),
    supabase
      .from('secciones')
      .select('id')
      .eq('evento_id', evento.id),
  ])

  const reservas = reservasRes.count || 0

  if (seccionesRes.error) {
    throw new Error(seccionesRes.error.message)
  }

  const seccionIds = (seccionesRes.data || []).map((row) => row.id)

  if (seccionIds.length === 0) {
    return {
      reservados: reservas,
      disponibles: 0,
      total: 0,
      porcentajeOcupacion: 0,
    }
  }

  const { count: asientosCount, error: asientosError } = await supabase
    .from('asientos')
    .select('id', { count: 'exact', head: true })
    .in('seccion_id', seccionIds)

  if (asientosError) {
    throw new Error(asientosError.message)
  }

  const total = asientosCount || 0
  const disponibles = Math.max(total - reservas, 0)
  const porcentajeOcupacion = total > 0 ? Number(((reservas / total) * 100).toFixed(2)) : 0

  return {
    reservados: reservas,
    disponibles,
    total,
    porcentajeOcupacion,
  }
}

export async function getOccupancyData(): Promise<OccupancyData> {
  if (dataMode === 'local') {
    return getFromLocalApi()
  }

  return getFromSupabase()
}
