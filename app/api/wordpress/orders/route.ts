import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { wooCommerceService } from '@/lib/wordpress/woocommerce'

/**
 * GET /api/wordpress/orders
 * Obtener lista de pedidos de WooCommerce
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
      !userPermissions.includes('wordpress:manage_orders') &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const per_page = parseInt(searchParams.get('per_page') || '10')
    const status = searchParams.get('status') || undefined
    const customer = searchParams.get('customer')
      ? parseInt(searchParams.get('customer')!)
      : undefined

    const orders = await wooCommerceService.getOrders({
      page,
      per_page,
      status,
      customer,
    })

    return NextResponse.json({ orders })
  } catch (error: any) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener pedidos' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/wordpress/orders
 * Crear un nuevo pedido
 */
export async function POST(request: NextRequest) {
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

    const data = await request.json()

    const order = await wooCommerceService.createOrder(data)

    return NextResponse.json({ order }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear pedido' },
      { status: 500 }
    )
  }
}
