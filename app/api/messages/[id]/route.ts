import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { access, rm, unlink } from 'fs/promises'
import path from 'path'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ticketEmitter } from '@/lib/sseEmitter'
import { parseAttachmentRef } from '@/lib/attachments'

function getLocalAttachmentAbsolutePath(url: string) {
  if (!url.startsWith('/uploads/')) return null
  const relativePath = url.replace(/^\/+/, '')
  return path.join(process.cwd(), 'public', relativePath.replace(/^uploads[\\/]/, 'uploads/'))
}

async function cleanupLocalAttachments(rawAttachments: string[], deletedMessageId: string) {
  if (!rawAttachments.length) return

  await Promise.all(
    rawAttachments.map(async (rawAttachment) => {
      const attachment = parseAttachmentRef(rawAttachment)
      if (attachment.provider !== 'local') return

      const stillReferencedInMessages = await prisma.message.count({
        where: {
          id: { not: deletedMessageId },
          attachments: { has: rawAttachment },
        },
      })

      const stillReferencedInTickets = await prisma.ticket.count({
        where: {
          attachments: { has: rawAttachment },
        },
      })

      if (stillReferencedInMessages > 0 || stillReferencedInTickets > 0) {
        return
      }

      const absolutePath = getLocalAttachmentAbsolutePath(attachment.url)
      if (!absolutePath) return

      try {
        await access(absolutePath)
        await unlink(absolutePath)
        const parentDir = path.dirname(absolutePath)
        await rm(parentDir, { recursive: false }).catch(() => {})
      } catch (error) {
        console.warn('No se pudo limpiar el adjunto local eliminado:', absolutePath, error)
      }
    })
  )
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

    const message = await prisma.message.findUnique({
      where: { id: params.id },
      select: { id: true, authorId: true, type: true, ticketId: true, attachments: true }
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
    await cleanupLocalAttachments(message.attachments, message.id)

    // Notify other clients in real-time
    ticketEmitter.emit(`ticket:${message.ticketId}`, { type: 'delete', messageId: params.id })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting message:', error)
    return NextResponse.json({ error: 'Error al eliminar mensaje' }, { status: 500 })
  }
}
