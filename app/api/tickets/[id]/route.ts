import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { rm } from 'fs/promises'
import path from 'path'
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
    const user = await prisma.user.findUnique({
      where: { email: session.user.email || '' },
      select: { id: true, role: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: params.id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            phone: true,
            location: true,
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        messages: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket no encontrado' },
        { status: 404 }
      )
    }

    // EDITOR y VIEWER solo pueden ver sus propios tickets
    if ((user.role === 'EDITOR' || user.role === 'VIEWER') && ticket.customerId !== user.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      )
    }

    return NextResponse.json(ticket)
  } catch (error) {
    console.error('Error fetching ticket:', error)
    return NextResponse.json(
      { error: 'Error al obtener ticket' },
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
    const user = await prisma.user.findUnique({
      where: { email: session.user.email || '' },
      select: { id: true, role: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const body = await request.json()

    // Solo se permiten actualizar estos campos — nunca customerId, number, ticketCode, etc.
    const ALLOWED_FIELDS = [
      'status', 'priority', 'assigneeId', 'categoryId',
      'pinnedMessageId', 'subject', 'description', 'type',
      'typeOther', 'requestedBy', 'requesterArea',
      'requesterResponsible', 'hours', 'tags',
    ] as const

    const data: Record<string, unknown> = {}
    for (const field of ALLOWED_FIELDS) {
      if (field in body) data[field] = body[field]
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'Sin campos válidos para actualizar' }, { status: 400 })
    }

    // Solo COORDINATOR+ puede cambiar estado o asignado
    if (
      (data.status !== undefined || data.assigneeId !== undefined) &&
      user.role !== 'ADMIN' &&
      user.role !== 'COORDINATOR'
    ) {
      // Permitir a EDITOR/VIEWER cerrar su propio ticket
      const ticketOwner = await prisma.ticket.findUnique({
        where: { id: params.id },
        select: { customerId: true, status: true }
      })
      const isClosingOwnTicket =
        ticketOwner?.customerId === user.id &&
        data.status === 'CLOSED' &&
        Object.keys(data).length === 1

      if (!isClosingOwnTicket) {
        return NextResponse.json({ error: 'No autorizado para esta acción' }, { status: 403 })
      }
    }

    // Obtener el ticket actual para comparar el estado
    const currentTicket = await prisma.ticket.findUnique({
      where: { id: params.id },
      select: { status: true }
    })

    const ticket = await prisma.ticket.update({
      where: { id: params.id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          }
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })

    // Si cambió el estado, crear un mensaje de log
    if (typeof data.status === 'string' && currentTicket && currentTicket.status !== data.status) {
      const statusLabels: { [key: string]: string } = {
        OPEN: 'Abierto',
        IN_PROGRESS: 'En progreso',
        ON_HOLD: 'En espera',
        RESOLVED: 'Resuelto',
        CLOSED: 'Cerrado'
      }

      const oldStatusLabel = statusLabels[currentTicket.status] || currentTicket.status
      const newStatusLabel = statusLabels[data.status] || data.status

      await prisma.message.create({
        data: {
          ticketId: params.id,
          authorId: session.user.id,
          content: `Estado cambiado de **${oldStatusLabel}** a **${newStatusLabel}**`,
          type: 'SYSTEM',
          isInternal: false
        }
      })
    }

    return NextResponse.json(ticket)
  } catch (error) {
    console.error('Error updating ticket:', error)
    return NextResponse.json(
      { error: 'Error al actualizar ticket' },
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
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email || '' },
      select: { id: true, role: true, permissions: true }
    })

    if (!user || (user.role !== 'COORDINATOR' && !user.permissions.includes('tickets:coordinator'))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    await prisma.ticket.delete({ where: { id: params.id } })

    const ticketUploadsDir = path.join(process.cwd(), 'public', 'uploads', 'tickets', params.id)
    await rm(ticketUploadsDir, { recursive: true, force: true }).catch((error) => {
      console.warn('No se pudo eliminar la carpeta local del ticket:', ticketUploadsDir, error)
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting ticket:', error)
    return NextResponse.json({ error: 'Error al eliminar ticket' }, { status: 500 })
  }
}
