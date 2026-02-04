'use client'

import Sidebar from '@/components/dashboard/Sidebar'
import MobileHeader from '@/components/dashboard/MobileHeader'
import FloatingActionButton from '@/components/dashboard/FloatingActionButton'
import TicketList from '@/components/dashboard/TicketList'
import StatsCards from '@/components/dashboard/StatsCards'

interface DashboardClientProps {
    user: {
        id: string
        name: string | null
        email: string
        role: string
    }
    tickets: any[]
    stats: {
        open: number
        pending: number
        solved: number
        total: number
    }
    currentUserId?: string
}

export default function DashboardClient({ user, tickets, stats, currentUserId }: DashboardClientProps) {
    return (
        <>
            <div className="flex h-screen bg-gray-50 dark:bg-slate-950">
                <Sidebar user={user} openTicketsCount={stats.open} />

                <div className="flex-1 flex flex-col overflow-hidden">
                    <MobileHeader title="Dashboard" />

                    <main className="flex-1 overflow-y-auto">
                        <div className="p-4 lg:p-8">
                            <div className="mb-6 lg:mb-8 hidden lg:block">
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">Gestiona tus tickets y conversaciones</p>
                            </div>

                            <StatsCards stats={stats} />
                            <TicketList tickets={tickets} currentUserId={currentUserId} />
                        </div>
                    </main>
                </div>
            </div>

            <FloatingActionButton />
        </>
    )
}
