import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/dashboard/Sidebar'
import MobileHeader from '@/components/dashboard/MobileHeader'
import CustomersTable from '@/components/customers/CustomersTable'
import CreateCustomerButton from '@/components/customers/CreateCustomerButton'
import CustomerStats from '@/components/customers/CustomerStats'

export default async function CustomersPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Obtener el usuario con su rol
  const user = await prisma.user.findUnique({
    where: { email: session.user?.email || '' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
    }
  })

  if (!user) {
    redirect('/login')
  }

  const [customers, statsArray] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: 'CUSTOMER'
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        phone: true,
        location: true,
        address: true,
        organizationId: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
          }
        },
        _count: {
          select: {
            createdTickets: true,
          }
        },
        createdTickets: {
          select: {
            status: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }),
    prisma.$transaction([
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.ticket.count({ where: { customer: { role: 'CUSTOMER' }, status: 'OPEN' } }),
      prisma.ticket.count({ where: { customer: { role: 'CUSTOMER' } } }),
      prisma.ticket.count({ where: { status: 'OPEN' } })
    ])
  ])

  const stats = statsArray
  const openTicketsCount = statsArray[3]

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950">
      <Sidebar user={user} openTicketsCount={openTicketsCount} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileHeader title="Personal" />

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6 lg:mb-8 gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Personal</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Directorio del personal</p>
              </div>
              <CreateCustomerButton />
            </div>

            <CustomerStats
              totalCustomers={stats[0]}
              openTickets={stats[1]}
              totalTickets={stats[2]}
            />

            <CustomersTable customers={customers} />
          </div>
        </main>
      </div>
    </div>
  )
}
