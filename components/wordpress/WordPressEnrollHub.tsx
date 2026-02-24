'use client'

import { useState } from 'react'
import WordPressBulkEnrollV2 from './WordPressBulkEnrollV2'
import WordPressUserCourseEnroll from './WordPressUserCourseEnroll'

interface Props {
  userRole: string
  userPermissions: string[]
}

type Mode = 'course-to-users' | 'user-to-courses'

export default function WordPressEnrollHub({ userRole, userPermissions }: Props) {
  const [mode, setMode] = useState<Mode>('course-to-users')

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-2 shadow dark:border-slate-700 dark:bg-slate-800">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode('course-to-users')}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              mode === 'course-to-users'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'
            }`}
          >
            Un curso - varios usuarios
          </button>
          <button
            type="button"
            onClick={() => setMode('user-to-courses')}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              mode === 'user-to-courses'
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700'
            }`}
          >
            Un usuario - varios cursos
          </button>
        </div>
      </div>

      {mode === 'course-to-users' ? (
        <WordPressBulkEnrollV2 userRole={userRole} userPermissions={userPermissions} />
      ) : (
        <WordPressUserCourseEnroll userRole={userRole} userPermissions={userPermissions} />
      )}
    </div>
  )
}
