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

    // Mock Data para Reportes
    const reports = [
        {
            id: 1,
            name: 'Reporte Mensual - Enero 2026',
            date: '2026-02-01',
            type: 'PDF' as const,
            status: 'Disponible',
            size: '2.4 MB',
            description: 'Informe completo de actividades de Enero.'
        },
        {
            id: 2,
            name: 'Métricas de Rendimiento Q4 2025',
            date: '2026-01-15',
            type: 'XLSX' as const,
            status: 'Archivado',
            size: '1.8 MB',
            description: 'Hoja de cálculo con métricas detalladas.'
        },
        {
            id: 3,
            name: 'Dashboard Externo de Infraestructura',
            date: 'Actualizado hoy',
            type: 'LINK' as const,
            status: 'Activo',
            size: '-',
            url: 'https://grafana.com/', // Example link
            description: 'Enlace al dashboard de monitoreo en tiempo real.'
        },
        {
            id: 4,
            name: 'Auditoría de Seguridad 2025',
            date: '2025-12-20',
            type: 'PDF' as const,
            status: 'Confidencial',
            size: '5.1 MB',
            description: 'Resultados de la auditoría anual.'
        },
        {
            id: 5,
            name: 'Inventario de Hardware',
            date: '2026-02-04',
            type: 'CSV' as const,
            status: 'Borrador',
            size: '450 KB',
            description: 'Inventario preliminar de equipos.'
        }
    ]

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-slate-950">
            <Sidebar user={user} openTicketsCount={openTicketsCount} />

            <div className="flex-1 flex flex-col overflow-hidden">
                <MobileHeader title="Reportes" />

                <main className="flex-1 overflow-y-auto">
                    <ReportsClient initialReports={reports} />
                </main>
            </div>
        </div>
    )
}
