import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPublicReservation,
  getPublicEventData,
  getPublicSeats,
  validatePublicDocument,
  type PublicSeat,
} from '../../lib/data/public-portal'
import { MetricCard } from '../../components/ui/MetricCard'
import { SeatLegend } from '../../components/ui/SeatLegend'
import { StatusPill } from '../../components/ui/StatusPill'

export function PublicoPage() {
  const queryClient = useQueryClient()
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [documento, setDocumento] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([])
  const [mensajeExito, setMensajeExito] = useState('')
  const [currentTime, setCurrentTime] = useState(() => Date.now())

  const eventQuery = useQuery({
    queryKey: ['public-event-data'],
    queryFn: getPublicEventData,
    refetchInterval: 15_000,
  })

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentTime(Date.now())
    }, 60_000)

    return () => window.clearInterval(interval)
  }, [])

  const effectiveSelectedSectionId = selectedSectionId || eventQuery.data?.sections?.[0]?.id || ''

  const seatsQuery = useQuery({
    queryKey: ['public-seats', eventQuery.data?.eventoId, effectiveSelectedSectionId],
    queryFn: () => getPublicSeats(eventQuery.data!.eventoId, effectiveSelectedSectionId),
    enabled: Boolean(eventQuery.data?.eventoId && effectiveSelectedSectionId),
    refetchInterval: 10_000,
  })

  const reserveMutation = useMutation({
    mutationFn: async () => {
      const seatIdsToReserve = selectedSeatIds.slice(0, maxSeleccionable)

      for (const seatId of seatIdsToReserve) {
        await createPublicReservation(eventQuery.data!.eventoId, {
          nombreCompleto,
          documento,
          asientoId: seatId,
        })
      }
    },
    onSuccess: async () => {
      const plural = selectedSeatIds.length === 1 ? 'asiento' : 'asientos'
      setMensajeExito(`Reserva confirmada correctamente para ${selectedSeatIds.length} ${plural}.`)
      setSelectedSeatIds([])
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['public-seats', eventQuery.data?.eventoId, effectiveSelectedSectionId] }),
        queryClient.invalidateQueries({ queryKey: ['public-document-validation', eventQuery.data?.eventoId, documento.trim()] }),
        queryClient.invalidateQueries({ queryKey: ['project-status'] }),
        queryClient.invalidateQueries({ queryKey: ['backoffice-dashboard-ocupacion'] }),
      ])
    },
  })

  const documentoNormalizado = documento.trim()

  const documentValidationQuery = useQuery({
    queryKey: ['public-document-validation', eventQuery.data?.eventoId, documentoNormalizado],
    queryFn: () => validatePublicDocument(eventQuery.data!.eventoId, documentoNormalizado),
    enabled: Boolean(eventQuery.data?.eventoId && documentoNormalizado),
    staleTime: 5_000,
  })

  const selectedSeats = useMemo(() => {
    if (!seatsQuery.data || selectedSeatIds.length === 0) {
      return []
    }

    const selectedSet = new Set(selectedSeatIds)
    return seatsQuery.data.filter((seat) => selectedSet.has(seat.id))
  }, [seatsQuery.data, selectedSeatIds])

  const seatsByRow = useMemo(() => {
    const map = new Map<string, PublicSeat[]>()

    for (const seat of seatsQuery.data || []) {
      const current = map.get(seat.fila) || []
      current.push(seat)
      map.set(seat.fila, current)
    }

    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [seatsQuery.data])

  const cierreVencido = eventQuery.data?.fechaCierreReservas
    ? new Date(eventQuery.data.fechaCierreReservas).getTime() < currentTime
    : false

  const fechaCierreTexto = eventQuery.data?.fechaCierreReservas
    ? new Intl.DateTimeFormat('es-AR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(eventQuery.data.fechaCierreReservas))
    : 'Sin fecha definida'

  const totalAsientosSeccion = seatsQuery.data?.length || 0
  const asientosReservados = seatsQuery.data?.filter((seat) => seat.reservado).length || 0
  const asientosDisponibles = totalAsientosSeccion - asientosReservados
  const porcentajeOcupacion = totalAsientosSeccion
    ? Math.round((asientosReservados / totalAsientosSeccion) * 100)
    : 0
  const seccionActiva = eventQuery.data?.sections.find((section) => section.id === effectiveSelectedSectionId)

  const reservasDisponibles = Boolean(
    eventQuery.data?.reservasHabilitadas && !cierreVencido && eventQuery.data?.sections?.length,
  )

  const documentoPuedeReservar =
    !documentoNormalizado || documentValidationQuery.data?.canReserve === true

  const maxEntradasPorPersona = Math.max(eventQuery.data?.maxEntradasPorPersona ?? 1, 1)
  const reservasUsadas = documentValidationQuery.data?.used ?? 0
  const limiteDocumento = documentValidationQuery.data?.limit ?? maxEntradasPorPersona
  const cupoDisponibleDocumento = Math.max(limiteDocumento - reservasUsadas, 0)
  const maxSeleccionable = documentoNormalizado ? cupoDisponibleDocumento : maxEntradasPorPersona

  const toggleSeatSelection = (seat: PublicSeat) => {
    if (seat.reservado || !reservasDisponibles) {
      return
    }

    setSelectedSeatIds((current) => {
      if (current.includes(seat.id)) {
        return current.filter((seatId) => seatId !== seat.id)
      }

      if (current.length >= maxSeleccionable) {
        return current
      }

      return [...current, seat.id]
    })
  }

  return (
    <main className="app-fade-in min-h-screen text-slate-800">
      <section className="mx-auto max-w-6xl p-6 md:p-10">
        <header className="app-surface relative mb-8 overflow-hidden p-6 md:p-8">
          <div
            className="pointer-events-none absolute inset-0 opacity-70"
            aria-hidden
            style={{
              background:
                'linear-gradient(135deg, rgba(180,83,9,0.16) 0%, rgba(180,83,9,0.02) 55%, rgba(2,132,199,0.1) 100%)',
            }}
          />

          <div className="relative z-10 grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">Portal Publico</p>
              <h1 className="mt-3 text-3xl font-bold leading-tight md:text-5xl">
                {eventQuery.data?.nombreEvento || 'Reservas Teatro - Evento Escolar'}
              </h1>
              <p className="app-muted mt-3 max-w-2xl text-sm md:text-base">
                Elegi tu seccion, selecciona tu asiento y confirma en segundos. La disponibilidad se actualiza en
                tiempo real durante el proceso de reserva.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <StatusPill tone="amber">Evento Unico</StatusPill>
                <StatusPill tone="sky">Refetch 10-15s</StatusPill>
                <StatusPill>Limite {eventQuery.data?.maxEntradasPorPersona ?? 1} entradas</StatusPill>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                to="/backoffice/login"
                className="rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Ir a Backoffice
              </Link>
              <p className="text-right text-xs text-slate-600">Cierre de reservas: {fechaCierreTexto}</p>
            </div>
          </div>
        </header>

        <section className="mb-6 grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Seccion activa"
            value={seccionActiva?.nombre || '-'}
            description="Selecciona una seccion para ver disponibilidad detallada."
          />

          <MetricCard
            label="Disponibilidad"
            value={asientosDisponibles}
            description={
              <>
                de {totalAsientosSeccion} asientos ({asientosReservados} reservados)
              </>
            }
          />

          <MetricCard
            label="Estado reservas"
            value={reservasDisponibles ? 'Habilitadas' : cierreVencido ? 'Cerradas' : 'Pausadas'}
            description={
              reservasDisponibles
                ? 'Puedes confirmar una reserva ahora.'
                : 'No se pueden confirmar nuevas reservas en este momento.'
            }
          />
        </section>

        <section className="app-card mb-6 p-6">
          <h2 className="text-lg font-semibold md:text-xl">Identificacion</h2>
          <p className="mt-1 text-sm text-slate-600">Ingresa tus datos para continuar con la seleccion de asientos.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="nombreCompleto">
                Nombre completo
              </label>
              <input
                id="nombreCompleto"
                type="text"
                value={nombreCompleto}
                onChange={(e) => setNombreCompleto(e.target.value)}
                className="w-full border border-slate-300 bg-white px-3 py-2 shadow-sm focus:border-amber-600"
                placeholder="Ej: Ana Perez"
                autoComplete="name"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="documento">
                Documento
              </label>
              <input
                id="documento"
                type="text"
                value={documento}
                onChange={(e) => setDocumento(e.target.value)}
                className="w-full border border-slate-300 bg-white px-3 py-2 shadow-sm focus:border-amber-600"
                placeholder="Ej: 12345678"
                autoComplete="off"
              />
            </div>
          </div>

          {documentoNormalizado && documentValidationQuery.isLoading && (
            <p className="mt-3 text-sm text-slate-600" role="status" aria-live="polite">
              Validando documento...
            </p>
          )}

          {documentValidationQuery.error && (
            <p className="mt-3 text-sm text-red-600" role="alert">
              Error al validar documento: {(documentValidationQuery.error as Error).message}
            </p>
          )}

          {documentoNormalizado && documentValidationQuery.data && (
            <p
              className={`mt-3 text-sm ${
                documentValidationQuery.data.canReserve ? 'text-emerald-700' : 'text-amber-700'
              }`}
              role="status"
              aria-live="polite"
            >
              {documentValidationQuery.data.message}
            </p>
          )}
        </section>

        <section className="app-card mb-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold md:text-xl">Seleccion de Asientos</h2>

            {eventQuery.data?.sections?.length ? (
              <select
                className="border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-amber-600"
                value={effectiveSelectedSectionId}
                aria-label="Seleccionar seccion"
                onChange={(e) => {
                  setSelectedSectionId(e.target.value)
                  setSelectedSeatIds([])
                }}
              >
                {eventQuery.data.sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.nombre}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-slate-600">No hay secciones disponibles.</p>
            )}
          </div>

          <SeatLegend
            porcentajeOcupacion={porcentajeOcupacion}
            asientosReservados={asientosReservados}
            totalAsientosSeccion={totalAsientosSeccion}
          />

          {!eventQuery.isLoading && cierreVencido && (
            <p className="mt-3 text-sm text-amber-700">El periodo de reservas ya finalizo.</p>
          )}

          {!eventQuery.isLoading && eventQuery.data && !eventQuery.data.reservasHabilitadas && (
            <p className="mt-3 text-sm text-amber-700">Las reservas estan deshabilitadas por el administrador.</p>
          )}

          {seatsQuery.isLoading ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4" role="status" aria-live="polite">
              <p className="text-sm font-semibold text-slate-700">Cargando asientos...</p>
              <div className="mt-3 grid grid-cols-4 gap-2 md:grid-cols-8">
                {Array.from({ length: 16 }).map((_, index) => (
                  <div
                    key={`seat-skeleton-${index}`}
                    className="h-8 animate-pulse rounded-md bg-slate-200"
                    aria-hidden
                  />
                ))}
              </div>
            </div>
          ) : seatsQuery.error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4" role="alert">
              <p className="text-sm font-semibold text-red-700">No se pudieron cargar los asientos.</p>
              <p className="mt-1 text-sm text-red-600">Detalle: {(seatsQuery.error as Error).message}</p>
              <button
                type="button"
                onClick={() => seatsQuery.refetch()}
                className="mt-3 rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
              >
                Reintentar
              </button>
            </div>
          ) : seatsByRow.length === 0 ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4" role="status">
              <p className="text-sm font-semibold text-slate-700">No hay asientos en esta seccion.</p>
              <p className="mt-1 text-sm text-slate-600">
                Aun no se generaron filas y asientos. Solicita al administrador que configure esta seccion.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="rounded-md border border-slate-300 bg-slate-100 px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                Escenario
              </div>
              {seatsByRow.map(([fila, seats]) => (
                <div key={fila} className="flex flex-wrap items-center gap-2">
                  <span className="w-14 text-sm font-semibold text-slate-600">Fila {fila}</span>
                  <div className="flex flex-wrap gap-2">
                    {seats.map((seat) => {
                      const isSelected = selectedSeatIds.includes(seat.id)
                      const reachedLimit = !isSelected && selectedSeatIds.length >= maxSeleccionable
                      return (
                        <button
                          key={seat.id}
                          type="button"
                          disabled={seat.reservado || !reservasDisponibles || reachedLimit}
                          onClick={() => toggleSeatSelection(seat)}
                          aria-pressed={isSelected}
                          aria-label={`Asiento ${seat.codigoAsiento}${seat.reservado ? ', reservado' : isSelected ? ', seleccionado' : ', disponible'}`}
                          className={`rounded-md border px-3 py-1 text-sm font-semibold transition ${
                            seat.reservado
                              ? 'cursor-not-allowed border-slate-200 bg-slate-200 text-slate-500'
                              : isSelected
                                ? 'border-sky-700 bg-sky-700 text-white shadow'
                                : 'border-sky-300 bg-sky-50 text-sky-900 hover:border-sky-500 hover:bg-sky-100'
                          }`}
                        >
                          {seat.numero}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="mt-4 text-sm text-slate-600">
            Puedes seleccionar hasta <span className="font-semibold">{maxSeleccionable}</span> asientos en esta
            operacion.
          </p>
        </section>

        <section className="app-card p-6">
          <h2 className="text-lg font-semibold md:text-xl">Confirmacion</h2>

          <div className="mt-3 text-sm text-slate-600">
            <p>
              Asientos seleccionados:{' '}
              <span className="font-semibold">
                {selectedSeats.length ? selectedSeats.map((seat) => seat.codigoAsiento).join(', ') : 'Ninguno'}
              </span>
            </p>
          </div>

          {reserveMutation.error && (
            <p className="mt-3 text-sm text-red-600" role="alert">
              Error al reservar: {(reserveMutation.error as Error).message}
            </p>
          )}

          {mensajeExito && (
            <p className="mt-3 text-sm text-emerald-700" role="status" aria-live="polite">
              {mensajeExito}
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              setMensajeExito('')
              reserveMutation.mutate()
            }}
            className="mt-4 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
            disabled={
              reserveMutation.isPending ||
              !reservasDisponibles ||
              !documentoPuedeReservar ||
              selectedSeatIds.length > maxSeleccionable ||
              selectedSeatIds.length === 0 ||
              !nombreCompleto.trim() ||
              !documento.trim()
            }
          >
            {reserveMutation.isPending ? 'Confirmando...' : 'Confirmar reserva'}
          </button>
        </section>
      </section>
    </main>
  )
}
