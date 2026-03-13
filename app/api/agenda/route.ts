import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/agenda - Listar items de agenda del usuario
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, role: true, departmentId: true }
        })

        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
        }

        // Filtrar por usuario según rol
        const where: any = {}
        if (user.role === 'ADMIN') {
            // ADMIN ve todos
        } else if (user.role === 'COORDINATOR' && user.departmentId) {
            // COORDINATOR ve items de su departamento
            where.user = { departmentId: user.departmentId }
        } else {
            // EDITOR y VIEWER solo ven los suyos
            where.userId = user.id
        }

        const items = await prisma.agendaItem.findMany({
            where,
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: { createdAt: 'asc' }
        })

        return NextResponse.json(items)
    } catch (error) {
        console.error('Error al obtener agenda:', error)
        return NextResponse.json({ error: 'Error al obtener agenda' }, { status: 500 })
    }
}

function agendaStatusToEventStatus(status: string): string {
    switch (status) {
        case 'En Proceso': return 'IN_PROGRESS'
        case 'Completado': return 'COMPLETED'
        default: return 'PENDING'
    }
}

// POST /api/agenda - Crear item de agenda
export async function POST(request: NextRequest) {
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

        // VIEWER no puede crear
        if (user.role === 'VIEWER') {
            return NextResponse.json({ error: 'No tienes permisos para crear' }, { status: 403 })
        }

        const body = await request.json()
        const { project, subproject, deliverable, link, responsible, date, status, observations } = body

        if (!project) {
            return NextResponse.json({ error: 'El proyecto es requerido' }, { status: 400 })
        }

        // Crear evento en cronograma si hay fecha válida
        let eventId: string | undefined
        if (date) {
            const parsedDate = new Date(date)
            if (!isNaN(parsedDate.getTime())) {
                const eventTitle = deliverable
                    ? `${project} - ${deliverable}`
                    : project
                const event = await prisma.event.create({
                    data: {
                        title: eventTitle,
                        description: [subproject, observations].filter(Boolean).join(' | ') || undefined,
                        startDate: parsedDate,
                        allDay: true,
                        type: 'DEADLINE',
                        status: agendaStatusToEventStatus(status || 'Stand by') as any,
                        color: '#f59e0b',
                        userId: user.id,
                    }
                })
                eventId = event.id
            }
        }

        const item = await prisma.agendaItem.create({
            data: {
                project,
                subproject: subproject || null,
                deliverable: deliverable || null,
                link: link || null,
                responsible: responsible || null,
                date: date || null,
                status: status || 'Stand by',
                observations: observations || null,
                userId: user.id,
                eventId: eventId || null,
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            }
        })

        return NextResponse.json(item, { status: 201 })
    } catch (error) {
        console.error('Error al crear item de agenda:', error)
        return NextResponse.json({ error: 'Error al crear item' }, { status: 500 })
    }
}
