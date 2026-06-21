import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createBackofficeSection,
  deleteBackofficeSection,
  listBackofficeSections,
  updateBackofficeSection,
  type SectionItem,
} from '../../lib/data/sections'
import { useBackofficeAuthStore } from './auth-store'
import { BackofficeHeader } from '../../components/ui/BackofficeHeader'
import { BackofficeNav } from '../../components/ui/BackofficeNav'

export function BackofficeSeccionesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const logout = useBackofficeAuthStore((state) => state.logout)

  const [newNombre, setNewNombre] = useState('')
  const [newOrden, setNewOrden] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingNombre, setEditingNombre] = useState('')
  const [editingOrden, setEditingOrden] = useState(0)
  const [feedback, setFeedback] = useState('')

  const sectionsQuery = useQuery({
    queryKey: ['backoffice-secciones'],
    queryFn: listBackofficeSections,
  })

  const createMutation = useMutation({
    mutationFn: createBackofficeSection,
    onSuccess: async () => {
      setNewNombre('')
      setNewOrden(0)
      setFeedback('Seccion creada correctamente.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['backoffice-secciones'] }),
        queryClient.invalidateQueries({ queryKey: ['project-status'] }),
      ])
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, item }: { id: string; item: { nombre: string; orden: number } }) =>
      updateBackofficeSection(id, item),
    onSuccess: async () => {
      setEditingId(null)
      setFeedback('Seccion actualizada correctamente.')
      await queryClient.invalidateQueries({ queryKey: ['backoffice-secciones'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteBackofficeSection,
    onSuccess: async () => {
      setFeedback('Seccion eliminada correctamente.')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['backoffice-secciones'] }),
        queryClient.invalidateQueries({ queryKey: ['project-status'] }),
      ])
    },
  })

  const combinedError =
    createMutation.error || updateMutation.error || deleteMutation.error || null

  function handleLogout() {
    logout()
    navigate('/backoffice/login', { replace: true })
  }

  function startEdit(section: SectionItem) {
    setEditingId(section.id)
    setEditingNombre(section.nombre)
    setEditingOrden(section.orden)
    setFeedback('')
  }

  function cancelEdit() {
    setEditingId(null)
  }

  return (
    <main className="app-fade-in min-h-screen text-slate-800">
      <section className="mx-auto max-w-4xl p-6 md:p-10">
        <BackofficeHeader
          title="Gestion de Secciones"
          description="Crea, edita y elimina secciones del evento activo."
        />

        <section className="app-card mb-6 p-6">
          <h2 className="text-lg font-semibold">Nueva seccion</h2>
          <form
            className="mt-4 grid gap-3 md:grid-cols-[1fr_160px_auto]"
            onSubmit={(event) => {
              event.preventDefault()
              setFeedback('')
              createMutation.mutate({
                nombre: newNombre.trim(),
                orden: Number(newOrden),
              })
            }}
          >
            <input
              type="text"
              value={newNombre}
              onChange={(e) => setNewNombre(e.target.value)}
              placeholder="Nombre de la seccion"
              className="border border-slate-300 bg-white px-3 py-2 shadow-sm focus:border-amber-600"
              required
            />
            <input
              type="number"
              min={0}
              value={newOrden}
              onChange={(e) => setNewOrden(Number(e.target.value || 0))}
              className="border border-slate-300 bg-white px-3 py-2 shadow-sm focus:border-amber-600"
              required
            />
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Creando...' : 'Crear'}
            </button>
          </form>
        </section>

        <section className="app-card mb-6 p-6">
          <h2 className="text-lg font-semibold">Secciones existentes</h2>

          {sectionsQuery.isLoading ? (
            <p className="mt-3 text-slate-600">Cargando secciones...</p>
          ) : sectionsQuery.error ? (
            <p className="mt-3 text-red-600">
              Error al cargar secciones: {(sectionsQuery.error as Error).message}
            </p>
          ) : sectionsQuery.data && sectionsQuery.data.length > 0 ? (
            <div className="mt-4 space-y-3">
              {sectionsQuery.data.map((section) => {
                const isEditing = editingId === section.id

                return (
                  <article
                    key={section.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    {isEditing ? (
                      <form
                        className="grid gap-3 md:grid-cols-[1fr_120px_auto_auto]"
                        onSubmit={(event) => {
                          event.preventDefault()
                          setFeedback('')
                          updateMutation.mutate({
                            id: section.id,
                            item: {
                              nombre: editingNombre.trim(),
                              orden: Number(editingOrden),
                            },
                          })
                        }}
                      >
                        <input
                          type="text"
                          value={editingNombre}
                          onChange={(e) => setEditingNombre(e.target.value)}
                          className="border border-slate-300 bg-white px-3 py-2 shadow-sm focus:border-amber-600"
                          required
                        />
                        <input
                          type="number"
                          min={0}
                          value={editingOrden}
                          onChange={(e) => setEditingOrden(Number(e.target.value || 0))}
                          className="border border-slate-300 bg-white px-3 py-2 shadow-sm focus:border-amber-600"
                          required
                        />
                        <button
                          type="submit"
                          className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
                          disabled={updateMutation.isPending}
                        >
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold transition hover:border-amber-400 hover:bg-amber-50"
                        >
                          Cancelar
                        </button>
                      </form>
                    ) : (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{section.nombre}</p>
                          <p className="text-sm text-slate-600">Orden: {section.orden}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(section)}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold transition hover:border-amber-400 hover:bg-amber-50"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFeedback('')
                              deleteMutation.mutate(section.id)
                            }}
                            className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-60"
                            disabled={deleteMutation.isPending}
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          ) : (
            <p className="mt-3 text-slate-600">Aun no hay secciones creadas.</p>
          )}

          {combinedError && (
            <p className="mt-4 text-sm text-red-600">Error: {(combinedError as Error).message}</p>
          )}

          {feedback && <p className="mt-4 text-sm text-emerald-700">{feedback}</p>}
        </section>

        <BackofficeNav
          links={[
            { to: '/backoffice/dashboard', label: 'Ir a dashboard' },
            { to: '/backoffice/asientos', label: 'Ir a generador de asientos' },
            { to: '/backoffice/configuracion', label: 'Ir a configuracion' },
            { to: '/publico', label: 'Ir al portal publico' },
          ]}
          onLogout={handleLogout}
        />
      </section>
    </main>
  )
}
