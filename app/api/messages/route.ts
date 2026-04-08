import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, getTicketReplyEmailTemplate } from '@/lib/email'
import { ticketEmitter } from '@/lib/sseEmitter'

function sendEmailInBackground(payload: Parameters<typeof sendEmail>[0]) {
  setTimeout(() => {
    sendEmail(payload).catch((error) => {
      console.error('Background email failed:', error)
    })
  }, 0)
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { ticketId, content, isInternal, type, replyToId, attachments } = await request.json()

    if (!ticketId || (!content?.trim() && !attachments?.length)) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      )
    }

    const message = await prisma.message.create({
      data: {
        content: content || '',
        isInternal: isInternal || false,
        type: type || 'COMMENT',
        ticketId,
        authorId: session.user.id,
        attachments: attachments || [],
        ...(replyToId ? { replyToId } : {}),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          }
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            author: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        ticket: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                emailNotifications: true,
              }
            }
          }
        }
      }
    })

    // Update ticket's updatedAt
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() }
    })

    // Emit SSE event to all connected clients for this ticket
    // Strip the nested ticket from the emitted message to keep payload small
    const { ticket: _ticket, ...messageForSSE } = message as any
    ticketEmitter.emit(`ticket:${ticketId}`, { type: 'message', message: messageForSSE })

    // Enviar email al cliente si no es mensaje interno y el cliente tiene notificaciones activadas
    if (!isInternal && message.ticket.customer.emailNotifications && message.author.role !== 'VIEWER' && message.author.role !== 'EDITOR') {
      const emailTemplate = getTicketReplyEmailTemplate({
        customerName: message.ticket.customer.name || message.ticket.customer.email,
        ticketIdentifier: message.ticket.ticketCode || `#${message.ticket.number}`,
        subject: message.ticket.subject,
        replyContent: content,
        agentName: message.author.name || message.author.email,
      })

      sendEmailInBackground({
        to: message.ticket.customer.email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      })
    }

    return NextResponse.json(messageForSSE, { status: 201 })
  } catch (error) {
    console.error('Error creating message:', error)
    return NextResponse.json(
      { error: 'Error al crear mensaje' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const ticketId = searchParams.get('ticketId')
    // `before` = ID del mensaje más antiguo que el cliente ya tiene (para cargar anteriores)
    const before = searchParams.get('before')
    const limitParam = searchParams.get('limit')
    const limit = Math.min(parseInt(limitParam || '50', 10), 100)

    if (!ticketId) {
      return NextResponse.json(
        { error: 'ticketId es requerido' },
        { status: 400 }
      )
    }

    const messageInclude = {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          role: true,
        }
      },
      replyTo: {
        select: {
          id: true,
          content: true,
          author: {
            select: { id: true, name: true, email: true }
          }
        }
      },
      reactions: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
        orderBy: {
          createdAt: 'asc' as const
        }
      }
    }

    if (before) {
      // Cargar mensajes anteriores al cursor dado (más antiguos)
      const pivot = await prisma.message.findUnique({
        where: { id: before },
        select: { createdAt: true }
      })
      if (!pivot) {
        return NextResponse.json({ messages: [], hasMore: false })
      }

      const older = await prisma.message.findMany({
        where: { ticketId, createdAt: { lt: pivot.createdAt } },
        include: messageInclude,
        orderBy: { createdAt: 'desc' },
        take: limit + 1,
      })

      const hasMore = older.length > limit
      const page = hasMore ? older.slice(0, limit) : older
      // Devolver en orden cronológico ascendente
      return NextResponse.json({ messages: page.reverse(), hasMore })
    }

    // Sin cursor: devolver los últimos N mensajes en orden ascendente
    const newest = await prisma.message.findMany({
      where: { ticketId },
      include: messageInclude,
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
    })

    const hasMore = newest.length > limit
    const page = hasMore ? newest.slice(0, limit) : newest
    return NextResponse.json({ messages: page.reverse(), hasMore })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Error al obtener mensajes' },
      { status: 500 }
    )
  }
}
