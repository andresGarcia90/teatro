import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPublicReservation,
  getPublicEventData,
  getPublicSeats,
  validatePublicDocument,
  type PublicSeat,
} from '../../lib/data/public-portal'
import { SeatLegend } from '../../components/ui/SeatLegend'
import { PublicoHeader } from '../../components/ui/PublicoHeader'
import { PublicoReservationModal } from '../../components/ui/PublicoReservationModal'

type SeatWithSection = PublicSeat & {
  sectionId: string
  sectionNombre: string
  sectionOrden: number
}

function buildNombreCompleto(nombre: string, apellido: string, nombreNino: string): string {
  return `${nombre.trim()} ${apellido.trim()} (Padre/Madre de ${nombreNino.trim()})`
    .replace(/\s+/g, ' ')
    .trim()
}

export function PublicoReservaPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([])
  const [currentTime, setCurrentTime] = useState(() => Date.now())

  const [formOpen, setFormOpen] = useState(false)
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [documento, setDocumento] = useState('')
  const [nombreNino, setNombreNino] = useState('')

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

  const sectionsKey = useMemo(
    () => eventQuery.data?.sections?.map((section) => section.id).join('|') || '',
    [eventQuery.data?.sections],
  )

  const seatsQuery = useQuery({
    queryKey: ['public-seats-all', eventQuery.data?.eventoId, sectionsKey],
    queryFn: async () => {
      const sections = eventQuery.data?.sections || []
      const seatsBySection = await Promise.all(
        sections.map(async (section) => {
          const seats = await getPublicSeats(eventQuery.data!.eventoId, section.id)
          return seats.map<SeatWithSection>((seat) => ({
            ...seat,
            sectionId: section.id,
            sectionNombre: section.nombre,
            sectionOrden: section.orden,
          }))
        }),
      )

      return seatsBySection.flat()
    },
    enabled: Boolean(eventQuery.data?.eventoId && sectionsKey),
    refetchInterval: 10_000,
  })

  const documentoNormalizado = documento.trim()

  const documentValidationQuery = useQuery({
    queryKey: ['public-document-validation', eventQuery.data?.eventoId, documentoNormalizado],
    queryFn: () => validatePublicDocument(eventQuery.data!.eventoId, documentoNormalizado),
    enabled: Boolean(eventQuery.data?.eventoId && documentoNormalizado),
    staleTime: 5_000,
  })

  const maxEntradasPorPersona = Math.max(eventQuery.data?.maxEntradasPorPersona ?? 1, 1)
  const reservasUsadas = documentValidationQuery.data?.used ?? 0
  const limiteDocumento = documentValidationQuery.data?.limit ?? maxEntradasPorPersona
  const cupoDisponibleDocumento = Math.max(limiteDocumento - reservasUsadas, 0)
  const excedeCupoDocumento =
    Boolean(documentoNormalizado) && selectedSeatIds.length > cupoDisponibleDocumento

  const reserveMutation = useMutation({
    mutationFn: async () => {
      const nombreCompleto = buildNombreCompleto(nombre, apellido, nombreNino)

      for (const seatId of selectedSeatIds) {
        await createPublicReservation(eventQuery.data!.eventoId, {
          nombreCompleto,
          nombre,
          apellido,
          nombreNino,
          documento,
          asientoId: seatId,
        })
      }
    },
    onSuccess: async () => {
      const seatCodes = [...selectedSeatCodes]
      const documentoActual = documento.trim()

      setSelectedSeatIds([])
      setFormOpen(false)
      setNombre('')
      setApellido('')
      setDocumento('')
      setNombreNino('')

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['public-seats-all', eventQuery.data?.eventoId] }),
        queryClient.invalidateQueries({
          queryKey: ['public-document-validation', eventQuery.data?.eventoId, documentoActual],
        }),
        queryClient.invalidateQueries({ queryKey: ['project-status'] }),
        queryClient.invalidateQueries({ queryKey: ['backoffice-dashboard-ocupacion'] }),
      ])

      navigate('/publico/reserva/confirmada', {
        state: {
          eventName: eventQuery.data?.nombreEvento,
          eventDate: eventQuery.data?.fechaEvento,
          eventTime: eventQuery.data?.horario,
          seatCodes,
          confirmedAt: new Date().toISOString(),
        },
      })
    },
  })

  const selectedSeats = useMemo(() => {
    if (!seatsQuery.data || selectedSeatIds.length === 0) {
      return []
    }

    const selectedSet = new Set(selectedSeatIds)
    return seatsQuery.data.filter((seat) => selectedSet.has(seat.id))
  }, [seatsQuery.data, selectedSeatIds])

  const selectedSeatCodes = selectedSeats.map((seat) => seat.codigoAsiento)

  const seatsBySection = useMemo(() => {
    const bySection = new Map<
      string,
      {
        sectionId: string
        sectionNombre: string
        sectionOrden: number
        rows: Array<[string, SeatWithSection[]]>
      }
    >()

    for (const seat of seatsQuery.data || []) {
      const existing = bySection.get(seat.sectionId)
      if (existing) {
        const row = existing.rows.find(([fila]) => fila === seat.fila)
        if (row) {
          row[1].push(seat)
        } else {
          existing.rows.push([seat.fila, [seat]])
        }
      } else {
        bySection.set(seat.sectionId, {
          sectionId: seat.sectionId,
          sectionNombre: seat.sectionNombre,
          sectionOrden: seat.sectionOrden,
          rows: [[seat.fila, [seat]]],
        })
      }
    }

    const sortedSections = Array.from(bySection.values()).sort(
      (a, b) => a.sectionOrden - b.sectionOrden || a.sectionNombre.localeCompare(b.sectionNombre),
    )

    return sortedSections.map((section) => ({
      ...section,
      rows: section.rows
        .map(([fila, seats]) => [
          fila,
          [...seats].sort((a, b) => a.numero - b.numero),
        ] as [string, SeatWithSection[]])
        .sort(([a], [b]) => a.localeCompare(b)),
    }))
  }, [seatsQuery.data])

  const cierreVencido = eventQuery.data?.fechaCierreReservas
    ? new Date(eventQuery.data.fechaCierreReservas).getTime() < currentTime
    : false

  const reservasDisponibles = Boolean(
    eventQuery.data?.reservasHabilitadas && !cierreVencido && eventQuery.data?.sections?.length,
  )

  const canOpenForm =
    reservasDisponibles && selectedSeatIds.length > 0 && selectedSeatIds.length <= maxEntradasPorPersona

  const canSubmitReservation =
    !reserveMutation.isPending &&
    reservasDisponibles &&
    selectedSeatIds.length > 0 &&
    Boolean(nombre.trim()) &&
    Boolean(apellido.trim()) &&
    Boolean(nombreNino.trim()) &&
    Boolean(documentoNormalizado) &&
    !documentValidationQuery.isLoading &&
    documentValidationQuery.data?.canReserve === true &&
    !excedeCupoDocumento

  const documentErrorMessage = documentValidationQuery.error
    ? (documentValidationQuery.error as Error).message
    : undefined

  const reserveErrorMessage = reserveMutation.error
    ? (reserveMutation.error as Error).message
    : undefined

  const toggleSeatSelection = (seat: PublicSeat) => {
    if (seat.reservado || !reservasDisponibles) {
      return
    }

    setSelectedSeatIds((current) => {
      if (current.includes(seat.id)) {
        return current.filter((seatId) => seatId !== seat.id)
      }

      if (current.length >= maxEntradasPorPersona) {
        return current
      }

      return [...current, seat.id]
    })
  }

  const triggerForm = () => {
    if (!canOpenForm) {
      return
    }

    setFormOpen(true)
  }

  return (
    <div className="min-h-screen text-foreground" style={{ backgroundColor: 'rgb(7, 17, 33)' }}>
      <PublicoHeader
        mode="reserva"
        eventName={eventQuery.data?.nombreEvento}
        eventDate={eventQuery.data?.fechaEvento}
        eventTime={eventQuery.data?.horario}
        selectedSeatsCount={selectedSeatIds.length}
      />

      <main className="app-fade-in pb-24 lg:pb-8">
        <section className="mx-auto grid max-w-6xl gap-6 p-4 md:p-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <section className="rounded-lg border border-border bg-card p-5 shadow-sm md:p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-card-foreground">Selección de asientos</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Puedes seleccionar hasta{' '}
                  <span className="font-semibold">{maxEntradasPorPersona}</span> asientos.
                </p>
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Vista unificada de secciones
              </p>
            </div>

            <SeatLegend />

            {!eventQuery.isLoading && cierreVencido && (
              <p className="mt-4 text-sm text-amber-700">El periodo de reservas ya finalizó.</p>
            )}

            {!eventQuery.isLoading && eventQuery.data && !eventQuery.data.reservasHabilitadas && (
              <p className="mt-4 text-sm text-amber-700">
                Las reservas están deshabilitadas por el administrador.
              </p>
            )}

            {seatsQuery.isLoading ? (
              <div className="mt-6 rounded-lg border border-border bg-secondary p-4" role="status" aria-live="polite">
                <p className="text-sm font-medium text-muted-foreground">Cargando asientos...</p>
                <div className="mt-3 grid grid-cols-4 gap-2 md:grid-cols-8">
                  {Array.from({ length: 16 }).map((_, index) => (
                    <div
                      key={`seat-skeleton-${index}`}
                      className="h-8 animate-pulse rounded-md bg-muted"
                      aria-hidden
                    />
                  ))}
                </div>
              </div>
            ) : seatsQuery.error ? (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4" role="alert">
                <p className="text-sm font-medium text-red-700">No se pudieron cargar los asientos.</p>
                <p className="mt-1 text-sm text-red-600">Detalle: {(seatsQuery.error as Error).message}</p>
                <button
                  type="button"
                  onClick={() => seatsQuery.refetch()}
                  className="mt-3 rounded-md border border-destructive bg-card px-3 py-1.5 text-sm font-medium text-destructive transition hover:bg-secondary"
                >
                  Reintentar
                </button>
              </div>
            ) : seatsBySection.length === 0 ? (
              <div className="mt-6 rounded-lg border border-border bg-secondary p-4" role="status">
                <p className="text-sm font-medium text-muted-foreground">No hay asientos en el mapa.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Aún no se generaron filas y asientos. Solicita al administrador que configure las secciones.
                </p>
              </div>
            ) : (
              <div className="seat-map-shell mt-6 space-y-4">
                <div className="seat-stage">Escenario</div>
                {seatsBySection.map((section) => (
                  <section key={section.sectionId} className="seat-section-block">
                    <div className="seat-section-title">{section.sectionNombre}</div>
                    {section.rows.map(([fila, seats]) => (
                      <div key={`${section.sectionId}-${fila}`} className="seat-row">
                        <span className="seat-row-label" aria-hidden>
                          {fila}
                        </span>
                        <div className="seat-grid">
                          {seats.map((seat) => {
                            const isSelected = selectedSeatIds.includes(seat.id)
                            const reachedLimit = !isSelected && selectedSeatIds.length >= maxEntradasPorPersona
                            const isBlocked = !seat.reservado && (reachedLimit || !reservasDisponibles)
                            const seatStateClass = seat.reservado
                              ? 'is-reserved'
                              : isSelected
                                ? 'is-selected'
                                : isBlocked
                                  ? 'is-blocked'
                                  : 'is-available'

                            return (
                              <button
                                key={seat.id}
                                type="button"
                                disabled={seat.reservado || isBlocked}
                                onClick={() => toggleSeatSelection(seat)}
                                aria-pressed={isSelected}
                                aria-label={`Asiento ${seat.codigoAsiento} en ${section.sectionNombre}${seat.reservado ? ', reservado' : isSelected ? ', seleccionado' : ', disponible'}`}
                                className={`seat-button ${seatStateClass}`}
                              >
                                {isSelected ? '✓' : ''}
                              </button>
                            )
                          })}
                        </div>
                        <span className="seat-row-label" aria-hidden>
                          {fila}
                        </span>
                      </div>
                    ))}
                  </section>
                ))}
              </div>
            )}
          </section>

          <aside className="hidden lg:block">
            <section className="sticky top-16 flex min-h-[calc(100vh-5rem)] flex-col rounded-lg border border-border/80 bg-[#102544] p-5 shadow-sm">
              <div>
                <h2 className="text-lg font-semibold text-card-foreground">Resumen de reserva</h2>

                <div className="mt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Asientos seleccionados
                  </p>
                  {selectedSeatCodes.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedSeatCodes.map((code) => (
                        <span
                          key={`desktop-seat-${code}`}
                          className="inline-flex items-center rounded-full border border-primary/50 bg-primary/20 px-2.5 py-1 text-xs font-semibold text-sky-100"
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-6 rounded-lg border border-border/70 bg-[#18345b] px-4 py-5 text-center">
                      <svg
                        className="mx-auto mb-3 h-6 w-6 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M3 8.5A2.5 2.5 0 015.5 6h13A2.5 2.5 0 0121 8.5V11a2 2 0 00-2 2 2 2 0 002 2v2.5a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 013 17.5V15a2 2 0 002-2 2 2 0 00-2-2V8.5z"
                        />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.5 9v6m7-6v6" />
                      </svg>
                      <p className="text-sm text-muted-foreground">
                        Haz clic en un asiento disponible para seleccionarlo
                      </p>
                    </div>
                  )}
                </div>

                {selectedSeatIds.length > maxEntradasPorPersona && (
                  <p className="mt-4 text-sm text-amber-700">
                    Superaste el máximo permitido por persona.
                  </p>
                )}

                {reserveMutation.error && (
                  <p className="mt-4 text-sm text-red-600" role="alert">
                    Error al reservar: {(reserveMutation.error as Error).message}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={triggerForm}
                className="mt-auto w-full rounded-xl px-4 py-3 text-sm font-semibold text-primary-foreground transition disabled:opacity-50"
                style={{ backgroundColor: 'rgb(37, 99, 235)', boxShadow: '0 10px 24px rgba(37, 99, 235, 0.36)' }}
                disabled={!canOpenForm}
              >
                Reservar asientos
              </button>
            </section>
          </aside>
        </section>
      </main>

      <section className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 px-4 py-3 backdrop-blur-sm lg:hidden">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Asientos seleccionados
            </p>
            <p className="truncate text-sm font-semibold text-card-foreground">
              {selectedSeatCodes.length > 0 ? selectedSeatCodes.join(', ') : 'Ninguno'}
            </p>
          </div>
          <button
            type="button"
            onClick={triggerForm}
            className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
            style={{ backgroundColor: 'rgb(37, 99, 235)' }}
            disabled={!canOpenForm}
          >
            Continuar
          </button>
        </div>
      </section>

      <PublicoReservationModal
        open={formOpen}
        selectedSeatCodes={selectedSeatCodes}
        formData={{ nombre, apellido, documento, nombreNino }}
        documentoNormalizado={documentoNormalizado}
        isDocumentLoading={documentValidationQuery.isLoading}
        documentValidationMessage={documentValidationQuery.data?.message}
        canReserveDocument={documentValidationQuery.data?.canReserve}
        documentErrorMessage={documentErrorMessage}
        excedeCupoDocumento={excedeCupoDocumento}
        cupoDisponibleDocumento={cupoDisponibleDocumento}
        selectedSeatsCount={selectedSeatIds.length}
        reserveErrorMessage={reserveErrorMessage}
        isSubmitting={reserveMutation.isPending}
        canSubmit={canSubmitReservation}
        onClose={() => setFormOpen(false)}
        onConfirm={() => {
          reserveMutation.mutate()
        }}
        onNombreChange={setNombre}
        onApellidoChange={setApellido}
        onDocumentoChange={setDocumento}
        onNombreNinoChange={setNombreNino}
      />
    </div>
  )
}
