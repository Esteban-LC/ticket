import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { wooCommerceService } from '@/lib/wordpress/woocommerce'

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
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }

    const orderId = parseInt(params.id)
    const { status } = await request.json()

    if (!status) {
      return NextResponse.json({ error: 'status es requerido' }, { status: 400 })
    }

    const order = await wooCommerceService.updateOrderStatus(orderId, status)

    return NextResponse.json({ order })
  } catch (error: any) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar pedido' },
      { status: 500 }
    )
  }
}
