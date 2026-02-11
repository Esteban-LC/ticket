import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/resultados/[id] - Actualizar resultado
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, role: true }
        })

        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
        }

        // VIEWER no puede editar
        if (user.role === 'VIEWER') {
            return NextResponse.json({ error: 'No tienes permisos para editar' }, { status: 403 })
        }

        const existing = await prisma.resultItem.findUnique({
            where: { id: params.id }
        })

        if (!existing) {
            return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 })
        }

        if (existing.userId !== user.id && user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
        }

        const body = await request.json()
        const item = await prisma.resultItem.update({
            where: { id: params.id },
            data: {
                product: body.product,
                project: body.project,
                description: body.description,
                status: body.status,
                observations: body.observations,
            },
            include: {
                user: { select: { id: true, name: true, email: true } }
            }
        })

        return NextResponse.json(item)
    } catch (error) {
        console.error('Error al actualizar resultado:', error)
        return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
    }
}

// DELETE /api/resultados/[id] - Eliminar resultado
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, role: true }
        })

        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
        }

        // VIEWER no puede eliminar
        if (user.role === 'VIEWER') {
            return NextResponse.json({ error: 'No tienes permisos para eliminar' }, { status: 403 })
        }

        const existing = await prisma.resultItem.findUnique({
            where: { id: params.id }
        })

        if (!existing) {
            return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 })
        }

        if (existing.userId !== user.id && user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
        }

        await prisma.resultItem.delete({ where: { id: params.id } })

        return NextResponse.json({ message: 'Eliminado' })
    } catch (error) {
        console.error('Error al eliminar resultado:', error)
        return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
    }
}
