import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { wpClient } from '@/lib/wordpress/client'

async function safeGet<T>(endpoint: string, params: Record<string, any> | undefined, fallback: T): Promise<T> {
  try {
    return await wpClient.get<T>(endpoint, params)
  } catch {
    return fallback
  }
}

function toPercent(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 0
  if (n < 0) return 0
  if (n > 100) return 100
  return Math.round(n)
}

/**
 * GET /api/wordpress/users/[id]/courses
 * Obtener los cursos en los que esta inscrito un usuario (via plugin custom)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const userPermissions = (session.user as any).permissions || []
    if (!userPermissions.includes('wordpress:manage_users') && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }

    const userId = parseInt(params.id)

    // Base: endpoint custom del plugin (lee enrolamientos/relaciones)
    const data = await wpClient.get<{ courses: any[] }>(`/custom/v1/users/${userId}/courses`)

    const courses = await Promise.all((data.courses || []).map(async (course: any) => {
      const courseId = Number(course?.id || 0)
      if (!courseId) {
        return {
          ...course,
          lesson_total: 0,
          lesson_completed: 0,
          quiz_total: 0,
          quiz_completed: 0,
          assignment_total: 0,
          assignment_completed: 0,
          progress_percentage: 0,
        }
      }

      const [lessons, quizzes, assignments, progress] = await Promise.all([
        safeGet<any[]>('/tutor/v1/lessons', { course_id: courseId, per_page: 100 }, []),
        safeGet<any[]>('/tutor/v1/quizzes', { course_id: courseId, per_page: 100 }, []),
        safeGet<any[]>('/tutor/v1/assignments', { course_id: courseId, per_page: 100 }, []),
        safeGet<any>('/tutor/v1/course-progress', { user_id: userId, course_id: courseId }, null),
      ])

      const quizAttempts = await Promise.all(
        (quizzes || []).map(async (quiz: any) => {
          const quizId = Number(quiz?.id || 0)
          if (!quizId) return 0
          const attempts = await safeGet<any[]>('/tutor/v1/quiz-attempts', { user_id: userId, quiz_id: quizId }, [])
          return attempts.length > 0 ? 1 : 0
        })
      )

      const lessonTotal = Number(progress?.total_lessons ?? lessons.length ?? 0) || 0
      const lessonCompleted = Number(progress?.completed_lessons ?? 0) || 0
      const quizTotal = Array.isArray(quizzes) ? quizzes.length : 0
      const quizCompleted = quizAttempts.reduce<number>((acc, cur) => acc + cur, 0)
      const assignmentTotal = Array.isArray(assignments) ? assignments.length : 0
      const assignmentCompleted = 0
      const progressPercentage = toPercent(progress?.progress_percentage)

      return {
        ...course,
        lesson_total: lessonTotal,
        lesson_completed: lessonCompleted,
        quiz_total: quizTotal,
        quiz_completed: quizCompleted,
        assignment_total: assignmentTotal,
        assignment_completed: assignmentCompleted,
        progress_percentage: progressPercentage,
      }
    }))

    return NextResponse.json({ courses })
  } catch (error: any) {
    console.error('Error fetching user courses:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener cursos del usuario', courses: [] },
      { status: 500 }
    )
  }
}
