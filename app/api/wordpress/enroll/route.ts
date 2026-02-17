import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { tutorLMSService } from '@/lib/wordpress/tutor-lms'

/**
 * POST /api/wordpress/enroll
 * Matricular un estudiante en un curso
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permisos
    const userPermissions = (session.user as any).permissions || []
    if (
      !userPermissions.includes('wordpress:manage_enrollments') &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }

    const { user_id, course_id } = await request.json()

    if (!user_id || !course_id) {
      return NextResponse.json(
        { error: 'user_id y course_id son requeridos' },
        { status: 400 }
      )
    }

    const result = await tutorLMSService.enrollStudent(user_id, course_id)

    return NextResponse.json({ success: true, result }, { status: 201 })
  } catch (error: any) {
    console.error('Error enrolling student:', error)
    return NextResponse.json(
      { error: error.message || 'Error al matricular estudiante' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/wordpress/enroll
 * Desmatricular un estudiante de un curso
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permisos
    const userPermissions = (session.user as any).permissions || []
    if (
      !userPermissions.includes('wordpress:manage_enrollments') &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }

    const { user_id, course_id } = await request.json()

    if (!user_id || !course_id) {
      return NextResponse.json(
        { error: 'user_id y course_id son requeridos' },
        { status: 400 }
      )
    }

    const result = await tutorLMSService.unenrollStudent(user_id, course_id)

    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error('Error unenrolling student:', error)
    return NextResponse.json(
      { error: error.message || 'Error al desmatricular estudiante' },
      { status: 500 }
    )
  }
}
