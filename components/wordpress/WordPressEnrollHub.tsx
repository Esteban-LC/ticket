'use client'

import { useEffect, useState } from 'react'
import WordPressBulkEnrollV2 from './WordPressBulkEnrollV2'
import WordPressUserCourseEnroll from './WordPressUserCourseEnroll'
import WordPressCourseStudents from './WordPressCourseStudents'
import EntityHistoryPanel, { EntityHistoryRow } from '@/components/shared/EntityHistoryPanel'
import { useResourceStream } from '@/lib/useResourceStream'

export interface SharedCourse {
  id: number
  title: { rendered: string }
}

interface Props {
  userRole: string
  userPermissions: string[]
}

type Mode = 'course-to-users' | 'user-to-courses' | 'view-students'
type EnrollTab = 'operate' | 'history'

export interface RecentEnrollment {
  id: string
  userId: number
  userName: string
  userEmail: string
  courses: { id: number; title: string }[]
  enrolledAt: string
  withoutPayment?: boolean
}

interface EnrollmentAuditEntry {
  id: string
  event: string
  actorEmail: string
  createdAt: string
  targetName: string | null
  details?: Record<string, unknown>
}

export default function WordPressEnrollHub({ userRole, userPermissions }: Props) {
  const [mode, setMode] = useState<Mode>('course-to-users')
  const [courses, setCourses] = useState<SharedCourse[]>([])
  const [loadingCourses, setLoadingCourses] = useState(true)
  const [auditEntries, setAuditEntries] = useState<EnrollmentAuditEntry[]>([])
  const [activeTab, setActiveTab] = useState<EnrollTab>('operate')

  const fetchAuditEntries = async () => {
    try {
      const res = await fetch('/api/wordpress/enroll/history?take=20', { cache: 'no-store' })
      const data = await res.json()
      if (res.ok) setAuditEntries(data.entries || [])
    } catch {}
  }

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
    fetchAuditEntries()
  }, [])
  useResourceStream('enrollments', fetchAuditEntries)

  const getAuditLabel = (entry: EnrollmentAuditEntry) => {
    if (entry.event === 'enrolled') return `Enrolado por ${entry.actorEmail}`
    if (entry.event === 'unenrolled') return `Desenrolado por ${entry.actorEmail}`
    return `${entry.event} por ${entry.actorEmail}`
  }

  const historyRows: EntityHistoryRow[] = auditEntries.map((entry) => ({
    id: entry.id,
    createdAt: entry.createdAt,
    actorLabel: entry.actorEmail,
    actionLabel: getAuditLabel(entry),
    targetLabel: entry.targetName || `Usuario #${entry.details?.userId || '?'}`,
    targetSubLabel: String(entry.details?.courseName || `Curso #${entry.details?.courseId || '?'}`),
    details:
      entry.event === 'enrolled'
        ? 'Alumno enrolado desde el panel.'
        : 'Alumno desenrolado desde el panel.',
  }))

  const tabs: { key: Mode; label: string }[] = [
    { key: 'course-to-users', label: 'Un curso - varios usuarios' },
    { key: 'user-to-courses', label: 'Un usuario - varios cursos' },
    { key: 'view-students', label: 'Ver alumnos por curso' },
  ]

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-2 shadow dark:border-slate-700 dark:bg-slate-800">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setActiveTab('operate')}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              activeTab === 'operate'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'
            }`}
          >
            Operacion
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'
            }`}
          >
            Historial
          </button>
        </div>
      </div>

      {activeTab === 'history' ? (
        <EntityHistoryPanel
          title="Historial de Enrolamiento"
          description="Consulta quien enrolo o desenrolo alumnos, sobre que curso y en que fecha."
          countLabel={`${historyRows.length} registros`}
          rows={historyRows}
          emptyMessage="Aun no hay movimientos registrados de enrolamiento."
        />
      ) : (
        <>
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

          {mode === 'course-to-users' && (
            <WordPressBulkEnrollV2
              userRole={userRole}
              userPermissions={userPermissions}
              courses={courses}
              loadingCourses={loadingCourses}
              onEnrollSuccess={() => {
                fetchAuditEntries()
              }}
            />
          )}
          {mode === 'user-to-courses' && (
            <WordPressUserCourseEnroll
              userRole={userRole}
              userPermissions={userPermissions}
              onEnrollSuccess={() => {
                fetchAuditEntries()
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
        </>
      )}
    </div>
  )
}
