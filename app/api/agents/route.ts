import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Returns users eligible to be assigned tickets (from sistemas/admin departments)
// Accessible to ADMIN and COORDINATOR roles
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const caller = await prisma.user.findFirst({
      where: { email: session.user.email || '', deletedAt: null },
      select: { role: true }
    })

    if (!caller || (caller.role !== 'ADMIN' && caller.role !== 'COORDINATOR')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const agents = await prisma.user.findMany({
      where: {
        deletedAt: null,
        department: { isAdmin: true },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(agents)
  } catch (error) {
    console.error('Error fetching agents:', error)
    return NextResponse.json({ error: 'Error al obtener agentes' }, { status: 500 })
  }
}
