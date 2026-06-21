import type { ReactNode } from 'react'

type StatusPillTone = 'amber' | 'sky' | 'slate'

type StatusPillProps = {
  tone?: StatusPillTone
  children: ReactNode
}

const toneClasses: Record<StatusPillTone, string> = {
  amber: 'border-accent bg-secondary text-accent',
  sky: 'border-primary bg-secondary text-primary',
  slate: 'border-border bg-card text-muted-foreground',
}

export function StatusPill({ tone = 'slate', children }: StatusPillProps) {
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${toneClasses[tone]}`}
    >
      {children}
    </span>
  )
}
