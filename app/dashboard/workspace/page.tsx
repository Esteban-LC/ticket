import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/dashboard/Sidebar'
import MobileHeader from '@/components/dashboard/MobileHeader'
import dynamic from 'next/dynamic'
import { TableSkeleton } from '@/components/ui/Loading'

const WorkspaceClient = dynamic(() => import('@/components/workspace/WorkspaceClient'), {
    ssr: false,
    loading: () => (
        <div className="space-y-6">
            <div className="animate-pulse">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 mb-8"></div>
            </div>
            <TableSkeleton />
        </div>
    )
})

export default async function WorkspacePage() {
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

  if (user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const openTicketsCount = await prisma.ticket.count({ where: { status: 'OPEN' } })

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950">
      <Sidebar user={user} openTicketsCount={openTicketsCount} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileHeader title="Google Workspace" />

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8">
            <WorkspaceClient />
          </div>
        </main>
      </div>
    </div>
  )
}
