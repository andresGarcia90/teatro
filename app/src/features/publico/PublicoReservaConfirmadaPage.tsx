import { Link, Navigate, useLocation } from 'react-router-dom'

type SuccessState = {
  eventName?: string
  eventDate?: string | null
  eventTime?: string | null
  seatCodes: string[]
  confirmedAt: string
}

function formatDate(value?: string | null): string {
  if (!value) {
    return 'Fecha por definir'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatTime(value?: string | null): string {
  if (!value) {
    return '--:--'
  }

  const match = /^(\d{2}:\d{2})/.exec(value)
  return match ? `${match[1]} hs` : value
}

export function PublicoReservaConfirmadaPage() {
  const location = useLocation()
  const state = location.state as SuccessState | null

  if (!state?.seatCodes?.length) {
    return <Navigate to="/publico/reserva" replace />
  }

  return (
    <div className="min-h-screen text-foreground" style={{ backgroundColor: 'rgb(7, 17, 33)' }}>
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center p-4 sm:p-8">
        <section className="w-full max-w-xl rounded-2xl border border-border/80 bg-[#13284a] p-6 shadow-[0_26px_70px_rgba(0,0,0,0.48)] sm:p-8">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border-2 border-emerald-400/90 bg-emerald-500/15 shadow-[0_0_28px_rgba(34,197,94,0.35)]">
            <svg className="h-10 w-10 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-center text-4xl font-extrabold tracking-[-0.02em] text-card-foreground">
            ¡Reserva confirmada!
          </h1>
          <p className="mx-auto mt-3 max-w-md text-center text-lg text-muted-foreground">
            Tu reserva se registró correctamente.
          </p>

          <div className="mt-7 rounded-xl border border-border/80 bg-[#102544] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Asientos</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {state.seatCodes.map((code) => (
                <span
                  key={`success-seat-${code}`}
                  className="inline-flex items-center rounded-full border border-primary/50 bg-primary/20 px-3 py-1 text-sm font-semibold text-sky-100"
                >
                  {code}
                </span>
              ))}
            </div>

            <div className="mt-5 border-t border-border/80 pt-4 text-sm">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-muted-foreground">Función</span>
                <span className="font-semibold text-card-foreground">{state.eventName || 'Evento'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-muted-foreground">Fecha</span>
                <span className="font-semibold text-card-foreground">{formatDate(state.eventDate)}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-muted-foreground">Hora</span>
                <span className="font-semibold text-card-foreground">{formatTime(state.eventTime)}</span>
              </div>
            </div>
          </div>

          <div className="mt-7 space-y-3">
            <Link
              to="/publico"
              className="flex h-12 w-full items-center justify-center rounded-xl text-base font-semibold text-primary-foreground"
              style={{ backgroundColor: 'rgb(37, 99, 235)' }}
            >
              Volver al inicio
            </Link>
            <Link
              to="/publico/reserva"
              className="flex h-12 w-full items-center justify-center rounded-xl border border-border/80 bg-[#102544] text-base font-semibold text-card-foreground transition hover:bg-[#15325a]"
            >
              Reservar otros asientos
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}
