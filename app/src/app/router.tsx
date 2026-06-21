import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicoWelcomePage } from '../features/publico/PublicoWelcomePage'
import { PublicoReservaPage } from '../features/publico/PublicoReservaPage'
import { BackofficeLoginPage } from '../features/backoffice/BackofficeLoginPage'
import { BackofficeConfiguracionPage } from '../features/backoffice/BackofficeConfiguracionPage'
import { BackofficeSeccionesPage } from '../features/backoffice/BackofficeSeccionesPage'
import { BackofficeAsientosPage } from '../features/backoffice/BackofficeAsientosPage'
import { BackofficeDashboardPage } from '../features/backoffice/BackofficeDashboardPage'

function NotFoundPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-800">
      <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-2xl font-bold">Pagina no encontrada</h1>
        <p className="mt-2 text-slate-600">Usa /publico o /backoffice/login.</p>
      </div>
    </main>
  )
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/publico" replace />,
  },
  {
    path: '/publico',
    element: <PublicoWelcomePage />,
  },
  {
    path: '/publico/reserva',
    element: <PublicoReservaPage />,
  },
  {
    path: '/backoffice/login',
    element: <BackofficeLoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/backoffice/configuracion',
        element: <BackofficeConfiguracionPage />,
      },
      {
        path: '/backoffice/secciones',
        element: <BackofficeSeccionesPage />,
      },
      {
        path: '/backoffice/asientos',
        element: <BackofficeAsientosPage />,
      },
      {
        path: '/backoffice/dashboard',
        element: <BackofficeDashboardPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])
