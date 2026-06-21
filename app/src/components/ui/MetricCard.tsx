import type { ReactNode } from 'react'

type MetricCardProps = {
  label: string
  value: ReactNode
  description?: ReactNode
}

export function MetricCard({ label, value, description }: MetricCardProps) {
  return (
    <article className="app-card p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
    </article>
  )
}
