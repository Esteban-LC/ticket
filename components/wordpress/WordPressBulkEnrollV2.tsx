'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, ClipboardList, GraduationCap, Info, Loader2, RefreshCw, Search, Users, X } from 'lucide-react'
import type { RecentEnrollment, SharedCourse } from './WordPressEnrollHub'

interface WordPressUser {
  id: number
  username: string
  name: string
  email: string
  roles: string[]
  isSuspended?: boolean
}

interface BulkEnrollResponse {
  success: boolean
  course_id: number
  total: number
  successCount: number
  failedCount: number
  results: { user_id: number; success: boolean; already_enrolled?: boolean; error?: string }[]
}

interface LookupResult {
  email: string
  found: boolean
  user?: { id: number; name: string; email: string; username: string; isSuspended: boolean; isEnrolled?: boolean }
}

interface Props {
  userRole: string
  userPermissions: string[]
  courses?: SharedCourse[]
  loadingCourses?: boolean
  onEnrollSuccess?: (entry: Omit<RecentEnrollment, 'id'>) => void
}

const PER_PAGE = 25

export default function WordPressBulkEnrollV2({ userRole, userPermissions, courses: externalCourses, loadingCourses: externalLoadingCourses, onEnrollSuccess }: Props) {
  const canEnroll =
    userRole === 'ADMIN' ||
    userPermissions.includes('wordpress:manage_users') ||
    userPermissions.includes('wordpress:manage_enrollments')

  const [internalCourses, setInternalCourses] = useState<SharedCourse[]>([])
  const [internalLoadingCourses, setInternalLoadingCourses] = useState(externalCourses === undefined)
  const courses = externalCourses ?? internalCourses
  const loadingCourses = externalCourses !== undefined ? (externalLoadingCourses ?? false) : internalLoadingCourses

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
  const [submitting, setSubmitting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BulkEnrollResponse | null>(null)
  const [enrolledUserIds, setEnrolledUserIds] = useState<Set<number>>(new Set())

  // Paste-by-email modal
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupResults, setLookupResults] = useState<LookupResult[] | null>(null)
  const [pastedUserMap, setPastedUserMap] = useState<Map<number, { name: string; email: string }>>(new Map())

  const stripHtml = (value: string) => value.replace(/<[^>]+>/g, '').trim()

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(search.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (externalCourses !== undefined) return
    const loadCourses = async () => {
      try {
        setInternalLoadingCourses(true)
        const res = await fetch('/api/wordpress/courses?per_page=100&status=publish', { cache: 'no-store' })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Error al cargar cursos')
        setInternalCourses(data.courses || [])
      } catch (e: any) {
        setError(e.message || 'Error al cargar cursos')
      } finally {
        setInternalLoadingCourses(false)
      }
    }
    loadCourses()
  }, [externalCourses])

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true)
        setError(null)
        const params = new URLSearchParams({ page: String(page), per_page: String(PER_PAGE) })
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

  // ── Paste / lookup ──────────────────────────────────────────────
  const parseEmails = (text: string): string[] =>
    [...new Set(
      text
        .split(/[\n,;]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.includes('@') && e.includes('.'))
    )]

  const handleLookup = async () => {
    const emails = parseEmails(pasteText)
    if (emails.length === 0) return
    setLookupLoading(true)
    setLookupResults(null)
    try {
      const res = await fetch('/api/wordpress/enroll/users/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error en búsqueda')

      let rawResults: LookupResult[] = data.results || []

      // If a course is selected, check which found users are already enrolled
      if (selectedCourseId && rawResults.some((r) => r.found && r.user)) {
        const enrolledIds = new Set<number>()
        let pg = 1
        let more = true
        while (more && pg <= 20) {
          const studRes = await fetch(
            `/api/wordpress/courses/${selectedCourseId}/students?per_page=100&page=${pg}`,
            { cache: 'no-store' }
          )
          if (!studRes.ok) break
          const studData = await studRes.json()
          ;(studData.students || []).forEach((s: any) => {
            const id = Number(s.id || s.ID)
            if (id) enrolledIds.add(id)
          })
          more = Boolean(studData.has_more)
          pg++
        }
        rawResults = rawResults.map((r) => ({
          ...r,
          user: r.user ? { ...r.user, isEnrolled: enrolledIds.has(r.user.id) } : undefined,
        }))
      }

      setLookupResults(rawResults)
    } catch {
      setLookupResults([])
    } finally {
      setLookupLoading(false)
    }
  }

  const handleApplyLookup = () => {
    if (!lookupResults) return
    const pending = lookupResults.filter(
      (r) => r.found && r.user && !r.user.isSuspended && !r.user.isEnrolled && !enrolledUserIds.has(r.user.id)
    )
    setSelectedUserIds((prev) => Array.from(new Set([...prev, ...pending.map((r) => r.user!.id)])))
    const newMap = new Map(pastedUserMap)
    lookupResults.forEach((r) => {
      if (r.found && r.user) newMap.set(r.user.id, { name: r.user.name, email: r.user.email })
    })
    setPastedUserMap(newMap)
    setPasteOpen(false)
    setPasteText('')
    setLookupResults(null)
  }

  // ── Enroll submit ────────────────────────────────────────────────
  const handleSubmit = async (): Promise<boolean> => {
    if (!selectedCourseId) { setError('Selecciona un curso'); return false }
    if (!selectedUserIds.length) { setError('Selecciona al menos un usuario'); return false }
    try {
      setSubmitting(true)
      setError(null)
      setResult(null)
      const course = courses.find((c) => String(c.id) === selectedCourseId)
      const courseTitle = course
        ? stripHtml(course.title?.rendered || `Curso #${course.id}`)
        : `Curso #${selectedCourseId}`

      const res = await fetch('/api/wordpress/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: Number(selectedCourseId), user_ids: selectedUserIds, skip_order_check: true, course_title: courseTitle }),
      })
      const data = await res.json()
      if (!res.ok && res.status !== 207) throw new Error(data.error || 'Error al enrolar')
      setResult(data)

      const successIds: number[] = (data.results || [])
        .filter((r: any) => r.success)
        .map((r: any) => r.user_id)
        .filter(Boolean)

      if (successIds.length > 0) {
        setEnrolledUserIds((prev) => new Set([...prev, ...successIds]))
        successIds.forEach((uid) => {
          const uFromList = users.find((u) => u.id === uid)
          const uFromPaste = pastedUserMap.get(uid)
          const name = uFromList?.name || uFromPaste?.name || `Usuario #${uid}`
          const email = uFromList?.email || uFromPaste?.email || ''
          onEnrollSuccess?.({
            userId: uid,
            userName: name,
            userEmail: email,
            courses: [{ id: Number(selectedCourseId), title: courseTitle }],
            enrolledAt: new Date().toISOString(),
            withoutPayment: true,
          })
        })
      }

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
    const selected = courses.find((c) => String(c.id) === selectedCourseId)
    return selected ? stripHtml(selected.title?.rendered || `Curso #${selected.id}`) : 'Sin curso'
  }, [courses, selectedCourseId])

  // ── Result breakdown ─────────────────────────────────────────────
  const resultBreakdown = useMemo(() => {
    if (!result) return null
    return {
      newlyEnrolled: result.results.filter((r) => r.success && !r.already_enrolled),
      alreadyEnrolled: result.results.filter((r) => r.success && r.already_enrolled),
      failed: result.results.filter((r) => !r.success),
    }
  }, [result])

  const getUserName = (userId: number) => {
    const u = users.find((u) => u.id === userId)
    if (u) return u.name || u.email || `#${userId}`
    const p = pastedUserMap.get(userId)
    if (p) return p.name || p.email || `#${userId}`
    return `#${userId}`
  }

  if (!canEnroll) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
        No tienes permisos para enrolar usuarios.
      </div>
    )
  }

  // Paste modal derived state
  const emailsInTextarea = parseEmails(pasteText)
  const lookupPending = lookupResults?.filter((r) => r.found && r.user && !r.user.isSuspended && !r.user.isEnrolled && !enrolledUserIds.has(r.user.id)) ?? []
  const lookupAlreadyEnrolled = lookupResults?.filter((r) => r.found && r.user && !r.user.isSuspended && (r.user.isEnrolled || enrolledUserIds.has(r.user.id))) ?? []
  const lookupSuspended = lookupResults?.filter((r) => r.found && r.user?.isSuspended) ?? []
  const lookupNotFound = lookupResults?.filter((r) => !r.found) ?? []

  return (
    <div className="space-y-4">
      {/* Top bar */}
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

      {/* Enroll result */}
      {result && resultBreakdown && (
        <div className={`rounded-lg border p-4 ${resultBreakdown.failed.length > 0 ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20' : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'}`}>
          <div className="flex flex-wrap gap-4">
            {resultBreakdown.newlyEnrolled.length > 0 && (
              <div className="flex items-center gap-1.5 text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">{resultBreakdown.newlyEnrolled.length} nuevos enrolamientos</span>
              </div>
            )}
            {resultBreakdown.alreadyEnrolled.length > 0 && (
              <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <Info className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">{resultBreakdown.alreadyEnrolled.length} ya estaban enrolados</span>
              </div>
            )}
            {resultBreakdown.failed.length > 0 && (
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span className="text-sm font-medium">{resultBreakdown.failed.length} fallidos</span>
              </div>
            )}
          </div>

          {resultBreakdown.alreadyEnrolled.length > 0 && (
            <div className="mt-3">
              <p className="mb-1.5 text-xs font-medium text-blue-700 dark:text-blue-300">Ya estaban enrolados en este curso:</p>
              <div className="flex flex-wrap gap-1.5">
                {resultBreakdown.alreadyEnrolled.map((r) => (
                  <span key={r.user_id} className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                    {getUserName(r.user_id)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {resultBreakdown.failed.length > 0 && (
            <ul className="mt-2 space-y-0.5 text-xs text-amber-700 dark:text-amber-300">
              {resultBreakdown.failed.slice(0, 10).map((r) => (
                <li key={r.user_id}>{getUserName(r.user_id)}: {r.error || 'Error al enrolar'}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Users table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-2 border-b border-gray-200 p-4 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">Usuarios ({totalGlobal})</p>
            {searchTerm ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">Mostrando {users.length} de {totalFiltered} filtrados</p>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400">Mostrando {users.length} de {totalGlobal}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o email..."
                className="rounded-lg border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-sm text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div className="flex flex-col items-start gap-0.5">
              <button
                onClick={() => { setPasteOpen(true); setLookupResults(null); setPasteText('') }}
                disabled={!selectedCourseId}
                title={!selectedCourseId ? 'Selecciona un curso primero' : undefined}
                className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/20"
              >
                <ClipboardList className="h-3.5 w-3.5" />
                Pegar lista
              </button>
              {!selectedCourseId && (
                <p className="text-[10px] leading-tight text-gray-400 dark:text-slate-500">Selecciona un curso primero</p>
              )}
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
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{user.name || `Usuario #${user.id}`}</p>
                      {enrolledUserIds.has(user.id) && (
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                          <GraduationCap className="h-3 w-3" />
                          Enrolado
                        </span>
                      )}
                    </div>
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

      {/* Confirm enroll modal */}
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
                onClick={async () => { const ok = await handleSubmit(); if (ok) setConfirmOpen(false) }}
                disabled={submitting}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paste emails modal */}
      {pasteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className="flex w-full max-w-lg flex-col rounded-lg border border-gray-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800"
            style={{ maxHeight: '90vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-blue-500" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Pegar lista de emails</h3>
              </div>
              <button
                onClick={() => { setPasteOpen(false); setLookupResults(null); setPasteText('') }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {!lookupResults ? (
                <>
                  {!selectedCourseId && (
                    <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      Selecciona un curso antes de buscar emails para poder verificar si ya están enrolados.
                    </div>
                  )}
                  <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
                    Pega los correos separados por salto de línea, coma o punto y coma. Se buscarán en WordPress y se auto-seleccionarán los que estén disponibles.
                  </p>
                  <textarea
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder={'ejemplo@email.com\notro@email.com\ntercero@email.com'}
                    rows={8}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-slate-400"
                  />
                  {emailsInTextarea.length > 0 && (
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                      {emailsInTextarea.length} email{emailsInTextarea.length !== 1 ? 's' : ''} detectado{emailsInTextarea.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  {/* Stats chips */}
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      <CheckCircle2 className="h-3 w-3" />
                      {lookupPending.length} pendiente{lookupPending.length !== 1 ? 's' : ''}
                    </span>
                    {lookupAlreadyEnrolled.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        <GraduationCap className="h-3 w-3" />
                        {lookupAlreadyEnrolled.length} ya enrolado{lookupAlreadyEnrolled.length !== 1 ? 's' : ''} en el curso
                      </span>
                    )}
                    {lookupSuspended.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
                        <AlertTriangle className="h-3 w-3" />
                        {lookupSuspended.length} suspendido{lookupSuspended.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {lookupNotFound.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-300">
                        <X className="h-3 w-3" />
                        {lookupNotFound.length} no encontrado{lookupNotFound.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {lookupPending.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Pendientes de enrolar</p>
                      <ul className="space-y-1">
                        {lookupPending.map((r) => (
                          <li key={r.email} className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 dark:bg-green-900/10">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-600" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{r.user!.name}</p>
                              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{r.email}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {lookupAlreadyEnrolled.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Ya enrolados en el curso</p>
                      <ul className="space-y-1">
                        {lookupAlreadyEnrolled.map((r) => (
                          <li key={r.email} className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 dark:bg-blue-900/10">
                            <GraduationCap className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{r.user!.name}</p>
                              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{r.email}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {lookupSuspended.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Suspendidos (no se seleccionarán)</p>
                      <ul className="space-y-1">
                        {lookupSuspended.map((r) => (
                          <li key={r.email} className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-900/10">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{r.user!.name}</p>
                              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{r.email}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {lookupNotFound.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">No encontrados en WordPress</p>
                      <div className="flex flex-wrap gap-1.5">
                        {lookupNotFound.map((r) => (
                          <span key={r.email} className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs text-red-700 dark:bg-red-900/30 dark:text-red-300">
                            {r.email}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-3 dark:border-slate-700">
              {!lookupResults ? (
                <>
                  <button
                    onClick={() => { setPasteOpen(false); setPasteText('') }}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleLookup}
                    disabled={lookupLoading || emailsInTextarea.length === 0}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {lookupLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {lookupLoading ? 'Buscando...' : `Buscar ${emailsInTextarea.length} email${emailsInTextarea.length !== 1 ? 's' : ''}`}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setLookupResults(null)}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700"
                  >
                    Volver
                  </button>
                  <button
                    onClick={() => { setPasteOpen(false); setLookupResults(null); setPasteText('') }}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700"
                  >
                    Cerrar
                  </button>
                  {lookupPending.length > 0 && (
                    <button
                      onClick={handleApplyLookup}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                    >
                      Seleccionar {lookupPending.length} pendiente{lookupPending.length !== 1 ? 's' : ''}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
