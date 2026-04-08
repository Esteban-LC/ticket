import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { emitResourceEvent } from '@/lib/resourceEvents'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/resultados - Listar resultados del usuario
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

        const where = user.role === 'ADMIN' ? {} : { userId: user.id }

        const items = await prisma.resultItem.findMany({
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
        console.error('Error al obtener resultados:', error)
        return NextResponse.json({ error: 'Error al obtener resultados' }, { status: 500 })
    }
}

// POST /api/resultados - Crear resultado
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

        if (user.role === 'VIEWER') {
            return NextResponse.json({ error: 'No tienes permisos para crear' }, { status: 403 })
        }

        const body = await request.json()
        const { product, project, description, status, observations } = body

        if (!project) {
            return NextResponse.json({ error: 'El proyecto es requerido' }, { status: 400 })
        }

        const item = await prisma.resultItem.create({
            data: {
                product: product || null,
                project,
                description: description || null,
                status: status || 'En proceso',
                observations: observations || null,
                userId: user.id,
            },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            }
        })

        emitResourceEvent('results', { action: 'created', id: item.id })

        return NextResponse.json(item, { status: 201 })
    } catch (error) {
        console.error('Error al crear resultado:', error)
        return NextResponse.json({ error: 'Error al crear resultado' }, { status: 500 })
    }
}
