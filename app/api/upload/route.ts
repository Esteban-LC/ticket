import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import sharp from 'sharp'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Solo se permiten imágenes (JPG, PNG, GIF, WebP)' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Imagen demasiado grande (máx 10MB)' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const inputBuffer = Buffer.from(bytes)

    const outputBuffer = await sharp(inputBuffer)
      .webp({ quality: 82 })
      .toBuffer()

    const ext = '.webp'
    const filename = `${randomUUID()}${ext}`
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'messages')

    await mkdir(uploadDir, { recursive: true })
    await writeFile(path.join(uploadDir, filename), outputBuffer)

    return NextResponse.json({ url: `/uploads/messages/${filename}` })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ error: 'Error al subir archivo' }, { status: 500 })
  }
}
