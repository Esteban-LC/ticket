import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const eventUpdateSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional().nullable(),
    allDay: z.boolean().optional(),
    color: z.string().optional(),
    type: z.enum(['TASK', 'MEETING', 'DEADLINE', 'REMINDER', 'MAINTENANCE']).optional(),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
    ticketId: z.string().optional().nullable(),
})

// GET /api/events/[id] - Obtener evento específico
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const event = await prisma.event.findUnique({
            where: { id: params.id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    }
                },
                ticket: {
                    select: {
                        id: true,
                        number: true,
                        subject: true,
                        status: true,
                    }
                }
            }
        })

        if (!event) {
            return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
        }

        return NextResponse.json(event)
    } catch (error) {
        console.error('Error al obtener evento:', error)
        return NextResponse.json(
            { error: 'Error al obtener evento' },
            { status: 500 }
        )
    }
}

// PATCH /api/events/[id] - Actualizar evento
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

        // Verificar que el evento existe
        const existingEvent = await prisma.event.findUnique({
            where: { id: params.id }
        })

        if (!existingEvent) {
            return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
        }

        // Verificar permisos (solo el creador o admin puede editar)
        if (existingEvent.userId !== user.id && user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
        }

        const body = await request.json()
        const validatedData = eventUpdateSchema.parse(body)

        // Preparar datos para actualizar
        const updateData: any = {}

        if (validatedData.title !== undefined) updateData.title = validatedData.title
        if (validatedData.description !== undefined) updateData.description = validatedData.description
        if (validatedData.startDate !== undefined) updateData.startDate = new Date(validatedData.startDate)
        if (validatedData.endDate !== undefined) {
            updateData.endDate = validatedData.endDate ? new Date(validatedData.endDate) : null
        }
        if (validatedData.allDay !== undefined) updateData.allDay = validatedData.allDay
        if (validatedData.color !== undefined) updateData.color = validatedData.color
        if (validatedData.type !== undefined) updateData.type = validatedData.type
        if (validatedData.status !== undefined) updateData.status = validatedData.status
        if (validatedData.ticketId !== undefined) updateData.ticketId = validatedData.ticketId

        const event = await prisma.event.update({
            where: { id: params.id },
            data: updateData,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    }
                },
                ticket: {
                    select: {
                        id: true,
                        number: true,
                        subject: true,
                        status: true,
                    }
                }
            }
        })

        return NextResponse.json(event)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Datos inválidos', details: error.errors },
                { status: 400 }
            )
        }
        console.error('Error al actualizar evento:', error)
        return NextResponse.json(
            { error: 'Error al actualizar evento' },
            { status: 500 }
        )
    }
}

// DELETE /api/events/[id] - Eliminar evento
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

        // Verificar que el evento existe
        const existingEvent = await prisma.event.findUnique({
            where: { id: params.id }
        })

        if (!existingEvent) {
            return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
        }

        // Verificar permisos (solo el creador o admin puede eliminar)
        if (existingEvent.userId !== user.id && user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
        }

        await prisma.event.delete({
            where: { id: params.id }
        })

        return NextResponse.json({ message: 'Evento eliminado correctamente' })
    } catch (error) {
        console.error('Error al eliminar evento:', error)
        return NextResponse.json(
            { error: 'Error al eliminar evento' },
            { status: 500 }
        )
    }
}
