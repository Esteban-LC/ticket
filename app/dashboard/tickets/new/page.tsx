import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/dashboard/Sidebar'
import MobileHeader from '@/components/dashboard/MobileHeader'
import CreateTicketForm from '@/components/tickets/CreateTicketForm'

export default async function NewTicketPage() {
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

  // Filtrar contador según el rol
  const countWhere = user.role === 'CUSTOMER'
    ? { status: 'OPEN' as const, customerId: user.id }
    : { status: 'OPEN' as const }
  const openTicketsCount = await prisma.ticket.count({ where: countWhere })

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950">
      <Sidebar user={user} openTicketsCount={openTicketsCount} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileHeader title="Nuevo Ticket" />

        <main className="flex-1 overflow-y-auto">
          <CreateTicketForm currentUser={{ id: user.id, role: user.role }} />
        </main>
      </div>
    </div>
  )
}
