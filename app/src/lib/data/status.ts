import { supabase } from '../supabase/client'

export type ProjectStatus = {
  ok: boolean
  mode: 'supabase' | 'local'
  message: string
  eventoNombre?: string
  metricas?: {
    secciones: number
    asientos: number
    reservas: number
  }
}

const dataMode = (import.meta.env.VITE_DATA_MODE || 'supabase').toLowerCase()
const localApiUrl = import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:8787'

async function getStatusFromLocalApi(): Promise<ProjectStatus> {
  const response = await fetch(`${localApiUrl}/api/estado`)
  const body = await response.json()

  if (!response.ok || !body.ok) {
    return {
      ok: false,
      mode: 'local',
      message: body.message || body.error || 'No se pudo consultar la API local.',
    }
  }

  return {
    ok: true,
    mode: 'local',
    message: 'Conectado a API local + PostgreSQL Docker.',
    eventoNombre: body.evento?.nombre,
    metricas: body.metricas,
  }
}

async function getStatusFromSupabase(): Promise<ProjectStatus> {
  if (!supabase) {
    return {
      ok: false,
      mode: 'supabase',
      message: 'Faltan variables de Supabase en .env.local.',
    }
  }

  const { data: evento, error } = await supabase
    .from('eventos')
    .select('id,nombre')
    .eq('activo', true)
    .limit(1)
    .maybeSingle()

  if (error) {
    return {
      ok: false,
      mode: 'supabase',
      message: `Error consultando Supabase: ${error.message}`,
    }
  }

  if (!evento) {
    return {
      ok: true,
      mode: 'supabase',
      message: 'Conectado a Supabase. No hay evento activo aun.',
    }
  }

  const [seccionesRes, reservasRes] = await Promise.all([
    supabase
      .from('secciones')
      .select('id', { count: 'exact', head: true })
      .eq('evento_id', evento.id),
    supabase
      .from('reservas')
      .select('id', { count: 'exact', head: true })
      .eq('evento_id', evento.id),
  ])

  const secciones = seccionesRes.count || 0
  const reservas = reservasRes.count || 0

  return {
    ok: true,
    mode: 'supabase',
    message: 'Conectado a Supabase.',
    eventoNombre: evento.nombre,
    metricas: {
      secciones,
      asientos: 0,
      reservas,
    },
  }
}

export async function getProjectStatus(): Promise<ProjectStatus> {
  if (dataMode === 'local') {
    return getStatusFromLocalApi()
  }

  return getStatusFromSupabase()
}
