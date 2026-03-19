import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { serializeAttachmentRef } from '@/lib/attachments'

const MAX_SIZE = 100 * 1024 * 1024 // 100MB
const LOCAL_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'tickets')

function sanitizeFileBaseName(fileName: string) {
  const extension = path.extname(fileName)
  const baseName = path.basename(fileName, extension)
  return (baseName || 'archivo')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
    .slice(0, 80) || 'archivo'
}

async function optimizeImage(buffer: Buffer, mimeType: string, fileName: string) {
  const extension = path.extname(fileName).toLowerCase()
  const isAnimatedGif = mimeType === 'image/gif' || extension === '.gif'
  const isSvg = mimeType === 'image/svg+xml' || extension === '.svg'

  if (isAnimatedGif || isSvg) {
    return {
      buffer,
      mimeType: mimeType || 'application/octet-stream',
      fileName,
    }
  }

  try {
    const optimizedBuffer = await sharp(buffer)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 72, effort: 2 })
      .toBuffer()

    const baseName = sanitizeFileBaseName(fileName)
    return {
      buffer: optimizedBuffer,
      mimeType: 'image/webp',
      fileName: `${baseName}.webp`,
    }
  } catch (error) {
    console.warn('No se pudo optimizar la imagen, se guardara original:', error)
    return {
      buffer,
      mimeType: mimeType || 'application/octet-stream',
      fileName,
    }
  }
}

async function storeTicketAttachmentLocally(params: {
  ticketId: string
  buffer: Buffer
  fileName: string
  mimeType: string
  sourceKind: 'recording' | 'upload'
}) {
  const ticketDir = path.join(LOCAL_UPLOAD_DIR, params.ticketId)
  await mkdir(ticketDir, { recursive: true })

  const sourceIsImage = params.mimeType.startsWith('image/')
  const preparedFile = sourceIsImage
    ? await optimizeImage(params.buffer, params.mimeType, params.fileName)
    : {
        buffer: params.buffer,
        mimeType: params.mimeType || 'application/octet-stream',
        fileName: `${Date.now()}-${sanitizeFileBaseName(params.fileName)}${path.extname(params.fileName) || ''}`,
      }

  const safeBaseName = sanitizeFileBaseName(preparedFile.fileName)
  const extension = path.extname(preparedFile.fileName) || path.extname(params.fileName)
  const storedName = `${Date.now()}-${safeBaseName}${extension}`
  const absoluteFilePath = path.join(ticketDir, storedName)

  await writeFile(absoluteFilePath, preparedFile.buffer)

  const publicUrl = `/uploads/tickets/${params.ticketId}/${storedName}`

  return {
    provider: 'local' as const,
    sourceKind: params.sourceKind,
    url: publicUrl,
    previewUrl: publicUrl,
    downloadUrl: publicUrl,
    name: storedName,
    mimeType: preparedFile.mimeType,
    size: preparedFile.buffer.length,
  }
}

async function canAccessTicket(userId: string, userRole: string, ticketId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    select: {
      id: true,
      number: true,
      ticketCode: true,
      subject: true,
      customerId: true,
      assigneeId: true,
    },
  })

  if (!ticket) {
    return { allowed: false as const, ticket: null }
  }

  if (userRole === 'ADMIN' || userRole === 'COORDINATOR') {
    return { allowed: true as const, ticket }
  }

  if (ticket.customerId === userId || ticket.assigneeId === userId) {
    return { allowed: true as const, ticket }
  }

  return { allowed: false as const, ticket: null }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email || '' },
      select: { id: true, role: true },
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const ticketId = String(formData.get('ticketId') || '')
    const attachmentKind = formData.get('attachmentKind') === 'recording' ? 'recording' : 'upload'

    if (!ticketId) {
      return NextResponse.json({ error: 'ticketId es requerido' }, { status: 400 })
    }

    if (!file) {
      return NextResponse.json({ error: 'No se recibio archivo' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Archivo demasiado grande (max 100MB)' }, { status: 400 })
    }

    const access = await canAccessTicket(currentUser.id, currentUser.role, ticketId)
    if (!access.allowed || !access.ticket) {
      return NextResponse.json({ error: 'No autorizado para adjuntar archivos a este ticket' }, { status: 403 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const attachment = await storeTicketAttachmentLocally({
      ticketId: access.ticket.id,
      buffer,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      sourceKind: attachmentKind,
    })

    return NextResponse.json({
      attachment,
      serializedAttachment: serializeAttachmentRef(attachment),
    })
  } catch (error) {
    console.error('Error uploading file locally:', error)
    const message =
      error instanceof Error
        ? error.message
        : 'Error al subir archivo'

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
