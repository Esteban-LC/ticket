import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { wpUserService } from '@/lib/wordpress/users'
import { prisma } from '@/lib/prisma'
import { getEffectiveSuspensionState, syncWordPressSuspensionState } from '@/lib/wordpress/suspension-sync'

type WPUser = {
  id: number
  username?: string
  name?: string
  email?: string
  first_name?: string
  last_name?: string
  nickname?: string
  slug?: string
  [key: string]: any
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const userPermissions = (session.user as any).permissions || []
    if (
      !userPermissions.includes('wordpress:manage_users') &&
      !userPermissions.includes('wordpress:manage_enrollments') &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const per_page = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || '25', 10)))
    const rawSearch = (searchParams.get('search') || '').trim()
    const search = rawSearch || undefined

    const users = await wpUserService.getUsers({
      page,
      per_page: per_page + 1,
      ...(search ? { search } : {}),
    })
    const usersWithSuspension = await Promise.all(
      users.map(async (user) => {
        const suspensionStatus = await wpUserService.getSuspensionStatus(user.id).catch(() => null)
        return {
          ...user,
          is_suspended: suspensionStatus?.suspended ?? user.is_suspended,
          suspension_reason: suspensionStatus?.reason ?? user.suspension_reason,
          suspended_at: suspensionStatus?.suspended_at ?? user.suspended_at,
        }
      })
    )
    await syncWordPressSuspensionState(usersWithSuspension)
    const has_more = usersWithSuspension.length > per_page
    const visibleUsers = has_more ? usersWithSuspension.slice(0, per_page) : usersWithSuspension

    const userIds = visibleUsers.map((u) => u.id)
    const suspendedUsers = await prisma.wordPressUser.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        isSuspended: true,
        suspendedBy: true,
        suspendedAt: true,
        suspensionReason: true,
      },
    })

    const usersWithStatus = visibleUsers.map((user) => {
      const suspended = suspendedUsers.find((s) => s.id === user.id)
      const effectiveSuspension = getEffectiveSuspensionState(user, suspended)
      return {
        ...user,
        isSuspended: effectiveSuspension.isSuspended,
        suspendedBy: effectiveSuspension.suspendedBy,
        suspendedAt: effectiveSuspension.suspendedAt,
        suspensionReason: effectiveSuspension.suspensionReason,
      }
    })

    return NextResponse.json({
      users: usersWithStatus,
      pagination: {
        page,
        per_page,
        has_more,
      },
    })
  } catch (error: any) {
    console.error('Error fetching enroll users:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener usuarios para matrícula' },
      { status: 500 }
    )
  }
}
