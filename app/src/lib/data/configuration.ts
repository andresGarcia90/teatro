import { supabase } from '../supabase/client'

export type BackofficeConfiguration = {
  eventoId: string
  nombreEvento: string
  descripcion?: string | null
  fechaEvento: string
  horario?: string | null
  direccion?: string | null
  fechaCierreReservas: string
  maxEntradasPorPersona: number
  reservasHabilitadas: boolean
}

export type BackofficeConfigurationInput = {
  nombreEvento: string
  descripcion?: string | null
  horario?: string | null
  direccion?: string | null
  fechaCierreReservas: string
  maxEntradasPorPersona: number
  reservasHabilitadas: boolean
}

const dataMode = (import.meta.env.VITE_DATA_MODE || 'supabase').toLowerCase()
const localApiUrl = import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:8787'

async function getFromLocalApi(): Promise<BackofficeConfiguration> {
  const response = await fetch(`${localApiUrl}/api/backoffice/configuracion`)
  const body = await response.json()

  if (!response.ok || !body.ok) {
    throw new Error(body.message || body.error || 'No se pudo leer configuracion local.')
  }

  return body.configuracion
}

async function updateFromLocalApi(input: BackofficeConfigurationInput): Promise<BackofficeConfiguration> {
  const response = await fetch(`${localApiUrl}/api/backoffice/configuracion`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  const body = await response.json()

  if (!response.ok || !body.ok) {
    throw new Error(body.message || body.error || 'No se pudo guardar configuracion local.')
  }

  return body.configuracion
}

async function getFromSupabase(): Promise<BackofficeConfiguration> {
  if (!supabase) {
    throw new Error('Faltan variables de Supabase en app/.env.local.')
  }

  const { data: evento, error: eventoError } = await supabase
    .from('eventos')
    .select('id,nombre,descripcion,fecha_evento,horario,direccion,fecha_cierre_reservas')
    .eq('activo', true)
    .limit(1)
    .maybeSingle()

  if (eventoError) {
    throw new Error(eventoError.message)
  }

  if (!evento) {
    throw new Error('No hay evento activo.')
  }

  const { data: config, error: configError } = await supabase
    .from('configuracion')
    .select('max_entradas_por_persona,reservas_habilitadas')
    .eq('evento_id', evento.id)
    .limit(1)
    .maybeSingle()

  if (configError) {
    throw new Error(configError.message)
  }

  return {
    eventoId: evento.id,
    nombreEvento: evento.nombre,
    descripcion: evento.descripcion || null,
    fechaEvento: evento.fecha_evento,
    horario: evento.horario || null,
    direccion: evento.direccion || null,
    fechaCierreReservas: evento.fecha_cierre_reservas,
    maxEntradasPorPersona: config?.max_entradas_por_persona ?? 1,
    reservasHabilitadas: config?.reservas_habilitadas ?? true,
  }
}

async function updateFromSupabase(input: BackofficeConfigurationInput): Promise<BackofficeConfiguration> {
  if (!supabase) {
    throw new Error('Faltan variables de Supabase en app/.env.local.')
  }

  const current = await getFromSupabase()

  const { error: eventoError } = await supabase
    .from('eventos')
    .update({
      nombre: input.nombreEvento,
      descripcion: input.descripcion || null,
      horario: input.horario || null,
      direccion: input.direccion || null,
      fecha_cierre_reservas: input.fechaCierreReservas,
    })
    .eq('id', current.eventoId)

  if (eventoError) {
    throw new Error(eventoError.message)
  }

  const { error: configUpsertError } = await supabase.from('configuracion').upsert(
    {
      evento_id: current.eventoId,
      max_entradas_por_persona: input.maxEntradasPorPersona,
      reservas_habilitadas: input.reservasHabilitadas,
    },
    {
      onConflict: 'evento_id',
    },
  )

  if (configUpsertError) {
    throw new Error(configUpsertError.message)
  }

  return getFromSupabase()
}

export async function getBackofficeConfiguration(): Promise<BackofficeConfiguration> {
  if (dataMode === 'local') {
    return getFromLocalApi()
  }

  return getFromSupabase()
}

export async function updateBackofficeConfiguration(
  input: BackofficeConfigurationInput,
): Promise<BackofficeConfiguration> {
  if (dataMode === 'local') {
    return updateFromLocalApi(input)
  }

  return updateFromSupabase(input)
}
