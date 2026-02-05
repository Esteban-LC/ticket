import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AgendaClient from '@/components/dashboard/AgendaClient'

export const metadata = {
    title: 'Agenda Semestral | Tickets LICEO MICHOACANO',
    description: 'Cronograma semestral de actividades'
}

export default async function AgendaPage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect('/login')
    }

    // Obtener usuario completo
    const user = await prisma.user.findUnique({
        where: { email: session.user.email || '' },
        select: { id: true, name: true, email: true, role: true }
    })

    if (!user) {
        redirect('/login')
    }

    const openTicketsCount = await prisma.ticket.count({
        where: { status: 'OPEN' }
    })

    return (
        <AgendaClient
            user={user}
            openTicketsCount={openTicketsCount}
        />
    )
}
