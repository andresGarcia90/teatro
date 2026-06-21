import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useBackofficeAuthStore } from '../features/backoffice/auth-store'

export function ProtectedRoute() {
  const isAuthenticated = useBackofficeAuthStore((state) => state.isAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/backoffice/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
