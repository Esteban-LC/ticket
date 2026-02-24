import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
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
    const user = await prisma.user.findFirst({
      where: { email: session.user.email || '', deletedAt: null },
      select: { id: true, email: true, role: true }
    })

    // Solo ADMIN pueden ver customers
    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403 }
      )
    }

    const customer = await prisma.user.findFirst({
      where: { 
        id: params.id,
        role: 'VIEWER',
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        location: true,
        address: true,
        createdAt: true,
      }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { error: 'Error al obtener cliente' },
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
    const user = await prisma.user.findFirst({
      where: { email: session.user.email || '', deletedAt: null },
      select: { id: true, email: true, role: true }
    })

    // Solo ADMIN pueden editar customers
    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403 }
      )
    }

    const data = await request.json()

    const existingCustomer = await prisma.user.findFirst({
      where: {
        id: params.id,
        role: 'VIEWER',
        deletedAt: null,
      },
      select: { id: true },
    })

    if (!existingCustomer) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    const customer = await prisma.user.update({
      where: { id: existingCustomer.id },
      data: {
        name: data.name,
        phone: data.phone,
        location: data.location,
        address: data.address,
        emailNotifications: data.emailNotifications,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        location: true,
        address: true,
        emailNotifications: true,
      }
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { error: 'Error al actualizar cliente' },
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
    const user = await prisma.user.findFirst({
      where: { email: session.user.email || '', deletedAt: null },
      select: { id: true, email: true, role: true }
    })

    // Solo ADMIN pueden eliminar customers
    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403 }
      )
    }

    const customerToDelete = await prisma.user.findFirst({
      where: {
        id: params.id,
        role: 'VIEWER',
        deletedAt: null,
      },
      select: { id: true, email: true, name: true },
    })

    if (!customerToDelete) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      )
    }

    const deletedSuffix = Date.now()
    const tombstoneEmail = `deleted+${deletedSuffix}.${customerToDelete.id}@deleted.local`

    await prisma.user.update({
      where: { id: customerToDelete.id },
      data: {
        deletedAt: new Date(),
        email: tombstoneEmail,
      }
    })

    await prisma.adminLog.create({
      data: {
        action: 'DELETE_USER',
        adminId: user.id,
        adminEmail: user.email,
        targetEmail: customerToDelete.email,
        targetName: customerToDelete.name || null,
        details: {
          softDelete: true,
          entity: 'CUSTOMER',
          userId: customerToDelete.id,
          tombstoneEmail,
        },
      },
    })

    return NextResponse.json({ message: 'Cliente eliminado' })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json(
      { error: 'Error al eliminar cliente' },
      { status: 500 }
    )
  }
}
