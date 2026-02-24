import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/dashboard/Sidebar'
import MobileHeader from '@/components/dashboard/MobileHeader'
import WordPressEnrollHub from '@/components/wordpress/WordPressEnrollHub'
import { UserPlus } from 'lucide-react'

export const metadata = {
  title: 'Enrolamiento | Tickets LICEO MICHOACANO',
  description: 'Gestionar enrolamiento por curso o por usuario en WordPress/Tutor LMS',
}

export default async function WordPressBulkEnrollPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: session.user.email || '' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      permissions: true,
    },
  })

  if (!user) redirect('/login')

  const hasPermission =
    user.role === 'ADMIN' ||
    user.permissions.includes('wordpress:access') ||
    user.permissions.includes('wordpress:manage_users') ||
    user.permissions.includes('wordpress:manage_enrollments')

  if (!hasPermission) redirect('/dashboard')

  const openTicketsCount = await prisma.ticket.count({ where: { status: 'OPEN' } })

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950">
      <Sidebar user={user} openTicketsCount={openTicketsCount} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileHeader title="Enrolamiento" />

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8">
            <div className="mb-6 lg:mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <UserPlus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                    Enrolamiento
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Elige modo de enrolamiento: por curso o por usuario.
                  </p>
                </div>
              </div>
            </div>

            <WordPressEnrollHub userRole={user.role} userPermissions={user.permissions} />
          </div>
        </main>
      </div>
    </div>
  )
}
