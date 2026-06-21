import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPublicEventData } from '../../lib/data/public-portal'
import { PublicoHeader } from '../../components/ui/PublicoHeader'

function capitalize(value: string): string {
  if (!value) {
    return value
  }

  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatHorario(value?: string | null): string {
  if (!value) {
    return 'Horario por definir'
  }

  const match = /^(\d{2}):(\d{2})/.exec(value)
  if (!match) {
    return value
  }

  return `${match[1]}:${match[2]} hs`
}

export function PublicoWelcomePage() {
  const eventQuery = useQuery({
    queryKey: ['public-event-data'],
    queryFn: getPublicEventData,
    refetchInterval: 15_000,
  })

  const event = eventQuery.data
  
  const fechaFormato = event?.fechaEvento
    ? capitalize(
        new Intl.DateTimeFormat('es-AR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(event.fechaEvento)),
      )
    : 'Fecha por definir'

  const direccion = event?.direccion;

  const horarioFormato = formatHorario(event?.horario)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(120%_85%_at_50%_-10%,rgba(174,38,97,0.45),transparent_55%),linear-gradient(180deg,#1d1030_0%,#0b1327_56%,#081325_100%)]" />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(255,50,120,0.05)_0px,rgba(255,50,120,0.05)_40px,rgba(8,19,37,0.04)_40px,rgba(8,19,37,0.04)_90px)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,12,24,0.85)_0%,rgba(5,12,24,0.62)_42%,rgba(5,12,24,0.75)_100%)]" />

        <div className="relative z-10">
          <PublicoHeader />

          <main className="mx-auto max-w-6xl px-6 pb-16 pt-10 md:pt-20">
            <div className="max-w-3xl">
              <div className="mb-8 inline-flex">
                <span className="flex items-center gap-2 rounded-full border border-accent/60 bg-accent/12 px-4 py-2 text-sm font-bold tracking-wide text-accent">
                  <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_12px_rgba(34,197,94,0.95)]" />
                  ENTRADAS DISPONIBLES
                </span>
              </div>

              <h1 className="text-5xl font-extrabold leading-[1.02] tracking-[-0.02em] text-foreground md:text-7xl">
                {event?.nombreEvento || 'Cargando evento...'}
              </h1>

              {event?.descripcion && (
                <p className="mt-6 max-w-2xl text-2xl leading-relaxed text-slate-200/95">
                  {event.descripcion}
                </p>
              )}

              <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 text-sky-200/95">
                <span className="inline-flex items-center gap-2 text-[14px]">
                  <svg className="h-5 w-5 text-[rgb(37,99,235)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10m-12 9h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v11a2 2 0 002 2z" />
                  </svg>
                  {fechaFormato}
                </span>
                <span className="inline-flex items-center gap-2 text-[14px]">
                  <svg className="h-5 w-5 text-[rgb(37,99,235)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {horarioFormato}
                </span>
                <span className="inline-flex items-center gap-2 text-[14px]">
                  <svg className="h-5 w-5 text-[rgb(37,99,235)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 21c-4-4-6-7.582-6-10a6 6 0 1112 0c0 2.418-2 6-6 10z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 11a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                  {direccion}
                </span>
              </div>

              <div className="mt-12">
                <Link
                  to="/publico/reserva"
                  className="inline-flex h-14 min-w-[260px] items-center justify-center gap-3 rounded-[16px] bg-[#2563EB] px-8 text-[16px] font-semibold text-white shadow-[0_10px_28px_rgba(37,99,235,0.55)]"
                >
                  Seleccionar Asientos
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
              
            </div>
          </main>
        </div>
      </section>

      {/* Loading state */}
      {eventQuery.isLoading && (
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="rounded-lg border border-border bg-secondary p-6">
            <p className="text-sm text-muted-foreground">Cargando información del evento...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {eventQuery.error && (
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <p className="text-sm text-red-700">
              No se pudo cargar el evento: {(eventQuery.error as Error).message}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
