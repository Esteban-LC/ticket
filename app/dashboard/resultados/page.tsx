import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ResultsClient from '@/components/dashboard/ResultsClient'

export const metadata = {
    title: 'Resultados Semestrales | Tickets LICEO MICHOACANO',
    description: 'Gestión de entregables y resultados semestrales'
}

export default async function ResultsPage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect('/login')
    }

    // Obtener usuario completo
    const user = await prisma.user.findUnique({
        where: { email: session.user.email || '' },
        select: { id: true, name: true, email: true, role: true, permissions: true }
    })

    if (!user) {
        redirect('/login')
    }

    // Todos los roles pueden acceder a resultados
    if (user.role !== 'ADMIN') {
        // redirect('/dashboard') // Descomentar para restringir acceso
    }

    const openTicketsCount = await prisma.ticket.count({
        where: { status: 'OPEN' }
    })

    return (
        <ResultsClient
            user={user}
            openTicketsCount={openTicketsCount}
        />
    )
}
