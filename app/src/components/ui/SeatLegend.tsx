export function SeatLegend() {
  return (
    <div className="mt-4 grid gap-3 rounded-xl border border-border bg-secondary p-4 md:grid-cols-[1fr_auto] md:items-center">
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        <span className="inline-flex items-center gap-2 rounded-full border border-teal-400/55 bg-emerald-600/20 px-3 py-1 text-teal-100">
          <span className="h-2.5 w-2.5 rounded-full bg-teal-300" aria-hidden /> Disponible
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/75 bg-blue-600/45 px-3 py-1 text-sky-100">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-200" aria-hidden /> Seleccionado
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-red-400/65 bg-red-600/45 px-3 py-1 text-red-100">
          <span className="h-2.5 w-2.5 rounded-full bg-red-200" aria-hidden /> Reservado
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-400/55 bg-slate-600/35 px-3 py-1 text-slate-100">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" aria-hidden /> Bloqueado
        </span>
      </div>
    </div>
  )
}
