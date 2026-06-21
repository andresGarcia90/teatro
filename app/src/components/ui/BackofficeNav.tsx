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
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-amber-400 hover:bg-amber-50"
        >
          {link.label}
        </Link>
      ))}
      <button
        type="button"
        onClick={onLogout}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
      >
        Cerrar sesion
      </button>
    </div>
  )
}
