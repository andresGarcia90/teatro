import { supabase } from '../supabase/client'

export type PublicSection = {
  id: string
  nombre: string
  orden: number
}

export type PublicEventData = {
  eventoId: string
  nombreEvento: string
  descripcion?: string | null
  fechaEvento: string
  horario?: string | null
  direccion?: string | null
  fechaCierreReservas: string
  reservasHabilitadas: boolean
  maxEntradasPorPersona: number
  sections: PublicSection[]
}

export type PublicSeat = {
  id: string
  fila: string
  numero: number
  codigoAsiento: string
  reservado: boolean
}

export type ReservationInput = {
  nombreCompleto: string
  documento: string
  asientoId: string
}

export type DocumentValidation = {
  canReserve: boolean
  used: number
  limit: number
  message: string
}

const dataMode = (import.meta.env.VITE_DATA_MODE || 'supabase').toLowerCase()
const localApiUrl = import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:8787'

async function getPublicEventFromLocalApi(): Promise<PublicEventData> {
  const response = await fetch(`${localApiUrl}/api/publico/evento`)
  const body = await response.json()

  if (!response.ok || !body.ok) {
    throw new Error(body.message || body.error || 'No se pudo cargar el evento publico.')
  }

  return body.evento
}

async function getPublicSeatsFromLocalApi(eventoId: string, seccionId: string): Promise<PublicSeat[]> {
  const response = await fetch(
    `${localApiUrl}/api/publico/secciones/${seccionId}/asientos?eventoId=${encodeURIComponent(eventoId)}`,
  )
  const body = await response.json()

  if (!response.ok || !body.ok) {
    throw new Error(body.message || body.error || 'No se pudieron cargar asientos.')
  }

  return body.asientos
}

async function createReservationFromLocalApi(
  eventoId: string,
  input: ReservationInput,
): Promise<void> {
  const response = await fetch(`${localApiUrl}/api/publico/reservas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      eventoId,
      nombreCompleto: input.nombreCompleto,
      documento: input.documento,
      asientoId: input.asientoId,
    }),
  })

  const body = await response.json()

  if (!response.ok || !body.ok) {
    throw new Error(body.message || body.error || 'No se pudo completar la reserva.')
  }
}

async function validateDocumentFromLocalApi(
  eventoId: string,
  documento: string,
): Promise<DocumentValidation> {
  const response = await fetch(
    `${localApiUrl}/api/publico/validar-documento?eventoId=${encodeURIComponent(eventoId)}&documento=${encodeURIComponent(documento)}`,
  )

  const body = await response.json()

  if (!response.ok || !body.ok) {
    throw new Error(body.message || body.error || 'No se pudo validar el documento.')
  }

  return body.validacion
}

async function getPublicEventFromSupabase(): Promise<PublicEventData> {
  if (!supabase) {
    throw new Error('Faltan variables de Supabase en app/.env.local.')
  }

  const { data: evento, error: eventoError } = await supabase
    .from('eventos')
    .select('id,nombre,descripcion,fecha_evento,horario,direccion,fecha_cierre_reservas,activo')
    .eq('activo', true)
    .limit(1)
    .maybeSingle()

  if (eventoError) {
    throw new Error(eventoError.message)
  }

  if (!evento?.id) {
    throw new Error('No hay evento activo.')
  }

  const [configRes, sectionsRes] = await Promise.all([
    supabase
      .from('configuracion')
      .select('max_entradas_por_persona,reservas_habilitadas')
      .eq('evento_id', evento.id)
      .limit(1)
      .maybeSingle(),
    supabase
      .from('secciones')
      .select('id,nombre,orden')
      .eq('evento_id', evento.id)
      .order('orden', { ascending: true })
      .order('nombre', { ascending: true }),
  ])

  if (configRes.error) {
    throw new Error(configRes.error.message)
  }

  if (sectionsRes.error) {
    throw new Error(sectionsRes.error.message)
  }

  return {
    eventoId: evento.id,
    nombreEvento: evento.nombre,
    descripcion: evento.descripcion || null,
    fechaEvento: evento.fecha_evento,
    horario: evento.horario || null,
    direccion: evento.direccion || null,
    fechaCierreReservas: evento.fecha_cierre_reservas,
    reservasHabilitadas: configRes.data?.reservas_habilitadas ?? true,
    maxEntradasPorPersona: configRes.data?.max_entradas_por_persona ?? 1,
    sections: (sectionsRes.data || []).map((item) => ({
      id: item.id,
      nombre: item.nombre,
      orden: item.orden,
    })),
  }
}

async function getPublicSeatsFromSupabase(eventoId: string, seccionId: string): Promise<PublicSeat[]> {
  if (!supabase) {
    throw new Error('Faltan variables de Supabase en app/.env.local.')
  }

  const { data: seats, error: seatsError } = await supabase
    .from('asientos')
    .select('id,fila,numero,codigo_asiento')
    .eq('seccion_id', seccionId)
    .order('fila', { ascending: true })
    .order('numero', { ascending: true })

  if (seatsError) {
    throw new Error(seatsError.message)
  }

  const { data: reservations, error: reservationsError } = await supabase
    .from('reservas')
    .select('asiento_id')
    .eq('evento_id', eventoId)

  if (reservationsError) {
    throw new Error(reservationsError.message)
  }

  const occupiedSet = new Set((reservations || []).map((item) => item.asiento_id))

  return (seats || []).map((seat) => ({
    id: seat.id,
    fila: seat.fila,
    numero: seat.numero,
    codigoAsiento: seat.codigo_asiento,
    reservado: occupiedSet.has(seat.id),
  }))
}

async function createReservationFromSupabase(eventoId: string, input: ReservationInput): Promise<void> {
  if (!supabase) {
    throw new Error('Faltan variables de Supabase en app/.env.local.')
  }

  const [configRes, countRes] = await Promise.all([
    supabase
      .from('configuracion')
      .select('max_entradas_por_persona')
      .eq('evento_id', eventoId)
      .limit(1)
      .maybeSingle(),
    supabase
      .from('reservas')
      .select('id', { count: 'exact', head: true })
      .eq('evento_id', eventoId)
      .ilike('documento', input.documento.trim()),
  ])

  if (configRes.error) {
    throw new Error(configRes.error.message)
  }

  if (countRes.error) {
    throw new Error(countRes.error.message)
  }

  const configuredLimit = Math.max(configRes.data?.max_entradas_por_persona ?? 1, 1)
  const used = countRes.count || 0

  if (used >= configuredLimit) {
    throw new Error('El documento ya alcanzo el limite de reservas permitido.')
  }

  const { error } = await supabase.from('reservas').insert({
    evento_id: eventoId,
    asiento_id: input.asientoId,
    nombre_completo: input.nombreCompleto.trim(),
    documento: input.documento.trim(),
  })

  if (error) {
    throw new Error(error.message)
  }
}

async function validateDocumentFromSupabase(
  eventoId: string,
  documento: string,
): Promise<DocumentValidation> {
  if (!supabase) {
    throw new Error('Faltan variables de Supabase en app/.env.local.')
  }

  const [configRes, countRes] = await Promise.all([
    supabase
      .from('configuracion')
      .select('max_entradas_por_persona')
      .eq('evento_id', eventoId)
      .limit(1)
      .maybeSingle(),
    supabase
      .from('reservas')
      .select('id', { count: 'exact', head: true })
      .eq('evento_id', eventoId)
      .ilike('documento', documento.trim()),
  ])

  if (configRes.error) {
    throw new Error(configRes.error.message)
  }

  if (countRes.error) {
    throw new Error(countRes.error.message)
  }

  const used = countRes.count || 0
  const configuredLimit = configRes.data?.max_entradas_por_persona ?? 1
  const limit = Math.max(configuredLimit, 1)
  const canReserve = used < limit

  return {
    canReserve,
    used,
    limit,
    message: canReserve
      ? 'Documento habilitado para reservar.'
      : 'El documento ya alcanzo el limite de reservas permitido.',
  }
}

export async function getPublicEventData(): Promise<PublicEventData> {
  if (dataMode === 'local') {
    return getPublicEventFromLocalApi()
  }

  return getPublicEventFromSupabase()
}

export async function getPublicSeats(eventoId: string, seccionId: string): Promise<PublicSeat[]> {
  if (dataMode === 'local') {
    return getPublicSeatsFromLocalApi(eventoId, seccionId)
  }

  return getPublicSeatsFromSupabase(eventoId, seccionId)
}

export async function createPublicReservation(
  eventoId: string,
  input: ReservationInput,
): Promise<void> {
  if (dataMode === 'local') {
    return createReservationFromLocalApi(eventoId, input)
  }

  return createReservationFromSupabase(eventoId, input)
}

export async function validatePublicDocument(
  eventoId: string,
  documento: string,
): Promise<DocumentValidation> {
  if (dataMode === 'local') {
    return validateDocumentFromLocalApi(eventoId, documento)
  }

  return validateDocumentFromSupabase(eventoId, documento)
}
