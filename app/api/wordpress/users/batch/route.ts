import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { wpUserService } from '@/lib/wordpress/users'
import { getSessionAuditActor, logEntityAudit } from '@/lib/audit-log'

type BatchAction = 'suspend' | 'unsuspend' | 'delete' | 'create'

function normalizeIds(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return Array.from(
    new Set(
      value
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0)
    )
  )
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userPermissions = (session.user as any).permissions || []
    if (!userPermissions.includes('wordpress:manage_users') && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }

    const body = await request.json()
    const action = String(body?.action || '') as BatchAction

    if (!['suspend', 'unsuspend', 'delete', 'create'].includes(action)) {
      return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
    }

    const currentUser = await getSessionAuditActor(session)

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    if (action === 'create') {
      const users = Array.isArray(body?.users) ? body.users : []
      if (!users.length) {
        return NextResponse.json({ error: 'users debe ser un arreglo no vacío' }, { status: 400 })
      }

      const result = await wpUserService.createUsersBatch(users)

      const successUsers = result.results.filter((r) => r.success && r.user_id)
      for (const created of successUsers) {
        if (!created.user_id) continue
        const updateData: Record<string, any> = { isSuspended: false, deletedAt: null }
        if (created.email) updateData.email = created.email
        if (created.username) updateData.username = created.username
        if (created.username) updateData.name = created.username

        await prisma.wordPressUser.upsert({
          where: { id: created.user_id },
          create: {
            id: created.user_id,
            email: created.email || `wp_user_${created.user_id}@temp.local`,
            username: created.username || null,
            name: created.username || null,
            isSuspended: false,
            deletedAt: null,
          },
          update: updateData,
        })

        await logEntityAudit({
          adminId: currentUser.id,
          adminEmail: currentUser.email,
          targetEmail: created.email || `wp_user_${created.user_id}@temp.local`,
          targetName: created.username || null,
          entity: 'WORDPRESS_USER',
          entityId: String(created.user_id),
          event: 'created',
          details: {
            username: created.username || null,
            email: created.email || null,
            mode: users.length > 1 ? 'bulk' : 'single',
          },
        })
      }

      await prisma.adminLog.create({
        data: {
          action: 'CREATE_USER',
          adminId: currentUser.id,
          adminEmail: currentUser.email,
          targetEmail: 'batch',
          targetName: 'WordPress Batch Create',
          details: {
            batch: true,
            summary: result.summary,
          },
        },
      })

      return NextResponse.json(result)
    }

    const userIds = normalizeIds(body?.userIds)
    if (!userIds.length) {
      return NextResponse.json({ error: 'userIds debe ser un arreglo no vacío' }, { status: 400 })
    }

    let result
    if (action === 'suspend') {
      result = await wpUserService.suspendUsersBatch(userIds, body?.reason || '')
      const successIds = result.results.filter((r) => r.success && r.user_id).map((r) => Number(r.user_id))

      for (const userId of successIds) {
        const wpUser = await wpUserService.getUser(userId)
        const updateData: Record<string, any> = {
          isSuspended: true,
          deletedAt: null,
          suspendedBy: currentUser.id,
          suspendedAt: new Date(),
          suspensionReason: body?.reason || 'Sin razón especificada',
        }
        if (wpUser.email) updateData.email = wpUser.email
        if (wpUser.username) updateData.username = wpUser.username
        if (wpUser.name) updateData.name = wpUser.name

        await prisma.wordPressUser.upsert({
          where: { id: userId },
          create: {
            id: userId,
            email: wpUser.email || `wp_user_${userId}@temp.local`,
            username: wpUser.username || null,
            name: wpUser.name || null,
            isSuspended: true,
            deletedAt: null,
            suspendedBy: currentUser.id,
            suspendedAt: new Date(),
            suspensionReason: body?.reason || 'Sin razón especificada',
          },
          update: updateData,
        })

        await logEntityAudit({
          adminId: currentUser.id,
          adminEmail: currentUser.email,
          targetEmail: wpUser.email || `wp_user_${userId}@temp.local`,
          targetName: wpUser.name || wpUser.username || null,
          entity: 'WORDPRESS_USER',
          entityId: String(userId),
          event: 'suspended',
          details: {
            reason: body?.reason || '',
            mode: 'bulk',
          },
        })
      }

      await prisma.adminLog.create({
        data: {
          action: 'SUSPEND_USER',
          adminId: currentUser.id,
          adminEmail: currentUser.email,
          targetEmail: 'batch',
          targetName: 'WordPress Batch Suspend',
          details: {
            batch: true,
            userIds,
            reason: body?.reason || '',
            summary: result.summary,
          },
        },
      })
    } else if (action === 'unsuspend') {
      result = await wpUserService.unsuspendUsersBatch(userIds)
      const successIds = result.results.filter((r) => r.success && r.user_id).map((r) => Number(r.user_id))

      if (successIds.length > 0) {
        await prisma.wordPressUser.updateMany({
          where: { id: { in: successIds }, deletedAt: null },
          data: {
            isSuspended: false,
            suspendedBy: null,
            suspendedAt: null,
            suspensionReason: null,
          },
        })

        const localUsers = await prisma.wordPressUser.findMany({
          where: { id: { in: successIds } },
          select: { id: true, email: true, name: true, username: true },
        })

        await Promise.all(
          localUsers.map((user) =>
            logEntityAudit({
              adminId: currentUser.id,
              adminEmail: currentUser.email,
              targetEmail: user.email,
              targetName: user.name || user.username || null,
              entity: 'WORDPRESS_USER',
              entityId: String(user.id),
              event: 'unsuspended',
              details: {
                mode: 'bulk',
              },
            })
          )
        )
      }

      await prisma.adminLog.create({
        data: {
          action: 'UNSUSPEND_USER',
          adminId: currentUser.id,
          adminEmail: currentUser.email,
          targetEmail: 'batch',
          targetName: 'WordPress Batch Unsuspend',
          details: {
            batch: true,
            userIds,
            summary: result.summary,
          },
        },
      })
    } else {
      const reassign = Number(body?.reassign || 0)
      result = await wpUserService.deleteUsersBatch(userIds, reassign > 0 ? reassign : undefined)
      const successIds = result.results.filter((r) => r.success && r.user_id).map((r) => Number(r.user_id))

      if (successIds.length > 0) {
        for (const userId of successIds) {
          const localUser = await prisma.wordPressUser.findFirst({
            where: { id: userId, deletedAt: null },
            select: { id: true },
          })

          if (!localUser) continue

          const deletedSuffix = Date.now()
          const tombstoneEmail = `deleted+${deletedSuffix}.${localUser.id}@wp-deleted.local`

          await prisma.wordPressUser.update({
            where: { id: localUser.id },
            data: {
              deletedAt: new Date(),
              email: tombstoneEmail,
              isSuspended: false,
              suspendedBy: null,
              suspendedAt: null,
              suspensionReason: null,
            },
          })

          await logEntityAudit({
            adminId: currentUser.id,
            adminEmail: currentUser.email,
            targetEmail: tombstoneEmail,
            targetName: null,
            entity: 'WORDPRESS_USER',
            entityId: String(localUser.id),
            event: 'deleted',
            details: {
              mode: 'bulk',
              reassign: reassign > 0 ? reassign : null,
            },
          })
        }
      }

      await prisma.adminLog.create({
        data: {
          action: 'DELETE_USER',
          adminId: currentUser.id,
          adminEmail: currentUser.email,
          targetEmail: 'batch',
          targetName: 'WordPress Batch Delete',
          details: {
            batch: true,
            userIds,
            reassign: reassign > 0 ? reassign : null,
            summary: result.summary,
          },
        },
      })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error in WordPress users batch route:', error)
    return NextResponse.json(
      { error: error.message || 'Error en operación masiva de usuarios' },
      { status: 500 }
    )
  }
}
