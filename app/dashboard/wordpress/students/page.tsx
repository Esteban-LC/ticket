import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/dashboard/Sidebar'
import MobileHeader from '@/components/dashboard/MobileHeader'
import WordPressStudentsClient from '@/components/wordpress/WordPressStudentsClient'
import { UserPlus, Users } from 'lucide-react'

export const metadata = {
  title: 'Usuarios WordPress | Tickets LICEO MICHOACANO',
  description: 'Gestión de usuarios de WordPress y Tutor LMS'
}

export default async function WordPressStudentsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  // Obtener usuario completo con su rol y permisos
  const user = await prisma.user.findUnique({
    where: { email: session.user.email || '' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      permissions: true,
    }
  })

  if (!user) {
    redirect('/login')
  }

  // Verificar permisos de acceso a WordPress
  const hasPermission =
    user.role === 'ADMIN' ||
    user.permissions.includes('wordpress:access') ||
    user.permissions.includes('wordpress:manage_users')

  if (!hasPermission) {
    redirect('/dashboard')
  }

  // Solo ADMIN ve todos los tickets
  const openTicketsCount = await prisma.ticket.count({ where: { status: 'OPEN' } })

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950">
      <Sidebar user={user} openTicketsCount={openTicketsCount} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileHeader title="Usuarios WordPress" />

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8">
            {/* Header */}
            <div className="mb-6 lg:mb-8">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                    Usuarios WordPress
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Gestiona usuarios de WordPress y Tutor LMS
                  </p>
                </div>
                </div>
                <Link
                  href="/dashboard/wordpress/enroll"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <UserPlus className="h-4 w-4" />
                  Enrolamiento
                </Link>
              </div>
            </div>

            {/* Información */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-1">
                    Gestión de Usuarios
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Desde aquí puedes crear, editar, habilitar/deshabilitar usuarios de WordPress,
                    así como enrolarlos en cursos de Tutor LMS y gestionar sus pedidos de WooCommerce.
                  </p>
                </div>
              </div>
            </div>

            {/* Componente cliente con la tabla y funcionalidades */}
            <WordPressStudentsClient userRole={user.role} userPermissions={user.permissions} />
          </div>
        </main>
      </div>
    </div>
  )
}
