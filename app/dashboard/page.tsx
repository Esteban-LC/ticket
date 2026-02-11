import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import DashboardClient from '@/components/dashboard/DashboardClient'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  // Obtener usuario completo con su rol
  const user = await prisma.user.findUnique({
    where: { email: session?.user?.email || '' },
    select: { id: true, name: true, email: true, role: true, permissions: true }
  })

  // Filtrar tickets según el rol
  const ticketWhere = user?.role !== 'ADMIN' && user?.role !== 'COORDINATOR'
    ? { status: 'OPEN' as const, customerId: user!.id }
    : { status: 'OPEN' as const }

  const tickets = await prisma.ticket.findMany({
    where: ticketWhere,
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        }
      },
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      },
      _count: {
        select: {
          messages: true
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    },
    take: 3
  })

  // Filtrar estadísticas según el rol
  const statsWhere = user?.role !== 'ADMIN' && user?.role !== 'COORDINATOR' ? { customerId: user!.id } : {}

  const stats = await prisma.$transaction([
    prisma.ticket.count({ where: { ...statsWhere, status: 'OPEN' } }),
    prisma.ticket.count({ where: { ...statsWhere, status: 'PENDING' } }),
    prisma.ticket.count({ where: { ...statsWhere, status: 'SOLVED' } }),
    prisma.ticket.count({ where: statsWhere }),
  ])

  if (!user) {
    return null
  }

  return (
    <DashboardClient
      user={user}
      tickets={tickets}
      stats={{
        open: stats[0],
        pending: stats[1],
        solved: stats[2],
        total: stats[3],
      }}
      currentUserId={session?.user?.id}
    />
  )
}
