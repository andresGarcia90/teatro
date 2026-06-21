import type { ReactNode } from 'react'

type StatusPillTone = 'amber' | 'sky' | 'slate'

type StatusPillProps = {
  tone?: StatusPillTone
  children: ReactNode
}

const toneClasses: Record<StatusPillTone, string> = {
  amber: 'border-amber-200 bg-amber-50 text-amber-800',
  sky: 'border-sky-200 bg-sky-50 text-sky-800',
  slate: 'border-slate-200 bg-white text-slate-700',
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
