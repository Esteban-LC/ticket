import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { tutorLMSService } from '@/lib/wordpress/tutor-lms'
import { wpClient } from '@/lib/wordpress/client'

/**
 * GET /api/wordpress/courses/[id]
 * Obtener un curso específico
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userPermissions = (session.user as any).permissions || []
    if (
      !userPermissions.includes('wordpress:manage_courses') &&
      !userPermissions.includes('wordpress:manage_users') &&
      !userPermissions.includes('wordpress:access') &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }

    const courseId = parseInt(params.id)
    let course: any
    try {
      course = await tutorLMSService.getCourse(courseId)
    } catch (primaryError: any) {
      console.warn(`Primary /wp/v2/courses/${courseId} failed, trying /custom/v1/courses/${courseId}:`, primaryError?.message || primaryError)
      const fallback = await wpClient.get<{ course: any }>(`/custom/v1/courses/${courseId}`)
      course = fallback.course
    }

    return NextResponse.json({ course })
  } catch (error: any) {
    console.error('Error fetching course:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener curso' },
      { status: 500 }
    )
  }
}
