'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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
  status: string
}

interface BulkEnrollResponse {
  success: boolean
  course_id: number
  total: number
  successCount: number
  failedCount: number
  results: { user_id: number; success: boolean; error?: string }[]
}

interface WordPressBulkEnrollClientProps {
  userRole: string
  userPermissions: string[]
}

const USERS_PER_PAGE = 20

export default function WordPressBulkEnrollClient({
  userRole,
  userPermissions,
}: WordPressBulkEnrollClientProps) {
  const canEnroll =
    userRole === 'ADMIN' ||
    userPermissions.includes('wordpress:manage_users') ||
    userPermissions.includes('wordpress:manage_enrollments')

  const [courses, setCourses] = useState<TutorCourse[]>([])
  const [users, setUsers] = useState<WordPressUser[]>([])
  const [search, setSearch] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BulkEnrollResponse | null>(null)

  const stripHtml = (value: string) => value.replace(/<[^>]+>/g, '').trim()

  const fetchCourses = useCallback(async () => {
    try {
      setLoadingCourses(true)
      const res = await fetch('/api/wordpress/courses?per_page=100&status=publish')
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error al cargar cursos')
      }
      setCourses(data.courses || [])
    } catch (e: any) {
      setError(e.message || 'Error al cargar cursos')
    } finally {
      setLoadingCourses(false)
    }
  }, [])

  const fetchUsers = useCallback(
    async (targetPage: number, append: boolean) => {
      try {
        if (append) {
          setLoadingMore(true)
        } else {
          setLoadingUsers(true)
          setError(null)
        }

        const params = new URLSearchParams({
          page: String(targetPage),
          per_page: String(USERS_PER_PAGE),
        })

        if (searchTerm.trim()) {
          params.set('search', searchTerm.trim())
        }

        const res = await fetch(`/api/wordpress/users?${params.toString()}`)
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'Error al cargar usuarios')
        }

        const batch: WordPressUser[] = data.users || []
        setUsers((prev) => (append ? [...prev, ...batch] : batch))
        setHasMore(batch.length === USERS_PER_PAGE)
        setPage(targetPage)
      } catch (e: any) {
        setError(e.message || 'Error al cargar usuarios')
        if (!append) {
          setUsers([])
          setHasMore(false)
        }
      } finally {
        setLoadingUsers(false)
        setLoadingMore(false)
      }
    },
    [searchTerm]
  )

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(search.trim())
    }, 350)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setSelectedUserIds([])
    fetchUsers(1, false)
  }, [searchTerm, fetchUsers])

  const toggleUser = (userId: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const selectableUserIds = useMemo(
    () => users.filter((u) => !u.isSuspended).map((u) => u.id),
    [users]
  )

  const toggleSelectAllCurrent = () => {
    const allSelected =
      selectableUserIds.length > 0 &&
      selectableUserIds.every((id) => selectedUserIds.includes(id))

    if (allSelected) {
      setSelectedUserIds((prev) => prev.filter((id) => !selectableUserIds.includes(id)))
      return
    }

    setSelectedUserIds((prev) => Array.from(new Set([...prev, ...selectableUserIds])))
  }

  const clearSelection = () => setSelectedUserIds([])

  const handleBulkEnroll = async () => {
    if (!selectedCourseId) {
      setError('Selecciona un curso')
      return
    }
    if (selectedUserIds.length === 0) {
      setError('Selecciona al menos un usuario')
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
          course_id: Number(selectedCourseId),
          user_ids: selectedUserIds,
        }),
      })

      const data = await res.json()
      if (!res.ok && res.status !== 207) {
        throw new Error(data.error || 'Error en matrícula masiva')
      }

      setResult(data)
      setSelectedUserIds([])
    } catch (e: any) {
      setError(e.message || 'Error en matrícula masiva')
    } finally {
      setSubmitting(false)
    }
  }

  if (!canEnroll) {
    return (
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <p className="text-sm text-amber-700 dark:text-amber-300">
          No tienes permisos para matricular usuarios.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-gray-200 dark:border-slate-700 p-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Curso
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              disabled={loadingCourses || submitting}
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
            onClick={handleBulkEnroll}
            disabled={submitting || !selectedCourseId || selectedUserIds.length === 0}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            {submitting ? 'Matriculando...' : `Matricular ${selectedUserIds.length} usuarios`}
          </button>

          <button
            onClick={() => fetchUsers(1, false)}
            disabled={loadingUsers || loadingMore || submitting}
            className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loadingUsers ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400 mt-3">{error}</p>}
      </div>

      {result && (
        <div
          className={`rounded-lg border p-4 ${
            result.failedCount > 0
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
              : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
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
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-gray-200 dark:border-slate-700">
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">Usuarios ({users.length})</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o email..."
                className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              />
            </div>
            <button
              onClick={toggleSelectAllCurrent}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              Seleccionar visibles
            </button>
            <button
              onClick={clearSelection}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
            >
              Limpiar
            </button>
          </div>
        </div>

        {loadingUsers ? (
          <div className="p-10 text-center">
            <div className="inline-block animate-spin rounded-full h-7 w-7 border-b-2 border-blue-600 mb-2" />
            <p className="text-sm text-gray-400">Cargando usuarios...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center">
            <GraduationCap className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No hay usuarios para mostrar</p>
          </div>
        ) : (
          <>
            <ul className="divide-y divide-gray-100 dark:divide-slate-700 max-h-[500px] overflow-y-auto">
              {users.map((user) => (
                <li key={user.id} className="px-4 py-2.5">
                  <label
                    className={`flex items-center gap-3 ${
                      user.isSuspended ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(user.id)}
                      onChange={() => toggleUser(user.id)}
                      disabled={!!user.isSuspended}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {user.name || `Usuario #${user.id}`}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    </div>
                    {user.isSuspended && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                        Suspendido
                      </span>
                    )}
                  </label>
                </li>
              ))}
            </ul>

            {hasMore && (
              <div className="p-3 border-t border-gray-200 dark:border-slate-700">
                <button
                  onClick={() => fetchUsers(page + 1, true)}
                  disabled={loadingMore}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50"
                >
                  {loadingMore ? 'Cargando...' : 'Cargar más'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
