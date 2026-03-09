import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { Wallet } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/dashboard/Sidebar'
import MobileHeader from '@/components/dashboard/MobileHeader'
import WordPressTuitionClient from '@/components/wordpress/WordPressTuitionClient'
import { canManageTuitionStatus } from '@/lib/permissions'

export const metadata = {
  title: 'Cobranza | Tickets LICEO MICHOACANO',
  description: 'Control de adeudores y bajas por pagos',
}

export default async function CobranzaPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      permissions: true,
    },
  })

  if (!user) {
    redirect('/login')
  }

  if (!canManageTuitionStatus(user)) {
    redirect('/dashboard')
  }

  const openTicketsCount = await prisma.ticket.count({ where: { status: 'OPEN' } })

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950">
      <Sidebar user={user} openTicketsCount={openTicketsCount} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <MobileHeader title="Cobranza" />

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8">
            <div className="mb-6 lg:mb-8">
              <div className="mb-2 flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
                  <Wallet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white lg:text-3xl">
                    Cobranza
                  </h1>
                  <p className="mt-1 text-gray-600 dark:text-gray-400">
                    Seguimiento independiente de registros de cobranza.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Esta vista separa el seguimiento de cobranza de Usuarios WP. Contabilidad registra casos y aqui se consultan pendientes y completados.
              </p>
            </div>

            <WordPressTuitionClient userRole={user.role} />
          </div>
        </main>
      </div>
    </div>
  )
}
