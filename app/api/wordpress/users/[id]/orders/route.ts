import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { wooCommerceService } from '@/lib/wordpress/woocommerce'
import { wpUserService } from '@/lib/wordpress/users'

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
    if (
      !userPermissions.includes('wordpress:manage_users') &&
      !userPermissions.includes('wordpress:manage_orders') &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }

    const userId = parseInt(params.id)
    const wpUser = await wpUserService.getUser(userId)

    const [ordersByCustomer, ordersByEmail] = await Promise.all([
      wooCommerceService.getOrders({ customer: userId, per_page: 100 }),
      wpUser?.email
        ? wooCommerceService.getOrders({ search: wpUser.email, per_page: 100 })
        : Promise.resolve([]),
    ])

    const normalizedEmail = (wpUser?.email || '').trim().toLowerCase()
    const strictEmailOrders = ordersByEmail.filter((order: any) => {
      const billingEmail = (order?.billing?.email || '').trim().toLowerCase()
      return !!normalizedEmail && billingEmail === normalizedEmail
    })

    const merged = new Map<number, any>()
    for (const order of [...ordersByCustomer, ...strictEmailOrders]) {
      if (!merged.has(order.id)) {
        merged.set(order.id, order)
      }
    }

    const orders = Array.from(merged.values()).sort((a, b) => {
      const da = new Date(a.date_created || 0).getTime()
      const db = new Date(b.date_created || 0).getTime()
      return db - da
    })

    return NextResponse.json({ orders })
  } catch (error: any) {
    console.error('Error fetching user orders:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener órdenes del usuario' },
      { status: 500 }
    )
  }
}
