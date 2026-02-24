'use client'

import { KeyboardEvent, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, GraduationCap, RefreshCw, Search, User, Users } from 'lucide-react'

interface WordPressUser {
  id: number
  username: string
  name: string
  email: string
  isSuspended?: boolean
}

interface TutorCourse {
  id: number
  title: { rendered: string }
}

interface BatchResultItem {
  course_id: number
  success: boolean
  message?: string
  code?: string
  status?: number
}

interface BatchEnrollResponse {
  success: boolean
  user_id: number
  summary: {
    requested: number
    enrolled: number
    already_enrolled: number
    failed: number
  }
  results: BatchResultItem[]
  action_required?: string
  orders_url?: string
  courses_requiring_order?: number[]
}

interface Props {
  userRole: string
  userPermissions: string[]
}

const USERS_PER_PAGE = 25

export default function WordPressUserCourseEnroll({ userRole, userPermissions }: Props) {
  const canEnroll =
    userRole === 'ADMIN' ||
    userPermissions.includes('wordpress:manage_users') ||
    userPermissions.includes('wordpress:manage_enrollments')

  const [users, setUsers] = useState<WordPressUser[]>([])
  const [courses, setCourses] = useState<TutorCourse[]>([])
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([])

  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BatchEnrollResponse | null>(null)
  const [searchStarted, setSearchStarted] = useState(false)

  const stripHtml = (value: string) => value.replace(/<[^>]+>/g, '').trim()

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) || null,
    [users, selectedUserId]
  )

  const loadUsers = async (targetPage: number, term: string) => {
    try {
      setLoadingUsers(true)
      setError(null)

      const params = new URLSearchParams({
        page: String(targetPage),
        per_page: String(USERS_PER_PAGE),
        search: term,
      })

      const res = await fetch(`/api/wordpress/enroll/users?${params.toString()}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al cargar usuarios')

      setUsers(data.users || [])
      setHasMore(Boolean(data.pagination?.has_more))
      setPage(targetPage)
    } catch (e: any) {
      setError(e.message || 'Error al cargar usuarios')
      setUsers([])
      setHasMore(false)
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleSearch = async () => {
    const normalized = searchInput.trim()
    if (normalized.length < 2) {
      setError('Escribe al menos 2 caracteres para buscar')
      return
    }

    setSearchTerm(normalized)
    setHasSearched(true)
    setSearchStarted(true)
    setSelectedUserId(null)
    setSelectedCourseIds([])
    setCourses([])
    setResult(null)

    await loadUsers(1, normalized)
  }

  const handleSearchKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      await handleSearch()
    }
  }

  const loadCoursesForSelectedUser = async () => {
    if (!selectedUserId) return

    try {
      setLoadingCourses(true)
      setError(null)
      setSelectedCourseIds([])

      const res = await fetch('/api/wordpress/courses?per_page=100&status=publish', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al cargar cursos')

      setCourses(data.courses || [])
    } catch (e: any) {
      setError(e.message || 'Error al cargar cursos')
      setCourses([])
    } finally {
      setLoadingCourses(false)
    }
  }

  useEffect(() => {
    if (!selectedUserId) {
      setCourses([])
      setSelectedCourseIds([])
      return
    }

    loadCoursesForSelectedUser()
  }, [selectedUserId])

  const toggleCourse = (courseId: number) => {
    setSelectedCourseIds((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    )
  }

  const toggleSelectAllCourses = () => {
    const visibleCourseIds = courses.map((c) => c.id)
    const allSelected = visibleCourseIds.every((id) => selectedCourseIds.includes(id))

    if (allSelected) {
      setSelectedCourseIds((prev) => prev.filter((id) => !visibleCourseIds.includes(id)))
      return
    }

    setSelectedCourseIds(Array.from(new Set([...selectedCourseIds, ...visibleCourseIds])))
  }

  const handleSubmit = async () => {
    if (!selectedUserId) {
      setError('Selecciona un usuario')
      return
    }

    if (!selectedCourseIds.length) {
      setError('Selecciona al menos un curso')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      setResult(null)

      const res = await fetch('/api/wordpress/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUserId,
          course_ids: selectedCourseIds,
        }),
      })
      const data = await res.json()
      if (!res.ok && res.status !== 207) {
        throw new Error(data.error || 'Error al enrolar cursos')
      }

      setResult(data)
      setSelectedCourseIds([])
    } catch (e: any) {
      setError(e.message || 'Error al enrolar cursos')
    } finally {
      setSubmitting(false)
    }
  }

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
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Enrolar un usuario en varios cursos</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Primero busca al usuario, selecciónalo y luego elige cursos.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={loadCoursesForSelectedUser}
              disabled={loadingCourses || submitting || !selectedUserId}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700"
            >
              <RefreshCw className={`h-4 w-4 ${loadingCourses ? 'animate-spin' : ''}`} />
              Recargar cursos
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedUserId || selectedCourseIds.length === 0 || submitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Enrolando...' : `Enrolar en ${selectedCourseIds.length} cursos`}
            </button>
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>

      {result && (
        <div
          className={`rounded-lg border p-4 ${
            result.summary.failed > 0
              ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20'
              : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
          }`}
        >
          <div className="flex items-center gap-2">
            {result.summary.failed > 0 ? (
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            )}
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Resultado: {result.summary.enrolled} enrolados, {result.summary.already_enrolled} ya enrolados, {result.summary.failed} fallidos
            </p>
          </div>

          {result.action_required === 'go_to_orders' && result.orders_url && (
            <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                Hay cursos que requieren acreditar pedido antes de enrolar.
              </p>
              <a
                href={result.orders_url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-xs font-medium text-blue-700 underline dark:text-blue-300"
              >
                Ir a pedidos del usuario
              </a>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white shadow dark:border-slate-700 dark:bg-slate-800">
          <div className="border-b border-gray-200 p-4 dark:border-slate-700">
            <div className="mb-2 flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">Buscar y seleccionar usuario</p>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Buscar por nombre o email..."
                className="w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-sm text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <button
              type="button"
              onClick={handleSearch}
              disabled={loadingUsers}
              className="mt-2 inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loadingUsers && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              {loadingUsers ? 'Buscando...' : 'Buscar usuario'}
            </button>
          </div>

          {!hasSearched ? (
            <div className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">
              Usa el buscador para encontrar al usuario.
            </div>
          ) : loadingUsers ? (
            <div className="p-4">
              <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">Buscando usuario...</p>
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="animate-pulse rounded-lg border border-gray-200 p-3 dark:border-slate-700">
                    <div className="mb-2 h-4 w-48 rounded bg-gray-200 dark:bg-slate-700" />
                    <div className="h-3 w-64 rounded bg-gray-200 dark:bg-slate-700" />
                  </div>
                ))}
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="p-10 text-center">
              <User className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Sin usuarios en esta búsqueda</p>
            </div>
          ) : (
            <ul className="max-h-[420px] divide-y divide-gray-100 overflow-y-auto dark:divide-slate-700">
              {users.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedUserId(user.id)}
                    className={`w-full px-4 py-3 text-left ${
                      selectedUserId === user.id
                        ? 'bg-blue-50 dark:bg-blue-900/30'
                        : 'hover:bg-gray-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{user.name || `Usuario #${user.id}`}</p>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center justify-between border-t border-gray-200 p-3 dark:border-slate-700">
            <button
              onClick={() => loadUsers(Math.max(1, page - 1), searchTerm)}
              disabled={page <= 1 || loadingUsers || !hasSearched || !searchStarted}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700"
            >
              Anterior
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400">Pagina {page}</span>
            <button
              onClick={() => loadUsers(page + 1, searchTerm)}
              disabled={!hasMore || loadingUsers || !hasSearched || !searchStarted}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700"
            >
              Siguiente
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-gray-500" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {selectedUser ? `Cursos disponibles (${courses.length})` : 'Cursos disponibles'}
              </p>
            </div>
            <button
              type="button"
              onClick={toggleSelectAllCourses}
              disabled={loadingCourses || !selectedUser || courses.length === 0}
              className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700"
            >
              Seleccionar todos
            </button>
          </div>

          {!selectedUser ? (
            <div className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">
              Selecciona un usuario para mostrar cursos.
            </div>
          ) : loadingCourses ? (
            <div className="p-4">
              <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">Cargando cursos del usuario...</p>
              <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div key={idx} className="flex animate-pulse items-center gap-3 rounded-lg border border-gray-200 p-3 dark:border-slate-700">
                    <div className="h-4 w-4 rounded bg-gray-200 dark:bg-slate-700" />
                    <div className="h-4 w-72 rounded bg-gray-200 dark:bg-slate-700" />
                  </div>
                ))}
              </div>
            </div>
          ) : courses.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">No hay cursos disponibles.</div>
          ) : (
            <ul className="max-h-[470px] divide-y divide-gray-100 overflow-y-auto dark:divide-slate-700">
              {courses.map((course) => (
                <li key={course.id} className="px-4 py-2.5">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedCourseIds.includes(course.id)}
                      onChange={() => toggleCourse(course.id)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {stripHtml(course.title?.rendered || `Curso #${course.id}`)}
                      </p>
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
