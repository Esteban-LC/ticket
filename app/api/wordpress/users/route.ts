import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { wpUserService } from '@/lib/wordpress/users'
import { prisma } from '@/lib/prisma'

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
    if (
      !userPermissions.includes('wordpress:manage_users') &&
      !userPermissions.includes('wordpress:manage_enrollments') &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const per_page = parseInt(searchParams.get('per_page') || '10')
    const search = searchParams.get('search') || undefined
    const role = searchParams.get('role') || undefined

    const users = await wpUserService.getUsers({
      page,
      per_page,
      search: search?.trim() || undefined,
      roles: role ? [role] : undefined,
    })

    // Obtener estado de suspensión de la base de datos local
    const userIds = users.map(u => u.id)
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
      },
    })

    // Combinar datos
    const usersWithStatus = users.map(user => {
      const suspended = suspendedUsers.find(s => s.id === user.id)
      return {
        ...user,
        isSuspended: suspended?.isSuspended || false,
        suspendedBy: suspended?.suspendedBy,
        suspendedAt: suspended?.suspendedAt,
        suspensionReason: suspended?.suspensionReason,
      }
    })

    return NextResponse.json({ users: usersWithStatus })
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
