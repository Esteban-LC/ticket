import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ticketEmitter } from '@/lib/sseEmitter'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const message = await prisma.message.findUnique({
      where: { id: params.id },
      select: { id: true, authorId: true, type: true, ticketId: true }
    })

    if (!message) {
      return NextResponse.json({ error: 'Mensaje no encontrado' }, { status: 404 })
    }

    if (message.authorId !== session.user.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    if (message.type === 'SYSTEM') {
      return NextResponse.json({ error: 'No se pueden eliminar mensajes del sistema' }, { status: 400 })
    }

    await prisma.message.delete({ where: { id: params.id } })

    // Notify other clients in real-time
    ticketEmitter.emit(`ticket:${message.ticketId}`, { type: 'delete', messageId: params.id })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting message:', error)
    return NextResponse.json({ error: 'Error al eliminar mensaje' }, { status: 500 })
  }
}
