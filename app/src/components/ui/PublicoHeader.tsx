import { Link } from 'react-router-dom'

type PublicoHeaderProps = {
  mode?: 'default' | 'reserva'
  eventName?: string
  eventDate?: string | null
  eventTime?: string | null
  selectedSeatsCount?: number
}

function formatReservationDateTime(eventDate?: string | null, eventTime?: string | null): string {
  if (!eventDate) {
    return 'Fecha por definir'
  }

  const date = new Date(eventDate)
  if (Number.isNaN(date.getTime())) {
    return eventDate
  }

  const formattedDate = new Intl.DateTimeFormat('es-AR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)

  if (!eventTime) {
    return formattedDate
  }

  const timeMatch = /^(\d{2}:\d{2})/.exec(eventTime)
  const formattedTime = timeMatch ? `${timeMatch[1]} hrs` : eventTime

  return `${formattedDate} · ${formattedTime}`
}

export function PublicoHeader({
  mode = 'default',
  eventName,
  eventDate,
  eventTime,
  selectedSeatsCount = 0,
}: PublicoHeaderProps) {
  if (mode === 'reserva') {
    const subtitle = formatReservationDateTime(eventDate, eventTime)
    const seatsLabel = selectedSeatsCount === 1 ? 'seleccionado' : 'seleccionados'

    return (
      <header className="border-b border-border bg-card/90 text-card-foreground backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <Link
              to="/publico"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              aria-label="Volver"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>

            <div className="min-w-0">
              <h1 className="truncate text-[16px] font-semibold leading-tight text-card-foreground">
                {eventName || 'Reserva de entradas'}
              </h1>
              <p className="truncate text-[12px] text-muted-foreground">{subtitle}</p>
            </div>
          </div>

          <span
            className="inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-primary"
            style={{ backgroundColor: 'oklab(0.346175 -0.0177302 -0.0713718 / 0.4)' }}
          >
            <svg className="h-4 w-4" fill="none" stroke="rgb(37, 99, 235)" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M3 8.5A2.5 2.5 0 015.5 6h13A2.5 2.5 0 0121 8.5V11a2 2 0 00-2 2 2 2 0 002 2v2.5a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 013 17.5V15a2 2 0 002-2 2 2 0 00-2-2V8.5z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.5 9v6m7-6v6" />
            </svg>
            {selectedSeatsCount} {seatsLabel}
          </span>
        </div>
      </header>
    )
  }

  return (
    <header className="border-b border-border bg-card text-card-foreground">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        <Link
          to="/publico"
          className="group flex items-center gap-3 transition hover:opacity-80"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold text-sm shadow-sm">
            T
          </div>
          <span className="text-sm font-semibold text-card-foreground tracking-tight">
            Teatro Escolar
          </span>
        </Link>

        <Link
          to="/backoffice/login"
          className="flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          Panel Admin
        </Link>
      </div>
    </header>
  )
}
