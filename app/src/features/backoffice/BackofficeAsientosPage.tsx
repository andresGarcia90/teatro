import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listBackofficeSections } from '../../lib/data/sections'
import { generateSeatsForSection, getSeatSummary } from '../../lib/data/seat-generator'
import { useBackofficeAuthStore } from './auth-store'
import { BackofficeHeader } from '../../components/ui/BackofficeHeader'
import { BackofficeNav } from '../../components/ui/BackofficeNav'

export function BackofficeAsientosPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const logout = useBackofficeAuthStore((state) => state.logout)

  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [filaInicio, setFilaInicio] = useState('A')
  const [cantidadFilas, setCantidadFilas] = useState(5)
  const [asientosPorFila, setAsientosPorFila] = useState(10)
  const [sobrescribir, setSobrescribir] = useState(true)
  const [feedback, setFeedback] = useState('')

  const sectionsQuery = useQuery({
    queryKey: ['backoffice-secciones'],
    queryFn: listBackofficeSections,
  })

  useEffect(() => {
    if (!selectedSectionId && sectionsQuery.data && sectionsQuery.data.length > 0) {
      setSelectedSectionId(sectionsQuery.data[0].id)
    }
  }, [sectionsQuery.data, selectedSectionId])

  const summaryQuery = useQuery({
    queryKey: ['backoffice-asientos-resumen', selectedSectionId],
    queryFn: () => getSeatSummary(selectedSectionId),
    enabled: Boolean(selectedSectionId),
  })

  const generateMutation = useMutation({
    mutationFn: generateSeatsForSection,
    onSuccess: async () => {
      setFeedback('Asientos generados correctamente.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['backoffice-asientos-resumen', selectedSectionId] }),
        queryClient.invalidateQueries({ queryKey: ['project-status'] }),
      ])
    },
  })

  const selectedSectionName = useMemo(() => {
    if (!sectionsQuery.data || !selectedSectionId) {
      return ''
    }

    return sectionsQuery.data.find((item) => item.id === selectedSectionId)?.nombre || ''
  }, [sectionsQuery.data, selectedSectionId])

  function handleLogout() {
    logout()
    navigate('/backoffice/login', { replace: true })
  }

  return (
    <main className="app-fade-in min-h-screen text-slate-800">
      <section className="mx-auto max-w-4xl p-6 md:p-10">
        <BackofficeHeader
          title="Generador de Asientos"
          description="Genera asientos por seccion usando filas y cantidad por fila."
        />

        <section className="app-card mb-6 p-6">
          <h2 className="text-lg font-semibold">Configuracion de generacion</h2>

          {sectionsQuery.isLoading ? (
            <p className="mt-3 text-slate-600">Cargando secciones...</p>
          ) : sectionsQuery.error ? (
            <p className="mt-3 text-red-600">
              Error al cargar secciones: {(sectionsQuery.error as Error).message}
            </p>
          ) : sectionsQuery.data && sectionsQuery.data.length > 0 ? (
            <form
              className="mt-4 space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                setFeedback('')
                generateMutation.mutate({
                  seccionId: selectedSectionId,
                  filaInicio,
                  cantidadFilas: Number(cantidadFilas),
                  asientosPorFila: Number(asientosPorFila),
                  sobrescribir,
                })
              }}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="seccion">
                    Seccion
                  </label>
                  <select
                    id="seccion"
                    className="w-full border border-slate-300 bg-white px-3 py-2 shadow-sm focus:border-amber-600"
                    value={selectedSectionId}
                    onChange={(e) => setSelectedSectionId(e.target.value)}
                  >
                    {sectionsQuery.data.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.nombre} (orden {section.orden})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="filaInicio">
                    Fila inicial
                  </label>
                  <input
                    id="filaInicio"
                    type="text"
                    maxLength={1}
                    className="w-full border border-slate-300 bg-white px-3 py-2 uppercase shadow-sm focus:border-amber-600"
                    value={filaInicio}
                    onChange={(e) => setFilaInicio(e.target.value.toUpperCase())}
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="cantidadFilas">
                    Cantidad de filas
                  </label>
                  <input
                    id="cantidadFilas"
                    type="number"
                    min={1}
                    max={26}
                    className="w-full border border-slate-300 bg-white px-3 py-2 shadow-sm focus:border-amber-600"
                    value={cantidadFilas}
                    onChange={(e) => setCantidadFilas(Number(e.target.value || 1))}
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium" htmlFor="asientosPorFila">
                    Asientos por fila
                  </label>
                  <input
                    id="asientosPorFila"
                    type="number"
                    min={1}
                    className="w-full border border-slate-300 bg-white px-3 py-2 shadow-sm focus:border-amber-600"
                    value={asientosPorFila}
                    onChange={(e) => setAsientosPorFila(Number(e.target.value || 1))}
                    required
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={sobrescribir}
                  onChange={(e) => setSobrescribir(e.target.checked)}
                />
                Sobrescribir asientos existentes de la seccion
              </label>

              {summaryQuery.data && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <p>
                    Seccion seleccionada: <span className="font-semibold">{selectedSectionName}</span>
                  </p>
                  <p>Asientos actuales: {summaryQuery.data.totalAsientos}</p>
                  <p>Filas actuales: {summaryQuery.data.filas}</p>
                </div>
              )}

              {summaryQuery.error && (
                <p className="text-sm text-red-600">
                  Error al cargar resumen: {(summaryQuery.error as Error).message}
                </p>
              )}

              {generateMutation.error && (
                <p className="text-sm text-red-600">
                  Error al generar: {(generateMutation.error as Error).message}
                </p>
              )}

              {feedback && <p className="text-sm text-emerald-700">{feedback}</p>}

              <button
                type="submit"
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? 'Generando...' : 'Generar asientos'}
              </button>
            </form>
          ) : (
            <p className="mt-3 text-slate-600">
              No hay secciones disponibles. Crea una seccion primero en Gestion de Secciones.
            </p>
          )}
        </section>

        <BackofficeNav
          links={[
            { to: '/backoffice/dashboard', label: 'Ir a dashboard' },
            { to: '/backoffice/secciones', label: 'Ir a secciones' },
            { to: '/backoffice/configuracion', label: 'Ir a configuracion' },
            { to: '/publico', label: 'Ir al portal publico' },
          ]}
          onLogout={handleLogout}
        />
      </section>
    </main>
  )
}
