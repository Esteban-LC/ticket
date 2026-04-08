import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { wpUserService } from '@/lib/wordpress/users'
import { prisma } from '@/lib/prisma'
import { canManageTuitionStatus, canViewWordPressUsers } from '@/lib/permissions'
import { getRecentEntityAuditEntries } from '@/lib/audit-log'
import { getEffectiveSuspensionState, syncWordPressSuspensionState } from '@/lib/wordpress/suspension-sync'

function normalizeText(value: string | null | undefined) {
  return value?.trim().toLowerCase() || ''
}

function userMatchesSearch(user: {
  username?: string
  name?: string
  email?: string
}, search?: string) {
  const query = normalizeText(search)

  if (!query) {
    return true
  }

  return [user.username, user.name, user.email].some((value) => normalizeText(value).includes(query))
}

/**
 * GET /api/wordpress/users
 * Obtener lista de usuarios de WordPress
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permisos
    const userPermissions = (session.user as any).permissions || []
    if (!canViewWordPressUsers({ role: session.user.role, permissions: userPermissions }) &&
      !canManageTuitionStatus({ role: session.user.role, permissions: userPermissions })) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const per_page = parseInt(searchParams.get('per_page') || '10')
    const search = searchParams.get('search') || undefined
    const role = searchParams.get('role') || undefined
    const status = searchParams.get('status') || undefined

    let usersWithSuspension

    if (status === 'suspended') {
      const { users: suspendedUsers } = await wpUserService.getSuspendedUsers()
      const filteredSuspendedUsers = suspendedUsers.filter((user) => {
        if (role && !user.roles?.includes(role)) {
          return false
        }

        return userMatchesSearch(user, search)
      })

      const start = Math.max(0, (page - 1) * per_page)
      const end = start + per_page

      usersWithSuspension = filteredSuspendedUsers.slice(start, end).map((user) => ({
        ...user,
        is_suspended: true,
        suspension_reason: user.suspension_reason ?? null,
        suspended_at: user.suspended_at ?? null,
      }))
    } else {
      const users = await wpUserService.getUsers({
        page,
        per_page,
        search: search?.trim() || undefined,
        roles: role ? [role] : undefined,
      })

      usersWithSuspension = await Promise.all(
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
    }

    await syncWordPressSuspensionState(usersWithSuspension)

    // Obtener estado de suspensión de la base de datos local
    const userIds = usersWithSuspension.map(u => u.id)
    const suspendedUsers = await prisma.wordPressUser.findMany({
      where: {
        id: { in: userIds },
        deletedAt: null,
      },
      select: {
        id: true,
        isSuspended: true,
        suspendedBy: true,
        suspendedAt: true,
        suspensionReason: true,
        paymentStatus: true,
        paymentNotes: true,
        paymentUpdatedAt: true,
        paymentUpdatedBy: true,
      },
    })
    const suspendedUsersMap = new Map(suspendedUsers.map((user) => [user.id, user]))

    const recentActions = await getRecentEntityAuditEntries('WORDPRESS_USER', 20)

    // Combinar datos
    const usersWithStatus = usersWithSuspension.map(user => {
      const suspended = suspendedUsersMap.get(user.id)
      const userActions = recentActions.filter((entry) => entry.entityId === String(user.id))
      const createdEntry = userActions.find((entry) => entry.event === 'created')
      const suspendedEntry = userActions.find((entry) => entry.event === 'suspended')
      const effectiveSuspension = getEffectiveSuspensionState(user, suspended)
      return {
        ...user,
        isSuspended: effectiveSuspension.isSuspended,
        suspendedBy: effectiveSuspension.suspendedBy,
        suspendedAt: effectiveSuspension.suspendedAt,
        suspensionReason: effectiveSuspension.suspensionReason,
        paymentStatus: suspended?.paymentStatus || 'CURRENT',
        paymentNotes: suspended?.paymentNotes || null,
        paymentUpdatedAt: suspended?.paymentUpdatedAt || null,
        paymentUpdatedBy: suspended?.paymentUpdatedBy || null,
        createdByName: createdEntry?.actorEmail || null,
        suspendedByName: suspendedEntry?.actorEmail || null,
      }
    })

    return NextResponse.json({ users: usersWithStatus, recentActions })
  } catch (error: any) {
    console.error('Error fetching WordPress users:', error)
    return NextResponse.json(
      { error: error.message || 'Error al obtener usuarios' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/wordpress/users
 * Crear un nuevo usuario en WordPress
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permisos
    const userPermissions = (session.user as any).permissions || []
    if (!userPermissions.includes('wordpress:manage_users') && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }

    const data = await request.json()

    const newUser = await wpUserService.createUser({
      username: data.username,
      email: data.email,
      password: data.password,
      first_name: data.first_name,
      last_name: data.last_name,
      name: data.name || `${data.first_name} ${data.last_name}`,
      roles: data.roles || ['subscriber'],
      description: data.description,
    })

    return NextResponse.json({ user: newUser }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating WordPress user:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear usuario' },
      { status: 500 }
    )
  }
}
