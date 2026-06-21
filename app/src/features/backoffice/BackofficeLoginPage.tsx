import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useBackofficeAuthStore } from './auth-store'

export function BackofficeLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = useBackofficeAuthStore((state) => state.isAuthenticated)
  const login = useBackofficeAuthStore((state) => state.login)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  if (isAuthenticated) {
    return <Navigate to="/backoffice/configuracion" replace />
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const ok = login(username.trim(), password)
    if (!ok) {
      setError('Credenciales invalidas.')
      return
    }

    const redirectTo = typeof location.state?.from === 'string'
      ? location.state.from
      : '/backoffice/configuracion'

    navigate(redirectTo, { replace: true })
  }

  return (
    <main className="app-fade-in min-h-screen px-4 py-8 text-slate-800 md:py-10">
      <section className="app-surface mx-auto max-w-md p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-amber-700">Backoffice</p>
        <h1 className="mt-2 text-2xl font-bold">Iniciar sesion</h1>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="username">
              Usuario
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-slate-300 bg-white px-3 py-2 shadow-sm focus:border-amber-600"
              placeholder="admin"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 bg-white px-3 py-2 shadow-sm focus:border-amber-600"
              placeholder="admin123"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white transition hover:bg-slate-700"
          >
            Entrar
          </button>
        </form>

        <Link to="/publico" className="mt-4 inline-block text-sm text-sky-700 underline">
          Volver al portal publico
        </Link>
      </section>
    </main>
  )
}
