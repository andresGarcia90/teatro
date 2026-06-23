type ReservationFormData = {
  nombre: string
  apellido: string
  documento: string
  nombreNino: string
}

type PublicoReservationModalProps = {
  open: boolean
  selectedSeatCodes: string[]
  formData: ReservationFormData
  documentoNormalizado: string
  isDocumentLoading: boolean
  documentValidationMessage?: string
  canReserveDocument?: boolean
  documentErrorMessage?: string
  excedeCupoDocumento: boolean
  cupoDisponibleDocumento: number
  selectedSeatsCount: number
  reserveErrorMessage?: string
  isSubmitting: boolean
  canSubmit: boolean
  onClose: () => void
  onConfirm: () => void
  onNombreChange: (value: string) => void
  onApellidoChange: (value: string) => void
  onDocumentoChange: (value: string) => void
  onNombreNinoChange: (value: string) => void
}

export function PublicoReservationModal({
  open,
  selectedSeatCodes,
  formData,
  documentoNormalizado,
  isDocumentLoading,
  documentValidationMessage,
  canReserveDocument,
  documentErrorMessage,
  excedeCupoDocumento,
  cupoDisponibleDocumento,
  selectedSeatsCount,
  reserveErrorMessage,
  isSubmitting,
  canSubmit,
  onClose,
  onConfirm,
  onNombreChange,
  onApellidoChange,
  onDocumentoChange,
  onNombreNinoChange,
}: PublicoReservationModalProps) {
  if (!open) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6"
      style={{ backgroundColor: 'rgb(7, 17, 33)' }}
    >
      <div className="w-full max-w-xl rounded-xl border border-slate-300/20 bg-[#13284a] shadow-[0_28px_90px_rgba(0,0,0,0.68)]">
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold text-card-foreground">Confirmar reserva</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Completa tus datos para finalizar la reserva.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            aria-label="Cerrar"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div className="rounded-lg border border-border bg-secondary p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Asientos seleccionados
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedSeatCodes.map((code) => (
                <span
                  key={`modal-seat-${code}`}
                  className="inline-flex items-center rounded-full border border-primary/55 bg-primary/20 px-2.5 py-1 text-xs font-semibold text-sky-100"
                >
                  {code}
                </span>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground" htmlFor="nombre">
                Nombre
              </label>
              <input
                id="nombre"
                type="text"
                value={formData.nombre}
                onChange={(event) => onNombreChange(event.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Ej: Maria"
                autoComplete="given-name"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground" htmlFor="apellido">
                Apellido
              </label>
              <input
                id="apellido"
                type="text"
                value={formData.apellido}
                onChange={(event) => onApellidoChange(event.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Ej: Garcia"
                autoComplete="family-name"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground" htmlFor="documento">
                Documento
              </label>
              <input
                id="documento"
                type="text"
                value={formData.documento}
                onChange={(event) => {
                  const value = event.target.value
                  // Solo permite números y máximo 9 caracteres
                  if (/^\d*$/.test(value) && value.length <= 9) {
                    onDocumentoChange(value)
                  }
                }}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Ej: 12345678"
                autoComplete="off"
                inputMode="numeric"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground" htmlFor="nombreNino">
                ¿Padre/Madre de qué niño?
              </label>
              <input
                id="nombreNino"
                type="text"
                value={formData.nombreNino}
                onChange={(event) => onNombreNinoChange(event.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Ej: Juan Perez"
                autoComplete="off"
              />
            </div>
          </div>

          {documentoNormalizado && isDocumentLoading && (
            <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
              Validando documento...
            </p>
          )}

          {documentErrorMessage && (
            <p className="text-sm text-red-600" role="alert">
              Error al validar documento: {documentErrorMessage}
            </p>
          )}

          {documentValidationMessage && (
            <p
              className={`text-sm font-medium ${
                canReserveDocument ? 'text-emerald-300' : 'text-amber-300'
              }`}
              role="status"
              aria-live="polite"
            >
              {documentValidationMessage}
            </p>
          )}

          {excedeCupoDocumento && (
            <p className="text-sm font-medium text-amber-300" role="status" aria-live="polite">
              Con este documento puedes reservar {cupoDisponibleDocumento} asientos más y ahora tienes {selectedSeatsCount} seleccionados.
            </p>
          )}

          {reserveErrorMessage && (
            <p className="text-sm text-red-600" role="alert">
              Error al reservar: {reserveErrorMessage}
            </p>
          )}

          <button
            type="button"
            onClick={onConfirm}
            className="w-full rounded-lg px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
            style={{ backgroundColor: 'rgb(37, 99, 235)' }}
            disabled={!canSubmit}
          >
            {isSubmitting ? 'Confirmando...' : 'Confirmar reserva'}
          </button>
        </div>
      </div>
    </div>
  )
}
