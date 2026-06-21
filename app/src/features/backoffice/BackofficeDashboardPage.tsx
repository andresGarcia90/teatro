import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getOccupancyData } from '../../lib/data/occupancy'
import { exportReservationsCsv } from '../../lib/data/export-csv'
import { useBackofficeAuthStore } from './auth-store'
import { BackofficeHeader } from '../../components/ui/BackofficeHeader'
import { BackofficeNav } from '../../components/ui/BackofficeNav'
import { MetricCard } from '../../components/ui/MetricCard'

export function BackofficeDashboardPage() {
  const navigate = useNavigate()
  const logout = useBackofficeAuthStore((state) => state.logout)
  const [exportMessage, setExportMessage] = useState('')

  const occupancyQuery = useQuery({
    queryKey: ['backoffice-dashboard-ocupacion'],
    queryFn: getOccupancyData,
    refetchInterval: 15_000,
  })

  const exportMutation = useMutation({
    mutationFn: exportReservationsCsv,
    onSuccess: ({ blob, fileName }) => {
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      setExportMessage('CSV exportado correctamente.')
    },
  })

  function handleLogout() {
    logout()
    navigate('/backoffice/login', { replace: true })
  }

  const porcentaje = occupancyQuery.data?.porcentajeOcupacion ?? 0

  return (
    <main className="app-fade-in min-h-screen text-slate-800">
      <section className="mx-auto max-w-4xl p-6 md:p-10">
        <BackofficeHeader
          title="Dashboard de Ocupacion"
          description="Vista general de ocupacion del evento activo con actualizacion periodica."
        />

        <section className="app-card mb-6 p-6">
          {occupancyQuery.isLoading ? (
            <p className="text-slate-600">Cargando metricas de ocupacion...</p>
          ) : occupancyQuery.error ? (
            <p className="text-red-600">
              Error al cargar ocupacion: {(occupancyQuery.error as Error).message}
            </p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <MetricCard label="Reservados" value={occupancyQuery.data?.reservados ?? 0} />
                <MetricCard label="Disponibles" value={occupancyQuery.data?.disponibles ?? 0} />
                <MetricCard label="Porcentaje de ocupacion" value={`${porcentaje}%`} />
              </div>

              <div className="mt-5">
                <p className="mb-2 text-sm text-slate-600">Progreso de ocupacion</p>
                <div className="h-4 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    role="progressbar"
                    aria-label="Porcentaje de ocupacion"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.min(Math.max(porcentaje, 0), 100)}
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${Math.min(Math.max(porcentaje, 0), 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Total de asientos: <span className="font-semibold">{occupancyQuery.data?.total ?? 0}</span>
                </p>
              </div>
            </>
          )}
        </section>

        <section className="app-card mb-6 p-6">
          <h2 className="text-lg font-semibold">Exportacion</h2>
          <p className="mt-2 text-sm text-slate-600">
            Descarga el listado de reservas en formato CSV para control y backup manual.
          </p>

          {exportMutation.error && (
            <p className="mt-3 text-sm text-red-600">
              Error al exportar: {(exportMutation.error as Error).message}
            </p>
          )}

          {exportMessage && <p className="mt-3 text-sm text-emerald-700">{exportMessage}</p>}

          <button
            type="button"
            onClick={() => {
              setExportMessage('')
              exportMutation.mutate()
            }}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
            disabled={exportMutation.isPending}
          >
            {exportMutation.isPending ? 'Exportando...' : 'Exportar CSV de reservas'}
          </button>
        </section>

        <BackofficeNav
          links={[
            { to: '/backoffice/configuracion', label: 'Ir a configuracion' },
            { to: '/backoffice/secciones', label: 'Ir a secciones' },
            { to: '/backoffice/asientos', label: 'Ir a generador de asientos' },
            { to: '/publico', label: 'Ir al portal publico' },
          ]}
          onLogout={handleLogout}
        />
      </section>
    </main>
  )
}
