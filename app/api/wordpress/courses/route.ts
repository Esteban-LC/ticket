import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { tutorLMSService } from '@/lib/wordpress/tutor-lms'

/**
 * GET /api/wordpress/courses
 * Obtener lista de cursos de Tutor LMS
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permisos
    const userPermissions = (session.user as any).permissions || []
    if (
      !userPermissions.includes('wordpress:manage_courses') &&
      !userPermissions.includes('wordpress:access') &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const per_page = parseInt(searchParams.get('per_page') || '10')
    const search = searchParams.get('search') || undefined
    const status = searchParams.get('status') as 'publish' | 'draft' | 'pending' | undefined

    const courses = await tutorLMSService.getCourses({
      page,
      per_page,
      search,
      status,
    })

    return NextResponse.json({ courses })
  } catch (error: any) {
    console.error('Error fetching courses:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener cursos' },
      { status: 500 }
    )
  }
}
