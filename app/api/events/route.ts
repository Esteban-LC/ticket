import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema de validación para eventos
const eventSchema = z.object({
    title: z.string().min(1, 'El título es requerido'),
    description: z.string().optional(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional(),
    allDay: z.boolean().default(false),
    color: z.string().optional(),
    type: z.enum(['TASK', 'MEETING', 'DEADLINE', 'REMINDER', 'MAINTENANCE']).default('TASK'),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('PENDING'),
    ticketId: z.string().optional(),
})

// GET /api/events - Listar eventos
export async function GET(request: NextRequest) {
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

        // Obtener parámetros de búsqueda
        const { searchParams } = new URL(request.url)
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const type = searchParams.get('type')
        const status = searchParams.get('status')

        // Construir filtros
        const where: any = {}

        // Si no es admin, solo ver sus propios eventos
        if (user.role !== 'ADMIN') {
            where.userId = user.id
        }

        if (startDate) {
            where.startDate = { gte: new Date(startDate) }
        }

        if (endDate) {
            where.startDate = { ...where.startDate, lte: new Date(endDate) }
        }

        if (type) {
            where.type = type
        }

        if (status) {
            where.status = status
        }

        const events = await prisma.event.findMany({
            where,
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
            },
            orderBy: {
                startDate: 'asc'
            }
        })

        return NextResponse.json(events)
    } catch (error) {
        console.error('Error al obtener eventos:', error)
        return NextResponse.json(
            { error: 'Error al obtener eventos' },
            { status: 500 }
        )
    }
}

// POST /api/events - Crear evento
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true }
        })

        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
        }

        const body = await request.json()
        const validatedData = eventSchema.parse(body)

        // Verificar que el ticket existe si se proporciona
        if (validatedData.ticketId) {
            const ticket = await prisma.ticket.findUnique({
                where: { id: validatedData.ticketId }
            })
            if (!ticket) {
                return NextResponse.json(
                    { error: 'Ticket no encontrado' },
                    { status: 404 }
                )
            }
        }

        const event = await prisma.event.create({
            data: {
                ...validatedData,
                startDate: new Date(validatedData.startDate),
                endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
                userId: user.id,
            },
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

        return NextResponse.json(event, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Datos inválidos', details: error.errors },
                { status: 400 }
            )
        }
        console.error('Error al crear evento:', error)
        return NextResponse.json(
            { error: 'Error al crear evento' },
            { status: 500 }
        )
    }
}
