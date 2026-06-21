type SeatLegendProps = {
  porcentajeOcupacion: number
  asientosReservados: number
  totalAsientosSeccion: number
}

export function SeatLegend({
  porcentajeOcupacion,
  asientosReservados,
  totalAsientosSeccion,
}: SeatLegendProps) {
  return (
    <div className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Mapa de la seccion</p>
        <p className="mt-1 text-sm text-slate-700">
          Ocupacion actual: <span className="font-semibold">{porcentajeOcupacion}%</span> ({asientosReservados}/
          {totalAsientosSeccion || 0})
        </p>
      </div>
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        <span className="inline-flex items-center gap-2 rounded-full border border-sky-300 bg-sky-50 px-3 py-1 text-sky-900">
          <span className="h-2.5 w-2.5 rounded-full bg-sky-300" aria-hidden /> Disponible
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-sky-700 bg-sky-700 px-3 py-1 text-white">
          <span className="h-2.5 w-2.5 rounded-full bg-white" aria-hidden /> Seleccionado
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-200 px-3 py-1 text-slate-700">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-400" aria-hidden /> Reservado
        </span>
      </div>
    </div>
  )
}
