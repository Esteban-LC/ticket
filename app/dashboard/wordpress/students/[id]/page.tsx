import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import WordPressUserProfile from '@/components/wordpress/WordPressUserProfile'
import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/dashboard/Sidebar'
import MobileHeader from '@/components/dashboard/MobileHeader'

export default async function WordPressUserPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email || '' },
    select: { id: true, name: true, email: true, role: true, permissions: true }
  })

  if (!currentUser) redirect('/login')

  const hasPermission =
    currentUser.role === 'ADMIN' ||
    currentUser.permissions.includes('wordpress:access') ||
    currentUser.permissions.includes('wordpress:manage_users')

  if (!hasPermission) redirect('/dashboard')

  const openTicketsCount = await prisma.ticket.count({ where: { status: 'OPEN' } })

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950">
      <Sidebar user={currentUser} openTicketsCount={openTicketsCount} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileHeader title="Perfil de Usuario" />

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8">
            <WordPressUserProfile
              userId={parseInt(params.id)}
              userRole={currentUser.role}
              userPermissions={currentUser.permissions}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
