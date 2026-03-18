import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { emitResourceEvent } from '@/lib/resourceEvents'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getTodayDate() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function normalizeAgendaDate(value: unknown) {
    const normalized = typeof value === 'string' ? value.trim() : ''
    return normalized || getTodayDate()
}

function agendaStatusToEventStatus(status: string): string {
    switch (status) {
        case 'En Proceso': return 'IN_PROGRESS'
        case 'Completado': return 'COMPLETED'
        default: return 'PENDING'
    }
}

async function canManageAgendaItem(currentUserId: string, itemUserId: string) {
    const [currentUser, owner] = await Promise.all([
        prisma.user.findUnique({
            where: { id: currentUserId },
            select: {
                id: true,
                role: true,
                departmentId: true,
                department: { select: { isAdmin: true } }
            }
        }),
        prisma.user.findUnique({
            where: { id: itemUserId },
            select: { departmentId: true }
        })
    ])

    if (!currentUser) {
        return false
    }

    if (currentUser.role === 'ADMIN' || itemUserId === currentUser.id) {
        return true
    }

    return Boolean(
        currentUser.department?.isAdmin &&
        currentUser.departmentId &&
        owner?.departmentId === currentUser.departmentId
    )
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

        if (user.role === 'VIEWER') {
            return NextResponse.json({ error: 'No tienes permisos para editar' }, { status: 403 })
        }

        const existing = await prisma.agendaItem.findUnique({
            where: { id: params.id }
        })

        if (!existing) {
            return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 })
        }

        const hasAccess = await canManageAgendaItem(user.id, existing.userId)
        if (!hasAccess) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
        }

        const body = await request.json()
        const { project, subproject, deliverable, link, responsible, status, observations } = body
        const date = normalizeAgendaDate(body?.date)

        let eventId = existing.eventId
        const eventTitle = deliverable ? `${project} - ${deliverable}` : project
        const eventDescription = [subproject, observations].filter(Boolean).join(' | ') || undefined
        const eventStatus = agendaStatusToEventStatus(status || 'Stand by')
        const parsedDate = new Date(date)

        if (!isNaN(parsedDate.getTime())) {
            if (eventId) {
                await prisma.event.update({
                    where: { id: eventId },
                    data: {
                        title: eventTitle,
                        description: eventDescription,
                        startDate: parsedDate,
                        status: eventStatus as any,
                    }
                }).catch(() => { eventId = null })
            }

            if (!eventId) {
                const event = await prisma.event.create({
                    data: {
                        title: eventTitle,
                        description: eventDescription,
                        startDate: parsedDate,
                        allDay: true,
                        type: 'DEADLINE',
                        status: eventStatus as any,
                        color: '#f59e0b',
                        userId: existing.userId,
                    }
                })
                eventId = event.id
            }
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

        emitResourceEvent('agenda', { action: 'updated', id: item.id })
        emitResourceEvent('events', { action: 'sync-from-agenda', id: item.eventId || item.id })

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

        if (user.role === 'VIEWER') {
            return NextResponse.json({ error: 'No tienes permisos para eliminar' }, { status: 403 })
        }

        const existing = await prisma.agendaItem.findUnique({
            where: { id: params.id }
        })

        if (!existing) {
            return NextResponse.json({ error: 'Item no encontrado' }, { status: 404 })
        }

        const hasAccess = await canManageAgendaItem(user.id, existing.userId)
        if (!hasAccess) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
        }

        if (existing.eventId) {
            await prisma.event.delete({ where: { id: existing.eventId } }).catch(() => {})
        }

        await prisma.agendaItem.delete({ where: { id: params.id } })

        emitResourceEvent('agenda', { action: 'deleted', id: params.id })
        emitResourceEvent('events', { action: 'sync-from-agenda-delete', id: existing.eventId || params.id })

        return NextResponse.json({ message: 'Eliminado' })
    } catch (error) {
        console.error('Error al eliminar item:', error)
        return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
    }
}
