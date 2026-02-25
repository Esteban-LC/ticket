import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { tutorLMSService } from '@/lib/wordpress/tutor-lms'
import { wooCommerceService } from '@/lib/wordpress/woocommerce'

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
      !userPermissions.includes('wordpress:manage_users') &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }

    const body: any = await request.json()
    const user_id = body.user_id ? Number(body.user_id) : undefined
    const user_ids: number[] = Array.isArray(body.user_ids)
      ? body.user_ids.map((id: any) => Number(id)).filter((id: number) => Number.isFinite(id))
      : []
    const course_ids: number[] = Array.isArray(body.course_ids)
      ? body.course_ids.map((id: any) => Number(id)).filter((id: number) => Number.isFinite(id))
      : []
    const course_id = body.course_id ? Number(body.course_id) : undefined
    const skip_order_check = Boolean(body.skip_order_check)

    // Modo: un usuario -> múltiples cursos
    if (user_id && course_ids.length > 0) {
      const courseNamesFromBody: { id: number; name: string }[] = Array.isArray(body.course_names)
        ? body.course_names.map((c: any) => ({
            id: Number(c.id || 0),
            name: String(c.name || c.title || `Curso #${c.id || '?'}`),
          }))
        : course_ids.map((id: number) => ({ id, name: `Curso #${id}` }))

      const order = await wooCommerceService.createEnrollmentOrder({
        customer_id: user_id,
        courses: courseNamesFromBody,
      })

      return NextResponse.json({
        success: true,
        order_id: order.id,
        user_id,
        summary: {
          requested: course_ids.length,
          enrolled: course_ids.length,
          already_enrolled: 0,
          failed: 0,
        },
        results: course_ids.map((id) => ({
          course_id: id,
          success: true,
          message: 'Pedido pendiente creado',
          already_enrolled: false,
        })),
      }, { status: 201 })
    }

    if (!course_id || (!user_id && user_ids.length === 0)) {
      return NextResponse.json(
        { error: 'course_id y user_id (o user_ids), o bien user_id + course_ids son requeridos' },
        { status: 400 }
      )
    }

    // Modo individual (retrocompatibilidad)
    if (user_id && user_ids.length === 0) {
      const result = await tutorLMSService.enrollStudent(user_id, course_id, { skipOrderCheck: skip_order_check })
      return NextResponse.json({ success: true, result }, { status: 201 })
    }

    // Modo masivo
    const courseTitleForOrder = (body.course_title as string | undefined) || `Curso #${course_id}`
    const targets: number[] = user_ids.length > 0 ? user_ids : (user_id ? [user_id] : [])
    const uniqueTargets: number[] = Array.from(new Set<number>(targets))
    const results: Array<{ user_id: number; success: boolean; order_id?: number; error?: string }> = []

    for (const targetUserId of uniqueTargets) {
      try {
        const order = await wooCommerceService.createEnrollmentOrder({
          customer_id: targetUserId,
          courses: [{ id: course_id, name: courseTitleForOrder }],
        })
        results.push({
          user_id: targetUserId,
          success: true,
          order_id: order.id,
        })
      } catch (error: any) {
        results.push({
          user_id: targetUserId,
          success: false,
          error: error.message || 'Error al crear pedido',
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failedCount = results.length - successCount

    return NextResponse.json({
      success: failedCount === 0,
      course_id,
      total: results.length,
      successCount,
      failedCount,
      results,
    }, { status: failedCount > 0 ? 207 : 201 })
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
      !userPermissions.includes('wordpress:manage_users') &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }

    const body: any = await request.json()
    const user_id = body.user_id ? Number(body.user_id) : undefined
    const user_ids: number[] = Array.isArray(body.user_ids)
      ? body.user_ids.map((id: any) => Number(id)).filter((id: number) => Number.isFinite(id))
      : []
    const course_id = body.course_id ? Number(body.course_id) : undefined

    if (!course_id || (!user_id && user_ids.length === 0)) {
      return NextResponse.json(
        { error: 'course_id y user_id (o user_ids) son requeridos' },
        { status: 400 }
      )
    }

    // Modo individual (retrocompatibilidad)
    if (user_id && user_ids.length === 0) {
      const result = await tutorLMSService.unenrollStudent(user_id, course_id)
      return NextResponse.json({ success: true, result })
    }

    // Modo masivo
    const targets: number[] = user_ids.length > 0 ? user_ids : (user_id ? [user_id] : [])
    const uniqueTargets: number[] = Array.from(new Set<number>(targets))
    const results: Array<{ user_id: number; success: boolean; error?: string }> = []

    for (const targetUserId of uniqueTargets) {
      try {
        await tutorLMSService.unenrollStudent(targetUserId, course_id)
        results.push({ user_id: targetUserId, success: true })
      } catch (error: any) {
        results.push({
          user_id: targetUserId,
          success: false,
          error: error.message || 'Error al desmatricular',
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failedCount = results.length - successCount

    return NextResponse.json({
      success: failedCount === 0,
      course_id,
      total: results.length,
      successCount,
      failedCount,
      results,
    }, { status: failedCount > 0 ? 207 : 200 })
  } catch (error: any) {
    console.error('Error unenrolling student:', error)
    return NextResponse.json(
      { error: error.message || 'Error al desmatricular estudiante' },
      { status: 500 }
    )
  }
}
