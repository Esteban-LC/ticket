import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { tutorLMSService } from '@/lib/wordpress/tutor-lms'

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
      !userPermissions.includes('wordpress:access') &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }

    const courseId = parseInt(params.id)
    const course = await tutorLMSService.getCourse(courseId)

    return NextResponse.json({ course })
  } catch (error: any) {
    console.error('Error fetching course:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener curso' },
      { status: 500 }
    )
  }
}
