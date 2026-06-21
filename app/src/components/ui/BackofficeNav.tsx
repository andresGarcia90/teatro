import { Link } from 'react-router-dom'

type BackofficeNavLink = {
  to: string
  label: string
}

type BackofficeNavProps = {
  links: BackofficeNavLink[]
  onLogout: () => void
}

export function BackofficeNav({ links, onLogout }: BackofficeNavProps) {
  return (
    <div className="app-surface flex flex-wrap gap-3 p-4">
      {links.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold text-card-foreground transition hover:border-primary hover:bg-secondary"
        >
          {link.label}
        </Link>
      ))}
      <button
        type="button"
        onClick={onLogout}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-accent hover:text-accent-foreground"
      >
        Cerrar sesion
      </button>
    </div>
  )
}
