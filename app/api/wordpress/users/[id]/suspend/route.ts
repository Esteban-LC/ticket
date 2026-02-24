import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { wpUserService } from '@/lib/wordpress/users'

/**
 * POST /api/wordpress/users/[id]/suspend
 * Suspender/Inhabilitar un usuario de WordPress (usa custom endpoint de WordPress)
 */
export async function POST(
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

    const wordpressUserId = parseInt(params.id)
    const { reason } = await request.json()

    const currentUser = await prisma.user.findFirst({
      where: { email: session.user.email || '', deletedAt: null }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const wpUserData = await wpUserService.getUser(wordpressUserId)

    let wpResponse
    try {
      wpResponse = await wpUserService.suspendUser(wordpressUserId, reason)

      if (!wpResponse.success) {
        return NextResponse.json({
          error: 'Error al suspender en WordPress',
          details: wpResponse
        }, { status: 500 })
      }
    } catch (wpError: any) {
      if (wpError.message?.includes('404') || wpError.message?.includes('not found')) {
        return NextResponse.json({
          error: 'El plugin de suspension no esta instalado en WordPress. Instala el codigo personalizado primero.',
          installationRequired: true
        }, { status: 424 })
      }
      throw wpError
    }

    const wpUser = await prisma.wordPressUser.upsert({
      where: { id: wordpressUserId },
      create: {
        id: wordpressUserId,
        email: wpUserData.email || `wp_user_${wordpressUserId}@temp.local`,
        username: wpUserData.username,
        name: wpUserData.name,
        isSuspended: true,
        suspendedBy: currentUser.id,
        suspendedAt: new Date(),
        suspensionReason: reason || 'Sin razon especificada',
        deletedAt: null,
      },
      update: {
        email: wpUserData.email || undefined,
        username: wpUserData.username || undefined,
        name: wpUserData.name || undefined,
        isSuspended: true,
        suspendedBy: currentUser.id,
        suspendedAt: new Date(),
        suspensionReason: reason || 'Sin razon especificada',
        deletedAt: null,
      },
    })

    await prisma.adminLog.create({
      data: {
        action: 'SUSPEND_USER',
        adminId: currentUser.id,
        adminEmail: currentUser.email,
        targetEmail: wpUserData.email || `wp_user_${wordpressUserId}`,
        targetName: wpUserData.name || '',
        details: {
          wordpressUserId,
          reason,
          wordpressResponse: wpResponse,
        },
      },
    })

    return NextResponse.json({
      success: true,
      user: wpUser,
      wordpress: wpResponse
    })
  } catch (error: any) {
    console.error('Error suspending user:', error)
    return NextResponse.json(
      { error: error.message || 'Error al suspender usuario' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/wordpress/users/[id]/suspend
 * Reactivar un usuario de WordPress suspendido
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

    const wordpressUserId = parseInt(params.id)

    const currentUser = await prisma.user.findFirst({
      where: { email: session.user.email || '', deletedAt: null }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const wpUserData = await wpUserService.getUser(wordpressUserId)

    let wpResponse
    try {
      wpResponse = await wpUserService.unsuspendUser(wordpressUserId)

      if (!wpResponse.success) {
        return NextResponse.json({
          error: 'Error al habilitar en WordPress',
          details: wpResponse
        }, { status: 500 })
      }
    } catch (wpError: any) {
      if (wpError.message?.includes('404') || wpError.message?.includes('not found')) {
        return NextResponse.json({
          error: 'El plugin de suspension no esta instalado en WordPress. Instala el codigo personalizado primero.',
          installationRequired: true
        }, { status: 424 })
      }
      throw wpError
    }

    const wpUser = await prisma.wordPressUser.upsert({
      where: { id: wordpressUserId },
      create: {
        id: wordpressUserId,
        email: wpUserData.email || `wp_user_${wordpressUserId}@temp.local`,
        username: wpUserData.username || null,
        name: wpUserData.name || null,
        isSuspended: false,
        suspendedBy: null,
        suspendedAt: null,
        suspensionReason: null,
        deletedAt: null,
      },
      update: {
        email: wpUserData.email || undefined,
        username: wpUserData.username || undefined,
        name: wpUserData.name || undefined,
        isSuspended: false,
        suspendedBy: null,
        suspendedAt: null,
        suspensionReason: null,
        deletedAt: null,
      },
    })

    await prisma.adminLog.create({
      data: {
        action: 'UNSUSPEND_USER',
        adminId: currentUser.id,
        adminEmail: currentUser.email,
        targetEmail: wpUserData.email || `wp_user_${wordpressUserId}`,
        targetName: wpUserData.name || '',
        details: {
          wordpressUserId,
          wordpressResponse: wpResponse,
        },
      },
    })

    return NextResponse.json({
      success: true,
      user: wpUser,
      wordpress: wpResponse
    })
  } catch (error: any) {
    console.error('Error unsuspending user:', error)
    return NextResponse.json(
      { error: error.message || 'Error al reactivar usuario' },
      { status: 500 }
    )
  }
}
