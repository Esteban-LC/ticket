import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ScheduleClient from '@/components/schedule/ScheduleClient'

export default async function SchedulePage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect('/')
    }

    // Obtener usuario completo con su rol
    const user = await prisma.user.findUnique({
        where: { email: session.user.email || '' },
        select: { id: true, name: true, email: true, role: true, permissions: true }
    })

    if (!user) {
        redirect('/')
    }

    // Obtener tickets abiertos para el contador
    const openTicketsCount = await prisma.ticket.count({
        where: { status: 'OPEN' }
    })

    return (
        <ScheduleClient
            user={user}
            openTicketsCount={openTicketsCount}
        />
    )
}
