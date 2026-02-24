'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, GraduationCap, RefreshCw, Search, Users } from 'lucide-react'

interface WordPressUser {
  id: number
  username: string
  name: string
  email: string
  roles: string[]
  isSuspended?: boolean
}

interface TutorCourse {
  id: number
  title: { rendered: string }
}

interface BulkEnrollResponse {
  success: boolean
  course_id: number
  total: number
  successCount: number
  failedCount: number
  results: { user_id: number; success: boolean; error?: string }[]
}

interface Props {
  userRole: string
  userPermissions: string[]
}

const PER_PAGE = 25

export default function WordPressBulkEnrollV2({ userRole, userPermissions }: Props) {
  const canEnroll =
    userRole === 'ADMIN' ||
    userPermissions.includes('wordpress:manage_users') ||
    userPermissions.includes('wordpress:manage_enrollments')

  const [courses, setCourses] = useState<TutorCourse[]>([])
  const [users, setUsers] = useState<WordPressUser[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
  const [search, setSearch] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [totalFiltered, setTotalFiltered] = useState(0)
  const [totalGlobal, setTotalGlobal] = useState(0)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BulkEnrollResponse | null>(null)

  const stripHtml = (value: string) => value.replace(/<[^>]+>/g, '').trim()

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(search.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoadingCourses(true)
        const res = await fetch('/api/wordpress/courses?per_page=100&status=publish', { cache: 'no-store' })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Error al cargar cursos')
        setCourses(data.courses || [])
      } catch (e: any) {
        setError(e.message || 'Error al cargar cursos')
      } finally {
        setLoadingCourses(false)
      }
    }
    loadCourses()
  }, [])

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true)
        setError(null)
        const params = new URLSearchParams({
          page: String(page),
          per_page: String(PER_PAGE),
        })
        if (searchTerm) params.set('search', searchTerm)
        const res = await fetch(`/api/wordpress/enroll/users?${params.toString()}`, { cache: 'no-store' })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Error al cargar usuarios')
        setUsers(data.users || [])
        setHasMore(Boolean(data.pagination?.has_more))
        setTotalFiltered(Number(data.pagination?.total_filtered ?? data.pagination?.total ?? 0))
        setTotalGlobal(Number(data.pagination?.total_global ?? data.pagination?.total ?? 0))
        setSelectedUserIds([])
      } catch (e: any) {
        setError(e.message || 'Error al cargar usuarios')
        setUsers([])
      } finally {
        setLoadingUsers(false)
      }
    }
    loadUsers()
  }, [page, searchTerm])

  const selectableIds = useMemo(
    () => users.filter((u) => !u.isSuspended).map((u) => u.id),
    [users]
  )

  const toggleUser = (userId: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const toggleSelectVisible = () => {
    const allSelected =
      selectableIds.length > 0 && selectableIds.every((id) => selectedUserIds.includes(id))
    if (allSelected) {
      setSelectedUserIds((prev) => prev.filter((id) => !selectableIds.includes(id)))
      return
    }
    setSelectedUserIds((prev) => Array.from(new Set([...prev, ...selectableIds])))
  }

  const handleSubmit = async (): Promise<boolean> => {
    if (!selectedCourseId) {
      setError('Selecciona un curso')
      return false
    }
    if (!selectedUserIds.length) {
      setError('Selecciona al menos un usuario')
      return false
    }

    try {
      setSubmitting(true)
      setError(null)
      setResult(null)

      const res = await fetch('/api/wordpress/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          course_id: Number(selectedCourseId),
          user_ids: selectedUserIds,
        }),
      })
      const data = await res.json()
      if (!res.ok && res.status !== 207) {
        throw new Error(data.error || 'Error al enrolar')
      }
      setResult(data)
      setSelectedUserIds([])
      return true
    } catch (e: any) {
      setError(e.message || 'Error al enrolar')
      return false
    } finally {
      setSubmitting(false)
    }
  }

  const selectedCourseName = useMemo(() => {
    const selected = courses.find((course) => String(course.id) === selectedCourseId)
    return selected ? stripHtml(selected.title?.rendered || `Curso #${selected.id}`) : 'Sin curso'
  }, [courses, selectedCourseId])

  if (!canEnroll) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
        No tienes permisos para enrolar usuarios.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Curso</label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              disabled={loadingCourses || submitting}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
            >
              <option value="">Selecciona un curso...</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {stripHtml(course.title?.rendered || `Curso #${course.id}`)}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={submitting || !selectedCourseId || selectedUserIds.length === 0}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Enrolando...' : `Enrolar ${selectedUserIds.length} usuarios`}
          </button>
          <button
            onClick={() => setPage(1)}
            disabled={loadingUsers || submitting}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700"
          >
            <RefreshCw className={`h-4 w-4 ${loadingUsers ? 'animate-spin' : ''}`} />
            Recargar
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>

      {result && (
        <div
          className={`rounded-lg border p-4 ${
            result.failedCount > 0
              ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
              : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
          }`}
        >
          <div className="flex items-center gap-2">
            {result.failedCount > 0 ? (
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            )}
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Resultado: {result.successCount} exitosos, {result.failedCount} fallidos
            </p>
          </div>
          {result.failedCount > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-amber-700 dark:text-amber-300">
              {result.results
                .filter((r) => !r.success)
                .slice(0, 10)
                .map((r) => (
                  <li key={r.user_id}>
                    Usuario #{r.user_id}: {r.error || 'Error al enrolar'}
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white shadow dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-2 border-b border-gray-200 p-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">Usuarios ({totalGlobal})</p>
            {searchTerm ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Mostrando {users.length} de {totalFiltered} filtrados
              </p>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400">Mostrando {users.length} de {totalGlobal}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o email..."
                className="rounded-lg border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-sm text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <button
              onClick={toggleSelectVisible}
              className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700"
            >
              Seleccionar visibles
            </button>
          </div>
        </div>

        {loadingUsers ? (
          <div className="p-10 text-center">
            <div className="mb-2 inline-block h-7 w-7 animate-spin rounded-full border-b-2 border-blue-600" />
            <p className="text-sm text-gray-400">Cargando usuarios...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center">
            <GraduationCap className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No hay usuarios para mostrar</p>
          </div>
        ) : (
          <ul className="max-h-[500px] divide-y divide-gray-100 overflow-y-auto dark:divide-slate-700">
            {users.map((user) => (
              <li key={user.id} className="px-4 py-2.5">
                <label className={`flex items-center gap-3 ${user.isSuspended ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(user.id)}
                    onChange={() => toggleUser(user.id)}
                    disabled={!!user.isSuspended}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{user.name || `Usuario #${user.id}`}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                </label>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-between border-t border-gray-200 p-3 dark:border-slate-700">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || loadingUsers}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700"
          >
            Anterior
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400">Página {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore || loadingUsers}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700"
          >
            Siguiente
          </button>
        </div>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirmar enrolamiento</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Curso: <span className="font-medium">{selectedCourseName}</span>
            </p>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Usuarios seleccionados: <span className="font-medium">{selectedUserIds.length}</span>
            </p>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Esta acción va a enrolar a los usuarios seleccionados en el curso elegido.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={submitting}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  const ok = await handleSubmit()
                  if (ok) {
                    setConfirmOpen(false)
                  }
                }}
                disabled={submitting}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
