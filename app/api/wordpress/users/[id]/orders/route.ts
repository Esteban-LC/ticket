import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { wooCommerceService } from '@/lib/wordpress/woocommerce'

/**
 * GET /api/wordpress/users/[id]/orders
 * Obtener las órdenes de WooCommerce de un usuario
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
    const orders = await wooCommerceService.getOrders({ customer: userId, per_page: 50 })

    return NextResponse.json({ orders })
  } catch (error: any) {
    console.error('Error fetching user orders:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener órdenes del usuario' },
      { status: 500 }
    )
  }
}
