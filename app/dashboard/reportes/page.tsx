import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/dashboard/Sidebar'
import MobileHeader from '@/components/dashboard/MobileHeader'
import ReportsClient from '@/components/dashboard/ReportsClient'

export default async function ReportsPage() {
    const session = await getServerSession(authOptions)

    if (!session) {
        redirect('/login')
    }

    // Obtener usuario completo con su rol
    const user = await prisma.user.findUnique({
        where: { email: session.user.email || '' },
        select: { id: true, name: true, email: true, role: true }
    })

    if (!user) {
        redirect('/login')
    }

    // Obtener conteo de tickets abiertos para el sidebar
    const openTicketsCount = await prisma.ticket.count({
        where: user.role === 'CUSTOMER'
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
