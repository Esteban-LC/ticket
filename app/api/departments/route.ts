import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const departments = await prisma.department.findMany({
            select: {
                id: true,
                name: true,
                isAdmin: true,
                description: true,
            },
            orderBy: {
                name: 'asc'
            }
        })

        return NextResponse.json(departments)
    } catch (error) {
        console.error('Error fetching departments:', error)
        return NextResponse.json(
            { error: 'Error al obtener departamentos' },
            { status: 500 }
        )
    }
}
