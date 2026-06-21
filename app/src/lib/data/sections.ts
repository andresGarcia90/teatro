import { supabase } from '../supabase/client'

export type SectionItem = {
  id: string
  nombre: string
  orden: number
}

export type SectionInput = {
  nombre: string
  orden: number
}

const dataMode = (import.meta.env.VITE_DATA_MODE || 'supabase').toLowerCase()
const localApiUrl = import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:8787'

async function getActiveEventIdFromSupabase(): Promise<string> {
  if (!supabase) {
    throw new Error('Faltan variables de Supabase en app/.env.local.')
  }

  const { data: evento, error } = await supabase
    .from('eventos')
    .select('id')
    .eq('activo', true)
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!evento?.id) {
    throw new Error('No hay evento activo.')
  }

  return evento.id
}

async function listSectionsFromLocalApi(): Promise<SectionItem[]> {
  const response = await fetch(`${localApiUrl}/api/backoffice/secciones`)
  const body = await response.json()

  if (!response.ok || !body.ok) {
    throw new Error(body.message || body.error || 'No se pudo leer secciones.')
  }

  return body.secciones
}

async function createSectionFromLocalApi(input: SectionInput): Promise<SectionItem> {
  const response = await fetch(`${localApiUrl}/api/backoffice/secciones`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  const body = await response.json()

  if (!response.ok || !body.ok) {
    throw new Error(body.message || body.error || 'No se pudo crear la seccion.')
  }

  return body.seccion
}

async function updateSectionFromLocalApi(id: string, input: SectionInput): Promise<SectionItem> {
  const response = await fetch(`${localApiUrl}/api/backoffice/secciones/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  })

  const body = await response.json()

  if (!response.ok || !body.ok) {
    throw new Error(body.message || body.error || 'No se pudo actualizar la seccion.')
  }

  return body.seccion
}

async function deleteSectionFromLocalApi(id: string): Promise<void> {
  const response = await fetch(`${localApiUrl}/api/backoffice/secciones/${id}`, {
    method: 'DELETE',
  })

  const body = await response.json()

  if (!response.ok || !body.ok) {
    throw new Error(body.message || body.error || 'No se pudo eliminar la seccion.')
  }
}

async function listSectionsFromSupabase(): Promise<SectionItem[]> {
  if (!supabase) {
    throw new Error('Faltan variables de Supabase en app/.env.local.')
  }

  const eventoId = await getActiveEventIdFromSupabase()

  const { data, error } = await supabase
    .from('secciones')
    .select('id,nombre,orden')
    .eq('evento_id', eventoId)
    .order('orden', { ascending: true })
    .order('nombre', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data || []).map((row) => ({
    id: row.id,
    nombre: row.nombre,
    orden: row.orden,
  }))
}

async function createSectionFromSupabase(input: SectionInput): Promise<SectionItem> {
  if (!supabase) {
    throw new Error('Faltan variables de Supabase en app/.env.local.')
  }

  const eventoId = await getActiveEventIdFromSupabase()

  const { data, error } = await supabase
    .from('secciones')
    .insert({
      evento_id: eventoId,
      nombre: input.nombre,
      orden: input.orden,
    })
    .select('id,nombre,orden')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return {
    id: data.id,
    nombre: data.nombre,
    orden: data.orden,
  }
}

async function updateSectionFromSupabase(id: string, input: SectionInput): Promise<SectionItem> {
  if (!supabase) {
    throw new Error('Faltan variables de Supabase en app/.env.local.')
  }

  const { data, error } = await supabase
    .from('secciones')
    .update({
      nombre: input.nombre,
      orden: input.orden,
    })
    .eq('id', id)
    .select('id,nombre,orden')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return {
    id: data.id,
    nombre: data.nombre,
    orden: data.orden,
  }
}

async function deleteSectionFromSupabase(id: string): Promise<void> {
  if (!supabase) {
    throw new Error('Faltan variables de Supabase en app/.env.local.')
  }

  const { error } = await supabase.from('secciones').delete().eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

export async function listBackofficeSections(): Promise<SectionItem[]> {
  if (dataMode === 'local') {
    return listSectionsFromLocalApi()
  }

  return listSectionsFromSupabase()
}

export async function createBackofficeSection(input: SectionInput): Promise<SectionItem> {
  if (dataMode === 'local') {
    return createSectionFromLocalApi(input)
  }

  return createSectionFromSupabase(input)
}

export async function updateBackofficeSection(id: string, input: SectionInput): Promise<SectionItem> {
  if (dataMode === 'local') {
    return updateSectionFromLocalApi(id, input)
  }

  return updateSectionFromSupabase(id, input)
}

export async function deleteBackofficeSection(id: string): Promise<void> {
  if (dataMode === 'local') {
    return deleteSectionFromLocalApi(id)
  }

  return deleteSectionFromSupabase(id)
}
