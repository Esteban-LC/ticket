import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/dashboard/Sidebar'
import MobileHeader from '@/components/dashboard/MobileHeader'
import dynamic from 'next/dynamic'
import { CardSkeleton } from '@/components/ui/Loading'

const ReportsClient = dynamic(() => import('@/components/dashboard/ReportsClient'), {
    ssr: false,
    loading: () => (
        <div className="p-4 lg:p-8 space-y-6">
            <div className="animate-pulse">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-8"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                    <CardSkeleton key={i} />
                ))}
            </div>
        </div>
    )
})

export default async function ReportsPage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect('/login')
    }

    // Obtener usuario completo con su rol
    const user = await prisma.user.findUnique({
        where: { email: session.user.email || '' },
        select: { id: true, name: true, email: true, role: true, permissions: true }
    })

    if (!user) {
        redirect('/login')
    }

    // Obtener conteo de tickets abiertos para el sidebar
    const openTicketsCount = await prisma.ticket.count({
        where: (user.role === 'EDITOR' || user.role === 'VIEWER')
            ? { status: 'OPEN', customerId: user.id }
            : { status: 'OPEN' }
    })

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-slate-950">
            <Sidebar user={user} openTicketsCount={openTicketsCount} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <MobileHeader title="Reportes" />

                <main className="flex-1 overflow-y-auto">
                    <ReportsClient canViewDepartments={user.permissions.includes('VIEW_DEPARTMENT_REPORTS')} />
                </main>
            </div>
        </div>
    )
}
