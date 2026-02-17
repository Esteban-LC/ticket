import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { wpUserService } from '@/lib/wordpress/users'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/wordpress/users/[id]
 * Obtener un usuario específico de WordPress
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
    if (!userPermissions.includes('wordpress:manage_users') && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }

    const userId = parseInt(params.id)
    const user = await wpUserService.getUser(userId)

    // Merge con estado de suspensión local
    const localUser = await prisma.wordPressUser.findUnique({ where: { id: userId } })

    return NextResponse.json({
      user: {
        ...user,
        isSuspended: localUser?.isSuspended || false,
        suspensionReason: localUser?.suspensionReason || null,
        suspendedAt: localUser?.suspendedAt || null,
      }
    })
  } catch (error: any) {
    console.error('Error fetching WordPress user:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener usuario' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/wordpress/users/[id]
 * Actualizar un usuario de WordPress
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
    if (!userPermissions.includes('wordpress:manage_users') && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }

    const userId = parseInt(params.id)
    const data = await request.json()

    const updatedUser = await wpUserService.updateUser(userId, data)

    return NextResponse.json({ user: updatedUser })
  } catch (error: any) {
    console.error('Error updating WordPress user:', error)
    return NextResponse.json(
      { error: error.message || 'Error al actualizar usuario' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/wordpress/users/[id]
 * Eliminar un usuario de WordPress
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userPermissions = (session.user as any).permissions || []
    if (!userPermissions.includes('wordpress:manage_users') && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }

    const userId = parseInt(params.id)
    const { searchParams } = new URL(request.url)
    const reassign = searchParams.get('reassign')
      ? parseInt(searchParams.get('reassign')!)
      : undefined

    const result = await wpUserService.deleteUser(userId, reassign)

    return NextResponse.json({ success: true, result })
  } catch (error: any) {
    console.error('Error deleting WordPress user:', error)
    return NextResponse.json(
      { error: error.message || 'Error al eliminar usuario' },
      { status: 500 }
    )
  }
}
