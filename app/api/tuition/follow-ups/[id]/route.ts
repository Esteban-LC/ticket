import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { canManageTuitionStatus } from '@/lib/permissions'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const currentUser = await prisma.user.findFirst({
      where: { email: session.user.email, deletedAt: null },
      select: { id: true, email: true, role: true, permissions: true },
    })

    if (!canManageTuitionStatus(currentUser)) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }

    const body = await request.json()
    const action = String(body?.action || '').toLowerCase()
    const id = params.id

    const existing = await prisma.tuitionFollowUp.findFirst({
      where: { id, deletedAt: null },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 })
    }

    let item

    if (action === 'complete') {
      item = await prisma.tuitionFollowUp.update({
        where: { id },
        data: {
          completedAt: new Date(),
          completedById: currentUser?.id || null,
          completedByEmail: currentUser?.email || session.user.email || null,
        },
      })
    } else if (action === 'reopen') {
      item = await prisma.tuitionFollowUp.update({
        where: { id },
        data: {
          completedAt: null,
          completedById: null,
          completedByEmail: null,
        },
      })
    } else {
      return NextResponse.json({ error: 'Accion invalida' }, { status: 400 })
    }

    return NextResponse.json({ item })
  } catch (error: any) {
    console.error('Error updating tuition follow-up:', error)
    return NextResponse.json({ error: error.message || 'Error al actualizar seguimiento' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const currentUser = await prisma.user.findFirst({
      where: { email: session.user.email, deletedAt: null },
      select: { id: true, email: true, role: true, permissions: true },
    })

    if (!canManageTuitionStatus(currentUser)) {
      return NextResponse.json({ error: 'Sin permisos suficientes' }, { status: 403 })
    }

    const id = params.id

    const existing = await prisma.tuitionFollowUp.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Registro no encontrado' }, { status: 404 })
    }

    await prisma.tuitionFollowUp.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting tuition follow-up:', error)
    return NextResponse.json({ error: error.message || 'Error al eliminar seguimiento' }, { status: 500 })
  }
}
