import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { wpClient } from '@/lib/wordpress/client'

/**
 * GET /api/wordpress/users/[id]/courses
 * Obtener los cursos en los que está inscrito un usuario (vía plugin custom)
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

    // Usar el endpoint del plugin custom que lee directamente la tabla de Tutor LMS
    const data = await wpClient.get<{ courses: any[] }>(`/custom/v1/users/${userId}/courses`)

    return NextResponse.json({ courses: data.courses || [] })
  } catch (error: any) {
    console.error('Error fetching user courses:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener cursos del usuario', courses: [] },
      { status: 500 }
    )
  }
}
