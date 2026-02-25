import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { wooCommerceService } from '@/lib/wordpress/woocommerce'
import { tutorLMSService } from '@/lib/wordpress/tutor-lms'

/**
 * GET /api/wordpress/orders/[id]
 * Obtener un pedido específico
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
      !userPermissions.includes('wordpress:manage_orders') &&
      !userPermissions.includes('wordpress:manage_users') &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }

    const orderId = parseInt(params.id)
    const order = await wooCommerceService.getOrder(orderId)

    return NextResponse.json({ order })
  } catch (error: any) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener pedido' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/wordpress/orders/[id]
 * Actualizar el estado de un pedido
 */
export async function PUT(
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
      !userPermissions.includes('wordpress:manage_orders') &&
      !userPermissions.includes('wordpress:manage_users') &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }

    const orderId = parseInt(params.id)
    const { status } = await request.json()

    if (!status) {
      return NextResponse.json({ error: 'status es requerido' }, { status: 400 })
    }

    let enrollmentWarning: string | null = null

    // Al acreditar (completar), disparar enrolamiento en Tutor LMS si el pedido es de enrolamiento admin
    if (status === 'completed') {
      try {
        const existingOrder = await wooCommerceService.getOrder(orderId)
        const meta: Array<{ key: string; value: string }> = (existingOrder as any).meta_data || []
        const isPending = meta.some((m) => m.key === '_liq_enrollment_pending' && m.value === '1')

        if (isPending) {
          const courseIdsMeta = meta.find((m) => m.key === '_liq_course_ids')
          const courseIdsStr = courseIdsMeta?.value || ''
          const courseIds = courseIdsStr
            .split(',')
            .map((s) => parseInt(s.trim(), 10))
            .filter((id) => id > 0)

          if (courseIds.length > 0 && existingOrder.customer_id) {
            const enrollResults = await Promise.allSettled(
              courseIds.map((courseId) =>
                tutorLMSService.enrollStudent(existingOrder.customer_id, courseId, { skipOrderCheck: true })
              )
            )
            const failed = enrollResults.filter((r) => r.status === 'rejected').length
            if (failed > 0) {
              enrollmentWarning = `${failed} de ${courseIds.length} cursos no pudieron enrolarse automáticamente. Verifica manualmente.`
            }
          }
        }
      } catch {
        enrollmentWarning = 'No se pudo procesar el enrolamiento pendiente.'
      }
    }

    const order = await wooCommerceService.updateOrderStatus(orderId, status)

    return NextResponse.json({
      order,
      ...(enrollmentWarning ? { enrollmentWarning } : {}),
    })
  } catch (error: any) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar pedido' },
      { status: 500 }
    )
  }
}
