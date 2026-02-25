'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp, Clock, GraduationCap, X } from 'lucide-react'
import WordPressBulkEnrollV2 from './WordPressBulkEnrollV2'
import WordPressUserCourseEnroll from './WordPressUserCourseEnroll'
import WordPressCourseStudents from './WordPressCourseStudents'

export interface SharedCourse {
  id: number
  title: { rendered: string }
}

interface Props {
  userRole: string
  userPermissions: string[]
}

type Mode = 'course-to-users' | 'user-to-courses' | 'view-students'

const STORAGE_KEY = 'wp_recent_enrollments'
const MAX_RECENTS = 50

export interface RecentEnrollment {
  id: string
  userId: number
  userName: string
  userEmail: string
  courses: { id: number; title: string }[]
  enrolledAt: string
  withoutPayment?: boolean
}

export function saveRecentEnrollment(entry: Omit<RecentEnrollment, 'id'>) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const list: RecentEnrollment[] = raw ? JSON.parse(raw) : []
    const newEntry: RecentEnrollment = { ...entry, id: `${Date.now()}-${entry.userId}` }
    const updated = [newEntry, ...list.filter((e) => e.userId !== entry.userId)].slice(0, MAX_RECENTS)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    return updated
  } catch {
    return []
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'hace un momento'
  if (mins < 60) return `hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `hace ${days}d`
}

export default function WordPressEnrollHub({ userRole, userPermissions }: Props) {
  const [mode, setMode] = useState<Mode>('course-to-users')
  const [recents, setRecents] = useState<RecentEnrollment[]>([])
  const [showRecents, setShowRecents] = useState(true)
  const [courses, setCourses] = useState<SharedCourse[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoadingCourses(true)
        const res = await fetch('/api/wordpress/courses?per_page=100&status=publish', { cache: 'no-store' })
        const data = await res.json()
        if (res.ok) setCourses(data.courses || [])
      } finally {
        setLoadingCourses(false)
      }
    }
    fetchCourses()
  }, [])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setRecents(JSON.parse(raw))
    } catch {}

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try { setRecents(JSON.parse(e.newValue)) } catch {}
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const removeRecent = (id: string) => {
    try {
      const updated = recents.filter((r) => r.id !== id)
      setRecents(updated)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch {}
  }

  const clearRecents = () => {
    setRecents([])
    localStorage.removeItem(STORAGE_KEY)
  }

  const tabs: { key: Mode; label: string }[] = [
    { key: 'course-to-users', label: 'Un curso · varios usuarios' },
    { key: 'user-to-courses', label: 'Un usuario · varios cursos' },
    { key: 'view-students', label: 'Ver alumnos por curso' },
  ]

  return (
    <div className="space-y-4">
      {/* Selector de modo */}
      <div className="rounded-lg border border-gray-200 bg-white p-2 shadow dark:border-slate-700 dark:bg-slate-800">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setMode(tab.key)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                mode === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sección de recientes */}
      {recents.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white shadow dark:border-slate-700 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setShowRecents((p) => !p)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Enrolamientos recientes
              </span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                {recents.length}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); clearRecents() }}
                className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400"
              >
                Limpiar
              </button>
              {showRecents ? (
                <ChevronUp className="h-4 w-4 text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </button>

          {showRecents && (
            <ul className="divide-y divide-gray-100 border-t border-gray-200 dark:divide-slate-700 dark:border-slate-700">
              {recents.map((r) => (
                <li key={r.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    {r.userName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{r.userName}</p>
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        <GraduationCap className="h-3 w-3" />
                        Enrolado
                      </span>
                      {r.withoutPayment && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                          <AlertTriangle className="h-3 w-3" />
                          Sin verificación de pago
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-gray-500 dark:text-gray-400">{r.userEmail}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {r.courses.map((c) => (
                        <span
                          key={c.id}
                          className="rounded-md bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600 dark:bg-slate-700 dark:text-gray-300"
                        >
                          {c.title}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-xs text-gray-400">{timeAgo(r.enrolledAt)}</span>
                    <button
                      type="button"
                      onClick={() => removeRecent(r.id)}
                      className="text-gray-300 hover:text-red-400 dark:text-slate-600 dark:hover:text-red-400"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Vista activa */}
      {mode === 'course-to-users' && (
        <WordPressBulkEnrollV2
          userRole={userRole}
          userPermissions={userPermissions}
          courses={courses}
          loadingCourses={loadingCourses}
          onEnrollSuccess={(entry) => {
            const updated = saveRecentEnrollment(entry)
            setRecents(updated)
          }}
        />
      )}
      {mode === 'user-to-courses' && (
        <WordPressUserCourseEnroll
          userRole={userRole}
          userPermissions={userPermissions}
          onEnrollSuccess={(entry) => {
            const updated = saveRecentEnrollment(entry)
            setRecents(updated)
          }}
        />
      )}
      {mode === 'view-students' && (
        <WordPressCourseStudents
          userRole={userRole}
          userPermissions={userPermissions}
          courses={courses}
          loadingCourses={loadingCourses}
        />
      )}
    </div>
  )
}
