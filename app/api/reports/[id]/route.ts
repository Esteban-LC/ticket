import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json()
    const { name, date, type, status, size, url, description } = body

    const report = await prisma.report.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(date !== undefined && { date }),
        ...(type !== undefined && { type }),
        ...(status !== undefined && { status }),
        ...(size !== undefined && { size }),
        ...(url !== undefined && { url }),
        ...(description !== undefined && { description }),
      },
    })

    return NextResponse.json(report)
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar reporte' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    await prisma.report.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar reporte' }, { status: 500 })
  }
}
