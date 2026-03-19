import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/dashboard/Sidebar'
import TicketDetailClient from '@/components/tickets/TicketDetailClient'

export default async function TicketDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Obtener usuario completo con su rol
  const user = await prisma.user.findUnique({
    where: { email: session.user.email || '' },
    select: { id: true, name: true, email: true, role: true, permissions: true, department: { select: { isAdmin: true } } }
  })

  if (!user) {
    redirect('/login')
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          phone: true,
          location: true,
          createdAt: true,
        }
      },
      // pinnedMessageId is a scalar field, included automatically
      category: {
        select: {
          id: true,
          name: true,
        }
      },
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      },
      messages: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
            }
          },
          replyTo: {
            select: {
              id: true,
              content: true,
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                }
              }
            }
          },
          reactions: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                }
              }
            },
            orderBy: {
              createdAt: 'asc'
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 51,
      },
      interactions: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  })

  if (!ticket) {
    notFound()
  }

  // EDITOR y VIEWER solo pueden ver sus propios tickets
  if ((user.role === 'EDITOR' || user.role === 'VIEWER') && ticket.customerId !== user.id) {
    redirect('/dashboard')
  }

  const hasMoreMessages = ticket.messages.length > 50
  // Reordenar a ascendente (tomamos hasta 50, descartamos el extra)
  const initialMessages = ticket.messages.slice(0, 50).reverse()

  // Filtrar contador según el rol
  const countWhere = (user.role === 'EDITOR' || user.role === 'VIEWER')
    ? { status: 'OPEN' as const, customerId: user.id }
    : { status: 'OPEN' as const }
  const openTicketsCount = await prisma.ticket.count({ where: countWhere })

  const isAdminDept = user.department?.isAdmin === true
  const isRequester = (user.role === 'EDITOR' || user.role === 'VIEWER') && user.id === ticket.customerId
  // Coordinator = COORDINATOR role (any dept head) OR explicit permission (for ADMIN users who also coordinate)
  const isCoordinator = user.role === 'COORDINATOR' || user.permissions.includes('tickets:coordinator')
  // Only coordinators can delete tickets
  const canDelete = user.role === 'COORDINATOR' || user.permissions.includes('tickets:coordinator')

  return (
    <div className="flex h-[100svh] bg-gray-50 dark:bg-slate-900 md:h-screen">
      <Sidebar user={user} openTicketsCount={openTicketsCount} />

      <main className="flex-1 min-w-0 min-h-0 grid grid-rows-[auto_minmax(0,1fr)] overflow-hidden">
        <TicketDetailClient
          ticket={ticket}
          messages={initialMessages}
          initialHasMoreMessages={hasMoreMessages}
          currentUserId={user.id}
          interactions={ticket.interactions}
          isRequester={isRequester}
          canDelete={canDelete}
          isCoordinator={isCoordinator}
          isAdminDept={isAdminDept}
        />
      </main>
    </div>
  )
}
