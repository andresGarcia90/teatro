import { Link } from 'react-router-dom'

export function PublicoHeader() {
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
