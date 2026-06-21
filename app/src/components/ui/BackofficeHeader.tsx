import type { ReactNode } from 'react'

type BackofficeHeaderProps = {
  title: string
  description: string
  children?: ReactNode
}

export function BackofficeHeader({ title, description, children }: BackofficeHeaderProps) {
  return (
    <header className="app-surface relative mb-6 overflow-hidden p-6 md:p-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden
        style={{
          background:
            'linear-gradient(135deg, rgba(180,83,9,0.12) 0%, rgba(180,83,9,0.02) 55%, rgba(2,132,199,0.1) 100%)',
        }}
      />

      <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">Backoffice</p>
          <h1 className="mt-2 text-2xl font-bold md:text-4xl">{title}</h1>
          <p className="mt-3 text-sm text-slate-600 md:text-base">{description}</p>
        </div>
        {children ? <div className="flex items-center">{children}</div> : null}
      </div>
    </header>
  )
}
