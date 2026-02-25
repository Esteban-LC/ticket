import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { wpClient } from '@/lib/wordpress/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const userPermissions = (session.user as any).permissions || []
    if (
      !userPermissions.includes('wordpress:manage_enrollments') &&
      !userPermissions.includes('wordpress:manage_users') &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }

    const courseId = parseInt(params.id)
    if (!courseId || courseId <= 0) {
      return NextResponse.json({ error: 'ID de curso inválido' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const per_page = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || '50', 10)))

    const data = await wpClient.get<any>(
      `/custom/v1/courses/${courseId}/students`,
      { page, per_page }
    )

    return NextResponse.json({
      students: data.students || [],
      course_id: courseId,
      total: data.total ?? 0,
      page,
      per_page,
      has_more: data.has_more ?? false,
    })
  } catch (error: any) {
    console.error('Error fetching course students:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener alumnos del curso', students: [] },
      { status: 500 }
    )
  }
}
