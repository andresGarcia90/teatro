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
    <div className="mt-4 grid gap-3 rounded-xl border border-border bg-secondary p-4 md:grid-cols-[1fr_auto] md:items-center">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Mapa de la seccion</p>
        <p className="mt-1 text-sm text-secondary-foreground">
          Ocupacion actual: <span className="font-semibold">{porcentajeOcupacion}%</span> ({asientosReservados}/
          {totalAsientosSeccion || 0})
        </p>
      </div>
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary bg-card px-3 py-1 text-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden /> Disponible
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-accent bg-accent px-3 py-1 text-accent-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-accent-foreground" aria-hidden /> Seleccionado
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground" aria-hidden /> Reservado
        </span>
      </div>
    </div>
  )
}
