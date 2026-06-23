import { useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useBackofficeAuthStore } from './auth-store'
import {
  getBackofficeConfiguration,
  updateBackofficeConfiguration,
} from '../../lib/data/configuration'
import { BackofficeHeader } from '../../components/ui/BackofficeHeader'
import { BackofficeNav } from '../../components/ui/BackofficeNav'

function toLocalDateTimeInput(value: string): string {
  if (!value) {
    return ''
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60_000)
  return localDate.toISOString().slice(0, 16)
}

function toIsoFromLocalDateTime(value: string): string {
  const date = new Date(value)
  return date.toISOString()
}

export function BackofficeConfiguracionPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const logout = useBackofficeAuthStore((state) => state.logout)

  const [nombreEvento, setNombreEvento] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [horario, setHorario] = useState('')
  const [direccion, setDireccion] = useState('')
  const [fechaCierreReservas, setFechaCierreReservas] = useState('')
  const [maxEntradasPorPersona, setMaxEntradasPorPersona] = useState(1)
  const [reservasHabilitadas, setReservasHabilitadas] = useState(true)
  const [mensajeExito, setMensajeExito] = useState('')

  const configQuery = useQuery({
    queryKey: ['backoffice-configuracion'],
    queryFn: getBackofficeConfiguration,
  })

  useEffect(() => {
    if (!configQuery.data) {
      return
    }

    setNombreEvento(configQuery.data.nombreEvento)
    setDescripcion(configQuery.data.descripcion || '')
    setHorario(configQuery.data.horario || '')
    setDireccion(configQuery.data.direccion || '')
    setFechaCierreReservas(toLocalDateTimeInput(configQuery.data.fechaCierreReservas))
    setMaxEntradasPorPersona(configQuery.data.maxEntradasPorPersona)
    setReservasHabilitadas(configQuery.data.reservasHabilitadas)
  }, [configQuery.data])

  const mutation = useMutation({
    mutationFn: updateBackofficeConfiguration,
    onSuccess: async () => {
      setMensajeExito('Configuracion guardada correctamente.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['backoffice-configuracion'] }),
        queryClient.invalidateQueries({ queryKey: ['project-status'] }),
      ])
    },
  })

  const fechaEventoLabel = useMemo(() => {
    if (!configQuery.data?.fechaEvento) {
      return '-'
    }

    const date = new Date(configQuery.data.fechaEvento)
    if (Number.isNaN(date.getTime())) {
      return configQuery.data.fechaEvento
    }

    return date.toLocaleString('es-AR')
  }, [configQuery.data?.fechaEvento])

  function handleLogout() {
    logout()
    navigate('/backoffice/login', { replace: true })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMensajeExito('')

    mutation.mutate({
      nombreEvento: nombreEvento.trim(),
      descripcion: descripcion.trim() || null,
      horario: horario.trim() || null,
      direccion: direccion.trim() || null,
      fechaCierreReservas: toIsoFromLocalDateTime(fechaCierreReservas),
      maxEntradasPorPersona,
      reservasHabilitadas,
    })
  }

  return (
    <main className="app-fade-in min-h-screen text-slate-800">
      <section className="mx-auto max-w-4xl p-6 md:p-10">
        <BackofficeHeader
          title="Configuracion"
          description="Administra la configuracion principal del evento activo."
        />

        <section className="app-card mb-6 p-6">
          {configQuery.isLoading ? (
            <p className="text-slate-600">Cargando configuracion...</p>
          ) : configQuery.error ? (
            <p className="text-red-600">
              Error al cargar configuracion: {(configQuery.error as Error).message}
            </p>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="nombreEvento">
                    Nombre del evento
                  </label>
                  <input
                    id="nombreEvento"
                    type="text"
                    className="backoffice-field"
                    value={nombreEvento}
                    onChange={(e) => setNombreEvento(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="maxEntradasPorPersona">
                    Maximo de entradas por persona
                  </label>
                  <input
                    id="maxEntradasPorPersona"
                    type="number"
                    min={1}
                    className="backoffice-field"
                    value={maxEntradasPorPersona}
                    onChange={(e) => setMaxEntradasPorPersona(Number(e.target.value || 1))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium" htmlFor="descripcion">
                  Descripción del evento
                </label>
                <textarea
                  id="descripcion"
                  rows={3}
                  className="backoffice-field"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Una producción magistral de la Compañía Teatral..."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="horario">
                    Horario del evento
                  </label>
                  <input
                    id="horario"
                    type="time"
                    className="backoffice-field"
                    value={horario}
                    onChange={(e) => setHorario(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="direccion">
                    Dirección del evento
                  </label>
                  <input
                    id="direccion"
                    type="text"
                    className="backoffice-field"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Ej: Avenida Principal 123"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="fechaCierreReservas">
                    Fecha y hora limite de reservas
                  </label>
                  <input
                    id="fechaCierreReservas"
                    type="datetime-local"
                    className="backoffice-field"
                    value={fechaCierreReservas}
                    onChange={(e) => setFechaCierreReservas(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <p className="mb-1 block text-sm font-medium">Fecha del evento (solo lectura)</p>
                  <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    {fechaEventoLabel}
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={reservasHabilitadas}
                  onChange={(e) => setReservasHabilitadas(e.target.checked)}
                />
                Habilitar reservas
              </label>

              {mutation.error && (
                <p className="text-sm text-red-600">Error al guardar: {(mutation.error as Error).message}</p>
              )}

              {mensajeExito && <p className="text-sm text-emerald-700">{mensajeExito}</p>}

              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Guardando...' : 'Guardar configuracion'}
              </button>
            </form>
          )}
        </section>

        <BackofficeNav
          links={[
            { to: '/backoffice/secciones', label: 'Gestionar secciones' },
            { to: '/backoffice/asientos', label: 'Generador de asientos' },
            { to: '/backoffice/dashboard', label: 'Dashboard ocupacion' },
            { to: '/publico', label: 'Ir al portal publico' },
          ]}
          onLogout={handleLogout}
        />
      </section>
    </main>
  )
}
