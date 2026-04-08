import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ticketEmitter } from '@/lib/sseEmitter'

const ALLOWED_EMOJIS = [
  String.fromCodePoint(0x1F44D),
  '\u2764\uFE0F',
  String.fromCodePoint(0x1F602),
  String.fromCodePoint(0x1F62E),
  String.fromCodePoint(0x1F622),
  String.fromCodePoint(0x1F64F),
  String.fromCodePoint(0x1F525),
  String.fromCodePoint(0x1F389),
  String.fromCodePoint(0x1F44F),
  String.fromCodePoint(0x1F914),
  String.fromCodePoint(0x1F60E),
  String.fromCodePoint(0x1F62D),
  String.fromCodePoint(0x1F631),
  String.fromCodePoint(0x1F44C),
  String.fromCodePoint(0x1F680),
  String.fromCodePoint(0x1F4AA),
  String.fromCodePoint(0x1F91D),
  String.fromCodePoint(0x1F4AF),
  String.fromCodePoint(0x1F60A),
  String.fromCodePoint(0x1F601),
  String.fromCodePoint(0x1F923),
  String.fromCodePoint(0x1F60D),
  String.fromCodePoint(0x1F970),
  String.fromCodePoint(0x1F609),
  String.fromCodePoint(0x1F618),
  String.fromCodePoint(0x1F62C),
  String.fromCodePoint(0x1F61B),
  String.fromCodePoint(0x1F928),
  String.fromCodePoint(0x1F644),
  String.fromCodePoint(0x1F62A),
  String.fromCodePoint(0x1F60F),
  String.fromCodePoint(0x1F973),
  String.fromCodePoint(0x1F4A1),
  String.fromCodePoint(0x1F64C),
  String.fromCodePoint(0x1F44B),
  String.fromCodePoint(0x1F31F),
  String.fromCodePoint(0x1F381),
  String.fromCodePoint(0x1F3AF),
  String.fromCodePoint(0x1F984),
  String.fromCodePoint(0x1F42F),
  String.fromCodePoint(0x1F436),
  String.fromCodePoint(0x1F431),
  String.fromCodePoint(0x1F308),
  String.fromCodePoint(0x1F49B),
  String.fromCodePoint(0x1F49A),
  String.fromCodePoint(0x1F499),
  String.fromCodePoint(0x1F49C),
  String.fromCodePoint(0x1F9E1),
  String.fromCodePoint(0x1F497),
  String.fromCodePoint(0x1F496),
  String.fromCodePoint(0x1F495),
  String.fromCodePoint(0x1F48B),
  String.fromCodePoint(0x1F444),
  String.fromCodePoint(0x1F445),
  String.fromCodePoint(0x1FAC0),
  String.fromCodePoint(0x1FAC1),
  String.fromCodePoint(0x1FA78),
  String.fromCodePoint(0x1F443),
  String.fromCodePoint(0x1F440),
  String.fromCodePoint(0x1F9E0),
  String.fromCodePoint(0x1F9B7),
  String.fromCodePoint(0x1F9B4),
  String.fromCodePoint(0x1F9B5),
  String.fromCodePoint(0x1F9B6),
  String.fromCodePoint(0x1F44E),
  String.fromCodePoint(0x1F590),
  String.fromCodePoint(0x1F596),
  String.fromCodePoint(0x1F918),
  String.fromCodePoint(0x1F91F),
  String.fromCodePoint(0x270C),
  String.fromCodePoint(0x1FAF6),
  String.fromCodePoint(0x1FAF0),
  String.fromCodePoint(0x1F64B),
  String.fromCodePoint(0x1F91A),
  String.fromCodePoint(0x1F44A),
  String.fromCodePoint(0x1F91B),
  String.fromCodePoint(0x1F91C),
]

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { emoji } = await request.json()

    if (!emoji || !ALLOWED_EMOJIS.includes(emoji)) {
      return NextResponse.json({ error: 'Reaccion no valida' }, { status: 400 })
    }

    const message = await prisma.message.findUnique({
      where: { id: params.id },
      select: { id: true, ticketId: true },
    })

    if (!message) {
      return NextResponse.json({ error: 'Mensaje no encontrado' }, { status: 404 })
    }

    const existingReaction = await prisma.messageReaction.findUnique({
      where: {
        messageId_userId: {
          messageId: params.id,
          userId: session.user.id,
        }
      }
    })

    if (!existingReaction) {
      await prisma.messageReaction.create({
        data: {
          messageId: params.id,
          userId: session.user.id,
          emoji,
        }
      })
    } else if (existingReaction.emoji === emoji) {
      await prisma.messageReaction.delete({
        where: { id: existingReaction.id }
      })
    } else {
      await prisma.messageReaction.update({
        where: { id: existingReaction.id },
        data: { emoji }
      })
    }

    const reactions = await prisma.messageReaction.findMany({
      where: { messageId: params.id },
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
    })

    ticketEmitter.emit(`ticket:${message.ticketId}`, {
      type: 'reaction',
      messageId: params.id,
      reactions,
    })

    return NextResponse.json({ success: true, reactions })
  } catch (error) {
    console.error('Error updating reaction:', error)
    return NextResponse.json({ error: 'Error al actualizar reaccion' }, { status: 500 })
  }
}




