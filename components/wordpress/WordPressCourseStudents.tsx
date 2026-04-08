'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowDownAZ, ArrowUpAZ, ChevronLeft, ChevronRight, GraduationCap, RefreshCw, Search, UserCheck, Users } from 'lucide-react'
import type { SharedCourse } from './WordPressEnrollHub'

interface Student {
  id?: number
  ID?: number
  user_login?: string
  user_email?: string
  display_name?: string
  name?: string
  email?: string
}

interface Props {
  userRole: string
  userPermissions: string[]
  courses?: SharedCourse[]
  loadingCourses?: boolean
}

type SortKey = 'recent' | 'name-asc' | 'name-desc' | 'email-asc' | 'email-desc'

const stripHtml = (v: string) => v.replace(/<[^>]+>/g, '').trim()

export default function WordPressCourseStudents({ userRole, userPermissions, courses: externalCourses, loadingCourses: externalLoadingCourses }: Props) {
  const canView =
    userRole === 'ADMIN' ||
    userPermissions.includes('wordpress:manage_users') ||
    userPermissions.includes('wordpress:manage_enrollments')

  const [internalCourses, setInternalCourses] = useState<SharedCourse[]>([])
  const [internalLoadingCourses, setInternalLoadingCourses] = useState(externalCourses === undefined)
  const courses = externalCourses ?? internalCourses
  const loadingCourses = externalCourses !== undefined ? (externalLoadingCourses ?? false) : internalLoadingCourses

  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [students, setStudents] = useState<Student[]>([])
  const [filter, setFilter] = useState('')
  const [sortBy, setSortBy] = useState<SortKey>('recent')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasFetched, setHasFetched] = useState(false)

  const PER_PAGE = 50

  useEffect(() => {
    if (externalCourses !== undefined) return
    const fetchCourses = async () => {
      try {
        setInternalLoadingCourses(true)
        const res = await fetch('/api/wordpress/courses?per_page=100&status=publish', { cache: 'no-store' })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Error al cargar cursos')
        setInternalCourses(data.courses || [])
      } catch (e: any) {
        setError(e.message)
      } finally {
        setInternalLoadingCourses(false)
      }
    }
    fetchCourses()
  }, [externalCourses])

  const fetchStudents = async (courseId: string, targetPage: number) => {
    if (!courseId) return
    try {
      setLoadingStudents(true)
      setError(null)
      const params = new URLSearchParams({ page: String(targetPage), per_page: String(PER_PAGE) })
      const res = await fetch(`/api/wordpress/courses/${courseId}/students?${params}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al cargar alumnos')
      const list: Student[] = data.students || []
      setStudents(list)
      setHasMore(data.has_more ?? list.length === PER_PAGE)
      setPage(targetPage)
      setHasFetched(true)
    } catch (e: any) {
      setError(e.message)
      setStudents([])
    } finally {
      setLoadingStudents(false)
    }
  }

  const handleCourseChange = (id: string) => {
    setSelectedCourseId(id)
    setStudents([])
    setFilter('')
    setSortBy('recent')
    setPage(1)
    setHasFetched(false)
    setError(null)
    if (id) fetchStudents(id, 1)
  }

  const studentName = (s: Student) => s.display_name || s.name || s.user_login || `ID #${s.id ?? s.ID}`
  const studentEmail = (s: Student) => s.user_email || s.email || ''

  const filtered = useMemo(() => {
    const term = filter.trim().toLowerCase()
    const list = term
      ? students.filter(
          (s) =>
            studentName(s).toLowerCase().includes(term) ||
            studentEmail(s).toLowerCase().includes(term)
        )
      : [...students]

    switch (sortBy) {
      case 'name-asc':
        return list.sort((a, b) => studentName(a).localeCompare(studentName(b)))
      case 'name-desc':
        return list.sort((a, b) => studentName(b).localeCompare(studentName(a)))
      case 'email-asc':
        return list.sort((a, b) => studentEmail(a).localeCompare(studentEmail(b)))
      case 'email-desc':
        return list.sort((a, b) => studentEmail(b).localeCompare(studentEmail(a)))
      default:
        return list // 'recent' → server order (post_date DESC)
    }
  }, [students, filter, sortBy])

  const selectedCourse = courses.find((c) => String(c.id) === selectedCourseId)

  if (!canView) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
        No tienes permisos para ver esta sección.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Selector de curso */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              Selecciona un curso para ver sus alumnos enrolados
            </label>
            {loadingCourses ? (
              <div className="h-9 animate-pulse rounded-lg bg-gray-200 dark:bg-slate-700" />
            ) : (
              <select
                value={selectedCourseId}
                onChange={(e) => handleCourseChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
              >
                <option value="">-- Elige un curso --</option>
                {courses.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {stripHtml(c.title?.rendered || `Curso #${c.id}`)}
                  </option>
                ))}
              </select>
            )}
          </div>
          {selectedCourseId && (
            <button
              onClick={() => fetchStudents(selectedCourseId, 1)}
              disabled={loadingStudents}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700"
            >
              <RefreshCw className={`h-4 w-4 ${loadingStudents ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          )}
        </div>
        {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>

      {/* Tabla de alumnos */}
      {selectedCourseId && (
        <div className="rounded-lg border border-gray-200 bg-white shadow dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-col gap-2 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {loadingStudents
                  ? 'Cargando alumnos...'
                  : hasFetched
                  ? `${filtered.length} alumno${filtered.length !== 1 ? 's' : ''} enrolado${filtered.length !== 1 ? 's' : ''}`
                  : 'Alumnos enrolados'}
                {selectedCourse && (
                  <span className="ml-1 text-gray-500 dark:text-gray-400">
                    en {stripHtml(selectedCourse.title?.rendered || '')}
                  </span>
                )}
              </span>
            </div>
            {hasFetched && students.length > 0 && (
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                {/* Buscador */}
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                  <input
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Buscar nombre o email..."
                    className="w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-8 pr-3 text-xs text-gray-900 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                  />
                </div>

                {/* Ordenar */}
                <div className="flex items-center gap-1.5">
                  {sortBy.includes('asc') ? (
                    <ArrowDownAZ className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  ) : sortBy.includes('desc') ? (
                    <ArrowUpAZ className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                  ) : (
                    <ArrowDownAZ className="h-3.5 w-3.5 shrink-0 text-gray-300 dark:text-slate-600" />
                  )}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortKey)}
                    className="rounded-lg border border-gray-300 bg-white py-1.5 pl-2 pr-6 text-xs text-gray-700 dark:border-slate-600 dark:bg-slate-700 dark:text-gray-300"
                  >
                    <option value="recent">Más reciente</option>
                    <option value="name-asc">Nombre A → Z</option>
                    <option value="name-desc">Nombre Z → A</option>
                    <option value="email-asc">Email A → Z</option>
                    <option value="email-desc">Email Z → A</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {loadingStudents ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex animate-pulse items-center gap-3 rounded-lg border border-gray-100 p-3 dark:border-slate-700">
                  <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-slate-700" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-40 rounded bg-gray-200 dark:bg-slate-700" />
                    <div className="h-3 w-56 rounded bg-gray-200 dark:bg-slate-700" />
                  </div>
                  <div className="h-5 w-16 rounded-full bg-green-100 dark:bg-green-900/20" />
                </div>
              ))}
            </div>
          ) : !hasFetched ? (
            <div className="p-10 text-center text-sm text-gray-500 dark:text-gray-400">
              Selecciona un curso para ver sus alumnos.
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center">
              <UserCheck className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {filter ? 'Sin resultados para ese filtro.' : 'No hay alumnos enrolados en este curso.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-slate-700">
              {filtered.map((student, idx) => {
                const id = student.id ?? student.ID ?? idx
                const name = studentName(student)
                const email = studentEmail(student)
                const initials = name.slice(0, 2).toUpperCase()
                return (
                  <li key={id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{name}</p>
                      {email && <p className="truncate text-xs text-gray-500 dark:text-gray-400">{email}</p>}
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                      <GraduationCap className="h-3 w-3" />
                      Enrolado
                    </span>
                  </li>
                )
              })}
            </ul>
          )}

          {/* Paginación */}
          {hasFetched && (hasMore || page > 1) && (
            <div className="flex items-center justify-between border-t border-gray-200 p-3 dark:border-slate-700">
              <button
                onClick={() => fetchStudents(selectedCourseId, page - 1)}
                disabled={page <= 1 || loadingStudents}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Anterior
              </button>
              <span className="text-xs text-gray-500 dark:text-gray-400">Página {page}</span>
              <button
                onClick={() => fetchStudents(selectedCourseId, page + 1)}
                disabled={!hasMore || loadingStudents}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-700"
              >
                Siguiente
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
