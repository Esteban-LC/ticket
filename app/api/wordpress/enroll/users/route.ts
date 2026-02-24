import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { wpUserService } from '@/lib/wordpress/users'
import { prisma } from '@/lib/prisma'

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

    let users: WPUser[] = []
    let totalFiltered = 0
    let totalGlobal = 0

    if (!search) {
      const [fetchedUsers, total] = await Promise.all([
        wpUserService.getUsers({ page, per_page }),
        wpUserService.getUsersCount(),
      ])
      users = fetchedUsers
      totalFiltered = total
      totalGlobal = total
    } else {
      const [fetchedUsers, filteredCount, globalCount] = await Promise.all([
        wpUserService.getUsers({ page, per_page, search }),
        wpUserService.getUsersCount({ search }),
        wpUserService.getUsersCount(),
      ])
      users = fetchedUsers
      totalFiltered = filteredCount
      totalGlobal = globalCount
    }

    const userIds = users.map((u) => u.id)
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

    const usersWithStatus = users.map((user) => {
      const suspended = suspendedUsers.find((s) => s.id === user.id)
      return {
        ...user,
        isSuspended: suspended?.isSuspended || false,
        suspendedBy: suspended?.suspendedBy,
        suspendedAt: suspended?.suspendedAt,
        suspensionReason: suspended?.suspensionReason,
      }
    })

    const has_more = usersWithStatus.length === per_page && page * per_page < totalFiltered

    return NextResponse.json({
      users: usersWithStatus,
      pagination: {
        page,
        per_page,
        total: totalFiltered,
        total_filtered: totalFiltered,
        total_global: totalGlobal,
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
