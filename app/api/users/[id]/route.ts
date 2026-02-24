import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { name, email, password, role, location } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nombre, email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { email, deletedAt: null }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'El email ya está registrado' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'EDITOR',
        location,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener usuario con su rol
    const currentUser = await prisma.user.findFirst({
      where: { email: session.user.email || '', deletedAt: null },
      select: { role: true }
    })

    // Solo ADMIN puede editar usuarios
    if (currentUser?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403 }
      )
    }

    const data = await request.json()
    const { name, departmentId, password, permissions, role } = data

    const updateData: any = {
      name,
    }

    // Actualizar permisos si se proporcionan
    if (permissions !== undefined) {
      updateData.permissions = Array.isArray(permissions) ? permissions : []
    }

    // Actualizar rol si se proporciona
    if (role !== undefined) {
      const validRoles = ['ADMIN', 'COORDINATOR', 'EDITOR', 'VIEWER']
      if (validRoles.includes(role)) {
        updateData.role = role
      }
    }

    // Handle department assignment
    if (departmentId !== undefined) {
      updateData.departmentId = departmentId || null
    }

    // If password is provided, hash it
    if (password) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'La contraseña debe tener al menos 6 caracteres' },
          { status: 400 }
        )
      }
      updateData.password = await bcrypt.hash(password, 10)
    }

    const existingTarget = await prisma.user.findFirst({
      where: { id: params.id, deletedAt: null },
      select: { id: true },
    })

    if (!existingTarget) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    const user = await prisma.user.update({
      where: { id: existingTarget.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        department: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    // Obtener usuario con su rol
    const currentUser = await prisma.user.findFirst({
      where: { email: session.user.email || '', deletedAt: null },
      select: { id: true, email: true, role: true }
    })

    // Solo ADMIN puede eliminar usuarios
    if (currentUser?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403 }
      )
    }

    // Prevent users from deleting themselves
    if (params.id === currentUser.id) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia cuenta' },
        { status: 403 }
      )
    }

    const targetUser = await prisma.user.findFirst({
      where: { id: params.id, deletedAt: null },
      select: { id: true, email: true, name: true },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    const deletedSuffix = Date.now()
    const tombstoneEmail = `deleted+${deletedSuffix}.${targetUser.id}@deleted.local`

    await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        deletedAt: new Date(),
        email: tombstoneEmail,
      }
    })

    await prisma.adminLog.create({
      data: {
        action: 'DELETE_USER',
        adminId: currentUser.id,
        adminEmail: currentUser.email,
        targetEmail: targetUser.email,
        targetName: targetUser.name || null,
        details: {
          softDelete: true,
          entity: 'USER',
          userId: targetUser.id,
          tombstoneEmail,
        },
      },
    })

    return NextResponse.json({ message: 'Usuario eliminado' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Error al eliminar usuario' },
      { status: 500 }
    )
  }
}
