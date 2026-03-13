import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function agendaStatusToEventStatus(status: string): string {
    switch (status) {
        case 'En Proceso': return 'IN_PROGRESS'
        case 'Completado': return 'COMPLETED'
        default: return 'PENDING'
    }
}

// PATCH /api/agenda/[id] - Actualizar item
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

        // Verificar que el item existe y pertenece al usuario
        const existing = await prisma.agendaItem.findUnique({
            where: { id: params.id }
        })

        if (!existing) {
            return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 })
        }

        if (existing.userId !== user.id && user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
        }

        const body = await request.json()
        const { project, subproject, deliverable, link, responsible, date, status, observations } = body

        // Sincronizar evento en cronograma
        let eventId = existing.eventId
        const eventTitle = deliverable ? `${project} - ${deliverable}` : project
        const eventDescription = [subproject, observations].filter(Boolean).join(' | ') || undefined
        const eventStatus = agendaStatusToEventStatus(status || 'Stand by')

        if (date) {
            const parsedDate = new Date(date)
            if (!isNaN(parsedDate.getTime())) {
                if (eventId) {
                    // Actualizar evento existente
                    await prisma.event.update({
                        where: { id: eventId },
                        data: {
                            title: eventTitle,
                            description: eventDescription,
                            startDate: parsedDate,
                            status: eventStatus as any,
                        }
                    }).catch(() => { eventId = null }) // Si el evento fue eliminado, ignorar
                } else {
                    // Crear nuevo evento
                    const event = await prisma.event.create({
                        data: {
                            title: eventTitle,
                            description: eventDescription,
                            startDate: parsedDate,
                            allDay: true,
                            type: 'DEADLINE',
                            status: eventStatus as any,
                            color: '#f59e0b',
                            userId: user.id,
                        }
                    })
                    eventId = event.id
                }
            }
        } else if (eventId) {
            // Si se quitó la fecha, eliminar el evento vinculado
            await prisma.event.delete({ where: { id: eventId } }).catch(() => {})
            eventId = null
        }

        const item = await prisma.agendaItem.update({
            where: { id: params.id },
            data: {
                project,
                subproject,
                deliverable,
                link,
                responsible,
                date,
                status,
                observations,
                eventId,
            },
            include: {
                user: { select: { id: true, name: true, email: true } }
            }
        })

        return NextResponse.json(item)
    } catch (error) {
        console.error('Error al actualizar item:', error)
        return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
    }
}

// DELETE /api/agenda/[id] - Eliminar item
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

        const existing = await prisma.agendaItem.findUnique({
            where: { id: params.id }
        })

        if (!existing) {
            return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 })
        }

        if (existing.userId !== user.id && user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
        }

        // Eliminar evento vinculado en cronograma si existe
        if (existing.eventId) {
            await prisma.event.delete({ where: { id: existing.eventId } }).catch(() => {})
        }

        await prisma.agendaItem.delete({ where: { id: params.id } })

        return NextResponse.json({ message: 'Eliminado' })
    } catch (error) {
        console.error('Error al eliminar item:', error)
        return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
    }
}
