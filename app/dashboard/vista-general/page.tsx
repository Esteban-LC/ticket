import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/dashboard/Sidebar'
import MobileHeader from '@/components/dashboard/MobileHeader'
import VistaGeneralClient from '@/components/dashboard/VistaGeneralClient'

export const metadata = {
    title: 'Vista General | Tickets LICEO MICHOACANO',
    description: 'Vista general de todos los datos del sistema'
}

export default async function VistaGeneralPage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect('/login')
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email || '' },
        select: { id: true, name: true, email: true, role: true, permissions: true }
    })

    if (!user) {
        redirect('/login')
    }

    // Solo ADMIN puede acceder
    if (user.role !== 'ADMIN') {
        redirect('/dashboard')
    }

    // Obtener estadísticas generales
    const [
        openTicketsCount,
        totalUsers,
        totalTickets,
        ticketsByStatus,
        ticketsByPriority,
        recentTickets,
        allUsers,
        departments,
        recentEvents,
    ] = await Promise.all([
        prisma.ticket.count({ where: { status: 'OPEN' } }),
        prisma.user.count(),
        prisma.ticket.count(),
        prisma.ticket.groupBy({
            by: ['status'],
            _count: { status: true },
        }),
        prisma.ticket.groupBy({
            by: ['priority'],
            _count: { priority: true },
        }),
        prisma.ticket.findMany({
            take: 10,
            orderBy: { updatedAt: 'desc' },
            include: {
                customer: { select: { id: true, name: true, email: true } },
                assignee: { select: { id: true, name: true, email: true } },
                category: { select: { id: true, name: true } },
            },
        }),
        prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                department: { select: { name: true } },
                _count: {
                    select: {
                        createdTickets: true,
                        assignedTickets: true,
                        events: true,
                    }
                }
            },
            orderBy: { name: 'asc' },
        }),
        prisma.department.findMany({
            select: {
                id: true,
                name: true,
                _count: { select: { users: true } },
            },
        }),
        prisma.event.findMany({
            take: 10,
            orderBy: { startDate: 'desc' },
            include: {
                user: { select: { id: true, name: true, email: true } },
                ticket: { select: { id: true, number: true, subject: true } },
            },
        }),
    ])

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-slate-950">
            <Sidebar user={user} openTicketsCount={openTicketsCount} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <MobileHeader title="Vista General" />

                <main className="flex-1 overflow-y-auto">
                    <VistaGeneralClient
                        totalUsers={totalUsers}
                        totalTickets={totalTickets}
                        openTicketsCount={openTicketsCount}
                        ticketsByStatus={ticketsByStatus}
                        ticketsByPriority={ticketsByPriority}
                        recentTickets={JSON.parse(JSON.stringify(recentTickets))}
                        allUsers={JSON.parse(JSON.stringify(allUsers))}
                        departments={JSON.parse(JSON.stringify(departments))}
                        recentEvents={JSON.parse(JSON.stringify(recentEvents))}
                    />
                </main>
            </div>
        </div>
    )
}
